"use client";

import Link from "next/link";
import Image, { StaticImageData } from "next/image";
import { useState, useEffect, useRef, useCallback } from "react";
import gsap from "gsap";

import uprix1 from "@/app/assets/images/uprix-headshots/Uprix1.png";
import uprix2 from "@/app/assets/images/uprix-headshots/uprix2.jpg";
import uprix3 from "@/app/assets/images/uprix-headshots/uprix3.png";
import uprix4 from "@/app/assets/images/uprix-headshots/uprix4.png";

type Member = {
  id: number;
  name: string;
  photo: StaticImageData;
};

const MEMBERS: Member[] = [
  { id: 1, name: "Uprizer 1", photo: uprix1 },
  { id: 2, name: "Uprizer 2", photo: uprix2 },
  { id: 3, name: "Uprizer 3", photo: uprix3 },
  { id: 4, name: "Uprizer 4", photo: uprix4 },
  { id: 5, name: "Uprizer 5", photo: uprix1 },
  { id: 6, name: "Uprizer 6", photo: uprix2 },
  { id: 7, name: "Uprizer 7", photo: uprix3 },
  { id: 8, name: "Uprizer 8", photo: uprix4 },
];

const TOTAL = MEMBERS.length;
const AUTOPLAY_MS = 3200;
const RESUME_DELAY_MS = 4500;
const SWIPE_THRESHOLD = 45;

function getOffset(index: number, active: number, total: number) {
  let diff = index - active;
  if (diff > total / 2) diff -= total;
  if (diff < -total / 2) diff += total;
  return diff;
}

function mod(n: number, m: number) {
  return ((n % m) + m) % m;
}

function MemberCard({ member }: { member: Member }) {
  return (
    <div className="relative h-full w-full overflow-hidden rounded-[1.4rem] bg-neutral-900 shadow-xl">
      <Image
        src={member.photo}
        alt={member.name}
        fill
        sizes="(max-width: 768px) 225px, 255px"
        className="object-cover rounded-[1.4rem]"
        priority
      />
    </div>
  );
}

const UprizerSlider = () => {
  const [active, setActive] = useState(0);
  const cardRefs = useRef<Array<HTMLDivElement | null>>([]);
  const stageRef = useRef<HTMLDivElement | null>(null);
  const autoplayRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const resumeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dragState = useRef({ down: false, startX: 0, moved: false });

  const goTo = useCallback((idx: number) => {
    setActive((prev) => {
      const next = mod(idx, TOTAL);
      return next === prev ? prev : next;
    });
  }, []);

  const next = useCallback(() => goTo(active + 1), [active, goTo]);
  const prev = useCallback(() => goTo(active - 1), [active, goTo]);

  const startAutoplay = useCallback(() => {
    if (autoplayRef.current) {
      clearInterval(autoplayRef.current);
    }

    autoplayRef.current = setInterval(() => {
      setActive((prev) => mod(prev + 1, TOTAL));
    }, AUTOPLAY_MS);
  }, []);

  const pauseAndScheduleResume = useCallback(() => {
    if (autoplayRef.current) {
      clearInterval(autoplayRef.current);
    }
    if (resumeTimeoutRef.current) {
      clearTimeout(resumeTimeoutRef.current);
    }
    resumeTimeoutRef.current = setTimeout(startAutoplay, RESUME_DELAY_MS);
  }, [startAutoplay]);

  useEffect(() => {
    startAutoplay();
    return () => {
      if (autoplayRef.current) {
        clearInterval(autoplayRef.current);
      }
      if (resumeTimeoutRef.current) {
        clearTimeout(resumeTimeoutRef.current);
      }
    };
  }, [startAutoplay]);

  const animateCards = useCallback((activeIdx: number) => {
    const width = stageRef.current ? stageRef.current.offsetWidth : 1000;
    const spacing = Math.max(140, Math.min(220, width * 0.2));

    cardRefs.current.forEach((el, i) => {
      if (!el) return;

      const offset = getOffset(i, activeIdx, TOTAL);
      const abs = Math.abs(offset);

      const x = offset * spacing;
      const rotateY = offset * -22;
      const z = -abs * 140;
      const y = abs * 10;
      const scale = abs === 0 ? 1 : abs === 1 ? 0.84 : 0.7;

      const opacity = abs > 2 ? 0 : abs === 2 ? 0.55 : 1;
      const zIndex = 100 - abs;

      gsap.to(el, {
        x,
        y,
        z,
        rotateY,
        scale,
        opacity,
        duration: 0.85,
        ease: "power3.out",
        overwrite: "auto",
        onStart: () => {
          el.style.zIndex = String(zIndex);
        },
      });
    });
  }, []);

  useEffect(() => {
    animateCards(active);
  }, [active, animateCards]);

  useEffect(() => {
    const onResize = () => animateCards(active);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [active, animateCards]);

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    dragState.current = { down: true, startX: e.clientX, moved: false };
    pauseAndScheduleResume();
  };

  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragState.current.down) return;
    if (Math.abs(e.clientX - dragState.current.startX) > 5) {
      dragState.current.moved = true;
    }
  };

  const onPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragState.current.down) return;

    const delta = e.clientX - dragState.current.startX;
    dragState.current.down = false;

    if (delta > SWIPE_THRESHOLD) prev();
    else if (delta < -SWIPE_THRESHOLD) next();
  };

  const handleManual = (fn: () => void) => () => {
    fn();
    pauseAndScheduleResume();
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") {
        prev();
        pauseAndScheduleResume();
      }
      if (e.key === "ArrowRight") {
        next();
        pauseAndScheduleResume();
      }
    };

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [next, pauseAndScheduleResume, prev]);

  return (
    <section className="w-full px-4 py-16 select-none mt-24">
      <h2 className="mb-2 text-center text-xl font-extrabold tracking-tight text-secondary-blue md:text-2xl">
        You're not growing alone.
      </h2>
      <p className="mb-6 text-center text-sm text-slate-600 md:text-base">
        Join a global community of growth-driven individuals
      </p>
      <div className="relative mx-auto max-w-5xl">
        <div
          ref={stageRef}
          className="relative mx-auto h-[360px] cursor-grab touch-pan-y active:cursor-grabbing md:h-[420px]"
          style={{ perspective: "1400px" }}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerLeave={onPointerUp}
        >
          {MEMBERS.map((member, i) => (
            <div
              key={`${member.id}-${i}`}
              ref={(el) => {
                cardRefs.current[i] = el;
              }}
              onClick={() => i !== active && handleManual(() => goTo(i))()}
              className="absolute left-1/2 top-1/2 h-[320px] w-[225px] -ml-[112.5px] -mt-[160px] overflow-hidden rounded-[1.5rem] bg-white shadow-2xl md:-ml-[125px] md:-mt-[180px] md:h-[360px] md:w-[255px]"
              style={{
                transformStyle: "preserve-3d",
                willChange: "transform",
              }}
            >
              <MemberCard member={member} />
            </div>
          ))}
        </div>

        {/* 4 indicator dots */}
        <div className="mt-8 flex items-center justify-center gap-2">
          {[0, 1, 2, 3].map((dotIdx) => (
            <button
              key={dotIdx}
              aria-label={`Go to member ${dotIdx + 1}`}
              onClick={handleManual(() => goTo(dotIdx))}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                active % 4 === dotIdx
                  ? "w-6 bg-secondary-blue"
                  : "w-1.5 bg-primary-blue"
              }`}
            />
          ))}
        </div>

        <div className="mt-8 flex flex-col items-center justify-center">
          <h6 className="flex items-end gap-1 mb-8 text-secondary-blue">
            <span className="text-4xl font-deep font-bold">700+</span> Bonafied Uprizers
          </h6>
          <Link
            href="/auth/sign-up"
            className="rounded-full bg-primary-blue px-4 py-2 text-xs font-bold text-white shadow-md shadow-primary-blue transition duration-500 hover:bg-secondary-blue"
          >
            Become an Uprizer
          </Link>
        </div>
      </div>
    </section>
  );
};

export default UprizerSlider;