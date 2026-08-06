from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session
from sqlalchemy import text
import httpx
from database import get_db
from core.auth import get_current_user_id

router = APIRouter(prefix="/copilot", tags=["copilot"])

AI_ENGINE_URL = "http://127.0.0.1:8001"


class CopilotQuestion(BaseModel):
    question: str


class CopilotResponse(BaseModel):
    answer: str


@router.post("/ask", response_model=CopilotResponse)
def ask(
    payload: CopilotQuestion,
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

    result = db.execute(text("""
            SELECT id, category, volume, severity_score, status,
                   address_text, report_count, reported_at,
                   recommended_action
            FROM complaints
            WHERE status NOT IN ('resolved', 'rejected')
            ORDER BY severity_score DESC NULLS LAST
            LIMIT 30
        """))
    rows = result.fetchall()

    complaints_data = [
        {
            "id": str(row.id)[:8],
            "category": row.category,
            "volume": row.volume,
            "severity_score": float(row.severity_score) if row.severity_score else None,
            "status": row.status,
            "address": row.address_text,
            "report_count": row.report_count,
            "reported_at": str(row.reported_at),
            "recommended_action": row.recommended_action,
        }
        for row in rows
    ]

    try:
        response = httpx.post(
            f"{AI_ENGINE_URL}/copilot/ask",
            json={"question": payload.question, "complaints_data": complaints_data},
            timeout=30.0,
        )
        response.raise_for_status()
        result_data = response.json()
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Copilot unavailable: {str(e)}")

    return CopilotResponse(answer=result_data["answer"])
