import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ChevronLeft, ChevronRight, Plus, Calendar as CalendarIcon 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  format,
  isSameMonth,
  isSameDay,
  isToday,
  addMonths,
  subMonths,
  parseISO,
} from 'date-fns';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Input } from '@/components/ui/input';

interface CalendarItem {
  id: string;
  title: string;
  date: string; // ISO date string
  color?: string;
  status?: string;
}

interface CalendarViewProps {
  items: CalendarItem[];
  onItemClick?: (item: CalendarItem) => void;
  onItemMove?: (itemId: string, newDate: Date) => void;
  onAddItem?: (date: Date, title: string) => void;
  dateProperty?: string;
}

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const STATUS_COLORS: Record<string, string> = {
  'todo': 'bg-yellow-500/20 border-yellow-500/50 text-yellow-700 dark:text-yellow-300',
  'in-progress': 'bg-blue-500/20 border-blue-500/50 text-blue-700 dark:text-blue-300',
  'done': 'bg-green-500/20 border-green-500/50 text-green-700 dark:text-green-300',
  'default': 'bg-primary/10 border-primary/30 text-primary',
};

export function CalendarView({ 
  items, 
  onItemClick, 
  onItemMove, 
  onAddItem 
}: CalendarViewProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [draggedItem, setDraggedItem] = useState<CalendarItem | null>(null);
  const [quickAddDate, setQuickAddDate] = useState<Date | null>(null);
  const [quickAddTitle, setQuickAddTitle] = useState('');

  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    const calendarStart = startOfWeek(monthStart);
    const calendarEnd = endOfWeek(monthEnd);

    return eachDayOfInterval({ start: calendarStart, end: calendarEnd });
  }, [currentDate]);

  const itemsByDate = useMemo(() => {
    const map = new Map<string, CalendarItem[]>();
    items.forEach(item => {
      if (!item.date) return;
      const dateKey = format(parseISO(item.date), 'yyyy-MM-dd');
      const existing = map.get(dateKey) || [];
      map.set(dateKey, [...existing, item]);
    });
    return map;
  }, [items]);

  const handlePrevMonth = () => setCurrentDate(subMonths(currentDate, 1));
  const handleNextMonth = () => setCurrentDate(addMonths(currentDate, 1));
  const handleToday = () => setCurrentDate(new Date());

  const handleDragStart = (item: CalendarItem) => {
    setDraggedItem(item);
  };

  const handleDragEnd = () => {
    setDraggedItem(null);
  };

  const handleDrop = (date: Date) => {
    if (draggedItem && onItemMove) {
      onItemMove(draggedItem.id, date);
    }
    setDraggedItem(null);
  };

  const handleQuickAdd = () => {
    if (quickAddDate && quickAddTitle.trim() && onAddItem) {
      onAddItem(quickAddDate, quickAddTitle.trim());
      setQuickAddTitle('');
      setQuickAddDate(null);
    }
  };

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b">
        <div className="flex items-center gap-2">
          <CalendarIcon className="h-5 w-5 text-muted-foreground" />
          <h2 className="text-lg font-semibold">
            {format(currentDate, 'MMMM yyyy')}
          </h2>
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
        </div>
      </div>

      {/* Weekday Headers */}
      <div className="grid grid-cols-7 border-b">
        {WEEKDAYS.map(day => (
          <div
            key={day}
            className="py-2 text-center text-xs font-medium text-muted-foreground"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="flex-1 grid grid-cols-7 auto-rows-fr overflow-hidden">
        {calendarDays.map((day, index) => {
          const dateKey = format(day, 'yyyy-MM-dd');
          const dayItems = itemsByDate.get(dateKey) || [];
          const isCurrentMonth = isSameMonth(day, currentDate);
          const isDayToday = isToday(day);

          return (
            <motion.div
              key={dateKey}
              className={cn(
                "border-b border-r p-1 min-h-[100px] transition-colors",
                !isCurrentMonth && "bg-muted/30",
                draggedItem && "hover:bg-accent/50"
              )}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => handleDrop(day)}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: index * 0.01 }}
            >
              {/* Day Number */}
              <div className="flex items-center justify-between mb-1">
                <span
                  className={cn(
                    "text-xs font-medium h-6 w-6 flex items-center justify-center rounded-full",
                    isDayToday && "bg-primary text-primary-foreground",
                    !isCurrentMonth && "text-muted-foreground"
                  )}
                >
                  {format(day, 'd')}
                </span>
                <Popover 
                  open={quickAddDate ? isSameDay(quickAddDate, day) : false}
                  onOpenChange={(open) => !open && setQuickAddDate(null)}
                >
                  <PopoverTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-5 w-5 opacity-0 group-hover:opacity-100 hover:opacity-100"
                      onClick={() => setQuickAddDate(day)}
                    >
                      <Plus className="h-3 w-3" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-64 p-2" align="start">
                    <div className="flex flex-col gap-2">
                      <Input
                        placeholder="New item title..."
                        value={quickAddTitle}
                        onChange={(e) => setQuickAddTitle(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleQuickAdd()}
                        autoFocus
                      />
                      <Button size="sm" onClick={handleQuickAdd}>
                        Add
                      </Button>
                    </div>
                  </PopoverContent>
                </Popover>
              </div>

              {/* Items */}
              <div className="space-y-0.5 overflow-y-auto max-h-[80px]">
                <AnimatePresence>
                  {dayItems.slice(0, 3).map((item) => (
                    <motion.div
                      key={item.id}
                      className={cn(
                        "text-xs px-1.5 py-0.5 rounded cursor-pointer truncate border",
                        STATUS_COLORS[item.status || 'default']
                      )}
                      draggable
                      onDragStart={() => handleDragStart(item)}
                      onDragEnd={handleDragEnd}
                      onClick={() => onItemClick?.(item)}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      {item.title || 'Untitled'}
                    </motion.div>
                  ))}
                </AnimatePresence>
                {dayItems.length > 3 && (
                  <div className="text-xs text-muted-foreground pl-1">
                    +{dayItems.length - 3} more
                  </div>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
