from sqlalchemy import text
from database import SessionLocal


def process_complaint(complaint_id: str):
    """
    Runs after a complaint is submitted. In later steps, this will:
    - Call the AI engine to classify waste type + estimate volume
    - Run duplicate detection against nearby recent complaints
    - Calculate an explainable severity score
    - Generate a recommended action
    For now, it just flips the status so we can see the async flow working.
    """
    db = SessionLocal()
    try:
        db.execute(
            text("UPDATE complaints SET status = 'verified' WHERE id = :id"),
            {"id": complaint_id},
        )
        db.commit()
    finally:
        db.close()
