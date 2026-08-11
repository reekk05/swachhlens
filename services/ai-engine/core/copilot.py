import os
import json
from datetime import datetime, timezone, timedelta
from google import genai
from dotenv import load_dotenv

load_dotenv()

client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))

IST = timezone(timedelta(hours=5, minutes=30))

COPILOT_SYSTEM_PROMPT = """You are a municipal operations copilot for SwachhLens, an AI waste management decision support system.

You will be given the current date/time, a list of current waste complaints (as JSON, with timestamps in UTC), and a question from a municipal officer.

Answer the officer's question directly and concisely, referencing specific complaints by their short ID (first 8 characters) and giving clear reasoning grounded in the actual data provided — category, severity score, location, hazard indicators, report count, age.

When discussing dates or "today," convert UTC timestamps to IST (UTC+5:30) and reason relative to the current date/time provided, not raw UTC values.

Do not invent data that isn't in the list. If the list doesn't contain enough information to answer, say so clearly."""


def ask_copilot(question: str, complaints_data: list) -> str:
    now_ist = datetime.now(IST).strftime("%A, %B %d, %Y, %I:%M %p IST")

    prompt = f"""{COPILOT_SYSTEM_PROMPT}

Current date and time: {now_ist}

Current complaints data (timestamps in UTC):
{json.dumps(complaints_data, indent=2)}

Officer's question: {question}"""

    response = client.models.generate_content(
        model="gemini-3.6-flash",
        contents=[prompt],
    )

    return response.text
