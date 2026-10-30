"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import gsap from "gsap";
import { getProfile } from "@/lib/supabase/action";
import { userProfileQueryKey } from "@/lib/queries/result-room";
import logo from "@/app/assets/images/mobileLogo.png";
import profileBg from "@/app/assets/images/profileBg.jpeg";
import { PenTool, Notebook, SquarePen, Pencil } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import XRead from "@/components/library/XRead";
import AvatarImage from "@/components/result-room/dashboard/AvatarImage";
import EditProfileModal from "@/components/modal/general/profile/EditProfileModal";
import EditAvatarModal from "@/components/modal/general/profile/EditAvatarModal";
import { UprixLoadingScreen } from "../branding/UprixLoadingScreen";

function formatLabel(value: string | null | undefined) {
  return value
    ? value
        .split("_")
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(" ")
    : "Not specified";
}

export default function MemberCard() {
  // Shares its key with the update mutation, so saving a change
  // invalidates this query and the card refreshes on its own.
  const { data: profile, isError } = useQuery({
    queryKey: userProfileQueryKey,
    queryFn: getProfile,
  });

  const [profileOpen, setProfileOpen] = useState(false);
  const [avatarOpen, setAvatarOpen] = useState(false);
  const resultRoomDotRef = useRef<HTMLSpanElement>(null);

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

  if (isError) {
    return (
      <div className="p-6 text-sm text-red-600">Unable to load profile.</div>
    );
  }

  if (!profile) {
    return <UprixLoadingScreen />;
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
        className="relative min-h-[420px] w-11/12 md:w-full max-w-[550px] overflow-hidden rounded-[32px] bg-cover bg-center"
        style={{
          backgroundImage: `url(${profileBg.src})`,
        }}
      >
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/10 to-transparent" />

        {/* Content */}
        <div className="relative flex h-full flex-col justify-between p-6 md:p-8">
          {/* Top Left: edit profile */}
          <button
            type="button"
            onClick={() => setProfileOpen(true)}
            aria-label="Edit profile"
            className="absolute left-3 top-4 z-10 grid size-9 place-items-center rounded-xl bg-white/90 text-secondary-blue backdrop-blur transition hover:bg-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
          >
            <SquarePen size={16} />
          </button>

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

          <div>
            {/* Avatar */}
            <div className="relative mb-4 h-20 w-20">
              <div className="relative h-full w-full overflow-hidden rounded-full border-4 border-white bg-secondary-blue">
                {profile.avatar_url ? (
                  <AvatarImage
                    value={profile.avatar_url}
                    alt={profile.full_name}
                    sizes="80px"
                    priority
                    className="size-full object-cover"
                  />
                ) : (
                  <span className="grid size-full place-items-center text-xl font-bold text-white">
                    {initials}
                  </span>
                )}
              </div>

              {/* Edit avatar (sits outside the clipped circle) */}
              <button
                type="button"
                onClick={() => setAvatarOpen(true)}
                aria-label="Change profile picture"
                className="absolute -bottom-1 -right-1 grid size-7 place-items-center rounded-full border-2 border-white bg-secondary-blue text-white transition hover:bg-primary-blue focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
              >
                <Pencil size={12} />
              </button>
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
              <div className="flex gap-2 items-center w-full">
                <Link
                  href="/result-room"
                  className="flex items-center flex-wrap gap-2 bg-white text-secondary-blue py-1 px-3 rounded-full text-xs/6 font-semibold font-heading duration-500 transition hover:bg-white/90"
                >
                  <span
                    ref={resultRoomDotRef}
                    aria-hidden="true"
                    className="h-2 w-2 shrink-0 rounded-full bg-secondary-blue"
                  />
                  Join Result Room
                </Link>
                {profile.isResultRoomParticipant && (
                  <Link
                    href="/result-room/dashboard"
                    className="flex items-center gap-2 rounded-full bg-white px-4 py-2 text-xs font-semibold text-secondary-blue transition hover:bg-white/90"
                  >
                    Open Result Room
                  </Link>
                )}
              </div>
              <div className="w-full flex items-center gap-2 mt-4">
                <Dialog>
                  <DialogTrigger asChild>
                    <button
                      type="button"
                      className="flex items-center gap-1 text-secondary-blue bg-white rounded-full px-6 py-3 text-xs"
                    >
                      <Notebook size={14} />
                      <span className="font-deep">X</span>-Read
                    </button>
                  </DialogTrigger>
                  <DialogContent className="max-w-[350px]">
                    <DialogHeader>
                      <DialogTitle className="font-deep  text-secondary-blue">
                        X-Read
                        <h6 className="my-4 text-lg font-semibold">
                          Build a solid foundation on books
                        </h6>
                      </DialogTitle>
                      <DialogDescription>
                        <XRead />
                      </DialogDescription>
                    </DialogHeader>
                  </DialogContent>
                </Dialog>
                <Link
                  href="https://drive.google.com/drive/folders/1O4LabXKqkuJOdq1zPvw8G72WyioFP7yS"
                  target="_blank"
                  className="flex items-center gap-1 text-secondary-blue bg-white rounded-full px-6 py-3 text-xs"
                >
                  <PenTool size={14} />
                  <span className="font-deep">X</span>-Theme
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="w-11/12 md:w-full max-w-[550px] flex items-center justify-end mt-4 px-8">
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

      {/* Update modals: Dialog on desktop, 60% bottom sheet on mobile */}
      <EditProfileModal
        open={profileOpen}
        onOpenChange={setProfileOpen}
        profile={profile}
      />
      <EditAvatarModal
        open={avatarOpen}
        onOpenChange={setAvatarOpen}
        profile={profile}
      />
    </main>
  );
}
