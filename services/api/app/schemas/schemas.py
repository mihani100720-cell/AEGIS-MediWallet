from pydantic import BaseModel, EmailStr
from typing import Optional, List, Dict, Any
from datetime import datetime

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: Dict[str, Any]

class LoginRequest(BaseModel):
    email: str
    password: str

class PasskeyLoginRequest(BaseModel):
    email: str
    credential_id: str
    client_data_json: Optional[str] = None

class FaceVerifyRequest(BaseModel):
    family_member_id: int
    face_image_base64: str
    liveness_verified: bool = True

class OtpVerifyRequest(BaseModel):
    family_member_id: int
    otp_code: str

class UserCreate(BaseModel):
    email: str
    password: str
    full_name: str
    role: str = "patient"
    phone: Optional[str] = None
    blood_group: Optional[str] = "O+"

class UserResponse(BaseModel):
    id: int
    email: str
    full_name: str
    role: str
    phone: Optional[str] = None
    blood_group: Optional[str] = "O+"
    passkey_registered: bool = False
    preferred_language: str = "en"

class FamilyMemberCreate(BaseModel):
    name: str
    relation: str
    age: Optional[int] = None
    blood_group: Optional[str] = "O+"
    emergency_contact: Optional[str] = None

class RecordCreate(BaseModel):
    title: str
    category: str
    doctor_name: Optional[str] = None
    hospital_name: Optional[str] = None
    record_date: Optional[str] = None
    file_name: str
    file_url: str
    file_size: int
    sha256_hash: str
    extracted_text: Optional[str] = None
    family_member_id: Optional[int] = None

class ConsentCreateRequest(BaseModel):
    doctor_id: int
    mode: str = "opd" # opd or admission
    record_ids: List[int]
    purpose: str = "Medical Consultation"
    duration_minutes: int = 60

class ConsentApproveRequest(BaseModel):
    qr_token: str
    mode: str = "opd"
    record_ids: List[int]
    purpose: str
    duration_minutes: int = 60

class EmergencyProfileUpdate(BaseModel):
    blood_group: str
    allergies: List[str]
    chronic_conditions: List[str]
    current_medications: List[str]
    emergency_contacts: List[Dict[str, str]]

class ChatQueryRequest(BaseModel):
    query: str
    language: str = "en" # en, hi, te

class PrescriptionReviewUpdate(BaseModel):
    extracted_medicines: List[Dict[str, Any]]
    doctor_details: Optional[Dict[str, Any]] = None
    patient_details: Optional[Dict[str, Any]] = None
    diagnosis: Optional[str] = None
    doctor_notes: Optional[str] = None
    status: str = "confirmed"

class AppointmentCreate(BaseModel):
    doctor_id: Optional[int] = None
    doctor_name: str
    clinic: str
    appointment_date: str
    follow_up_instructions: Optional[str] = None

# ==================== MEDICAL VAULT SECURITY SCHEMAS ====================
class VaultSetupRequest(BaseModel):
    password: str
    confirm_password: Optional[str] = None

class VaultUnlockRequest(BaseModel):
    password: str

class VaultStatusResponse(BaseModel):
    is_configured: bool
    is_unlocked: bool
    session_expires_at: Optional[str] = None
    failed_attempts: int = 0
    is_locked_out: bool = False
    lockout_remaining_seconds: int = 0

class VaultUnlockResponse(BaseModel):
    status: str
    vault_token: str
    expires_at: str
    message: str

class RecordRenameRequest(BaseModel):
    title: str
    category: Optional[str] = None
    doctor_name: Optional[str] = None
    hospital_name: Optional[str] = None
    record_date: Optional[str] = None

# ==================== MEMBER HEALTH FOLDERS & REPORTS SCHEMAS ====================

class UserRegisterRequest(BaseModel):
    email: str
    password: str
    full_name: str
    role: str = "patient"
    phone: Optional[str] = None
    blood_group: Optional[str] = "O+"
    report_access_password: Optional[str] = None
    report_access_password_confirm: Optional[str] = None

class FolderCreate(BaseModel):
    name: str
    description: Optional[str] = None

class FolderUpdate(BaseModel):
    name: str
    description: Optional[str] = None

class MemberCreate(BaseModel):
    name: str
    relationship_label: Optional[str] = "Self"
    age: Optional[int] = None
    gender: Optional[str] = None
    blood_group: Optional[str] = "Unknown"
    phone: Optional[str] = None
    email: Optional[str] = None
    notes: Optional[str] = None

class MemberUpdate(BaseModel):
    name: Optional[str] = None
    relationship_label: Optional[str] = None
    age: Optional[int] = None
    gender: Optional[str] = None
    blood_group: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    notes: Optional[str] = None

class FolderSecurityStatusResponse(BaseModel):
    has_password: bool
    is_unlocked: bool
    session_expires_at: Optional[str] = None
    failed_attempts: int = 0
    is_locked_out: bool = False
    lockout_remaining_seconds: int = 0
    allowed_access_methods: str = "both"
    verified_email: Optional[str] = None
    verified_phone: Optional[str] = None
    otp_delivery_configured: bool = False
    otp_delivery_provider: str = "Not Configured"

class ReportPasswordSetupRequest(BaseModel):
    password: str
    confirm_password: str

class ReportPasswordChangeRequest(BaseModel):
    current_password: str
    new_password: str
    confirm_password: str

class FolderSecuritySettingsRequest(BaseModel):
    allowed_access_methods: Optional[str] = "both"
    verified_email: Optional[str] = None
    verified_phone: Optional[str] = None

class OTPRequestPayload(BaseModel):
    channel: str = "email" # "email" or "phone"

class OTPVerifyPayload(BaseModel):
    otp_code: str

class PasswordVerifyPayload(BaseModel):
    password: str

class FolderVerifyResponse(BaseModel):
    status: str
    session_token: str
    verified_via: str
    expires_at: str
    message: str


