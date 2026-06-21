'use client';

import { format, subDays, startOfWeek, addDays } from 'date-fns';

interface WeeklyCalendarProps {
  workoutDates: Set<string>;
  weeks?: number;
}

export function WeeklyCalendar({ workoutDates, weeks = 8 }: WeeklyCalendarProps) {
  const today = new Date();
  const totalDays = weeks * 7;
  const startDate = startOfWeek(subDays(today, totalDays - 1), { weekStartsOn: 1 });

  const grid: { date: string; hasWorkout: boolean; isFuture: boolean }[][] = [];

  for (let w = 0; w < weeks; w++) {
    const week: typeof grid[number] = [];
    for (let d = 0; d < 7; d++) {
      const date = addDays(startDate, w * 7 + d);
      const dateStr = format(date, 'yyyy-MM-dd');
      week.push({
        date: dateStr,
        hasWorkout: workoutDates.has(dateStr),
        isFuture: date > today,
      });
    }
    grid.push(week);
  }

  const dayLabels = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

  return (
    <div>
      <div className="flex gap-[3px] mb-1 ml-[18px]">
        {dayLabels.map((label, i) => (
          <div key={i} className="w-[14px] text-center text-[8px] text-zinc-600">{label}</div>
        ))}
      </div>
      <div className="flex gap-[3px]">
        <div className="flex flex-col gap-[3px] justify-end mr-[2px]">
          {grid.filter((_, i) => i % 4 === 0).map((week, i) => (
            <div key={i} className="h-[14px] text-[8px] text-zinc-600 flex items-center" style={{ marginTop: i > 0 ? `${3 * 14 + 3 * 3 - 14}px` : 0 }}>
              {format(new Date(week[0].date), 'MMM')}
            </div>
          ))}
        </div>
        <div className="flex gap-[3px]">
          {grid.map((week, wi) => (
            <div key={wi} className="flex flex-col gap-[3px]">
              {week.map((day) => (
                <div
                  key={day.date}
                  title={`${day.date}${day.hasWorkout ? ' - Trained' : ''}`}
                  className={`w-[14px] h-[14px] rounded-[3px] transition-colors ${
                    day.isFuture
                      ? 'bg-zinc-900'
                      : day.hasWorkout
                        ? 'bg-indigo-500'
                        : 'bg-zinc-800/60'
                  }`}
                />
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
