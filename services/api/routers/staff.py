from fastapi import APIRouter, UploadFile, File, Depends, HTTPException
from sqlalchemy import text
from sqlalchemy.orm import Session
import httpx
import json
from database import get_db
from core.storage import upload_complaint_photo
from core.auth import get_current_user_id

router = APIRouter(prefix="/staff", tags=["staff"])

AI_ENGINE_URL = "http://127.0.0.1:8001"


@router.post("/complaints/{complaint_id}/resolve")
async def resolve_complaint(
    complaint_id: str,
    photo: UploadFile = File(...),
    db: Session = Depends(get_db),
    staff_id: str = Depends(get_current_user_id),
):
    if not staff_id:
        raise HTTPException(status_code=401, detail="Login required")

    staff_check = db.execute(
        text("SELECT id FROM staff_profiles WHERE id = :id"),
        {"id": staff_id},
    ).fetchone()
    if not staff_check:
        raise HTTPException(status_code=403, detail="Staff access required")

    photo_bytes = await photo.read()
    photo_path = upload_complaint_photo(photo_bytes, photo.content_type)

    try:
        response = httpx.post(
            f"{AI_ENGINE_URL}/verify/",
            files={"photo": ("after.jpg", photo_bytes, photo.content_type)},
            timeout=30.0,
        )
        response.raise_for_status()
        verification = response.json()
    except Exception as e:
        verification = {
            "waste_removed": None,
            "confidence": 0,
            "reasoning": f"Verification unavailable: {str(e)}",
        }

    new_status = "resolved" if verification.get("waste_removed") else "in_progress"

    db.execute(
        text("""
        UPDATE complaints
        SET status = CAST(:status AS complaint_status),
            resolved_photo_url = :photo_url,
            resolved_at = CASE WHEN :status = 'resolved' THEN now() ELSE resolved_at END
        WHERE id = :id
    """),
        {"status": new_status, "photo_url": photo_path, "id": complaint_id},
    )

    return {"status": new_status, "verification": verification}
