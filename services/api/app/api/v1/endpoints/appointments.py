from datetime import datetime, timezone
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, Header
from sqlalchemy.orm import Session

from app.models.database import get_db, Appointment, User
from app.core.security import decode_access_token
from app.schemas.schemas import AppointmentCreate

router = APIRouter()

def get_current_user_id(authorization: Optional[str] = Header(None)) -> int:
    if not authorization or not authorization.startswith("Bearer "):
        return 1
    token = authorization.split(" ")[1]
    payload = decode_access_token(token)
    return int(payload.get("sub", 1)) if payload else 1

@router.get("")
def list_appointments(user_id: int = Depends(get_current_user_id), db: Session = Depends(get_db)):
    apps = db.query(Appointment).filter(Appointment.user_id == user_id).order_by(Appointment.appointment_date.asc()).all()
    return [
        {
            "id": a.id,
            "doctor_id": a.doctor_id,
            "doctor_name": a.doctor_name,
            "clinic": a.clinic,
            "appointment_date": a.appointment_date.isoformat(),
            "status": a.status,
            "follow_up_instructions": a.follow_up_instructions,
            "reminder_sent": a.reminder_sent
        }
        for a in apps
    ]

@router.post("")
def create_appointment(data: AppointmentCreate, user_id: int = Depends(get_current_user_id), db: Session = Depends(get_db)):
    try:
        app_dt = datetime.fromisoformat(data.appointment_date.replace("Z", "+00:00"))
    except Exception:
        app_dt = datetime.now(timezone.utc)

    app = Appointment(
        user_id=user_id,
        doctor_id=data.doctor_id,
        doctor_name=data.doctor_name,
        clinic=data.clinic,
        appointment_date=app_dt,
        status="scheduled",
        follow_up_instructions=data.follow_up_instructions
    )
    db.add(app)
    db.commit()
    db.refresh(app)

    return {
        "status": "scheduled",
        "appointment_id": app.id,
        "doctor_name": app.doctor_name,
        "date": app.appointment_date.isoformat()
    }

@router.post("/{app_id}/cancel")
def cancel_appointment(app_id: int, user_id: int = Depends(get_current_user_id), db: Session = Depends(get_db)):
    app = db.query(Appointment).filter(Appointment.id == app_id, Appointment.user_id == user_id).first()
    if not app:
        raise HTTPException(status_code=404, detail="Appointment not found.")

    app.status = "cancelled"
    db.commit()
    return {"status": "cancelled", "appointment_id": app_id}
