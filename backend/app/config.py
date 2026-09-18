import os

class Config:
    AWS_REGION = os.getenv("AWS_REGION", "us-east-1")
    DYNAMODB_TABLE = os.getenv("DYNAMODB_TABLE", "FOMOEngine")
    S3_BUCKET = os.getenv("S3_BUCKET", "fomo-uploads-bucket")
    
    # Feature flags and fallbacks
    USE_MOCK_AWS = os.getenv("USE_MOCK_AWS", "true").lower() == "true"
    
    # Bedrock Models
    BEDROCK_EMBEDDING_MODEL = "amazon.titan-embed-text-v2:0"
    BEDROCK_ICEBREAKER_MODEL = "anthropic.claude-3-haiku-20240307-v1:0"
    
    # Map
    CAMPUS_LAT = 28.5458
    CAMPUS_LNG = 77.2732
    DEFAULT_RADIUS_KM = 8.0

config = Config()
