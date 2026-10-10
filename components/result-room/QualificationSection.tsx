const YES = [
  "There’s one result you’ve delayed long enough.",
  "You’re tired of carrying it from month to month.",
  "You know you’ve been capable of more.",
  "You want structure, visibility and consequences.",
];

const NO = [
  "A casual community…",
  "A motivational group…",
  "Another place to read inspiring messages…",
  "A system with no consequences…",
  "Something you can join today and forget next week…",
];

export default function QualificationSection() {
  return (
    <section
      id="qualification"
      className="rr-section relative isolate overflow-hidden border-y border-yellow-100/80 bg-white py-[clamp(80px,10vw,128px)]"
    >
      <div className="mx-auto w-[calc(100%-40px)] max-w-[1040px]">
        {/* Section heading */}
        <div className="">
          <span className="rr-figure rr-mono font-mono text-xs tracking-relaxed text-gray-800 font-semibold">
            Qualification
          </span>

          <h2 className="text-4xl">Is this for you?</h2>

          <p className="mt-6 max-w-2xl text-md md:text-sm leading-relaxed text-slate-600 sm:leading-8">
            Be honest with yourself. This isn’t for everyone, and that’s by
            design. If you see yourself in the “yes” column, you’re in the right
            place.
          </p>
        </div>

        {/* Qualification cards */}
        <div className="mt-10 grid gap-4 lg:mt-12 lg:grid-cols-2 lg:gap-5">
          {/* YES CARD */}
          <div className="group relative overflow-hidden rounded-2xl bg-white/85 p-4 shadow-sm backdrop-blur-3xl transition-all duration-300 hover:-translate-y-1 hover:shadow-lg sm:p-6">
            <div
              aria-hidden="true"
              className="pointer-events-none absolute right-0 top-0 h-40 w-40 rounded-full bg-yellow-100/40 blur-3xl"
            />

            <div className="relative flex items-center justify-between gap-3 border-b border-yellow-100 pb-4">
              <div className="flex min-w-0 items-center gap-3">
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary-yellow text-black">
                  <svg
                    viewBox="0 0 24 24"
                    className="h-3 w-3"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <path d="m5 12 4 4L19 6" />
                  </svg>
                </div>

                <div>
                  <h3 className="text-xl font-bold tracking-tight text-[#11152e] sm:text-2xl">
                    Enter if…
                  </h3>
                  <p className="mt-1 text-sm text-slate-500">
                    You’re ready to do the work.
                  </p>
                </div>
              </div>

              <span className="rounded-full bg-yellow-50 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-yellow-800 ring-1 ring-yellow-100">
                Yes
              </span>
            </div>

            <ul className="relative">
              {YES.map((item, i) => (
                <li
                  key={item}
                  className="group/item flex items-start gap-3 border-b border-yellow-100/80 py-4 last:border-b-0 last:pb-1 transition-colors duration-200"
                >
                  <span className="mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-yellow-50 text-[11px] font-bold tabular-nums text-yellow-700 transition-colors group-hover/item:bg-yellow-100">
                    {String(i + 1).padStart(2, "0")}
                  </span>

                  <p className="flex-1 text-sm font-medium leading-6 tracking-[-0.01em] text-slate-800 sm:text-[15px]">
                    {item}
                  </p>

                  <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-yellow-50 text-yellow-700 ring-1 ring-yellow-100 transition-transform duration-300 group-hover/item:scale-110">
                    <svg
                      viewBox="0 0 20 20"
                      className="h-3.5 w-3.5"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden="true"
                    >
                      <path d="m4 10 4 4 8-8" />
                    </svg>
                  </span>
                </li>
              ))}
            </ul>

            <div className="mt-4 flex items-center gap-2 rounded-lg bg-primary-yellow px-3 py-2.5 text-xs text-black">
              <svg
                viewBox="0 0 20 20"
                className="h-4 w-4 shrink-0"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="m4 10 4 4 8-8" />
              </svg>
              <span className="font-medium">
                Ready for structure, accountability and progress.
              </span>
            </div>
          </div>

          {/* NO CARD */}
          <div className="relative overflow-hidden rounded-2xl bg-white/75 p-4 shadow-sm backdrop-blur-3xl transition-all duration-300 hover:-translate-y-1 hover:shadow-lg sm:p-6">
            <div className="flex items-center justify-between gap-3 border-b border-slate-100 pb-4">
              <div className="flex min-w-0 items-center gap-3">
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-black text-white">
                  <svg
                    viewBox="0 0 24 24"
                    className="h-3 w-3"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <path d="m18 6-12 12M6 6l12 12" />
                  </svg>
                </div>

                <div>
                  <h3 className="text-lg font-bold tracking-tight text-slate-700 sm:text-xl">
                    Don’t enter if…
                  </h3>
                  <p className="mt-1 text-sm text-slate-500">
                    You’re looking for an easy way out.
                  </p>
                </div>
              </div>

              <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-black ring-1 ring-slate-300">
                No
              </span>
            </div>

            <ul>
              {NO.map((item, i) => (
                <li
                  key={item}
                  className="group/item flex items-start gap-3 border-b border-slate-100 py-3.5 last:border-b-0 last:pb-1"
                >
                  <span className="mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-slate-50 text-[11px] font-semibold tabular-nums text-slate-500 transition-colors group-hover/item:bg-slate-200 group-hover/item:text-black">
                    {String(i + 1).padStart(2, "0")}
                  </span>

                  <p className="flex-1 text-sm font-medium leading-6 tracking-[-0.01em] text-slate-500 transition-colors duration-200 group-hover/item:text-slate-700 sm:text-[15px]">
                    {item}
                  </p>

                  <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-100 text-black ring-1 ring-slate-300 transition-transform duration-300 group-hover/item:rotate-90">
                    <svg
                      viewBox="0 0 20 20"
                      className="h-3.5 w-3.5"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      aria-hidden="true"
                    >
                      <path d="M5 5l10 10M15 5 5 15" />
                    </svg>
                  </span>
                </li>
              ))}
            </ul>

            <div className="mt-4 flex items-center gap-2 rounded-lg bg-slate-50 px-3 py-2.5 text-xs text-slate-500">
              <svg
                viewBox="0 0 20 20"
                className="h-4 w-4 shrink-0"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <circle cx="10" cy="10" r="7" />
                <path d="M10 6v4l2.5 1.5" />
              </svg>
              <span>Result Room is built for people who follow through.</span>
            </div>
          </div>
        </div>

        {/* Closing statement */}
        <div className="mt-10 flex flex-col items-center justify-center gap-3 text-center sm:flex-row">
          <span className="text-sm text-slate-500">
            No pressure to be perfect.
          </span>
          <span
            aria-hidden="true"
            className="hidden h-1 w-1 rounded-full bg-yellow-300 sm:block"
          />
          <span className="text-sm font-semibold text-yellow-700">
            Just be ready to show up consistently.
          </span>
        </div>
      </div>
    </section>
  );
}
