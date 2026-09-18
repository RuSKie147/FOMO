from fastapi import APIRouter, Query, HTTPException
from app.models.schemas import EventCreateRequest, EventCreateResponse, FeedResponse, JoinEventRequest, JoinEventResponse
from app.services.bedrock_service import bedrock_service
from app.services.db import db_service
from app.services.vector_math import rank_events
from app.config import config

router = APIRouter()

@router.post("", response_model=EventCreateResponse)
def create_event(request: EventCreateRequest):
    # For a real app, you'd get the hostId from auth token
    host_id = "user_demo" 
    
    event_text = f"{request.title} {request.description} {request.category}"
    vector = bedrock_service.generate_embedding(event_text)
    
    item, event_id = db_service.put_event(
        host_id=host_id,
        title=request.title,
        description=request.description,
        category=request.category,
        image_key=request.imageKey or "",
        event_vector=vector,
        lat=request.lat,
        lng=request.lng
    )
    
    return EventCreateResponse(
        eventId=event_id,
        status="ACTIVE",
        similarityIndexing="COMPLETED"
    )

@router.get("/feed")
def get_feed(userId: str, lat: float = config.CAMPUS_LAT, lng: float = config.CAMPUS_LNG, radiusKm: float = config.DEFAULT_RADIUS_KM):
    user = db_service.get_user(userId)
    user_vector = user.get("vibeVector", []) if user else []
    
    events = db_service.query_active_events()
    ranked = rank_events(user_vector, events, lat, lng, radiusKm)
    
    # Clean up response: extract eventId from PK and strip internal keys
    clean_events = []
    for event in ranked:
        event_clean = dict(event)
        # Extract eventId from PK like "EVENT#uuid"
        pk = event_clean.pop('PK', '')
        event_clean['eventId'] = pk.replace('EVENT#', '') if pk else event_clean.get('eventId', '')
        # Remove DynamoDB internal keys
        for key in ['SK', 'GSI1PK', 'GSI1SK', 'eventVector']:
            event_clean.pop(key, None)
        clean_events.append(event_clean)
        
    return {
        "events": clean_events,
        "total": len(clean_events),
        "userLocation": {"lat": lat, "lng": lng}
    }

@router.post("/{eventId}/join", response_model=JoinEventResponse)
def join_event(eventId: str, request: JoinEventRequest):
    event = db_service.get_event(eventId)
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
        
    if event.get('GSI1PK') != 'STATUS#ACTIVE':
        raise HTTPException(status_code=400, detail="Event is no longer active")
        
    success = db_service.add_squad_member(eventId, request.userId, request.name, request.major, request.vibeSummary)
    if not success:
        raise HTTPException(status_code=500, detail="Failed to join event")
        
    members = db_service.get_squad_members(eventId)
    member_count = len(members)
    
    icebreaker = None
    if member_count >= event.get('maxMembers', 4):
        # Generate icebreaker
        context = ", ".join([f"{m.get('name')} ({m.get('major')})" for m in members])
        icebreaker = bedrock_service.generate_icebreaker(context)
        db_service.update_crew_status(eventId, icebreaker)
        
    return JoinEventResponse(
        status="JOINED",
        memberCount=member_count,
        icebreaker=icebreaker,
        members=members
    )
