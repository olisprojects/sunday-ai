export async function sendReminderEmail(to: string, title: string) {
  const res = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: {
      'api-key': process.env.BREVO_API_KEY!,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      sender: { name: 'Sunday.ai', email: process.env.BREVO_SENDER_EMAIL! },
      to: [{ email: to }],
      subject: `Reminder: ${title}`,
      htmlContent: `
        <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:24px">
          <h2 style="color:#111827;margin-bottom:8px">Sunday.ai Reminder</h2>
          <p style="font-size:18px;font-weight:600;color:#111827;margin:16px 0">${title}</p>
          <p style="color:#6b7280;font-size:14px">Have a great Sunday!</p>
        </div>
      `,
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { message?: string }).message || `Brevo error ${res.status}`);
  }
}
