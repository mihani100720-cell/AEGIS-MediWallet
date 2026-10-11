import json
from datetime import datetime, timezone
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, Header
from sqlalchemy.orm import Session

from app.models.database import get_db, EmergencyProfile, User
from app.core.security import decode_access_token
from app.schemas.schemas import EmergencyProfileUpdate

router = APIRouter()

def get_current_user_id(authorization: Optional[str] = Header(None)) -> int:
    if not authorization or not authorization.startswith("Bearer "):
        return 1
    token = authorization.split(" ")[1]
    payload = decode_access_token(token)
    return int(payload.get("sub", 1)) if payload else 1

@router.get("/profile")
def get_emergency_profile(user_id: int = Depends(get_current_user_id), db: Session = Depends(get_db)):
    profile = db.query(EmergencyProfile).filter(EmergencyProfile.user_id == user_id).first()
    user = db.query(User).filter(User.id == user_id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Emergency profile not found.")

    return {
        "user_id": profile.user_id,
        "patient_name": user.full_name if user else "Aarav Sharma",
        "blood_group": profile.blood_group,
        "allergies": json.loads(profile.allergies),
        "chronic_conditions": json.loads(profile.chronic_conditions),
        "current_medications": json.loads(profile.current_medications),
        "emergency_contacts": json.loads(profile.emergency_contacts),
        "updated_at": profile.updated_at.isoformat(),
        "offline_ready": True
    }

@router.put("/profile")
def update_emergency_profile(data: EmergencyProfileUpdate, user_id: int = Depends(get_current_user_id), db: Session = Depends(get_db)):
    profile = db.query(EmergencyProfile).filter(EmergencyProfile.user_id == user_id).first()
    if not profile:
        profile = EmergencyProfile(user_id=user_id)
        db.add(profile)

    profile.blood_group = data.blood_group
    profile.allergies = json.dumps(data.allergies)
    profile.chronic_conditions = json.dumps(data.chronic_conditions)
    profile.current_medications = json.dumps(data.current_medications)
    profile.emergency_contacts = json.dumps(data.emergency_contacts)
    profile.updated_at = datetime.now(timezone.utc)

    # Re-generate compact offline QR payload
    compact_payload = {
        "v": 1,
        "type": "MW_EMERGENCY_SHIELD",
        "name": "Aarav Sharma",
        "blood": data.blood_group,
        "allergies": data.allergies,
        "conditions": data.chronic_conditions,
        "meds": data.current_medications,
        "contacts": [f"{c.get('name')}: {c.get('phone')}" for c in data.emergency_contacts]
    }
    profile.qr_payload = json.dumps(compact_payload)
    db.commit()

    return {
        "status": "updated",
        "message": "Emergency profile updated and offline emergency QR regenerated.",
        "qr_payload": profile.qr_payload
    }

@router.get("/qr-data")
def get_emergency_qr_data(user_id: int = Depends(get_current_user_id), db: Session = Depends(get_db)):
    """Returns self-contained offline emergency payload to render without any internet."""
    profile = db.query(EmergencyProfile).filter(EmergencyProfile.user_id == user_id).first()
    user = db.query(User).filter(User.id == user_id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found.")

    compact = {
        "title": "MEDIWALLET EMERGENCY PROFILE",
        "patient": user.full_name if user else "Aarav Sharma",
        "blood_group": profile.blood_group,
        "allergies": json.loads(profile.allergies),
        "conditions": json.loads(profile.chronic_conditions),
        "contacts": json.loads(profile.emergency_contacts),
        "offline_verification": "Zero-Network Verified Offline Emergency Shield",
        "last_updated": profile.updated_at.strftime("%Y-%m-%d")
    }

    return {
        "qr_raw_string": json.dumps(compact),
        "display_data": compact
    }
