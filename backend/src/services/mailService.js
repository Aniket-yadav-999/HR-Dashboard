import nodemailer from "nodemailer";

let transporter;

function getTransporter() {
  if (transporter) {
    return transporter;
  }

  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT || 587);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !user || !pass) {
    throw new Error("SMTP settings are missing. Add SMTP_HOST, SMTP_PORT, SMTP_USER, and SMTP_PASS to backend/.env");
  }

  transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: {
      user,
      pass
    }
  });

  return transporter;
}

export async function sendOtpEmail({ to, otp, name }) {
  const fromEmail = process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER;
  const fromName = process.env.SMTP_FROM_NAME || "ITUS";

  await getTransporter().sendMail({
    from: `"${fromName}" <${fromEmail}>`,
    to,
    subject: "Your ITUS login OTP",
    text: `Hi ${name || "there"},\n\nYour ITUS login OTP is ${otp}. It expires in 5 minutes.\n\nIf you did not request this, you can ignore this email.`,
    html: `
      <div style="font-family: Arial, sans-serif; color: #111827; line-height: 1.5;">
        <p>Hi ${name || "there"},</p>
        <p>Your ITUS login OTP is:</p>
        <p style="font-size: 24px; font-weight: 700; letter-spacing: 3px;">${otp}</p>
        <p>This OTP expires in 5 minutes.</p>
        <p>If you did not request this, you can ignore this email.</p>
      </div>
    `
  });
}

export async function sendAttendanceEmail({ to, cc, subject, body }) {
  const fromEmail = process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER;
  const fromName = process.env.SMTP_FROM_NAME || "ITUS";

  await getTransporter().sendMail({
    from: `"${fromName}" <${fromEmail}>`,
    to,
    cc,
    subject,
    text: body,
    html: `<div style="font-family: Arial, sans-serif; color: #111827; line-height: 1.6; white-space: pre-line;">${body}</div>`
  });
}
