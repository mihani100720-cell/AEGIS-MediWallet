import json
import uuid
from datetime import datetime, timezone, timedelta
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, Header
from sqlalchemy.orm import Session

from app.models.database import get_db, ConsentGrant, User, DoctorProfile, MedicalRecord, AccessAuditLog, SecurityEvent
from app.core.security import decode_access_token
from app.schemas.schemas import ConsentCreateRequest, ConsentApproveRequest

router = APIRouter()

def get_current_user_id(authorization: Optional[str] = Header(None)) -> int:
    if not authorization or not authorization.startswith("Bearer "):
        return 1
    token = authorization.split(" ")[1]
    payload = decode_access_token(token)
    return int(payload.get("sub", 1)) if payload else 1

@router.post("/qr/request")
def doctor_create_qr_request(
    purpose: str = "Cardiology Consultation",
    doctor_user_id: int = 2, # Dr. Priya Nair
    db: Session = Depends(get_db)
):
    """Doctor creates a short-lived QR request. Contains only an opaque request ID."""
    token = f"mw_req_{uuid.uuid4().hex[:16]}"
    # 10 minute expiry for the scan request
    expires_at = datetime.now(timezone.utc) + timedelta(minutes=10)

    # Temporary grant placeholder awaiting patient scan & approval
    grant = ConsentGrant(
        patient_id=1,
        doctor_id=doctor_user_id,
        mode="opd",
        status="pending_patient_scan",
        record_ids="[]",
        purpose=purpose,
        qr_token=token,
        expires_at=expires_at
    )
    db.add(grant)
    db.commit()

    return {
        "qr_token": token,
        "expires_in_seconds": 600,
        "doctor_id": doctor_user_id,
        "notice": "QR contains only an opaque request ID. No medical records are transmitted in the QR."
    }

@router.get("/qr/{token}")
def get_qr_request_details(token: str, db: Session = Depends(get_db)):
    """Patient scans QR and reviews Doctor credentials and requested purpose."""
    grant = db.query(ConsentGrant).filter(ConsentGrant.qr_token == token).first()
    if not grant:
        raise HTTPException(status_code=404, detail="Invalid or expired QR access code.")

    doctor = db.query(User).filter(User.id == grant.doctor_id).first()
    doc_profile = db.query(DoctorProfile).filter(DoctorProfile.user_id == grant.doctor_id).first()

    return {
        "qr_token": grant.qr_token,
        "doctor_name": doctor.full_name if doctor else "Dr. Priya Nair, MD",
        "specialization": doc_profile.specialization if doc_profile else "Cardiologist",
        "hospital": doc_profile.hospital_affiliation if doc_profile else "Apollo Health City",
        "verification_status": doc_profile.verification_status if doc_profile else "verified",
        "badge_issued": doc_profile.badge_issued if doc_profile else True,
        "purpose": grant.purpose
    }

@router.post("/qr/approve")
def patient_approve_qr(
    req: ConsentApproveRequest,
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    """Patient grants selective access for specific records and duration (OPD / Admission)."""
    grant = db.query(ConsentGrant).filter(ConsentGrant.qr_token == req.qr_token).first()
    if not grant:
        raise HTTPException(status_code=404, detail="Access request not found.")

    grant.patient_id = user_id
    grant.mode = req.mode
    grant.record_ids = json.dumps(req.record_ids)
    grant.purpose = req.purpose
    grant.status = "active"
    grant.expires_at = datetime.now(timezone.utc) + timedelta(minutes=req.duration_minutes)

    # Security event
    sec = SecurityEvent(
        user_id=user_id,
        event_type="consent_granted",
        severity="low",
        details=f"Patient approved {req.mode.upper()} sharing of {len(req.record_ids)} records for {req.duration_minutes} minutes."
    )
    db.add(sec)
    db.commit()

    return {
        "status": "active",
        "grant_id": grant.id,
        "mode": grant.mode,
        "record_count": len(req.record_ids),
        "expires_at": grant.expires_at.isoformat(),
        "notice": "You retain full authority to revoke this grant at any time."
    }

@router.get("/grants/active")
def list_active_grants(user_id: int = Depends(get_current_user_id), db: Session = Depends(get_db)):
    grants = db.query(ConsentGrant).filter(
        ConsentGrant.patient_id == user_id,
        ConsentGrant.status == "active"
    ).all()

    now = datetime.now(timezone.utc)
    results = []
    for g in grants:
        # Check expiry
        if g.expires_at.replace(tzinfo=timezone.utc) < now:
            g.status = "expired"
            db.commit()
            continue

        doc = db.query(User).filter(User.id == g.doctor_id).first()
        results.append({
            "id": g.id,
            "doctor_name": doc.full_name if doc else "Dr. Priya Nair, MD",
            "mode": g.mode,
            "purpose": g.purpose,
            "record_ids": json.loads(g.record_ids),
            "expires_at": g.expires_at.isoformat(),
            "seconds_remaining": max(0, int((g.expires_at.replace(tzinfo=timezone.utc) - now).total_seconds()))
        })
    return results

@router.post("/grants/{grant_id}/revoke")
def revoke_grant(grant_id: int, user_id: int = Depends(get_current_user_id), db: Session = Depends(get_db)):
    grant = db.query(ConsentGrant).filter(ConsentGrant.id == grant_id, ConsentGrant.patient_id == user_id).first()
    if not grant:
        raise HTTPException(status_code=404, detail="Consent grant not found.")

    grant.status = "revoked"
    grant.revoked_at = datetime.now(timezone.utc)

    # Security event
    sec = SecurityEvent(
        user_id=user_id,
        event_type="consent_revoked",
        severity="medium",
        details=f"Patient immediately revoked consent grant #{grant_id}. Doctor access severed."
    )
    db.add(sec)
    db.commit()

    return {
        "status": "revoked",
        "grant_id": grant_id,
        "notice": "Access severed. Notice: Revocation cannot erase medical records already viewed or printed during active period."
    }

@router.get("/doctor/shared-records")
def doctor_view_shared_records(
    doctor_id: int = 2,
    db: Session = Depends(get_db)
):
    """Doctor retrieves currently permitted records. Denied if revoked or expired."""
    now = datetime.now(timezone.utc)
    active_grants = db.query(ConsentGrant).filter(
        ConsentGrant.doctor_id == doctor_id,
        ConsentGrant.status == "active"
    ).all()

    valid_record_ids = set()
    active_patient_names = []

    for g in active_grants:
        if g.expires_at.replace(tzinfo=timezone.utc) >= now:
            r_ids = json.loads(g.record_ids)
            valid_record_ids.update(r_ids)
            patient = db.query(User).filter(User.id == g.patient_id).first()
            if patient:
                active_patient_names.append(patient.full_name)

    if not valid_record_ids:
        return {
            "has_access": False,
            "message": "No active patient consent grant. Request access via QR scan.",
            "records": []
        }

    records = db.query(MedicalRecord).filter(MedicalRecord.id.in_(list(valid_record_ids))).all()
    
    # Log access audit for doctor
    for r in records:
        audit = AccessAuditLog(
            record_id=r.id,
            accessor_id=doctor_id,
            accessor_name="Dr. Priya Nair, MD",
            accessor_role="doctor",
            action="view"
        )
        db.add(audit)
    db.commit()

    return {
        "has_access": True,
        "patients": list(set(active_patient_names)),
        "records": [
            {
                "id": r.id,
                "title": r.title,
                "category": r.category,
                "record_date": r.record_date,
                "doctor_name": r.doctor_name,
                "hospital_name": r.hospital_name,
                "extracted_text": r.extracted_text,
                "structured_data": json.loads(r.structured_data) if r.structured_data else [],
                "ai_summary": r.ai_summary
            }
            for r in records
        ]
    }
