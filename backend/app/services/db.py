import boto3
from boto3.dynamodb.conditions import Key
from datetime import datetime, timezone
import uuid
from typing import List, Dict, Any, Optional
from app.config import config

class DBService:
    def __init__(self):
        self.use_mock = config.USE_MOCK_AWS
        if not self.use_mock:
            self.dynamodb = boto3.resource('dynamodb', region_name=config.AWS_REGION)
            self.table = self.dynamodb.Table(config.DYNAMODB_TABLE)
        else:
            self.mock_data = {}

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

    def put_event(self, host_id: str, title: str, description: str, category: str, image_key: str, event_vector: List[float], lat: float, lng: float):
        event_id = str(uuid.uuid4())
        item = {
            'PK': f'EVENT#{event_id}',
            'SK': 'METADATA',
            'eventId': event_id,
            'GSI1PK': 'STATUS#ACTIVE',
            'GSI1SK': self._get_timestamp(),
            'hostId': host_id,
            'title': title,
            'description': description,
            'category': category,
            'imageKey': image_key,
            'eventVector': event_vector,
            'lat': lat,
            'lng': lng,
            'memberCount': 0,
            'maxMembers': 4,
            'createdAt': self._get_timestamp()
        }
        if self.use_mock:
            self.mock_data[f"{item['PK']}|{item['SK']}"] = item
        else:
            self.table.put_item(Item=item)
        return item, event_id

    def query_active_events(self) -> List[Dict]:
        if self.use_mock:
            events = []
            for k, v in self.mock_data.items():
                if v.get('GSI1PK') == 'STATUS#ACTIVE':
                    events.append(v)
            return events
        else:
            response = self.table.query(
                IndexName='GSI1',
                KeyConditionExpression=Key('GSI1PK').eq('STATUS#ACTIVE')
            )
            return response.get('Items', [])

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
        else:
            self.table.put_item(Item=item)
            # Remove from active index
            self.table.update_item(
                Key={'PK': f'EVENT#{event_id}', 'SK': 'METADATA'},
                UpdateExpression="SET GSI1PK = :status",
                ExpressionAttributeValues={':status': 'STATUS#LOCKED'}
            )

db_service = DBService()
