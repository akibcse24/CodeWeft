import React, { useState, useEffect } from "react";
import { useIsMutating, useIsFetching } from "@tanstack/react-query";
import { WifiOff, RefreshCw, CheckCircle2 } from "lucide-react";
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

export const SyncStatus = React.memo(function SyncStatus() {
    const isMutating = useIsMutating();
    const isFetching = useIsFetching();
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
                    <div className="flex items-center justify-center p-2 text-destructive">
                        <WifiOff className="h-4 w-4" />
                    </div>
                </TooltipTrigger>
                <TooltipContent>You are offline</TooltipContent>
            </Tooltip>
        );
    }

    const isSyncing = isMutating > 0 || isFetching > 0;

    return (
        <Tooltip>
            <TooltipTrigger asChild>
                <div className={cn(
                    "flex items-center justify-center p-2 transition-all duration-300",
                    isSyncing ? "text-muted-foreground/80" : "text-muted-foreground/30"
                )}>
                    {isSyncing ? (
                        <RefreshCw className="h-4 w-4" />
                    ) : (
                        <CheckCircle2 className="h-4 w-4" />
                    )}
                </div>
            </TooltipTrigger>
            <TooltipContent>{isSyncing ? "Syncing..." : "All changes saved"}</TooltipContent>
        </Tooltip>
    );
});
