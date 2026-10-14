"use client";

import { buildHeatmapData } from "@/lib/result-room/build-heatmap";

const WEEKDAYS = ["M", "T", "W", "T", "F", "S", "S"];

interface Props {
  startDate: string;
  endDate: string;
  submissionDates: string[];
}

export function ResultRoomHeatmap({
  startDate,
  endDate,
  submissionDates,
}: Props) {
  const weeks = buildHeatmapData({
    startDate,
    endDate,
    submissionDates,
  });

  /**
   * Find the first week containing each new month.
   *
   * Each month is displayed only once.
   */
  const monthLabels = weeks.map((week, weekIndex) => {
    const validCells = week.filter(Boolean);

    if (validCells.length === 0) {
      return "";
    }

    const previousWeek = weeks[weekIndex - 1];

    const previousValidCells = previousWeek?.filter(Boolean) ?? [];

    /**
     * First week of the heatmap.
     */
    if (previousValidCells.length === 0) {
      const firstDate = new Date(`${validCells[0].date}T00:00:00`);

      return firstDate.toLocaleDateString("en-US", {
        month: "short",
      });
    }

    /**
     * Get all months represented in the previous week.
     */
    const previousMonths = new Set(
      previousValidCells.map((cell) => {
        return new Date(`${cell.date}T00:00:00`).getMonth();
      }),
    );

    /**
     * Find the first cell belonging to a month
     * that wasn't represented in the previous week.
     */
    const newMonthCell = validCells.find((cell) => {
      const month = new Date(`${cell.date}T00:00:00`).getMonth();

      return !previousMonths.has(month);
    });

    if (!newMonthCell) {
      return "";
    }

    const date = new Date(`${newMonthCell.date}T00:00:00`);

    return date.toLocaleDateString("en-US", {
      month: "short",
    });
  });

  return (
    <div className="w-full overflow-x-auto">
      <div className="w-full">
        {/* Month labels */}
        <div className="mb-3 flex">
          {/* Space for weekday labels */}
          <div className="w-7 shrink-0" />

          <div className="w-full">
            <div className="grid grid-flow-col auto-cols-fr gap-1.5">
              {weeks.map((_, weekIndex) => (
                <div
                  key={weekIndex}
                  className="h-4 text-[10px] font-medium text-muted-foreground"
                >
                  {monthLabels[weekIndex]}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Heatmap */}
        <div className="flex">
          {/* Weekday labels */}
          <div className="mr-2 flex w-5 shrink-0 flex-col gap-1.5">
            {WEEKDAYS.map((day, index) => (
              <div
                key={`${day}-${index}`}
                className="flex h-5 items-center justify-center text-[10px] font-medium text-muted-foreground"
              >
                {day}
              </div>
            ))}
          </div>

          {/* Heatmap grid */}
          <div className="w-full">
            <div className="grid grid-flow-col auto-cols-fr gap-1.5">
              {weeks.map((week, weekIndex) => (
                <div key={weekIndex} className="flex flex-col gap-1.5">
                  {week.map((cell, dayIndex) => {
                    /**
                     * Empty cells are used for days before
                     * the room starts / after the room ends
                     * within the first or final week.
                     */
                    if (!cell) {
                      return (
                        <div key={`empty-${dayIndex}`} className="h-5 w-full" />
                      );
                    }

                    const date = new Date(`${cell.date}T00:00:00`);

                    const formattedDate = date.toLocaleDateString("en-US", {
                      weekday: "long",
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    });

                    return (
                      <div
                        key={cell.date}
                        title={
                          cell.future
                            ? `${formattedDate} · Upcoming`
                            : cell.submitted
                              ? `${formattedDate} · Evidence submitted`
                              : `${formattedDate} · No submission`
                        }
                        className={[
                          "h-5 w-full rounded-[4px] cursor-pointer",
                          "transition-all duration-200",

                          // Upcoming
                          cell.future && "bg-green-900",

                          // Missed
                          !cell.future && !cell.submitted && "bg-red-500/15",

                          // Submitted
                          cell.submitted && "bg-green-500",

                          // Today
                          cell.isToday && "bg-red-800",

                          // Hover
                          "hover:scale-[1.08]",
                        ]
                          .filter(Boolean)
                          .join(" ")}
                      />
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Legend */}
        <div className="mt-5 flex w-[72%] lg:w-[73%] items-center justify-end gap-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <span className="size-3 rounded-[3px] bg-green-500" />
            <span>Submitted</span>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="size-3 rounded-[3px] bg-red-800" />
            <span>Missed</span>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="size-3 rounded-[3px] bg-green-900" />
            <span>Upcoming</span>
          </div>
        </div>
      </div>
    </div>
  );
}
