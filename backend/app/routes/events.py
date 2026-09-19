from fastapi import APIRouter, Query, HTTPException
from app.models.schemas import EventCreateRequest, EventCreateResponse, JoinEventRequest, LeaveEventRequest, ChatMessageRequest
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
        host_name=host_name,
        max_members=request.maxMembers or 4,
        location_name=request.locationName or "",
        scheduled_at=request.scheduledAt or "",
        expires_at=request.expiresAt or ""
    )
    
    # Automatically add host as the first member of their own squad
    user_info = db_service.get_user(host_id)
    host_major = user_info.get("major", "Host") if user_info else "Host"
    host_vibe = user_info.get("vibeSummary", "Squad Initiator") if user_info else "Squad Initiator"
    db_service.add_squad_member(
        event_id=event_id,
        user_id=host_id,
        name=host_name,
        major=host_major,
        vibe_summary=host_vibe
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
                event_id=event_id,
                max_members=request.maxMembers or 4
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
    
    clean_events = []
    for event in ranked:
        event_clean = dict(event)
        pk = event_clean.pop('PK', '')
        event_id = pk.replace('EVENT#', '') if pk else event_clean.get('eventId', '')
        event_clean['eventId'] = event_id
        
        if 'hostName' not in event_clean:
            event_clean['hostName'] = event_clean.get('hostId', 'Anon')
            
        gsi1pk = event_clean.get('GSI1PK', '')
        if gsi1pk == 'STATUS#ACTIVE':
            event_clean['status'] = 'ACTIVE'
        elif gsi1pk == 'STATUS#LOCKED':
            event_clean['status'] = 'CREW_LOCKED'
            
        # Get live squad members to ensure party count and membership are 100% accurate
        raw_members = db_service.get_squad_members(event_id)
        if len(raw_members) == 0:
            host_id = event_clean.get('hostId') or 'user_host'
            host_name = event_clean.get('hostName') or host_id
            db_service.add_squad_member(
                event_id=event_id,
                user_id=host_id,
                name=host_name,
                major="Host",
                vibe_summary="Squad Initiator"
            )
            raw_members = db_service.get_squad_members(event_id)

        event_clean['memberCount'] = max(1, len(raw_members))
        event_clean['maxMembers'] = event_clean.get('maxMembers', 4)
        event_clean['memberIds'] = [
            m.get("SK", "").replace("MEMBER#", "") if "SK" in m else m.get("userId", "")
            for m in raw_members
        ]
        
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
    if len(raw_members) == 0:
        host_id = event.get('hostId') or 'user_host'
        host_name = event.get('hostName') or host_id
        db_service.add_squad_member(
            event_id=eventId,
            user_id=host_id,
            name=host_name,
            major="Host",
            vibe_summary="Squad Initiator"
        )
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
    event_clean['memberCount'] = max(1, len(members))
    event_clean['maxMembers'] = event_clean.get('maxMembers', 4)
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
    if len(raw_members) == 0:
        host_id = event.get('hostId') or 'user_host'
        host_name = event.get('hostName') or host_id
        db_service.add_squad_member(
            event_id=eventId,
            user_id=host_id,
            name=host_name,
            major="Host",
            vibe_summary="Squad Initiator"
        )
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
    max_members = event.get('maxMembers', 4)
    crew_status_item = db_service.get_crew_status(eventId)
    existing_icebreaker = event.get("icebreakerPrompt") or (crew_status_item.get("icebreakerPrompt") if crew_status_item else None)

    event_info = {
        "eventId": eventId,
        "title": event.get("title", "Campus Event"),
        "category": event.get("category", "CHILL"),
        "description": event.get("description", ""),
        "hostId": event.get("hostId", ""),
        "hostName": event.get("hostName", "Host"),
        "maxMembers": max_members,
        "locationName": event.get("locationName", "Campus Grounds"),
        "lat": event.get("lat"),
        "lng": event.get("lng"),
        "scheduledAt": event.get("scheduledAt"),
        "expiresAt": event.get("expiresAt")
    }

    # If already in squad, return current state smoothly
    if already_joined:
        return {
            **event_info,
            "status": "ALREADY_JOINED",
            "memberCount": member_count,
            "icebreaker": existing_icebreaker,
            "members": members
        }

    # If event is already full, return squad view
    gsi1pk = event.get('GSI1PK', '')
    if (gsi1pk and gsi1pk != 'STATUS#ACTIVE') or member_count >= max_members:
        return {
            **event_info,
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
    if member_count >= max_members:
        context = ", ".join([f"{m.get('name')} ({m.get('major')})" for m in members])
        icebreaker = bedrock_service.generate_icebreaker(context)
        db_service.update_crew_status(eventId, icebreaker)
        
    return {
        **event_info,
        "status": "JOINED",
        "memberCount": member_count,
        "icebreaker": icebreaker,
        "members": members
    }

@router.post("/{eventId}/leave")
def leave_event(eventId: str, request: LeaveEventRequest):
    event = db_service.get_event(eventId)
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
        
    if event.get("hostId") == request.userId:
        raise HTTPException(status_code=400, detail="Hosts cannot leave their own event. Use cancel event instead.")
        
    success = db_service.remove_squad_member(eventId, request.userId)
    if not success:
        raise HTTPException(status_code=400, detail="User was not in this squad")
        
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
        
    return {
        "status": "LEFT",
        "eventId": eventId,
        "memberCount": len(members),
        "members": members
    }

@router.delete("/{eventId}")
def cancel_event(eventId: str, hostId: str = Query(...)):
    success = db_service.delete_event(eventId, hostId)
    if not success:
        raise HTTPException(status_code=403, detail="Only the host can cancel this event")
    return {"status": "CANCELLED", "eventId": eventId}

@router.get("/{eventId}/messages")
def get_event_messages(eventId: str):
    messages = db_service.get_chat_messages(eventId)
    return {"messages": messages}

@router.post("/{eventId}/messages")
def post_event_message(eventId: str, request: ChatMessageRequest):
    msg = db_service.add_chat_message(
        event_id=eventId,
        user_id=request.userId,
        user_name=request.userName,
        text=request.text
    )
    return msg
