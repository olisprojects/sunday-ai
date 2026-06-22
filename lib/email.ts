import nodemailer from 'nodemailer';

function getTransporter() {
  return nodemailer.createTransport({
    host: 'smtp-relay.brevo.com',
    port: 587,
    auth: {
      user: process.env.BREVO_SMTP_USER!,
      pass: process.env.BREVO_SMTP_KEY!,
    },
  });
}

export async function sendReminderEmail(to: string, title: string) {
  const transporter = getTransporter();
  await transporter.sendMail({
    from: `"Sunday.ai" <${process.env.BREVO_SMTP_USER}>`,
    to,
    subject: `Reminder: ${title}`,
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:24px">
        <h2 style="color:#111827;margin-bottom:8px">Sunday.ai Reminder</h2>
        <p style="font-size:18px;font-weight:600;color:#111827;margin:16px 0">${title}</p>
        <p style="color:#6b7280;font-size:14px">Have a great Sunday!</p>
      </div>
    `,
  });
}
