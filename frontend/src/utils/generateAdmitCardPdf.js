import { jsPDF } from 'jspdf';
import { formatDate } from './formatters';

export function generateAdmitCardPdf({
  regId,
  eventTitle,
  eventVenue,
  eventDate,
  eventEndDate,
  eventFee,
  organizedBy,
  userName,
  userPhone,
  userEmail,
  userStream,
  userSchool,
  userAddress,
  userMedium,
}) {
  const doc = new jsPDF('p', 'mm', 'a4');
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 20;
  const contentWidth = pageWidth - margin * 2;
  let y = margin;

  // --- Header bar ---
  doc.setFillColor(26, 60, 110); // #1A3C6E
  doc.rect(0, 0, pageWidth, 36, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('ADMIT CARD', pageWidth / 2, 16, { align: 'center' });

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(eventTitle || 'Event', pageWidth / 2, 26, { align: 'center' });

  if (organizedBy) {
    doc.setFontSize(8);
    doc.text(`Organized by: ${organizedBy}`, pageWidth / 2, 32, { align: 'center' });
  }

  y = 46;

  // --- Registration ID ---
  doc.setFillColor(239, 246, 255); // #EFF6FF
  doc.roundedRect(margin, y, contentWidth, 16, 3, 3, 'F');

  doc.setTextColor(100, 116, 139);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text('REGISTRATION ID', pageWidth / 2, y + 5, { align: 'center' });

  doc.setTextColor(26, 60, 110);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text(regId || 'N/A', pageWidth / 2, y + 13, { align: 'center' });

  y += 24;

  // --- Helper to draw a section ---
  const drawSectionTitle = (title) => {
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(37, 99, 235); // #2563EB
    doc.text(title, margin, y);
    y += 2;
    doc.setDrawColor(226, 232, 240); // #E2E8F0
    doc.setLineWidth(0.5);
    doc.line(margin, y, margin + contentWidth, y);
    y += 6;
  };

  const drawField = (label, value, x, width) => {
    if (!value) return;
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(148, 163, 184); // #94A3B8
    doc.text(label.toUpperCase(), x, y);

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(30, 41, 59); // #1E293B
    const lines = doc.splitTextToSize(value, width - 2);
    doc.text(lines, x, y + 5);
    return 5 + lines.length * 4.5;
  };

  const colLeft = margin;
  const colRight = margin + contentWidth / 2 + 4;
  const colWidth = contentWidth / 2 - 4;

  // --- Event Details ---
  drawSectionTitle('EVENT DETAILS');

  const dateStr = eventDate
    ? formatDate(eventDate) + (eventEndDate ? `  to  ${formatDate(eventEndDate)}` : '')
    : '';
  const feeStr = eventFee === 0 || !eventFee ? 'Free' : `Rs. ${eventFee}`;

  let h1 = drawField('Event Name', eventTitle, colLeft, colWidth) || 0;
  let h2 = drawField('Organized By', organizedBy, colRight, colWidth) || 0;
  y += Math.max(h1, h2) + 3;

  h1 = drawField('Date', dateStr, colLeft, colWidth) || 0;
  h2 = drawField('Fee', feeStr, colRight, colWidth) || 0;
  y += Math.max(h1, h2) + 3;

  h1 = drawField('Venue', eventVenue, colLeft, contentWidth) || 0;
  y += h1 + 6;

  // --- Student Details ---
  drawSectionTitle('STUDENT DETAILS');

  h1 = drawField('Full Name', userName, colLeft, colWidth) || 0;
  h2 = drawField('Phone', userPhone ? `+91 ${userPhone}` : '', colRight, colWidth) || 0;
  y += Math.max(h1, h2) + 3;

  h1 = drawField('Email', userEmail, colLeft, colWidth) || 0;
  h2 = drawField('Stream', userStream, colRight, colWidth) || 0;
  y += Math.max(h1, h2) + 3;

  h1 = drawField('Medium', userMedium, colLeft, colWidth) || 0;
  h2 = drawField('School / College', userSchool, colRight, colWidth) || 0;
  y += Math.max(h1, h2) + 3;

  if (userAddress) {
    h1 = drawField('Address', userAddress, colLeft, contentWidth) || 0;
    y += h1 + 3;
  }

  y += 6;

  // --- Divider ---
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.3);
  doc.line(margin, y, margin + contentWidth, y);
  y += 8;

  // --- Important Instructions ---
  drawSectionTitle('IMPORTANT INSTRUCTIONS');

  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105); // #475569

  const instructions = [
    'Carry a printed or digital copy of this admit card to the event venue.',
    'Bring a valid photo ID (Aadhaar Card, School ID) for verification.',
    'Report to the venue at least 30 minutes before the scheduled time.',
    'Carry your GUJCET score card (if available).',
    'This admit card is non-transferable.',
  ];

  instructions.forEach((inst, i) => {
    doc.text(`${i + 1}. ${inst}`, margin + 2, y);
    y += 5;
  });

  y += 8;

  // --- Footer ---
  doc.setDrawColor(26, 60, 110);
  doc.setLineWidth(0.5);
  doc.line(margin, y, margin + contentWidth, y);
  y += 5;

  doc.setFontSize(7);
  doc.setTextColor(148, 163, 184);
  doc.setFont('helvetica', 'normal');
  doc.text('This is a computer-generated admit card and does not require a signature.', pageWidth / 2, y, { align: 'center' });
  y += 4;
  doc.text(`Generated on: ${new Date().toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })}`, pageWidth / 2, y, { align: 'center' });

  return doc;
}
