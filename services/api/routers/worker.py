from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session
from sqlalchemy import text
from database import get_db
from core.auth import get_current_user_id

router = APIRouter(prefix="/worker", tags=["worker"])


class LocationUpdate(BaseModel):
    latitude: float
    longitude: float


@router.post("/location")
def update_location(
    payload: LocationUpdate,
    db: Session = Depends(get_db),
    worker_id: str = Depends(get_current_user_id),
):
    if not worker_id:
        raise HTTPException(status_code=401, detail="Login required")

    db.execute(
        text("""
            INSERT INTO worker_locations (worker_id, latitude, longitude, updated_at)
            VALUES (:worker_id, :lat, :lon, now())
            ON CONFLICT (worker_id)
            DO UPDATE SET latitude = :lat, longitude = :lon, updated_at = now()
        """),
        {"worker_id": worker_id, "lat": payload.latitude, "lon": payload.longitude},
    )
    db.commit()

    return {"status": "updated"}


from core.routing import optimize_route


@router.get("/my-stops")
def my_stops(
    db: Session = Depends(get_db),
    worker_id: str = Depends(get_current_user_id),
):
    if not worker_id:
        raise HTTPException(status_code=401, detail="Login required")

    location_row = db.execute(
        text("SELECT latitude, longitude FROM worker_locations WHERE worker_id = :id"),
        {"id": worker_id},
    ).fetchone()

    rows = db.execute(
        text("""
            SELECT id, category, volume, severity_score, address_text,
                   ST_Y(location::geometry) as latitude,
                   ST_X(location::geometry) as longitude
            FROM complaints
            WHERE assigned_worker_id = :worker_id
              AND status IN ('dispatched', 'in_progress')
        """),
        {"worker_id": worker_id},
    ).fetchall()

    stops = [
        {
            "id": str(row.id),
            "category": row.category,
            "volume": row.volume,
            "severity_score": float(row.severity_score) if row.severity_score else None,
            "address": row.address_text,
            "latitude": row.latitude,
            "longitude": row.longitude,
        }
        for row in rows
    ]

    if location_row and stops:
        ordered = optimize_route(stops, location_row.latitude, location_row.longitude)
        return {"stops": ordered, "manual_order": stops}

    return {"stops": stops, "manual_order": stops}
