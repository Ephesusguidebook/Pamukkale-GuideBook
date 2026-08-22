const nodemailer = require('nodemailer');

// Optional SMTP-based email notifications. If SMTP_HOST isn't set, this is
// a no-op — the contact form still works and messages always land under
// Admin > Messages regardless of whether email is configured.
function getTransporter() {
  if (!process.env.SMTP_HOST) return null;
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT) || 587,
    secure: process.env.SMTP_SECURE === 'true',
    auth: process.env.SMTP_USER
      ? { user: process.env.SMTP_USER, password: process.env.SMTP_PASSWORD }
      : undefined,
  });
}

async function sendContactNotification(to, message) {
  const transporter = getTransporter();
  if (!transporter || !to) return;

  const from = process.env.SMTP_FROM || process.env.SMTP_USER;
  const subject = message.company_name
    ? `New partner inquiry from ${message.company_name}`
    : `New enquiry from ${message.name}`;
  const lines = [
    `Name: ${message.name}`,
    message.email ? `Email: ${message.email}` : null,
    message.phone ? `Phone: ${message.phone}` : null,
    message.company_name ? `Company: ${message.company_name}` : null,
    message.company_website ? `Website: ${message.company_website}` : null,
    message.item_title ? `Regarding: ${message.item_title}` : null,
    '',
    message.message || '(no message)',
  ].filter(Boolean);

  try {
    await transporter.sendMail({
      from,
      to,
      replyTo: message.email || undefined,
      subject,
      text: lines.join('\n'),
    });
  } catch (err) {
    // Never let an email failure break the contact form — just log it.
    console.error('[mailer] Could not send notification email:', err.message);
  }
}

module.exports = { sendContactNotification };
