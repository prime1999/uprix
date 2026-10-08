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
      className="rr-section relative isolate overflow-hidden border-y border-yellow-100/80 bg-gradient-to-b from-white via-[#fffdf2] to-white py-[clamp(80px,10vw,128px)]"
    >
      {/* Background decoration */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -left-40 top-0 -z-10 h-80 w-80 rounded-full bg-yellow-200/25 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-40 top-48 -z-10 h-96 w-96 rounded-full bg-amber-200/25 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute bottom-0 left-1/2 -z-10 h-64 w-[80%] -translate-x-1/2 rounded-full bg-yellow-100/40 blur-3xl"
      />

      <div className="mx-auto w-[calc(100%-40px)] max-w-[1180px]">
        {/* Section heading */}
        <div className="">
          <span className="rr-figure rr-mono font-mono text-xs tracking-[0.02em] text-gray-800 font-semibold">
            Qualification
          </span>

          <h2 className="text-2xl">Is this for you?</h2>

          <p className="mt-6 max-w-2xl text-sm leading-7 text-slate-600 sm:text-lg sm:leading-8">
            Be honest with yourself. This isn’t for everyone, and that’s by
            design. If you see yourself in the “yes” column, you’re in the right
            place.
          </p>
        </div>

        {/* Qualification cards */}
        <div className="mt-12 grid gap-6 lg:mt-16 lg:grid-cols-2 lg:gap-7">
          {/* YES CARD */}
          <div className="group relative overflow-hidden rounded-[28px] border border-yellow-200/80 bg-white/85 p-6 shadow-[0_12px_45px_rgba(234,179,8,0.10)] backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:border-yellow-300 hover:shadow-[0_22px_60px_rgba(234,179,8,0.18)] sm:p-8">
            <div
              aria-hidden="true"
              className="pointer-events-none absolute right-0 top-0 h-40 w-40 rounded-full bg-emerald-100/40 blur-3xl"
            />

            <div className="relative flex items-center justify-between gap-4 border-b border-yellow-100 pb-6">
              <div className="flex min-w-0 items-center gap-4">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-50 to-teal-50 text-emerald-600 ring-1 ring-emerald-100">
                  <svg
                    viewBox="0 0 24 24"
                    className="h-7 w-7"
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
                  <h3 className="text-2xl font-bold tracking-tight text-[#11152e] sm:text-3xl">
                    Enter if…
                  </h3>
                  <p className="mt-1 text-sm text-slate-500">
                    You’re ready to do the work.
                  </p>
                </div>
              </div>

              <span className="rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-emerald-700 ring-1 ring-emerald-100">
                Yes
              </span>
            </div>

            <ul className="relative">
              {YES.map((item, i) => (
                <li
                  key={item}
                  className="group/item flex items-start gap-4 border-b border-yellow-100/80 py-5 last:border-b-0 last:pb-1 transition-colors duration-200"
                >
                  <span className="mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-yellow-50 text-xs font-bold tabular-nums text-yellow-700 transition-colors group-hover/item:bg-yellow-100">
                    {String(i + 1).padStart(2, "0")}
                  </span>

                  <p className="flex-1 text-[16px] font-medium leading-7 tracking-[-0.015em] text-slate-800 sm:text-[17px]">
                    {item}
                  </p>

                  <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 ring-1 ring-emerald-100 transition-transform duration-300 group-hover/item:scale-110">
                    <svg
                      viewBox="0 0 20 20"
                      className="h-4 w-4"
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

            <div className="mt-6 flex items-center gap-2 rounded-xl bg-emerald-50/70 px-4 py-3 text-sm text-emerald-800">
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
          <div className="relative overflow-hidden rounded-[28px] border border-slate-200/80 bg-white/75 p-6 shadow-[0_12px_45px_rgba(15,23,42,0.035)] backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:border-rose-200 hover:shadow-[0_22px_60px_rgba(244,63,94,0.06)] sm:p-8">
            <div className="flex items-center justify-between gap-4 border-b border-slate-100 pb-6">
              <div className="flex min-w-0 items-center gap-4">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-rose-50 to-pink-50 text-rose-500 ring-1 ring-rose-100">
                  <svg
                    viewBox="0 0 24 24"
                    className="h-7 w-7"
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
                  <h3 className="text-xl font-bold tracking-tight text-slate-700 sm:text-2xl">
                    Don’t enter if…
                  </h3>
                  <p className="mt-1 text-sm text-slate-500">
                    You’re looking for an easy way out.
                  </p>
                </div>
              </div>

              <span className="rounded-full bg-rose-50 px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-rose-600 ring-1 ring-rose-100">
                No
              </span>
            </div>

            <ul>
              {NO.map((item, i) => (
                <li
                  key={item}
                  className="group/item flex items-start gap-4 border-b border-slate-100 py-[18px] last:border-b-0 last:pb-1"
                >
                  <span className="mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-slate-50 text-xs font-semibold tabular-nums text-slate-400 transition-colors group-hover/item:bg-rose-50 group-hover/item:text-rose-500">
                    {String(i + 1).padStart(2, "0")}
                  </span>

                  <p className="flex-1 text-[15px] font-medium leading-7 tracking-[-0.01em] text-slate-500 transition-colors duration-200 group-hover/item:text-slate-700 sm:text-base">
                    {item}
                  </p>

                  <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-rose-50/80 text-rose-500 ring-1 ring-rose-100/80 transition-transform duration-300 group-hover/item:rotate-90">
                    <svg
                      viewBox="0 0 20 20"
                      className="h-4 w-4"
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

            <div className="mt-6 flex items-center gap-2 rounded-xl bg-slate-50 px-4 py-3 text-sm text-slate-500">
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
