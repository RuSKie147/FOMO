import json
import boto3
import hashlib
from typing import List
from botocore.config import Config as BotoConfig
from botocore.exceptions import ClientError
from app.config import config

class BedrockService:
    def __init__(self):
        boto_config = BotoConfig(
            read_timeout=3.0,
            connect_timeout=3.0,
            retries={"max_attempts": 1}
        )
        if not config.USE_MOCK_AWS:
            try:
                self.client = boto3.client("bedrock-runtime", region_name=config.AWS_REGION, config=boto_config)
            except Exception:
                self.client = None
        else:
            self.client = None

    def _fallback_vector(self, text: str) -> List[float]:
        # Deterministic hash-based vector from text keywords
        h = hashlib.sha256(text.encode("utf-8")).digest()
        vec = []
        for i in range(512):
            val = (h[i % len(h)] / 255.0) * 2.0 - 1.0
            vec.append(val)
        return vec

    def generate_embedding(self, text: str) -> List[float]:
        if not self.client:
            return self._fallback_vector(text)
            
        try:
            body = json.dumps({"inputText": text})
            response = self.client.invoke_model(
                body=body,
                modelId=config.BEDROCK_EMBEDDING_MODEL,
                accept="application/json",
                contentType="application/json"
            )
            response_body = json.loads(response.get("body").read())
            return response_body.get("embedding", self._fallback_vector(text))
        except (ClientError, Exception) as e:
            print(f"Bedrock timeout or error: {e}")
            return self._fallback_vector(text)

    def generate_icebreaker(self, context: str) -> str:
        fallback = "Welcome to your crew! You all share an interest in late-night creativity and collaborative campus projects. Ask the squad what project or track they're currently obsessed with to kick off!"
        
        if not self.client:
            return fallback

        try:
            prompt = f"System: You are a social facilitator for college students. Keep it under 120 tokens.\n\nUser: Create a fun icebreaker for these users: {context}"
            body = json.dumps({
                "anthropic_version": "bedrock-2023-05-31",
                "max_tokens": 120,
                "temperature": 0.7,
                "messages": [
                    {
                        "role": "user",
                        "content": prompt
                    }
                ]
            })
            response = self.client.invoke_model(
                body=body,
                modelId=config.BEDROCK_ICEBREAKER_MODEL,
                accept="application/json",
                contentType="application/json"
            )
            response_body = json.loads(response.get("body").read())
            return response_body.get("content", [{"text": fallback}])[0].get("text", fallback)
        except (ClientError, Exception) as e:
            print(f"Bedrock timeout or error: {e}")
            return fallback

bedrock_service = BedrockService()
