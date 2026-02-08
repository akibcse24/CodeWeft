/**
 * CodespaceAccessPanel Component
 * 
 * Shows codespace details and provides clear access methods
 * instead of a fake terminal that can't work
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { 
    ExternalLink,
    Copy,
    Check,
    Monitor,
    GitBranch,
    Cpu,
    HardDrive,
    Terminal,
    Info,
    MonitorDown,
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import type { GitHubCodespace } from '@/services/github/codespaces.service';
import { getVSCodeDesktopUrl } from '@/hooks/github/useCodespacesOperations';

interface CodespaceAccessPanelProps {
    codespace: GitHubCodespace;
    className?: string;
}

export function CodespaceAccessPanel({ codespace, className }: CodespaceAccessPanelProps) {
    const [copiedSSH, setCopiedSSH] = useState(false);

    const sshCommand = `gh codespace ssh --codespace ${codespace.name}`;

    const handleCopySSH = async () => {
        await navigator.clipboard.writeText(sshCommand);
        setCopiedSSH(true);
        toast.success('SSH command copied!', { 
            description: 'Run this in your local terminal with GitHub CLI installed' 
        });
        setTimeout(() => setCopiedSSH(false), 2000);
    };

    const handleOpenBrowser = () => {
        window.open(codespace.web_url, '_blank');
    };

    const handleOpenVSCode = () => {
        const url = getVSCodeDesktopUrl(codespace.name);
        window.open(url, '_self');
        toast.info('Opening in VS Code Desktop...', { 
            description: "If VS Code doesn't open, make sure it's installed." 
        });
    };

    const isRunning = codespace.state === 'Available';
    const memoryGB = Math.round((codespace.machine?.memory_in_bytes || 0) / (1024 * 1024 * 1024));
    const storageGB = Math.round((codespace.machine?.storage_in_bytes || 0) / (1024 * 1024 * 1024));

    return (
        <div className={cn("space-y-6", className)}>
            {/* Codespace Info Card */}
            <Card className="border-border bg-card">
                <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-primary/10">
                                <Monitor className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                                <CardTitle className="text-lg">{codespace.repository.full_name}</CardTitle>
                                <CardDescription className="flex items-center gap-1.5">
                                    <GitBranch className="h-3 w-3" />
                                    {codespace.git_status.ref}
                                </CardDescription>
                            </div>
                        </div>
                        <Badge 
                            variant={isRunning ? "default" : "secondary"}
                            className={cn(
                                isRunning && "bg-green-500/10 text-green-500 border-green-500/30"
                            )}
                        >
                            {codespace.state}
                        </Badge>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div className="flex items-center gap-2 text-muted-foreground">
                            <Cpu className="h-4 w-4" />
                            <span>{codespace.machine?.cpus || '?'} cores</span>
                        </div>
                        <div className="flex items-center gap-2 text-muted-foreground">
                            <Monitor className="h-4 w-4" />
                            <span>{memoryGB} GB RAM</span>
                        </div>
                        <div className="flex items-center gap-2 text-muted-foreground">
                            <HardDrive className="h-4 w-4" />
                            <span>{storageGB} GB storage</span>
                        </div>
                        <div className="flex items-center gap-2 text-muted-foreground">
                            <Terminal className="h-4 w-4" />
                            <span>{codespace.machine?.display_name || 'Standard'}</span>
                        </div>
                    </div>

                    {/* Git status */}
                    {(codespace.git_status.has_uncommitted_changes || codespace.git_status.has_unpushed_changes) && (
                        <div className="flex gap-2 mt-4 pt-4 border-t">
                            {codespace.git_status.has_uncommitted_changes && (
                                <Badge variant="secondary">Uncommitted changes</Badge>
                            )}
                            {codespace.git_status.has_unpushed_changes && (
                                <Badge variant="secondary">Unpushed commits</Badge>
                            )}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Access Methods */}
            <div className="grid gap-4 md:grid-cols-3">
                {/* Open in Browser */}
                <Card className="border-border hover:border-primary/50 transition-colors cursor-pointer group"
                    onClick={handleOpenBrowser}
                >
                    <CardContent className="pt-6">
                        <div className="flex flex-col items-center text-center space-y-3">
                            <div className="p-3 rounded-full bg-primary/10 group-hover:bg-primary/20 transition-colors">
                                <ExternalLink className="h-6 w-6 text-primary" />
                            </div>
                            <div>
                                <h3 className="font-semibold">Open in Browser</h3>
                                <p className="text-sm text-muted-foreground mt-1">
                                    Full VS Code in your browser
                                </p>
                            </div>
                            <Button variant="outline" size="sm" className="w-full">
                                Open
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                {/* Open in VS Code Desktop */}
                <Card className="border-border hover:border-primary/50 transition-colors cursor-pointer group"
                    onClick={handleOpenVSCode}
                >
                    <CardContent className="pt-6">
                        <div className="flex flex-col items-center text-center space-y-3">
                            <div className="p-3 rounded-full bg-blue-500/10 group-hover:bg-blue-500/20 transition-colors">
                                <MonitorDown className="h-6 w-6 text-blue-500" />
                            </div>
                            <div>
                                <h3 className="font-semibold">VS Code Desktop</h3>
                                <p className="text-sm text-muted-foreground mt-1">
                                    Connect with local VS Code
                                </p>
                            </div>
                            <Button variant="outline" size="sm" className="w-full">
                                Launch
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                {/* Copy SSH Command */}
                <Card className="border-border hover:border-primary/50 transition-colors cursor-pointer group"
                    onClick={handleCopySSH}
                >
                    <CardContent className="pt-6">
                        <div className="flex flex-col items-center text-center space-y-3">
                            <div className="p-3 rounded-full bg-green-500/10 group-hover:bg-green-500/20 transition-colors">
                                {copiedSSH ? (
                                    <Check className="h-6 w-6 text-green-500" />
                                ) : (
                                    <Copy className="h-6 w-6 text-green-500" />
                                )}
                            </div>
                            <div>
                                <h3 className="font-semibold">SSH Terminal</h3>
                                <p className="text-sm text-muted-foreground mt-1">
                                    Copy command for local CLI
                                </p>
                            </div>
                            <Button variant="outline" size="sm" className="w-full">
                                {copiedSSH ? 'Copied!' : 'Copy Command'}
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* SSH Command Display */}
            <Card className="border-border bg-muted/30">
                <CardContent className="pt-4">
                    <div className="flex items-start gap-3">
                        <Terminal className="h-5 w-5 text-muted-foreground mt-0.5" />
                        <div className="flex-1 space-y-2">
                            <p className="text-sm font-medium">Local Terminal Access</p>
                            <code className="block p-3 rounded-md bg-background border text-sm font-mono break-all">
                                {sshCommand}
                            </code>
                            <p className="text-xs text-muted-foreground">
                                Requires <a href="https://cli.github.com" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">GitHub CLI</a> installed and authenticated
                            </p>
                        </div>
                        <Button variant="ghost" size="sm" onClick={handleCopySSH}>
                            {copiedSSH ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Info Notice */}
            <div className="flex items-start gap-3 p-4 rounded-lg bg-blue-500/5 border border-blue-500/20 text-sm">
                <Info className="h-5 w-5 text-blue-500 mt-0.5 flex-shrink-0" />
                <div className="space-y-1">
                    <p className="font-medium text-blue-600 dark:text-blue-400">Why no in-browser terminal?</p>
                    <p className="text-muted-foreground">
                        Direct SSH access to GitHub Codespaces requires the GitHub CLI, which can only run on your local machine.
                        Use one of the access methods above for the best experience.
                    </p>
                </div>
            </div>
        </div>
    );
}
