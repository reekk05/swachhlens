from fastapi import APIRouter, UploadFile, File, HTTPException
from schemas.classification import ClassificationResult
from core.classifier import classify_waste_image

router = APIRouter(prefix="/classify", tags=["classification"])


@router.post("/", response_model=ClassificationResult)
async def classify(photo: UploadFile = File(...)):
    image_bytes = await photo.read()
    try:
        result = classify_waste_image(image_bytes, photo.content_type)
    except Exception as e:
        raise HTTPException(
            status_code=502, detail=f"AI classification failed: {str(e)}"
        )
    return ClassificationResult(**result)
