import "server-only";

import nodemailer, { type Transporter } from "nodemailer";

type SendEmailInput = {
  subject: string;
  text: string;
  html?: string;
};

let transporter: Transporter | undefined;

function getTransporter(): Transporter {
  if (transporter) return transporter;

  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASSWORD } = process.env;

  if (!SMTP_HOST || !SMTP_PORT || !SMTP_USER || !SMTP_PASSWORD) {
    throw new Error("Email SMTP configuration is incomplete.");
  }

  const port = Number(SMTP_PORT);

  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error("Invalid SMTP_PORT configuration.");
  }

  transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port,
    secure: port === 465,
    auth: {
      user: SMTP_USER,
      pass: SMTP_PASSWORD,
    },
  });

  return transporter;
}

export async function sendEmail(input: SendEmailInput): Promise<void> {
  const recipient = process.env.UPRIX_DEV_TEAM_EMAIL;
  const from = process.env.SMTP_FROM;

  if (!recipient || !from) {
    throw new Error("Email recipient or sender is not configured.");
  }

  await getTransporter().sendMail({
    from,
    to: recipient,
    subject: input.subject,
    text: input.text,
    ...(input.html ? { html: input.html } : {}),
  });
}

export async function sendDeveloperAlert(input: {
  title: string;
  message: string;
}): Promise<void> {
  await sendEmail({
    subject: `[Uprix Alert] ${input.title}`,
    text: input.message,
  });
}
