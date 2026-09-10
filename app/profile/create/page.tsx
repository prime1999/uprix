"use client";

import Image from "next/image";
import React, { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  X,
  RotateCcw,
  ChevronDown,
  Check,
  User,
  Compass,
  Target,
  MessageCircleWarning,
  BookOpen,
  Clock,
  Flag,
  LoaderCircle,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import logo from "@/app/assets/images/mobileLogo.png";
import {
  ACTIVE_ONLINE_TIME_OPTIONS,
  AGE_GROUP_OPTIONS,
  CURRENT_STAGE_OPTIONS,
  CURRENT_STATUS_OPTIONS,
  FOCUS_AREA_OPTIONS,
  FocusArea,
  GENDER_OPTIONS,
  GUIDANCE_AREA_OPTIONS,
  GuidanceArea,
  PROGRESS_BLOCKER_OPTIONS,
  ProgressBlocker,
  TEACHING_STYLE_OPTIONS,
  University,
  UNIVERSITY_OPTIONS,
} from "@/lib/constants";
import type {
  ArrayFieldKey,
  Option,
  ProfileFormData,
  SingleChipFieldKey,
} from "@/lib/types";
import { createProfile } from "@/lib/supabase/action";
import { useToast } from "@/components/ui/toast";

/* ===========================================================
   ENUMS — mirrors the provided TypeScript enums as plain
   string-value objects (values are identical to the schema).
=========================================================== */
/* ===========================================================
   Initial form state — matches ProfileFormData shape
=========================================================== */
const INITIAL_FORM: ProfileFormData = {
  fullName: "",
  ageGroup: "",
  gender: "",
  currentStatus: "",
  university: "",
  universityOther: "",
  location: "",
  currentStage: "",
  currentFocus: [],
  currentFocusOther: "",
  guidanceAreas: [],
  guidanceAreasOther: "",
  biggestStruggle: "",
  progressBlocker: "",
  progressBlockerOther: "",
  biggestFear: "",
  teachingStyle: [],
  activeOnlineTime: "",
  ninetyDayGoal: "",
};

/* ===========================================================
   Small building blocks, styled after the reference filter
   panel: soft label above a bordered rounded field.
=========================================================== */
function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <label className="block text-[11px] font-medium text-neutral-400 mb-1.5 px-0.5">
      {children}
    </label>
  );
}

function SectionHeading({
  icon: Icon,
  title,
  subtitle,
}: {
  icon: LucideIcon;
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="flex items-start gap-2.5 mb-4 mt-8 first:mt-0">
      <div className="w-7 h-7 rounded-lg bg-secondary-blue flex items-center justify-center shrink-0 mt-0.5">
        <Icon size={14} className="text-white" />
      </div>
      <div>
        <h2 className="text-[15px] font-bold text-secondary-blue leading-tight">
          {title}
        </h2>
        {subtitle && (
          <p className="text-[12px] text-neutral-400 mt-0.5">{subtitle}</p>
        )}
      </div>
    </div>
  );
}

function TextField({
  label,
  placeholder,
  value,
  onChange,
}: {
  label: string;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div>
      <FieldLabel>{label}</FieldLabel>
      <input
        type="text"
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="w-full text-sm px-3.5 py-2.5 rounded-xl border border-neutral-200 bg-white placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-900/10 focus:border-neutral-400 transition"
      />
    </div>
  );
}

function TextAreaField({
  label,
  placeholder,
  value,
  onChange,
  rows = 3,
}: {
  label: string;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
  rows?: number;
}) {
  return (
    <div>
      <FieldLabel>{label}</FieldLabel>
      <textarea
        value={value}
        placeholder={placeholder}
        rows={rows}
        onChange={(e) => onChange(e.target.value)}
        className="w-full text-sm px-3.5 py-2.5 rounded-xl border border-neutral-200 bg-white placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-900/10 focus:border-neutral-400 transition resize-none"
      />
    </div>
  );
}

/** Single-select dropdown styled like the "Приоритет / Статус" fields */
function SelectField({
  label,
  placeholder,
  options,
  value,
  onChange,
}: {
  label: string;
  placeholder: string;
  options: Option[];
  value: string;
  onChange: (value: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node))
        setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const selected = options.find((o) => o.value === value);

  return (
    <div className="relative" ref={ref}>
      <FieldLabel>{label}</FieldLabel>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between text-sm px-3.5 py-2.5 rounded-xl border border-neutral-200 bg-white hover:border-neutral-300 transition"
      >
        <span
          className={
            selected ? "text-neutral-800 font-medium" : "text-neutral-400"
          }
        >
          {selected ? selected.label : placeholder}
        </span>
        <span className="flex items-center gap-1.5 shrink-0">
          {selected && (
            <X
              size={14}
              className="text-neutral-400 hover:text-neutral-700"
              onClick={(e) => {
                e.stopPropagation();
                onChange("");
              }}
            />
          )}
          <ChevronDown
            size={15}
            className={`text-neutral-400 transition-transform ${open ? "rotate-180" : ""}`}
          />
        </span>
      </button>

      {open && (
        <div className="absolute z-30 mt-1.5 w-full bg-white border border-neutral-200 rounded-xl shadow-xl max-h-56 overflow-auto py-1.5">
          {options.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => {
                onChange(opt.value);
                setOpen(false);
              }}
              className="w-full flex items-center justify-between px-3.5 py-2 text-sm text-left text-neutral-700 hover:bg-neutral-50 transition"
            >
              {opt.label}
              {value === opt.value && (
                <Check size={14} className="text-secondary-blue" />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/** Toggle chip grid — supports single or multi selection */
function ChipGroup({
  label,
  options,
  value,
  onToggle,
  multi = true,
}: {
  label: string;
  options: Option[];
  value: string | string[];
  onToggle: (value: string) => void;
  multi?: boolean;
}) {
  const isSelected = (v: string) =>
    multi ? Array.isArray(value) && value.includes(v) : value === v;
  return (
    <div>
      <FieldLabel>{label}</FieldLabel>
      <div className="flex flex-wrap gap-2">
        {options.map((opt) => {
          const active = isSelected(opt.value);
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => onToggle(opt.value)}
              className={`text-[13px] px-3.5 py-2 rounded-full border transition ${
                active
                  ? "bg-secondary-blue border-neutral-900 text-white font-medium"
                  : "bg-neutral-50 border-neutral-200 text-neutral-600 hover:border-neutral-300"
              }`}
            >
              {opt.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ===========================================================
   Main form
=========================================================== */
export default function ProfileCollectionForm() {
  const [form, setForm] = useState(INITIAL_FORM);
  const [loadingStage, setLoadingStage] = useState<
    "idle" | "preparing" | "saving" | "complete"
  >("idle");
  const [submitError, setSubmitError] = useState("");
  const router = useRouter();
  const { toast } = useToast();

  const setField = useCallback(
    <Key extends keyof ProfileFormData>(
      key: Key,
      val: ProfileFormData[Key],
    ) => {
      setForm((f) => ({ ...f, [key]: val }));
    },
    [],
  );

  const toggleArrayField = useCallback(
    (key: ArrayFieldKey) => (val: string) => {
      setForm((f) => {
        const arr = f[key];
        const next = arr.includes(val)
          ? arr.filter((v) => v !== val)
          : [...arr, val];
        return { ...f, [key]: next };
      });
    },
    [],
  );

  const setSingleChip = useCallback(
    (key: SingleChipFieldKey) => (val: string) => {
      setForm((f) => ({ ...f, [key]: f[key] === val ? "" : val }));
    },
    [],
  );

  const handleClear = () => setForm(INITIAL_FORM);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (
      !form.fullName.trim() ||
      !form.ageGroup ||
      !form.gender ||
      !form.currentStatus ||
      !form.location.trim() ||
      !form.currentStage ||
      !form.currentFocus.length ||
      !form.guidanceAreas.length ||
      !form.progressBlocker ||
      !form.teachingStyle.length ||
      !form.activeOnlineTime ||
      !form.biggestStruggle.trim() ||
      !form.biggestFear.trim() ||
      !form.ninetyDayGoal.trim()
    ) {
      setSubmitError("Please complete all required fields before saving.");
      return;
    }

    setSubmitError("");
    setLoadingStage("preparing");

    try {
      await new Promise((resolve) => setTimeout(resolve, 350));
      setLoadingStage("saving");
      console.log({ form });
      await createProfile(form);
      const whatsappMessage = encodeURIComponent(
        `I just joined Uprix through Uprix website. 

I'm here to finalise my identity as an Uprizer, kindly save this contact.

My name is ${form.fullName}.`,
      );
      toast({
        title: "Profile created",
        description:
          "Welcome to Uprix. Your profile is complete. Have questions? Message Taifaq on WhatsApp.",
        action: (
          <a
            href={`https://wa.me/2347025120945?text=${whatsappMessage}`}
            target="_blank"
            rel="noreferrer"
            className="inline-flex h-8 items-center rounded-md bg-green-600 px-3 text-xs font-semibold text-white transition-colors hover:bg-green-700"
          >
            Message Taifaq on WhatsApp
          </a>
        ),
        variant: "success",
      });
      setLoadingStage("complete");
      await new Promise((resolve) => setTimeout(resolve, 500));
      router.push("/protected");
    } catch (error) {
      console.error("Unable to save profile:", error);
      setLoadingStage("idle");
      setSubmitError("We could not save your profile. Please try again.");
    }
  };

  const isSubmitting = loadingStage !== "idle";
  const loadingLabel = {
    idle: "",
    preparing: "Preparing profile...",
    saving: "Saving profile...",
    complete: "Profile saved",
  }[loadingStage];

  return (
    <div className="min-h-screen w-full bg-transparent flex items-start justify-center py-10 px-4">
      <div className="w-full max-w-[480px] bg-white border border-neutral-200 rounded-[1.75rem] shadow-[0_10px_40px_rgba(0,0,0,0.06)] overflow-hidden">
        {/* top bar */}
        <div className="flex items-center justify-between px-6 pt-5 pb-3">
          {/* <button
            type="button"
            onClick={() => router.back()}
            className="flex items-center gap-1.5 text-[13px] text-neutral-500 hover:text-neutral-800 transition"
          >
            <X size={15} />
            Close
          </button> */}
          <Image src={logo} alt="Logo" width={30} height={30} />
          <button
            type="button"
            onClick={handleClear}
            className="flex items-center gap-1.5 text-[13px] text-neutral-500 hover:text-neutral-800 transition"
          >
            <RotateCcw size={13} />
            Clear all
          </button>
        </div>

        <div className="px-6 pb-2">
          <h1 className="text-xl font-bold text-secondary-blue">
            Complete your profile
          </h1>
          <p className="text-[13px] text-neutral-400 mt-1">
            Tell us a little about yourself.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="px-6 pb-6 max-h-[70vh] overflow-y-auto"
        >
          {/* Demographics */}
          <SectionHeading
            icon={User}
            title="About you"
            subtitle="A few basics to get started"
          />
          <div className="space-y-3">
            <TextField
              label="Full name"
              placeholder="Your full name"
              value={form.fullName}
              onChange={(v) => setField("fullName", v)}
            />
            <div className="grid grid-cols-2 gap-3">
              <SelectField
                label="Age group"
                placeholder="Select age"
                options={AGE_GROUP_OPTIONS}
                value={form.ageGroup}
                onChange={(v) => setField("ageGroup", v)}
              />
              <SelectField
                label="Gender"
                placeholder="Select gender"
                options={GENDER_OPTIONS}
                value={form.gender}
                onChange={(v) => setField("gender", v)}
              />
            </div>
            <SelectField
              label="Current status"
              placeholder="What are you currently doing?"
              options={CURRENT_STATUS_OPTIONS}
              value={form.currentStatus}
              onChange={(v) => setField("currentStatus", v)}
            />
            <SelectField
              label="University (optional)"
              placeholder="Select your university"
              options={UNIVERSITY_OPTIONS}
              value={form.university}
              onChange={(v) => setField("university", v)}
            />
            {form.university === University.OTHER && (
              <TextField
                label="University name"
                placeholder="Enter your university"
                value={form.universityOther}
                onChange={(v) => setField("universityOther", v)}
              />
            )}
            <TextField
              label="Location"
              placeholder="City, Country"
              value={form.location}
              onChange={(v) => setField("location", v)}
            />
          </div>

          {/* Current Stage */}
          <SectionHeading
            icon={Compass}
            title="Current stage"
            subtitle="Where are you right now?"
          />
          <SelectField
            label="Current stage"
            placeholder="Select your current stage"
            options={CURRENT_STAGE_OPTIONS}
            value={form.currentStage}
            onChange={(v) => setField("currentStage", v)}
          />

          {/* Goals / Focus */}
          <SectionHeading
            icon={Target}
            title="Goals & focus"
            subtitle="Select all that apply"
          />
          <div className="space-y-3">
            <ChipGroup
              label="Current focus"
              options={FOCUS_AREA_OPTIONS}
              value={form.currentFocus}
              onToggle={toggleArrayField("currentFocus")}
            />
            {form.currentFocus.includes(FocusArea.OTHER) && (
              <TextField
                label="Tell us more"
                placeholder="What's your focus?"
                value={form.currentFocusOther}
                onChange={(v) => setField("currentFocusOther", v)}
              />
            )}
          </div>

          {/* Topics */}
          <SectionHeading
            icon={BookOpen}
            title="Topics you want guidance on"
            subtitle="Select all that apply"
          />
          <div className="space-y-3">
            <ChipGroup
              label="Guidance areas"
              options={GUIDANCE_AREA_OPTIONS}
              value={form.guidanceAreas}
              onToggle={toggleArrayField("guidanceAreas")}
            />
            {form.guidanceAreas.includes(GuidanceArea.OTHER) && (
              <TextField
                label="Tell us more"
                placeholder="What do you need guidance on?"
                value={form.guidanceAreasOther}
                onChange={(v) => setField("guidanceAreasOther", v)}
              />
            )}
          </div>

          {/* Pain, Struggles & Fears */}
          <SectionHeading
            icon={MessageCircleWarning}
            title="Pain, struggles & fears"
            subtitle="Be honest — this stays between us"
          />
          <div className="space-y-3">
            <TextAreaField
              label="Biggest struggle right now"
              placeholder="What's the one thing holding you back?"
              value={form.biggestStruggle}
              onChange={(v) => setField("biggestStruggle", v)}
            />
            <ChipGroup
              label="What mostly blocks your progress?"
              options={PROGRESS_BLOCKER_OPTIONS}
              value={form.progressBlocker}
              onToggle={setSingleChip("progressBlocker")}
              multi={false}
            />
            {form.progressBlocker === ProgressBlocker.OTHER && (
              <TextField
                label="Tell us more"
                placeholder="What blocks your progress?"
                value={form.progressBlockerOther}
                onChange={(v) => setField("progressBlockerOther", v)}
              />
            )}
            <TextAreaField
              label="Biggest fear"
              placeholder="What are you most afraid of right now?"
              value={form.biggestFear}
              onChange={(v) => setField("biggestFear", v)}
            />
          </div>

          {/* Learning Style & Activity */}
          <SectionHeading
            icon={Clock}
            title="Learning style & activity"
            subtitle="How do you learn best?"
          />
          <div className="space-y-3">
            <ChipGroup
              label="Preferred teaching style"
              options={TEACHING_STYLE_OPTIONS}
              value={form.teachingStyle}
              onToggle={toggleArrayField("teachingStyle")}
            />
            <ChipGroup
              label="When are you most active online?"
              options={ACTIVE_ONLINE_TIME_OPTIONS}
              value={form.activeOnlineTime}
              onToggle={setSingleChip("activeOnlineTime")}
              multi={false}
            />
          </div>

          {/* 90-Day Goal */}
          <SectionHeading
            icon={Flag}
            title="Your 90-day goal"
            subtitle="Where do you want to be?"
          />
          <TextAreaField
            label="90-day goal"
            placeholder="What do you want to achieve in the next 90 days?"
            value={form.ninetyDayGoal}
            onChange={(v) => setField("ninetyDayGoal", v)}
            rows={3}
          />

          <div className="mt-6 border-t border-neutral-100 pt-4">
            {submitError && (
              <p role="alert" className="mb-3 text-center text-xs text-red-600">
                {submitError}
              </p>
            )}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full rounded-full py-2 bg-gradient-to-r from-secondary-blue to-primary-blue text-white cursor-pointer duration-700 transition hover:from-primary-blue hover:to-secondary-blue"
            >
              {isSubmitting ? (
                <span className="flex items-center justify-center gap-2">
                  {loadingStage !== "complete" && (
                    <LoaderCircle size={15} className="animate-spin" />
                  )}
                  {loadingLabel}
                </span>
              ) : (
                "Save profile"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
