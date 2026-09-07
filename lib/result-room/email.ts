import nodemailer from "nodemailer";

function getTransporter() {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT),
    secure: Number(process.env.SMTP_PORT) === 465,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASSWORD,
    },
  });
}

export async function sendResultRoomWelcomeEmail({
  email,
  fullName,
  seatNumber,
}: {
  email: string;
  fullName: string;
  seatNumber: number | null;
}) {
  const transporter = getTransporter();

  await transporter.sendMail({
    from: `"Uprix" <${process.env.UPRIX_EMAIL}>`,
    to: email,
    subject: "Welcome to The Result Room 2.0 🎉",
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.6;">
        <h2>Welcome to The Result Room 2.0, ${fullName}!</h2>

        <p>
          Your payment is complete and your spot in The Result Room
          is officially confirmed.
        </p>

        ${seatNumber ? `<p><strong>Your seat:</strong> ${seatNumber}</p>` : ""}

        <p>
          You can join the Antechamber WhatsApp group here ${process.env.ANTECHAMBER_WHATSAPP_GROUP_LINK}
        </p>
        <p>
          We're excited to have you with us.
        </p>

        <p>
          — The Uprix Team
        </p>
      </div>
    `,
  });
}
