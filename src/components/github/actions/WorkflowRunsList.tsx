/**
 * WorkflowRunsList Component - Display workflow run history
 * 
 * Features:
 * - List all runs for a workflow
 * - Show run status and duration
 * - Re-run or cancel workflows
 * - Re-run failed jobs only
 * - Delete completed runs
 * - View run details
 */

import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
    useWorkflow,
    useWorkflowRuns,
    useRerunWorkflow,
    useCancelWorkflowRun,
    useDeleteWorkflowRun,
    useRerunFailedJobs,
} from '@/hooks/github/useActionsOperations';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import {
    ArrowLeft,
    RefreshCw,
    CheckCircle2,
    XCircle,
    Clock,
    RotateCw,
    StopCircle,
    GitBranch,
    User,
    GitCommit,
    MoreVertical,
    Trash2,
    AlertTriangle,
} from 'lucide-react';
import { formatDistanceToNow, parseISO } from 'date-fns';

export function WorkflowRunsList() {
    const { owner, repo, workflowId } = useParams<{ owner: string; repo: string; workflowId: string }>();
    const navigate = useNavigate();
    const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [runToCancel, setRunToCancel] = useState<number | null>(null);
    const [runToDelete, setRunToDelete] = useState<number | null>(null);

    const { data: workflow } = useWorkflow(owner || '', repo || '', Number(workflowId));
    const { data: runs, isLoading, error, refetch } = useWorkflowRuns(
        owner || '',
        repo || '',
        Number(workflowId)
    );
    const rerunWorkflow = useRerunWorkflow();
    const cancelRun = useCancelWorkflowRun();
    const deleteRun = useDeleteWorkflowRun();
    const rerunFailedJobs = useRerunFailedJobs();

    const handleRerun = async (runId: number) => {
        if (!owner || !repo) return;
        await rerunWorkflow.mutateAsync({ owner, repo, runId });
    };

    const handleRerunFailed = async (runId: number) => {
        if (!owner || !repo) return;
        await rerunFailedJobs.mutateAsync({ owner, repo, runId });
    };

    const confirmCancel = async () => {
        if (!runToCancel || !owner || !repo) return;

        try {
            await cancelRun.mutateAsync({ owner, repo, runId: runToCancel });
            setCancelDialogOpen(false);
            setRunToCancel(null);
        } catch (error) {
            // Error handled by hook
        }
    };

    const confirmDelete = async () => {
        if (!runToDelete || !owner || !repo) return;

        try {
            await deleteRun.mutateAsync({ owner, repo, runId: runToDelete });
            setDeleteDialogOpen(false);
            setRunToDelete(null);
        } catch (error) {
            // Error handled by hook
        }
    };

    const handleCancel = (runId: number) => {
        setRunToCancel(runId);
        setCancelDialogOpen(true);
    };

    const handleDelete = (runId: number) => {
        setRunToDelete(runId);
        setDeleteDialogOpen(true);
    };

    if (!owner || !repo || !workflowId) {
        return (
            <div className="container mx-auto py-6">
                <p className="text-destructive">Invalid workflow parameters</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="container mx-auto py-6">
                <div className="flex flex-col items-center justify-center h-96 space-y-4">
                    <p className="text-destructive">Failed to load workflow runs: {(error as Error).message}</p>
                    <Button onClick={() => refetch()} variant="outline">
                        <RefreshCw className="mr-2 h-4 w-4" />
                        Retry
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="container mx-auto py-6 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <div className="flex items-center gap-2">
                        <Button variant="ghost" size="icon" onClick={() => navigate(`/github/actions/${owner}/${repo}`)}>
                            <ArrowLeft className="h-4 w-4" />
                        </Button>
                        <div>
                            <h1 className="text-3xl font-bold">{workflow?.name || 'Workflow Runs'}</h1>
                            <p className="text-muted-foreground">
                                {owner}/{repo} • {runs?.length || 0} runs
                            </p>
                        </div>
                    </div>
                </div>
                <Button onClick={() => refetch()} variant="outline" disabled={isLoading}>
                    <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                    Refresh
                </Button>
            </div>

            {/* Runs List */}
            {isLoading ? (
                <div className="space-y-4">
                    {Array.from({ length: 5 }).map((_, i) => (
                        <Card key={i}>
                            <CardHeader>
                                <Skeleton className="h-6 w-3/4" />
                            </CardHeader>
                            <CardContent>
                                <Skeleton className="h-20 w-full" />
                            </CardContent>
                        </Card>
                    ))}
                </div>
            ) : runs && runs.length > 0 ? (
                <div className="space-y-4">
                    {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                    {runs.map((run: any) => (
                        <RunCard
                            key={run.id}
                            run={run}
                            onRerun={() => handleRerun(run.id)}
                            onRerunFailed={() => handleRerunFailed(run.id)}
                            onCancel={() => handleCancel(run.id)}
                            onDelete={() => handleDelete(run.id)}
                            onViewDetails={() => navigate(`/github/actions/${owner}/${repo}/runs/${run.id}`)}
                            isRerunning={rerunWorkflow.isPending}
                            isRerunningFailed={rerunFailedJobs.isPending}
                        />
                    ))}
                </div>
            ) : (
                <div className="text-center py-12">
                    <Clock className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">No workflow runs found</p>
                </div>
            )}

            {/* Cancel Confirmation Dialog */}
            <AlertDialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Cancel Workflow Run</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to cancel this workflow run? This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={confirmCancel} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                            {cancelRun.isPending ? 'Cancelling...' : 'Cancel Run'}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Delete Confirmation Dialog */}
            <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Workflow Run</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to delete this workflow run? This will remove all logs and artifacts associated with this run. This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                            {deleteRun.isPending ? 'Deleting...' : 'Delete Run'}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}

interface RunCardProps {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    run: any;
    onRerun: () => void;
    onRerunFailed: () => void;
    onCancel: () => void;
    onDelete: () => void;
    onViewDetails: () => void;
    isRerunning?: boolean;
    isRerunningFailed?: boolean;
}

function RunCard({ run, onRerun, onRerunFailed, onCancel, onDelete, onViewDetails, isRerunning, isRerunningFailed }: RunCardProps) {
    const getStatusIcon = () => {
        if (run.status === 'in_progress' || run.status === 'queued') {
            return <RefreshCw className="h-5 w-5 text-primary animate-spin" />;
        }
        if (run.conclusion === 'success') {
            return <CheckCircle2 className="h-5 w-5 text-green-500" />;
        }
        if (run.conclusion === 'failure') {
            return <XCircle className="h-5 w-5 text-destructive" />;
        }
        if (run.conclusion === 'cancelled') {
            return <StopCircle className="h-5 w-5 text-orange-500" />;
        }
        return <Clock className="h-5 w-5 text-muted-foreground" />;
    };

    const getStatusBadge = () => {
        if (run.status === 'in_progress') return <Badge>In Progress</Badge>;
        if (run.status === 'queued') return <Badge variant="secondary">Queued</Badge>;
        if (run.conclusion === 'success') return <Badge className="bg-green-500">Success</Badge>;
        if (run.conclusion === 'failure') return <Badge variant="destructive">Failed</Badge>;
        if (run.conclusion === 'cancelled') return <Badge variant="outline">Cancelled</Badge>;
        return <Badge variant="secondary">Unknown</Badge>;
    };

    const getDuration = () => {
        if (!run.created_at) return null;
        const created = new Date(run.created_at);
        const updated = new Date(run.updated_at);
        const durationMs = updated.getTime() - created.getTime();
        const seconds = Math.floor(durationMs / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);

        if (hours > 0) {
            return `${hours}h ${minutes % 60}m`;
        } else if (minutes > 0) {
            return `${minutes}m ${seconds % 60}s`;
        } else {
            return `${seconds}s`;
        }
    };

    const isCompleted = run.status === 'completed' || run.conclusion;
    const isFailed = run.conclusion === 'failure';
    const isActive = run.status === 'in_progress' || run.status === 'queued';

    return (
        <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
                <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3 flex-1">
                        {getStatusIcon()}
                        <div className="flex-1 min-w-0">
                            <CardTitle className="text-lg mb-2">
                                {run.display_title || run.head_commit?.message || 'Workflow Run'}
                            </CardTitle>
                            <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                                <div className="flex items-center gap-1">
                                    <GitBranch className="h-3 w-3" />
                                    {run.head_branch}
                                </div>
                                <div className="flex items-center gap-1">
                                    <GitCommit className="h-3 w-3" />
                                    <code className="text-xs">{run.head_sha?.slice(0, 7)}</code>
                                </div>
                                <div className="flex items-center gap-1">
                                    <User className="h-3 w-3" />
                                    {run.triggering_actor?.login || run.actor?.login}
                                </div>
                            </div>
                        </div>
                    </div>
                    {getStatusBadge()}
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                {/* Metadata */}
                <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-4">
                        <span className="text-muted-foreground">
                            Started {formatDistanceToNow(parseISO(run.created_at))} ago
                        </span>
                        {run.conclusion && (
                            <span className="text-muted-foreground">
                                Duration: {getDuration()}
                            </span>
                        )}
                    </div>
                </div>

                {/* Event badge */}
                <div>
                    <Badge variant="outline">
                        {run.event}
                    </Badge>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2">
                    <Button size="sm" variant="outline" onClick={onViewDetails}>
                        View Details
                    </Button>
                    
                    {isCompleted && (
                        <Button size="sm" variant="outline" onClick={onRerun} disabled={isRerunning}>
                            <RotateCw className={`mr-2 h-4 w-4 ${isRerunning ? 'animate-spin' : ''}`} />
                            Re-run All
                        </Button>
                    )}
                    
                    {isFailed && (
                        <Button size="sm" variant="outline" onClick={onRerunFailed} disabled={isRerunningFailed}>
                            <AlertTriangle className={`mr-2 h-4 w-4 ${isRerunningFailed ? 'animate-spin' : ''}`} />
                            Re-run Failed
                        </Button>
                    )}
                    
                    {isActive && (
                        <Button size="sm" variant="outline" onClick={onCancel} className="text-destructive">
                            <StopCircle className="mr-2 h-4 w-4" />
                            Cancel
                        </Button>
                    )}

                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 ml-auto">
                                <MoreVertical className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={onViewDetails}>
                                View Details
                            </DropdownMenuItem>
                            {isCompleted && (
                                <>
                                    <DropdownMenuItem onClick={onRerun}>
                                        <RotateCw className="mr-2 h-4 w-4" />
                                        Re-run All Jobs
                                    </DropdownMenuItem>
                                    {isFailed && (
                                        <DropdownMenuItem onClick={onRerunFailed}>
                                            <AlertTriangle className="mr-2 h-4 w-4" />
                                            Re-run Failed Jobs
                                        </DropdownMenuItem>
                                    )}
                                </>
                            )}
                            <DropdownMenuSeparator />
                            <DropdownMenuItem 
                                onClick={onDelete} 
                                className="text-destructive focus:text-destructive"
                                disabled={isActive}
                            >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete Run
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </CardContent>
        </Card>
    );
}
