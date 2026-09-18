import boto3
import uuid
from botocore.exceptions import ClientError
from app.config import config

class S3Service:
    def __init__(self):
        if not config.USE_MOCK_AWS:
            self.client = boto3.client('s3', region_name=config.AWS_REGION)
        else:
            self.client = None

    def generate_presigned_url(self, file_name: str, file_type: str):
        key = f"uploads/{uuid.uuid4()}-{file_name}"
        
        if self.client:
            try:
                url = self.client.generate_presigned_url(
                    ClientMethod='put_object',
                    Params={
                        'Bucket': config.S3_BUCKET,
                        'Key': key,
                        'ContentType': file_type
                    },
                    ExpiresIn=3600
                )
                return url, key, f"https://{config.S3_BUCKET}.s3.{config.AWS_REGION}.amazonaws.com/{key}"
            except ClientError as e:
                print(f"Error generating presigned URL: {e}")
                
        # Mock fallback
        mock_url = f"http://localhost:8000/mock-s3-upload/{key}"
        public_url = f"http://localhost:8000/mock-s3/{key}"
        return mock_url, key, public_url

s3_service = S3Service()
