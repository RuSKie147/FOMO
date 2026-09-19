from fastapi import APIRouter, HTTPException, Query
from typing import List, Optional
from app.models.schemas import AcceptInviteRequest, SendInvitesRequest
from app.services.db import db_service
from app.services.email_service import email_service
from app.services.bedrock_service import bedrock_service

router = APIRouter()

@router.get("/pending")
def get_pending_invitations(email: str = Query(..., description="Student email to look up invitations for")):
    """
    Returns all pending squad invitations for a given student email.
    """
    invitations = db_service.get_pending_invitations_for_email(email)
    clean_invites = []
    for inv in invitations:
        item = dict(inv)
        # Clean DynamoDB internal keys
        for k in ['PK', 'SK', 'GSI1PK', 'GSI1SK']:
            item.pop(k, None)
        clean_invites.append(item)
    return {
        "invitations": clean_invites,
        "count": len(clean_invites)
    }

@router.get("/sent/recent")
def get_recent_sent_invitations():
    """
    Returns recently dispatched email records (for debugging/inspection).
    """
    return {
        "sentEmails": email_service.get_recent_sent_emails()
    }

@router.get("/{inviteId}")
def get_invitation_details(inviteId: str):
    """
    Retrieves details for a single invitation token.
    """
    inv = db_service.get_invitation(inviteId)
    if not inv:
        raise HTTPException(status_code=404, detail="Invitation not found")
    
    clean_inv = dict(inv)
    for k in ['PK', 'SK', 'GSI1PK', 'GSI1SK']:
        clean_inv.pop(k, None)

    # Attach current event info if available
    event = db_service.get_event(inv.get("eventId", ""))
    if event:
        clean_inv["eventStatus"] = event.get("status", "ACTIVE")
        clean_inv["memberCount"] = event.get("memberCount", 0)
        clean_inv["maxMembers"] = event.get("maxMembers", 4)
        clean_inv["eventDescription"] = event.get("description", "")

    return clean_inv

@router.post("/{inviteId}/accept")
def accept_invitation(inviteId: str, request: AcceptInviteRequest):
    """
    Accepts an invitation, joins the squad, updates invitation status,
    and locks the crew with an AI icebreaker if full.
    """
    inv = db_service.get_invitation(inviteId)
    if not inv:
        raise HTTPException(status_code=404, detail="Invitation not found")
    
    event_id = inv.get("eventId")
    event = db_service.get_event(event_id)
    if not event:
        raise HTTPException(status_code=404, detail="Associated event no longer exists")

    # Check if squad is already full
    raw_members = db_service.get_squad_members(event_id)
    current_count = len(raw_members)
    max_members = event.get("maxMembers", 4)

    # Check if user is already a member
    already_member = any(
        (m.get("SK", "").replace("MEMBER#", "") == request.userId or m.get("userId") == request.userId)
        for m in raw_members
    )

    if not already_member and current_count >= max_members:
        db_service.update_invitation_status(inviteId, "EXPIRED")
        raise HTTPException(status_code=400, detail="Squad is already full and locked!")

    if not already_member:
        success = db_service.add_squad_member(
            event_id=event_id,
            user_id=request.userId,
            name=request.name or "Anon",
            major=request.major or "Undeclared",
            vibe_summary=request.vibeSummary or ""
        )
        if not success:
            raise HTTPException(status_code=500, detail="Failed to join squad")

    # Mark invitation as ACCEPTED
    db_service.update_invitation_status(inviteId, "ACCEPTED")

    # Fetch updated members
    updated_members = db_service.get_squad_members(event_id)
    clean_members = []
    for m in updated_members:
        clean_members.append({
            "userId": m.get("SK", "").replace("MEMBER#", "") if "SK" in m else m.get("userId", ""),
            "name": m.get("name", "Anon"),
            "major": m.get("major", "Undeclared"),
            "vibeSummary": m.get("vibeSummary", ""),
            "joinedAt": m.get("joinedAt", "")
        })

    # Check if squad should be locked
    crew_status_item = db_service.get_crew_status(event_id)
    icebreaker = crew_status_item.get("icebreakerPrompt") if crew_status_item else event.get("icebreakerPrompt")

    if len(clean_members) >= max_members and not icebreaker:
        context = ", ".join([f"{m.get('name')} ({m.get('major')})" for m in clean_members])
        icebreaker = bedrock_service.generate_icebreaker(context)
        db_service.update_crew_status(event_id, icebreaker)

    return {
        "status": "ACCEPTED",
        "eventId": event_id,
        "memberCount": len(clean_members),
        "members": clean_members,
        "icebreaker": icebreaker,
        "message": "Successfully joined squad!"
    }

@router.post("/{inviteId}/decline")
def decline_invitation(inviteId: str):
    """
    Declines an invitation.
    """
    inv = db_service.get_invitation(inviteId)
    if not inv:
        raise HTTPException(status_code=404, detail="Invitation not found")
    
    db_service.update_invitation_status(inviteId, "DECLINED")
    return {
        "status": "DECLINED",
        "message": "Invitation declined."
    }

@router.post("/send")
def send_invitations(request: SendInvitesRequest):
    """
    Dispatches squad invitation emails to a list of student emails.
    """
    event = db_service.get_event(request.eventId)
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    
    event_title = request.title or event.get("title", "Campus Event")
    event_category = request.category or event.get("category", "CHILL")
    
    host_user = db_service.get_user(request.hostId)
    host_email = host_user.get("email", "").lower().strip() if host_user else ""

    sent_invites = []
    for email in request.inviteEmails:
        clean_email = email.strip()
        if not clean_email or "@" not in clean_email:
            continue
        
        # Disallow self-invitation
        if host_email and clean_email.lower() == host_email:
            continue
        
        # 1. Create DB record
        invite_record = db_service.create_invitation(
            event_id=request.eventId,
            event_title=event_title,
            event_category=event_category,
            host_id=request.hostId,
            host_name=request.hostName,
            invitee_email=clean_email
        )
        
        # 2. Send email
        email_service.send_invitation_email(
            invitee_email=clean_email,
            host_name=request.hostName,
            event_title=event_title,
            event_category=event_category,
            invite_id=invite_record["inviteId"],
            event_id=request.eventId
        )
        
        sent_invites.append({
            "inviteId": invite_record["inviteId"],
            "email": clean_email,
            "status": "PENDING"
        })

    return {
        "status": "SUCCESS",
        "eventId": request.eventId,
        "sentCount": len(sent_invites),
        "invitations": sent_invites
    }
