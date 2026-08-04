import json
import httpx
from sqlalchemy import text
from database import SessionLocal

AI_ENGINE_URL = "http://127.0.0.1:8001"


def process_complaint(complaint_id: str, photo_bytes: bytes, content_type: str):
    db = SessionLocal()
    try:
        try:
            response = httpx.post(
                f"{AI_ENGINE_URL}/classify/",
                files={"photo": ("photo.jpg", photo_bytes, content_type)},
                timeout=30.0,
            )
            response.raise_for_status()
            result = response.json()
        except Exception as e:
            # AI engine unreachable or failed — don't block the complaint, just flag it
            db.execute(
                text("""
                    UPDATE complaints
                    SET status = 'verified', recommended_action = :note
                    WHERE id = :id
                """),
                {
                    "id": complaint_id,
                    "note": f"AI classification unavailable ({str(e)}). Needs manual review.",
                },
            )
            db.commit()
            return

        breakdown = {
            "confidence": result["confidence"],
            "reasoning": result["reasoning"],
            "hazard_indicators": result["hazard_indicators"],
            "requires_urgent_attention": result["requires_urgent_attention"],
        }

        db.execute(
            text("""
                UPDATE complaints
                SET status = 'verified',
                    category = :category,
                    volume = :volume,
                    severity_breakdown = CAST(:breakdown AS jsonb)
                WHERE id = :id
            """),
            {
                "id": complaint_id,
                "category": result["category"],
                "volume": result["volume"],
                "breakdown": json.dumps(breakdown),
            },
        )
        db.commit()
    finally:
        db.close()
