import { NextResponse } from "next/server";
import { sendResultRoomWelcomeEmail } from "@/lib/result-room/email";

export async function GET() {
  try {
    await sendResultRoomWelcomeEmail({
      email: "moshoodolabanji22@gmail.com",
      fullName: "Test User",
      seatNumber: 1,
    });

    return NextResponse.json({
      success: true,
      message: "Test email sent successfully",
    });
  } catch (error) {
    console.error("Email test failed:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to send test email",
      },
      { status: 500 },
    );
  }
}
