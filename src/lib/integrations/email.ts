import nodemailer from 'nodemailer';
import { db } from '../db';
export async function sendEmail(userId: string, to: string, subject: string, url: string) {
  if (process.env.SMTP_URL) {
    const transport = nodemailer.createTransport(process.env.SMTP_URL);
    await transport.sendMail({
      from: process.env.EMAIL_FROM || 'Nordmark <no-reply@nordmark.example>',
      to,
      subject,
      text: `${subject}\n\n${url}\n\nOm du inte begärt detta kan du ignorera meddelandet.`,
    });
    return { provider: 'smtp' };
  }
  await db.notification.create({
    data: { workspaceId: `mail:${userId}`, title: subject, body: url },
  });
  return { provider: 'demo-outbox' };
}
