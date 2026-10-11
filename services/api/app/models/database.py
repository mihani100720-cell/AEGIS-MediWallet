import os
import json
from datetime import datetime, timezone
from sqlalchemy import create_engine, Column, Integer, String, Text, Boolean, DateTime, ForeignKey, Float
from sqlalchemy.orm import declarative_base, sessionmaker, relationship
from ..core.config import settings

os.makedirs(os.path.dirname(settings.DATABASE_URL.replace("sqlite:///", "")), exist_ok=True)
os.makedirs(settings.UPLOAD_DIR, exist_ok=True)

engine = create_engine(
    settings.DATABASE_URL,
    connect_args={"check_same_thread": False} if "sqlite" in settings.DATABASE_URL else {}
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(255), nullable=False)
    role = Column(String(50), default="patient")  # patient, doctor, admin
    phone = Column(String(50), nullable=True)
    blood_group = Column(String(10), default="O+")
    passkey_registered = Column(Boolean, default=False)
    preferred_language = Column(String(10), default="en") # en, hi, te
    # Dedicated Vault Password & Protection
    vault_password_hash = Column(String(255), nullable=True)
    vault_salt = Column(String(64), nullable=True)
    vault_failed_attempts = Column(Integer, default=0)
    vault_locked_until = Column(DateTime, nullable=True)
    # Member Folders & Reports Protection (Argon2id & OTP)
    report_access_password_hash = Column(String(255), nullable=True)
    report_access_failed_attempts = Column(Integer, default=0)
    report_access_locked_until = Column(DateTime, nullable=True)
    allowed_access_methods = Column(String(50), default="both")  # both, password_only, otp_only
    verified_email = Column(String(255), nullable=True)
    verified_phone = Column(String(50), nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

class FamilyMember(Base):
    __tablename__ = "family_members"
    id = Column(Integer, primary_key=True, index=True)
    primary_user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    name = Column(String(255), nullable=False)
    relation = Column(String(50), nullable=False) # Self, Spouse, Mother, Father, Child
    age = Column(Integer, nullable=True)
    blood_group = Column(String(10), default="O+")
    face_enrolled = Column(Boolean, default=False)
    face_encoding = Column(Text, nullable=True) # JSON array of landmarks or descriptor
    emergency_contact = Column(String(50), nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

class MedicalRecord(Base):
    __tablename__ = "medical_records"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    family_member_id = Column(Integer, nullable=True)
    title = Column(String(255), nullable=False)
    category = Column(String(100), default="General") # Prescriptions, Lab Reports, Scan Reports, Discharge Summaries, Other Documents
    doctor_name = Column(String(255), nullable=True)
    hospital_name = Column(String(255), nullable=True)
    record_date = Column(String(50), nullable=True)
    file_name = Column(String(255), nullable=False)
    storage_key = Column(String(255), nullable=True) # Safe private file key on server
    mime_type = Column(String(100), default="application/pdf")
    file_url = Column(String(500), nullable=False)
    file_size = Column(Integer, default=0)
    sha256_hash = Column(String(64), index=True, nullable=False)
    extracted_text = Column(Text, nullable=True)
    structured_data = Column(Text, nullable=True) # JSON string of lab values, ranges
    ai_summary = Column(Text, nullable=True)
    is_abnormal = Column(Boolean, default=False)
    ocr_status = Column(String(50), default="completed") # pending, processing, completed, failed
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

class VaultSession(Base):
    """
    Short-lived, server-validated vault unlock session.
    Protects document contents; expired or revoked sessions reject all preview & download requests.
    """
    __tablename__ = "vault_sessions"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    session_token = Column(String(128), unique=True, index=True, nullable=False)
    expires_at = Column(DateTime, nullable=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

class DoctorProfile(Base):
    __tablename__ = "doctor_profiles"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True, nullable=False)
    medical_reg_no = Column(String(100), nullable=False)
    specialization = Column(String(150), nullable=False)
    hospital_affiliation = Column(String(255), nullable=False)
    verification_status = Column(String(50), default="pending") # pending, verified, rejected
    verified_at = Column(DateTime, nullable=True)
    badge_issued = Column(Boolean, default=False)
    document_proof_url = Column(String(500), nullable=True)

class ConsentGrant(Base):
    __tablename__ = "consent_grants"
    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    doctor_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    mode = Column(String(50), default="opd") # opd, admission
    status = Column(String(50), default="active") # active, expired, revoked
    record_ids = Column(Text, default="[]") # JSON list of record IDs
    purpose = Column(String(255), default="Medical Consultation")
    qr_token = Column(String(128), unique=True, index=True, nullable=False)
    expires_at = Column(DateTime, nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    revoked_at = Column(DateTime, nullable=True)

class EmergencyProfile(Base):
    __tablename__ = "emergency_profiles"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True, nullable=False)
    blood_group = Column(String(10), default="O+")
    allergies = Column(Text, default="[]") # JSON list
    chronic_conditions = Column(Text, default="[]") # JSON list
    current_medications = Column(Text, default="[]") # JSON list
    emergency_contacts = Column(Text, default="[]") # JSON list of {name, relation, phone}
    qr_payload = Column(Text, nullable=True)
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

class PrescriptionExtraction(Base):
    __tablename__ = "prescriptions"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    original_image_url = Column(String(500), nullable=False)
    extracted_medicines = Column(Text, default="[]") # JSON list of candidate items
    confidence_score = Column(Float, default=0.92)
    doctor_notes = Column(Text, nullable=True)
    status = Column(String(50), default="pending_review") # pending_review, confirmed
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

class Medicine(Base):
    __tablename__ = "medicines"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), index=True, nullable=False)
    generic_name = Column(String(255), nullable=False)
    dosage_form = Column(String(100), default="Tablet")
    standard_dose = Column(String(100), default="500 mg")
    indications = Column(Text, nullable=True)
    contraindications = Column(Text, nullable=True)
    common_side_effects = Column(Text, nullable=True)

class Appointment(Base):
    __tablename__ = "appointments"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    doctor_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    doctor_name = Column(String(255), nullable=False)
    clinic = Column(String(255), nullable=False)
    appointment_date = Column(DateTime, nullable=False)
    status = Column(String(50), default="scheduled") # scheduled, completed, cancelled
    follow_up_instructions = Column(Text, nullable=True)
    reminder_sent = Column(Boolean, default=False)

class SecurityEvent(Base):
    __tablename__ = "security_events"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, nullable=True)
    event_type = Column(String(100), nullable=False) # failed_login, passkey_registered, grant_revoked, unauthorized_access
    ip_address = Column(String(50), default="127.0.0.1")
    user_agent = Column(String(255), default="Mozilla/5.0")
    severity = Column(String(50), default="low") # low, medium, high, critical
    details = Column(Text, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

class AccessAuditLog(Base):
    __tablename__ = "access_audit_logs"
    id = Column(Integer, primary_key=True, index=True)
    record_id = Column(Integer, nullable=True)
    accessor_id = Column(Integer, nullable=False)
    accessor_name = Column(String(255), nullable=False)
    accessor_role = Column(String(50), default="doctor")
    action = Column(String(100), default="view") # view, download, export_brief
    grant_id = Column(Integer, nullable=True)
    timestamp = Column(DateTime, default=lambda: datetime.now(timezone.utc))

class UserSession(Base):
    __tablename__ = "user_sessions"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    session_token = Column(String(255), unique=True, index=True, nullable=False)
    device_name = Column(String(255), default="Chrome on Windows")
    ip_address = Column(String(50), default="127.0.0.1")
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    last_active_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

# ==================== MEMBER HEALTH FOLDERS & MEDICAL REPORTS ====================

class HealthFolder(Base):
    __tablename__ = "health_folders"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True) # Folder Owner
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    members = relationship("FolderMember", back_populates="folder", cascade="all, delete-orphan")
    reports = relationship("MemberMedicalReport", back_populates="folder", cascade="all, delete-orphan")

class FolderMember(Base):
    __tablename__ = "folder_members"
    id = Column(Integer, primary_key=True, index=True)
    folder_id = Column(Integer, ForeignKey("health_folders.id"), nullable=False, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True) # Owner
    name = Column(String(255), nullable=False)
    relationship_label = Column(String(100), nullable=True) # Self, Spouse, Child, Parent, Dependent, Other
    age = Column(Integer, nullable=True)
    gender = Column(String(50), nullable=True)
    blood_group = Column(String(10), default="Unknown")
    phone = Column(String(50), nullable=True)
    email = Column(String(255), nullable=True)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    folder = relationship("HealthFolder", back_populates="members")
    reports = relationship("MemberMedicalReport", back_populates="member", cascade="all, delete-orphan")

class MemberMedicalReport(Base):
    __tablename__ = "member_medical_reports"
    id = Column(Integer, primary_key=True, index=True)
    folder_id = Column(Integer, ForeignKey("health_folders.id"), nullable=False, index=True)
    member_id = Column(Integer, ForeignKey("folder_members.id"), nullable=False, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True) # Owner
    title = Column(String(255), nullable=False)
    document_type = Column(String(100), default="Lab Report") # Lab Report, Prescription, Scan Report, Discharge Summary, Vaccination Record, Other
    report_date = Column(String(50), nullable=True)
    file_name = Column(String(255), nullable=False)
    storage_key = Column(String(500), nullable=False) # e.g. "user_1/report_a1b2c3d4.pdf"
    mime_type = Column(String(100), nullable=False)
    file_size = Column(Integer, default=0)
    sha256_hash = Column(String(64), nullable=False)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    folder = relationship("HealthFolder", back_populates="reports")
    member = relationship("FolderMember", back_populates="reports")

class FolderAccessSession(Base):
    """
    Short-lived, server-side verified access session for protected folders/reports.
    Requires OTP or Argon2id password verification.
    """
    __tablename__ = "folder_access_sessions"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    folder_id = Column(Integer, nullable=True) # None for all user's folders in current session
    session_token = Column(String(128), unique=True, index=True, nullable=False)
    verified_via = Column(String(50), default="password") # "otp" or "password"
    expires_at = Column(DateTime, nullable=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

class FolderOTPVerification(Base):
    """
    Stores server-side hashed OTP codes for folder protection.
    Never stores plaintext OTPs.
    """
    __tablename__ = "folder_otp_verifications"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    folder_id = Column(Integer, nullable=True)
    otp_hash = Column(String(255), nullable=False)
    delivery_channel = Column(String(20), default="email") # "email" or "phone"
    target_masked = Column(String(100), nullable=False)
    attempts_remaining = Column(Integer, default=5)
    expires_at = Column(DateTime, nullable=False)
    used = Column(Boolean, default=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

class FolderAccessAuditLog(Base):
    """
    Audit log of access attempts, unlocks, downloads, and revocations.
    """
    __tablename__ = "folder_access_audit_logs"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    folder_id = Column(Integer, nullable=True)
    report_id = Column(Integer, nullable=True)
    action = Column(String(100), nullable=False) # "unlock_attempt", "unlocked", "preview", "download", "revoked", "password_changed", "settings_updated"
    method = Column(String(50), nullable=True) # "otp", "password"
    status = Column(String(50), default="success") # "success", "failed", "locked_out", "revoked"
    ip_address = Column(String(50), default="127.0.0.1")
    user_agent = Column(String(255), default="Browser")
    details = Column(Text, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

def init_db():
    Base.metadata.create_all(bind=engine)
    # Automatic SQLite migration for new columns on users table
    try:
        with engine.connect() as conn:
            cursor = conn.connection.cursor()
            cursor.execute("PRAGMA table_info(users)")
            existing_cols = {row[1] for row in cursor.fetchall()}
            new_columns = [
                ("report_access_password_hash", "VARCHAR(255)"),
                ("report_access_failed_attempts", "INTEGER DEFAULT 0"),
                ("report_access_locked_until", "DATETIME"),
                ("allowed_access_methods", "VARCHAR(50) DEFAULT 'both'"),
                ("verified_email", "VARCHAR(255)"),
                ("verified_phone", "VARCHAR(50)")
            ]
            for col_name, col_type in new_columns:
                if col_name not in existing_cols:
                    cursor.execute(f"ALTER TABLE users ADD COLUMN {col_name} {col_type}")
            conn.connection.commit()
    except Exception as e:
        print("Database migration check:", e)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
