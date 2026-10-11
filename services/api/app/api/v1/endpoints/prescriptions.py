import json
import base64
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, Header, UploadFile, File, Query
from sqlalchemy.orm import Session

from app.models.database import get_db, PrescriptionExtraction, MedicalRecord
from app.core.security import decode_access_token
from app.schemas.schemas import PrescriptionReviewUpdate
from app.services.ocr_engine import PrescriptionOCREngine

router = APIRouter()

def get_current_user_id(authorization: Optional[str] = Header(None)) -> int:
    if not authorization or not authorization.startswith("Bearer "):
        return 1
    token = authorization.split(" ")[1]
    payload = decode_access_token(token)
    return int(payload.get("sub", 1)) if payload else 1

@router.get("/model-info")
def get_model_info():
    """
    Returns hardware capabilities, CUDA availability, and Hugging Face model details.
    """
    return PrescriptionOCREngine.check_hardware_feasibility()

@router.get("")
def list_prescriptions(user_id: int = Depends(get_current_user_id), db: Session = Depends(get_db)):
    items = db.query(PrescriptionExtraction).filter(PrescriptionExtraction.user_id == user_id).order_by(PrescriptionExtraction.id.desc()).all()
    results = []
    for p in items:
        meds = []
        try:
            meds = json.loads(p.extracted_medicines)
        except Exception:
            pass

        results.append({
            "id": p.id,
            "original_image_url": p.original_image_url,
            "extracted_medicines": meds,
            "confidence_score": p.confidence_score,
            "doctor_notes": p.doctor_notes,
            "status": p.status,
            "created_at": p.created_at.isoformat()
        })
    return results

@router.post("/scan")
@router.post("/upload")
async def scan_prescription(
    file: UploadFile = File(...),
    preferred_model: str = Query("primary", description="preferred model: primary (KushagraWadhwa VLM) or fallback (microsoft/trocr)"),
    demo: bool = Query(False, description="Run in clearly labeled DEMO / MOCK DATA mode for workflow verification"),
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    """
    Uploads handwritten prescription photo:
    - If demo=True: returns clearly labeled DEMO / MOCK DATA (Patient: D. Srujana Reddy, 55 kg, Cold & cough;
      Medications: Azithromycin 500 mg, Cetirizine 10 mg, Paracetamol 650 mg) for verification flow demonstration.
    - If demo=False: executes real OCR pipeline via PrescriptionOCREngine (Gemini Vision / local model).
      If real OCR fails, raises an error. Never silently substitutes mock data.
    """
    contents = await file.read()
    if not contents:
        raise HTTPException(status_code=400, detail="Empty prescription image uploaded.")

    # Generate preview data URI for frontend instant preview
    content_type = file.content_type or "image/jpeg"
    b64_image = base64.b64encode(contents).decode("utf-8")
    preview_url = f"data:{content_type};base64,{b64_image}"

    if demo:
        # Explicit DEMO / MOCK DATA mode requested by user
        demo_medicines = [
            {
                "name": "Azithromycin",
                "strength": "500 mg",
                "dosage": "500 mg",
                "frequency": "1-0-0 (Once daily after meals)",
                "duration": "3 days",
                "route": "Oral",
                "instructions": "Take after meals with water",
                "confidence": 0.95,
                "needs_review": False,
                "model_source": "DEMO MOCK DATA"
            },
            {
                "name": "Cetirizine",
                "strength": "10 mg",
                "dosage": "10 mg",
                "frequency": "0-0-1 (Night at bedtime)",
                "duration": "5 days",
                "route": "Oral",
                "instructions": "Take at night for cold/cough symptoms",
                "confidence": 0.94,
                "needs_review": False,
                "model_source": "DEMO MOCK DATA"
            },
            {
                "name": "Paracetamol",
                "strength": "650 mg",
                "dosage": "650 mg",
                "frequency": "1-0-1 (SOS for fever / headache)",
                "duration": "3 days",
                "route": "Oral",
                "instructions": "Take after food as needed for fever or headache",
                "confidence": 0.96,
                "needs_review": False,
                "model_source": "DEMO MOCK DATA"
            }
        ]
        res = {
            "model_used": "DEMO / MOCK DATA (Simulated Verification)",
            "model_status": "demo_simulation",
            "is_demo": True,
            "tier_log": [
                "DEMO MODE: Returning verified sample mock data for verification workflow demonstration."
            ],
            "raw_ocr_text": (
                "DEMO DATA — NOT EXTRACTED FROM THIS IMAGE\n"
                "-------------------------------------------\n"
                "Patient: D. Srujana Reddy\n"
                "Weight: 55 kg\n"
                "Reported Symptoms: Cold and cough\n"
                "\n"
                "Prescribed Medications:\n"
                "- Azithromycin 500 mg (1 OD x 3 days)\n"
                "- Cetirizine 10 mg (1 HS x 5 days)\n"
                "- Paracetamol 650 mg (1 SOS x 3 days)\n"
                "\n"
                "Doctor's Note: Adequate hydration, warm fluids, steam inhalation. Review in 3 days if symptoms persist."
            ),
            "quality_warning": None,
            "sharpness_score": 98.0,
            "confidence_score": 0.95,
            "doctor_details": {
                "name": "Dr. K. Srinivas Rao, MD",
                "clinic": "Apollo Clinic, Hyderabad",
                "date": "10-Oct-2026"
            },
            "patient_details": {
                "name": "D. Srujana Reddy",
                "weight": "55 kg",
                "symptoms": "Cold and cough",
                "age": "28"
            },
            "diagnosis": "Upper Respiratory Tract Infection (Cold & Cough)",
            "doctor_notes": "Adequate hydration, warm fluids, steam inhalation. Review in 3 days if symptoms persist.",
            "extracted_medicines": demo_medicines,
            "disclaimer": (
                "DEMO DATA — NOT EXTRACTED FROM THIS IMAGE. "
                "This transcription contains simulated demonstration data for verification and workflow demonstration. "
                "These values were NOT recognized from the uploaded image by the Hugging Face model or any AI OCR. "
                "Does NOT prescribe medications or calculate doses. Clinical review by a qualified professional is required."
            )
        }
    else:
        # Production OCR: Run real OCR Engine
        try:
            res = PrescriptionOCREngine.execute_ocr_pipeline(
                image_bytes=contents,
                filename=file.filename or "prescription.jpg",
                preferred_model=preferred_model
            )
            res["is_demo"] = False
        except ValueError as ve:
            raise HTTPException(status_code=400, detail=str(ve))
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Prescription OCR pipeline error: {str(e)}")

    # Store in database as pending_review
    rx = PrescriptionExtraction(
        user_id=user_id,
        original_image_url=preview_url[:200] if len(preview_url) < 200 else f"/uploads/rx_{file.filename}",
        extracted_medicines=json.dumps(res["extracted_medicines"]),
        confidence_score=res["confidence_score"],
        doctor_notes=res["doctor_notes"],
        status="pending_review"
    )
    db.add(rx)
    db.commit()
    db.refresh(rx)

    return {
        "prescription_id": rx.id,
        "preview_url": preview_url,
        "filename": file.filename,
        "is_demo": res.get("is_demo", False),
        "model_used": res["model_used"],
        "model_status": res["model_status"],
        "tier_log": res.get("tier_log", []),
        "raw_ocr_text": res["raw_ocr_text"],
        "quality_warning": res["quality_warning"],
        "sharpness_score": res["sharpness_score"],
        "confidence_score": res["confidence_score"],
        "doctor_details": res["doctor_details"],
        "patient_details": res["patient_details"],
        "diagnosis": res["diagnosis"],
        "doctor_notes": res["doctor_notes"],
        "extracted_medicines": res["extracted_medicines"],
        "disclaimer": res["disclaimer"],
        "status": rx.status,
        "message": (
            "DEMO DATA LOADED: Review and test the verification workflow."
            if res.get("is_demo")
            else "Prescription analyzed successfully. Please review and verify all fields before saving."
        )
    }

@router.put("/{prescription_id}/confirm")
def confirm_prescription(
    prescription_id: int,
    data: PrescriptionReviewUpdate,
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    """
    Explicit confirmation endpoint:
    Locks and confirms user-verified prescription data after review.
    """
    rx = db.query(PrescriptionExtraction).filter(
        PrescriptionExtraction.id == prescription_id,
        PrescriptionExtraction.user_id == user_id
    ).first()
    
    if not rx:
        raise HTTPException(status_code=404, detail="Prescription not found.")

    rx.extracted_medicines = json.dumps(data.extracted_medicines)
    if data.doctor_notes:
        rx.doctor_notes = data.doctor_notes
    rx.status = "confirmed"
    db.commit()

    return {
        "status": "confirmed",
        "prescription_id": rx.id,
        "extracted_medicines": data.extracted_medicines,
        "doctor_details": data.doctor_details,
        "patient_details": data.patient_details,
        "diagnosis": data.diagnosis,
        "doctor_notes": data.doctor_notes,
        "message": "Prescription successfully verified and saved into your MEDIWALLET memory!"
    }
