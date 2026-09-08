"use client";

import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

export function LogoutButton() {
  const router = useRouter();

  const logout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/auth/login");
  };

  return (
    <button
      onClick={logout}
      className="hidden rounded-full bg-red-500 px-4 py-2 text-xs font-bold text-white shadow-md shadow-red-500 transition duration-500 hover:bg-red-600 hover:shadow-red-600 lg:block"
    >
      Logout
    </button>
  );
}
