import { Suspense } from "react";
import ResultRoom from "@/components/result-room/ResultRoom";
import { redirect } from "next/navigation";
import { checkResultRoomPaymentStatus } from "@/lib/supabase/result-room";

// 1. Separate component that performs dynamic server checks
async function ResultRoomContent() {
  const status = await checkResultRoomPaymentStatus();

  if (!status.isAuthenticated) {
    redirect("/auth/sign-up");
  }

  return <ResultRoom status={status} />;
}

// 2. Main Page component exports a static shell wrapped in Suspense
export default function Room() {
  return (
    <Suspense fallback={<ResultRoomSkeleton />}>
      <ResultRoomContent />
    </Suspense>
  );
}

// 3. Fallback loader UI (matches your dark cosmic layout)
function ResultRoomSkeleton() {
  return (
    <div className="min-h-screen w-full bg-black flex items-center justify-center p-4">
      <div className="w-full max-w-[1280px] h-[580px] bg-neutral-900/40 border border-neutral-800/80 rounded-3xl animate-pulse" />
    </div>
  );
}
