import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  },
);

export async function POST(req: Request) {
  try {
    const { userId, newPassword } = await req.json();

    if (!userId || !newPassword) {
      return NextResponse.json(
        {
          success: false,
          error: "userId and newPassword are required",
        },
        { status: 400 },
      );
    }

    const { data, error } = await supabaseAdmin.auth.admin.updateUserById(
      userId,
      {
        password: newPassword,
      },
    );

    if (error) {
      console.error("Error updating password:", error.message);

      return NextResponse.json(
        {
          success: false,
          error: error.message,
        },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      user: data.user,
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
      },
      { status: 500 },
    );
  }
}
