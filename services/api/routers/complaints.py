from fastapi import APIRouter, UploadFile, File, Form, BackgroundTasks, Depends
from sqlalchemy import text
from sqlalchemy.orm import Session
from database import get_db
from schemas.complaint import ComplaintCreateResponse
from core.storage import upload_complaint_photo
from core.ai_pipeline import process_complaint

router = APIRouter(prefix="/complaints", tags=["complaints"])


@router.post("/", response_model=ComplaintCreateResponse)
async def create_complaint(
    background_tasks: BackgroundTasks,
    photo: UploadFile = File(...),
    latitude: float = Form(...),
    longitude: float = Form(...),
    description: str = Form(None),
    db: Session = Depends(get_db),
):
    photo_bytes = await photo.read()
    photo_path = upload_complaint_photo(photo_bytes, photo.content_type)

    result = db.execute(
        text("""
            INSERT INTO complaints (location, photo_url, description, status)
            VALUES (ST_SetSRID(ST_MakePoint(:lng, :lat), 4326)::geography, :photo_url, :description, 'pending')
            RETURNING id, status
        """),
        {
            "lng": longitude,
            "lat": latitude,
            "photo_url": photo_path,
            "description": description,
        },
    )
    row = result.fetchone()
    db.commit()

    background_tasks.add_task(process_complaint, str(row.id))

    return ComplaintCreateResponse(
        id=row.id,
        status=row.status,
        message="Report received. AI analysis in progress.",
    )
