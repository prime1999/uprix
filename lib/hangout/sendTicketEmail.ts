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

export async function sendHangoutTicketEmail({
  email,
  fullName,
  seatNumber,
  ticketNumber,
}: {
  email: string;
  fullName: string;
  seatNumber: number;
  ticketNumber: string;
}) {
  const transporter = getTransporter();

  await transporter.sendMail({
    from: `"Uprix" <${process.env.UPRIX_EMAIL}>`,
    to: email,
    subject: "Your Uprix Hangout Ticket 🎉",
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.6;">
        <h2>You're officially registered, ${fullName}! 🎉</h2>

        <p>
          Your payment for the Uprix Hangout has been successfully
          confirmed, and your spot is secured.
        </p>

        <p>
          <strong>Your seat:</strong> ${seatNumber}
        </p>

        <p>
          <strong>Your ticket number:</strong> ${ticketNumber}
        </p>

        <p><strong>Join the Uprix Hangout WhatsApp group:</strong></p>
        <p><a href="${process.env.HANGOUT_WHATSAPP_LINK}" target="_blank" rel="noopener noreferrer">Join Now</a></p>

        <p>
          Please keep this email safe. Your ticket number and seat
          information will be used for the Hangout.
        </p>

        <p>
          We can't wait to have you with us!
        </p>

        <p>
          — The Uprix Team
        </p>
      </div>
    `,
  });
}
