from fastapi import APIRouter

from .endpoints import (
    health,
    auth,
    records,
    family,
    doctors,
    consent,
    emergency,
    ai_chat,
    prescriptions,
    medicines,
    appointments,
    audit,
    diet,
    folders
)

api_router = APIRouter()

api_router.include_router(health.router, tags=["Health"])
api_router.include_router(auth.router, prefix="/auth", tags=["Authentication"])
api_router.include_router(records.router, prefix="/records", tags=["Medical Records Vault"])
api_router.include_router(folders.router, prefix="/folders", tags=["Member Folders & Reports"])
api_router.include_router(family.router, prefix="/family", tags=["Family & Face Verification"])
api_router.include_router(doctors.router, prefix="/doctors", tags=["Doctor Verification"])
api_router.include_router(consent.router, prefix="/consent", tags=["QR Sharing & Consent"])
api_router.include_router(emergency.router, prefix="/emergency", tags=["Offline Emergency Shield"])
api_router.include_router(ai_chat.router, prefix="/ai", tags=["Grounded Medical AI"])
api_router.include_router(prescriptions.router, prefix="/prescriptions", tags=["RxScript Handwritten OCR"])
api_router.include_router(medicines.router, prefix="/medicines", tags=["Medicine Reference"])
api_router.include_router(appointments.router, prefix="/appointments", tags=["Appointments & Reminders"])
api_router.include_router(audit.router, prefix="/audit", tags=["Security & Access Audit"])
api_router.include_router(diet.router, prefix="/diet", tags=["AI Wellness & Meal Planning"])
