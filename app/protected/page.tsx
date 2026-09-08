"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { getProfile } from "@/lib/supabase/action";
import logo from "@/app/assets/images/mobileLogo.png";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import PaymentModal from "@/components/payment/paymentModal";

function formatLabel(value: string | null | undefined) {
  return value
    ? value
        .split("_")
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(" ")
    : "Not specified";
}

export default function MemberCard() {
  const [profile, setProfile] = useState<Awaited<
    ReturnType<typeof getProfile>
  > | null>(null);
  const resultRoomDotRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    getProfile()
      .then(setProfile)
      .catch((error) => console.error("Unable to load profile:", error));
  }, []);

  useEffect(() => {
    if (!resultRoomDotRef.current) return;

    const animation = gsap.to(resultRoomDotRef.current, {
      opacity: 0.25,
      scale: 0.7,
      duration: 0.75,
      repeat: -1,
      yoyo: true,
      ease: "power1.inOut",
    });

    return function cleanup(): void {
      animation.kill();
    };
  }, [profile]);

  if (!profile) {
    return <div className="p-6 text-sm text-zinc-500">Loading profile...</div>;
  }

  const initials = profile.full_name
    .split(" ")
    .map((name: string) => name[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div
      className="relative h-[370px] w-11/12 md:w-full max-w-[550px] overflow-hidden rounded-[32px] bg-cover bg-center"
      style={{
        backgroundImage:
          "url(https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=1200&q=80)",
      }}
    >
      {/* Background Image */}
      {/* Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/10 to-transparent" />

      {/* Content */}
      <div className="relative flex h-full flex-col justify-between p-6 md:p-8">
        {/* Top Right Action */}
        <div className="absolute right-3 top-4">
          <div className="flex items-center justify-center rounded-xl bg-white p-1">
            <Image
              src={logo}
              alt="Logo"
              width={40}
              height={40}
              className="w-full h-full object-cover flex items-center justify-center"
            />
          </div>
        </div>

        {/* Bottom Content */}
        <div>
          {/* Avatar */}
          <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full border-4 border-white bg-secondary-blue text-xl font-bold text-white">
            {initials}
          </div>

          {/* Name */}
          <h3 className="text-2xl font-bold text-white">{profile.full_name}</h3>

          <p className="text-sm text-gray-300">
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

          <div className="mt-6 flex items-start justify-between">
            <div className="flex items-center gap-2 flex-wrap w-72">
              <p className="text-sm text-white">90-Days Goal:</p>
              <p className="max-w-[220px] truncate font-bold text-white capitalize">
                {profile.ninety_day_goal}
              </p>
            </div>
          </div>
          {/* Footer */}
          <div className="absolute bottom-5">
            <Dialog>
              <div className="flex items-center justify-between w-full">
                {" "}
                <DialogTrigger asChild>
                  <button
                    type="button"
                    className="flex items-center gap-2 bg-white text-secondary-blue py-1.5 px-3 rounded-full text-xs font-semibold font-heading duration-500 transition hover:bg-white/90"
                  >
                    <span
                      ref={resultRoomDotRef}
                      aria-hidden="true"
                      className="h-2 w-2 shrink-0 rounded-full bg-secondary-blue"
                    />
                    Join the Result Room
                  </button>
                </DialogTrigger>
                <button className="rounded-full bg-black px-3 py-1.5 text-white text-sm transition hover:bg-zinc-800">
                  Connect with an uprizer
                </button>
              </div>
              <DialogContent className="w-[400px]">
                <PaymentModal />
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>
    </div>
  );
}
