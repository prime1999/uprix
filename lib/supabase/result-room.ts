import { createClient } from "./server";

export type ResultRoomParticipant = {
  balance: number;
  total_paid: number;
  seat_number: number | null;
  id: string;
  full_name: string;
  status: string;
};

export type ResultRoomStatus = {
  participant: ResultRoomParticipant | null;
  startedPayment: boolean;
  hasPaid: boolean;
  isAuthenticated: boolean;
  roomAvailable: boolean;
  email?: string | null;
};

export async function checkResultRoomPaymentStatus(): Promise<ResultRoomStatus> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      participant: null,
      startedPayment: false,
      hasPaid: false,
      isAuthenticated: false,
      roomAvailable: false,
    };
  }

  const { data: room } = await supabase
    .from("rooms")
    .select("id")
    .eq("status", "UPCOMING")
    .order("start_date", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (!room) {
    return {
      participant: null,
      startedPayment: false,
      hasPaid: false,
      isAuthenticated: true,
      roomAvailable: false,
    };
  }

  const { data: participant } = await supabase
    .from("participants")
    .select("id, full_name, status, balance, total_paid, seat_number, status")
    .eq("room_id", room.id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!participant) {
    return {
      participant: null,
      startedPayment: false,
      hasPaid: false,
      isAuthenticated: true,
      roomAvailable: true,
    };
  }

  return {
    participant,
    startedPayment: participant.total_paid > 0,
    hasPaid: participant.status === "FULLY_PAID",
    isAuthenticated: true,
    roomAvailable: true,
    email: user.email,
  };
}
