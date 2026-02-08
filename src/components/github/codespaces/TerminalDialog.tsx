/**
 * TerminalDialog Component
 * 
 * Full-screen dialog wrapper for the CodespaceTerminal
 */

import { useState, useCallback } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
    Maximize2, 
    Minimize2, 
    X, 
    RefreshCw, 
    Terminal,
    GitBranch,
    Copy,
    Check,
} from 'lucide-react';
import { CodespaceTerminal, ConnectionStatus } from './CodespaceTerminal';
import type { GitHubCodespace } from '@/services/github/codespaces.service';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface TerminalDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    codespace: GitHubCodespace | null;
    githubToken: string;
}

export function TerminalDialog({ 
    open, 
    onOpenChange, 
    codespace,
    githubToken,
}: TerminalDialogProps) {
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [status, setStatus] = useState<ConnectionStatus>('disconnected');
    const [copied, setCopied] = useState(false);
    const [key, setKey] = useState(0); // For forcing reconnection

    const handleStatusChange = useCallback((newStatus: ConnectionStatus) => {
        setStatus(newStatus);
    }, []);

    const handleError = useCallback((error: string) => {
        toast.error('Terminal Error', { description: error });
    }, []);

    const handleReconnect = () => {
        setKey(prev => prev + 1); // Force component remount
        toast.info('Reconnecting...');
    };

    const handleCopySSHCommand = async () => {
        if (!codespace) return;
        
        const command = `gh codespace ssh --codespace ${codespace.name}`;
        await navigator.clipboard.writeText(command);
        setCopied(true);
        toast.success('SSH command copied!', { description: 'Paste this in your local terminal' });
        setTimeout(() => setCopied(false), 2000);
    };

    const getStatusBadge = () => {
        switch (status) {
            case 'connected':
                return <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/30">Connected</Badge>;
            case 'connecting':
                return <Badge variant="outline" className="bg-yellow-500/10 text-yellow-500 border-yellow-500/30">Connecting...</Badge>;
            case 'error':
                return <Badge variant="outline" className="bg-red-500/10 text-red-500 border-red-500/30">Error</Badge>;
            default:
                return <Badge variant="outline" className="bg-muted text-muted-foreground">Disconnected</Badge>;
        }
    };

    if (!codespace) return null;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent 
                className={cn(
                    "flex flex-col gap-0 p-0 bg-[#0a0a0a] border-zinc-800",
                    isFullscreen 
                        ? "max-w-none w-screen h-screen rounded-none" 
                        : "max-w-4xl h-[80vh]"
                )}
            >
                {/* Header */}
                <DialogHeader className="flex-shrink-0 p-4 border-b border-zinc-800 bg-zinc-900/50">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <Terminal className="h-5 w-5 text-purple-400" />
                            <div>
                                <DialogTitle className="text-white text-base font-medium">
                                    {codespace.repository.full_name}
                                </DialogTitle>
                                <div className="flex items-center gap-2 text-xs text-zinc-400">
                                    <GitBranch className="h-3 w-3" />
                                    {codespace.git_status.ref}
                                </div>
                            </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                            {getStatusBadge()}
                            
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-zinc-400 hover:text-white hover:bg-zinc-800"
                                onClick={handleCopySSHCommand}
                                title="Copy SSH command for local terminal"
                            >
                                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                            </Button>
                            
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-zinc-400 hover:text-white hover:bg-zinc-800"
                                onClick={handleReconnect}
                                disabled={status === 'connecting'}
                                title="Reconnect"
                            >
                                <RefreshCw className={cn("h-4 w-4", status === 'connecting' && "animate-spin")} />
                            </Button>
                            
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-zinc-400 hover:text-white hover:bg-zinc-800"
                                onClick={() => setIsFullscreen(!isFullscreen)}
                                title={isFullscreen ? "Exit fullscreen" : "Fullscreen"}
                            >
                                {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
                            </Button>
                            
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-zinc-400 hover:text-white hover:bg-zinc-800"
                                onClick={() => onOpenChange(false)}
                                title="Close"
                            >
                                <X className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                </DialogHeader>

                {/* Terminal */}
                <div className="flex-1 overflow-hidden">
                    <CodespaceTerminal
                        key={key}
                        codespaceName={codespace.name}
                        githubToken={githubToken}
                        webUrl={codespace.web_url}
                        onStatusChange={handleStatusChange}
                        onError={handleError}
                    />
                </div>

                {/* Status Bar */}
                <div className="flex-shrink-0 px-4 py-2 border-t border-zinc-800 bg-zinc-900/50 flex items-center justify-between text-xs text-zinc-500">
                    <div className="flex items-center gap-4">
                        <span>Codespace: {codespace.name}</span>
                        <span>•</span>
                        <span>{codespace.machine?.display_name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className={cn(
                            "h-2 w-2 rounded-full",
                            status === 'connected' ? "bg-green-500" :
                            status === 'connecting' ? "bg-yellow-500 animate-pulse" :
                            status === 'error' ? "bg-red-500" : "bg-zinc-600"
                        )} />
                        <span className="capitalize">{status}</span>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
