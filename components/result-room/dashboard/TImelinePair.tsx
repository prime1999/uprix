import TimelineCard, { type TimelineItem } from "./TimelineCard";

const DEADLINES: TimelineItem[] = [
  {
    id: "submit",
    title: "Submit task",
    detail: "Before 9:00",
    icon: "submit",
    tone: "blue",
  },
  {
    id: "check",
    title: "Check up on partner",
    detail: "Before 9:30",
    icon: "partner",
    tone: "yellow",
  },
  {
    id: "report",
    title: "Report partner submission",
    detail: "Before 9:30",
    icon: "report",
    tone: "yellow",
  },
];

const PENALTIES: TimelineItem[] = [
  {
    id: "no-submission",
    title: "No submission",
    detail: "₦500 fine",
    icon: "fine",
    tone: "yellow",
  },
  {
    id: "no-review",
    title: "No partner review",
    detail: "₦500 fine",
    icon: "fine",
    tone: "yellow",
  },
  {
    id: "outstanding",
    title: "48 hours outstanding",
    detail: "Room locked",
    icon: "lock",
    tone: "dark",
  },
  {
    id: "eviction",
    title: "3 days after room lock",
    detail: "Eviction",
    icon: "evict",
    tone: "dark",
  },
];

interface TimelinePairProps {
  deadlines?: TimelineItem[];
  penalties?: TimelineItem[];
  lives?: number;
  slots?: any;
}

/** Side by side from `md` up, stacked on phones. */
export default function TimelinePair({
  deadlines = DEADLINES,
  penalties = PENALTIES,
  lives = 5,
  slots,
}: TimelinePairProps) {
  return (
    <div className="mx-auto my-4 grid w-full max-w-3xl grid-cols-1 gap-4 md:grid-cols-2">
      <TimelineCard title="Daily deadlines" items={deadlines} />
      <TimelineCard
        title="Penalties"
        items={penalties}
        lives={lives}
        slots={slots}
      />
    </div>
  );
}
