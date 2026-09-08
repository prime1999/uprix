import ResultRoom from "@/components/result-room/ResultRoom";
import { redirect } from "next/navigation";
import { checkResultRoomPaymentStatus } from "@/lib/supabase/result-room";

export const instant = false;

export default async function Room() {
  const status = await checkResultRoomPaymentStatus();

  if (!status.isAuthenticated) {
    redirect("/auth/sign-up");
  }

  return <ResultRoom status={status} />;
}
