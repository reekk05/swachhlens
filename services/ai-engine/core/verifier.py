import json
from core.gemini_client import client

VERIFICATION_PROMPT = """You are verifying whether a municipal waste cleanup was completed successfully.

You will see an "after" photo taken by a cleanup worker at the same location as an earlier waste complaint.

Respond with ONLY a JSON object (no markdown, no extra text):

{
  "waste_removed": true or false,
  "confidence": a number between 0 and 1,
  "reasoning": "a short 1-2 sentence explanation of what you see and why you conclude this"
}

Be conservative: if the image is unclear, ambiguous, or doesn't clearly show a clean area, set waste_removed to false and lower your confidence."""


def verify_cleanup(image_bytes: bytes, mime_type: str) -> dict:
    response = client.models.generate_content(
        model="gemini-3.6-flash",
        contents=[
            {"inline_data": {"mime_type": mime_type, "data": image_bytes}},
            VERIFICATION_PROMPT,
        ],
        config={"response_mime_type": "application/json"},
    )
    return json.loads(response.text)
