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
    userId: Optional[str] = None
    hostName: Optional[str] = None
    title: str
    description: Optional[str] = ""
    category: Optional[str] = "CHILL"
    imageKey: Optional[str] = None
    lat: Optional[float] = 28.5458
    lng: Optional[float] = 77.2732
    locationName: Optional[str] = None
    scheduledAt: Optional[str] = None
    expiresAt: Optional[str] = None
    maxMembers: Optional[int] = Field(default=4, ge=2, le=10)
    inviteEmails: Optional[List[str]] = []

class EventCreateResponse(BaseModel):
    eventId: str
    status: str
    similarityIndexing: str
    invitedCount: Optional[int] = 0

class Invitation(BaseModel):
    inviteId: str
    eventId: str
    eventTitle: str
    eventCategory: str
    hostId: str
    hostName: str
    inviteeEmail: str
    status: str
    createdAt: str
    updatedAt: Optional[str] = None

class AcceptInviteRequest(BaseModel):
    userId: str
    name: Optional[str] = "Anon"
    major: Optional[str] = "Undeclared"
    vibeSummary: Optional[str] = ""

class SendInvitesRequest(BaseModel):
    eventId: str
    hostId: str
    hostName: str
    inviteEmails: List[str]
    title: Optional[str] = None
    category: Optional[str] = None

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
    name: Optional[str] = "Anon"
    major: Optional[str] = "Undeclared"
    vibeSummary: Optional[str] = ""

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

class LeaveEventRequest(BaseModel):
    userId: str

class DeleteEventRequest(BaseModel):
    hostId: str

class ChatMessageRequest(BaseModel):
    userId: str
    userName: str
    text: str

class ChatMessage(BaseModel):
    messageId: str
    eventId: str
    userId: str
    userName: str
    text: str
    timestamp: str

