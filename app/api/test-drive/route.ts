import { NextResponse } from "next/server";
import { shareDriveFolder } from "@/lib/google/drive";

export async function GET() {
  try {
    const result = await shareDriveFolder(
      process.env.RESULT_ROOM_DRIVE_FOLDER_ID!,
      "moshoodolabanji22@gmail.com",
    );

    return NextResponse.json({
      success: true,
      result,
    });
  } catch (error) {
    console.error("Google Drive test failed:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Google Drive sharing failed",
      },
      { status: 500 },
    );
  }
}
