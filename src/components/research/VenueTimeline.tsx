import { useMemo } from "react";
import { motion } from "framer-motion";
import { format, differenceInDays, addMonths, startOfMonth, endOfMonth, isWithinInterval, startOfDay } from "date-fns";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock } from "lucide-react";

interface Venue {
    id: string;
    name: string;
    abbreviation: string;
    deadline: string;
    conference_date: string;
    url: string;
    tags: string[];
}

const VENUES: Venue[] = [
    {
        id: "1",
        name: "Neural Information Processing Systems",
        abbreviation: "NeurIPS 2024",
        deadline: "2024-05-22T00:00:00Z",
        conference_date: "2024-12-08T00:00:00Z",
        url: "https://neurips.cc/",
        tags: ["AI", "Machine Learning"]
    },
    {
        id: "2",
        name: "International Conference on Computer Vision",
        abbreviation: "ICCV 2025",
        deadline: "2025-03-01T00:00:00Z",
        conference_date: "2025-10-15T00:00:00Z",
        url: "https://iccv2025.thecvf.com/",
        tags: ["Computer Vision"]
    }
];

export default function VenueTimeline() {
    const now = startOfDay(new Date());

    // Calculate a 12-month window starting from 3 months ago to 9 months ahead
    const timelineMonths = useMemo(() => {
        const start = addMonths(startOfMonth(now), -2);
        return Array.from({ length: 12 }).map((_, i) => addMonths(start, i));
    }, [now]);

    const timelineStart = timelineMonths[0];
    const timelineEnd = endOfMonth(timelineMonths[timelineMonths.length - 1]);
    const totalDays = differenceInDays(timelineEnd, timelineStart);

    const getPosition = (date: string) => {
        const dayDiff = differenceInDays(new Date(date), timelineStart);
        return (dayDiff / totalDays) * 100;
    };

    return (
        <Card className="glass-card border-white/10 shadow-2xl overflow-hidden mb-8">
            <CardContent className="p-0">
                <div className="bg-muted/30 px-6 py-3 border-b border-white/5 flex items-center justify-between">
                    <h3 className="text-sm font-bold uppercase tracking-widest text-primary/80 flex items-center gap-2">
                        <Clock className="h-4 w-4" /> Global Submission Timeline
                    </h3>
                    <div className="flex gap-4">
                        <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-amber-500" /> Deadline</div>
                        <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-emerald-500" /> Conference</div>
                    </div>
                </div>

                <div className="relative h-48 w-full p-8 overflow-x-auto custom-scrollbar">
                    <div className="relative h-full min-w-[1000px]">
                        {/* Timeline Base Line */}
                        <div className="absolute top-1/2 left-0 w-full h-px bg-white/10" />

                        {/* Month Markers */}
                        {timelineMonths.map((month, idx) => (
                            <div
                                key={idx}
                                className="absolute top-0 bottom-0 border-l border-white/5"
                                style={{ left: `${getPosition(month.toISOString())}%` }}
                            >
                                <span className="absolute -top-1 left-2 text-[9px] font-bold uppercase tracking-tighter opacity-30">
                                    {format(month, "MMM yyyy")}
                                </span>
                            </div>
                        ))}

                        {/* Venues */}
                        {VENUES.map((venue) => {
                            const deadlinePos = getPosition(venue.deadline);
                            const eventPos = getPosition(venue.conference_date);
                            const isVisible = (deadlinePos >= 0 && deadlinePos <= 100) || (eventPos >= 0 && eventPos <= 100);

                            if (!isVisible) return null;

                            return (
                                <div key={venue.id}>
                                    {/* Deadline Pin */}
                                    {deadlinePos >= 0 && deadlinePos <= 100 && (
                                        <motion.div
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            className="absolute group flex flex-col items-center"
                                            style={{ left: `${deadlinePos}%`, top: '10%' }}
                                        >
                                            <div className="w-3 h-3 bg-amber-500 rounded-full border-2 border-background shadow-lg group-hover:scale-125 transition-transform" />
                                            <div className="mt-2 text-center opacity-0 group-hover:opacity-100 transition-opacity bg-background/90 backdrop-blur-md p-2 rounded-lg border border-white/10 shadow-2xl min-w-[120px] pointer-events-none">
                                                <p className="text-[10px] font-bold text-amber-500">{venue.abbreviation}</p>
                                                <p className="text-[9px] text-muted-foreground">Deadline: {format(new Date(venue.deadline), "MMM dd")}</p>
                                            </div>
                                        </motion.div>
                                    )}

                                    {/* Event Pin */}
                                    {eventPos >= 0 && eventPos <= 100 && (
                                        <motion.div
                                            initial={{ opacity: 0, y: -10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            className="absolute group flex flex-col items-center"
                                            style={{ left: `${eventPos}%`, bottom: '15%' }}
                                        >
                                            <div className="mt-auto mb-2 text-center opacity-0 group-hover:opacity-100 transition-opacity bg-background/90 backdrop-blur-md p-2 rounded-lg border border-white/10 shadow-2xl min-w-[120px] pointer-events-none">
                                                <p className="text-[10px] font-bold text-emerald-500">{venue.abbreviation}</p>
                                                <p className="text-[9px] text-muted-foreground">Event: {format(new Date(venue.conference_date), "MMM yyyy")}</p>
                                            </div>
                                            <div className="w-3 h-3 bg-emerald-500 rounded-full border-2 border-background shadow-lg group-hover:scale-125 transition-transform" />
                                        </motion.div>
                                    )}

                                    {/* Connecting Line if both visible */}
                                    {deadlinePos >= 0 && deadlinePos <= 100 && eventPos >= 0 && eventPos <= 100 && (
                                        <div
                                            className="absolute h-px bg-gradient-to-r from-amber-500/30 to-emerald-500/30"
                                            style={{
                                                left: `${deadlinePos}%`,
                                                width: `${eventPos - deadlinePos}%`,
                                                top: '50%',
                                                opacity: 0.2
                                            }}
                                        />
                                    )}
                                </div>
                            );
                        })}

                        {/* Today Indicator */}
                        <div
                            className="absolute top-0 bottom-0 w-0.5 bg-primary/40 z-10 flex flex-col items-center"
                            style={{ left: `${getPosition(now.toISOString())}%` }}
                        >
                            <Badge className="absolute -bottom-2 text-[8px] h-4 leading-none bg-primary/20 text-primary border-primary/30">TODAY</Badge>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
