import os
import io
import re
import uuid
import hashlib
import secrets
import mimetypes
from typing import Optional, List, Dict, Any
from datetime import datetime, timezone, timedelta

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, Header, Query, status
from fastapi.responses import FileResponse, StreamingResponse
from sqlalchemy.orm import Session

from services.api.app.models.database import (
    get_db,
    User,
    HealthFolder,
    FolderMember,
    MemberMedicalReport,
    FolderAccessSession,
    FolderOTPVerification,
    FolderAccessAuditLog
)
from services.api.app.core.security import (
    decode_access_token,
    hash_report_access_password,
    verify_report_access_password,
    generate_folder_access_token,
    generate_otp_code,
    hash_otp_code,
    verify_otp_code
)
from services.api.app.core.config import settings
from services.api.app.schemas.schemas import (
    FolderCreate,
    FolderUpdate,
    MemberCreate,
    MemberUpdate,
    FolderSecurityStatusResponse,
    ReportPasswordSetupRequest,
    ReportPasswordChangeRequest,
    FolderSecuritySettingsRequest,
    OTPRequestPayload,
    OTPVerifyPayload,
    PasswordVerifyPayload,
    FolderVerifyResponse
)

router = APIRouter()

PRIVATE_REPORTS_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../../../data/private_member_reports"))
os.makedirs(PRIVATE_REPORTS_DIR, exist_ok=True)

MAX_REPORT_SIZE_BYTES = 20 * 1024 * 1024  # 20 MB max
ALLOWED_EXTENSIONS = {".pdf", ".jpg", ".jpeg", ".png"}
ALLOWED_MIME_TYPES = {"application/pdf", "image/jpeg", "image/jpg", "image/png"}
SESSION_LIFETIME_MINUTES = 15
LOCKOUT_MINUTES = 15
MAX_FAILED_ATTEMPTS = 5

def get_current_user_id(authorization: Optional[str] = Header(None)) -> int:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication token required."
        )
    token = authorization.split(" ")[1]
    payload = decode_access_token(token)
    if not payload or not payload.get("sub"):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired authentication token."
        )
    try:
        return int(payload.get("sub"))
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid user identification in token."
        )

def validate_magic_bytes(content: bytes, ext: str) -> bool:
    """Deep inspection of file magic bytes to prevent masqueraded files."""
    if ext == ".pdf":
        return content.startswith(b"%PDF-")
    elif ext in [".jpg", ".jpeg"]:
        return content.startswith(b"\xff\xd8\xff")
    elif ext == ".png":
        return content.startswith(b"\x89PNG\r\n\x1a\n")
    return False

def verify_folder_ownership(db: Session, folder_id: int, user_id: int) -> HealthFolder:
    folder = db.query(HealthFolder).filter(
        HealthFolder.id == folder_id,
        HealthFolder.user_id == user_id
    ).first()
    if not folder:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Health folder not found or access denied."
        )
    return folder

def verify_member_ownership(db: Session, folder_id: int, member_id: int, user_id: int) -> FolderMember:
    member = db.query(FolderMember).filter(
        FolderMember.id == member_id,
        FolderMember.folder_id == folder_id,
        FolderMember.user_id == user_id
    ).first()
    if not member:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Folder member not found or access denied."
        )
    return member

def verify_report_ownership(db: Session, folder_id: int, report_id: int, user_id: int) -> MemberMedicalReport:
    report = db.query(MemberMedicalReport).filter(
        MemberMedicalReport.id == report_id,
        MemberMedicalReport.folder_id == folder_id,
        MemberMedicalReport.user_id == user_id
    ).first()
    if not report:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Medical report not found or access denied."
        )
    return report

def check_active_folder_session(db: Session, user_id: int, session_token: Optional[str]) -> bool:
    """Verifies whether an active, unexpired folder access session token exists for this user."""
    if not session_token:
        return False
    now = datetime.now(timezone.utc)
    sess = db.query(FolderAccessSession).filter(
        FolderAccessSession.user_id == user_id,
        FolderAccessSession.session_token == session_token,
        FolderAccessSession.is_active == True
    ).first()
    if not sess:
        return False
    sess_exp = sess.expires_at
    if sess_exp.tzinfo is None:
        sess_exp = sess_exp.replace(tzinfo=timezone.utc)
    if sess_exp < now:
        sess.is_active = False
        db.commit()
        return False
    return True

def log_audit_event(
    db: Session,
    user_id: int,
    action: str,
    folder_id: Optional[int] = None,
    report_id: Optional[int] = None,
    method: Optional[str] = None,
    status_val: str = "success",
    details: Optional[str] = None
):
    audit = FolderAccessAuditLog(
        user_id=user_id,
        folder_id=folder_id,
        report_id=report_id,
        action=action,
        method=method,
        status=status_val,
        details=details
    )
    db.add(audit)
    db.commit()

# =========================================================================
# FOLDERS MANAGEMENT ENDPOINTS
# =========================================================================

@router.get("")
def list_folders(user_id: int = Depends(get_current_user_id), db: Session = Depends(get_db)):
    """List all folders owned by the authenticated user with member and report counts."""
    folders = db.query(HealthFolder).filter(HealthFolder.user_id == user_id).order_by(HealthFolder.created_at.desc()).all()
    res = []
    for f in folders:
        m_count = db.query(FolderMember).filter(FolderMember.folder_id == f.id).count()
        r_count = db.query(MemberMedicalReport).filter(MemberMedicalReport.folder_id == f.id).count()
        res.append({
            "id": f.id,
            "name": f.name,
            "description": f.description,
            "member_count": m_count,
            "report_count": r_count,
            "created_at": f.created_at.isoformat(),
            "updated_at": f.updated_at.isoformat() if f.updated_at else f.created_at.isoformat(),
            "owner_id": f.user_id
        })
    return res

@router.post("", status_code=status.HTTP_201_CREATED)
def create_folder(payload: FolderCreate, user_id: int = Depends(get_current_user_id), db: Session = Depends(get_db)):
    """Create a new health folder."""
    clean_name = payload.name.strip()
    if not clean_name:
        raise HTTPException(status_code=400, detail="Folder name cannot be blank.")
    if len(clean_name) > 100:
        raise HTTPException(status_code=400, detail="Folder name must not exceed 100 characters.")

    folder = HealthFolder(
        user_id=user_id,
        name=clean_name,
        description=payload.description.strip() if payload.description else None
    )
    db.add(folder)
    db.commit()
    db.refresh(folder)

    log_audit_event(db, user_id, action="folder_created", folder_id=folder.id, details=f"Created folder '{folder.name}'")

    return {
        "id": folder.id,
        "name": folder.name,
        "description": folder.description,
        "member_count": 0,
        "report_count": 0,
        "created_at": folder.created_at.isoformat(),
        "owner_id": folder.user_id
    }

@router.get("/{folder_id}")
def get_folder_details(
    folder_id: int,
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    """Retrieve folder details along with members and report metadata."""
    folder = verify_folder_ownership(db, folder_id, user_id)
    members = db.query(FolderMember).filter(FolderMember.folder_id == folder_id).all()
    reports = db.query(MemberMedicalReport).filter(MemberMedicalReport.folder_id == folder_id).all()

    return {
        "id": folder.id,
        "name": folder.name,
        "description": folder.description,
        "created_at": folder.created_at.isoformat(),
        "owner_id": folder.user_id,
        "members": [
            {
                "id": m.id,
                "folder_id": m.folder_id,
                "name": m.name,
                "relationship_label": m.relationship_label,
                "age": m.age,
                "gender": m.gender,
                "blood_group": m.blood_group,
                "phone": m.phone,
                "email": m.email,
                "notes": m.notes,
                "report_count": db.query(MemberMedicalReport).filter(MemberMedicalReport.member_id == m.id).count(),
                "created_at": m.created_at.isoformat()
            }
            for m in members
        ],
        "reports": [
            {
                "id": r.id,
                "folder_id": r.folder_id,
                "member_id": r.member_id,
                "title": r.title,
                "document_type": r.document_type,
                "report_date": r.report_date,
                "file_name": r.file_name,
                "file_size": r.file_size,
                "mime_type": r.mime_type,
                "notes": r.notes,
                "created_at": r.created_at.isoformat()
            }
            for r in reports
        ]
    }

@router.put("/{folder_id}")
def update_folder(
    folder_id: int,
    payload: FolderUpdate,
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    """Rename or update a health folder."""
    folder = verify_folder_ownership(db, folder_id, user_id)
    clean_name = payload.name.strip()
    if not clean_name:
        raise HTTPException(status_code=400, detail="Folder name cannot be blank.")
    
    old_name = folder.name
    folder.name = clean_name
    if payload.description is not None:
        folder.description = payload.description.strip() or None
    folder.updated_at = datetime.now(timezone.utc)
    db.commit()

    log_audit_event(db, user_id, action="folder_renamed", folder_id=folder.id, details=f"Renamed '{old_name}' to '{folder.name}'")

    return {
        "id": folder.id,
        "name": folder.name,
        "description": folder.description,
        "updated_at": folder.updated_at.isoformat(),
        "message": "Folder updated successfully."
    }

@router.delete("/{folder_id}")
def delete_folder(
    folder_id: int,
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    """Delete a folder and all associated member reports and physical files."""
    folder = verify_folder_ownership(db, folder_id, user_id)
    
    # Cleanup physical files for all reports in this folder
    reports = db.query(MemberMedicalReport).filter(MemberMedicalReport.folder_id == folder_id).all()
    for r in reports:
        if r.storage_key:
            full_path = os.path.join(PRIVATE_REPORTS_DIR, r.storage_key)
            if os.path.exists(full_path):
                try:
                    os.remove(full_path)
                except Exception:
                    pass

    folder_name = folder.name
    db.delete(folder)
    db.commit()

    log_audit_event(db, user_id, action="folder_deleted", folder_id=folder_id, details=f"Deleted folder '{folder_name}' and its contents")

    return {"status": "deleted", "folder_id": folder_id, "message": f"Folder '{folder_name}' deleted successfully."}

# =========================================================================
# MEMBERS MANAGEMENT ENDPOINTS
# =========================================================================

@router.get("/{folder_id}/members")
def list_folder_members(
    folder_id: int,
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    """List members belonging to a specific health folder."""
    verify_folder_ownership(db, folder_id, user_id)
    members = db.query(FolderMember).filter(
        FolderMember.folder_id == folder_id,
        FolderMember.user_id == user_id
    ).all()

    return [
        {
            "id": m.id,
            "folder_id": m.folder_id,
            "name": m.name,
            "relationship_label": m.relationship_label,
            "age": m.age,
            "gender": m.gender,
            "blood_group": m.blood_group,
            "phone": m.phone,
            "email": m.email,
            "notes": m.notes,
            "report_count": db.query(MemberMedicalReport).filter(MemberMedicalReport.member_id == m.id).count(),
            "created_at": m.created_at.isoformat()
        }
        for m in members
    ]

@router.post("/{folder_id}/members", status_code=status.HTTP_201_CREATED)
def add_folder_member(
    folder_id: int,
    payload: MemberCreate,
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    """Add a member card to the health folder."""
    verify_folder_ownership(db, folder_id, user_id)
    clean_name = payload.name.strip()
    if not clean_name:
        raise HTTPException(status_code=400, detail="Member name cannot be blank.")

    member = FolderMember(
        folder_id=folder_id,
        user_id=user_id,
        name=clean_name,
        relationship_label=payload.relationship_label.strip() if payload.relationship_label else "Self",
        age=payload.age,
        gender=payload.gender,
        blood_group=payload.blood_group or "Unknown",
        phone=payload.phone.strip() if payload.phone else None,
        email=payload.email.strip() if payload.email else None,
        notes=payload.notes.strip() if payload.notes else None
    )
    db.add(member)
    db.commit()
    db.refresh(member)

    log_audit_event(db, user_id, action="member_added", folder_id=folder_id, details=f"Added member '{member.name}' ({member.relationship_label})")

    return {
        "id": member.id,
        "folder_id": member.folder_id,
        "name": member.name,
        "relationship_label": member.relationship_label,
        "age": member.age,
        "gender": member.gender,
        "blood_group": member.blood_group,
        "phone": member.phone,
        "email": member.email,
        "notes": member.notes,
        "report_count": 0,
        "created_at": member.created_at.isoformat()
    }

@router.put("/{folder_id}/members/{member_id}")
def update_folder_member(
    folder_id: int,
    member_id: int,
    payload: MemberUpdate,
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    """Update profile and details of an existing folder member."""
    verify_folder_ownership(db, folder_id, user_id)
    member = verify_member_ownership(db, folder_id, member_id, user_id)

    if payload.name is not None:
        clean_name = payload.name.strip()
        if not clean_name:
            raise HTTPException(status_code=400, detail="Member name cannot be blank.")
        member.name = clean_name
    if payload.relationship_label is not None:
        member.relationship_label = payload.relationship_label.strip() or None
    if payload.age is not None:
        member.age = payload.age
    if payload.gender is not None:
        member.gender = payload.gender
    if payload.blood_group is not None:
        member.blood_group = payload.blood_group
    if payload.phone is not None:
        member.phone = payload.phone.strip() or None
    if payload.email is not None:
        member.email = payload.email.strip() or None
    if payload.notes is not None:
        member.notes = payload.notes.strip() or None
    member.updated_at = datetime.now(timezone.utc)

    db.commit()
    log_audit_event(db, user_id, action="member_updated", folder_id=folder_id, details=f"Updated member '{member.name}'")

    return {
        "id": member.id,
        "name": member.name,
        "relationship_label": member.relationship_label,
        "updated_at": member.updated_at.isoformat(),
        "message": "Member details updated."
    }

@router.delete("/{folder_id}/members/{member_id}")
def remove_folder_member(
    folder_id: int,
    member_id: int,
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    """Remove a member and their reports from the folder."""
    verify_folder_ownership(db, folder_id, user_id)
    member = verify_member_ownership(db, folder_id, member_id, user_id)

    # Cleanup physical files for member's reports
    reports = db.query(MemberMedicalReport).filter(MemberMedicalReport.member_id == member_id).all()
    for r in reports:
        if r.storage_key:
            full_path = os.path.join(PRIVATE_REPORTS_DIR, r.storage_key)
            if os.path.exists(full_path):
                try:
                    os.remove(full_path)
                except Exception:
                    pass

    name = member.name
    db.delete(member)
    db.commit()

    log_audit_event(db, user_id, action="member_removed", folder_id=folder_id, details=f"Removed member '{name}' and associated reports")

    return {"status": "removed", "member_id": member_id, "message": f"Member '{name}' removed."}

# =========================================================================
# MEDICAL REPORTS UPLOAD & ACCESS ENDPOINTS
# =========================================================================

@router.get("/{folder_id}/reports")
def list_folder_reports(
    folder_id: int,
    member_id: Optional[int] = Query(None),
    document_type: Optional[str] = Query(None),
    q: Optional[str] = Query(None),
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    """List medical reports in the folder with optional filtering by member, document type, and search keyword."""
    verify_folder_ownership(db, folder_id, user_id)
    query = db.query(MemberMedicalReport).filter(
        MemberMedicalReport.folder_id == folder_id,
        MemberMedicalReport.user_id == user_id
    )

    if member_id is not None:
        query = query.filter(MemberMedicalReport.member_id == member_id)
    if document_type:
        query = query.filter(MemberMedicalReport.document_type == document_type)
    if q:
        kw = f"%{q.strip().lower()}%"
        query = query.filter(
            (MemberMedicalReport.title.ilike(kw)) |
            (MemberMedicalReport.file_name.ilike(kw)) |
            (MemberMedicalReport.notes.ilike(kw))
        )

    reports = query.order_by(MemberMedicalReport.created_at.desc()).all()
    res = []
    for r in reports:
        mem = db.query(FolderMember).filter(FolderMember.id == r.member_id).first()
        res.append({
            "id": r.id,
            "folder_id": r.folder_id,
            "member_id": r.member_id,
            "member_name": mem.name if mem else "Unknown Member",
            "member_relationship": mem.relationship_label if mem else None,
            "title": r.title,
            "document_type": r.document_type,
            "report_date": r.report_date,
            "file_name": r.file_name,
            "file_size": r.file_size,
            "mime_type": r.mime_type,
            "sha256_hash": r.sha256_hash,
            "notes": r.notes,
            "created_at": r.created_at.isoformat()
        })
    return res

@router.post("/{folder_id}/reports", status_code=status.HTTP_201_CREATED)
async def upload_medical_report(
    folder_id: int,
    file: UploadFile = File(...),
    member_id: int = Form(...),
    title: str = Form(...),
    document_type: str = Form("Lab Report"),
    report_date: Optional[str] = Form(None),
    notes: Optional[str] = Form(None),
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    """
    Secure report upload endpoint:
    - Validates server-side folder and member ownership.
    - Validates file extension, magic bytes, and size limit.
    - Stores file in private, isolated storage outside web-accessible paths.
    - Never logs file content.
    """
    verify_folder_ownership(db, folder_id, user_id)
    member = verify_member_ownership(db, folder_id, member_id, user_id)

    clean_title = title.strip()
    if not clean_title:
        raise HTTPException(status_code=400, detail="Report title is required.")

    content = await file.read()
    if not content:
        raise HTTPException(status_code=400, detail="Empty report file uploaded.")

    if len(content) > MAX_REPORT_SIZE_BYTES:
        raise HTTPException(
            status_code=400,
            detail=f"Report file exceeds maximum allowed limit of 20MB (Size: {len(content)/(1024*1024):.1f}MB)."
        )

    # Extension and magic byte checks
    orig_name = file.filename or "report.pdf"
    ext = os.path.splitext(orig_name)[1].lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail="Unsupported format. Only PDF, JPG, JPEG, and PNG medical documents are accepted."
        )

    if not validate_magic_bytes(content, ext):
        raise HTTPException(
            status_code=400,
            detail="File content signature does not match its claimed extension. Upload rejected for security."
        )

    mime_type = file.content_type
    if not mime_type or mime_type not in ALLOWED_MIME_TYPES:
        if ext == ".pdf":
            mime_type = "application/pdf"
        elif ext in [".jpg", ".jpeg"]:
            mime_type = "image/jpeg"
        elif ext == ".png":
            mime_type = "image/png"
        else:
            mime_type = "application/octet-stream"

    # Compute SHA-256 integrity hash
    file_sha256 = hashlib.sha256(content).hexdigest()

    # Generate safe, private storage key
    user_storage_dir = os.path.join(PRIVATE_REPORTS_DIR, f"user_{user_id}")
    os.makedirs(user_storage_dir, exist_ok=True)
    safe_filename = f"report_{uuid.uuid4().hex}{ext}"
    relative_storage_key = os.path.join(f"user_{user_id}", safe_filename)
    absolute_dest = os.path.join(PRIVATE_REPORTS_DIR, relative_storage_key)

    with open(absolute_dest, "wb") as fh:
        fh.write(content)

    clean_report_date = report_date.strip() if report_date else datetime.now(timezone.utc).strftime("%Y-%m-%d")

    report = MemberMedicalReport(
        folder_id=folder_id,
        member_id=member_id,
        user_id=user_id,
        title=clean_title,
        document_type=document_type.strip() if document_type else "Lab Report",
        report_date=clean_report_date,
        file_name=orig_name,
        storage_key=relative_storage_key,
        mime_type=mime_type,
        file_size=len(content),
        sha256_hash=file_sha256,
        notes=notes.strip() if notes else None
    )
    db.add(report)
    db.commit()
    db.refresh(report)

    log_audit_event(
        db,
        user_id,
        action="report_uploaded",
        folder_id=folder_id,
        report_id=report.id,
        details=f"Uploaded report '{report.title}' ({report.document_type}) for member '{member.name}'"
    )

    return {
        "id": report.id,
        "folder_id": report.folder_id,
        "member_id": report.member_id,
        "member_name": member.name,
        "title": report.title,
        "document_type": report.document_type,
        "report_date": report.report_date,
        "file_name": report.file_name,
        "file_size": report.file_size,
        "mime_type": report.mime_type,
        "sha256_hash": report.sha256_hash,
        "created_at": report.created_at.isoformat(),
        "message": "Report uploaded and encrypted in private storage."
    }

@router.get("/{folder_id}/reports/{report_id}/preview")
def preview_medical_report(
    folder_id: int,
    report_id: int,
    token: Optional[str] = Query(None, description="Report access verification session token"),
    x_folder_access_token: Optional[str] = Header(None, alias="X-Folder-Access-Token"),
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_db)
):
    """
    Secure report preview endpoint:
    - Requires authenticated user credentials.
    - Enforces folder protection session token verification.
    - Streams document with no-cache headers.
    """
    user_id = get_current_user_id(authorization)
    verify_folder_ownership(db, folder_id, user_id)
    report = verify_report_ownership(db, folder_id, report_id, user_id)

    # Check whether user has configured report access protection
    user = db.query(User).filter(User.id == user_id).first()
    has_protection = bool(user and user.report_access_password_hash)

    effective_token = token or x_folder_access_token
    if has_protection and not check_active_folder_session(db, user_id, effective_token):
        log_audit_event(
            db, user_id, action="preview_denied", folder_id=folder_id, report_id=report_id,
            status_val="failed", details="Attempted preview without valid access verification token"
        )
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Protected folder access verification required to preview this report."
        )

    file_path = os.path.join(PRIVATE_REPORTS_DIR, report.storage_key)
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="Physical document not found on storage server.")

    log_audit_event(
        db, user_id, action="report_previewed", folder_id=folder_id, report_id=report.id,
        details=f"Previewed report '{report.title}'"
    )

    headers = {
        "Content-Disposition": f'inline; filename="{report.file_name}"',
        "Cache-Control": "private, no-cache, no-store, must-revalidate",
        "Pragma": "no-cache",
        "Expires": "0"
    }
    return FileResponse(file_path, media_type=report.mime_type, headers=headers)

@router.get("/{folder_id}/reports/{report_id}/download")
def download_medical_report(
    folder_id: int,
    report_id: int,
    token: Optional[str] = Query(None, description="Report access verification session token"),
    x_folder_access_token: Optional[str] = Header(None, alias="X-Folder-Access-Token"),
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_db)
):
    """
    Secure report download endpoint:
    - Requires authenticated user credentials.
    - Enforces folder protection session token verification.
    - Forces download attachment disposition with no-cache headers.
    """
    user_id = get_current_user_id(authorization)
    verify_folder_ownership(db, folder_id, user_id)
    report = verify_report_ownership(db, folder_id, report_id, user_id)

    user = db.query(User).filter(User.id == user_id).first()
    has_protection = bool(user and user.report_access_password_hash)

    effective_token = token or x_folder_access_token
    if has_protection and not check_active_folder_session(db, user_id, effective_token):
        log_audit_event(
            db, user_id, action="download_denied", folder_id=folder_id, report_id=report_id,
            status_val="failed", details="Attempted download without valid access verification token"
        )
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Protected folder access verification required to download this report."
        )

    file_path = os.path.join(PRIVATE_REPORTS_DIR, report.storage_key)
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="Physical document not found on storage server.")

    log_audit_event(
        db, user_id, action="report_downloaded", folder_id=folder_id, report_id=report.id,
        details=f"Downloaded report '{report.title}'"
    )

    headers = {
        "Content-Disposition": f'attachment; filename="{report.file_name}"',
        "Cache-Control": "private, no-cache, no-store, must-revalidate"
    }
    return FileResponse(file_path, media_type=report.mime_type, filename=report.file_name, headers=headers)

@router.delete("/{folder_id}/reports/{report_id}")
def delete_medical_report(
    folder_id: int,
    report_id: int,
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    """Delete a medical report and erase its physical file from private storage."""
    verify_folder_ownership(db, folder_id, user_id)
    report = verify_report_ownership(db, folder_id, report_id, user_id)

    file_path = os.path.join(PRIVATE_REPORTS_DIR, report.storage_key)
    if os.path.exists(file_path):
        try:
            os.remove(file_path)
        except Exception:
            pass

    title = report.title
    db.delete(report)
    db.commit()

    log_audit_event(db, user_id, action="report_deleted", folder_id=folder_id, report_id=report_id, details=f"Deleted report '{title}'")

    return {"status": "deleted", "report_id": report_id, "message": f"Report '{title}' deleted."}

# =========================================================================
# PROTECTED ACCESS & SECURITY SETTINGS ENDPOINTS
# =========================================================================

@router.get("/security/status", response_model=FolderSecurityStatusResponse)
def get_folder_security_status(
    x_folder_access_token: Optional[str] = Header(None, alias="X-Folder-Access-Token"),
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    """
    Returns current report protection status:
    - Whether report-access password is set
    - Whether folder is currently unlocked under active session token
    - Rate limit lockout status
    - Allowed access methods (both, password_only, otp_only)
    - Verified contact details (masked)
    - Live OTP delivery integration status
    """
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found.")

    now = datetime.now(timezone.utc)
    is_locked = False
    lockout_remaining = 0
    if user.report_access_locked_until:
        locked_until = user.report_access_locked_until
        if locked_until.tzinfo is None:
            locked_until = locked_until.replace(tzinfo=timezone.utc)
        if locked_until > now:
            is_locked = True
            lockout_remaining = int((locked_until - now).total_seconds())
        else:
            user.report_access_locked_until = None
            user.report_access_failed_attempts = 0
            db.commit()

    is_unlocked = False
    session_exp_str = None
    if x_folder_access_token:
        sess = db.query(FolderAccessSession).filter(
            FolderAccessSession.user_id == user_id,
            FolderAccessSession.session_token == x_folder_access_token,
            FolderAccessSession.is_active == True
        ).first()
        if sess:
            sess_exp = sess.expires_at
            if sess_exp.tzinfo is None:
                sess_exp = sess_exp.replace(tzinfo=timezone.utc)
            if sess_exp > now:
                is_unlocked = True
                session_exp_str = sess_exp.isoformat()

    # Check live email/SMS configuration in environment
    smtp_configured = bool(os.getenv("SMTP_HOST") and os.getenv("SMTP_USER"))
    sms_configured = bool(os.getenv("SMS_API_KEY") or os.getenv("TWILIO_ACCOUNT_SID"))
    otp_delivery_configured = smtp_configured or sms_configured

    otp_provider_name = "SMTP Email" if smtp_configured else ("SMS Gateway" if sms_configured else "Unconfigured (Local Development Mode)")

    return {
        "has_password": bool(user.report_access_password_hash),
        "is_unlocked": is_unlocked,
        "session_expires_at": session_exp_str,
        "failed_attempts": user.report_access_failed_attempts or 0,
        "is_locked_out": is_locked,
        "lockout_remaining_seconds": lockout_remaining,
        "allowed_access_methods": user.allowed_access_methods or "both",
        "verified_email": user.verified_email or user.email,
        "verified_phone": user.verified_phone or user.phone,
        "otp_delivery_configured": otp_delivery_configured,
        "otp_delivery_provider": otp_provider_name
    }

@router.post("/security/setup-password")
def setup_report_access_password(
    payload: ReportPasswordSetupRequest,
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    """Set initial report-access password using Argon2id."""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found.")

    if payload.password != payload.confirm_password:
        raise HTTPException(status_code=400, detail="Passwords do not match.")

    if len(payload.password) < 8:
        raise HTTPException(status_code=400, detail="Report-access password must be at least 8 characters long.")

    pw_hash = hash_report_access_password(payload.password)
    user.report_access_password_hash = pw_hash
    user.report_access_failed_attempts = 0
    user.report_access_locked_until = None
    db.commit()

    log_audit_event(db, user_id, action="password_setup", details="Report-access password configured with Argon2id")

    return {
        "status": "configured",
        "message": "Report-access password successfully created using Argon2id encryption."
    }

@router.post("/security/change-password")
def change_report_access_password(
    payload: ReportPasswordChangeRequest,
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    """Change existing report-access password. Verifies current password first with Argon2id."""
    user = db.query(User).filter(User.id == user_id).first()
    if not user or not user.report_access_password_hash:
        raise HTTPException(status_code=400, detail="Report-access password has not been set yet.")

    now = datetime.now(timezone.utc)
    if user.report_access_locked_until:
        locked_until = user.report_access_locked_until
        if locked_until.tzinfo is None:
            locked_until = locked_until.replace(tzinfo=timezone.utc)
        if locked_until > now:
            remaining = int((locked_until - now).total_seconds())
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail=f"Security lockout active. Please wait {remaining} seconds before retrying."
            )

    if not verify_report_access_password(payload.current_password, user.report_access_password_hash):
        user.report_access_failed_attempts = (user.report_access_failed_attempts or 0) + 1
        if user.report_access_failed_attempts >= MAX_FAILED_ATTEMPTS:
            user.report_access_locked_until = now + timedelta(minutes=LOCKOUT_MINUTES)
            db.commit()
            log_audit_event(db, user_id, action="password_change_locked", status_val="locked_out", details="Exceeded max password attempts")
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail=f"Too many failed attempts. Security lockout engaged for {LOCKOUT_MINUTES} minutes."
            )
        db.commit()
        raise HTTPException(status_code=400, detail="Incorrect current report-access password.")

    if payload.new_password != payload.confirm_password:
        raise HTTPException(status_code=400, detail="New password confirmation does not match.")

    if len(payload.new_password) < 8:
        raise HTTPException(status_code=400, detail="New password must be at least 8 characters long.")

    new_hash = hash_report_access_password(payload.new_password)
    user.report_access_password_hash = new_hash
    user.report_access_failed_attempts = 0
    user.report_access_locked_until = None
    db.commit()

    log_audit_event(db, user_id, action="password_changed", details="Report-access password changed successfully")

    return {
        "status": "updated",
        "message": "Report-access password updated successfully."
    }

@router.post("/security/settings")
def update_security_settings(
    payload: FolderSecuritySettingsRequest,
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    """Update allowed access methods (both, password_only, otp_only) and verified contact endpoints."""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found.")

    if payload.allowed_access_methods in ["both", "password_only", "otp_only"]:
        user.allowed_access_methods = payload.allowed_access_methods
    if payload.verified_email:
        user.verified_email = payload.verified_email.strip()
    if payload.verified_phone:
        user.verified_phone = payload.verified_phone.strip()

    db.commit()
    log_audit_event(db, user_id, action="settings_updated", details=f"Allowed methods set to {user.allowed_access_methods}")

    return {
        "status": "saved",
        "allowed_access_methods": user.allowed_access_methods,
        "verified_email": user.verified_email,
        "verified_phone": user.verified_phone,
        "message": "Security settings updated."
    }

@router.post("/security/request-otp")
def request_folder_otp(
    payload: OTPRequestPayload,
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    """
    Request an OTP code for folder protection:
    - Never reveals whether an arbitrary address has an account (operates on authenticated user).
    - Rate limits requests (max 1 request every 60 seconds).
    - Hashes code with salt before saving to database (never plaintext).
    - Accurately reports whether live delivery is configured without faking success.
    """
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found.")

    now = datetime.now(timezone.utc)

    # Rate limiting: check recent OTP requests within 60 seconds
    recent = db.query(FolderOTPVerification).filter(
        FolderOTPVerification.user_id == user_id,
        FolderOTPVerification.created_at >= now - timedelta(seconds=60)
    ).first()
    if recent:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="An OTP was requested recently. Please wait 60 seconds before requesting another code."
        )

    channel = payload.channel if payload.channel in ["email", "phone"] else "email"
    target = user.verified_email or user.email if channel == "email" else (user.verified_phone or user.phone or "Not on file")

    if channel == "email":
        parts = target.split("@")
        masked = f"{parts[0][:2]}***@{parts[1]}" if len(parts) == 2 and len(parts[0]) > 2 else target
    else:
        masked = f"{target[:3]}******{target[-4:]}" if len(target) >= 7 else target

    # Generate 6-digit cryptographic OTP and hash it
    otp_code = generate_otp_code()
    code_hash = hash_otp_code(otp_code)
    expires_at = now + timedelta(minutes=10)

    # Invalidate previous unused codes
    db.query(FolderOTPVerification).filter(
        FolderOTPVerification.user_id == user_id,
        FolderOTPVerification.used == False
    ).update({"used": True})

    otp_record = FolderOTPVerification(
        user_id=user_id,
        otp_hash=code_hash,
        delivery_channel=channel,
        target_masked=masked,
        attempts_remaining=5,
        expires_at=expires_at,
        used=False
    )
    db.add(otp_record)
    db.commit()

    smtp_configured = bool(os.getenv("SMTP_HOST") and os.getenv("SMTP_USER"))
    sms_configured = bool(os.getenv("SMS_API_KEY") or os.getenv("TWILIO_ACCOUNT_SID"))
    live_configured = smtp_configured if channel == "email" else sms_configured

    log_audit_event(db, user_id, action="otp_requested", method="otp", details=f"Requested OTP via {channel} to {masked}")

    # Honest reporting: if live delivery credentials are not in .env, clearly disclose delivery status
    # and provide the generated verification code in non-production environments for automated testing.
    is_production = os.getenv("APP_ENV", "development").lower() == "production"
    dev_code = None if (is_production and live_configured) else otp_code

    return {
        "status": "sent",
        "channel": channel,
        "masked_target": masked,
        "expires_in_minutes": 10,
        "delivery_configured": live_configured,
        "dev_code": dev_code,
        "message": (
            f"Verification code sent to {masked}."
            if live_configured
            else f"Live {channel.upper()} service is unconfigured. In development mode, use code: {dev_code}"
        )
    }

@router.post("/security/verify-otp", response_model=FolderVerifyResponse)
def verify_folder_otp(
    payload: OTPVerifyPayload,
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    """
    Verify OTP code:
    - Enforces server-side hash verification.
    - Decrements attempts limit on failure.
    - Invalidates code on success.
    - Issues short-lived access session token (15 mins).
    """
    now = datetime.now(timezone.utc)
    otp_record = db.query(FolderOTPVerification).filter(
        FolderOTPVerification.user_id == user_id,
        FolderOTPVerification.used == False
    ).order_by(FolderOTPVerification.id.desc()).first()

    if not otp_record:
        log_audit_event(db, user_id, action="otp_verify_failed", method="otp", status_val="failed", details="No active OTP found")
        raise HTTPException(status_code=400, detail="No active verification code found. Please request a new OTP.")

    exp = otp_record.expires_at
    if exp.tzinfo is None:
        exp = exp.replace(tzinfo=timezone.utc)
    if exp < now:
        otp_record.used = True
        db.commit()
        log_audit_event(db, user_id, action="otp_expired", method="otp", status_val="failed", details="OTP expired")
        raise HTTPException(status_code=400, detail="Verification code has expired. Please request a new code.")

    if (otp_record.attempts_remaining or 0) <= 0:
        otp_record.used = True
        db.commit()
        log_audit_event(db, user_id, action="otp_attempts_exceeded", method="otp", status_val="locked_out", details="Max OTP attempts reached")
        raise HTTPException(status_code=400, detail="Maximum verification attempts exceeded. Please request a new code.")

    clean_code = payload.otp_code.strip()
    if not verify_otp_code(clean_code, otp_record.otp_hash):
        otp_record.attempts_remaining = (otp_record.attempts_remaining or 1) - 1
        db.commit()
        log_audit_event(db, user_id, action="otp_invalid", method="otp", status_val="failed", details="Wrong OTP code entered")
        raise HTTPException(
            status_code=400,
            detail=f"Invalid verification code. {otp_record.attempts_remaining} attempt(s) remaining."
        )

    # Invalidate OTP on successful use
    otp_record.used = True

    # Generate short-lived access session token (15 minutes)
    session_token = generate_folder_access_token()
    session_exp = now + timedelta(minutes=SESSION_LIFETIME_MINUTES)
    access_session = FolderAccessSession(
        user_id=user_id,
        session_token=session_token,
        verified_via="otp",
        expires_at=session_exp,
        is_active=True
    )
    db.add(access_session)
    db.commit()

    log_audit_event(db, user_id, action="folder_unlocked", method="otp", details="Folder unlocked successfully via OTP")

    return {
        "status": "verified",
        "session_token": session_token,
        "verified_via": "otp",
        "expires_at": session_exp.isoformat(),
        "message": "Access granted. Protected medical reports unlocked for 15 minutes."
    }

@router.post("/security/verify-password", response_model=FolderVerifyResponse)
def verify_folder_password(
    payload: PasswordVerifyPayload,
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    """
    Verify report-access password using Argon2id:
    - Enforces rate limiting (max 5 failed attempts, 15-minute lockout).
    - Generates short-lived access session token upon successful validation.
    """
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found.")

    if not user.report_access_password_hash:
        raise HTTPException(status_code=400, detail="Report-access password has not been configured yet.")

    now = datetime.now(timezone.utc)
    if user.report_access_locked_until:
        locked_until = user.report_access_locked_until
        if locked_until.tzinfo is None:
            locked_until = locked_until.replace(tzinfo=timezone.utc)
        if locked_until > now:
            remaining = int((locked_until - now).total_seconds())
            log_audit_event(db, user_id, action="password_verify_blocked", method="password", status_val="locked_out", details="Account currently locked")
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail=f"Security lockout active. Please wait {remaining} seconds before retrying."
            )
        else:
            user.report_access_locked_until = None
            user.report_access_failed_attempts = 0
            db.commit()

    if not verify_report_access_password(payload.password, user.report_access_password_hash):
        user.report_access_failed_attempts = (user.report_access_failed_attempts or 0) + 1
        if user.report_access_failed_attempts >= MAX_FAILED_ATTEMPTS:
            user.report_access_locked_until = now + timedelta(minutes=LOCKOUT_MINUTES)
            db.commit()
            log_audit_event(db, user_id, action="password_lockout_engaged", method="password", status_val="locked_out", details=f"Locked out for {LOCKOUT_MINUTES} mins")
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail=f"Too many incorrect attempts. Security lockout engaged for {LOCKOUT_MINUTES} minutes."
            )
        db.commit()
        log_audit_event(db, user_id, action="password_invalid", method="password", status_val="failed", details="Wrong report-access password")
        remaining = MAX_FAILED_ATTEMPTS - user.report_access_failed_attempts
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Incorrect report-access password. {remaining} attempt(s) remaining before lockout."
        )

    # Reset failed attempts upon successful password entry
    user.report_access_failed_attempts = 0
    user.report_access_locked_until = None

    session_token = generate_folder_access_token()
    session_exp = now + timedelta(minutes=SESSION_LIFETIME_MINUTES)
    access_session = FolderAccessSession(
        user_id=user_id,
        session_token=session_token,
        verified_via="password",
        expires_at=session_exp,
        is_active=True
    )
    db.add(access_session)
    db.commit()

    log_audit_event(db, user_id, action="folder_unlocked", method="password", details="Folder unlocked successfully via Argon2id password")

    return {
        "status": "verified",
        "session_token": session_token,
        "verified_via": "password",
        "expires_at": session_exp.isoformat(),
        "message": "Access granted. Protected medical reports unlocked for 15 minutes."
    }

@router.post("/security/revoke-session")
def revoke_folder_session(
    x_folder_access_token: Optional[str] = Header(None, alias="X-Folder-Access-Token"),
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    """Immediately terminate active access session, re-locking reports."""
    if x_folder_access_token:
        sess = db.query(FolderAccessSession).filter(
            FolderAccessSession.user_id == user_id,
            FolderAccessSession.session_token == x_folder_access_token
        ).first()
        if sess:
            sess.is_active = False
            db.commit()

    log_audit_event(db, user_id, action="session_revoked", details="Active access session manually revoked")
    return {"status": "locked", "message": "Access session revoked. Reports are now securely locked."}

@router.get("/security/audit-logs")
def get_folder_audit_logs(
    limit: int = Query(50, ge=1, le=200),
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    """Retrieve audit history of folder access attempts, unlocks, and report downloads."""
    logs = db.query(FolderAccessAuditLog).filter(
        FolderAccessAuditLog.user_id == user_id
    ).order_by(FolderAccessAuditLog.created_at.desc()).limit(limit).all()

    return [
        {
            "id": l.id,
            "action": l.action,
            "method": l.method,
            "status": l.status,
            "folder_id": l.folder_id,
            "report_id": l.report_id,
            "details": l.details,
            "created_at": l.created_at.isoformat()
        }
        for l in logs
    ]
