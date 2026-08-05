VOLUME_SCORES = {
    "small": 15,
    "medium": 45,
    "large": 75,
    "very_large": 100,
}

WEIGHTS = {
    "volume": 0.35,
    "hazard": 0.25,
    "duplicate_reports": 0.25,
    "age": 0.15,
}


def compute_severity(
    volume: str,
    hazard_indicators: list,
    requires_urgent_attention: bool,
    report_count: int,
    age_hours: float = 0,
) -> dict:
    volume_score = VOLUME_SCORES.get(volume, 30)

    if requires_urgent_attention:
        hazard_score = 100
    elif hazard_indicators:
        hazard_score = 70
    else:
        hazard_score = 15

    # More independent citizens reporting the same issue = higher real urgency
    duplicate_score = min(report_count * 20, 100)

    # Complaints sitting unresolved longer become more urgent (caps at 72 hrs)
    age_score = min((age_hours / 72) * 100, 100)

    total = round(
        volume_score * WEIGHTS["volume"]
        + hazard_score * WEIGHTS["hazard"]
        + duplicate_score * WEIGHTS["duplicate_reports"]
        + age_score * WEIGHTS["age"],
        1,
    )

    if total >= 75:
        level = "critical"
    elif total >= 50:
        level = "high"
    elif total >= 25:
        level = "medium"
    else:
        level = "low"

    return {
        "score": total,
        "level": level,
        "factors": {
            "volume": {
                "value": volume,
                "score": volume_score,
                "weight": WEIGHTS["volume"],
            },
            "hazard": {
                "indicators": hazard_indicators,
                "urgent": requires_urgent_attention,
                "score": hazard_score,
                "weight": WEIGHTS["hazard"],
            },
            "duplicate_reports": {
                "report_count": report_count,
                "score": duplicate_score,
                "weight": WEIGHTS["duplicate_reports"],
            },
            "age": {
                "hours_open": age_hours,
                "score": age_score,
                "weight": WEIGHTS["age"],
            },
        },
    }
