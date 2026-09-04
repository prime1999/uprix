"use client";

import {
  useState,
  useEffect,
  useRef,
  useCallback,
  type PointerEvent,
} from "react";
import gsap from "gsap";
import {
  Wind,
  Sprout,
  TreePine,
  Scissors,
  CircleDot,
  Leaf,
  ChevronRight,
  type LucideIcon,
} from "lucide-react";
import TESTIMONIALS from "@/lib/constants";
import deepBg from "@/app/assets/images/deepBg.png";

type Service = {
  id: number;
  title: string;
  desc: string;
  Icon: LucideIcon;
  photo: string | null;
};

/* ---------------------------------------------------------
   Service data — swap in real titles/descriptions/photos.
   `photo` is optional: if provided it's used as the card
   background image, otherwise a grass-tone gradient is used.
--------------------------------------------------------- */
const SERVICES: Service[] = [
  {
    id: 1,
    title: "Power Raking",
    desc: "Removes thatch and debris so your lawn can breathe.",
    Icon: Wind,
    photo: null,
  },
  {
    id: 2,
    title: "Fertilizing",
    desc: "Feeds your lawn the right nutrients all season long.",
    Icon: Sprout,
    photo: null,
  },
  {
    id: 3,
    title: "Landscaping",
    desc: "Custom designs that make your outdoor space shine.",
    Icon: TreePine,
    photo: null,
  },
  {
    id: 4,
    title: "Lawn Mowing",
    desc: "Regular mowing keeps your lawn healthy and tidy.",
    Icon: Scissors,
    photo: null,
  },
  {
    id: 5,
    title: "Aeration",
    desc: "Core aeration improves soil health and root growth.",
    Icon: CircleDot,
    photo: null,
  },
  {
    id: 6,
    title: "Weed Control",
    desc: "Keeps wanted weeds from taking over.",
    Icon: Leaf,
    photo: null,
  },
];

const TOTAL = SERVICES.length;
const AUTOPLAY_MS = 2800;
const SWIPE_THRESHOLD = 40;

/** shortest signed distance between index and active, in a ring of `total` */
function getOffset(index: number, active: number, total: number) {
  let diff = index - active;
  if (diff > total / 2) diff -= total;
  if (diff < -total / 2) diff += total;
  return diff;
}

function mod(n: number, m: number) {
  return ((n % m) + m) % m;
}

/* ---------------------------------------------------------
   Service card visual
--------------------------------------------------------- */
function ServiceCard({ testimonial }: { testimonial: any }) {
  return (
    <div
      className="relative h-full w-full rounded-2xl overflow-hidden shadow-xl p-2"
      style={{
        backgroundImage: `url(${deepBg.src})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      <div className="relative h-full flex flex-col justify-between p-4 bg-[rgba(255,255,255,0.80)] rounded-md">
        <p className="text-black/75 text-[11px] leading-snug mb-3 line-clamp-6">
          {testimonial.text}
        </p>
        <h3 className="absolute bottom-2 font-bold text-base leading-tight mb-1">
          {testimonial.author}
        </h3>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------
   Main slider — flat multi-card carousel, autoplay + loop,
   current-slide dot navigation only (no prev/next buttons).
--------------------------------------------------------- */
export default function Testimonials() {
  const [active, setActive] = useState<number>(0);
  const cardRefs = useRef<Array<HTMLDivElement | null>>([]);
  const stageRef = useRef<HTMLDivElement | null>(null);
  const autoplayRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const dragState = useRef({ down: false, startX: 0 });

  const goTo = useCallback((idx: number) => {
    setActive((prev) => {
      const next = mod(idx, TOTAL);
      return next === prev ? prev : next;
    });
  }, []);

  const startAutoplay = useCallback(() => {
    if (autoplayRef.current) {
      clearInterval(autoplayRef.current);
    }

    autoplayRef.current = setInterval(() => {
      setActive((prev) => mod(prev + 1, TOTAL));
    }, AUTOPLAY_MS);
  }, []);

  useEffect(() => {
    startAutoplay();

    return () => {
      if (autoplayRef.current) {
        clearInterval(autoplayRef.current);
      }
    };
  }, [startAutoplay]);

  const animateCards = useCallback((activeIdx: number) => {
    const width = stageRef.current ? stageRef.current.offsetWidth : 900;
    const cardWidth = Math.max(165, Math.min(235, width * 0.24));
    const gap = 24;
    const step = cardWidth + gap;

    cardRefs.current.forEach((el, i) => {
      if (!el) return;

      const offset = getOffset(i, activeIdx, TOTAL);
      const abs = Math.abs(offset);
      const x = offset * step;
      const scale = abs === 0 ? 1 : 0.94;
      const opacity = abs > 3 ? 0 : 1;
      const zIndex = 100 - abs;

      gsap.to(el, {
        x,
        scale,
        opacity,
        duration: 0.7,
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

  const onPointerDown = (e: PointerEvent<HTMLDivElement>) => {
    dragState.current = { down: true, startX: e.clientX };
  };

  const onPointerUp = (e: PointerEvent<HTMLDivElement>) => {
    if (!dragState.current.down) return;

    const delta = e.clientX - dragState.current.startX;
    dragState.current.down = false;

    if (delta > SWIPE_THRESHOLD) goTo(active - 1);
    else if (delta < -SWIPE_THRESHOLD) goTo(active + 1);
  };

  return (
    <section id="testimonials" className="scroll-mt-28 w-full py-14 px-4 select-none">
      <h2 className="text-center text-3xl md:text-4xl font-extrabold text-secondary-blue mb-1 tracking-tight">
        Testimonials
      </h2>
      <p className="text-center text-xs mb-10">
        Hear what people say about Uprix.
      </p>
      <div className="relative w-full mx-auto">
        <div
          ref={stageRef}
          className="relative h-[260px] md:h-[290px] overflow-hidden cursor-grab active:cursor-grabbing touch-pan-y"
          onPointerDown={onPointerDown}
          onPointerUp={onPointerUp}
          onPointerLeave={onPointerUp}
        >
          {TESTIMONIALS.map((testimonial, i) => (
            <div
              key={i}
              ref={(el) => {
                cardRefs.current[i] = el;
              }}
              className="absolute top-0 left-1/2 w-[175px] md:w-[205px] h-[260px] md:h-[290px] -ml-[87.5px] md:-ml-[102.5px]"
              style={{ willChange: "transform" }}
            >
              <ServiceCard testimonial={testimonial} />
            </div>
          ))}
        </div>

        {/* Current-slide dot navigation (no prev/next buttons) */}
        <div className="flex items-center justify-center gap-2 mt-8">
          {TESTIMONIALS.map((testimonial, i) => (
            <button
              key={i}
              type="button"
              aria-label={`Go to ${testimonial.author}`}
              aria-current={i === active}
              onClick={() => goTo(i)}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                i === active ? "w-6 bg-secondary-blue" : "w-1.5 bg-primary-blue"
              }`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}