import { useState } from 'react';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import { format, subDays, addDays } from 'date-fns';

interface DailyNotesProps {
    onSelectDate: (date: Date) => void;
    currentDate?: Date;
}

export function DailyNotes({ onSelectDate, currentDate = new Date() }: DailyNotesProps) {
    const [date, setDate] = useState<Date>(currentDate);

    const handleDateSelect = (newDate: Date | undefined) => {
        if (newDate) {
            setDate(newDate);
            onSelectDate(newDate);
        }
    };

    const goToPrevDay = () => {
        const prev = subDays(date, 1);
        setDate(prev);
        onSelectDate(prev);
    };

    const goToNextDay = () => {
        const next = addDays(date, 1);
        setDate(next);
        onSelectDate(next);
    };

    const goToToday = () => {
        const today = new Date();
        setDate(today);
        onSelectDate(today);
    };

    const isToday = format(date, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd');

    return (
        <div className="flex items-center gap-2">
            <Button
                variant="outline"
                size="icon"
                onClick={goToPrevDay}
                title="Previous day"
            >
                <ChevronLeft className="h-4 w-4" />
            </Button>

            <Popover>
                <PopoverTrigger asChild>
                    <Button variant="outline" className="min-w-[200px] justify-start">
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {format(date, 'EEEE, MMM d, yyyy')}
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                        mode="single"
                        selected={date}
                        onSelect={handleDateSelect}
                        initialFocus
                    />
                </PopoverContent>
            </Popover>

            <Button
                variant="outline"
                size="icon"
                onClick={goToNextDay}
                title="Next day"
            >
                <ChevronRight className="h-4 w-4" />
            </Button>

            {!isToday && (
                <Button variant="ghost" onClick={goToToday}>
                    Today
                </Button>
            )}
        </div>
    );
}

/**
 * Generate daily note title from date
 */
// eslint-disable-next-line react-refresh/only-export-components
export function getDailyNoteTitle(date: Date): string {
    return format(date, 'yyyy-MM-dd');
}

/**
 * Get daily note template blocks
 */
// eslint-disable-next-line react-refresh/only-export-components
export function getDailyNoteTemplate(date: Date) {
    return [
        {
            id: '1',
            type: 'heading1' as const,
            content: format(date, 'EEEE, MMMM d, yyyy'),
        },
        {
            id: '2',
            type: 'heading2' as const,
            content: '🎯 Goals for Today',
        },
        {
            id: '3',
            type: 'todo' as const,
            content: '',
            checked: false,
        },
        {
            id: '4',
            type: 'heading2' as const,
            content: '📝 Notes',
        },
        {
            id: '5',
            type: 'paragraph' as const,
            content: '',
        },
        {
            id: '6',
            type: 'heading2' as const,
            content: '💭 Reflection',
        },
        {
            id: '7',
            type: 'quote' as const,
            content: 'What went well today?',
        },
        {
            id: '8',
            type: 'paragraph' as const,
            content: '',
        },
    ];
}
