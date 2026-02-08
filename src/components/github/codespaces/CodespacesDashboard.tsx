/**
 * CodespacesDashboard Component
 * 
 * Displays list of GitHub Codespaces with management actions
 */

import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
    useCodespaces, 
    useStartCodespace, 
    useStopCodespace, 
    useDeleteCodespace,
    useRebuildCodespace,
    getVSCodeDesktopUrl,
} from '@/hooks/github/useCodespacesOperations';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    Monitor,
    MoreVertical,
    Play,
    Square,
    Trash2,
    ExternalLink,
    Plus,
    RefreshCw,
    Cpu,
    GitBranch,
    HardDrive,
    Clock,
    Terminal,
    RotateCw,
    MonitorDown,
    Settings2,
    Copy,
} from 'lucide-react';
import { AccessDialog } from './AccessDialog';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { formatDistanceToNow, parseISO } from 'date-fns';
import type { GitHubCodespace } from '@/services/github/codespaces.service';

export function CodespacesDashboard() {
    const navigate = useNavigate();
    const { data: codespaces, isLoading, error, refetch } = useCodespaces();
    const startCodespace = useStartCodespace();
    const stopCodespace = useStopCodespace();
    const deleteCodespace = useDeleteCodespace();
    const rebuildCodespace = useRebuildCodespace();

    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [rebuildDialogOpen, setRebuildDialogOpen] = useState(false);
    const [selectedCodespace, setSelectedCodespace] = useState<GitHubCodespace | null>(null);
    const [terminalDialogOpen, setTerminalDialogOpen] = useState(false);
    const [terminalCodespace, setTerminalCodespace] = useState<GitHubCodespace | null>(null);
    const [githubToken, setGithubToken] = useState<string | null>(null);

    // Fetch GitHub token from settings
    useEffect(() => {
        async function fetchToken() {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                const { data } = await supabase
                    .from('github_settings')
                    .select('github_token')
                    .eq('user_id', user.id)
                    .single();
                if (data?.github_token) {
                    setGithubToken(data.github_token);
                }
            }
        }
        fetchToken();
    }, []);

    const handleStart = async (name: string) => {
        await startCodespace.mutateAsync(name);
    };

    const handleStop = async (name: string) => {
        await stopCodespace.mutateAsync(name);
    };

    const handleDeleteClick = (codespace: GitHubCodespace) => {
        setSelectedCodespace(codespace);
        setDeleteDialogOpen(true);
    };

    const handleRebuildClick = (codespace: GitHubCodespace) => {
        setSelectedCodespace(codespace);
        setRebuildDialogOpen(true);
    };

    const confirmDelete = async () => {
        if (selectedCodespace) {
            await deleteCodespace.mutateAsync(selectedCodespace.name);
            setDeleteDialogOpen(false);
            setSelectedCodespace(null);
        }
    };

    const confirmRebuild = async () => {
        if (selectedCodespace) {
            await rebuildCodespace.mutateAsync(selectedCodespace.name);
            setRebuildDialogOpen(false);
            setSelectedCodespace(null);
        }
    };

    const openCodespace = (url: string) => {
        window.open(url, '_blank');
    };

    const openInVSCodeDesktop = (codespaceName: string) => {
        const url = getVSCodeDesktopUrl(codespaceName);
        window.open(url, '_self');
        toast.info('Opening in VS Code Desktop...', { description: 'If VS Code doesn\'t open, make sure it\'s installed.' });
    };

    const openAccessPanel = useCallback((codespace: GitHubCodespace) => {
        setTerminalCodespace(codespace);
        setTerminalDialogOpen(true);
    }, []);

    const openAccessFullPage = useCallback((codespace: GitHubCodespace) => {
        navigate(`/github/codespaces/${codespace.name}/terminal`);
    }, [navigate]);

    const copySSHCommand = useCallback((codespace: GitHubCodespace) => {
        const command = `gh codespace ssh --codespace ${codespace.name}`;
        navigator.clipboard.writeText(command);
        toast.success('SSH command copied!', { description: 'Run this in your local terminal' });
    }, []);

    if (error) {
        return (
            <div className="container mx-auto py-6">
                <div className="flex flex-col items-center justify-center h-96 space-y-4">
                    <p className="text-destructive">Failed to load codespaces: {(error as Error).message}</p>
                    <Button onClick={() => refetch()} variant="outline">Retry</Button>
                </div>
            </div>
        );
    }

    return (
        <div className="container mx-auto py-6 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold flex items-center gap-2">
                        <Monitor className="h-8 w-8" />
                        Codespaces
                    </h1>
                    <p className="text-muted-foreground">
                        Manage your cloud development environments
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" onClick={() => refetch()} disabled={isLoading}>
                        <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                        Refresh
                    </Button>
                    <Button onClick={() => navigate('/github/codespaces/new')}>
                        <Plus className="mr-2 h-4 w-4" />
                        New Codespace
                    </Button>
                </div>
            </div>

            {/* Codespaces Grid */}
            {isLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {Array.from({ length: 3 }).map((_, i) => (
                        <Card key={i}>
                            <CardHeader>
                                <Skeleton className="h-6 w-3/4" />
                                <Skeleton className="h-4 w-1/2" />
                            </CardHeader>
                            <CardContent>
                                <Skeleton className="h-24 w-full" />
                            </CardContent>
                        </Card>
                    ))}
                </div>
            ) : codespaces && codespaces.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {codespaces.map((cs) => (
                        <CodespaceCard
                            key={cs.id}
                            codespace={cs}
                            onStart={() => handleStart(cs.name)}
                            onStop={() => handleStop(cs.name)}
                            onDelete={() => handleDeleteClick(cs)}
                            onRebuild={() => handleRebuildClick(cs)}
                            onOpen={() => openCodespace(cs.web_url)}
                            onOpenVSCode={() => openInVSCodeDesktop(cs.name)}
                            onOpenAccessPanel={() => openAccessPanel(cs)}
                            onOpenAccessFullPage={() => openAccessFullPage(cs)}
                            onCopySSH={() => copySSHCommand(cs)}
                        />
                    ))}
                </div>
            ) : (
                <div className="text-center py-20 bg-muted/20 rounded-lg border-2 border-dashed">
                    <Monitor className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium">No codespaces found</h3>
                    <p className="text-muted-foreground mb-6">Create a new codespace to get started developing in the cloud.</p>
                    <Button onClick={() => navigate('/github/codespaces/new')}>Create Codespace</Button>
                </div>
            )}

            {/* Delete Confirmation Dialog */}
            <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Delete Codespace</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to delete the codespace for <span className="font-semibold">{selectedCodespace?.repository.full_name}</span>?
                            This action cannot be undone and all uncommitted changes will be lost.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
                        <Button variant="destructive" onClick={confirmDelete} disabled={deleteCodespace.isPending}>
                            {deleteCodespace.isPending ? 'Deleting...' : 'Delete Codespace'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Rebuild Confirmation Dialog */}
            <Dialog open={rebuildDialogOpen} onOpenChange={setRebuildDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Rebuild Codespace</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to rebuild the codespace for <span className="font-semibold">{selectedCodespace?.repository.full_name}</span>?
                            This will recreate the container from scratch. Uncommitted changes may be lost.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setRebuildDialogOpen(false)}>Cancel</Button>
                        <Button onClick={confirmRebuild} disabled={rebuildCodespace.isPending}>
                            {rebuildCodespace.isPending ? 'Rebuilding...' : 'Rebuild Codespace'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Access Dialog */}
            <AccessDialog
                open={terminalDialogOpen}
                onOpenChange={setTerminalDialogOpen}
                codespace={terminalCodespace}
            />
        </div>
    );
}

function CodespaceCard({ codespace, onStart, onStop, onDelete, onRebuild, onOpen, onOpenVSCode, onOpenAccessPanel, onOpenAccessFullPage, onCopySSH }: {
    codespace: GitHubCodespace;
    onStart: () => void;
    onStop: () => void;
    onDelete: () => void;
    onRebuild: () => void;
    onOpen: () => void;
    onOpenVSCode: () => void;
    onOpenAccessPanel: () => void;
    onOpenAccessFullPage: () => void;
    onCopySSH: () => void;
}) {
    const isRunning = codespace.state === 'Available';
    const isStopped = codespace.state === 'Stopped';
    const isTransitioning = !isRunning && !isStopped && codespace.state !== 'Unavailable';

    const getStatusColor = (state: string) => {
        switch (state) {
            case 'Available': return 'bg-green-500';
            case 'Stopped': return 'bg-muted-foreground';
            case 'Starting': return 'bg-primary';
            case 'Stopping': return 'bg-orange-500';
            default: return 'bg-yellow-500';
        }
    };

    return (
        <Card className="flex flex-col h-full hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                    <div className="space-y-1">
                        <CardTitle className="text-lg truncate" title={codespace.repository.full_name}>
                            {codespace.repository.full_name}
                        </CardTitle>
                        <CardDescription className="flex items-center gap-2">
                            <GitBranch className="h-3 w-3" />
                            {codespace.git_status.ref}
                        </CardDescription>
                    </div>
                    <Badge variant="outline" className="flex items-center gap-1.5 px-2 py-1">
                        <span className={`h-2 w-2 rounded-full ${getStatusColor(codespace.state)}`} />
                        {codespace.state}
                    </Badge>
                </div>
            </CardHeader>
            <CardContent className="flex-1 space-y-4">
                <div className="grid grid-cols-2 gap-3 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                        <Cpu className="h-4 w-4" />
                        <span>{codespace.machine?.cpus} cores</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <Monitor className="h-4 w-4" />
                        <span>{Math.round((codespace.machine?.memory_in_bytes || 0) / (1024 * 1024 * 1024))}GB RAM</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <HardDrive className="h-4 w-4" />
                        <span>{Math.round((codespace.machine?.storage_in_bytes || 0) / (1024 * 1024 * 1024))}GB</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <Terminal className="h-4 w-4" />
                        <span>VS Code</span>
                    </div>
                </div>

                {/* Git status indicators */}
                {(codespace.git_status.has_uncommitted_changes || codespace.git_status.has_unpushed_changes) && (
                    <div className="flex gap-2 text-xs">
                        {codespace.git_status.has_uncommitted_changes && (
                            <Badge variant="secondary" className="text-xs">Uncommitted changes</Badge>
                        )}
                        {codespace.git_status.has_unpushed_changes && (
                            <Badge variant="secondary" className="text-xs">Unpushed commits</Badge>
                        )}
                    </div>
                )}

                <div className="flex items-center gap-2 text-xs text-muted-foreground border-t pt-3">
                    <Clock className="h-3 w-3" />
                    Last used {formatDistanceToNow(parseISO(codespace.last_used_at))} ago
                </div>
            </CardContent>
            <div className="p-4 pt-0 mt-auto flex gap-2">
                {isRunning ? (
                    <Button className="flex-1" onClick={onOpen}>
                        <ExternalLink className="mr-2 h-4 w-4" /> Open
                    </Button>
                ) : (
                    <Button className="flex-1" onClick={onStart} disabled={isTransitioning}>
                        <Play className="mr-2 h-4 w-4" /> Start
                    </Button>
                )}

                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="icon">
                            <MoreVertical className="h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        {isRunning && (
                            <DropdownMenuItem onClick={onStop}>
                                <Square className="mr-2 h-4 w-4" /> Stop Codespace
                            </DropdownMenuItem>
                        )}
                        {!isRunning && (
                            <DropdownMenuItem onClick={onStart} disabled={isTransitioning}>
                                <Play className="mr-2 h-4 w-4" /> Start Codespace
                            </DropdownMenuItem>
                        )}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={onOpenAccessPanel}>
                            <Settings2 className="mr-2 h-4 w-4" /> Access Options
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={onOpenAccessFullPage}>
                            <Monitor className="mr-2 h-4 w-4" /> Full Access Page
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={onOpen}>
                            <ExternalLink className="mr-2 h-4 w-4" /> Open in Browser
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={onOpenVSCode}>
                            <MonitorDown className="mr-2 h-4 w-4" /> Open in VS Code Desktop
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={onCopySSH}>
                            <Copy className="mr-2 h-4 w-4" /> Copy SSH Command
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={onRebuild} disabled={isTransitioning}>
                            <RotateCw className="mr-2 h-4 w-4" /> Rebuild Codespace
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={onDelete}>
                            <Trash2 className="mr-2 h-4 w-4" /> Delete Codespace
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </Card>
    );
}