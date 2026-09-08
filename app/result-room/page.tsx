import { connection } from "next/server";
import ResultRoom from "@/components/result-room/ResultRoom";
import { redirect } from "next/navigation";
import { checkResultRoomPaymentStatus } from "@/lib/supabase/result-room";

export default async function Room() {
  await connection();

  const status = await checkResultRoomPaymentStatus();

  if (!status.isAuthenticated) {
    redirect("/auth/sign-up");
  }

  return <ResultRoom status={status} />;
}
