import nodemailer from "nodemailer";

let transporter;

function getTransporter() {
  if (transporter) {
    return transporter;
  }

  const host = process.env.SMTP_HOST;
  const configuredPort = Number(process.env.SMTP_PORT || 587);
  const isBrevoRelay = /(^|\.)brevo\.com$/i.test(host || "");
  const port = process.env.NODE_ENV === "production" && isBrevoRelay && configuredPort === 587
    ? 2525
    : configuredPort;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !user || !pass) {
    throw new Error("SMTP settings are missing. Add SMTP_HOST, SMTP_PORT, SMTP_USER, and SMTP_PASS to backend/.env");
  }

  transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    connectionTimeout: Number(process.env.SMTP_CONNECTION_TIMEOUT_MS || 7000),
    greetingTimeout: Number(process.env.SMTP_GREETING_TIMEOUT_MS || 7000),
    socketTimeout: Number(process.env.SMTP_SOCKET_TIMEOUT_MS || 10000),
    auth: {
      user,
      pass
    }
  });

  console.log(`SMTP transport configured on port ${port}`);

  return transporter;
}

export async function sendOtpEmail({ to, otp, name }) {
  const fromEmail = process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER;
  const fromName = process.env.SMTP_FROM_NAME || "ITUS";

  try {
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
  } catch (error) {
    console.error("OTP email delivery failed:", error.code || error.message);
    const deliveryError = new Error("OTP email could not be sent. Please try again shortly.");
    deliveryError.status = 503;
    throw deliveryError;
  }
}

export async function sendPasswordResetEmail({ to, otp, name }) {
  const fromEmail = process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER;
  const fromName = process.env.SMTP_FROM_NAME || "ITUS";
  await getTransporter().sendMail({
    from: `"${fromName}" <${fromEmail}>`,
    to,
    subject: "Reset your ITUS password",
    text: `Hi ${name || "there"},\n\nYour password reset code is ${otp}. It expires in 10 minutes.\n\nIgnore this email if you did not request it.`,
    html: `<div style="font-family:Arial,sans-serif;color:#15372b;line-height:1.6"><p>Hi ${name || "there"},</p><p>Use this code to reset your password:</p><p style="font-size:28px;font-weight:800;letter-spacing:5px;color:#064b36">${otp}</p><p>This code expires in 10 minutes.</p></div>`
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
