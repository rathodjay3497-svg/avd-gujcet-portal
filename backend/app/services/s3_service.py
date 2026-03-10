import boto3
from app.config import get_settings
from app.logger import s3_logger, get_request_id

settings = get_settings()


def _get_s3_client():
    return boto3.client(
        "s3",
        region_name=settings.AWS_REGION,
        aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
        aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
    )


def upload_pdf(file_bytes: bytes, key: str) -> str:
    """Upload a PDF to S3 and return the object key."""
    request_id = get_request_id()
    s3_logger.info(f"Uploading PDF to S3: {key}", request_id=request_id, extra={"key": key, "size": len(file_bytes)})
    try:
        s3 = _get_s3_client()
        s3.put_object(
            Bucket=settings.S3_BUCKET_NAME,
            Key=key,
            Body=file_bytes,
            ContentType="application/pdf",
        )
        s3_logger.info(f"PDF uploaded successfully: {key}", request_id=request_id)
        return key
    except Exception as e:
        s3_logger.error(f"Error uploading PDF to S3: {str(e)}", request_id=request_id, exc_info=True, extra={"key": key})
        raise


def get_presigned_url(key: str, expiry: int = 3600) -> str:
    """Generate a pre-signed URL for downloading a PDF (default 1 hour)."""
    request_id = get_request_id()
    s3_logger.debug(f"Generating presigned URL for key: {key}, expiry: {expiry}s", request_id=request_id, extra={"key": key, "expiry": expiry})
    try:
        s3 = _get_s3_client()
        url = s3.generate_presigned_url(
            "get_object",
            Params={"Bucket": settings.S3_BUCKET_NAME, "Key": key},
            ExpiresIn=expiry,
        )
        s3_logger.info(f"Presigned URL generated successfully for key: {key}", request_id=request_id)
        return url
    except Exception as e:
        s3_logger.error(f"Error generating presigned URL for key {key}: {str(e)}", request_id=request_id, exc_info=True, extra={"key": key})
        raise
