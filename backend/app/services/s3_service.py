import boto3
from app.config import get_settings

settings = get_settings()


def _get_s3_client():
    return boto3.client("s3", region_name=settings.AWS_REGION)


def upload_pdf(file_bytes: bytes, key: str) -> str:
    """Upload a PDF to S3 and return the object key."""
    s3 = _get_s3_client()
    s3.put_object(
        Bucket=settings.S3_BUCKET_NAME,
        Key=key,
        Body=file_bytes,
        ContentType="application/pdf",
    )
    return key


def get_presigned_url(key: str, expiry: int = 3600) -> str:
    """Generate a pre-signed URL for downloading a PDF (default 1 hour)."""
    s3 = _get_s3_client()
    return s3.generate_presigned_url(
        "get_object",
        Params={"Bucket": settings.S3_BUCKET_NAME, "Key": key},
        ExpiresIn=expiry,
    )
