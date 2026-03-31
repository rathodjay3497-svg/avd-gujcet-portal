import io
import qrcode
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm
from reportlab.lib.colors import HexColor
from reportlab.pdfgen import canvas

from app.logger import pdf_logger, get_request_id


def generate_admit_card(
    name: str,
    registration_id: str,
    event_title: str,
    event_date: str,
    venue: str,
    phone: str,
    stream: str = "",
) -> bytes:
    """Generate a PDF admit card with student details and QR code."""
    request_id = get_request_id()
    pdf_logger.info(
        f"Generating admit card for reg_id: {registration_id}, name: {name}, event: {event_title}",
        request_id=request_id,
        extra={"registration_id": registration_id, "name": name, "event_title": event_title}
    )
    
    try:
        buffer = io.BytesIO()
        c = canvas.Canvas(buffer, pagesize=A4)
        width, height = A4

        # Colors
        navy = HexColor("#1A3C6E")
        blue = HexColor("#2563EB")
        light_bg = HexColor("#EFF6FF")
        text_color = HexColor("#1E293B")
        muted = HexColor("#64748B")

        # ─── Header ───────────────────────────────────────────
        c.setFillColor(navy)
        c.rect(0, height - 80, width, 80, fill=1, stroke=0)
        c.setFillColor(HexColor("#FFFFFF"))
        c.setFont("Helvetica-Bold", 22)
        c.drawCentredString(width / 2, height - 35, "ADMIT CARD")
        c.setFont("Helvetica", 12)
        c.drawCentredString(width / 2, height - 55, "GUJCET Free Counseling Platform")

        # ─── Event Title ──────────────────────────────────────
        y = height - 120
        c.setFillColor(blue)
        c.setFont("Helvetica-Bold", 16)
        c.drawCentredString(width / 2, y, event_title)

        # ─── QR Code ──────────────────────────────────────────
        qr = qrcode.make(registration_id, box_size=4, border=2)
        qr_buffer = io.BytesIO()
        qr.save(qr_buffer, format="PNG")
        qr_buffer.seek(0)

        from reportlab.lib.utils import ImageReader
        qr_img = ImageReader(qr_buffer)
        qr_size = 35 * mm
        c.drawImage(qr_img, width - 60 * mm, y - 80, qr_size, qr_size)

        # ─── Student Details ──────────────────────────────────
        y -= 30
        details = [
            ("Registration ID", registration_id),
            ("Student Name", name),
            ("Phone", phone),
            ("Stream", stream),
            ("Event Date", event_date),
            ("Venue", venue),
        ]

        left_margin = 30 * mm
        for label, value in details:
            c.setFont("Helvetica", 10)
            c.setFillColor(muted)
            c.drawString(left_margin, y, label)
            c.setFont("Helvetica-Bold", 12)
            c.setFillColor(text_color)
            c.drawString(left_margin + 110, y, str(value) if value else "N/A")
            y -= 22

        # ─── Divider ──────────────────────────────────────────
        y -= 10
        c.setStrokeColor(HexColor("#E2E8F0"))
        c.line(left_margin, y, width - left_margin, y)
        y -= 20

        # ─── Instructions ─────────────────────────────────────
        c.setFont("Helvetica-Bold", 11)
        c.setFillColor(navy)
        c.drawString(left_margin, y, "Instructions:")
        y -= 18

        instructions = [
            "1. Please carry this admit card (printed or digital) to the venue.",
            "2. Arrive 30 minutes before the scheduled time.",
            "3. Bring a valid photo ID along with this admit card.",
            "4. This admit card is non-transferable.",
        ]
        c.setFont("Helvetica", 10)
        c.setFillColor(text_color)
        for line in instructions:
            c.drawString(left_margin + 5, y, line)
            y -= 16

        # ─── Footer ───────────────────────────────────────────
        c.setFillColor(light_bg)
        c.rect(0, 0, width, 40, fill=1, stroke=0)
        c.setFont("Helvetica", 8)
        c.setFillColor(muted)
        c.drawCentredString(width / 2, 18, "This is a computer-generated document. No signature is required.")
        c.drawCentredString(width / 2, 8, f"Registration ID: {registration_id}")

        c.save()
        pdf_bytes = buffer.getvalue()
        pdf_logger.info(
            f"Admit card generated successfully for reg_id: {registration_id}, size: {len(pdf_bytes)} bytes",
            request_id=request_id,
            extra={"registration_id": registration_id, "size": len(pdf_bytes)}
        )
        return pdf_bytes
    except Exception as e:
        pdf_logger.error(f"Error generating admit card for reg_id {registration_id}: {str(e)}", request_id=request_id, exc_info=True)
        raise
