import os

class Config:
    AWS_REGION = os.getenv("AWS_REGION", os.getenv("AWS_REGION_NAME", "ap-south-1"))
    DYNAMODB_TABLE = os.getenv("DYNAMODB_TABLE", os.getenv("TABLE_NAME", "FOMOEngine"))
    S3_BUCKET = os.getenv("S3_BUCKET", os.getenv("MEDIA_BUCKET", "fomo-uploads-bucket"))
    
    # Feature flags and fallbacks:
    # On AWS Lambda, AWS_LAMBDA_FUNCTION_NAME is always set, so default to real AWS (False).
    # Locally, default to True so developers don't need AWS credentials to test.
    IS_LAMBDA = bool(os.getenv("AWS_LAMBDA_FUNCTION_NAME"))
    USE_MOCK_AWS = os.getenv("USE_MOCK_AWS", "false" if IS_LAMBDA else "true").lower() == "true"
    
    # Bedrock Models
    BEDROCK_EMBEDDING_MODEL = os.getenv("BEDROCK_EMBEDDING_MODEL", "amazon.titan-embed-text-v2:0")
    # In ap-south-1, Claude 3 Haiku uses the apac inference profile
    BEDROCK_ICEBREAKER_MODEL = os.getenv(
        "BEDROCK_ICEBREAKER_MODEL", 
        "apac.anthropic.claude-3-haiku-20240307-v1:0" if "ap-south-1" in os.getenv("AWS_REGION", "ap-south-1") else "anthropic.claude-3-haiku-20240307-v1:0"
    )
    
    # IIIT Delhi (Okhla Phase III) Campus Coordinates
    CAMPUS_LAT = 28.5458
    CAMPUS_LNG = 77.2733
    DEFAULT_RADIUS_KM = 8.0

config = Config()
