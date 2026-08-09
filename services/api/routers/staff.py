from fastapi import Body
from fastapi import APIRouter, UploadFile, File, Depends, HTTPException
from sqlalchemy import text
from sqlalchemy.orm import Session
import httpx
import json
from database import get_db
from core.storage import upload_complaint_photo
from core.auth import get_current_user_id
from core.routing import optimize_route
from pydantic import BaseModel
import os
from core.supabase_client import supabase

STAFF_INVITE_CODE = os.getenv("STAFF_INVITE_CODE", "swachhlens2026")

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


@router.post("/route")
def get_optimized_route(
    complaint_ids: list[str] = Body(...),
    start_lat: float = Body(...),
    start_lon: float = Body(...),
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

    placeholders = ", ".join([f":id{i}" for i in range(len(complaint_ids))])
    params = {f"id{i}": cid for i, cid in enumerate(complaint_ids)}

    result = db.execute(
        text(f"""
            SELECT id, category, address_text,
                   ST_Y(location::geometry) as latitude,
                   ST_X(location::geometry) as longitude
            FROM complaints
            WHERE id IN ({placeholders})
        """),
        params,
    )
    rows = result.fetchall()

    stops = [
        {
            "id": str(row.id),
            "category": row.category,
            "address": row.address_text,
            "latitude": row.latitude,
            "longitude": row.longitude,
        }
        for row in rows
    ]

    route = optimize_route(stops, start_lat, start_lon)
    return {"route": route}


class RejectRequest(BaseModel):
    reason: str


@router.post("/complaints/{complaint_id}/reject")
def reject_complaint(
    complaint_id: str,
    payload: RejectRequest,
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

    if not payload.reason.strip():
        raise HTTPException(status_code=400, detail="A rejection reason is required")

    db.execute(
        text("""
            UPDATE complaints
            SET status = 'rejected', rejection_reason = :reason
            WHERE id = :id
        """),
        {"reason": payload.reason, "id": complaint_id},
    )
    db.commit()

    return {"status": "rejected", "reason": payload.reason}


class StaffSignupRequest(BaseModel):
    email: str
    password: str
    full_name: str
    invite_code: str


@router.post("/signup")
def staff_signup(payload: StaffSignupRequest, db: Session = Depends(get_db)):
    if payload.invite_code != STAFF_INVITE_CODE:
        raise HTTPException(status_code=403, detail="Invalid invite code")

    result = supabase.auth.admin.create_user(
        {
            "email": payload.email,
            "password": payload.password,
            "email_confirm": True,
        }
    )

    user_id = result.user.id

    db.execute(
        text("""
            INSERT INTO staff_profiles (id, full_name, role)
            VALUES (:id, :full_name, 'field_officer')
        """),
        {"id": user_id, "full_name": payload.full_name},
    )
    db.commit()

    return {"status": "created", "user_id": user_id}
