import nodemailer from 'nodemailer';
import { config } from '../config';
import { logger } from '../utils/logger';

let transporter: nodemailer.Transporter | null = null;

function getTransporter(): nodemailer.Transporter | null {
  if (!config.smtp.host) return null;
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: config.smtp.host,
      port: config.smtp.port,
      auth: config.smtp.user ? { user: config.smtp.user, pass: config.smtp.pass } : undefined,
    });
  }
  return transporter;
}

export async function sendEmail(to: string, subject: string, html: string): Promise<boolean> {
  const transport = getTransporter();
  if (!transport) {
    logger.info('Email skipped (SMTP not configured)', { to, subject });
    return false;
  }
  try {
    await transport.sendMail({ from: config.smtp.from, to, subject, html });
    logger.info('Email sent', { to, subject });
    return true;
  } catch (err) {
    logger.error('Email failed', { to, subject, error: (err as Error).message });
    return false;
  }
}

export async function sendSms(phone: string, message: string): Promise<boolean> {
  if (!config.sms.enabled || !config.sms.apiKey) {
    logger.info('SMS skipped', { phone });
    return false;
  }
  logger.info('SMS sent (mock)', { phone, message: message.slice(0, 50) });
  return true;
}

export async function notifyAttendanceAlert(
  email: string,
  studentName: string,
  subjectName: string,
  percentage: number
): Promise<void> {
  await sendEmail(
    email,
    'Attendance Alert',
    `<p>Dear ${studentName},</p><p>Your attendance in <strong>${subjectName}</strong> is <strong>${percentage}%</strong>, which is below the required threshold.</p>`
  );
}

export async function notifyMarksPublished(
  email: string,
  studentName: string,
  subjectName: string
): Promise<void> {
  await sendEmail(
    email,
    'Marks Published',
    `<p>Dear ${studentName},</p><p>Marks for <strong>${subjectName}</strong> have been published. Log in to view your results.</p>`
  );
}
