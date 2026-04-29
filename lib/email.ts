import nodemailer from "nodemailer";
import { prisma } from "@/lib/prisma";

export interface EmailSettings {
  smtp_host: string;
  smtp_port: string;
  smtp_user: string;
  smtp_password: string;
  smtp_from_name: string;
  smtp_from_email: string;
}

const EMAIL_DEFAULTS: EmailSettings = {
  smtp_host: "",
  smtp_port: "587",
  smtp_user: "",
  smtp_password: "",
  smtp_from_name: "Progress Estate",
  smtp_from_email: "",
};

export async function getEmailSettings(): Promise<EmailSettings> {
  try {
    const rows = await prisma.$queryRawUnsafe<{ key: string; value: string }[]>(
      `SELECT key, value FROM company_settings WHERE key LIKE 'smtp_%'`
    );
    const result = { ...EMAIL_DEFAULTS };
    for (const r of rows) {
      if (r.key in result) (result as any)[r.key] = r.value;
    }
    return result;
  } catch {
    return { ...EMAIL_DEFAULTS };
  }
}

export async function sendEmail(to: string, subject: string, html: string) {
  const s = await getEmailSettings();
  if (!s.smtp_host || !s.smtp_user || !s.smtp_password) {
    throw new Error("SMTP не налаштовано. Перейдіть до Налаштувань → Email.");
  }

  const transporter = nodemailer.createTransport({
    host: s.smtp_host,
    port: Number(s.smtp_port),
    secure: Number(s.smtp_port) === 465,
    auth: { user: s.smtp_user, pass: s.smtp_password },
  });

  await transporter.sendMail({
    from: `"${s.smtp_from_name}" <${s.smtp_from_email || s.smtp_user}>`,
    to,
    subject,
    html,
  });
}
