from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.models.database import get_db, Medicine

router = APIRouter()

@router.get("/search")
def search_medicines(q: str = "", db: Session = Depends(get_db)):
    query = db.query(Medicine)
    if q:
        query = query.filter(
            (Medicine.name.ilike(f"%{q}%")) | (Medicine.generic_name.ilike(f"%{q}%"))
        )
    items = query.limit(20).all()
    return [
        {
            "id": m.id,
            "name": m.name,
            "generic_name": m.generic_name,
            "dosage_form": m.dosage_form,
            "standard_dose": m.standard_dose,
            "indications": m.indications,
            "contraindications": m.contraindications,
            "common_side_effects": m.common_side_effects
        }
        for m in items
    ]

@router.get("/{medicine_id}")
def get_medicine_detail(medicine_id: int, db: Session = Depends(get_db)):
    med = db.query(Medicine).filter(Medicine.id == medicine_id).first()
    if not med:
        raise HTTPException(status_code=404, detail="Medicine not found.")

    return {
        "id": med.id,
        "name": med.name,
        "generic_name": med.generic_name,
        "dosage_form": med.dosage_form,
        "standard_dose": med.standard_dose,
        "indications": med.indications,
        "contraindications": med.contraindications,
        "common_side_effects": med.common_side_effects,
        "database_note": "Reference only. A database entry does not verify authenticity of physical packaging."
    }
