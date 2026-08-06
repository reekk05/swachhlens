import json
from core.gemini_client import client

CLASSIFICATION_PROMPT = """You are an expert municipal waste inspector analyzing a citizen-submitted photo of a waste issue in an Indian city.

Analyze the image and respond with ONLY a JSON object (no markdown, no extra text) matching this exact structure:

{
  "category": one of ["overflowing_bin", "illegal_dump", "plastic", "construction_debris", "organic", "e_waste", "hazardous", "drain_blockage"],
  "volume": one of ["small", "medium", "large", "very_large"],
  "confidence": a number between 0 and 1,
  "reasoning": "a short 1-2 sentence explanation of why you chose this category and volume, referencing what you see in the image (scale references, spread, containment)",
  "hazard_indicators": a list of any concerning elements you notice, e.g. ["medical waste visible", "near water body", "burning detected"] — empty list if none,
  "requires_urgent_attention": true or false, based on whether this poses immediate health/safety risk (hazardous material, blocked drain during monsoon risk, near a school/hospital-like area, etc.),
  "estimated_weight_kg": your best estimate of total waste weight in kilograms, as a number,
  "estimated_cleanup_minutes": your best estimate of how many minutes a standard crew would need to clear this, as a number,
  "workers_needed": your best estimate of how many workers this requires, as a whole number,
  "recyclable_percentage": your best estimate of what percentage of this waste is recyclable, as a number 0-100
}

Volume guidance:
- small: fits in a single bag, isolated litter
- medium: fills a bin or small pile, 1-2 people could clear it
- large: requires a small team, spread across several square meters
- very_large: requires a truck + crew, significant accumulation

Be precise and conservative — do not guess wildly if the image is unclear, and lower your confidence score accordingly. For weight, time, workers, and recyclable percentage, give your genuine best estimate based on what's visible — these numbers will be used for real dispatch planning, so avoid defaulting to round numbers unless they're truly your best guess."""


def classify_waste_image(image_bytes: bytes, mime_type: str) -> dict:
    response = client.models.generate_content(
        model="gemini-3.6-flash",
        contents=[
            {"inline_data": {"mime_type": mime_type, "data": image_bytes}},
            CLASSIFICATION_PROMPT,
        ],
        config={
            "response_mime_type": "application/json",
        },
    )

    result = json.loads(response.text)
    return result
