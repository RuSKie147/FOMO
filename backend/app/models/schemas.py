from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime

class VibeCheckRequest(BaseModel):
    userId: Optional[str] = None
    answers: List[str] = Field(..., min_length=1, max_length=10)

class VibeCheckResponse(BaseModel):
    status: str
    dimensions: int
    vibeSummary: str
    message: str

class UploadUrlResponse(BaseModel):
    uploadUrl: str
    fileKey: str
    publicUrl: str

class EventCreateRequest(BaseModel):
    title: str
    description: str
    category: str
    imageKey: Optional[str] = None
    lat: float
    lng: float

class EventCreateResponse(BaseModel):
    eventId: str
    status: str
    similarityIndexing: str

class UserProfile(BaseModel):
    userId: str
    email: str
    name: str
    major: str
    vibeVector: List[float]
    vibeSummary: str
    createdAt: str

class CampusEvent(BaseModel):
    eventId: Optional[str] = None
    hostId: Optional[str] = None
    hostName: Optional[str] = None
    title: Optional[str] = None
    description: Optional[str] = None
    category: Optional[str] = None
    imageKey: Optional[str] = None
    imageUrl: Optional[str] = None
    lat: Optional[float] = None
    lng: Optional[float] = None
    memberCount: Optional[int] = 0
    maxMembers: Optional[int] = 4
    status: Optional[str] = "ACTIVE"
    similarityScore: Optional[float] = None
    distanceKm: Optional[float] = None
    createdAt: Optional[str] = None

    class Config:
        extra = "allow"

class FeedResponse(BaseModel):
    events: list
    total: int
    userLocation: dict

class JoinEventRequest(BaseModel):
    userId: str
    name: str
    major: str
    vibeSummary: str

class SquadMember(BaseModel):
    userId: str
    name: str
    major: str
    vibeSummary: str
    joinedAt: str

class JoinEventResponse(BaseModel):
    status: str
    memberCount: int
    icebreaker: Optional[str] = None
    members: List[SquadMember]
