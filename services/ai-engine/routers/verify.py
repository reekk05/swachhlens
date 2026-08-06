from fastapi import APIRouter, UploadFile, File, HTTPException
from pydantic import BaseModel
from core.verifier import verify_cleanup

router = APIRouter(prefix="/verify", tags=["verification"])


class VerificationResult(BaseModel):
    waste_removed: bool
    confidence: float
    reasoning: str


@router.post("/", response_model=VerificationResult)
async def verify(photo: UploadFile = File(...)):
    image_bytes = await photo.read()
    try:
        result = verify_cleanup(image_bytes, photo.content_type)
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Verification failed: {str(e)}")
    return VerificationResult(**result)
