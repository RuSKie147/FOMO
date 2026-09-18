from fastapi import APIRouter, HTTPException
from app.models.schemas import VibeCheckRequest, VibeCheckResponse
from app.services.bedrock_service import bedrock_service
from app.services.db import db_service

router = APIRouter()

@router.post("/vibe-check", response_model=VibeCheckResponse)
def vibe_check(request: VibeCheckRequest):
    answers_text = " ".join(request.answers)
    vector = bedrock_service.generate_embedding(answers_text)
    
    # Save vector to user profile if userId provided
    if request.userId:
        db_service.update_user_vibe(request.userId, vector)
    
    # Generate a readable summary from the answers
    summary = f"You seem like a person who likes {' and '.join(request.answers[:2])}."
    
    return VibeCheckResponse(
        status="success",
        dimensions=len(vector),
        vibeSummary=summary,
        message="Vibe check complete!"
    )
