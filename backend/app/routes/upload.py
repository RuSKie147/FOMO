from fastapi import APIRouter, Query
from app.models.schemas import UploadUrlResponse
from app.services.s3_service import s3_service

router = APIRouter()

@router.get("/upload-url", response_model=UploadUrlResponse)
def get_upload_url(fileType: str = Query(...), fileName: str = Query(...)):
    upload_url, key, public_url = s3_service.generate_presigned_url(fileName, fileType)
    return UploadUrlResponse(
        uploadUrl=upload_url,
        fileKey=key,
        publicUrl=public_url
    )
