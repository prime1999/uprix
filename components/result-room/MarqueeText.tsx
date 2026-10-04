import { type CSSProperties } from "react";

const ROW_ONE = [
  "SHOW UP EVERY DAY",
  "ONE GOAL",
  "90 DAYS",
  "NO HIDING",
  "CONSEQUENCES MATTER",
  "EXECUTION OVER MOTIVATION",
  "EVIDENCE OVER EXPLANATIONS",
  "ZERO GHOSTING",
];

// Keyframes live here because core Tailwind has no marquee animation
const MARQUEE_CSS = `
@keyframes marquee-scroll {
  from { transform: translateX(0); }
  to   { transform: translateX(-50%); }
}
.marquee-track { animation: marquee-scroll var(--marquee-duration, 30s) linear infinite; }
.marquee-track.is-reverse { animation-direction: reverse; }
.marquee-root:hover .marquee-track { animation-play-state: paused; }
@media (prefers-reduced-motion: reduce) {
  .marquee-track { animation: none; }
}
`;

function Marquee({
  items,
  duration = 30,
  reverse = false,
  outline = false,
}: any) {
  // Each group is rendered twice so translating -50% loops seamlessly
  const group = (key: any) => (
    <div
      key={key}
      className="flex shrink-0 items-center"
      aria-hidden={key === "b"}
    >
      {items.map((text: any, i: any) => (
        <div key={i} className="flex items-center">
          <span
            className={`whitespace-nowrap text-md font-semibold tracking-tight ${
              outline ? "text-transparent" : "text-black"
            }`}
            style={outline ? { WebkitTextStroke: "0.5px #000" } : undefined}
          >
            {text}
          </span>
          <span className="mx-8 sm:mx-12 block size-1.5 sm:size-2 rounded-full bg-primary-yellow" />
        </div>
      ))}
    </div>
  );

  return (
    <div
      className="marquee-root w-full overflow-hidden"
      style={{
        // Fade the edges so text drifts in and out softly
        maskImage:
          "linear-gradient(to right, transparent, #000 10%, #000 90%, transparent)",
        WebkitMaskImage:
          "linear-gradient(to right, transparent, #000 10%, #000 90%, transparent)",
      }}
    >
      <div
        className={`marquee-track flex w-max ${reverse ? "is-reverse" : ""}`}
        style={
          {
            ["--marquee-duration" as string]: `${duration}s`,
          } as CSSProperties
        }
      >
        {group("a")}
        {group("b")}
      </div>
    </div>
  );
}

export default function TextMarquee() {
  return (
    <div className="w-full flex flex-col justify-center gap-6">
      <style>{MARQUEE_CSS}</style>
      <Marquee items={ROW_ONE} duration={35} />
    </div>
  );
}
