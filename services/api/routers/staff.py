from fastapi import Body
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import text
from sqlalchemy.orm import Session
from database import get_db
from core.auth import get_current_user_id
from core.routing import optimize_route
from pydantic import BaseModel
import os
from core.supabase_client import supabase

STAFF_INVITE_CODE = os.getenv("STAFF_INVITE_CODE", "swachhlens2026")

router = APIRouter(prefix="/staff", tags=["staff"])

AI_ENGINE_URL = "http://127.0.0.1:8001"


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
    role: str = "field_officer"


@router.post("/signup")
def staff_signup(payload: StaffSignupRequest, db: Session = Depends(get_db)):
    if payload.invite_code != STAFF_INVITE_CODE:
        raise HTTPException(status_code=403, detail="Invalid invite code")

    if payload.role not in ("field_officer", "ward_supervisor"):
        raise HTTPException(status_code=400, detail="Invalid role")

    result = supabase.auth.admin.create_user(
        {
            "email": payload.email,
            "password": payload.password,
            "email_confirm": True,
        }
    )

    user_id = result.user.id

    try:
        db.execute(
            text("""
                INSERT INTO staff_profiles (id, full_name, role)
                VALUES (:id, :full_name, :role)
            """),
            {"id": user_id, "full_name": payload.full_name, "role": payload.role},
        )
        db.commit()
    except Exception as e:
        db.rollback()
        supabase.auth.admin.delete_user(user_id)
        raise HTTPException(
            status_code=500, detail=f"Signup failed, please try again: {str(e)}"
        )

    return {"status": "created", "user_id": user_id}


class DispatchRequest(BaseModel):
    complaint_ids: list[str]
    worker_id: str


@router.post("/complaints/dispatch")
def dispatch_complaints(
    payload: DispatchRequest,
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

    worker_check = db.execute(
        text("SELECT id FROM staff_profiles WHERE id = :id AND role = 'field_officer'"),
        {"id": payload.worker_id},
    ).fetchone()
    if not worker_check:
        raise HTTPException(status_code=400, detail="Invalid worker")

    placeholders = ", ".join([f":id{i}" for i in range(len(payload.complaint_ids))])
    params = {f"id{i}": cid for i, cid in enumerate(payload.complaint_ids)}
    params["worker_id"] = payload.worker_id

    db.execute(
        text(f"""
            UPDATE complaints
            SET status = 'dispatched',
                assigned_worker_id = :worker_id,
                dispatched_at = now()
            WHERE id IN ({placeholders})
        """),
        params,
    )
    db.commit()

    return {
        "status": "dispatched",
        "count": len(payload.complaint_ids),
        "worker_id": payload.worker_id,
    }


class ConfirmRequest(BaseModel):
    approve: bool
    note: str | None = None


@router.post("/complaints/{complaint_id}/confirm")
def confirm_completion(
    complaint_id: str,
    payload: ConfirmRequest,
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

    new_status = "resolved" if payload.approve else "in_progress"

    db.execute(
        text("""
            UPDATE complaints
            SET status = CAST(:status AS complaint_status),
                resolved_at = CASE WHEN :status = 'resolved' THEN now() ELSE resolved_at END
            WHERE id = :id
        """),
        {"status": new_status, "id": complaint_id},
    )
    db.commit()

    return {"status": new_status}


@router.post("/suggest-worker")
def suggest_worker(
    complaint_ids: list[str] = Body(...),
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

    center = db.execute(
        text(f"""
            SELECT AVG(ST_Y(location::geometry)) as lat, AVG(ST_X(location::geometry)) as lon
            FROM complaints
            WHERE id IN ({placeholders})
        """),
        params,
    ).fetchone()

    if not center or center.lat is None:
        return {"worker_id": None}

    nearest = db.execute(
        text("""
            SELECT sp.id, sp.full_name,
                   ST_Distance(
                       ST_SetSRID(ST_MakePoint(wl.longitude, wl.latitude), 4326)::geography,
                       ST_SetSRID(ST_MakePoint(:lon, :lat), 4326)::geography
                   ) as distance_m
            FROM staff_profiles sp
            JOIN worker_locations wl ON wl.worker_id = sp.id
            WHERE sp.role = 'field_officer'
            ORDER BY distance_m ASC
            LIMIT 1
        """),
        {"lat": center.lat, "lon": center.lon},
    ).fetchone()

    if not nearest:
        return {"worker_id": None}

    return {
        "worker_id": str(nearest.id),
        "full_name": nearest.full_name,
        "distance_m": round(nearest.distance_m),
    }


class CreateWorkerRequest(BaseModel):
    email: str
    password: str
    full_name: str


@router.post("/workers/create")
def create_worker(
    payload: CreateWorkerRequest,
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

    result = supabase.auth.admin.create_user(
        {
            "email": payload.email,
            "password": payload.password,
            "email_confirm": True,
        }
    )

    user_id = result.user.id

    try:
        db.execute(
            text("""
                INSERT INTO staff_profiles (id, full_name, role)
                VALUES (:id, :full_name, 'field_officer')
            """),
            {"id": user_id, "full_name": payload.full_name},
        )
        db.commit()
    except Exception as e:
        db.rollback()
        supabase.auth.admin.delete_user(user_id)
        raise HTTPException(
            status_code=500, detail=f"Failed to create worker: {str(e)}"
        )

    return {"status": "created", "worker_id": user_id}


@router.get("/workers")
def list_workers(
    db: Session = Depends(get_db),
    staff_id: str = Depends(get_current_user_id),
):
    if not staff_id:
        raise HTTPException(status_code=401, detail="Login required")

    rows = db.execute(text("""
            SELECT sp.id, sp.full_name, wl.latitude, wl.longitude, wl.updated_at,
                   EXISTS (
                       SELECT 1 FROM complaints c
                       WHERE c.assigned_worker_id = sp.id
                       AND c.status IN ('dispatched', 'in_progress')
                   ) as is_active
            FROM staff_profiles sp
            LEFT JOIN worker_locations wl ON wl.worker_id = sp.id
            WHERE sp.role = 'field_officer'
            ORDER BY sp.full_name ASC
        """)).fetchall()

    return [
        {
            "id": str(row.id),
            "full_name": row.full_name,
            "has_location": row.latitude is not None,
            "last_seen": str(row.updated_at) if row.updated_at else None,
            "is_active": row.is_active,
        }
        for row in rows
    ]
