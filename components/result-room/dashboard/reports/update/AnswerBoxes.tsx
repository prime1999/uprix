"use client";

import { useId } from "react";
import { Check, CircleCheck, CircleX, type LucideIcon } from "lucide-react";

// Adjust this path to wherever you keep icon-3d.tsx.
import {
  Icon3D,
  type Tone,
} from "@/components/result-room/dashboard/fines/icon-3d";

export type Choice = "yes" | "no";

const OPTION: Record<
  Choice,
  {
    icon: LucideIcon;
    tone: Tone;
    title: string;
    subtitle: string;
    selected: string;
    badge: string;
  }
> = {
  yes: {
    icon: CircleCheck,
    tone: "emerald",
    title: "Yes",
    subtitle: "They submitted on time",
    selected:
      "border-emerald-300 bg-white/85 ring-2 ring-emerald-400/50 shadow-[inset_0_2px_0_rgba(255,255,255,1),inset_0_-3px_0_rgba(16,185,129,0.18),0_12px_20px_-8px_rgba(16,185,129,0.6)]",
    badge:
      "from-emerald-400 to-emerald-600 shadow-[0_4px_8px_-2px_rgba(5,150,105,0.8)]",
  },
  no: {
    icon: CircleX,
    tone: "red",
    title: "No",
    subtitle: "They did not submit on time",
    selected:
      "border-red-300 bg-white/85 ring-2 ring-red-400/50 shadow-[inset_0_2px_0_rgba(255,255,255,1),inset_0_-3px_0_rgba(239,68,68,0.18),0_12px_20px_-8px_rgba(239,68,68,0.6)]",
    badge:
      "from-red-400 to-red-600 shadow-[0_4px_8px_-2px_rgba(220,38,38,0.8)]",
  },
};

function AnswerBox({
  name,
  value,
  selected,
  disabled,
  onSelect,
}: {
  name: string;
  value: Choice;
  selected: boolean;
  disabled: boolean;
  onSelect: () => void;
}) {
  const option = OPTION[value];

  return (
    <label className="relative block cursor-pointer has-[:disabled]:cursor-not-allowed has-[:disabled]:opacity-60">
      <input
        type="radio"
        name={name}
        value={value}
        checked={selected}
        onChange={onSelect}
        disabled={disabled}
        required
        className="peer sr-only"
      />

      <span
        className={`flex h-full flex-col items-center gap-2 rounded-2xl border px-3 py-4 text-center transition duration-150 peer-focus-visible:ring-4 peer-focus-visible:ring-blue-400/40 motion-reduce:transition-none ${
          selected
            ? option.selected
            : "border-white/70 bg-white/40 shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_6px_12px_-8px_rgba(60,70,160,0.35)] hover:-translate-y-0.5 hover:bg-white/60"
        }`}
      >
        <span
          className={`transition duration-150 motion-reduce:transition-none ${
            selected ? "" : "opacity-70 saturate-50"
          }`}
        >
          <Icon3D icon={option.icon} tone={option.tone} size="md" />
        </span>

        <span className="text-base font-semibold text-neutral-900">
          {option.title}
        </span>
        <span className="text-xs leading-snug text-neutral-600">
          {option.subtitle}
        </span>

        {selected && (
          <span
            aria-hidden
            className={`absolute right-2 top-2 grid size-5 place-items-center rounded-full border-2 border-white bg-gradient-to-b text-white ${option.badge}`}
          >
            <Check className="size-3" strokeWidth={3.5} />
          </span>
        )}
      </span>
    </label>
  );
}

/**
 * The required Yes / No answer: two boxes, and one must be picked.
 * Shared by the "submit report" and "update report" forms.
 */
export default function AnswerBoxes({
  value,
  onChange,
  disabled = false,
  legend = "Did your partner submit their task on time?",
}: {
  value: Choice | null;
  onChange: (choice: Choice) => void;
  disabled?: boolean;
  legend?: string;
}) {
  // Unique per instance, so two forms on one page never share a radio group.
  const name = useId();

  return (
    <fieldset>
      <legend className="mb-3 text-sm font-medium text-neutral-900">
        {legend}
        <span aria-hidden className="ml-1 text-red-600">
          *
        </span>
        <span className="sr-only"> (required)</span>
      </legend>

      <div className="grid grid-cols-2 gap-3">
        <AnswerBox
          name={name}
          value="yes"
          selected={value === "yes"}
          disabled={disabled}
          onSelect={() => onChange("yes")}
        />
        <AnswerBox
          name={name}
          value="no"
          selected={value === "no"}
          disabled={disabled}
          onSelect={() => onChange("no")}
        />
      </div>

      {/* Says back what will be reported, so a mis-tap is easy to spot */}
      <p
        aria-live="polite"
        className={`mt-3 text-xs leading-relaxed ${
          value === null ? "text-amber-700" : "text-neutral-600"
        }`}
      >
        {value === null
          ? "Choose Yes or No to continue."
          : value === "yes"
            ? "You're reporting that your partner submitted on time."
            : "You're reporting that your partner did not submit on time."}
      </p>
    </fieldset>
  );
}
