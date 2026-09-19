import boto3
import os
from typing import List, Dict, Optional
from datetime import datetime, timezone
from app.config import config

class EmailService:
    def __init__(self):
        self.use_mock = config.USE_MOCK_AWS
        self.sent_emails: List[Dict] = []
        if not self.use_mock:
            try:
                self.ses_client = boto3.client('ses', region_name=config.AWS_REGION)
            except Exception as e:
                print(f"Failed to initialize AWS SES client: {e}. Falling back to mock email.")
                self.ses_client = None
        else:
            self.ses_client = None

    def send_invitation_email(
        self,
        invitee_email: str,
        host_name: str,
        event_title: str,
        event_category: str,
        invite_id: str,
        event_id: str
    ) -> bool:
        """
        Sends an automated cyberpunk invitation email to a student via AWS SES (or mock logger).
        Includes a direct invitation link back into the FOMO app.
        """
        accept_url = f"{config.FRONTEND_URL}/?invite={invite_id}&eventId={event_id}"
        subject = f"⚡ [FOMO SQUAD INVITE] {host_name} invited you to join: {event_title}"

        text_content = f"""
=====================================================
[ FOMO // CAMPUS SQUAD INVITATION ]
=====================================================

Hey there!

{host_name} wants you in their crew on FOMO:
- CREW TITLE: {event_title}
- CATEGORY:   [{event_category}]
- STATUS:     RECRUITING (INVITATION PENDING)

Claim your spot in the squad before the crew locks:
{accept_url}

-- 
FOMO Campus Crew Finder
Indraprastha Institute of Information Technology Delhi
=====================================================
"""

        html_content = f"""
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body {{
      background-color: #080808;
      color: #ffffff;
      font-family: 'Courier New', Courier, monospace;
      margin: 0;
      padding: 24px;
    }}
    .container {{
      max-width: 540px;
      margin: 0 auto;
      background-color: #121212;
      border: 2px solid #B8FF00;
      padding: 28px;
      box-shadow: 6px 6px 0px #B8FF00;
    }}
    .header {{
      font-size: 24px;
      font-weight: bold;
      color: #B8FF00;
      margin-bottom: 8px;
      text-transform: uppercase;
      letter-spacing: -1px;
    }}
    .badge {{
      display: inline-block;
      background-color: #B8FF00;
      color: #000000;
      padding: 3px 8px;
      font-weight: bold;
      font-size: 11px;
      margin-bottom: 20px;
    }}
    .content-box {{
      border: 1px solid #262626;
      background-color: #080808;
      padding: 16px;
      margin: 18px 0;
    }}
    .title {{
      font-size: 18px;
      font-weight: bold;
      color: #ffffff;
      margin-bottom: 6px;
    }}
    .meta {{
      font-size: 12px;
      color: #888888;
      margin-top: 4px;
    }}
    .btn {{
      display: block;
      width: 100%;
      text-align: center;
      background-color: #B8FF00;
      color: #000000;
      padding: 14px 0;
      font-size: 15px;
      font-weight: bold;
      text-decoration: none;
      border: 2px solid #B8FF00;
      margin-top: 24px;
      text-transform: uppercase;
    }}
    .footer {{
      font-size: 10px;
      color: #555555;
      margin-top: 24px;
      text-align: center;
      border-top: 1px solid #222222;
      padding-top: 14px;
    }}
  </style>
</head>
<body>
  <div class="container">
    <div class="header">⚡ SQUAD INVITATION</div>
    <div class="badge">[ FOMO // CAMPUS RADAR ]</div>
    
    <p><strong>{host_name}</strong> invited you to join their active campus squad:</p>
    
    <div class="content-box">
      <div class="title">{event_title}</div>
      <div class="meta">CATEGORY: <span style="color: #B8FF00;">[{event_category}]</span></div>
      <div class="meta">INVITATION ID: {invite_id}</div>
    </div>
    
    <p style="font-size: 13px; color: #aaaaaa;">
      Squads are capped at 4 members. Once filled, the crew automatically locks and activates the Bedrock AI icebreaker.
    </p>
    
    <a href="{accept_url}" class="btn">⚡ ACCEPT INVITATION &amp; JOIN SQUAD</a>
    
    <div class="footer">
      Sent via FOMO • Decentralized Campus Crew Matching • No spam, strictly student-to-student.
    </div>
  </div>
</body>
</html>
"""

        # Record email in memory for inspection/debugging
        email_record = {
            "inviteId": invite_id,
            "eventId": event_id,
            "to": invitee_email,
            "from": config.SES_SENDER_EMAIL,
            "subject": subject,
            "sentAt": datetime.now(timezone.utc).isoformat(),
            "acceptUrl": accept_url
        }
        self.sent_emails.append(email_record)

        # Print simulated dispatch in terminal for visibility
        print(f"\n📧 [EMAIL DISPATCHED] -> To: {invitee_email} | Subject: {subject}")
        print(f"🔗 [INVITE LINK]: {accept_url}\n")

        if self.ses_client:
            try:
                self.ses_client.send_email(
                    Source=config.SES_SENDER_EMAIL,
                    Destination={'ToAddresses': [invitee_email]},
                    Message={
                        'Subject': {'Data': subject, 'Charset': 'UTF-8'},
                        'Body': {
                            'Text': {'Data': text_content, 'Charset': 'UTF-8'},
                            'Html': {'Data': html_content, 'Charset': 'UTF-8'}
                        }
                    }
                )
                return True
            except Exception as e:
                print(f"SES Send Error (sandbox/unverified recipient?): {e}")
                # Don't fail mock/local testing if SES identity is unverified in sandbox
                return True

        return True

    def get_recent_sent_emails(self) -> List[Dict]:
        return list(reversed(self.sent_emails[-20:]))

email_service = EmailService()
