import React, { useState, useEffect } from "react";
import { WifiOff, RefreshCw, CheckCircle2, AlertCircle } from "lucide-react";
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { useSync } from "@/hooks/useSync";

export const SyncStatus = React.memo(function SyncStatus() {
    const { syncStatus, pendingCount, isSyncing, syncAll } = useSync();
    const [isOnline, setIsOnline] = useState(navigator.onLine);

    useEffect(() => {
        const handleOnline = () => setIsOnline(true);
        const handleOffline = () => setIsOnline(false);
        window.addEventListener("online", handleOnline);
        window.addEventListener("offline", handleOffline);
        return () => {
            window.removeEventListener("online", handleOnline);
            window.removeEventListener("offline", handleOffline);
        };
    }, []);

    if (!isOnline) {
        return (
            <Tooltip>
                <TooltipTrigger asChild>
                    <div className="flex items-center justify-center p-2 text-destructive cursor-help">
                        <WifiOff className="h-4 w-4" />
                    </div>
                </TooltipTrigger>
                <TooltipContent>You are offline. Changes saved locally.</TooltipContent>
            </Tooltip>
        );
    }

    const getStatusIcon = () => {
        switch (syncStatus) {
            case 'syncing':
                return <RefreshCw className="h-4 w-4 animate-spin text-primary" />;
            case 'error':
                return <AlertCircle className="h-4 w-4 text-destructive" />;
            case 'success':
                return <CheckCircle2 className="h-4 w-4 text-emerald-500" />;
            default:
                return pendingCount > 0
                    ? <RefreshCw className="h-4 w-4 text-muted-foreground/60" />
                    : <CheckCircle2 className="h-4 w-4 text-muted-foreground/30" />;
        }
    };

    const getStatusText = () => {
        if (syncStatus === 'syncing') return `Syncing ${pendingCount} changes...`;
        if (syncStatus === 'error') return "Sync error. Click to retry.";
        if (pendingCount > 0) return `${pendingCount} changes pending sync`;
        return "All changes synced to cloud";
    };

    return (
        <Tooltip>
            <TooltipTrigger asChild>
                <button
                    onClick={() => syncAll()}
                    disabled={isSyncing}
                    className={cn(
                        "flex items-center justify-center p-2 transition-all duration-300 rounded-lg hover:bg-sidebar-accent/50",
                        isSyncing && "cursor-wait"
                    )}>
                    {getStatusIcon()}
                </button>
            </TooltipTrigger>
            <TooltipContent>{getStatusText()}</TooltipContent>
        </Tooltip>
    );
});
