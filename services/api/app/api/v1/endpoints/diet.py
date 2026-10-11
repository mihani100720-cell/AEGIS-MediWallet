from typing import Optional, List
from fastapi import APIRouter, Depends, Query, Header
from sqlalchemy.orm import Session
import json

from app.models.database import get_db, EmergencyProfile
from app.core.security import decode_access_token
from app.services.ai_service import AIService

router = APIRouter()

def get_current_user_id(authorization: Optional[str] = Header(None)) -> int:
    if not authorization or not authorization.startswith("Bearer "):
        return 1
    token = authorization.split(" ")[1]
    payload = decode_access_token(token)
    return int(payload.get("sub", 1)) if payload else 1

@router.get("/meal-plan")
def get_meal_plan(
    vegetarian: bool = True,
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    profile = db.query(EmergencyProfile).filter(EmergencyProfile.user_id == user_id).first()
    allergies = json.loads(profile.allergies) if profile and profile.allergies else ["Peanuts"]

    plan = AIService.generate_clinical_meal_plan(
        blood_sugar=142.0,
        vegetarian=vegetarian,
        allergies=allergies
    )
    return plan
