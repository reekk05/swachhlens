from pydantic import BaseModel
from typing import Optional
from datetime import datetime
import uuid


class ComplaintCreateResponse(BaseModel):
    id: uuid.UUID
    status: str
    message: str


class ComplaintOut(BaseModel):
    id: uuid.UUID
    status: str
    category: Optional[str] = None
    volume: Optional[str] = None
    description: Optional[str] = None
    reported_at: datetime

    class Config:
        from_attributes = True
