from typing import Optional, List
from fastapi import APIRouter, Depends, Header
from sqlalchemy.orm import Session

from app.models.database import get_db, SecurityEvent, AccessAuditLog, MedicalRecord
from app.core.security import decode_access_token

router = APIRouter()

def get_current_user_id(authorization: Optional[str] = Header(None)) -> int:
    if not authorization or not authorization.startswith("Bearer "):
        return 1
    token = authorization.split(" ")[1]
    payload = decode_access_token(token)
    return int(payload.get("sub", 1)) if payload else 1

@router.get("/security-timeline")
def get_security_timeline(user_id: int = Depends(get_current_user_id), db: Session = Depends(get_db)):
    events = db.query(SecurityEvent).filter(
        (SecurityEvent.user_id == user_id) | (SecurityEvent.user_id == None)
    ).order_by(SecurityEvent.created_at.desc()).limit(50).all()

    return [
        {
            "id": e.id,
            "event_type": e.event_type,
            "ip_address": e.ip_address,
            "user_agent": e.user_agent,
            "severity": e.severity,
            "details": e.details,
            "timestamp": e.created_at.isoformat()
        }
        for e in events
    ]

@router.get("/access-logs")
def get_access_logs(user_id: int = Depends(get_current_user_id), db: Session = Depends(get_db)):
    logs = db.query(AccessAuditLog).order_by(AccessAuditLog.timestamp.desc()).limit(50).all()
    results = []
    for l in logs:
        rec_title = "Vault Overview"
        if l.record_id:
            rec = db.query(MedicalRecord).filter(MedicalRecord.id == l.record_id).first()
            if rec:
                rec_title = rec.title

        results.append({
            "id": l.id,
            "record_title": rec_title,
            "accessor_name": l.accessor_name,
            "accessor_role": l.accessor_role,
            "action": l.action,
            "timestamp": l.timestamp.isoformat()
        })
    return results
