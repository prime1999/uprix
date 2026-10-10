const ROOM_CARDS = [
  {
    badge: "1",
    title: "One goal",
    label: "Goal set:",
    text: "Not seven goals. One clear result that actually matters to you.",
    day: "Oct 18, 2026",
    meta: "Day 1 | You",
    blob: "bg-sky-200/70",
  },
  {
    badge: "1:1",
    title: "One partner",
    label: "Partner assigned:",
    text: "Someone inside the room who expects you to do what you said.",
    day: "Every day",
    meta: "Check-in | You + Partner",
    blob: "bg-orange-200/70",
  },
  {
    badge: "90",
    title: "90 days",
    label: "Cycle started:",
    text: "A window where your goal gets structure, visibility and consequences.",
    day: "Jan 16, 2027",
    meta: "Day 90 | The evidence",
    blob: "bg-sky-200/70",
  },
];

export default function RoomSection() {
  return (
    <section className="rr-section py-[clamp(70px,10vw,130px)]">
      <div className="rr-wrap rr-center mx-auto w-[calc(100%-44px)] max-w-[1120px] text-center">
        <span className="rr-figure rr-mono font-mono text-sm tracking-widest text-gray-800 font-semibold">
          Fig 0.1 — The room
        </span>

        <h2 className="text-4xl">
          A new way to finish
          <br />
          what you start.
        </h2>

        <p className="text-sm mt-2 text-gray-700">
          Purpose-built to turn intention into visible execution. One goal, one
          partner, real consequences.
        </p>

        <div className="mt-12 grid grid-cols-1 gap-6 text-left md:grid-cols-3">
          {ROOM_CARDS.map((c, i) => (
            <div key={c.title} className="group relative">
              {/* soft color patch behind the card, like the reference */}
              <span
                aria-hidden
                className={`absolute -right-4 -top-4 h-28 w-28 rounded-full blur-2xl ${c.blob}`}
              />
              <span
                aria-hidden
                className="absolute -bottom-4 -left-4 h-24 w-24 rounded-full bg-amber-100/80 blur-2xl"
              />

              <article
                className="relative flex min-h-[320px] flex-col rounded-[28px] border border-black/5 bg-white p-6
                           shadow-[0_24px_50px_-26px_rgba(20,20,30,0.35)] transition duration-300
                           group-hover:-translate-y-1.5 group-hover:shadow-[0_34px_60px_-28px_rgba(20,20,30,0.45)]"
              >
                {/* header: icon tile + name */}
                <header className="flex items-center gap-3">
                  <span className="grid h-9 min-w-9 place-items-center rounded-lg border-2 border-neutral-900 px-1.5 text-sm font-bold leading-none">
                    {c.badge}
                  </span>
                  <h3 className="text-lg font-medium tracking-tight">
                    {c.title}
                  </h3>
                  <span className="ml-auto font-mono text-xs text-neutral-400">
                    0{i + 1}
                  </span>
                </header>

                {/* body */}
                <div className="mt-8">
                  <p className="text-[15px] text-neutral-500">{c.label}</p>
                  <p className="mt-2 text-[22px] font-semibold leading-[1.15] tracking-tight text-neutral-900">
                    {c.text}
                  </p>
                </div>

                {/* divider + footer pinned to the bottom */}
                <div className="mt-auto pt-8">
                  <div className="h-px w-full bg-neutral-200" />
                  <p className="mt-5 text-lg font-semibold tracking-tight">
                    {c.day}
                  </p>
                  <p className="mt-1 text-sm text-neutral-500">{c.meta}</p>
                </div>
              </article>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
