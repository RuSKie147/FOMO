from fastapi import APIRouter, HTTPException
from app.models.schemas import VibeCheckRequest, VibeCheckResponse
from app.services.bedrock_service import bedrock_service
from app.services.db import db_service

router = APIRouter()

@router.post("/vibe-check", response_model=VibeCheckResponse)
def vibe_check(request: VibeCheckRequest):
    answers_text = " ".join(request.answers)
    vector = bedrock_service.generate_embedding(answers_text)
    
    # Generate a clean summary: "Likes: item1, item2, item3, item4"
    clean_items = []
    for a in request.answers[:4]:
        text = a.strip().rstrip(".").rstrip(",")
        if text:
            clean_items.append(text)
    summary = f"Likes: {', '.join(clean_items)}" if clean_items else "Likes: Campus Exploration"
    
    # Save vector and summary to user profile if userId provided
    if request.userId:
        db_service.update_user_vibe(request.userId, vector, summary)
    
    return VibeCheckResponse(
        status="success",
        dimensions=len(vector),
        vibeSummary=summary,
        message="Vibe check complete!"
    )
