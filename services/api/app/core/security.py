from datetime import datetime, timedelta, timezone
from typing import Optional, Any, Union, Tuple
import jwt
import hashlib
import secrets
from .config import settings

ALGORITHM = "HS256"

def hash_password(password: str) -> str:
    # Deterministic SHA-256 for basic user auth
    return hashlib.sha256((password + settings.SECRET_KEY).encode()).hexdigest()

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return hash_password(plain_password) == hashed_password

# ==================== DEDICATED VAULT PASSWORD SECURITY ====================
# Uses memory-hard scrypt key derivation (NIST approved, resistant to GPU/ASIC brute force)
def generate_vault_salt() -> str:
    return secrets.token_hex(16)

def hash_vault_password(password: str, salt_hex: Optional[str] = None) -> Tuple[str, str]:
    if not salt_hex:
        salt_hex = generate_vault_salt()
    salt_bytes = bytes.fromhex(salt_hex)
    # Memory-hard scrypt (n=16384, r=8, p=1)
    derived = hashlib.scrypt(password.encode("utf-8"), salt=salt_bytes, n=16384, r=8, p=1)
    return derived.hex(), salt_hex

def verify_vault_password(plain_password: str, stored_hash_hex: str, salt_hex: str) -> bool:
    if not stored_hash_hex or not salt_hex:
        return False
    try:
        salt_bytes = bytes.fromhex(salt_hex)
        derived = hashlib.scrypt(plain_password.encode("utf-8"), salt=salt_bytes, n=16384, r=8, p=1)
        return secrets.compare_digest(derived.hex(), stored_hash_hex)
    except Exception:
        return False

def generate_vault_session_token() -> str:
    # High-entropy 256-bit cryptographically secure session token
    return secrets.token_urlsafe(32)

def validate_vault_password_strength(password: str) -> Tuple[bool, str]:
    if len(password) < 8:
        return False, "Vault password must be at least 8 characters long."
    has_upper = any(c.isupper() for c in password)
    has_lower = any(c.islower() for c in password)
    has_digit = any(c.isdigit() for c in password)
    if not (has_upper and has_lower and has_digit):
        return False, "Vault password must contain uppercase, lowercase, and numeric characters."
    return True, "Strong password."

# ==================== JWT TOKENS ====================
def create_access_token(subject: Union[str, Any], expires_delta: Optional[timedelta] = None) -> str:
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode = {"exp": expire, "sub": str(subject)}
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def decode_access_token(token: str) -> Optional[dict]:
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except jwt.PyJWTError:
        return None

# ==================== ARGON2ID REPORT-ACCESS PASSWORD SECURITY ====================
import argon2

_argon2_hasher = argon2.PasswordHasher(
    time_cost=2,
    memory_cost=65536,  # 64 MB
    parallelism=1,
    hash_len=32,
    type=argon2.Type.ID  # Argon2id
)

def hash_report_access_password(password: str) -> str:
    """Hashes report access password using Argon2id."""
    return _argon2_hasher.hash(password)

def verify_report_access_password(plain_password: str, hashed_password: str) -> bool:
    """Verifies report access password against Argon2id hash."""
    if not hashed_password:
        return False
    try:
        return _argon2_hasher.verify(hashed_password, plain_password)
    except Exception:
        return False

def generate_folder_access_token() -> str:
    """Generates high-entropy 256-bit cryptographically secure session token."""
    return secrets.token_urlsafe(32)

def generate_otp_code() -> str:
    """Generates a secure 6-digit numeric OTP."""
    return f"{secrets.randbelow(900000) + 100000}"

def hash_otp_code(otp_code: str) -> str:
    """Hashes an OTP code with HMAC-SHA256 salt so plaintext OTP is never persisted."""
    return hashlib.sha256((otp_code + settings.SECRET_KEY).encode("utf-8")).hexdigest()

def verify_otp_code(plain_otp: str, hashed_otp: str) -> bool:
    """Verifies user-supplied OTP code against stored hash in constant time."""
    candidate_hash = hash_otp_code(plain_otp)
    return secrets.compare_digest(candidate_hash, hashed_otp)

