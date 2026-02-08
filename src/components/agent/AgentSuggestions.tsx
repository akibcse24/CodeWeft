import { useState, useEffect } from "react";
import { Lightbulb, Check, X, TrendingUp, Target } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { memoryService } from "@/services/memory.service";
import { eventBus } from "@/services/event-bus.service";

interface Suggestion {
    id: string;
    type: "productivity" | "learning" | "workflow" | "insight";
    title: string;
    description: string;
    priority: "high" | "medium" | "low";
    action?: () => void;
    dismissed: boolean;
}

export function AgentSuggestions({ userId }: { userId: string }) {
    const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
    const [context, setContext] = useState<string>("");

    useEffect(() => {
        generateSuggestions();
    }, [userId]);

    const generateSuggestions = async () => {
        const newSuggestions: Suggestion[] = [];

        const patterns = await memoryService.getRelevantPatterns("productivity, tasks, habits");
        const stats = eventBus.getEventStats();

        if (stats["task_completed"] > 5) {
            newSuggestions.push({
                id: `sugg_${Date.now()}_1`,
                type: "insight",
                title: "Great Productivity!",
                description: `You've completed ${stats["task_completed"]} tasks today. Keep up the momentum!`,
                priority: "low",
                dismissed: false
            });
        }

        if (stats["task_created"] > 0 && stats["task_completed"] < stats["task_created"]) {
            newSuggestions.push({
                id: `sugg_${Date.now()}_2`,
                type: "productivity",
                title: "Pending Tasks Review",
                description: "You have created tasks that haven't been completed. Consider prioritizing them.",
                priority: "medium",
                dismissed: false
            });
        }

        const recentEvents = eventBus.getRecentEvents(10);
        const hasStudyActivity = recentEvents.some(e =>
            e.type === "page_navigation" &&
            (e.data.path?.includes("courses") || e.data.path?.includes("flashcards"))
        );

        if (hasStudyActivity) {
            newSuggestions.push({
                id: `sugg_${Date.now()}_3`,
                type: "learning",
                title: "Study Session Suggestion",
                description: "Based on your recent activity, you might benefit from a focused study session.",
                priority: "low",
                dismissed: false
            });
        }

        if (patterns.length > 0) {
            newSuggestions.push({
                id: `sugg_${Date.now()}_4`,
                type: "workflow",
                title: "Automate Repetitive Tasks",
                description: "I noticed some repetitive patterns. Would you like me to create a workflow?",
                priority: "medium",
                dismissed: false
            });
        }

        const contextSummary = memoryService.getContextSummary();
        setContext(contextSummary);

        if (newSuggestions.length === 0) {
            newSuggestions.push({
                id: `sugg_${Date.now()}_5`,
                type: "insight",
                title: "All Caught Up!",
                description: "You're doing great. Keep up the good work!",
                priority: "low",
                dismissed: false
            });
        }

        setSuggestions(newSuggestions);
    };

    const handleDismiss = (id: string) => {
        setSuggestions(prev => prev.map(s =>
            s.id === id ? { ...s, dismissed: true } : s
        ));
    };

    const handleApply = (suggestion: Suggestion) => {
        if (suggestion.action) {
            suggestion.action();
        }
        handleDismiss(suggestion.id);
    };

    const getIcon = (type: Suggestion["type"]) => {
        switch (type) {
            case "productivity":
                return <Target className="h-4 w-4" />;
            case "learning":
                return <TrendingUp className="h-4 w-4" />;
            case "workflow":
                return <Lightbulb className="h-4 w-4" />;
            case "insight":
                return <Check className="h-4 w-4" />;
        }
    };

    return (
        <Card className="border-white/10 glass-card h-[600px] flex flex-col">
            <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle className="flex items-center gap-2">
                            <Lightbulb className="h-5 w-5 text-yellow-500" />
                            AI Suggestions
                        </CardTitle>
                        <CardDescription>Personalized recommendations based on your activity</CardDescription>
                    </div>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={generateSuggestions}
                    >
                        Refresh
                    </Button>
                </div>
            </CardHeader>
            <CardContent className="flex-1 p-0">
                <ScrollArea className="h-full">
                    <div className="p-4 space-y-3">
                        {suggestions.filter(s => !s.dismissed).map((suggestion) => (
                            <div
                                key={suggestion.id}
                                className={`p-4 rounded-lg border transition-all hover:shadow-md ${
                                    suggestion.priority === "high"
                                        ? "border-yellow-500/30 bg-yellow-500/5"
                                        : "border-border bg-muted/20"
                                }`}
                            >
                                <div className="flex items-start gap-3">
                                    <div className="mt-0.5 text-primary">
                                        {getIcon(suggestion.type)}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="font-medium text-sm">
                                                {suggestion.title}
                                            </span>
                                            <Badge
                                                variant={
                                                    suggestion.priority === "high"
                                                        ? "destructive"
                                                        : suggestion.priority === "medium"
                                                            ? "default"
                                                            : "outline"
                                                }
                                                className="text-xs capitalize"
                                            >
                                                {suggestion.priority}
                                            </Badge>
                                        </div>
                                        <p className="text-sm text-muted-foreground mb-3">
                                            {suggestion.description}
                                        </p>
                                        <div className="flex gap-2">
                                            {suggestion.action && (
                                                <Button
                                                    variant="default"
                                                    size="sm"
                                                    onClick={() => handleApply(suggestion)}
                                                    className="flex-1"
                                                >
                                                    <Check className="h-4 w-4 mr-1" />
                                                    Apply
                                                </Button>
                                            )}
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => handleDismiss(suggestion.id)}
                                            >
                                                <X className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}

                        {suggestions.filter(s => !s.dismissed).length === 0 && (
                            <div className="text-center py-12 text-muted-foreground">
                                <Lightbulb className="h-12 w-12 mx-auto mb-4 opacity-50" />
                                <p>No suggestions at the moment</p>
                                <p className="text-sm">Check back later for personalized recommendations</p>
                            </div>
                        )}
                    </div>
                </ScrollArea>
            </CardContent>
        </Card>
    );
}
