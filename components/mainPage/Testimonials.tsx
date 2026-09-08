"use client";

import {
  useState,
  useEffect,
  useRef,
  useCallback,
  type PointerEvent,
} from "react";
import Image, { StaticImageData } from "next/image";
import gsap from "gsap";

// Static local image imports
import t1 from "@/app/assets/images/uprix-testimonial/1.jpg";
import t2 from "@/app/assets/images/uprix-testimonial/2.jpg";
import t3 from "@/app/assets/images/uprix-testimonial/3.jpg";
import t4 from "@/app/assets/images/uprix-testimonial/4.jpg";
import t5 from "@/app/assets/images/uprix-testimonial/5.jpg";
import t6 from "@/app/assets/images/uprix-testimonial/6.jpg";
import t7 from "@/app/assets/images/uprix-testimonial/7.jpg";
import t8 from "@/app/assets/images/uprix-testimonial/8.jpg";

const TESTIMONIAL_IMAGES: { id: number; src: StaticImageData; alt: string }[] =
  [
    { id: 1, src: t1, alt: "Uprix Testimonial 1" },
    { id: 2, src: t2, alt: "Uprix Testimonial 2" },
    { id: 3, src: t3, alt: "Uprix Testimonial 3" },
    { id: 4, src: t4, alt: "Uprix Testimonial 4" },
    { id: 5, src: t5, alt: "Uprix Testimonial 5" },
    { id: 6, src: t6, alt: "Uprix Testimonial 6" },
    { id: 7, src: t7, alt: "Uprix Testimonial 7" },
    { id: 8, src: t8, alt: "Uprix Testimonial 8" },
  ];

const TOTAL = TESTIMONIAL_IMAGES.length;
const AUTOPLAY_MS = 3200;
const SWIPE_THRESHOLD = 40;

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
   Image Card Visual - Clean rounded container
--------------------------------------------------------- */
function TestimonialCard({
  item,
}: {
  item: { src: StaticImageData; alt: string };
}) {
  return (
    <div className="relative h-full w-full rounded-2xl overflow-hidden border border-neutral-200 dark:border-white/10 shadow-xl bg-neutral-900 flex items-center justify-center">
      <Image
        src={item.src}
        alt={item.alt}
        fill
        sizes="(max-width: 768px) 280px, 340px"
        className="object-cover rounded-2xl"
        priority
      />
    </div>
  );
}

/* ---------------------------------------------------------
   Main Slider Component
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
    const cardWidth = Math.max(260, Math.min(340, width * 0.32));
    const gap = 24;
    const step = cardWidth + gap;

    cardRefs.current.forEach((el, i) => {
      if (!el) return;

      const offset = getOffset(i, activeIdx, TOTAL);
      const abs = Math.abs(offset);
      const x = offset * step;
      const scale = abs === 0 ? 1 : 0.92;
      const opacity = abs > 2 ? 0 : 1;
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
    <section className="w-full py-14 px-4 select-none overflow-hidden">
      <h2 className="text-center text-3xl md:text-4xl font-extrabold text-secondary-blue mb-1 tracking-tight">
        Testimonials
      </h2>
      <p className="text-center text-xs mb-10 text-neutral-400">
        Hear what people say about Uprix.
      </p>

      <div className="relative w-full max-w-6xl mx-auto">
        <div
          ref={stageRef}
          className="relative h-[360px] md:h-[420px] overflow-hidden cursor-grab active:cursor-grabbing touch-pan-y"
          onPointerDown={onPointerDown}
          onPointerUp={onPointerUp}
          onPointerLeave={onPointerUp}
        >
          {TESTIMONIAL_IMAGES.map((item, i) => (
            <div
              key={item.id}
              ref={(el) => {
                cardRefs.current[i] = el;
              }}
              className="absolute top-0 left-1/2 w-[270px] md:w-[330px] h-[340px] md:h-[400px] -ml-[135px] md:-ml-[165px]"
              style={{ willChange: "transform" }}
            >
              <TestimonialCard item={item} />
            </div>
          ))}
        </div>

        {/* Current-slide indicator dots */}
        <div className="flex items-center justify-center gap-2 mt-8">
          {TESTIMONIAL_IMAGES.map((_, i) => (
            <button
              key={i}
              type="button"
              aria-label={`Go to slide ${i + 1}`}
              aria-current={i === active}
              onClick={() => goTo(i)}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                i === active ? "w-6 bg-secondary-blue" : "w-1.5 bg-neutral-600"
              }`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
