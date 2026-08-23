"use client";

import { MAX_WEEKLY_HOURS, MIN_WEEKLY_HOURS, WEEKLY_TIME_HOUR_STEP } from "@/lib/study-plan/weekly-time";
import type { StudyPlanWeekday } from "@/lib/study-plan/types";

export const STUDY_WEEKDAYS: readonly { id: StudyPlanWeekday; short: string; name: string }[] = [
  { id: "mon", short: "M", name: "Monday" }, { id: "tue", short: "T", name: "Tuesday" },
  { id: "wed", short: "W", name: "Wednesday" }, { id: "thu", short: "T", name: "Thursday" },
  { id: "fri", short: "F", name: "Friday" }, { id: "sat", short: "S", name: "Saturday" },
  { id: "sun", short: "S", name: "Sunday" },
];

export function StudyRhythmFields({ weeklyHours, availableDays, onWeeklyHoursChange, onAvailableDaysChange }: {
  weeklyHours: number;
  availableDays: StudyPlanWeekday[];
  onWeeklyHoursChange: (hours: number) => void;
  onAvailableDaysChange: (days: StudyPlanWeekday[]) => void;
}) {
  return (
    <div className="grid gap-5">
      <label className="grid max-w-xs gap-1 text-sm font-bold">
        Weekly study time
        <div className="flex items-center gap-2">
          <input
            aria-label="Weekly study time in hours"
            type="number"
            min={MIN_WEEKLY_HOURS}
            max={MAX_WEEKLY_HOURS}
            step={WEEKLY_TIME_HOUR_STEP}
            required
            value={weeklyHours}
            onChange={(event) => onWeeklyHoursChange(event.currentTarget.valueAsNumber)}
            className="min-h-11 w-24 rounded-lg border border-line bg-white px-3 text-sm font-bold outline-none focus:border-forge focus:ring-2 focus:ring-forge/20"
          />
          <span className="text-sm font-bold text-muted">hours per week</span>
        </div>
      </label>

      <fieldset>
        <legend className="text-sm font-bold">Days you can study</legend>
        <div className="mt-2 flex flex-wrap gap-2">
          {STUDY_WEEKDAYS.map((day) => {
            const checked = availableDays.includes(day.id);
            return (
              <label key={day.id} className={`flex min-h-11 min-w-11 cursor-pointer items-center justify-center rounded-lg border px-3 text-sm font-extrabold transition-colors ${checked ? "border-forge bg-forge-soft text-forge" : "border-line bg-white text-muted hover:border-forge/45"}`} title={day.name}>
                <input
                  type="checkbox"
                  className="sr-only"
                  checked={checked}
                  aria-label={day.name}
                  onChange={() => onAvailableDaysChange(checked
                    ? availableDays.filter((entry) => entry !== day.id)
                    : [...availableDays, day.id])}
                />
                <span aria-hidden="true">{day.short}</span>
              </label>
            );
          })}
        </div>
      </fieldset>
    </div>
  );
}
