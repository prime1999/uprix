type HeatmapCell = {
  date: string;
  submitted: boolean;
  future: boolean;
  isToday: boolean;
};

export function buildHeatmapData({
  startDate,
  endDate,
  submissionDates,
}: {
  startDate: string;
  endDate: string;
  submissionDates: string[];
}): HeatmapCell[][] {
  const start = new Date(startDate);
  const end = new Date(endDate);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const submissions = new Set(submissionDates);

  const days: HeatmapCell[] = [];

  const current = new Date(start);

  while (current <= end) {
    const date = current.toISOString().split("T")[0];

    days.push({
      date,
      submitted: submissions.has(date),
      future: current > today,
      isToday: date === today.toISOString().split("T")[0],
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
