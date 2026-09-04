import Image from "next/image";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import logo from "@/app/assets/images/mobileLogo.png";

function formatLabel(value: string | null | undefined) {
  return value
    ? value
        .split("_")
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(" ")
    : "Not specified";
}

async function getAuthenticatedProfile() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();

  if (error || !data?.claims) {
    redirect("/auth/login");
  }

  const { data: profile, error: profileError } = await supabase
    .from("user_profiles")
    .select("full_name, current_status, location, current_focus, current_stage")
    .eq("user_id", data.claims.sub)
    .maybeSingle();

  if (profileError) {
    throw profileError;
  }

  if (!profile) {
    redirect("/profile/create");
  }

  return profile;
}

export default async function MemberCard() {
  const profile = await getAuthenticatedProfile();
  const initials = profile.full_name
    .split(" ")
    .map((name: string) => name[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div
      className="relative h-[380px] w-full max-w-[700px] overflow-hidden rounded-[32px] bg-cover bg-center"
      style={{
        backgroundImage:
          "url(https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=1200&q=80)",
      }}
    >
      {/* Background Image */}
      {/* Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-white via-white/70 to-transparent" />

      {/* Content */}
      <div className="relative flex h-full flex-col justify-between p-6 md:p-8">
        {/* Top Right Action */}
        <div className="flex justify-end">
          <div className="flex items-center justify-center rounded-xl bg-white p-1">
            <Image src={logo} alt="Logo" width={40} height={40} />
          </div>
        </div>

        {/* Bottom Content */}
        <div>
          {/* Avatar */}
          <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full border-4 border-white bg-secondary-blue text-xl font-bold text-white">
            {initials}
          </div>

          {/* Name */}
          <h3 className="text-2xl font-bold text-zinc-900">
            {profile.full_name}
          </h3>

          <p className="text-sm text-zinc-600">
            {formatLabel(profile.current_status)} &bull; {profile.location}
          </p>

          {/* Tags */}
          <div className="mt-4 flex flex-wrap gap-2">
            {profile.current_focus.map((focus: string) => (
              <span
                key={focus}
                className="rounded-full bg-white/80 px-3 py-1 text-xs backdrop-blur"
              >
                {formatLabel(focus)}
              </span>
            ))}
          </div>

          {/* Footer */}
          <div className="mt-6 flex items-center justify-between">
            <div>
              <p className="font-semibold text-zinc-900">
                {formatLabel(profile.current_stage)}
              </p>

              <p className="text-sm text-zinc-500">Your profile</p>
            </div>

            <button className="rounded-full bg-black px-3 py-1.5 text-white text-sm transition hover:bg-zinc-800">
              Connect with an uprizer
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
