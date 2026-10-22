import JoinButton from "./buttons/JoinButton";

export default function HeroSection() {
  return (
    <section
      className="relative w-full overflow-hidden"
      style={{
        background:
          "radial-gradient(140% 85% at 50% 0%, #020817 0%, #071235 16%, #0d2266 30%, #1a3aa0 44%, #3a52d6 58%, #6f65d9 72%, rgba(111, 101, 217, 0.15) 86%, transparent 100%)",
      }}
    >
      {/* Right-side vertical stripe background overlay */}
      <div
        className="pointer-events-none absolute right-0 top-0 z-0 h-full w-1/3 opacity-40"
        style={{
          background:
            "repeating-linear-gradient(90deg, rgba(255,255,255,0.10) 0px, rgba(255,255,255,0.10) 2px, transparent 2px, transparent 26px)",
          maskImage:
            "linear-gradient(180deg, black 0%, black 55%, transparent 100%)",
          WebkitMaskImage:
            "linear-gradient(180deg, black 0%, black 55%, transparent 100%)",
        }}
      />

      <div className="relative z-10 max-w-5xl mx-auto px-6 pt-48 pb-28 text-center">
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-white leading-[1.08] tracking-tight">
          <span className="block font-heading tracking-tighter">
            Growth demands
          </span>
          <span className="flex flex-col justify-center items-center gap-2 lg:gap-4 md:flex-row font-heading md:mt-4">
            <em className="italic font-medium">the right</em>{" "}
            <span className="max-w-[400px] font-extrabold font-heading bg-gradient-to-t from-secondary-blue to-primary-blue text-center py-1 px-4 rounded-lg">
              environment.
            </span>
          </span>
        </h1>

        <p className="mt-5 text-sm md:text-[15px] text-gray-100 max-w-md mx-auto">
          A community designed for those who want more. We provide the right
          circle, right knowledge and right actions to take to begin your growth
          journey.
        </p>

        {/* Button & Arrow Wrapper */}
        <div className="relative z-20 mt-16 flex items-center justify-center gap-4">
          {/* Hand-drawn style arrow pointing at the button */}
          <svg
            aria-hidden
            width="70"
            height="46"
            viewBox="0 0 70 46"
            fill="none"
            className="pointer-events-none -ml-16 text-white/85 -mr-2 -mt-8"
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

          <JoinButton href="/auth/sign-up">Join Us</JoinButton>
        </div>
      </div>
    </section>
  );
}
