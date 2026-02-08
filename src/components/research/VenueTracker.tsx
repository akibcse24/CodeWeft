import { useState, useMemo } from "react";
import { Calendar, ExternalLink, MapPin, Tag, Flag, Clock, AlertCircle } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format, differenceInDays, isAfter } from "date-fns";

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

export default function VenueTracker() {
    const sortedVenues = useMemo(() => {
        return [...VENUES].sort((a, b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime());
    }, []);

    return (
        <Card className="glass-card border-white/10 shadow-xl">
            <CardHeader className="bg-muted/30 pb-4">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-amber-500/10 rounded-lg text-amber-500">
                        <Flag className="h-5 w-5" />
                    </div>
                    <div>
                        <CardTitle className="text-lg">Publishing Roadmap</CardTitle>
                        <CardDescription className="text-xs">Upcoming conference and journal deadlines</CardDescription>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="p-4 pt-6 space-y-4">
                {sortedVenues.map((venue) => {
                    const deadline = new Date(venue.deadline);
                    const now = new Date();
                    const daysRemaining = differenceInDays(deadline, now);
                    const isOver = !isAfter(deadline, now);

                    return (
                        <div key={venue.id} className="group relative p-4 rounded-2xl bg-muted/20 border border-white/5 overflow-hidden transition-all hover:border-amber-500/30">
                            <div className="flex flex-col gap-3">
                                <div className="flex items-start justify-between">
                                    <div>
                                        <Badge variant="outline" className="text-[10px] bg-amber-500/5 text-amber-500 border-amber-500/20 mb-1">
                                            {venue.abbreviation}
                                        </Badge>
                                        <h4 className="text-sm font-bold tracking-tight">{venue.name}</h4>
                                    </div>
                                    <a
                                        href={venue.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="p-2 rounded-full hover:bg-amber-500/10 text-muted-foreground hover:text-amber-500 transition-colors"
                                    >
                                        <ExternalLink className="h-4 w-4" />
                                    </a>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="flex items-start gap-2">
                                        <Clock className="mt-0.5 h-3.5 w-3.5 text-muted-foreground" />
                                        <div>
                                            <p className="text-[9px] uppercase tracking-widest font-bold opacity-40">Deadline</p>
                                            <p className={cn(
                                                "text-xs font-semibold",
                                                isOver ? "text-red-500" : "text-amber-500"
                                            )}>
                                                {format(deadline, "MMM dd, yyyy")}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-2">
                                        <Calendar className="mt-0.5 h-3.5 w-3.5 text-muted-foreground" />
                                        <div>
                                            <p className="text-[9px] uppercase tracking-widest font-bold opacity-40">Event</p>
                                            <p className="text-xs font-semibold">{format(new Date(venue.conference_date), "MMM yyyy")}</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center justify-between mt-1">
                                    <div className="flex gap-1">
                                        {venue.tags.map(tag => (
                                            <span key={tag} className="text-[9px] px-2 py-0.5 rounded-full bg-white/5 border border-white/5 text-muted-foreground">
                                                {tag}
                                            </span>
                                        ))}
                                    </div>
                                    {!isOver && (
                                        <p className="text-[10px] font-bold text-emerald-500/80 flex items-center gap-1">
                                            <AlertCircle className="h-3 w-3" /> {daysRemaining} days left
                                        </p>
                                    )}
                                </div>
                            </div>

                            {/* Progress indicator */}
                            <div className="absolute left-0 top-0 bottom-0 w-1 bg-amber-500/20" />
                        </div>
                    );
                })}
            </CardContent>
        </Card>
    );
}

const cn = (...classes: unknown[]) => classes.filter(Boolean).join(" ");
