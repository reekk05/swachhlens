from pydantic import BaseModel
from typing import List


class ClassificationResult(BaseModel):
    category: str
    volume: str
    confidence: float
    reasoning: str
    hazard_indicators: List[str]
    requires_urgent_attention: bool
