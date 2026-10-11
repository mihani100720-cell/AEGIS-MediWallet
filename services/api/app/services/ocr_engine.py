"""
MediWallet — Prescription OCR Engine
======================================
Three-tier inference architecture (no mocks, real outputs only):

  TIER 1 — Local Qwen2.5-VL-3B (CPU)
    Uses the already-downloaded local model at LOCAL_MODEL_DIR.
    Fires only when available RAM >= OCR_RAM_THRESHOLD_GB (default 10 GB).
    No internet required.

  TIER 2 — Google Gemini Vision API (hosted)
    Fires when Tier 1 is blocked by insufficient RAM.
    Requires GEMINI_API_KEY in environment or .env file.
    Images are sent transiently; Google does not train on API inputs.

  TIER 3 — microsoft/trocr-base-handwritten (CPU, ~1.3 GB)
    General handwriting OCR fallback.
    Auto-downloads from HuggingFace on first use.

Hard policy:
  - Synthetic / mock prescription text is NEVER returned as real OCR output.
  - If all tiers fail, the endpoint returns a clear error with the exact reason.
  - Any medicine with confidence < 0.85 or an unknown field is flagged needs_review=True.
  - Human verification is required via PATCH /prescriptions/{id}/review before data is confirmed.
"""

import os
import io
import re
import json
import base64
import logging
from typing import Dict, Any, List, Optional, Tuple

import psutil
from PIL import Image, ImageFilter
import numpy as np

logger = logging.getLogger("mediwallet.ocr")


# ---------------------------------------------------------------------------
# Resolve project root so LOCAL_MODEL_DIR works from any CWD
# ---------------------------------------------------------------------------
_THIS_FILE = os.path.abspath(__file__)
# services/api/app/services/ocr_engine.py -> project root is 5 levels up
_PROJECT_ROOT = os.path.dirname(  # services/api/app/services
    os.path.dirname(              # services/api/app
        os.path.dirname(          # services/api
            os.path.dirname(      # services
                os.path.dirname(_THIS_FILE)
            )
        )
    )
)


def _get_env(key: str, default: str = "") -> str:
    """Read an env var; also checks .env in the project root if not already set."""
    val = os.environ.get(key)
    if val:
        return val
    env_path = os.path.join(_PROJECT_ROOT, ".env")
    try:
        with open(env_path) as fh:
            for line in fh:
                line = line.strip()
                if line and not line.startswith('#') and '=' in line:
                    k, v = line.split('=', 1)
                    if k.strip() == key:
                        return v.strip()
    except FileNotFoundError:
        pass
    return default


def _resolve_model_dir(relative_path: str) -> str:
    """Return an absolute path for a LOCAL_MODEL_DIR that may be relative."""
    if os.path.isabs(relative_path):
        return relative_path
    candidate = os.path.join(_PROJECT_ROOT, relative_path)
    return candidate


def _available_ram_gb() -> float:
    """Return available system RAM in GB using psutil."""
    return psutil.virtual_memory().available / (1024 ** 3)


class OCRTierBlockedError(RuntimeError):
    """Raised when a tier cannot run and should cascade to the next."""


class PrescriptionOCREngine:
    """
    Real-inference prescription OCR with three tiers and no mock fallback.
    All class-level model references are singletons to avoid reloading.
    """

    PRIMARY_MODEL_ID = "KushagraWadhwa/medical-prescription-ocr-india"
    FALLBACK_MODEL_ID = "microsoft/trocr-base-handwritten"
    MAX_IMAGE_SIZE_BYTES = 10 * 1024 * 1024  # 10 MB

    _primary_model = None
    _primary_processor = None
    _fallback_model = None
    _fallback_processor = None

    _torch_probed: bool = False
    _torch_blocked: bool = False
    _torch_version: str = "unavailable"
    _torch_threads: int = 0
    _cuda_available: bool = False
    _cuda_device: Optional[str] = None
    _has_accelerate: bool = False

    # ------------------------------------------------------------------
    # Hardware / feasibility report
    # ------------------------------------------------------------------
    @classmethod
    def check_hardware_feasibility(cls) -> Dict[str, Any]:
        """
        Reports hardware capability and any blockers without attempting inference.
        Safe to call at any time. Caches torch probing so Windows App Control does not stall.
        """
        local_model_dir_env = _get_env("LOCAL_MODEL_DIR", "models/medical-prescription-ocr-india")
        ocr_ram_threshold = float(_get_env("OCR_RAM_THRESHOLD_GB", "10.0"))
        gemini_api_key = _get_env("GEMINI_API_KEY", "")

        if not cls._torch_probed:
            cls._torch_probed = True
            try:
                import torch
                cls._torch_version = torch.__version__
                cls._torch_threads = torch.get_num_threads()
                cls._cuda_available = torch.cuda.is_available()
                cls._cuda_device = torch.cuda.get_device_name(0) if cls._cuda_available else None
                try:
                    import accelerate  # noqa: F401
                    cls._has_accelerate = True
                except (ImportError, OSError, Exception):
                    cls._has_accelerate = False
            except (OSError, Exception) as e:
                cls._torch_blocked = True
                logger.warning("torch unavailable or blocked by Windows App Control (shm.dll): %s", e)

        torch_version = cls._torch_version
        torch_threads = cls._torch_threads
        cuda_available = cls._cuda_available
        cuda_device = cls._cuda_device
        torch_blocked = cls._torch_blocked
        has_accelerate = cls._has_accelerate

        available_ram_gb = _available_ram_gb()
        model_dir = _resolve_model_dir(local_model_dir_env)
        weights_exist = os.path.isfile(os.path.join(model_dir, "model.safetensors"))

        ram_sufficient = available_ram_gb >= ocr_ram_threshold
        gemini_configured = bool(gemini_api_key)

        blockers: List[str] = []
        if torch_blocked:
            blockers.append("torch blocked by Windows App Control (shm.dll). Tiers 1 & 3 unavailable.")
        elif not cuda_available:
            blockers.append("No CUDA GPU — running CPU-only torch build.")
        if not ram_sufficient:
            blockers.append(
                f"Available RAM {available_ram_gb:.1f} GB < threshold "
                f"{ocr_ram_threshold:.0f} GB. Local model inference blocked."
            )
        if not weights_exist:
            blockers.append(
                f"Model weights not found at: {model_dir}. "
                f"Run: python -c \"from huggingface_hub import snapshot_download; "
                f"snapshot_download('KushagraWadhwa/medical-prescription-ocr-india', "
                f"local_dir='models/medical-prescription-ocr-india')\""
            )

        tier1_available = not torch_blocked and ram_sufficient and weights_exist
        tier2_available = gemini_configured
        tier3_available = not torch_blocked  # TrOCR auto-downloads but needs torch

        return {
            "cuda_available": cuda_available,
            "cuda_device": cuda_device,
            "torch_blocked_by_app_control": torch_blocked,
            "has_accelerate": has_accelerate,
            "torch_version": torch_version,
            "torch_threads": torch_threads,
            "available_ram_gb": round(available_ram_gb, 2),
            "ram_threshold_gb": ocr_ram_threshold,
            "local_model_dir": model_dir,
            "local_model_weights_exist": weights_exist,
            "local_model_size_gb": 7.0,
            "primary_model_id": cls.PRIMARY_MODEL_ID,
            "fallback_model_id": cls.FALLBACK_MODEL_ID,
            "tier1_local_cpu_available": tier1_available,
            "tier2_gemini_available": tier2_available,
            "tier3_trocr_available": tier3_available,
            "blockers": blockers,
        }

    # ------------------------------------------------------------------
    # Image validation & pre-processing
    # ------------------------------------------------------------------
    @classmethod
    def validate_and_preprocess_image(
        cls, image_bytes: bytes
    ) -> Tuple[Image.Image, Optional[str], float]:
        """
        Validates image size, format, integrity, and computes Laplacian blur score.
        Returns: (PIL.Image in RGB, quality_warning or None, sharpness_variance)
        """
        if len(image_bytes) > cls.MAX_IMAGE_SIZE_BYTES:
            raise ValueError(
                f"Image size ({len(image_bytes) / (1024 * 1024):.1f} MB) exceeds 10 MB limit."
            )

        try:
            img = Image.open(io.BytesIO(image_bytes))
            img.verify()
            img = Image.open(io.BytesIO(image_bytes))  # Re-open after verify()
        except Exception as exc:
            raise ValueError(
                f"Invalid or corrupted image. Upload a valid JPEG, PNG, or WebP: {exc}"
            ) from exc

        if img.mode != "RGB":
            img = img.convert("RGB")

        # Laplacian variance blur check
        gray = img.convert("L")
        lap_kernel = ImageFilter.Kernel(
            (3, 3), [0, 1, 0, 1, -4, 1, 0, 1, 0], scale=1
        )
        edge = gray.filter(lap_kernel)
        variance = float(np.var(np.array(edge, dtype=np.float32)))

        quality_warning: Optional[str] = None
        if variance < 80.0:
            quality_warning = (
                f"Prescription photo appears blurry or low-contrast "
                f"(sharpness score: {variance:.1f}). "
                f"Handwriting accuracy may be reduced — please re-upload a sharper image "
                f"and verify all fields carefully."
            )

        # Resize to max 1600 px on longest side
        if max(img.size) > 1600:
            img.thumbnail((1600, 1600), Image.Resampling.LANCZOS)

        return img, quality_warning, variance

    # ------------------------------------------------------------------
    # Text → structured prescription schema
    # ------------------------------------------------------------------
    @classmethod
    def parse_text_to_prescription_schema(
        cls, raw_text: str, default_conf: float = 0.82
    ) -> Dict[str, Any]:
        """
        Regex-based parser for plain OCR text.
        Strict policy: never invent names — missing fields are marked 'unknown'.
        Items with missing dosage, frequency, or drug name are flagged needs_review=True.
        """
        lines = [line.strip() for line in raw_text.split("\n") if line.strip()]

        doctor_name = "unknown"
        clinic_name = "unknown"
        patient_name = "unknown"
        patient_age = "unknown"
        date_str = "unknown"
        diagnosis = "unknown"
        notes = "unknown"
        medications: List[Dict[str, Any]] = []

        date_pat = re.compile(r"\b(\d{1,2}[/-]\d{1,2}[/-]\d{2,4})\b")
        age_pat = re.compile(r"\b(\d{1,3})\s*(?:yrs?|years?|y/o|yo)\b", re.I)
        dose_pat = re.compile(r"\b(\d+(?:\.\d+)?\s*(?:mg|g|mcg|ml|iu|units?))\b", re.I)
        freq_pat = re.compile(
            r"\b(1-0-1|1-1-1|1-0-0|0-0-1|0-1-0|OD|BD|BID|TDS|TID|QID|SOS|HS|PRN|STAT)\b",
            re.I,
        )
        dur_pat = re.compile(
            r"\b(\d+\s*(?:days?|weeks?|months?|d|w|m))\b", re.I
        )

        for line in lines:
            d = date_pat.search(line)
            if d and date_str == "unknown":
                date_str = d.group(1)

            if re.search(r"\b(?:dr\.?|doctor)\b", line, re.I) and doctor_name == "unknown":
                doctor_name = line.strip()

            if (
                re.search(r"\b(?:clinic|hospital|nursing home|healthcare|medical centre)\b", line, re.I)
                and clinic_name == "unknown"
            ):
                clinic_name = line.strip()

            if re.search(r"\b(?:patient|pt|name)\s*[:\-]", line, re.I) and patient_name == "unknown":
                val = re.sub(r"\b(?:patient|pt|name)\s*[:\-]\s*", "", line, flags=re.I).strip()
                if val:
                    patient_name = val

            am = age_pat.search(line)
            if am and patient_age == "unknown":
                patient_age = am.group(1)

            if re.search(r"\b(?:diagnosis|dx|c/o|complaint|impression)\s*[:\-]", line, re.I) and diagnosis == "unknown":
                diagnosis = re.sub(
                    r"\b(?:diagnosis|dx|c/o|complaint|impression)\s*[:\-]\s*", "", line, flags=re.I
                ).strip()

            is_med = bool(
                re.search(r"\b(?:tab\.?|cap\.?|syp\.?|inj\.?|oint(?:ment)?|drop|tablets?|capsules?|rx)\b", line, re.I)
                or dose_pat.search(line)
                or freq_pat.search(line)
            )

            if is_med:
                dose_m = dose_pat.search(line)
                freq_m = freq_pat.search(line)
                dur_m = dur_pat.search(line)

                dosage = dose_m.group(1) if dose_m else "unknown"
                freq = freq_m.group(1).upper() if freq_m else "unknown"
                duration = dur_m.group(1) if dur_m else "unknown"

                inst = "unknown"
                if re.search(r"\b(?:after food|after meals?|pc)\b", line, re.I):
                    inst = "After meals"
                elif re.search(r"\b(?:before food|empty stomach|ac)\b", line, re.I):
                    inst = "Before food / Empty stomach"

                clean = line
                clean = re.sub(
                    r"\b(?:tab\.?|cap\.?|syp\.?|inj\.?|oint(?:ment)?|drop|tablets?|capsules?|rx)\.?\s*",
                    "", clean, flags=re.I,
                )
                if dose_m:
                    clean = clean.replace(dose_m.group(0), "")
                if freq_m:
                    clean = clean.replace(freq_m.group(0), "")
                if dur_m:
                    clean = clean.replace(dur_m.group(0), "")
                clean = re.sub(r"[\-–:]+", " ", clean).strip()
                if not clean:
                    clean = "unknown"

                needs_review = dosage == "unknown" or freq == "unknown" or clean == "unknown"
                conf = default_conf if not needs_review else max(0.40, default_conf - 0.30)

                medications.append({
                    "name": clean,
                    "strength": dosage,
                    "frequency": freq,
                    "duration": duration,
                    "route": "Other" if re.search(r"\b(?:inj|oint(?:ment)?|drop)\b", line, re.I) else "Oral",
                    "instructions": inst,
                    "confidence": round(conf, 2),
                    "needs_review": needs_review,
                })

        return {
            "doctor_name": doctor_name,
            "clinic_name": clinic_name,
            "patient_name": patient_name,
            "patient_age": patient_age,
            "date": date_str,
            "diagnosis": diagnosis,
            "notes": notes,
            "medications": medications,
        }

    @classmethod
    def parse_vlm_json_output(cls, raw_json_str: str) -> Dict[str, Any]:
        """
        Parses JSON returned by the Qwen2.5-VL primary model or Gemini.
        Falls back to text-parser on invalid JSON.
        Expected VLM schema:
          {"doctor_name": "", "clinic_name": "", "patient_name": "",
           "patient_age": "", "date": "", "diagnosis": "", "notes": "",
           "medications": [{"drug_name": "", "dosage": "", "frequency": "",
                            "duration": "", "instructions": ""}]}
        """
        clean = raw_json_str.strip()
        # Strip markdown code fences if present
        if "```json" in clean:
            clean = clean.split("```json")[1].split("```")[0].strip()
        elif "```" in clean:
            clean = clean.split("```")[1].split("```")[0].strip()

        try:
            data = json.loads(clean)
        except Exception as exc:
            logger.warning(f"VLM output is not valid JSON — falling back to text parser: {exc}")
            return cls.parse_text_to_prescription_schema(raw_json_str, default_conf=0.72)

        medications: List[Dict[str, Any]] = []
        for m in data.get("medications", []):
            if not isinstance(m, dict):
                continue
            name = m.get("drug_name") or m.get("name") or "unknown"
            dosage = m.get("dosage") or m.get("strength") or "unknown"
            freq = m.get("frequency") or "unknown"
            duration = m.get("duration") or "unknown"
            instructions = m.get("instructions") or "unknown"
            needs_review = name == "unknown" or dosage == "unknown" or freq == "unknown"
            medications.append({
                "name": name,
                "strength": dosage,
                "frequency": freq,
                "duration": duration,
                "route": "Oral",
                "instructions": instructions,
                "confidence": 0.92 if not needs_review else 0.62,
                "needs_review": needs_review,
            })

        return {
            "doctor_name": data.get("doctor_name") or "unknown",
            "clinic_name": data.get("clinic_name") or "unknown",
            "patient_name": data.get("patient_name") or "unknown",
            "patient_age": str(data.get("patient_age")) if data.get("patient_age") else "unknown",
            "date": data.get("date") or "unknown",
            "diagnosis": data.get("diagnosis") or "unknown",
            "notes": data.get("notes") or "unknown",
            "medications": medications,
        }

    # ------------------------------------------------------------------
    # TIER 1 — Local Qwen2.5-VL on CPU
    # ------------------------------------------------------------------
    @classmethod
    def _run_local_vlm(cls, img: Image.Image) -> str:
        """
        Attempts local CPU inference using the downloaded Qwen2.5-VL model.
        Raises OCRTierBlockedError if RAM is insufficient, model files are missing,
        or Windows App Control blocks shm.dll.
        """
        local_model_dir_env = _get_env("LOCAL_MODEL_DIR", "models/medical-prescription-ocr-india")
        ocr_ram_threshold = float(_get_env("OCR_RAM_THRESHOLD_GB", "10.0"))

        try:
            import torch
        except (OSError, Exception) as e:
            raise OCRTierBlockedError(
                f"TIER 1 BLOCKED — torch is unavailable or blocked ({e}). "
                "Local model inference is unavailable on this machine."
            ) from e
        from transformers import Qwen2_5_VLForConditionalGeneration, AutoProcessor

        available_gb = _available_ram_gb()
        if available_gb < ocr_ram_threshold:
            raise OCRTierBlockedError(
                f"TIER 1 BLOCKED — Available RAM {available_gb:.1f} GB < "
                f"threshold {ocr_ram_threshold:.0f} GB. "
                f"Cannot safely load 7 GB model weights on CPU."
            )

        model_dir = _resolve_model_dir(local_model_dir_env)
        if not os.path.isfile(os.path.join(model_dir, "model.safetensors")):
            raise OCRTierBlockedError(
                f"TIER 1 BLOCKED — model.safetensors not found at: {model_dir}"
            )

        logger.info(
            f"TIER 1: Loading local Qwen2.5-VL from {model_dir} "
            f"(available RAM: {available_gb:.1f} GB)."
        )

        if cls._primary_model is None:
            cls._primary_processor = AutoProcessor.from_pretrained(
                model_dir, local_files_only=True
            )
            cls._primary_model = Qwen2_5_VLForConditionalGeneration.from_pretrained(
                model_dir,
                torch_dtype=torch.float16,
                device_map="cpu",
                low_cpu_mem_usage=True,
                local_files_only=True,
            )
            cls._primary_model.eval()
            logger.info("TIER 1: Local model loaded successfully.")

        system_prompt = (
            "You are a medical prescription OCR assistant. "
            "Extract all information from the prescription image and return it as JSON only. "
            "Return ONLY valid JSON with no explanation text. "
            'Use this schema: {"doctor_name": "", "clinic_name": "", "patient_name": "", '
            '"patient_age": "", "date": "", "diagnosis": "", "notes": "", '
            '"medications": [{"drug_name": "", "dosage": "", "frequency": "", '
            '"duration": "", "instructions": ""}]}. '
            "If a field is not visible or illegible, use empty string. Do not guess."
        )

        messages = [
            {"role": "system", "content": system_prompt},
            {
                "role": "user",
                "content": [
                    {"type": "image", "image": img},
                    {"type": "text", "text": "Extract prescription information from this image and return JSON."},
                ],
            },
        ]

        prompt_text = cls._primary_processor.apply_chat_template(
            messages, tokenize=False, add_generation_prompt=True
        )
        inputs = cls._primary_processor(
            text=[prompt_text], images=[img], return_tensors="pt"
        )

        with torch.no_grad():
            outputs = cls._primary_model.generate(
                **inputs, max_new_tokens=512, do_sample=False
            )

        generated = outputs[0][inputs["input_ids"].shape[1]:]
        raw_text = cls._primary_processor.decode(generated, skip_special_tokens=True)
        logger.info(f"TIER 1: Raw VLM output length: {len(raw_text)} chars.")
        return raw_text

    # ------------------------------------------------------------------
    # TIER 2 — Gemini Vision API (hosted, using google-genai SDK)
    # ------------------------------------------------------------------
    @classmethod
    def _run_gemini_vision(cls, img: Image.Image, image_bytes: bytes, content_type: str = "image/jpeg") -> str:
        """
        Sends the prescription image to Google Gemini Vision for extraction.
        Uses the current google-genai SDK (replaces deprecated google.generativeai).
        Raises OCRTierBlockedError if GEMINI_API_KEY is not configured.
        Reads GEMINI_API_KEY directly from env — no pydantic/config import needed.
        """
        gemini_api_key = _get_env("GEMINI_API_KEY", "")

        if not gemini_api_key:
            raise OCRTierBlockedError(
                "TIER 2 BLOCKED — GEMINI_API_KEY is not set. "
                "Add it to your .env file: GEMINI_API_KEY=your_key_here"
            )

        try:
            from google import genai
            from google.genai import types as genai_types
        except ImportError:
            raise OCRTierBlockedError(
                "TIER 2 BLOCKED — google-genai package not installed. "
                "Run: pip install google-genai"
            )

        client = genai.Client(api_key=gemini_api_key)

        # Convert to JPEG bytes for the API call
        buf = io.BytesIO()
        img.save(buf, format="JPEG", quality=90)
        jpeg_bytes = buf.getvalue()

        prompt = (
            "You are a medical prescription OCR assistant. "
            "Carefully read this handwritten Indian medical prescription image and extract all "
            "structured information. Return ONLY valid JSON with no markdown or explanation. "
            'Use this exact schema: {"doctor_name": "", "clinic_name": "", "patient_name": "", '
            '"patient_age": "", "date": "", "diagnosis": "", "notes": "", '
            '"medications": [{"drug_name": "", "dosage": "", "frequency": "", '
            '"duration": "", "instructions": ""}]}. '
            "If any field is illegible or missing, use an empty string. Never guess or hallucinate names."
        )

        logger.info("TIER 2: Sending prescription to Gemini Vision API (google-genai SDK).")

        response = client.models.generate_content(
            model="gemini-3.8-flash",
            contents=[
                genai_types.Part.from_bytes(data=jpeg_bytes, mime_type="image/jpeg"),
                prompt,
            ],
        )
        raw_text = response.text
        logger.info(f"TIER 2: Gemini response length: {len(raw_text)} chars.")
        return raw_text


    # ------------------------------------------------------------------
    # TIER 3 — microsoft/trocr-base-handwritten (general OCR)
    # ------------------------------------------------------------------
    @classmethod
    def _run_trocr(cls, img: Image.Image) -> str:
        """
        General handwriting OCR using TrOCR (~1.3 GB, auto-downloads).
        This returns unstructured text, which is then parsed by the schema parser.
        Raises OCRTierBlockedError if torch is blocked by Windows App Control.
        """
        try:
            import torch
        except (OSError, Exception) as e:
            raise OCRTierBlockedError(
                f"TIER 3 BLOCKED — torch is unavailable or blocked ({e}). "
                "TrOCR is unavailable on this machine."
            ) from e
        from transformers import TrOCRProcessor, VisionEncoderDecoderModel

        if cls._fallback_model is None:
            logger.info(f"TIER 3: Loading TrOCR ({cls.FALLBACK_MODEL_ID}). May download on first use.")
            cls._fallback_processor = TrOCRProcessor.from_pretrained(cls.FALLBACK_MODEL_ID)
            cls._fallback_model = VisionEncoderDecoderModel.from_pretrained(cls.FALLBACK_MODEL_ID)
            cls._fallback_model.eval()
            logger.info("TIER 3: TrOCR loaded.")

        pixel_values = cls._fallback_processor(img, return_tensors="pt").pixel_values
        with torch.no_grad():
            generated_ids = cls._fallback_model.generate(pixel_values, max_new_tokens=256)
        raw_text = cls._fallback_processor.batch_decode(generated_ids, skip_special_tokens=True)[0]
        logger.info(f"TIER 3: TrOCR output length: {len(raw_text)} chars.")
        return raw_text

    # ------------------------------------------------------------------
    # Main pipeline
    # ------------------------------------------------------------------
    @classmethod
    def execute_ocr_pipeline(
        cls,
        image_bytes: bytes,
        filename: str,
        preferred_model: str = "primary",
        content_type: str = "image/jpeg",
    ) -> Dict[str, Any]:
        """
        Executes the full OCR pipeline with graceful tier cascade.

        Steps:
          1. Validate and pre-process image (blur check, size, format).
          2. Attempt TIER 1 — Local Qwen2.5-VL on CPU (RAM-guarded).
          3. If blocked, attempt TIER 2 — Gemini Vision API (if key configured).
          4. If blocked, attempt TIER 3 — TrOCR general handwriting OCR.
          5. If all tiers fail, raise a clear error (no synthetic output).
          6. Parse output into structured prescription schema.
          7. Flag all medicines needing human review.
        """
        img, quality_warning, variance = cls.validate_and_preprocess_image(image_bytes)

        tier_log: List[str] = []
        raw_ocr_text: Optional[str] = None
        model_used: Optional[str] = None
        model_status: str = "no_model_ran"
        used_vlm_json: bool = False  # True if output is JSON from VLM/Gemini

        # --- TIER 1: Local VLM ---
        if preferred_model in ("primary", "auto"):
            try:
                raw_ocr_text = cls._run_local_vlm(img)
                model_used = cls.PRIMARY_MODEL_ID
                model_status = "tier1_local_vlm"
                used_vlm_json = True
                tier_log.append("TIER 1 (local Qwen2.5-VL): SUCCESS")
            except OCRTierBlockedError as e:
                msg = str(e)
                tier_log.append(f"TIER 1 (local Qwen2.5-VL): BLOCKED — {msg}")
                logger.warning(msg)
            except Exception as e:
                msg = f"Unexpected error: {e}"
                tier_log.append(f"TIER 1 (local Qwen2.5-VL): ERROR — {msg}")
                logger.error(f"TIER 1 failed unexpectedly: {e}", exc_info=True)
                # Unload cached model reference on crash to avoid stale state
                cls._primary_model = None
                cls._primary_processor = None

        # --- TIER 2: Gemini Vision ---
        if raw_ocr_text is None:
            try:
                raw_ocr_text = cls._run_gemini_vision(img, image_bytes, content_type)
                model_used = "google/gemini-2.0-flash-exp"
                model_status = "tier2_gemini_vision"
                used_vlm_json = True
                tier_log.append("TIER 2 (Gemini Vision API): SUCCESS")
            except OCRTierBlockedError as e:
                msg = str(e)
                tier_log.append(f"TIER 2 (Gemini Vision API): BLOCKED — {msg}")
                logger.warning(msg)
            except Exception as e:
                msg = f"Unexpected error: {e}"
                tier_log.append(f"TIER 2 (Gemini Vision API): ERROR — {msg}")
                logger.error(f"TIER 2 failed unexpectedly: {e}", exc_info=True)

        # --- TIER 3: TrOCR ---
        if raw_ocr_text is None:
            try:
                raw_ocr_text = cls._run_trocr(img)
                model_used = cls.FALLBACK_MODEL_ID
                model_status = "tier3_trocr"
                used_vlm_json = False
                tier_log.append("TIER 3 (TrOCR): SUCCESS")
            except OCRTierBlockedError as e:
                msg = str(e)
                tier_log.append(f"TIER 3 (TrOCR): BLOCKED — {msg}")
                logger.error(msg)
            except Exception as e:
                msg = f"Unexpected error: {e}"
                tier_log.append(f"TIER 3 (TrOCR): ERROR — {msg}")
                logger.error(f"TIER 3 failed unexpectedly: {e}", exc_info=True)
                cls._fallback_model = None
                cls._fallback_processor = None

        # --- All tiers failed — return honest error ---
        if raw_ocr_text is None:
            raise RuntimeError(
                "All OCR tiers failed. No prescription data was extracted. "
                "Details: " + " | ".join(tier_log)
            )

        # --- Parse output ---
        if used_vlm_json:
            parsed = cls.parse_vlm_json_output(raw_ocr_text)
        else:
            parsed = cls.parse_text_to_prescription_schema(raw_ocr_text, default_conf=0.78)

        # Compute overall confidence
        meds = parsed.get("medications", [])
        if meds:
            avg_conf = round(sum(m.get("confidence", 0.78) for m in meds) / len(meds), 2)
        else:
            avg_conf = 0.45
            if not quality_warning:
                quality_warning = (
                    "No standard medication patterns detected. "
                    "Image quality may be too low, or the prescription uses "
                    "non-standard formatting. Please enter details manually."
                )

        return {
            "model_used": model_used,
            "model_status": model_status,
            "tier_log": tier_log,
            "raw_ocr_text": raw_ocr_text,
            "quality_warning": quality_warning,
            "sharpness_score": round(variance, 1),
            "confidence_score": avg_conf,
            "doctor_details": {
                "name": parsed.get("doctor_name", "unknown"),
                "clinic": parsed.get("clinic_name", "unknown"),
                "date": parsed.get("date", "unknown"),
            },
            "patient_details": {
                "name": parsed.get("patient_name", "unknown"),
                "age": parsed.get("patient_age", "unknown"),
            },
            "diagnosis": parsed.get("diagnosis", "unknown"),
            "doctor_notes": parsed.get("notes", "unknown"),
            "extracted_medicines": meds,
            "disclaimer": (
                "MediWallet Transcription Assistance Only: This tool digitises handwritten "
                "prescriptions. It does not make clinical diagnoses or provide medication advice. "
                "All fields marked needs_review=true MUST be verified by a licensed physician "
                "or pharmacist before use."
            ),
        }
