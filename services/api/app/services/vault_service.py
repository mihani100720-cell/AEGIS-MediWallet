import os
import io
import hashlib
import secrets
from datetime import datetime, timezone, timedelta
from typing import Tuple, Optional, Dict, Any
from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.models.database import User, MedicalRecord, VaultSession, AccessAuditLog
from app.core.security import (
    hash_vault_password,
    verify_vault_password,
    generate_vault_session_token
)
from app.core.config import settings

VAULT_STORAGE_BASE = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../../data/vault_storage"))
MAX_FILE_SIZE_BYTES = 15 * 1024 * 1024  # 15 MB
MAX_FAILED_ATTEMPTS = 5
LOCKOUT_MINUTES = 15
SESSION_LIFETIME_MINUTES = 15

# Supported magic byte signatures
MAGIC_SIGNATURES = {
    "pdf": b"%PDF-",
    "jpeg": b"\xff\xd8\xff",
    "png": b"\x89PNG\r\n\x1a\n"
}

class VaultSecurityService:
    """
    Secure Medical Records Vault Service.
    Enforces real server-side access controls, memory-hard password verification,
    private isolated storage, and rate-limited session authentication.
    """

    @classmethod
    def ensure_storage_dir(cls, user_id: int) -> str:
        user_dir = os.path.join(VAULT_STORAGE_BASE, f"user_{user_id}")
        os.makedirs(user_dir, exist_ok=True)
        return user_dir

    @classmethod
    def validate_file_security(cls, filename: str, content: bytes) -> Tuple[str, str]:
        """
        Validates file size, extension, and deep magic-byte file signature.
        Returns: (normalized_mime_type, normalized_extension)
        """
        if not content:
            raise HTTPException(status_code=400, detail="Empty document file uploaded.")

        if len(content) > MAX_FILE_SIZE_BYTES:
            raise HTTPException(
                status_code=400,
                detail=f"File exceeds maximum allowed size of 15MB (Current: {len(content)/(1024*1024):.1f}MB)."
            )

        # Extension check
        ext = os.path.splitext(filename)[1].lower()
        if ext not in [".pdf", ".jpg", ".jpeg", ".png"]:
            raise HTTPException(
                status_code=400,
                detail="Unsupported file format. The Medical Vault strictly accepts PDF, JPG, JPEG, and PNG."
            )

        # Magic byte signature verification
        is_valid = False
        mime_type = "application/octet-stream"

        if ext == ".pdf":
            if content.startswith(b"%PDF"):
                is_valid = True
                mime_type = "application/pdf"
        elif ext in [".jpg", ".jpeg"]:
            if content.startswith(b"\xff\xd8\xff"):
                is_valid = True
                mime_type = "image/jpeg"
        elif ext == ".png":
            if content.startswith(b"\x89PNG\r\n\x1a\n"):
                is_valid = True
                mime_type = "image/png"

        if not is_valid:
            raise HTTPException(
                status_code=400,
                detail="File content does not match its claimed file extension. Upload rejected for security."
            )

        # Check for dangerous embedded scripts in files
        sample = content[:4096].lower()
        if b"<script" in sample or b"<?php" in sample or b"<% " in sample:
            raise HTTPException(
                status_code=400,
                detail="Malicious script signature detected in document. Upload aborted."
            )

        return mime_type, ext

    @classmethod
    def store_file_privately(cls, user_id: int, filename: str, content: bytes) -> Tuple[str, str, int, str]:
        """
        Stores file in private, unexposed directory using high-entropy random storage key.
        Returns: (storage_key, mime_type, file_size, sha256_hash)
        """
        mime_type, ext = cls.validate_file_security(filename, content)
        sha256_hash = hashlib.sha256(content).hexdigest()

        # Generate safe storage key
        storage_key = f"{secrets.token_hex(16)}_{sha256_hash[:12]}{ext}"
        user_dir = cls.ensure_storage_dir(user_id)
        filepath = os.path.join(user_dir, storage_key)

        with open(filepath, "wb") as f:
            f.write(content)

        return storage_key, mime_type, len(content), sha256_hash

    @classmethod
    def delete_file_privately(cls, user_id: int, storage_key: str) -> bool:
        """
        Deletes physical file from private disk storage immediately.
        """
        if not storage_key:
            return False
        user_dir = cls.ensure_storage_dir(user_id)
        filepath = os.path.join(user_dir, storage_key)
        if os.path.exists(filepath):
            try:
                os.remove(filepath)
                return True
            except Exception as e:
                print(f"Error deleting physical file {filepath}: {e}")
        return False

    @classmethod
    def get_private_filepath(cls, user_id: int, storage_key: str) -> str:
        """
        Resolves safe absolute path to private file and validates path traversal prevention.
        """
        user_dir = cls.ensure_storage_dir(user_id)
        filepath = os.path.abspath(os.path.join(user_dir, storage_key))
        if not filepath.startswith(user_dir):
            raise HTTPException(status_code=403, detail="Illegal path traversal attempt.")
        if not os.path.exists(filepath):
            raise HTTPException(status_code=404, detail="Document content not found on server storage.")
        return filepath

    # ==================== PASSWORD & SESSION MANAGEMENT ====================

    @classmethod
    def check_user_vault_status(cls, user: User, session_token: Optional[str], db: Session) -> Dict[str, Any]:
        """
        Returns real vault status: password configured, unlocked, lockouts.
        """
        now = datetime.now(timezone.utc)
        is_locked_out = False
        lockout_remaining_seconds = 0

        if user.vault_locked_until:
            v_locked = user.vault_locked_until
            if v_locked.tzinfo is None:
                v_locked = v_locked.replace(tzinfo=timezone.utc)
            if v_locked > now:
                is_locked_out = True
                lockout_remaining_seconds = int((v_locked - now).total_seconds())
            else:
                # Lockout period passed, reset
                user.vault_locked_until = None
                user.vault_failed_attempts = 0
                db.commit()

        # Check if active session token exists
        is_unlocked = False
        timeout_seconds = 0
        if session_token:
            sess = db.query(VaultSession).filter(
                VaultSession.session_token == session_token,
                VaultSession.user_id == user.id,
                VaultSession.is_active == True
            ).first()
            if sess:
                sess_exp = sess.expires_at
                if sess_exp.tzinfo is None:
                    sess_exp = sess_exp.replace(tzinfo=timezone.utc)
                if sess_exp > now:
                    is_unlocked = True
                    timeout_seconds = int((sess_exp - now).total_seconds())
                else:
                    sess.is_active = False
                    db.commit()

        has_password = bool(user.vault_password_hash)
        # Count total records for dashboard overview
        total_docs = db.query(MedicalRecord).filter(MedicalRecord.user_id == user.id).count()

        return {
            "has_vault_password": has_password,
            "is_unlocked": is_unlocked,
            "timeout_seconds": timeout_seconds,
            "is_locked_out": is_locked_out,
            "lockout_remaining_seconds": lockout_remaining_seconds,
            "failed_attempts": user.vault_failed_attempts or 0,
            "total_documents": total_docs
        }

    @classmethod
    def setup_vault_password(cls, user: User, password: str, db: Session) -> Dict[str, Any]:
        """
        Sets or updates the patient's vault password using scrypt hashing.
        """
        if len(password) < 6:
            raise HTTPException(status_code=400, detail="Vault password must be at least 6 characters.")

        p_hash, salt = hash_vault_password(password)
        user.vault_password_hash = p_hash
        user.vault_salt = salt
        user.vault_failed_attempts = 0
        user.vault_locked_until = None
        db.commit()

        # Automatically issue initial unlock session token
        sess_token = generate_vault_session_token()
        sess = VaultSession(
            user_id=user.id,
            session_token=sess_token,
            expires_at=datetime.now(timezone.utc) + timedelta(minutes=SESSION_LIFETIME_MINUTES),
            is_active=True
        )
        db.add(sess)
        db.commit()

        return {
            "status": "success",
            "message": "Vault password configured successfully! Your Medical Vault is now unlocked.",
            "vault_token": sess_token,
            "expires_in_seconds": SESSION_LIFETIME_MINUTES * 60
        }

    @classmethod
    def unlock_vault(cls, user: User, password: str, db: Session) -> Dict[str, Any]:
        """
        Verifies vault password with brute-force rate-limiting and issues short-lived session.
        """
        now = datetime.now(timezone.utc)

        # 1. Check brute-force lockout
        if user.vault_locked_until:
            v_locked = user.vault_locked_until
            if v_locked.tzinfo is None:
                v_locked = v_locked.replace(tzinfo=timezone.utc)
            if v_locked > now:
                rem = int((v_locked - now).total_seconds())
                raise HTTPException(
                    status_code=429,
                    detail=f"Too many failed attempts. Vault is temporarily locked for security. Please try again in {rem} seconds."
                )

        # 2. Check if password is configured
        if not user.vault_password_hash or not user.vault_salt:
            # Fallback: check if password matches user account login password
            from app.core.security import verify_password
            if verify_password(password, user.hashed_password):
                # Auto-initialize vault password to account password
                return cls.setup_vault_password(user, password, db)
            else:
                raise HTTPException(
                    status_code=400,
                    detail="Vault password not yet configured. Please set up your vault password first."
                )

        # 3. Verify password
        is_valid = verify_vault_password(password, user.vault_password_hash, user.vault_salt)

        if not is_valid:
            # Increment failed attempts
            user.vault_failed_attempts = (user.vault_failed_attempts or 0) + 1
            if user.vault_failed_attempts >= MAX_FAILED_ATTEMPTS:
                user.vault_locked_until = now + timedelta(minutes=LOCKOUT_MINUTES)
                db.commit()
                raise HTTPException(
                    status_code=429,
                    detail=f"Incorrect vault password. 5 failed attempts reached. Vault locked for {LOCKOUT_MINUTES} minutes."
                )
            db.commit()
            remaining = MAX_FAILED_ATTEMPTS - user.vault_failed_attempts
            raise HTTPException(
                status_code=401,
                detail=f"Incorrect vault password. {remaining} attempt(s) remaining before security lockout."
            )

        # 4. Success: reset failed attempts
        user.vault_failed_attempts = 0
        user.vault_locked_until = None

        # Expire any previous sessions for this user to maintain strict session hygiene
        db.query(VaultSession).filter(VaultSession.user_id == user.id).update({"is_active": False})

        # Issue new session token
        sess_token = generate_vault_session_token()
        sess = VaultSession(
            user_id=user.id,
            session_token=sess_token,
            expires_at=now + timedelta(minutes=SESSION_LIFETIME_MINUTES),
            is_active=True
        )
        db.add(sess)
        db.commit()

        # Audit log
        audit = AccessAuditLog(
            accessor_id=user.id,
            accessor_name=user.full_name,
            accessor_role="patient",
            action="vault_unlock"
        )
        db.add(audit)
        db.commit()

        return {
            "status": "unlocked",
            "message": "Vault successfully unlocked. Session active for 15 minutes.",
            "vault_token": sess_token,
            "expires_in_seconds": SESSION_LIFETIME_MINUTES * 60
        }

    @classmethod
    def lock_vault(cls, user_id: int, session_token: Optional[str], db: Session) -> Dict[str, Any]:
        """
        Explicitly revokes active vault session.
        """
        if session_token:
            db.query(VaultSession).filter(
                VaultSession.session_token == session_token,
                VaultSession.user_id == user_id
            ).update({"is_active": False})
            db.commit()
        return {"status": "locked", "message": "Medical Vault is now securely locked."}

    @classmethod
    def require_valid_vault_session(cls, user_id: int, session_token: Optional[str], db: Session):
        """
        Strict server-side validation of vault session token.
        Raises 403 Forbidden if vault is locked or token is invalid/expired.
        """
        if not session_token:
            raise HTTPException(
                status_code=403,
                detail="Medical Vault is locked. Please unlock with your vault password to access document contents."
            )

        now = datetime.now(timezone.utc)
        sess = db.query(VaultSession).filter(
            VaultSession.session_token == session_token,
            VaultSession.user_id == user_id,
            VaultSession.is_active == True
        ).first()

        if not sess:
            raise HTTPException(
                status_code=403,
                detail="Invalid or expired vault session. Please unlock your vault again."
            )

        sess_exp = sess.expires_at
        if sess_exp.tzinfo is None:
            sess_exp = sess_exp.replace(tzinfo=timezone.utc)

        if sess_exp <= now:
            sess.is_active = False
            db.commit()
            raise HTTPException(
                status_code=403,
                detail="Vault session expired due to inactivity. Please unlock your vault again."
            )
