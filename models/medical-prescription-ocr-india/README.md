---
license: apache-2.0
base_model: Qwen/Qwen2.5-VL-3B-Instruct
tags:
- medical
- ocr
- vision-language
- prescription
- peft
- lora
- qwen2.5-vl
- indian-prescriptions
language:
- en
- hi
pipeline_tag: image-text-to-text
datasets:
- naazimsnh02/medocr-vision-dataset
metrics:
- loss
library_name: transformers
---

# Medical Prescription OCR — Qwen2.5-VL-3B Fine-tuned

## Model Details

### Model Description

A vision-language model fine-tuned to extract structured information from handwritten and printed Indian medical prescriptions. Given a prescription image, it returns a JSON object containing doctor details, patient details, medications (with dosage, frequency, duration), diagnosis, and notes.

- **Developed by:** Kushagra Wadhwa
- **Model type:** Vision-Language Model (VLM) — Image-Text to JSON
- **Language(s):** English, Hindi (mixed-language Indian prescriptions)
- **License:** Apache 2.0
- **Finetuned from model:** [Qwen/Qwen2.5-VL-3B-Instruct](https://huggingface.co/Qwen/Qwen2.5-VL-3B-Instruct)

### Model Sources

- **Repository:** https://github.com/KushagraaWadhwa/Patient-Monitoring

---

## Uses

### Direct Use

Extract structured data from medical prescription images in healthcare applications, EMR (Electronic Medical Record) systems, or patient monitoring dashboards. Input a prescription image, receive a structured JSON output.

### Downstream Use

- Automated pharmacy data entry
- AI-powered patient monitoring systems
- Hospital EMR digitisation pipelines
- Medical audit and compliance tooling

### Out-of-Scope Use

- Diagnosing patients or making clinical decisions — this model reads and structures text, it does not provide medical advice
- Prescriptions from non-Indian contexts (the training data is India-specific; handwriting styles and drug naming conventions may differ)
- Real-time critical care decisions

---

## Bias, Risks, and Limitations

- Trained primarily on Indian prescription formats; performance may degrade on prescriptions from other regions
- Handwriting quality significantly affects accuracy — illegible prescriptions will produce empty or incomplete fields
- Drug names may be partially or incorrectly transcribed for unusual handwriting; always verify medication details before clinical use
- Hindi/mixed-language prescriptions may have lower accuracy than purely English ones
- **Not a substitute for a qualified pharmacist or clinician review**

### Recommendations

Always have a qualified healthcare professional verify the model's output before acting on it. Do not use this model as the sole source of truth for medication dispensing or clinical workflows.

---

## How to Get Started with the Model

```python
from transformers import Qwen2_5_VLForConditionalGeneration, AutoProcessor
from PIL import Image
import torch

model_id = "KushagraWadhwa/medical-prescription-ocr-india"

model = Qwen2_5_VLForConditionalGeneration.from_pretrained(
    model_id,
    device_map="auto",
    torch_dtype=torch.bfloat16,
)
processor = AutoProcessor.from_pretrained(model_id)

SYSTEM_PROMPT = """You are a medical prescription OCR assistant.
Extract all information from the prescription image and return it as JSON.
Return ONLY valid JSON, no explanation text.
Use this exact schema:
{"doctor_name": "", "clinic_name": "", "patient_name": "", "patient_age": "",
 "date": "", "medications": [{"drug_name": "", "dosage": "", "frequency": "",
 "duration": "", "instructions": ""}], "diagnosis": "", "notes": ""}
If a field is not visible, use empty string."""

image = Image.open("prescription.jpg").convert("RGB")

messages = [
    {"role": "system", "content": SYSTEM_PROMPT},
    {"role": "user", "content": [
        {"type": "image", "image": image},
        {"type": "text",  "text": "Extract all prescription information from this image and return as JSON."}
    ]}
]

text = processor.apply_chat_template(messages, tokenize=False, add_generation_prompt=True)
inputs = processor(text=[text], images=[image], return_tensors="pt").to("cuda")

with torch.no_grad():
    outputs = model.generate(**inputs, max_new_tokens=512, do_sample=False)

generated = outputs[0][inputs["input_ids"].shape[1]:]
print(processor.decode(generated, skip_special_tokens=True))
```

**Example output:**
```json
{
  "doctor_name": "Dr. R. K. Sharma",
  "clinic_name": "Sharma Clinic",
  "patient_name": "Suresh Patel",
  "patient_age": "52",
  "date": "12/03/24",
  "medications": [
    {
      "drug_name": "Tab. Metformin 500mg",
      "dosage": "500mg",
      "frequency": "1-0-1",
      "duration": "30 days",
      "instructions": "After food"
    },
    {
      "drug_name": "Tab. Amlodipine 5mg",
      "dosage": "5mg",
      "frequency": "OD",
      "duration": "30 days",
      "instructions": "Morning"
    }
  ],
  "diagnosis": "T2DM, HTN",
  "notes": "Review after 1 month. RBS fasting."
}
```

---

## Training Details

### Training Data

- **Dataset:** [`naazimsnh02/medocr-vision-dataset`](https://huggingface.co/datasets/naazimsnh02/medocr-vision-dataset)
- **Split:** 1,969 training samples / 246 validation samples
- **Content:** Scanned and photographed Indian medical prescriptions (handwritten and printed), labelled with structured JSON ground truth

### Preprocessing

- Images converted to RGB
- Labels parsed from `<s_ocr>` tag format into structured JSON with fields: `doctor_name`, `clinic_name`, `patient_name`, `patient_age`, `date`, `medications`, `diagnosis`, `notes`
- Medications parsed into per-drug entries: `drug_name`, `dosage`, `frequency`, `duration`, `instructions`
- Sequences truncated to max length 512 tokens

### Training Hyperparameters

| Parameter | Value |
|-----------|-------|
| Training regime | bf16 mixed precision |
| Epochs | 3 |
| Per-device train batch size | 1 |
| Gradient accumulation steps | 8 (effective batch size: 8) |
| Learning rate | 2e-4 |
| LR scheduler | Cosine |
| Warmup ratio | 0.05 |
| Max sequence length | 512 |
| Optimizer | AdamW |
| LoRA rank (r) | 16 |
| LoRA alpha | 32 |
| LoRA dropout | 0.05 |
| LoRA target modules | q_proj, v_proj, k_proj, o_proj, gate_proj, up_proj, down_proj |
| Quantization | 4-bit NF4 (bitsandbytes) with double quantization |

### Speeds, Sizes, Times

- **Hardware:** NVIDIA Tesla T4 × 2
- **Cloud Provider:** Kaggle (Google Cloud)
- **Training time:** ~3 hours (3 epochs, 1,969 samples)

---

## Evaluation

### Testing Data

246 samples from the validation split of `naazimsnh02/medocr-vision-dataset`.

### Factors

Performance varies by:
- Handwriting legibility (printed > clear handwritten > cursive/illegible)
- Language mix (English-only > mixed Hindi-English)
- Number of medications on the prescription

### Metrics

- **Primary:** Evaluation loss (used for best checkpoint selection)
- **Qualitative:** JSON field accuracy on held-out prescription samples

### Results

The model accurately extracts structured fields from both handwritten and printed Indian prescriptions. Fields like `doctor_name`, `clinic_name`, and `date` are extracted reliably. Medication list accuracy depends on handwriting legibility. Hindi/mixed-language content is supported but may have lower accuracy than English-only prescriptions.

---

## Environmental Impact

Carbon emissions can be estimated using the [Machine Learning Impact calculator](https://mlco2.impact.org/) presented in Lacoste et al. (2019).

- **Hardware Type:** NVIDIA Tesla T4 × 2
- **Hours used:** ~3
- **Cloud Provider:** Google (Kaggle)
- **Compute Region:** US (Kaggle default)

---

## Technical Specifications

### Model Architecture and Objective

- **Base:** Qwen2.5-VL-3B-Instruct — 3B parameter multimodal vision-language transformer
- **Fine-tuning method:** QLoRA (Quantized Low-Rank Adaptation) via PEFT
- **Quantization:** 4-bit NF4 base weights; LoRA adapters trained in bfloat16
- **Objective:** Causal language modelling on image+text → structured JSON sequences

### Software

- `transformers`
- `peft`
- `trl` (SFTTrainer / SFTConfig)
- `bitsandbytes`
- `accelerate`
- `datasets`
- `torch` (cu124)

---

## Model Card Authors

Kushagra Wadhwa

## Model Card Contact

[https://github.com/KushagraaWadhwa](https://github.com/KushagraaWadhwa)
