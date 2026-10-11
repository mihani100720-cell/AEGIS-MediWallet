from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, Header
from sqlalchemy.orm import Session
from datetime import datetime, timezone

from services.api.app.models.database import get_db, DoctorProfile, User, SecurityEvent
from services.api.app.core.security import decode_access_token

router = APIRouter()

@router.get("")
def list_doctors(db: Session = Depends(get_db)):
    doctors = db.query(DoctorProfile, User).join(User, DoctorProfile.user_id == User.id).all()
    results = []
    for doc, user in doctors:
        results.append({
            "id": doc.id,
            "user_id": user.id,
            "full_name": user.full_name,
            "email": user.email,
            "specialization": doc.specialization,
            "hospital_affiliation": doc.hospital_affiliation,
            "medical_reg_no": doc.medical_reg_no,
            "verification_status": doc.verification_status,
            "badge_issued": doc.badge_issued,
            "verified_at": doc.verified_at.isoformat() if doc.verified_at else None
        })
    return results

@router.get("/admin/pending")
def list_pending_doctors(db: Session = Depends(get_db)):
    pending = db.query(DoctorProfile, User).join(User, DoctorProfile.user_id == User.id).filter(DoctorProfile.verification_status == "pending").all()
    return [
        {
            "profile_id": doc.id,
            "doctor_name": user.full_name,
            "email": user.email,
            "medical_reg_no": doc.medical_reg_no,
            "specialization": doc.specialization,
            "hospital_affiliation": doc.hospital_affiliation,
            "document_proof_url": doc.document_proof_url
        }
        for doc, user in pending
    ]

@router.post("/{profile_id}/verify")
def verify_doctor_status(profile_id: int, status: str, db: Session = Depends(get_db)):
    if status not in ["verified", "rejected"]:
        raise HTTPException(status_code=400, detail="Invalid verification status")

    profile = db.query(DoctorProfile).filter(DoctorProfile.id == profile_id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Doctor profile not found.")

    profile.verification_status = status
    profile.badge_issued = (status == "verified")
    if status == "verified":
        profile.verified_at = datetime.now(timezone.utc)

    db.commit()
    return {
        "status": status,
        "profile_id": profile.id,
        "badge_issued": profile.badge_issued,
        "message": f"Doctor credentials marked as {status}."
    }
