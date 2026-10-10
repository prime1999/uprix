import { Suspense } from "react";
import ResultRoomTwoPage from "./ResultRoomTwoPage";
import { checkResultRoomPaymentStatus } from "@/lib/supabase/result-room";

async function ResultRoomTwoContent() {
  const status = await checkResultRoomPaymentStatus();

  return <ResultRoomTwoPage status={status} />;
}

export default function Room() {
  return (
    <Suspense fallback={<ResultRoomTwoSkeleton />}>
      <ResultRoomTwoContent />
    </Suspense>
  );
}

function ResultRoomTwoSkeleton() {
  return (
    <div className="min-h-screen w-full bg-white flex items-center justify-center p-4">
      <div className="w-full max-w-[1120px] h-[580px] bg-neutral-100 border border-neutral-200 rounded-3xl animate-pulse" />
    </div>
  );
}
