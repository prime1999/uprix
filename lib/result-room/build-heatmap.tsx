type HeatmapCell = {
  date: string;
  submitted: boolean;
  future: boolean;
  isToday: boolean;
};

function toLocalDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

export function buildHeatmapData({
  startDate,
  endDate,
  submissionDates,
}: {
  startDate: string;
  endDate: string;
  submissionDates: string[];
}): HeatmapCell[][] {
  const start = new Date(`${startDate}T00:00:00`);
  const end = new Date(`${endDate}T00:00:00`);

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayKey = toLocalDateKey(today);

  const submissions = new Set(submissionDates);

  const days: HeatmapCell[] = [];

  const current = new Date(start);

  while (current <= end) {
    const date = toLocalDateKey(current);

    days.push({
      date,
      submitted: submissions.has(date),
      future: current > today,
      isToday: date === todayKey,
    });

    current.setDate(current.getDate() + 1);
  }

  const weeks: HeatmapCell[][] = [];

  let week: HeatmapCell[] = [];

  const firstDay = start.getDay();

  const mondayOffset = firstDay === 0 ? 6 : firstDay - 1;

  for (let i = 0; i < mondayOffset; i++) {
    week.push(null as never);
  }

  days.forEach((day) => {
    week.push(day);

    if (week.length === 7) {
      weeks.push(week);
      week = [];
    }
  });

  if (week.length > 0) {
    while (week.length < 7) {
      week.push(null as never);
    }

    weeks.push(week);
  }

  return weeks;
}
