"use client";
// import heroBg from "@/app/assets/images/hero.png";

// const Hero = () => {
//   return (
//     <main
//       style={{
//         backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.45), rgba(0, 0, 0, 0.45)), url(${heroBg.src})`,
//         backgroundPosition: "center bottom",
//         backgroundSize: "cover",
//         backgroundRepeat: "no-repeat",
//       }}
//       className="relative md:w-11/12 mx-auto mt-16 mb-2 h-[480px] overflow-hidden md:rounded-2xl"
//     >
//       <h3 className="absolute top-10 left-12 md:left-15 lg:hidden ml-2 text-[54px] md:text-6xl text-[rgba(255,255,255,0.7)] drop-shadow-lg">
//         Welcome to
//       </h3>
//       <div className="absolute bottom-2 lg:bottom-10 left-1">
//         <h3 className="hidden lg:block ml-2 text-3xl text-white">
//           Welcome to Uprix.
//         </h3>
//         <h1 className="text-[80px] font-bold leading-[0.8] tracking-[-0.03em] text-[rgba(255,255,255,0.7)] drop-shadow-lg md:text-[100px] md:tracking-[-0.08em] lg:text-[150px]">
//           Evolve Upward
//         </h1>
//         <p className="ml-2 mt-2 lg:mt-4 text-sm lg:text-xl font-semibold text-white">
//           A community for ambitious people who want to learn, take action, build
//           meaningful connections, and keep becoming better.
//         </p>
//       </div>
//     </main>
//   );
// };

// export default Hero;

import Link from "next/link";
import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ArrowUpRight } from "lucide-react";

/* ---------------------------------------------------------
   Hero section — dark indigo-to-white gradient, mixed
   serif/sans headline, pill CTA with hand-drawn arrow,
   and a gradient bell illustration on the right.
--------------------------------------------------------- */
export default function Hero() {
  const headlineRef = useRef<HTMLHeadingElement | null>(null);
  const subRef = useRef<HTMLParagraphElement | null>(null);
  const ctaRef = useRef<HTMLDivElement | null>(null);
  const bellRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (
      !headlineRef.current ||
      !subRef.current ||
      !ctaRef.current ||
      !bellRef.current
    ) {
      return;
    }

    const tl = gsap.timeline({ defaults: { ease: "power3.out" } });
    tl.fromTo(
      headlineRef.current.children,
      { opacity: 0, y: 26 },
      { opacity: 1, y: 0, duration: 0.8, stagger: 0.12 },
    )
      .fromTo(
        subRef.current,
        { opacity: 0, y: 14 },
        { opacity: 1, y: 0, duration: 0.6 },
        "-=0.4",
      )
      .fromTo(
        ctaRef.current,
        { opacity: 0, y: 14 },
        { opacity: 1, y: 0, duration: 0.6 },
        "-=0.35",
      )
      .fromTo(
        bellRef.current,
        { opacity: 0, scale: 0.7, rotate: -12 },
        {
          opacity: 1,
          scale: 1,
          rotate: 0,
          duration: 0.9,
          ease: "back.out(1.6)",
        },
        "-=0.5",
      );

    return () => {
      tl.kill();
    };
  }, []);

  return (
    <section
      className="relative w-full overflow-hidden"
      style={{
        background:
          "radial-gradient(120% 100% at 50% 0%, #07017b 0%, #07017b 28%, #0907d7 50%, transparent 100%)",
      }}
    >
      {/* right-side vertical stripe pattern */}
      <div
        className="pointer-events-none absolute right-0 top-0 h-full w-1/3 opacity-40 mb-16"
        style={{
          background:
            "repeating-linear-gradient(90deg, rgba(255,255,255,0.10) 0px, rgba(255,255,255,0.10) 2px, transparent 2px, transparent 26px)",
          maskImage:
            "linear-gradient(180deg, black 0%, black 55%, transparent 100%)",
          WebkitMaskImage:
            "linear-gradient(180deg, black 0%, black 55%, transparent 100%)",
        }}
      />

      <div className="relative max-w-5xl mx-auto px-6 pt-28 lg:pt-36 pb-28 text-center">
        <h1
          ref={headlineRef}
          className="hidden md:block text-3xl md:text-4xl font-embrace font-medium text-white leading-[1.08] tracking-widest"
        >
          The Right Environment
          <span className="block mt-6 md:text-4xl">
            <em className="font-serif italic font-medium">The Right People.</em>{" "}
            <span className="font-extrabold bg-gradient-to-t from-secondary-blue to-primary-blue py-2 px-4 rounded-lg">
              Real Growth.
            </span>
          </span>
        </h1>
        <h1
          ref={headlineRef}
          className="md:hidden text-3xl md:text-6xl font-extrabold text-white leading-[1.08] tracking-tight"
        >
          The Right Environment
          <span className="flex flex-col items-center juscenter md:flex-row gap-2 mt-6 md:text-4xl">
            <em className="font-serif italic font-medium">The Right People.</em>{" "}
            <span className="max-w-52 max-sm:mt-2 font-extrabold bg-gradient-to-t from-secondary-blue to-primary-blue py-2 px-4 rounded-lg">
              Real Growth.
            </span>
          </span>
        </h1>

        <p
          ref={subRef}
          className="mt-8 text-sm md:text-[15px] text-white/80 max-w-md mx-auto"
        >
          A community built to help you learn, take action, build meaningful
          connections, and keep moving forward.
        </p>

        <div
          ref={ctaRef}
          className="mt-9 flex items-center justify-center gap-4"
        >
          {/* hand-drawn style arrow pointing at the pill */}
          <svg
            width="70"
            height="46"
            viewBox="0 0 70 46"
            fill="none"
            className="text-white/85 -mr-2 mt-3"
          >
            <path
              d="M4 4C10 22 28 34 58 34"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
              fill="none"
            />
            <path
              d="M46 27C50 30 54 32 58 34C54 35.5 50 38 47 41.5"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
            />
          </svg>

          <Link
            href="/signUp"
            className="inline-flex items-center gap-2 bg-white text-slate-900 font-semibold text-sm px-5 py-3 rounded-full shadow-lg hover:shadow-xl active:scale-95 transition"
          >
            Join Uprix
            <ArrowUpRight size={16} />
          </Link>

          {/* <button
            type="button"
            className="inline-flex items-center gap-1.5 text-white/90 text-sm font-medium hover:text-white transition"
          >
            Book a call
            <ArrowUpRight size={14} />
          </button> */}
        </div>
      </div>
    </section>
  );
}
