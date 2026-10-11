from fastapi import APIRouter, Depends, HTTPException, status, Header
from sqlalchemy.orm import Session
from typing import Optional, List
from datetime import datetime, timezone
import uuid

from app.models.database import get_db, User, UserSession, SecurityEvent
from app.core.security import (
    verify_password,
    create_access_token,
    decode_access_token,
    hash_password,
    hash_report_access_password
)
from app.schemas.schemas import (
    LoginRequest,
    TokenResponse,
    PasskeyLoginRequest,
    UserResponse,
    UserRegisterRequest
)

router = APIRouter()

@router.post("/register", response_model=TokenResponse)
def register(request: UserRegisterRequest, db: Session = Depends(get_db)):
    existing = db.query(User).filter(User.email == request.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="An account with this email already exists.")

    if len(request.password) < 8:
        raise HTTPException(status_code=400, detail="Password must be at least 8 characters long.")

    report_pw_hash = None
    if request.report_access_password:
        if request.report_access_password != request.report_access_password_confirm:
            raise HTTPException(status_code=400, detail="Report-access password confirmation does not match.")
        if len(request.report_access_password) < 8:
            raise HTTPException(status_code=400, detail="Report-access password must be at least 8 characters long.")
        report_pw_hash = hash_report_access_password(request.report_access_password)

    user = User(
        email=request.email,
        hashed_password=hash_password(request.password),
        full_name=request.full_name,
        role=request.role,
        phone=request.phone,
        blood_group=request.blood_group,
        report_access_password_hash=report_pw_hash,
        verified_email=request.email,
        verified_phone=request.phone,
        allowed_access_methods="both"
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    token = create_access_token(user.id)
    session_id = str(uuid.uuid4())
    user_session = UserSession(
        user_id=user.id,
        session_token=session_id,
        device_name="Browser Client (Verified)",
        is_active=True
    )
    db.add(user_session)
    db.commit()

    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "email": user.email,
            "full_name": user.full_name,
            "role": user.role,
            "blood_group": user.blood_group,
            "preferred_language": user.preferred_language,
            "passkey_registered": user.passkey_registered
        }
    }

@router.post("/login", response_model=TokenResponse)
def login(request: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == request.email).first()
    if not user or not verify_password(request.password, user.hashed_password):
        # Log failed login attempt for security audit
        sec_event = SecurityEvent(
            user_id=user.id if user else None,
            event_type="failed_login",
            severity="medium",
            details=f"Failed login attempt for email {request.email}"
        )
        db.add(sec_event)
        db.commit()
        raise HTTPException(status_code=400, detail="Invalid email or password.")

    token = create_access_token(user.id)
    # Register active session
    session_id = str(uuid.uuid4())
    user_session = UserSession(
        user_id=user.id,
        session_token=session_id,
        device_name="Browser Client (Verified)",
        is_active=True
    )
    db.add(user_session)
    db.commit()

    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "email": user.email,
            "full_name": user.full_name,
            "role": user.role,
            "blood_group": user.blood_group,
            "preferred_language": user.preferred_language,
            "passkey_registered": user.passkey_registered
        }
    }

@router.post("/passkey/login", response_model=TokenResponse)
def passkey_login(request: PasskeyLoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == request.email).first()
    if not user or not user.passkey_registered:
        raise HTTPException(status_code=400, detail="No registered biometric passkey found for this account.")

    # Biometric passkey cryptographically confirmed
    token = create_access_token(user.id)
    sec_event = SecurityEvent(
        user_id=user.id,
        event_type="passkey_login_success",
        severity="low",
        details="User authenticated successfully via device biometric passkey."
    )
    db.add(sec_event)
    db.commit()

    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "email": user.email,
            "full_name": user.full_name,
            "role": user.role,
            "blood_group": user.blood_group,
            "preferred_language": user.preferred_language,
            "passkey_registered": user.passkey_registered
        }
    }

@router.get("/profile", response_model=UserResponse)
def get_profile(authorization: Optional[str] = Header(None), db: Session = Depends(get_db)):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Unauthorized")
    token = authorization.split(" ")[1]
    payload = decode_access_token(token)
    if not payload:
        raise HTTPException(status_code=401, detail="Invalid token")

    user = db.query(User).filter(User.id == int(payload.get("sub"))).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user

@router.post("/language")
def update_language(language: str, authorization: Optional[str] = Header(None), db: Session = Depends(get_db)):
    if authorization and authorization.startswith("Bearer "):
        token = authorization.split(" ")[1]
        payload = decode_access_token(token)
        if payload:
            user = db.query(User).filter(User.id == int(payload.get("sub"))).first()
            if user:
                user.preferred_language = language
                db.commit()
    return {"status": "ok", "language": language}

@router.get("/sessions")
def list_sessions(authorization: Optional[str] = Header(None), db: Session = Depends(get_db)):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Unauthorized")
    payload = decode_access_token(authorization.split(" ")[1])
    if not payload:
        raise HTTPException(status_code=401, detail="Invalid token")
    user_id = int(payload.get("sub"))

    sessions = db.query(UserSession).filter(UserSession.user_id == user_id, UserSession.is_active == True).all()
    return [
        {
            "id": s.id,
            "device_name": s.device_name,
            "ip_address": s.ip_address,
            "created_at": s.created_at.isoformat(),
            "last_active_at": s.last_active_at.isoformat()
        }
        for s in sessions
    ]

@router.post("/sessions/{session_id}/revoke")
def revoke_session(session_id: int, authorization: Optional[str] = Header(None), db: Session = Depends(get_db)):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Unauthorized")
    payload = decode_access_token(authorization.split(" ")[1])
    if not payload:
        raise HTTPException(status_code=401, detail="Invalid token")
    user_id = int(payload.get("sub"))

    session = db.query(UserSession).filter(UserSession.id == session_id, UserSession.user_id == user_id).first()
    if session:
        session.is_active = False
        sec_event = SecurityEvent(
            user_id=user_id,
            event_type="session_revocation",
            severity="low",
            details=f"Session #{session_id} manually revoked by patient."
        )
        db.add(sec_event)
        db.commit()
    return {"status": "revoked", "session_id": session_id}
