from fastapi import APIRouter
from pydantic import BaseModel
from typing import Optional
from app.services.db import db_service
import uuid

router = APIRouter()

class DemoLoginRequest(BaseModel):
    email: str
    name: str

@router.post("/demo-login")
def demo_login(request: DemoLoginRequest):
    # Generate a stable userId from email
    user_id = str(uuid.uuid5(uuid.NAMESPACE_DNS, request.email))
    
    # Check if user already exists
    existing = db_service.get_user(user_id)
    if existing:
        has_vibe = bool(existing.get("vibeVector"))
        return {
            "userId": user_id,
            "email": request.email,
            "name": request.name,
            "hasCompletedVibeCheck": has_vibe,
            "createdAt": existing.get("createdAt", "")
        }
    
    # Create new user profile (without vibe vector yet)
    user = db_service.put_user(
        user_id=user_id,
        email=request.email,
        name=request.name,
        major="Undeclared",
        vibe_vector=[],
        vibe_summary=""
    )
    
    return {
        "userId": user_id,
        "email": request.email,
        "name": request.name,
        "hasCompletedVibeCheck": False,
        "createdAt": user.get("createdAt", "")
    }
