from fastapi import APIRouter
from pydantic import BaseModel
from typing import List, Dict, Any
from core.copilot import ask_copilot

router = APIRouter(prefix="/copilot", tags=["copilot"])


class CopilotRequest(BaseModel):
    question: str
    complaints_data: List[Dict[str, Any]]


class CopilotResponse(BaseModel):
    answer: str


@router.post("/ask", response_model=CopilotResponse)
def ask(payload: CopilotRequest):
    answer = ask_copilot(payload.question, payload.complaints_data)
    return CopilotResponse(answer=answer)
