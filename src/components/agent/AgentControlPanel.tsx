import { useState, useEffect } from "react";
import { Play, Pause, RefreshCw, Power, Settings, AlertTriangle, CheckCircle2, Brain, Terminal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { enhancedAgentService } from "@/services/agents/enhanced-agent.service";
import { orchestratorService } from "@/services/agents/orchestrator.service";
import { safetyService } from "@/services/agents/safety.service";

interface AgentControlPanelProps {
    userId: string;
}

export function AgentControlPanel({ userId }: AgentControlPanelProps) {
    const [isRunning, setIsRunning] = useState(false);
    const [agentsCount, setAgentsCount] = useState(0);
    const [activeTasks, setActiveTasks] = useState(0);
    const [autoMode, setAutoMode] = useState(true);
    const [orchestrator, setOrchestrator] = useState<ReturnType<typeof orchestratorService> | null>(null);

    useEffect(() => {
        const initOrchestrator = async () => {
            const orc = orchestratorService(userId);
            await orc.initialize();
            setOrchestrator(orc);
            setAgentsCount(orc.getAllAgents().length);
        };

        initOrchestrator();
    }, [userId]);

    const toggleAgentSystem = async () => {
        if (isRunning) {
            setIsRunning(false);
            if (orchestrator) {
                await orchestrator.shutdown();
            }
        } else {
            setIsRunning(true);
            setActiveTasks(orchestrator?.getActiveTasks().length || 0);
        }
    };

    const processQueue = async () => {
        if (orchestrator) {
            await orchestrator.processQueue();
            setActiveTasks(orchestrator.getActiveTasks().length);
        }
    };

    return (
        <Card className="border-white/10 glass-ai overflow-hidden shadow-2xl relative group">
            <div className="absolute inset-0 mesh-gradient-ai opacity-10 pointer-events-none group-hover:opacity-20 transition-opacity duration-700" />

            <CardHeader className="relative z-10 border-b border-white/5 bg-white/5 pb-6">
                <CardTitle className="flex items-center justify-between">
                    <span className="flex items-center gap-3 text-white tracking-tight">
                        <div className="p-2 bg-primary/20 rounded-xl relative">
                            <Power className={cn("h-5 w-5", isRunning ? "text-primary animate-pulse" : "text-white/40")} />
                        </div>
                        Agent Control Engine
                    </span>
                    <div className="flex items-center gap-2">
                        <div className={cn(
                            "h-2 w-2 rounded-full",
                            isRunning ? "bg-green-500 animate-ping" : "bg-white/20"
                        )} />
                        <span className={cn(
                            "text-[10px] uppercase font-bold tracking-[0.1em] px-2.5 py-1 rounded-full border",
                            isRunning
                                ? "bg-green-500/10 border-green-500/30 text-green-400"
                                : "bg-white/5 border-white/10 text-white/40"
                        )}>
                            {isRunning ? "Operational" : "Standby"}
                        </span>
                    </div>
                </CardTitle>
                <CardDescription className="text-white/50 text-[11px] font-medium tracking-wide mt-1">
                    Manage neural processing units and automated workflows
                </CardDescription>
            </CardHeader>

            <CardContent className="space-y-8 p-6 relative z-10">
                <div className="grid grid-cols-3 gap-5">
                    {[
                        { label: "Active Nodes", value: agentsCount, icon: Brain, color: "text-primary" },
                        { label: "Neural Queue", value: activeTasks, icon: Terminal, color: "text-amber-400" },
                        { label: "Daily Cycles", value: safetyService.getSafetyStats().totalActions, icon: RefreshCw, color: "text-green-400" }
                    ].map((stat, i) => (
                        <div key={i} className="text-center p-4 rounded-2xl bg-white/5 border border-white/5 hover:border-white/10 transition-colors shadow-inner">
                            <div className={cn("text-2xl font-black mb-1", stat.color)}>{stat.value}</div>
                            <div className="text-[9px] uppercase font-bold tracking-widest text-white/40 flex items-center justify-center gap-1.5">
                                <stat.icon className="h-2.5 w-2.5" />
                                {stat.label}
                            </div>
                        </div>
                    ))}
                </div>

                <div className="space-y-3">
                    <div className="flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/8 transition-all">
                        <div className="flex items-center gap-4">
                            <div className={cn(
                                "p-2 rounded-lg transition-colors",
                                isRunning && autoMode ? "bg-green-500/20 text-green-400" : "bg-white/5 text-white/20"
                            )}>
                                <CheckCircle2 className="h-5 w-5" />
                            </div>
                            <div>
                                <div className="text-sm font-bold text-white tracking-tight">Autonomous Mode</div>
                                <div className="text-[10px] text-white/40 font-medium">Auto-process incoming data streams</div>
                            </div>
                        </div>
                        <Switch
                            checked={autoMode}
                            onCheckedChange={setAutoMode}
                            disabled={!isRunning}
                            className="data-[state=checked]:bg-primary"
                        />
                    </div>
                </div>

                <div className="flex gap-3">
                    <Button
                        onClick={toggleAgentSystem}
                        variant={isRunning ? "destructive" : "default"}
                        className={cn(
                            "flex-1 h-12 rounded-[1rem] font-bold text-xs uppercase tracking-wider transition-all duration-300",
                            !isRunning && "bg-primary hover:bg-primary/80 shadow-[0_0_20px_rgba(59,130,246,0.5)]"
                        )}
                    >
                        {isRunning ? (
                            <>
                                <Pause className="h-4 w-4 mr-2 fill-current" />
                                Deactivate
                            </>
                        ) : (
                            <>
                                <Play className="h-4 w-4 mr-2 fill-current" />
                                Activate System
                            </>
                        )}
                    </Button>
                    <Button
                        onClick={processQueue}
                        disabled={!isRunning}
                        variant="secondary"
                        className="h-12 rounded-[1rem] bg-white/5 font-bold text-xs uppercase tracking-wider border border-white/10 hover:bg-white/10 text-white disabled:opacity-30"
                    >
                        <RefreshCw className={cn("h-4 w-4 mr-2", isRunning && activeTasks > 0 && "animate-spin")} />
                        Flush Queue
                    </Button>
                    <Button
                        variant="secondary"
                        size="icon"
                        className="h-12 w-12 rounded-[1rem] bg-white/5 border border-white/10 hover:bg-white/10 text-white"
                    >
                        <Settings className="h-5 w-5" />
                    </Button>
                </div>

                <div className="text-[10px] font-medium text-white/30 text-center animate-fade-in flex items-center justify-center gap-2">
                    {isRunning ? (
                        <>
                            <div className="h-1 w-1 rounded-full bg-green-500 animate-pulse" />
                            System active: Monitoring core events and user actions
                        </>
                    ) : (
                        <>
                            <div className="h-1 w-1 rounded-full bg-white/20" />
                            System offline: Automation and monitoring paused
                        </>
                    )}
                </div>
            </CardContent>

            {/* Visual scanline effect */}
            <div className="absolute inset-0 pointer-events-none ai-data-stream opacity-[0.03]" />
        </Card>
    );
}
