"use client";

import { useState, type FormEvent, type ReactNode } from "react";
import { ChevronDown, Loader2 } from "lucide-react";

import { useToast } from "@/components/ui/toast";
import {
  useUpdateUserProfile,
  type UpdateUserProfileInput,
} from "@/lib/queries/result-room";
import {
  ACTIVE_ONLINE_TIME_OPTIONS,
  AGE_GROUP_OPTIONS,
  CURRENT_STAGE_OPTIONS,
  CURRENT_STATUS_OPTIONS,
  FOCUS_AREA_OPTIONS,
  GENDER_OPTIONS,
  GUIDANCE_AREA_OPTIONS,
  PROGRESS_BLOCKER_OPTIONS,
  TEACHING_STYLE_OPTIONS,
  UNIVERSITY_OPTIONS,
} from "@/lib/constants";
import type { Option } from "@/lib/types";
import { ModalBody, ModalFooter, ResponsiveModal } from "./ResponsiveModal";

/* -------------------------------------------------------------------------- */
/* Types                                                                      */
/* -------------------------------------------------------------------------- */

export interface UserProfile {
  full_name: string;
  /** YYYY-MM-DD */
  date_of_birth: string | null;
  age_group: string;
  gender: string;
  current_status: string;
  university: string | null;
  university_other: string | null;
  location: string;
  current_stage: string;
  current_focus: string[];
  current_focus_other: string | null;
  guidance_areas: string[];
  guidance_areas_other: string | null;
  biggest_struggle: string;
  progress_blocker: string;
  progress_blocker_other: string | null;
  biggest_fear: string;
  teaching_style: string[];
  active_online_time: string;
  ninety_day_goal: string;
}

type TextKey =
  | "full_name"
  | "location"
  | "biggest_struggle"
  | "biggest_fear"
  | "ninety_day_goal"
  | "age_group"
  | "gender"
  | "current_status"
  | "current_stage"
  | "progress_blocker"
  | "active_online_time";

type ArrayKey = "current_focus" | "guidance_areas" | "teaching_style";

type OtherKey =
  | "university_other"
  | "current_focus_other"
  | "guidance_areas_other"
  | "progress_blocker_other";

type Values = Record<TextKey | OtherKey, string> &
  Record<ArrayKey, string[]> & {
    university: string;
    /** "01"–"12", or "" when unset. */
    dob_month: string;
    /** "01"–"31", or "" when unset. */
    dob_day: string;
  };

const TEXT_KEYS: TextKey[] = [
  "full_name",
  "age_group",
  "gender",
  "current_status",
  "location",
  "current_stage",
  "biggest_struggle",
  "progress_blocker",
  "biggest_fear",
  "active_online_time",
  "ninety_day_goal",
];

const ARRAY_KEYS: ArrayKey[] = [
  "current_focus",
  "guidance_areas",
  "teaching_style",
];

const OTHER = "other";

/** Only month and day are collected; the year is always this value. */
const DOB_YEAR = 2026;

const MONTH_OPTIONS: Option[] = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
].map((label, i) => ({ value: String(i + 1).padStart(2, "0"), label }));

/** Days in a month for DOB_YEAR (31 while no month is chosen). */
const daysInMonth = (month: string) =>
  month ? new Date(DOB_YEAR, Number(month), 0).getDate() : 31;

const dayOptions = (month: string): Option[] =>
  Array.from({ length: daysInMonth(month) }, (_, i) => ({
    value: String(i + 1).padStart(2, "0"),
    label: String(i + 1),
  }));

/* -------------------------------------------------------------------------- */
/* Form state helpers                                                         */
/* -------------------------------------------------------------------------- */

const toValues = (p: UserProfile): Values => ({
  full_name: p.full_name ?? "",
  // Stored as YYYY-MM-DD (trim in case the DB returns a timestamp).
  dob_month: p.date_of_birth?.slice(5, 7) ?? "",
  dob_day: p.date_of_birth?.slice(8, 10) ?? "",
  age_group: p.age_group ?? "",
  gender: p.gender ?? "",
  current_status: p.current_status ?? "",
  university: p.university ?? "",
  university_other: p.university_other ?? "",
  location: p.location ?? "",
  current_stage: p.current_stage ?? "",
  current_focus: p.current_focus ?? [],
  current_focus_other: p.current_focus_other ?? "",
  guidance_areas: p.guidance_areas ?? [],
  guidance_areas_other: p.guidance_areas_other ?? "",
  biggest_struggle: p.biggest_struggle ?? "",
  progress_blocker: p.progress_blocker ?? "",
  progress_blocker_other: p.progress_blocker_other ?? "",
  biggest_fear: p.biggest_fear ?? "",
  teaching_style: p.teaching_style ?? [],
  active_online_time: p.active_online_time ?? "",
  ninety_day_goal: p.ninety_day_goal ?? "",
});

const sameSet = (a: string[], b: string[]) =>
  a.length === b.length && a.every((item) => b.includes(item));

/** Which "other" text fields are currently relevant. */
const otherSelected = (v: Values): Record<OtherKey, boolean> => ({
  university_other: v.university === OTHER,
  current_focus_other: v.current_focus.includes(OTHER),
  guidance_areas_other: v.guidance_areas.includes(OTHER),
  progress_blocker_other: v.progress_blocker === OTHER,
});

/** Only the fields that actually changed, shaped for the PATCH endpoint. */
function buildChanges(values: Values, profile: UserProfile) {
  const changes: UpdateUserProfileInput = {};

  for (const key of TEXT_KEYS) {
    const next = values[key].trim();
    if (next !== (profile[key] ?? "").trim()) changes[key] = next;
  }

  for (const key of ARRAY_KEYS) {
    if (!sameSet(values[key], profile[key] ?? [])) changes[key] = values[key];
  }

  // Optional. Compared by month-day only, so an older stored year is left
  // alone unless the person actually changes their month or day.
  const nextMonthDay =
    values.dob_month && values.dob_day
      ? `${values.dob_month}-${values.dob_day}`
      : null;
  const originalMonthDay = profile.date_of_birth?.slice(5, 10) ?? null;
  if (nextMonthDay !== originalMonthDay) {
    changes.date_of_birth = nextMonthDay ? `${DOB_YEAR}-${nextMonthDay}` : null;
  }

  const university = values.university || null;
  if (university !== (profile.university ?? null)) {
    changes.university = university;
  }

  // "Other" text is stored only while its option is selected, otherwise null.
  const selected = otherSelected(values);
  for (const key of Object.keys(selected) as OtherKey[]) {
    const next = selected[key] ? values[key].trim() : null;
    const original = profile[key]?.trim() || null;
    if (next !== original) changes[key] = next;
  }

  return changes;
}

function validate(values: Values) {
  const errors: Partial<Record<keyof Values, string>> = {};

  const required: [TextKey, string][] = [
    ["full_name", "Enter your name."],
    ["age_group", "Select your age group."],
    ["gender", "Select your gender."],
    ["current_status", "Select your current status."],
    ["location", "Enter your location."],
    ["current_stage", "Select your current stage."],
    ["biggest_struggle", "Tell us your biggest struggle."],
    ["progress_blocker", "Select what blocks your progress."],
    ["biggest_fear", "Tell us your biggest fear."],
    ["active_online_time", "Select when you are most active."],
    ["ninety_day_goal", "Enter your 90-day goal."],
  ];
  for (const [key, message] of required) {
    if (!values[key].trim()) errors[key] = message;
  }

  if (Boolean(values.dob_month) !== Boolean(values.dob_day)) {
    errors.dob_month = "Select both a month and a day.";
  } else if (
    values.dob_month &&
    Number(values.dob_day) > daysInMonth(values.dob_month)
  ) {
    errors.dob_month = "That day doesn't exist in the chosen month.";
  }

  if (!values.current_focus.length) {
    errors.current_focus = "Select at least one focus.";
  }
  if (!values.guidance_areas.length) {
    errors.guidance_areas = "Select at least one topic.";
  }
  if (!values.teaching_style.length) {
    errors.teaching_style = "Select at least one teaching style.";
  }

  const selected = otherSelected(values);
  for (const key of Object.keys(selected) as OtherKey[]) {
    if (selected[key] && !values[key].trim()) {
      errors[key] = "Tell us more.";
    }
  }

  return errors;
}

/* -------------------------------------------------------------------------- */
/* Field components                                                           */
/* -------------------------------------------------------------------------- */

const INPUT =
  "w-full rounded-xl border border-neutral-200 bg-white px-3.5 py-2.5 text-sm text-neutral-800 placeholder:text-neutral-400 transition focus:border-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-900/10";

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="mt-6 first:mt-0">
      <h3 className="mb-3 text-sm font-bold text-secondary-blue">{title}</h3>
      <div className="space-y-3">{children}</div>
    </section>
  );
}

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: ReactNode;
}) {
  return (
    <div>
      <label className="mb-1.5 block px-0.5 text-[11px] font-medium text-neutral-500">
        {label}
      </label>
      {children}
      {error && <p className="mt-1 px-0.5 text-xs text-red-600">{error}</p>}
    </div>
  );
}

function TextField({
  label,
  value,
  onChange,
  error,
  placeholder,
  maxLength = 2000,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  error?: string;
  placeholder?: string;
  maxLength?: number;
}) {
  return (
    <Field label={label} error={error}>
      <input
        value={value}
        placeholder={placeholder}
        maxLength={maxLength}
        onChange={(e) => onChange(e.target.value)}
        className={INPUT}
      />
    </Field>
  );
}

function TextAreaField({
  label,
  value,
  onChange,
  error,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  error?: string;
  placeholder?: string;
}) {
  return (
    <Field label={label} error={error}>
      <textarea
        value={value}
        rows={3}
        maxLength={2000}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className={`${INPUT} resize-none`}
      />
    </Field>
  );
}

/** Native select: reliable inside Radix dialogs/sheets and great on mobile. */
function SelectField({
  label,
  options,
  value,
  onChange,
  error,
  placeholder = "Select",
}: {
  label: string;
  options: Option[];
  value: string;
  onChange: (v: string) => void;
  error?: string;
  placeholder?: string;
}) {
  return (
    <Field label={label} error={error}>
      <div className="relative">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={`${INPUT} appearance-none pr-9 ${value ? "" : "text-neutral-400"}`}
        >
          <option value="">{placeholder}</option>
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <ChevronDown
          size={15}
          className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-neutral-400"
        />
      </div>
    </Field>
  );
}

function ChipGroup({
  label,
  options,
  value,
  onToggle,
  error,
}: {
  label: string;
  options: Option[];
  value: string | string[];
  onToggle: (v: string) => void;
  error?: string;
}) {
  const isActive = (v: string) =>
    Array.isArray(value) ? value.includes(v) : value === v;

  return (
    <Field label={label} error={error}>
      <div className="flex flex-wrap gap-2">
        {options.map((opt) => {
          const active = isActive(opt.value);
          return (
            <button
              key={opt.value}
              type="button"
              aria-pressed={active}
              onClick={() => onToggle(opt.value)}
              className={`rounded-full border px-3.5 py-2 text-[13px] transition ${
                active
                  ? "border-secondary-blue bg-secondary-blue font-medium text-white"
                  : "border-neutral-200 bg-neutral-50 text-neutral-600 hover:border-neutral-300"
              }`}
            >
              {opt.label}
            </button>
          );
        })}
      </div>
    </Field>
  );
}

/* -------------------------------------------------------------------------- */
/* Form                                                                       */
/* -------------------------------------------------------------------------- */

function ProfileForm({
  profile,
  onClose,
}: {
  profile: UserProfile;
  onClose: () => void;
}) {
  const mutation = useUpdateUserProfile();
  const { toast } = useToast();

  const [values, setValues] = useState<Values>(() => toValues(profile));
  const [submitted, setSubmitted] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const set = <K extends keyof Values>(key: K, value: Values[K]) =>
    setValues((v) => ({ ...v, [key]: value }));

  const toggle = (key: ArrayKey) => (item: string) =>
    setValues((v) => ({
      ...v,
      [key]: v[key].includes(item)
        ? v[key].filter((x) => x !== item)
        : [...v[key], item],
    }));

  const changes = buildChanges(values, profile);
  const dirty = Object.keys(changes).length > 0;
  const errors = submitted ? validate(values) : {};
  const selected = otherSelected(values);

  const save = async (event: FormEvent) => {
    event.preventDefault();
    setSubmitted(true);
    setServerError(null);

    if (Object.keys(validate(values)).length > 0 || !dirty) return;

    try {
      await mutation.mutateAsync(changes);
      toast({ title: "Profile updated", variant: "success" });
      onClose();
    } catch (err) {
      setServerError(
        err instanceof Error ? err.message : "Something went wrong.",
      );
    }
  };

  return (
    <form onSubmit={save} noValidate className="flex min-h-0 flex-1 flex-col">
      <ModalBody>
        <Section title="About you">
          <TextField
            label="Full name"
            value={values.full_name}
            maxLength={200}
            error={errors.full_name}
            onChange={(v) => set("full_name", v)}
          />
          <div className="grid grid-cols-2 gap-3">
            <SelectField
              label="Age group"
              options={AGE_GROUP_OPTIONS}
              value={values.age_group}
              error={errors.age_group}
              onChange={(v) => set("age_group", v)}
            />
            <SelectField
              label="Gender"
              options={GENDER_OPTIONS}
              value={values.gender}
              error={errors.gender}
              onChange={(v) => set("gender", v)}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <SelectField
              label="Birthday month (optional)"
              placeholder="Month"
              options={MONTH_OPTIONS}
              value={values.dob_month}
              error={errors.dob_month}
              onChange={(month) =>
                setValues((v) => ({
                  ...v,
                  dob_month: month,
                  // Drop a day that doesn't exist in the new month (e.g. 31 → Feb).
                  dob_day:
                    v.dob_day && Number(v.dob_day) > daysInMonth(month)
                      ? ""
                      : v.dob_day,
                }))
              }
            />
            <SelectField
              label="Birthday day"
              placeholder="Day"
              options={dayOptions(values.dob_month)}
              value={values.dob_day}
              onChange={(day) => set("dob_day", day)}
            />
          </div>
          <SelectField
            label="Current status"
            options={CURRENT_STATUS_OPTIONS}
            value={values.current_status}
            error={errors.current_status}
            onChange={(v) => set("current_status", v)}
          />
          <SelectField
            label="University (optional)"
            options={UNIVERSITY_OPTIONS}
            value={values.university}
            placeholder="None"
            onChange={(v) => set("university", v)}
          />
          {selected.university_other && (
            <TextField
              label="University name"
              value={values.university_other}
              error={errors.university_other}
              onChange={(v) => set("university_other", v)}
            />
          )}
          <TextField
            label="Location"
            value={values.location}
            placeholder="City, Country"
            error={errors.location}
            onChange={(v) => set("location", v)}
          />
        </Section>

        <Section title="Current stage">
          <SelectField
            label="Where are you right now?"
            options={CURRENT_STAGE_OPTIONS}
            value={values.current_stage}
            error={errors.current_stage}
            onChange={(v) => set("current_stage", v)}
          />
        </Section>

        <Section title="Goals & focus">
          <ChipGroup
            label="Current focus"
            options={FOCUS_AREA_OPTIONS}
            value={values.current_focus}
            error={errors.current_focus}
            onToggle={toggle("current_focus")}
          />
          {selected.current_focus_other && (
            <TextField
              label="Tell us more"
              value={values.current_focus_other}
              error={errors.current_focus_other}
              onChange={(v) => set("current_focus_other", v)}
            />
          )}
        </Section>

        <Section title="Topics you want guidance on">
          <ChipGroup
            label="Guidance areas"
            options={GUIDANCE_AREA_OPTIONS}
            value={values.guidance_areas}
            error={errors.guidance_areas}
            onToggle={toggle("guidance_areas")}
          />
          {selected.guidance_areas_other && (
            <TextField
              label="Tell us more"
              value={values.guidance_areas_other}
              error={errors.guidance_areas_other}
              onChange={(v) => set("guidance_areas_other", v)}
            />
          )}
        </Section>

        <Section title="Struggles & fears">
          <TextAreaField
            label="Biggest struggle right now"
            value={values.biggest_struggle}
            error={errors.biggest_struggle}
            onChange={(v) => set("biggest_struggle", v)}
          />
          <ChipGroup
            label="What mostly blocks your progress?"
            options={PROGRESS_BLOCKER_OPTIONS}
            value={values.progress_blocker}
            error={errors.progress_blocker}
            onToggle={(v) =>
              set("progress_blocker", values.progress_blocker === v ? "" : v)
            }
          />
          {selected.progress_blocker_other && (
            <TextField
              label="Tell us more"
              value={values.progress_blocker_other}
              error={errors.progress_blocker_other}
              onChange={(v) => set("progress_blocker_other", v)}
            />
          )}
          <TextAreaField
            label="Biggest fear"
            value={values.biggest_fear}
            error={errors.biggest_fear}
            onChange={(v) => set("biggest_fear", v)}
          />
        </Section>

        <Section title="Learning style & activity">
          <ChipGroup
            label="Preferred teaching style"
            options={TEACHING_STYLE_OPTIONS}
            value={values.teaching_style}
            error={errors.teaching_style}
            onToggle={toggle("teaching_style")}
          />
          <ChipGroup
            label="When are you most active online?"
            options={ACTIVE_ONLINE_TIME_OPTIONS}
            value={values.active_online_time}
            error={errors.active_online_time}
            onToggle={(v) =>
              set(
                "active_online_time",
                values.active_online_time === v ? "" : v,
              )
            }
          />
        </Section>

        <Section title="Your 90-day goal">
          <TextAreaField
            label="What do you want to achieve in the next 90 days?"
            value={values.ninety_day_goal}
            error={errors.ninety_day_goal}
            onChange={(v) => set("ninety_day_goal", v)}
          />
        </Section>

        {serverError && (
          <p
            role="alert"
            className="mt-4 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
          >
            {serverError}
          </p>
        )}
      </ModalBody>

      <ModalFooter>
        <button
          type="button"
          onClick={onClose}
          disabled={mutation.isPending}
          className="rounded-full border border-neutral-200 px-4 py-2 text-sm font-medium text-neutral-700 transition hover:bg-neutral-50 disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={!dirty || mutation.isPending}
          className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-secondary-blue to-primary-blue px-5 py-2 text-sm font-semibold text-white transition disabled:opacity-50"
        >
          {mutation.isPending && <Loader2 className="size-4 animate-spin" />}
          {mutation.isPending ? "Saving…" : "Save changes"}
        </button>
      </ModalFooter>
    </form>
  );
}

/* -------------------------------------------------------------------------- */
/* Modal                                                                      */
/* -------------------------------------------------------------------------- */

export default function EditProfileModal({
  open,
  onOpenChange,
  profile,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  profile: UserProfile;
}) {
  return (
    <ResponsiveModal
      open={open}
      onOpenChange={onOpenChange}
      title="Edit profile"
      description="Update your details. Only what you change is saved."
    >
      {/* Mounted only while open, so it always starts from the saved profile. */}
      {open && (
        <ProfileForm profile={profile} onClose={() => onOpenChange(false)} />
      )}
    </ResponsiveModal>
  );
}
