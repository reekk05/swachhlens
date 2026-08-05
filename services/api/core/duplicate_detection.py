from sqlalchemy import text
from sqlalchemy.orm import Session

DUPLICATE_RADIUS_METERS = 50
DUPLICATE_TIME_WINDOW_HOURS = 48


def find_and_link_duplicate(
    db: Session, complaint_id: str, category: str
) -> dict | None:
    """
    Checks if this complaint matches an existing, still-open complaint of the
    same category within DUPLICATE_RADIUS_METERS and DUPLICATE_TIME_WINDOW_HOURS.

    If a match is found:
    - The new complaint is linked to the original via duplicate_of
    - The original's report_count is incremented (this is the priority signal —
      more independent reports of the same issue = higher real-world urgency)

    Returns the original complaint's id + updated report_count, or None if no match.
    """
    result = db.execute(
        text("""
            SELECT id, report_count
            FROM complaints
            WHERE id != :id
              AND category = :category
              AND duplicate_of IS NULL
              AND status NOT IN ('rejected', 'resolved')
              AND reported_at > now() - make_interval(hours => :hours)
              AND ST_DWithin(
                    location,
                    (SELECT location FROM complaints WHERE id = :id),
                    :radius
                  )
            ORDER BY reported_at ASC
            LIMIT 1
        """),
        {
            "id": complaint_id,
            "category": category,
            "hours": DUPLICATE_TIME_WINDOW_HOURS,
            "radius": DUPLICATE_RADIUS_METERS,
        },
    )
    original = result.fetchone()

    if not original:
        return None

    new_count = original.report_count + 1

    # Link the new complaint to the original, and bump the original's report count
    db.execute(
        text("UPDATE complaints SET duplicate_of = :original_id WHERE id = :id"),
        {"original_id": original.id, "id": complaint_id},
    )
    db.execute(
        text("UPDATE complaints SET report_count = :count WHERE id = :original_id"),
        {"count": new_count, "original_id": original.id},
    )
    db.commit()

    return {"original_id": str(original.id), "report_count": new_count}
