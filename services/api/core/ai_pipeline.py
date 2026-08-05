import json
import httpx
from sqlalchemy import text
from sqlalchemy.orm import Session
from database import SessionLocal
from core.duplicate_detection import find_and_link_duplicate
from core.severity import compute_severity
from core.recommendations import generate_recommendation

AI_ENGINE_URL = "http://127.0.0.1:8001"


def apply_severity_and_recommendation(
    db: Session,
    complaint_id: str,
    category: str,
    volume: str,
    hazard_indicators: list,
    requires_urgent_attention: bool,
    report_count: int,
    classification_breakdown: dict,
):
    severity = compute_severity(
        volume=volume,
        hazard_indicators=hazard_indicators,
        requires_urgent_attention=requires_urgent_attention,
        report_count=report_count,
    )
    recommendation = generate_recommendation(category, volume, severity["level"])

    combined_breakdown = {
        "classification": classification_breakdown,
        "severity": severity,
    }

    db.execute(
        text("""
            UPDATE complaints
            SET severity_score = :score,
                severity_breakdown = CAST(:breakdown AS jsonb),
                recommended_action = :action
            WHERE id = :id
        """),
        {
            "id": complaint_id,
            "score": severity["score"],
            "breakdown": json.dumps(combined_breakdown),
            "action": recommendation["action_text"],
        },
    )
    db.commit()


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

        classification_breakdown = {
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
                    volume = :volume
                WHERE id = :id
            """),
            {
                "id": complaint_id,
                "category": result["category"],
                "volume": result["volume"],
            },
        )
        db.commit()

        duplicate_match = find_and_link_duplicate(db, complaint_id, result["category"])

        report_count = duplicate_match["report_count"] if duplicate_match else 1

        apply_severity_and_recommendation(
            db,
            complaint_id,
            result["category"],
            result["volume"],
            result["hazard_indicators"],
            result["requires_urgent_attention"],
            report_count,
            classification_breakdown,
        )

        if duplicate_match:
            original_id = duplicate_match["original_id"]
            original_row = db.execute(
                text(
                    "SELECT category, volume, severity_breakdown FROM complaints WHERE id = :id"
                ),
                {"id": original_id},
            ).fetchone()

            if original_row and original_row.severity_breakdown:
                original_classification = (
                    original_row.severity_breakdown.get("classification") or {}
                )
                if not original_classification.get("reasoning"):
                    original_classification = {
                        "confidence": None,
                        "reasoning": "Original complaint classification",
                        "hazard_indicators": [],
                        "requires_urgent_attention": False,
                    }

                apply_severity_and_recommendation(
                    db,
                    original_id,
                    original_row.category,
                    original_row.volume,
                    original_classification.get("hazard_indicators", []),
                    original_classification.get("requires_urgent_attention", False),
                    duplicate_match["report_count"],
                    original_classification,
                )
    finally:
        db.close()
