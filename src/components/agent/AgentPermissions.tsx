import { useState, useEffect } from "react";
import { Shield, AlertTriangle, Check, Settings, RefreshCw } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { safetyService, PermissionRule } from "@/services/agents/safety.service";

export function AgentPermissions() {
    const [permissions, setPermissions] = useState<PermissionRule[]>([]);
    const [blockedActions, setBlockedActions] = useState<Set<string>>(new Set());
    const [stats, setStats] = useState<ReturnType<typeof safetyService.getSafetyStats> | null>(null);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = () => {
        setPermissions(safetyService.getAllPermissionRules());
        setBlockedActions(new Set(["delete_note", "delete_task", "delete_project"]));
        setStats(safetyService.getSafetyStats());
    };

    const handleToggleConfirmation = (actionType: string, current: boolean) => {
        safetyService.updatePermissionRule(actionType, {
            requiresConfirmation: !current
        });
        loadData();
    };

    const handleBlockAction = (actionType: string) => {
        safetyService.blockAction(actionType);
        loadData();
    };

    const handleUnblockAction = (actionType: string) => {
        safetyService.unblockAction(actionType);
        loadData();
    };

    const handleResetToDefaults = () => {
        safetyService.resetToDefaults();
        loadData();
    };

    const getDangerLevel = (actionType: string): "dangerous" | "moderate" | "safe" => {
        const dangerous = ["delete", "remove", "clear", "reset"];
        const moderate = ["update", "edit", "modify"];

        if (dangerous.some(d => actionType.includes(d))) return "dangerous";
        if (moderate.some(m => actionType.includes(m))) return "moderate";
        return "safe";
    };

    return (
        <Card className="border-white/10 glass-card h-[600px] flex flex-col">
            <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle className="flex items-center gap-2">
                            <Shield className="h-5 w-5" />
                            Agent Permissions
                        </CardTitle>
                        <CardDescription>Control what agents can do</CardDescription>
                    </div>
                    <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={loadData}>
                            <RefreshCw className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="sm" onClick={handleResetToDefaults}>
                            <Settings className="h-4 w-4 mr-2" />
                            Reset
                        </Button>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="flex-1 p-0">
                <div className="p-4 border-b border-border">
                    <div className="grid grid-cols-4 gap-4 text-center">
                        <div>
                            <div className="text-2xl font-bold text-primary">{stats?.totalActions || 0}</div>
                            <div className="text-xs text-muted-foreground">Total Actions</div>
                        </div>
                        <div>
                            <div className="text-2xl font-bold text-green-500">{stats?.successfulActions || 0}</div>
                            <div className="text-xs text-muted-foreground">Successful</div>
                        </div>
                        <div>
                            <div className="text-2xl font-bold text-red-500">{stats?.failedActions || 0}</div>
                            <div className="text-xs text-muted-foreground">Failed</div>
                        </div>
                        <div>
                            <div className="text-2xl font-bold text-yellow-500">{stats?.blockedActions || 0}</div>
                            <div className="text-xs text-muted-foreground">Blocked</div>
                        </div>
                    </div>
                </div>

                <ScrollArea className="flex-1">
                    <div className="p-4 space-y-2">
                        {permissions.map((permission) => {
                            const dangerLevel = getDangerLevel(permission.actionType);
                            const isBlocked = blockedActions.has(permission.actionType);

                            return (
                                <div
                                    key={permission.id}
                                    className={`flex items-center justify-between p-4 rounded-lg border transition-all ${
                                        isBlocked
                                            ? "border-red-500/30 bg-red-500/10"
                                            : "border-border bg-muted/20"
                                    }`}
                                >
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="font-medium capitalize">
                                                {permission.actionType.replace(/_/g, " ")}
                                            </span>
                                            {dangerLevel === "dangerous" && (
                                                <Badge variant="destructive" className="text-xs">
                                                    <AlertTriangle className="h-3 w-3 mr-1" />
                                                    Dangerous
                                                </Badge>
                                            )}
                                            {dangerLevel === "moderate" && (
                                                <Badge variant="outline" className="text-xs">
                                                    Moderate
                                                </Badge>
                                            )}
                                        </div>
                                        <div className="text-xs text-muted-foreground">
                                            Requires confirmation: {permission.requiresConfirmation ? "Yes" : "No"}
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        {!isBlocked && (
                                            <Switch
                                                checked={permission.requiresConfirmation}
                                                onCheckedChange={() =>
                                                    handleToggleConfirmation(
                                                        permission.actionType,
                                                        permission.requiresConfirmation
                                                    )
                                                }
                                            />
                                        )}

                                        {isBlocked ? (
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => handleUnblockAction(permission.actionType)}
                                            >
                                                <Check className="h-4 w-4 mr-1" />
                                                Unblock
                                            </Button>
                                        ) : (
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => handleBlockAction(permission.actionType)}
                                            >
                                                Block
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </ScrollArea>
            </CardContent>
        </Card>
    );
}
