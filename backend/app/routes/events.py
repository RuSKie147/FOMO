from fastapi import APIRouter, Query, HTTPException
from app.models.schemas import EventCreateRequest, EventCreateResponse, JoinEventRequest
from app.services.bedrock_service import bedrock_service
from app.services.db import db_service
from app.services.email_service import email_service
from app.services.vector_math import rank_events
from app.config import config

router = APIRouter()

@router.post("", response_model=EventCreateResponse)
def create_event(request: EventCreateRequest):
    host_id = request.userId or "user_demo"
    host_name = request.hostName or host_id
    
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
        lng=request.lng,
        host_name=host_name
    )
    
    invited_count = 0
    if request.inviteEmails:
        for email in request.inviteEmails:
            clean_email = email.strip()
            if not clean_email or "@" not in clean_email:
                continue
            invite_record = db_service.create_invitation(
                event_id=event_id,
                event_title=request.title,
                event_category=request.category or "CHILL",
                host_id=host_id,
                host_name=host_name,
                invitee_email=clean_email
            )
            email_service.send_invitation_email(
                invitee_email=clean_email,
                host_name=host_name,
                event_title=request.title,
                event_category=request.category or "CHILL",
                invite_id=invite_record["inviteId"],
                event_id=event_id
            )
            invited_count += 1
            
    return EventCreateResponse(
        eventId=event_id,
        status="ACTIVE",
        similarityIndexing="COMPLETED",
        invitedCount=invited_count
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
        # Add hostName from hostId if not present
        if 'hostName' not in event_clean:
            event_clean['hostName'] = event_clean.get('hostId', 'Anon')
        # Add status from GSI1PK
        gsi1pk = event_clean.get('GSI1PK', '')
        if gsi1pk == 'STATUS#ACTIVE':
            event_clean['status'] = 'ACTIVE'
        elif gsi1pk == 'STATUS#LOCKED':
            event_clean['status'] = 'CREW_LOCKED'
        # Remove DynamoDB internal keys
        for key in ['SK', 'GSI1PK', 'GSI1SK', 'eventVector']:
            event_clean.pop(key, None)
        clean_events.append(event_clean)
        
    return {
        "events": clean_events,
        "total": len(clean_events),
        "userLocation": {"lat": lat, "lng": lng}
    }

@router.get("/{eventId}")
def get_event_details(eventId: str):
    event = db_service.get_event(eventId)
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    raw_members = db_service.get_squad_members(eventId)
    members = []
    for m in raw_members:
        members.append({
            "userId": m.get("SK", "").replace("MEMBER#", "") if "SK" in m else m.get("userId", ""),
            "name": m.get("name", "Anon"),
            "major": m.get("major", "Undeclared"),
            "vibeSummary": m.get("vibeSummary", ""),
            "joinedAt": m.get("joinedAt", "")
        })
    event_clean = dict(event)
    pk = event_clean.pop('PK', '')
    event_clean['eventId'] = pk.replace('EVENT#', '') if pk else eventId
    for key in ['SK', 'GSI1PK', 'GSI1SK', 'eventVector']:
        event_clean.pop(key, None)
    event_clean['members'] = members
    event_clean['memberCount'] = len(members)
    crew_status_item = db_service.get_crew_status(eventId)
    if crew_status_item and 'icebreakerPrompt' in crew_status_item:
        event_clean['icebreaker'] = crew_status_item['icebreakerPrompt']
    return event_clean

@router.post("/{eventId}/join")
def join_event(eventId: str, request: JoinEventRequest):
    event = db_service.get_event(eventId)
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    
    raw_members = db_service.get_squad_members(eventId)
    members = []
    already_joined = False
    for m in raw_members:
        uid = m.get("SK", "").replace("MEMBER#", "") if "SK" in m else m.get("userId", "")
        if uid == request.userId:
            already_joined = True
        members.append({
            "userId": uid,
            "name": m.get("name", "Anon"),
            "major": m.get("major", "Undeclared"),
            "vibeSummary": m.get("vibeSummary", ""),
            "joinedAt": m.get("joinedAt", "")
        })
    
    member_count = len(members)
    crew_status_item = db_service.get_crew_status(eventId)
    existing_icebreaker = event.get("icebreakerPrompt") or (crew_status_item.get("icebreakerPrompt") if crew_status_item else None)

    # If already in squad, return current state smoothly
    if already_joined:
        return {
            "status": "ALREADY_JOINED",
            "memberCount": member_count,
            "icebreaker": existing_icebreaker,
            "members": members
        }

    # If event is already full, return squad view
    gsi1pk = event.get('GSI1PK', '')
    if (gsi1pk and gsi1pk != 'STATUS#ACTIVE') or member_count >= event.get('maxMembers', 4):
        return {
            "status": "CREW_LOCKED",
            "memberCount": member_count,
            "icebreaker": existing_icebreaker,
            "members": members
        }
        
    success = db_service.add_squad_member(eventId, request.userId, request.name, request.major, request.vibeSummary)
    if not success:
        raise HTTPException(status_code=500, detail="Failed to join event")
        
    raw_members = db_service.get_squad_members(eventId)
    member_count = len(raw_members)
    
    # Clean member dicts of DynamoDB keys
    members = []
    for m in raw_members:
        members.append({
            "userId": m.get("SK", "").replace("MEMBER#", "") if "SK" in m else m.get("userId", ""),
            "name": m.get("name", "Anon"),
            "major": m.get("major", "Undeclared"),
            "vibeSummary": m.get("vibeSummary", ""),
            "joinedAt": m.get("joinedAt", "")
        })
    
    icebreaker = existing_icebreaker
    if member_count >= event.get('maxMembers', 4):
        context = ", ".join([f"{m.get('name')} ({m.get('major')})" for m in members])
        icebreaker = bedrock_service.generate_icebreaker(context)
        db_service.update_crew_status(eventId, icebreaker)
        
    return {
        "status": "JOINED",
        "memberCount": member_count,
        "icebreaker": icebreaker,
        "members": members
    }
