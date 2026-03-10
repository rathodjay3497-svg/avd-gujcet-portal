import boto3
from app.config import get_settings

settings = get_settings()


def _get_ses_client():
    return boto3.client("ses", region_name=settings.AWS_REGION)


def send_registration_email(
    to_email: str,
    name: str,
    event_title: str,
    reg_id: str,
    event_date: str,
    venue: str,
):
    """Send registration confirmation email with event details."""
    ses = _get_ses_client()

    html_body = f"""
    <html>
    <body style="font-family: 'Inter', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: #1A3C6E; padding: 24px; text-align: center; border-radius: 12px 12px 0 0;">
            <h1 style="color: #fff; margin: 0; font-size: 24px;">Registration Confirmed!</h1>
        </div>
        <div style="background: #fff; padding: 32px; border: 1px solid #E2E8F0; border-top: none; border-radius: 0 0 12px 12px;">
            <p style="color: #1E293B; font-size: 16px;">Hi <strong>{name}</strong>,</p>
            <p style="color: #64748B;">You have been successfully registered for:</p>

            <div style="background: #EFF6FF; padding: 20px; border-radius: 8px; margin: 16px 0;">
                <h2 style="color: #1A3C6E; margin: 0 0 8px;">{event_title}</h2>
                <p style="margin: 4px 0; color: #1E293B;">Date: <strong>{event_date}</strong></p>
                <p style="margin: 4px 0; color: #1E293B;">Venue: <strong>{venue}</strong></p>
            </div>

            <div style="background: #F0FDF4; padding: 16px; border-radius: 8px; text-align: center; margin: 16px 0;">
                <p style="color: #64748B; margin: 0 0 4px; font-size: 14px;">Your Registration ID</p>
                <p style="color: #1A3C6E; font-size: 28px; font-weight: 700; margin: 0; font-family: monospace;">{reg_id}</p>
            </div>

            <p style="color: #64748B; font-size: 14px;">Please keep this registration ID safe. You will need it for entry.</p>
            <p style="color: #64748B; font-size: 14px;">Your admit card PDF is attached to this email or available for download from the website.</p>

            <hr style="border: none; border-top: 1px solid #E2E8F0; margin: 24px 0;">
            <p style="color: #94A3B8; font-size: 12px; text-align: center;">
                GUJCET Free Counseling Platform &bull; This is an automated email.
            </p>
        </div>
    </body>
    </html>
    """

    ses.send_email(
        Source=settings.SES_SENDER_EMAIL,
        Destination={"ToAddresses": [to_email]},
        Message={
            "Subject": {"Data": f"Registration Confirmed - {event_title} [{reg_id}]"},
            "Body": {"Html": {"Data": html_body}},
        },
    )


def send_bulk_email(recipients: list[dict], subject: str, message: str):
    """Send bulk emails. Each recipient is a dict with 'email' key."""
    ses = _get_ses_client()
    for r in recipients:
        ses.send_email(
            Source=settings.SES_SENDER_EMAIL,
            Destination={"ToAddresses": [r["email"]]},
            Message={
                "Subject": {"Data": subject},
                "Body": {"Text": {"Data": message}},
            },
        )
