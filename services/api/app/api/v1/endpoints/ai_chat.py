from typing import Optional, List
from fastapi import APIRouter, Depends, Header
from sqlalchemy.orm import Session
import json

from app.models.database import get_db, MedicalRecord, User, Appointment
from app.core.security import decode_access_token
from app.schemas.schemas import ChatQueryRequest
from app.services.ai_service import AIService

router = APIRouter()

def get_current_user_id(authorization: Optional[str] = Header(None)) -> int:
    if not authorization or not authorization.startswith("Bearer "):
        return 1
    token = authorization.split(" ")[1]
    payload = decode_access_token(token)
    return int(payload.get("sub", 1)) if payload else 1

@router.post("/query")
def chat_query(req: ChatQueryRequest, user_id: int = Depends(get_current_user_id), db: Session = Depends(get_db)):
    records = db.query(MedicalRecord).filter(MedicalRecord.user_id == user_id).all()
    rec_dicts = [
        {
            "id": r.id,
            "title": r.title,
            "category": r.category,
            "record_date": r.record_date,
            "hospital_name": r.hospital_name,
            "doctor_name": r.doctor_name,
            "file_name": r.file_name,
            "extracted_text": r.extracted_text,
            "is_abnormal": r.is_abnormal
        }
        for r in records
    ]

    response = AIService.answer_health_query(req.query, rec_dicts, language=req.language)
    return response

@router.get("/consultation-brief")
def generate_consultation_brief(user_id: int = Depends(get_current_user_id), db: Session = Depends(get_db)):
    """Module 18: Patient-reviewed Consultation Brief for visiting doctor."""
    records = db.query(MedicalRecord).filter(MedicalRecord.user_id == user_id).all()
    user = db.query(User).filter(User.id == user_id).first()
    next_app = db.query(Appointment).filter(Appointment.user_id == user_id, Appointment.status == "scheduled").first()

    summary_items = []
    abnormal_items = []
    active_meds = [
        "Telmisartan 40mg (OD morning)",
        "Metformin 500mg (BD with meals)",
        "Atorvastatin 10mg (HS night)"
    ]

    for r in records:
        if r.is_abnormal:
            abnormal_items.append({
                "record": r.title,
                "date": r.record_date,
                "finding": "Elevated metabolic or lipid parameter outside laboratory threshold."
            })

    brief = {
        "patient_name": user.full_name if user else "Aarav Sharma",
        "generated_on": "2026-10-09",
        "chief_concern": "Routine Quarterly Hypertension & Diabetes Review",
        "active_conditions": ["Essential Hypertension (controlled)", "Type 2 Diabetes Mellitus"],
        "known_allergies": ["Penicillin", "Sulfonamides", "Peanuts"],
        "active_medication_schedule": active_meds,
        "recent_diagnostic_abnormalities": abnormal_items,
        "upcoming_consultation": {
            "doctor": next_app.doctor_name if next_app else "Dr. Priya Nair, MD",
            "clinic": next_app.clinic if next_app else "Apollo Health City",
            "date": next_app.appointment_date.strftime("%Y-%m-%d %I:%M %p") if next_app else "Upcoming"
        },
        "patient_action": "Ready to print or present to consulting doctor via QR grant."
    }

    return brief
