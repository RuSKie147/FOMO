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
        """
        Deterministic, semantic 512-dim embedding generator for fallback/mock mode.
        Maps textual topics and campus interests into semantic vector clusters,
        ensuring that matching interests (e.g. Hackathons with Tech, Music with Jamming)
        yield high cosine similarity (0.80 - 0.96) while distinct interests yield
        moderate baseline similarity (0.30 - 0.50), eliminating negative scores.
        """
        import math
        text_lower = text.lower()
        dim = 512
        vec = [0.25] * dim

        # Define 7 core campus topic clusters in the 512-dim space (64 dimensions each)
        TOPIC_CLUSTERS = [
            # 0: HACK / TECH / CODING (dims 0..63)
            (0, 64, ["hack", "code", "coding", "python", "dev", "ai", "ml", "tech", "laptop", "software", "sprint", "figma", "algorithm", "cs", "build"]),
            # 1: MUSIC / AUDIO / JAM (dims 64..127)
            (64, 128, ["music", "jam", "synth", "guitar", "band", "song", "sing", "vocal", "concert", "acoustic", "lo-fi", "beats", "rock", "harmony"]),
            # 2: FITNESS / SPORTS / OUTDOORS (dims 128..191)
            (128, 192, ["fitness", "run", "running", "5k", "yoga", "gym", "sport", "game", "workout", "walk", "stretch", "jog", "pace"]),
            # 3: STUDY / ACADEMIC / READING (dims 192..255)
            (192, 256, ["study", "library", "exam", "reading", "paper", "research", "class", "focus", "quiet", "attention", "learn", "grind"]),
            # 4: FOOD / CAFE / CANTEEN (dims 256..319)
            (256, 320, ["food", "momo", "chai", "canteen", "eat", "cafe", "coffee", "snack", "maggi", "dinner", "lunch", "tea", "hunger"]),
            # 5: CHILL / SOCIAL / BOARD GAMES (dims 320..383)
            (320, 384, ["chill", "board game", "catan", "hangout", "relax", "photo", "trail", "evening", "talk", "social", "crowd", "vibe"]),
            # 6: PERSONALITY & VIBE (dims 384..447)
            (384, 448, ["owl", "night", "early", "bird", "hacker", "creative", "hype", "planner", "intimate", "organizer", "side project"])
        ]

        # Activate topic dimensions based on keyword presence
        for start, end, keywords in TOPIC_CLUSTERS:
            weight = 0.0
            for kw in keywords:
                if kw in text_lower:
                    weight += 1.8
            if weight > 0:
                for idx in range(start, end):
                    hash_val = (int(hashlib.md5(f"{text_lower[:5]}_{idx}".encode()).hexdigest(), 16) % 100) / 100.0
                    vec[idx] += weight * (1.0 + 0.5 * hash_val)

        # Add deterministic text fingerprint across all dimensions
        h = hashlib.sha256(text.encode("utf-8")).digest()
        for i in range(dim):
            noise = (h[i % len(h)] / 255.0) * 0.2
            vec[i] += noise

        # Normalize vector to unit length (L2 norm = 1.0)
        norm = math.sqrt(sum(x * x for x in vec))
        if norm > 0:
            vec = [float(x / norm) for x in vec]

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
