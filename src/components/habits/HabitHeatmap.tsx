import { useMemo } from "react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { format, subDays, startOfWeek, addDays, isSameDay } from "date-fns";

interface HabitHeatmapProps {
  completions: Array<{ completed_date: string; habit_id: string }>;
  habitId?: string;
  weeks?: number;
}

export function HabitHeatmap({ completions, habitId, weeks = 12 }: HabitHeatmapProps) {
  const { grid, maxCount } = useMemo(() => {
    const today = new Date();
    const startDate = startOfWeek(subDays(today, weeks * 7), { weekStartsOn: 0 });
    
    // Filter completions for specific habit if provided
    const filtered = habitId 
      ? completions.filter(c => c.habit_id === habitId)
      : completions;

    // Count completions per date
    const countMap = new Map<string, number>();
    filtered.forEach(c => {
      const date = c.completed_date;
      countMap.set(date, (countMap.get(date) || 0) + 1);
    });

    // Build grid (7 rows x N weeks columns)
    const grid: Array<{ date: Date; count: number }[]> = [];
    let currentDate = startDate;
    let maxCount = 0;

    for (let w = 0; w <= weeks; w++) {
      const week: Array<{ date: Date; count: number }> = [];
      for (let d = 0; d < 7; d++) {
        const dateStr = format(currentDate, "yyyy-MM-dd");
        const count = countMap.get(dateStr) || 0;
        if (count > maxCount) maxCount = count;
        week.push({ date: new Date(currentDate), count });
        currentDate = addDays(currentDate, 1);
      }
      grid.push(week);
    }

    return { grid, maxCount };
  }, [completions, habitId, weeks]);

  const getIntensity = (count: number) => {
    if (count === 0) return "bg-muted";
    if (maxCount === 0) return "bg-muted";
    const ratio = count / maxCount;
    if (ratio <= 0.25) return "bg-green-200 dark:bg-green-900";
    if (ratio <= 0.5) return "bg-green-400 dark:bg-green-700";
    if (ratio <= 0.75) return "bg-green-500 dark:bg-green-600";
    return "bg-green-600 dark:bg-green-500";
  };

  const today = new Date();
  const dayLabels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  return (
    <div className="overflow-x-auto">
      <div className="flex gap-0.5">
        {/* Day labels */}
        <div className="flex flex-col gap-0.5 mr-1">
          {dayLabels.map((day, i) => (
            <div key={day} className="h-3 w-6 text-[10px] text-muted-foreground flex items-center">
              {i % 2 === 1 ? day : ""}
            </div>
          ))}
        </div>
        
        {/* Grid */}
        <TooltipProvider>
          {grid.map((week, weekIndex) => (
            <div key={weekIndex} className="flex flex-col gap-0.5">
              {week.map(({ date, count }, dayIndex) => {
                const isToday = isSameDay(date, today);
                const isFuture = date > today;
                
                return (
                  <Tooltip key={dayIndex}>
                    <TooltipTrigger asChild>
                      <div
                        className={`h-3 w-3 rounded-sm transition-colors ${
                          isFuture 
                            ? "bg-muted/50" 
                            : getIntensity(count)
                        } ${isToday ? "ring-1 ring-primary" : ""}`}
                      />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="text-xs">
                        {format(date, "MMM d, yyyy")}
                        <br />
                        {count} completion{count !== 1 ? "s" : ""}
                      </p>
                    </TooltipContent>
                  </Tooltip>
                );
              })}
            </div>
          ))}
        </TooltipProvider>
      </div>
      
      {/* Legend */}
      <div className="flex items-center justify-end gap-1 mt-2 text-xs text-muted-foreground">
        <span>Less</span>
        <div className="h-3 w-3 rounded-sm bg-muted" />
        <div className="h-3 w-3 rounded-sm bg-green-200 dark:bg-green-900" />
        <div className="h-3 w-3 rounded-sm bg-green-400 dark:bg-green-700" />
        <div className="h-3 w-3 rounded-sm bg-green-500 dark:bg-green-600" />
        <div className="h-3 w-3 rounded-sm bg-green-600 dark:bg-green-500" />
        <span>More</span>
      </div>
    </div>
  );
}
