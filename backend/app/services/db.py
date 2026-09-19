import boto3
from boto3.dynamodb.conditions import Key
from datetime import datetime, timezone, timedelta
import uuid
import json
import os
from typing import List, Dict, Any, Optional
from app.config import config

DB_FILE = os.path.join(os.path.dirname(__file__), "..", "..", ".mock_db.json")

class DBService:
    def __init__(self):
        self.use_mock = config.USE_MOCK_AWS
        if not self.use_mock:
            self.dynamodb = boto3.resource('dynamodb', region_name=config.AWS_REGION)
            self.table = self.dynamodb.Table(config.DYNAMODB_TABLE)
        else:
            self.mock_data = self._load_mock_data()

    def _load_mock_data(self) -> Dict:
        if os.path.exists(DB_FILE):
            try:
                with open(DB_FILE, 'r', encoding='utf-8') as f:
                    data = json.load(f)
                    # Auto-heal: Ensure all events have at least 1 member (the host)
                    events = [k for k in data if k.startswith('EVENT#') and k.endswith('|METADATA')]
                    for k in events:
                        ev = data[k]
                        eid = ev.get('eventId', k.split('|')[0].replace('EVENT#', ''))
                        members = [mk for mk in data if mk.startswith(f'EVENT#{eid}|MEMBER#')]
                        if len(members) == 0:
                            host_id = ev.get('hostId', 'host_anon')
                            host_name = ev.get('hostName', 'Aditya Sharma')
                            member_key = f'EVENT#{eid}|MEMBER#{host_id}'
                            data[member_key] = {
                                'PK': f'EVENT#{eid}',
                                'SK': f'MEMBER#{host_id}',
                                'userId': host_id,
                                'GSI1PK': f'USER#{host_id}',
                                'GSI1SK': f'EVENT#{eid}',
                                'name': host_name,
                                'major': 'Host',
                                'vibeSummary': 'Squad Initiator',
                                'joinedAt': ev.get('createdAt', self._get_timestamp()),
                                'isHost': True
                            }
                            ev['memberCount'] = 1
                        else:
                            ev['memberCount'] = len(members)
                    return data
            except Exception as e:
                print(f"Warning loading mock db: {e}")
                return {}
        return {}

    def _save_mock_data(self):
        if self.use_mock:
            try:
                with open(DB_FILE, 'w', encoding='utf-8') as f:
                    json.dump(self.mock_data, f, indent=2)
            except Exception as e:
                print(f"Warning saving mock db: {e}")

    def _get_timestamp(self):
        return datetime.now(timezone.utc).isoformat()

    def put_user(self, user_id: str, email: str, name: str, major: str, vibe_vector: List[float], vibe_summary: str):
        item = {
            'PK': f'USER#{user_id}',
            'SK': 'PROFILE',
            'userId': user_id,
            'email': email,
            'name': name,
            'major': major,
            'vibeVector': vibe_vector,
            'vibeSummary': vibe_summary,
            'createdAt': self._get_timestamp()
        }
        if self.use_mock:
            self.mock_data[f"{item['PK']}|{item['SK']}"] = item
            self._save_mock_data()
        else:
            self.table.put_item(Item=item)
        return item

    def get_user(self, user_id: str) -> Optional[Dict]:
        pk = f'USER#{user_id}'
        sk = 'PROFILE'
        if self.use_mock:
            return self.mock_data.get(f"{pk}|{sk}")
        else:
            response = self.table.get_item(Key={'PK': pk, 'SK': sk})
            return response.get('Item')

    def update_user_vibe(self, user_id: str, vibe_vector: List[float], vibe_summary: str = ""):
        pk = f'USER#{user_id}'
        sk = 'PROFILE'
        if self.use_mock:
            key = f"{pk}|{sk}"
            if key in self.mock_data:
                self.mock_data[key]['vibeVector'] = vibe_vector
                if vibe_summary:
                    self.mock_data[key]['vibeSummary'] = vibe_summary
            else:
                self.mock_data[key] = {
                    'PK': pk, 'SK': sk,
                    'userId': user_id,
                    'vibeVector': vibe_vector,
                    'vibeSummary': vibe_summary,
                    'createdAt': self._get_timestamp()
                }
            self._save_mock_data()
        else:
            update_expr = "SET vibeVector = :vec"
            expr_attrs = {':vec': vibe_vector}
            if vibe_summary:
                update_expr += ", vibeSummary = :sum"
                expr_attrs[':sum'] = vibe_summary
            self.table.update_item(
                Key={'PK': pk, 'SK': sk},
                UpdateExpression=update_expr,
                ExpressionAttributeValues=expr_attrs
            )

    def put_event(self, host_id: str, title: str, description: str, category: str, image_key: str, event_vector: List[float], lat: float, lng: float, host_name: str = "", max_members: int = 4, location_name: str = "", scheduled_at: str = "", expires_at: str = ""):
        event_id = str(uuid.uuid4())
        valid_max_members = max(2, min(10, int(max_members or 4)))
        now = datetime.now(timezone.utc)
        
        if not scheduled_at:
            scheduled_at = now.isoformat()
        if not expires_at:
            try:
                dt = datetime.fromisoformat(scheduled_at.replace("Z", "+00:00"))
                expires_at = (dt + timedelta(hours=4)).isoformat()
            except Exception:
                expires_at = (now + timedelta(hours=4)).isoformat()
                
        try:
            ttl = int(datetime.fromisoformat(expires_at.replace("Z", "+00:00")).timestamp())
        except Exception:
            ttl = int((now + timedelta(hours=4)).timestamp())

        item = {
            'PK': f'EVENT#{event_id}',
            'SK': 'METADATA',
            'eventId': event_id,
            'GSI1PK': 'STATUS#ACTIVE',
            'GSI1SK': self._get_timestamp(),
            'hostId': host_id,
            'hostName': host_name or host_id,
            'title': title,
            'description': description,
            'category': category,
            'imageKey': image_key,
            'eventVector': event_vector,
            'lat': lat,
            'lng': lng,
            'locationName': location_name or "Campus Grounds",
            'scheduledAt': scheduled_at,
            'expiresAt': expires_at,
            'ttl': ttl,
            'memberCount': 0,
            'maxMembers': valid_max_members,
            'status': 'ACTIVE',
            'createdAt': self._get_timestamp()
        }
        if self.use_mock:
            self.mock_data[f"{item['PK']}|{item['SK']}"] = item
            self._save_mock_data()
        else:
            self.table.put_item(Item=item)
        return item, event_id

    def _is_expired(self, expires_at_str: str) -> bool:
        if not expires_at_str:
            return False
        try:
            exp_dt = datetime.fromisoformat(expires_at_str.replace("Z", "+00:00"))
            return exp_dt < datetime.now(timezone.utc)
        except Exception:
            return False

    def query_active_events(self) -> List[Dict]:
        if self.use_mock:
            events = []
            for k, v in self.mock_data.items():
                if v.get('GSI1PK') in ['STATUS#ACTIVE', 'STATUS#LOCKED'] or (k.startswith('EVENT#') and k.endswith('|METADATA')):
                    # Exclude cancelled or expired
                    if v.get('status') in ['CANCELLED', 'EXPIRED']:
                        continue
                    # Check expiration
                    if self._is_expired(v.get('expiresAt')):
                        v['status'] = 'EXPIRED'
                        v['GSI1PK'] = 'STATUS#EXPIRED'
                        continue
                    events.append(v)
            return events
        else:
            response = self.table.query(
                IndexName='GSI1',
                KeyConditionExpression=Key('GSI1PK').eq('STATUS#ACTIVE')
            )
            items = response.get('Items', [])
            return [it for it in items if not self._is_expired(it.get('expiresAt'))]

    def add_squad_member(self, event_id: str, user_id: str, name: str, major: str, vibe_summary: str) -> bool:
        item = {
            'PK': f'EVENT#{event_id}',
            'SK': f'MEMBER#{user_id}',
            'userId': user_id,
            'GSI1PK': f'USER#{user_id}',
            'GSI1SK': f'EVENT#{event_id}',
            'name': name,
            'major': major,
            'vibeSummary': vibe_summary,
            'joinedAt': self._get_timestamp()
        }
        member_key = f"{item['PK']}|{item['SK']}"
        if self.use_mock:
            already_member = member_key in self.mock_data
            if not already_member:
                event_key = f"EVENT#{event_id}|METADATA"
                if event_key in self.mock_data:
                    self.mock_data[event_key]['memberCount'] = self.mock_data[event_key].get('memberCount', 0) + 1
            self.mock_data[member_key] = item
            self._save_mock_data()
            return True
        else:
            try:
                existing = self.table.get_item(Key={'PK': f'EVENT#{event_id}', 'SK': f'MEMBER#{user_id}'})
                already_member = 'Item' in existing
                self.table.put_item(Item=item)
                if not already_member:
                    self.table.update_item(
                        Key={'PK': f'EVENT#{event_id}', 'SK': 'METADATA'},
                        UpdateExpression="SET memberCount = memberCount + :inc",
                        ExpressionAttributeValues={':inc': 1}
                    )
                return True
            except Exception:
                return False

    def get_squad_members(self, event_id: str) -> List[Dict]:
        if self.use_mock:
            members = []
            prefix = f"EVENT#{event_id}|MEMBER#"
            for k, v in self.mock_data.items():
                if k.startswith(prefix):
                    m = dict(v)
                    if 'userId' not in m:
                        m['userId'] = m.get('SK', '').replace('MEMBER#', '')
                    members.append(m)
            return members
        else:
            response = self.table.query(
                KeyConditionExpression=Key('PK').eq(f'EVENT#{event_id}') & Key('SK').begins_with('MEMBER#')
            )
            items = response.get('Items', [])
            for m in items:
                if 'userId' not in m:
                    m['userId'] = m.get('SK', '').replace('MEMBER#', '')
            return items

    def get_event(self, event_id: str) -> Optional[Dict]:
        if self.use_mock:
            return self.mock_data.get(f"EVENT#{event_id}|METADATA")
        else:
            response = self.table.get_item(Key={'PK': f'EVENT#{event_id}', 'SK': 'METADATA'})
            return response.get('Item')

    def get_crew_status(self, event_id: str) -> Optional[Dict]:
        if self.use_mock:
            return self.mock_data.get(f"EVENT#{event_id}|CREW#STATUS")
        else:
            res = self.table.get_item(Key={'PK': f'EVENT#{event_id}', 'SK': 'CREW#STATUS'})
            return res.get('Item')

    def update_crew_status(self, event_id: str, icebreaker: str):
        item = {
            'PK': f'EVENT#{event_id}',
            'SK': 'CREW#STATUS',
            'status': 'CREW_LOCKED',
            'icebreakerPrompt': icebreaker,
            'finalizedAt': self._get_timestamp()
        }
        if self.use_mock:
            self.mock_data[f"{item['PK']}|{item['SK']}"] = item
            
            # also update event
            event_key = f"EVENT#{event_id}|METADATA"
            if event_key in self.mock_data:
                self.mock_data[event_key]['GSI1PK'] = 'STATUS#LOCKED'
                self.mock_data[event_key]['status'] = 'CREW_LOCKED'
                self.mock_data[event_key]['icebreakerPrompt'] = icebreaker
            self._save_mock_data()
        else:
            self.table.put_item(Item=item)
            # Remove from active index
            self.table.update_item(
                Key={'PK': f'EVENT#{event_id}', 'SK': 'METADATA'},
                UpdateExpression="SET GSI1PK = :status, icebreakerPrompt = :ice",
                ExpressionAttributeValues={':status': 'STATUS#LOCKED', ':ice': icebreaker}
            )

    # ---------------------------------------------------------
    # Invitation Methods
    # ---------------------------------------------------------
    def create_invitation(
        self,
        event_id: str,
        event_title: str,
        event_category: str,
        host_id: str,
        host_name: str,
        invitee_email: str
    ) -> Dict:
        invite_id = str(uuid.uuid4())
        clean_email = invitee_email.lower().strip()
        item = {
            'PK': f'INVITE#{invite_id}',
            'SK': 'METADATA',
            'GSI1PK': f'USER_EMAIL#{clean_email}',
            'GSI1SK': 'STATUS#PENDING',
            'inviteId': invite_id,
            'eventId': event_id,
            'eventTitle': event_title,
            'eventCategory': event_category,
            'hostId': host_id,
            'hostName': host_name,
            'inviteeEmail': clean_email,
            'status': 'PENDING',
            'createdAt': self._get_timestamp()
        }
        if self.use_mock:
            self.mock_data[f"{item['PK']}|{item['SK']}"] = item
            self._save_mock_data()
        else:
            self.table.put_item(Item=item)
        return item

    def get_invitation(self, invite_id: str) -> Optional[Dict]:
        pk = f'INVITE#{invite_id}'
        sk = 'METADATA'
        if self.use_mock:
            return self.mock_data.get(f"{pk}|{sk}")
        else:
            res = self.table.get_item(Key={'PK': pk, 'SK': sk})
            return res.get('Item')

    def get_pending_invitations_for_email(self, email: str) -> List[Dict]:
        clean_email = email.lower().strip()
        if self.use_mock:
            results = []
            for k, v in self.mock_data.items():
                if k.startswith('INVITE#') and k.endswith('|METADATA'):
                    if v.get('inviteeEmail') == clean_email and v.get('status') == 'PENDING':
                        results.append(v)
            return sorted(results, key=lambda x: x.get('createdAt', ''), reverse=True)
        else:
            res = self.table.query(
                IndexName='GSI1',
                KeyConditionExpression=Key('GSI1PK').eq(f'USER_EMAIL#{clean_email}') & Key('GSI1SK').eq('STATUS#PENDING')
            )
            return res.get('Items', [])

    def update_invitation_status(self, invite_id: str, new_status: str) -> bool:
        pk = f'INVITE#{invite_id}'
        sk = 'METADATA'
        timestamp = self._get_timestamp()
        if self.use_mock:
            key = f"{pk}|{sk}"
            if key in self.mock_data:
                self.mock_data[key]['status'] = new_status
                self.mock_data[key]['GSI1SK'] = f'STATUS#{new_status}'
                self.mock_data[key]['updatedAt'] = timestamp
                self._save_mock_data()
                return True
            return False
        else:
            try:
                self.table.update_item(
                    Key={'PK': pk, 'SK': sk},
                    UpdateExpression="SET #s = :status, GSI1SK = :gsi1sk, updatedAt = :time",
                    ExpressionAttributeNames={'#s': 'status'},
                    ExpressionAttributeValues={
                        ':status': new_status,
                        ':gsi1sk': f'STATUS#{new_status}',
                        ':time': timestamp
                    }
                )
                return True
            except Exception as e:
                print(f"Error updating invitation: {e}")
                return False

    # ---------------------------------------------------------
    # Squad Leaving & Event Cancellation
    # ---------------------------------------------------------
    def remove_squad_member(self, event_id: str, user_id: str) -> bool:
        pk = f'EVENT#{event_id}'
        sk = f'MEMBER#{user_id}'
        if self.use_mock:
            key = f"{pk}|{sk}"
            if key in self.mock_data:
                del self.mock_data[key]
                event_key = f"{pk}|METADATA"
                if event_key in self.mock_data:
                    ev = self.mock_data[event_key]
                    ev['memberCount'] = max(0, ev.get('memberCount', 1) - 1)
                    # If previously locked, unlock it because a slot freed up
                    if ev.get('status') == 'CREW_LOCKED':
                        ev['status'] = 'ACTIVE'
                        ev['GSI1PK'] = 'STATUS#ACTIVE'
                crew_key = f"{pk}|CREW#STATUS"
                if crew_key in self.mock_data:
                    del self.mock_data[crew_key]
                self._save_mock_data()
                return True
            return False
        else:
            try:
                self.table.delete_item(Key={'PK': pk, 'SK': sk})
                self.table.update_item(
                    Key={'PK': pk, 'SK': 'METADATA'},
                    UpdateExpression="SET memberCount = memberCount - :dec, GSI1PK = :status, #st = :status_val",
                    ExpressionAttributeNames={'#st': 'status'},
                    ExpressionAttributeValues={
                        ':dec': 1,
                        ':status': 'STATUS#ACTIVE',
                        ':status_val': 'ACTIVE'
                    }
                )
                return True
            except Exception as e:
                print(f"Error removing member: {e}")
                return False

    def delete_event(self, event_id: str, host_id: str) -> bool:
        pk = f'EVENT#{event_id}'
        sk = 'METADATA'
        if self.use_mock:
            event_key = f"{pk}|{sk}"
            if event_key in self.mock_data:
                ev = self.mock_data[event_key]
                if ev.get('hostId') != host_id:
                    return False
                ev['status'] = 'CANCELLED'
                ev['GSI1PK'] = 'STATUS#CANCELLED'
                self._save_mock_data()
                return True
            return False
        else:
            try:
                self.table.update_item(
                    Key={'PK': pk, 'SK': sk},
                    UpdateExpression="SET #st = :c, GSI1PK = :c_pk",
                    ExpressionAttributeNames={'#st': 'status'},
                    ExpressionAttributeValues={
                        ':c': 'CANCELLED',
                        ':c_pk': 'STATUS#CANCELLED'
                    }
                )
                return True
            except Exception as e:
                print(f"Error deleting event: {e}")
                return False

    # ---------------------------------------------------------
    # Crew Group Chat Methods
    # ---------------------------------------------------------
    def add_chat_message(self, event_id: str, user_id: str, user_name: str, text: str) -> Dict:
        msg_id = str(uuid.uuid4())
        ts = self._get_timestamp()
        item = {
            'PK': f'EVENT#{event_id}',
            'SK': f'MSG#{ts}#{msg_id}',
            'messageId': msg_id,
            'eventId': event_id,
            'userId': user_id,
            'userName': user_name,
            'text': text,
            'timestamp': ts
        }
        if self.use_mock:
            self.mock_data[f"{item['PK']}|{item['SK']}"] = item
            self._save_mock_data()
        else:
            self.table.put_item(Item=item)
        return item

    def get_chat_messages(self, event_id: str) -> List[Dict]:
        if self.use_mock:
            messages = []
            prefix = f"EVENT#{event_id}|MSG#"
            for k, v in self.mock_data.items():
                if k.startswith(prefix):
                    clean = dict(v)
                    clean.pop('PK', None)
                    clean.pop('SK', None)
                    messages.append(clean)
            return sorted(messages, key=lambda x: x.get('timestamp', ''))
        else:
            res = self.table.query(
                KeyConditionExpression=Key('PK').eq(f'EVENT#{event_id}') & Key('SK').begins_with('MSG#')
            )
            items = []
            for m in res.get('Items', []):
                clean = dict(m)
                clean.pop('PK', None)
                clean.pop('SK', None)
                items.append(clean)
            return sorted(items, key=lambda x: x.get('timestamp', ''))

db_service = DBService()

