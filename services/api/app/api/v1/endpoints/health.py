from fastapi import APIRouter
from datetime import datetime, timezone

router = APIRouter()

@router.get("/health")
def health_check():
    return {
        "status": "healthy",
        "service": "MEDIWALLET Application Server",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "version": "1.0.0"
    }
