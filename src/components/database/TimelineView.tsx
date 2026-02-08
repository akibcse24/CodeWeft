import { useState, useMemo, useRef } from 'react';
import { motion } from 'framer-motion';
import { 
  ChevronLeft, ChevronRight, ZoomIn, ZoomOut, Calendar 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  format,
  differenceInDays,
  addMonths,
  subMonths,
  parseISO,
  isWithinInterval,
  addDays,
} from 'date-fns';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface TimelineItem {
  id: string;
  title: string;
  startDate: string;
  endDate?: string;
  color?: string;
  status?: string;
}

interface TimelineViewProps {
  items: TimelineItem[];
  onItemClick?: (item: TimelineItem) => void;
  onItemResize?: (itemId: string, startDate: Date, endDate: Date) => void;
}

type ZoomLevel = 'day' | 'week' | 'month';

const STATUS_COLORS: Record<string, string> = {
  'todo': 'bg-yellow-500',
  'in-progress': 'bg-blue-500',
  'done': 'bg-green-500',
  'default': 'bg-primary',
};

export function TimelineView({ 
  items, 
  onItemClick,
  onItemResize 
}: TimelineViewProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [zoom, setZoom] = useState<ZoomLevel>('day');
  const containerRef = useRef<HTMLDivElement>(null);

  const dateRange = useMemo(() => {
    const start = subMonths(startOfMonth(currentDate), 1);
    const end = addMonths(endOfMonth(currentDate), 2);
    return { start, end };
  }, [currentDate]);

  const days = useMemo(() => {
    return eachDayOfInterval({ start: dateRange.start, end: dateRange.end });
  }, [dateRange]);

  const columnWidth = zoom === 'day' ? 40 : zoom === 'week' ? 120 : 200;
  const totalWidth = days.length * columnWidth;

  const getItemPosition = (item: TimelineItem) => {
    const startDate = parseISO(item.startDate);
    const endDate = item.endDate ? parseISO(item.endDate) : addDays(startDate, 1);
    
    const startOffset = differenceInDays(startDate, dateRange.start);
    const duration = Math.max(1, differenceInDays(endDate, startDate) + 1);
    
    return {
      left: startOffset * columnWidth,
      width: duration * columnWidth - 4,
    };
  };

  const groupedItems = useMemo(() => {
    // Sort items by start date
    const sorted = [...items].sort((a, b) => 
      parseISO(a.startDate).getTime() - parseISO(b.startDate).getTime()
    );

    // Assign rows to avoid overlaps
    const rows: TimelineItem[][] = [];
    
    sorted.forEach(item => {
      const itemStart = parseISO(item.startDate);
      const itemEnd = item.endDate ? parseISO(item.endDate) : addDays(itemStart, 1);
      
      // Find a row where this item fits
      let placed = false;
      for (let i = 0; i < rows.length; i++) {
        const lastInRow = rows[i][rows[i].length - 1];
        const lastEnd = lastInRow.endDate 
          ? parseISO(lastInRow.endDate) 
          : addDays(parseISO(lastInRow.startDate), 1);
        
        if (itemStart > lastEnd) {
          rows[i].push(item);
          placed = true;
          break;
        }
      }
      
      if (!placed) {
        rows.push([item]);
      }
    });

    return rows;
  }, [items]);

  const handlePrevMonth = () => setCurrentDate(subMonths(currentDate, 1));
  const handleNextMonth = () => setCurrentDate(addMonths(currentDate, 1));
  const handleToday = () => setCurrentDate(new Date());

  const cycleZoom = () => {
    const levels: ZoomLevel[] = ['day', 'week', 'month'];
    const currentIndex = levels.indexOf(zoom);
    setZoom(levels[(currentIndex + 1) % levels.length]);
  };

  // Generate month headers
  const monthHeaders = useMemo(() => {
    const months: { month: string; start: number; width: number }[] = [];
    let currentMonth = '';
    let monthStart = 0;

    days.forEach((day, index) => {
      const monthKey = format(day, 'MMMM yyyy');
      if (monthKey !== currentMonth) {
        if (currentMonth) {
          months.push({
            month: currentMonth,
            start: monthStart * columnWidth,
            width: (index - monthStart) * columnWidth,
          });
        }
        currentMonth = monthKey;
        monthStart = index;
      }
    });

    // Push last month
    if (currentMonth) {
      months.push({
        month: currentMonth,
        start: monthStart * columnWidth,
        width: (days.length - monthStart) * columnWidth,
      });
    }

    return months;
  }, [days, columnWidth]);

  return (
    <TooltipProvider>
      <div className="flex flex-col h-full bg-background">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <div className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-muted-foreground" />
            <h2 className="text-lg font-semibold">Timeline</h2>
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleToday}
              className="text-xs"
            >
              Today
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handlePrevMonth}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleNextMonth}>
              <ChevronRight className="h-4 w-4" />
            </Button>
            <div className="w-px h-4 bg-border mx-2" />
            <Button
              variant="ghost"
              size="sm"
              onClick={cycleZoom}
              className="text-xs gap-1"
            >
              {zoom === 'day' ? <ZoomIn className="h-3 w-3" /> : <ZoomOut className="h-3 w-3" />}
              {zoom.charAt(0).toUpperCase() + zoom.slice(1)}
            </Button>
          </div>
        </div>

        {/* Timeline */}
        <div 
          ref={containerRef}
          className="flex-1 overflow-auto"
        >
          <div style={{ width: totalWidth, minHeight: '100%' }}>
            {/* Month Headers */}
            <div className="sticky top-0 z-10 bg-background border-b h-8 flex">
              {monthHeaders.map((month) => (
                <div
                  key={month.month}
                  className="border-r text-xs font-medium text-muted-foreground flex items-center px-2"
                  style={{ 
                    position: 'absolute',
                    left: month.start,
                    width: month.width,
                  }}
                >
                  {month.month}
                </div>
              ))}
            </div>

            {/* Day Headers */}
            <div className="sticky top-8 z-10 bg-muted/50 border-b h-6 flex">
              {days.map((day, index) => (
                <div
                  key={day.toISOString()}
                  className={cn(
                    "border-r text-[10px] text-center text-muted-foreground shrink-0",
                    format(day, 'E') === 'Sun' && "bg-muted"
                  )}
                  style={{ width: columnWidth }}
                >
                  {zoom === 'day' && format(day, 'd')}
                  {zoom === 'week' && index % 7 === 0 && `W${format(day, 'w')}`}
                  {zoom === 'month' && index % 30 === 0 && format(day, 'MMM')}
                </div>
              ))}
            </div>

            {/* Grid Background */}
            <div className="relative" style={{ minHeight: Math.max(200, groupedItems.length * 36 + 20) }}>
              {/* Grid lines */}
              <div className="absolute inset-0 flex pointer-events-none">
                {days.map((day) => (
                  <div
                    key={day.toISOString()}
                    className={cn(
                      "border-r shrink-0 h-full",
                      format(day, 'E') === 'Sun' && "bg-muted/30"
                    )}
                    style={{ width: columnWidth }}
                  />
                ))}
              </div>

              {/* Today line */}
              {isWithinInterval(new Date(), { start: dateRange.start, end: dateRange.end }) && (
                <div
                  className="absolute top-0 bottom-0 w-0.5 bg-destructive z-20"
                  style={{
                    left: differenceInDays(new Date(), dateRange.start) * columnWidth + columnWidth / 2,
                  }}
                />
              )}

              {/* Items */}
              <div className="relative pt-2">
                {groupedItems.map((row, rowIndex) => (
                  <div 
                    key={rowIndex} 
                    className="relative h-8 mb-1"
                  >
                    {row.map((item) => {
                      const pos = getItemPosition(item);
                      return (
                        <Tooltip key={item.id}>
                          <TooltipTrigger asChild>
                            <motion.div
                              className={cn(
                                "absolute h-6 rounded-md cursor-pointer flex items-center px-2 text-xs text-white font-medium shadow-sm",
                                STATUS_COLORS[item.status || 'default']
                              )}
                              style={{
                                left: pos.left,
                                width: pos.width,
                                top: 0,
                              }}
                              onClick={() => onItemClick?.(item)}
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              whileHover={{ scale: 1.02, zIndex: 10 }}
                              whileTap={{ scale: 0.98 }}
                            >
                              <span className="truncate">{item.title || 'Untitled'}</span>
                            </motion.div>
                          </TooltipTrigger>
                          <TooltipContent>
                            <div className="text-sm">
                              <p className="font-medium">{item.title}</p>
                              <p className="text-muted-foreground text-xs">
                                {format(parseISO(item.startDate), 'MMM d')}
                                {item.endDate && ` - ${format(parseISO(item.endDate), 'MMM d')}`}
                              </p>
                            </div>
                          </TooltipContent>
                        </Tooltip>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}
