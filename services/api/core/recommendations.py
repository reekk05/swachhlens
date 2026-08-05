VEHICLE_MAP = {
    "organic": "Tractor + Trailer",
    "construction_debris": "JCB + Dump Truck",
    "plastic": "Recycling Van",
    "e_waste": "Recycling Partner Pickup",
    "hazardous": "Hazmat Response Unit",
    "drain_blockage": "Suction/Jetting Vehicle",
    "overflowing_bin": "Mini Tipper",
    "illegal_dump": "Mini Truck",
}

CREW_SIZE_MAP = {
    "small": 1,
    "medium": 2,
    "large": 4,
    "very_large": 6,
}

BASE_COST_INR = {
    "small": 300,
    "medium": 700,
    "large": 1400,
    "very_large": 2200,
}


def generate_recommendation(category: str, volume: str, severity_level: str) -> dict:
    vehicle = VEHICLE_MAP.get(category, "General Waste Truck")
    crew = CREW_SIZE_MAP.get(volume, 2)

    if category == "hazardous":
        equipment = ["Hazmat suit", "Gloves", "Containment bags"]
    elif category == "e_waste":
        equipment = ["Gloves", "Sorting crates"]
    else:
        equipment = ["Shovel", "Gloves", "Safety kit"]

    cost = BASE_COST_INR.get(volume, 700)

    action_text = (
        f"Dispatch: {vehicle} | Crew: {crew} worker(s) | "
        f"Equipment: {', '.join(equipment)} | Priority: {severity_level.upper()} | "
        f"Estimated cost: ₹{cost}"
    )

    return {
        "action_text": action_text,
        "vehicle": vehicle,
        "crew_size": crew,
        "equipment": equipment,
        "estimated_cost_inr": cost,
    }
