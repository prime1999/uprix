import { memo } from "react";
import Image from "next/image";
import female from "@/app/assets/images/profile/female.png";
import male from "@/app/assets/images/profile/male.png";

interface ProgressHeroCardProps {
  /** Which day of the room the participant is on. */
  currentDay: number;
  totalDays: number;

  /** The participant's primary goal. */
  goal: string | null | undefined;

  /** Current streak, in days. */
  streak: number;

  /** Total days with a submission. */
  daysSubmitted: number;

  gender?: string | null;
}

/** A raised, key-cap style stat tile. */
function StatKey({ value, label }: { value: number; label: string }) {
  return (
    <div className="min-w-0 rounded-xl border border-white/80 bg-gradient-to-b from-white to-blue-100 px-2.5 py-2 text-blue-950 shadow-[inset_0_2px_0_rgba(255,255,255,1),inset_0_-3px_0_rgba(59,130,246,0.2),0_5px_0_0_rgba(23,37,84,0.5)] sm:px-3">
      <p className="text-lg font-bold leading-none tabular-nums">{value}</p>
      <p className="mt-1 text-[10px] font-medium text-blue-900/70">{label}</p>
    </div>
  );
}

/**
 * Progress hero card showing the participant's progress, goal,
 * streak statistics and gender-based profile illustration.
 *
 * The card has a controlled height, while the image scales
 * responsively without forcing the card to grow.
 */
function ProgressHeroCard({
  currentDay,
  totalDays,
  goal,
  streak,
  daysSubmitted,
  gender,
}: ProgressHeroCardProps) {
  const goalText = goal?.trim();

  const profileImage = gender?.toLowerCase() === "male" ? male : female;

  return (
    <section
      aria-label="Your Result Room progress"
      className="
        relative flex h-52 w-full items-center
        overflow-hidden rounded-3xl
        bg-gradient-to-br from-secondary-blue via-secondary-blue to-primary-blue
        text-white/90
        sm:h-56
        md:h-64
      "
    >
      {/* Text and statistics */}
      <div
        className="
          relative z-10 flex h-full min-w-0
          w-[68%] flex-col justify-center
          py-3 pl-4 pr-1
          sm:w-[62%] sm:pl-5 sm:pr-2
          md:w-[60%] md:pl-6
        "
      >
        <h1
          className=" font-heading
            mb-3 inline-block w-fit
            text-yellow-300
            text-3xl font-black tracking-tight
            md:mb-4 md:text-4xl
          "
        >
          Day {currentDay} / {totalDays}
        </h1>

        <h2 className="mb-1 text-sm font-semibold sm:text-base md:text-lg">
          Your Primary Goal
        </h2>

        <p
          className="
            line-clamp-2 max-w-full break-words
            [overflow-wrap:anywhere]
            text-xs leading-relaxed text-white
            sm:text-sm
          "
          title={goalText || "No primary goal added yet."}
        >
          {goalText || "No primary goal added yet."}
        </p>

        <div className="mt-3 flex max-w-full flex-wrap gap-2 pb-1 sm:mt-4 sm:gap-3">
          <StatKey value={streak} label="Streak days" />
          <StatKey value={daysSubmitted} label="Days submitted" />
        </div>
      </div>

      {/* Responsive profile illustration */}
      <div
        className="
          pointer-events-none absolute inset-y-0 right-0
          flex w-[43%] items-end justify-center
          overflow-hidden
          sm:w-[42%]
          md:w-[40%]
        "
      >
        <Image
          src={profileImage}
          alt="Your profile illustration"
          width={400}
          height={400}
          priority
          sizes="(max-width: 639px) 43vw, (max-width: 767px) 42vw, 40vw"
          className="
            block h-auto w-full max-w-[240px]
            max-h-full object-contain object-bottom
            drop-shadow-[0_10px_12px_rgba(0,0,0,0.3)]
            sm:max-w-[270px]
            md:max-w-[300px]
          "
        />
      </div>
    </section>
  );
}

export default memo(ProgressHeroCard);
