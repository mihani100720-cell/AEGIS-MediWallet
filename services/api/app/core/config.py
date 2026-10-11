from pydantic_settings import BaseSettings
from typing import List, Optional
import os

class Settings(BaseSettings):
    PROJECT_NAME: str = "MEDIWALLET"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"
    SECRET_KEY: str = os.getenv("SECRET_KEY", "mediwallet-super-secret-key-production-ready-2026")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 1 day
    BACKEND_CORS_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:8000",
        "http://127.0.0.1:8000",
        "*"
    ]
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./services/api/data/mediwallet.db")
    UPLOAD_DIR: str = os.getenv("UPLOAD_DIR", "./services/api/data/records")

    # OCR / AI Settings
    # Path to the locally downloaded Qwen2.5-VL model directory (relative to project root)
    LOCAL_MODEL_DIR: str = os.getenv("LOCAL_MODEL_DIR", "models/medical-prescription-ocr-india")
    # Minimum free RAM (GB) required before attempting CPU-based local model inference
    OCR_RAM_THRESHOLD_GB: float = float(os.getenv("OCR_RAM_THRESHOLD_GB", "10.0"))
    # Optional: Google Gemini API key for hosted vision inference fallback
    # Set in a .env file or environment variable; leave blank to skip Gemini tier
    GEMINI_API_KEY: Optional[str] = os.getenv("GEMINI_API_KEY", None)

    class Config:
        case_sensitive = True
        env_file = ".env"
        env_file_encoding = "utf-8"

settings = Settings()
