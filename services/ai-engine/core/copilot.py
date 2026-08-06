import os
import json
from google import genai
from dotenv import load_dotenv

load_dotenv()

client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))

COPILOT_SYSTEM_PROMPT = """You are a municipal operations copilot for SwachhLens, an AI waste management decision support system.

You will be given a list of current waste complaints (as JSON) and a question from a municipal officer.

Answer the officer's question directly and concisely, referencing specific complaints by their short ID (first 8 characters) and giving clear reasoning grounded in the actual data provided — category, severity score, location, hazard indicators, report count, age.

Do not invent data that isn't in the list. If the list doesn't contain enough information to answer, say so clearly."""


def ask_copilot(question: str, complaints_data: list) -> str:
    prompt = f"""{COPILOT_SYSTEM_PROMPT}

Current complaints data:
{json.dumps(complaints_data, indent=2)}

Officer's question: {question}"""

    response = client.models.generate_content(
        model="gemini-3.6-flash",
        contents=[prompt],
    )

    return response.text
