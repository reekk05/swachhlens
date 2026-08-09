from fastapi import APIRouter, UploadFile, File, Form, BackgroundTasks, Depends
from sqlalchemy import text
from sqlalchemy.orm import Session
from database import get_db
from schemas.complaint import ComplaintCreateResponse
from core.storage import upload_complaint_photo
from core.ai_pipeline import process_complaint
from core.auth import get_current_user_id
from core.supabase_client import supabase

router = APIRouter(prefix="/complaints", tags=["complaints"])


@router.post("/", response_model=ComplaintCreateResponse)
async def create_complaint(
    background_tasks: BackgroundTasks,
    photo: UploadFile = File(...),
    latitude: float = Form(...),
    longitude: float = Form(...),
    description: str = Form(None),
    address_text: str = Form(None),
    db: Session = Depends(get_db),
    reporter_id: str = Depends(get_current_user_id),
):
    photo_bytes = await photo.read()
    photo_path = upload_complaint_photo(photo_bytes, photo.content_type)

    result = db.execute(
        text("""
                INSERT INTO complaints (location, photo_url, description, address_text, reporter_id, status)
                VALUES (ST_SetSRID(ST_MakePoint(:lng, :lat), 4326)::geography, :photo_url, :description, :address_text, :reporter_id, 'pending')
                RETURNING id, status
        """),
        {
            "lng": longitude,
            "lat": latitude,
            "photo_url": photo_path,
            "description": description,
            "address_text": address_text,
            "reporter_id": reporter_id,
        },
    )
    row = result.fetchone()
    db.commit()

    background_tasks.add_task(
        process_complaint, str(row.id), photo_bytes, photo.content_type
    )

    return ComplaintCreateResponse(
        id=row.id,
        status=row.status,
        message="Report received. AI analysis is in progress.",
    )


from fastapi import HTTPException
from schemas.complaint import ComplaintOut
from typing import List


@router.get("/leaderboard")
def leaderboard(db: Session = Depends(get_db)):

    result = db.execute(text("""
            SELECT
                c.reporter_id,
                cp.display_name,
                COUNT(*) as total_reports,
                COALESCE(SUM(c.estimated_weight_kg), 0) as total_weight_kg
            FROM complaints c
            LEFT JOIN citizen_profiles cp ON cp.id = c.reporter_id
            WHERE c.reporter_id IS NOT NULL
                AND c.reported_at >= date_trunc('month', now())
            GROUP BY c.reporter_id, cp.display_name
            ORDER BY total_weight_kg DESC
            LIMIT 10
        """))
    rows = result.fetchall()

    return [
        {
            "rank": i + 1,
            "display_name": row.display_name or "Anonymous",
            "total_reports": row.total_reports,
            "total_weight_kg": float(row.total_weight_kg),
        }
        for i, row in enumerate(rows)
    ]


@router.get("/{complaint_id}", response_model=ComplaintOut)
def get_complaint(complaint_id: str, db: Session = Depends(get_db)):
    result = db.execute(
        text("""
            SELECT id, status, category, volume, description, reported_at
            FROM complaints WHERE id = :id
        """),
        {"id": complaint_id},
    )
    row = result.fetchone()
    if not row:
        raise HTTPException(status_code=404, detail="Complaint not found")
    return ComplaintOut.model_validate(row._mapping)


@router.get("/", response_model=List[ComplaintOut])
def list_complaints(
    db: Session = Depends(get_db),
    reporter_id: str = Depends(get_current_user_id),
):
    result = db.execute(
        text("""
            SELECT id, status, category, volume, description, reported_at
            FROM complaints
            WHERE reporter_id = :reporter_id
            ORDER BY reported_at DESC
        """),
        {"reporter_id": reporter_id},
    )
    rows = result.fetchall()
    return [ComplaintOut.model_validate(row._mapping) for row in rows]


@router.get("/me/stats")
def my_stats(
    db: Session = Depends(get_db),
    reporter_id: str = Depends(get_current_user_id),
):
    if not reporter_id:
        raise HTTPException(status_code=401, detail="Login required")

    result = db.execute(
        text("""
            SELECT
                COUNT(*) as total_reports,
                COALESCE(SUM(estimated_weight_kg), 0) as total_weight_kg,
                COUNT(*) FILTER (WHERE status = 'resolved') as resolved_count
            FROM complaints
            WHERE reporter_id = :reporter_id
        """),
        {"reporter_id": reporter_id},
    )
    row = result.fetchone()

    return {
        "total_reports": row.total_reports,
        "total_weight_kg": float(row.total_weight_kg),
        "resolved_count": row.resolved_count,
    }


@router.delete("/me/account")
def delete_my_account(
    db: Session = Depends(get_db),
    reporter_id: str = Depends(get_current_user_id),
):
    if not reporter_id:
        raise HTTPException(status_code=401, detail="Login required")

    # Anonymize their past reports rather than deleting civic records
    db.execute(
        text("UPDATE complaints SET reporter_id = NULL WHERE reporter_id = :id"),
        {"id": reporter_id},
    )
    db.execute(
        text("DELETE FROM citizen_profiles WHERE id = :id"),
        {"id": reporter_id},
    )
    db.commit()

    supabase.auth.admin.delete_user(reporter_id)

    return {"status": "deleted"}
