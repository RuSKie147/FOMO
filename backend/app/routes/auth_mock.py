from fastapi import APIRouter
from pydantic import BaseModel
from typing import Optional
from app.services.db import db_service
import uuid

router = APIRouter()

class DemoLoginRequest(BaseModel):
    email: str
    name: Optional[str] = None

@router.post("/demo-login")
def demo_login(request: DemoLoginRequest):
    # Generate a stable userId from email
    user_id = str(uuid.uuid5(uuid.NAMESPACE_DNS, request.email))
    display_name = request.name or request.email.split('@')[0].replace('.', ' ').title()
    
    # Check if user already exists
    existing = db_service.get_user(user_id)
    if existing:
        has_vibe = bool(existing.get("vibeVector"))
        return {
            "userId": user_id,
            "email": request.email,
            "name": existing.get("name", display_name),
            "hasCompletedVibeCheck": has_vibe,
            "createdAt": existing.get("createdAt", "")
        }
    
    # Create new user profile (without vibe vector yet)
    user = db_service.put_user(
        user_id=user_id,
        email=request.email,
        name=display_name,
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
