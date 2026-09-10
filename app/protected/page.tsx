"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { getProfile } from "@/lib/supabase/action";
import logo from "@/app/assets/images/mobileLogo.png";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import PaymentModal from "@/components/payment/paymentModal";
import profileBg from "@/app/assets/images/profileBg.jpeg";
import Link from "next/dist/client/link";

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

  const whatsappMessage = encodeURIComponent(
    `I just joined Uprix through Uprix website. 

I'm here to finalise my identity as an Uprizer, kindly save this contact.

My name is ${profile.full_name}.`,
  );

  const initials = profile.full_name
    .split(" ")
    .map((name: string) => name[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <main className="w-full h-full flex flex-col items-center justify-center">
      <div
        className="relative max-h-[400px] w-11/12 md:w-full max-w-[550px] overflow-hidden rounded-[32px] bg-cover bg-center"
        style={{
          backgroundImage: `url(${profileBg.src})`,
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
                width={30}
                height={30}
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
            <h3 className="text-2xl font-bold text-white">
              {profile.full_name}
            </h3>

            <p className="text-sm text-gray-300">
              {formatLabel(profile.current_status)} &bull; {profile.location}
            </p>

            {/* Tags */}
            <div className="mt-4 flex flex-wrap gap-2">
              {profile.current_focus.slice(0, 2).map((focus: string) => (
                <span
                  key={focus}
                  className="rounded-full bg-white/80 px-3 py-1 text-xs backdrop-blur"
                >
                  {formatLabel(focus)}
                </span>
              ))}

              {profile.current_focus.length > 2 && (
                <span className="rounded-full bg-white/60 px-3 py-1 text-xs backdrop-blur">
                  +{profile.current_focus.length - 2} more
                </span>
              )}
            </div>

            <div className="mt-6 flex items-start justify-between">
              <div className="flex items-center gap-2 flex-wrap w-72">
                <p className="text-sm text-white">90-Days Goal:</p>
                <p className="max-w-[220px] text-xs font-bold text-white capitalize line-clamp-2">
                  {profile.ninety_day_goal}
                </p>
              </div>
            </div>
            {/* Footer */}
            <div className="w-full mt-4">
              <Dialog>
                <div className="flex flex-col gap-2 items-start justify-center w-full">
                  {" "}
                  <DialogTrigger asChild>
                    <button
                      type="button"
                      className="flex items-center flex-wrap gap-2 bg-white text-secondary-blue py-1.5 px-3 rounded-full text-xs/6 font-semibold font-heading duration-500 transition hover:bg-white/90"
                    >
                      <span
                        ref={resultRoomDotRef}
                        aria-hidden="true"
                        className="h-2 w-2 shrink-0 rounded-full bg-secondary-blue"
                      />
                      Join the Result Room
                    </button>
                  </DialogTrigger>
                  {/* <button className="w-11/12 mx-auto rounded-full bg-black px-3 py-1.5 text-white text-sm transition hover:bg-zinc-800">
                  Connect with an uprizer
                </button> */}
                </div>
                <DialogContent className="w-[400px]">
                  <PaymentModal />
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </div>
      </div>
      <div className="w-11/12 md:w-full max-w-[550px] flex items-center justify-end my-4 px-8">
        <div>
          <h6 className="text-xs text-zinc-800 mb-2">
            Yet to finalize your Identity? 👇
          </h6>
          <Link
            href={`https://wa.me/2347025120945?text=${whatsappMessage}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-white bg-green-700 px-4 py-2 rounded-full mt-2 shadow-md shadow-green-800 duration-500 transition hover:bg-green-800"
          >
            Message Taifaq on WhatsApp
          </Link>
        </div>
      </div>
    </main>
  );
}
