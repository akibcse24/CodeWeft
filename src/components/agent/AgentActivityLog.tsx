import { useState, useEffect } from "react";
import { Activity, CheckCircle, XCircle, AlertCircle, Clock } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { eventBus } from "@/services/event-bus.service";
import { Badge } from "@/components/ui/badge";

interface ActivityLogEntry {
    id: string;
    type: string;
    action: string;
    timestamp: number;
    details?: Record<string, unknown>;
}

export function AgentActivityLog() {
    const [logs, setLogs] = useState<ActivityLogEntry[]>([]);
    const [filter, setFilter] = useState<"all" | "actions" | "errors" | "events">("all");

    useEffect(() => {
        const unsubscribe = eventBus.subscribeAll((event) => {
            if (event.type === "agent_action" || event.type === "agent_error") {
                const entry: ActivityLogEntry = {
                    id: event.id,
                    type: event.type.replace("agent_", ""),
                    action: event.data.action || event.data.error || event.type,
                    timestamp: event.timestamp,
                    details: event.data
                };

                setLogs(prev => [entry, ...prev].slice(0, 50));
            }
        });

        return () => unsubscribe();
    }, []);

    const filteredLogs = logs.filter(log => {
        if (filter === "all") return true;
        return filter === log.type;
    });

    const getIcon = (type: string) => {
        switch (type) {
            case "actions":
                return <CheckCircle className="h-4 w-4 text-green-500" />;
            case "errors":
                return <XCircle className="h-4 w-4 text-red-500" />;
            case "events":
                return <Activity className="h-4 w-4 text-blue-500" />;
            default:
                return <AlertCircle className="h-4 w-4 text-yellow-500" />;
        }
    };

    const formatTime = (timestamp: number) => {
        const date = new Date(timestamp);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);

        if (diffMins < 1) return "Just now";
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`;
        return `${Math.floor(diffMins / 1440)}d ago`;
    };

    return (
        <Card className="border-white/10 glass-card h-[600px] flex flex-col">
            <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle className="flex items-center gap-2">
                            <Activity className="h-5 w-5" />
                            Agent Activity Log
                        </CardTitle>
                        <CardDescription>Real-time agent actions and events</CardDescription>
                    </div>
                    <div className="flex gap-1">
                        {(["all", "actions", "errors", "events"] as const).map((f) => (
                            <Badge
                                key={f}
                                variant={filter === f ? "default" : "outline"}
                                className="cursor-pointer capitalize text-xs"
                                onClick={() => setFilter(f)}
                            >
                                {f}
                            </Badge>
                        ))}
                    </div>
                </div>
            </CardHeader>
            <CardContent className="flex-1 p-0">
                <ScrollArea className="h-full">
                    <div className="p-4 space-y-2">
                        {filteredLogs.length === 0 ? (
                            <div className="text-center py-12 text-muted-foreground">
                                <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
                                <p>No activity recorded yet</p>
                                <p className="text-sm">Agent actions will appear here</p>
                            </div>
                        ) : (
                            filteredLogs.map((log) => (
                                <div
                                    key={log.id}
                                    className="flex items-start gap-3 p-3 rounded-lg bg-muted/20 border border-border/50 hover:bg-muted/40 transition-colors"
                                >
                                    <div className="mt-0.5">
                                        {getIcon(log.type)}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="font-medium text-sm truncate">
                                                {log.action}
                                            </span>
                                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                                                <Clock className="h-3 w-3" />
                                                {formatTime(log.timestamp)}
                                            </span>
                                        </div>
                                        {log.details && (
                                            <div className="text-xs text-muted-foreground truncate">
                                                {typeof log.details === "string"
                                                    ? log.details
                                                    : JSON.stringify(log.details)}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </ScrollArea>
            </CardContent>
        </Card>
    );
}
