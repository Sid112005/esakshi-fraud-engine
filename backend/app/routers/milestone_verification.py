from fastapi import APIRouter, File, Form, UploadFile, HTTPException
from datetime import datetime, timezone
from typing import Optional
from ml_engine.image_duplicate_detector import image_duplicate_detector

milestone_router = APIRouter(
    prefix="/api/v1",
    tags=["Milestone Photo Verification"]
)

@milestone_router.post("/verify-milestone-photo")
async def verify_milestone_photo(
    project_id: str = Form(..., description="The MPLADS Project ID claiming work completion"),
    file: UploadFile = File(..., description="Uploaded site completion photo / invoice proof")
):
    """
    AI Check 3: Photo Duplicate & Perceptual Hash Verification.
    Validates work-completion invoice photos against the historical registry to prevent
    contractor fraud via recycled or duplicate site photographs.
    """
    if not file.content_type or not file.content_type.startswith("image/"):
        # Allow checking based on extension as well for raw octet-streams
        filename = file.filename or ""
        valid_exts = (".jpg", ".jpeg", ".png", ".webp", ".bmp")
        if not filename.lower().endswith(valid_exts):
            raise HTTPException(
                status_code=400,
                detail=f"Invalid file type '{file.content_type}'. Please upload an image (.jpg, .png, .webp)."
            )

    try:
        image_bytes = await file.read()
        if len(image_bytes) == 0:
            raise HTTPException(status_code=400, detail="Uploaded image file is empty.")

        result = image_duplicate_detector.verify_milestone_photo(
            project_id=project_id.strip(),
            image_bytes=image_bytes
        )

        result["filename"] = file.filename
        result["timestamp"] = datetime.now(timezone.utc).isoformat()
        return result

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to process milestone verification photo: {str(e)}"
        )
