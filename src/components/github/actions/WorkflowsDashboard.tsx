/**
 * WorkflowsDashboard Component - Main GitHub Actions interface
 * 
 * Features:
 * - List all workflows in a repository
 * - View workflow status and last run
 * - Trigger workflows manually
 * - Enable/disable workflows
 */

import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useWorkflows, useWorkflowRuns, useTriggerWorkflow, useEnableWorkflow, useDisableWorkflow } from '@/hooks/github/useActionsOperations';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    Play,
    RefreshCw,
    CheckCircle2,
    XCircle,
    Clock,
    ArrowLeft,
    FileCode,
    GitBranch,
    Search,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useRepositories } from '@/hooks/github/useGitOperations';
import { toast } from 'sonner';
import type { GitHubWorkflow } from '@/types/github';
import { formatDistanceToNow, parseISO } from 'date-fns';

export function WorkflowsDashboard() {
    const { owner, repo } = useParams<{ owner: string; repo: string }>();
    const navigate = useNavigate();
    const [triggerDialogOpen, setTriggerDialogOpen] = useState(false);
    const [selectedWorkflow, setSelectedWorkflow] = useState<GitHubWorkflow | null>(null);

    const { data: workflows, isLoading, error, refetch } = useWorkflows(owner || '', repo || '');
    const { data: recentRuns } = useWorkflowRuns(owner || '', repo || '', undefined, { per_page: 100 });
    const triggerWorkflow = useTriggerWorkflow();
    const enableWorkflow = useEnableWorkflow();
    const disableWorkflow = useDisableWorkflow();

    // Get last run for a workflow
    const getLastRun = (workflowId: number) => {
        return recentRuns?.find(run => run.workflow_id === workflowId);
    };

    const handleTrigger = (workflow: GitHubWorkflow) => {
        setSelectedWorkflow(workflow);
        setTriggerDialogOpen(true);
    };

    const confirmTrigger = async () => {
        if (!selectedWorkflow || !owner || !repo) return;

        try {
            await triggerWorkflow.mutateAsync({
                owner,
                repo,
                workflowId: selectedWorkflow.id,
                ref: 'main', // Default to main branch
            });
            setTriggerDialogOpen(false);
            setSelectedWorkflow(null);
        } catch (error) {
            // Error handled by hook
        }
    };

    const handleToggleWorkflow = async (workflow: GitHubWorkflow, enabled: boolean) => {
        if (!owner || !repo) return;

        try {
            if (enabled) {
                await enableWorkflow.mutateAsync({ owner, repo, workflowId: workflow.id });
            } else {
                await disableWorkflow.mutateAsync({ owner, repo, workflowId: workflow.id });
            }
        } catch (error) {
            // Error handled by hook
        }
    };

    const [repoSearchQuery, setRepoSearchQuery] = useState('');
    const { data: repositories, isLoading: isLoadingRepos } = useRepositories();

    // Filter repositories
    const filteredRepos = repositories?.filter(r =>
        r.name.toLowerCase().includes(repoSearchQuery.toLowerCase())
    );

    if (!owner || !repo) {
        return (
            <div className="container mx-auto py-6 space-y-6">
                <div className="flex flex-col gap-2">
                    <h1 className="text-3xl font-bold">GitHub Actions</h1>
                    <p className="text-muted-foreground">Select a repository to view its workflows</p>
                </div>

                <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search repositories..."
                        value={repoSearchQuery}
                        onChange={(e) => setRepoSearchQuery(e.target.value)}
                        className="pl-10"
                    />
                </div>

                {isLoadingRepos ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {Array.from({ length: 6 }).map((_, i) => (
                            <Card key={i}>
                                <CardHeader>
                                    <Skeleton className="h-6 w-3/4" />
                                    <Skeleton className="h-4 w-full" />
                                </CardHeader>
                            </Card>
                        ))}
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {filteredRepos?.map((r) => (
                            <Card
                                key={r.id}
                                className="cursor-pointer hover:shadow-md transition-all hover:border-primary"
                                onClick={() => navigate(`/github/actions/${r.owner.login}/${r.name}`)}
                            >
                                <CardHeader>
                                    <CardTitle className="text-lg flex items-center gap-2">
                                        {r.name}
                                        {r.private && <Badge variant="secondary" className="text-xs">Private</Badge>}
                                    </CardTitle>
                                    <CardDescription className="line-clamp-2">
                                        {r.description || 'No description'}
                                    </CardDescription>
                                </CardHeader>
                            </Card>
                        ))}
                    </div>
                )}
            </div>
        );
    }

    if (error) {
        return (
            <div className="container mx-auto py-6">
                <div className="flex flex-col items-center justify-center h-96 space-y-4">
                    <p className="text-destructive">Failed to load workflows: {(error as Error).message}</p>
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
                        <Button variant="ghost" size="icon" onClick={() => navigate('/github/repositories')}>
                            <ArrowLeft className="h-4 w-4" />
                        </Button>
                        <div>
                            <h1 className="text-3xl font-bold">GitHub Actions</h1>
                            <p className="text-muted-foreground">
                                {owner}/{repo} • {workflows?.length || 0} workflows
                            </p>
                        </div>
                    </div>
                </div>
                <Button onClick={() => refetch()} variant="outline" disabled={isLoading}>
                    <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                    Refresh
                </Button>
            </div>

            {/* Workflows Grid */}
            {isLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {Array.from({ length: 6 }).map((_, i) => (
                        <Card key={i}>
                            <CardHeader>
                                <Skeleton className="h-6 w-3/4" />
                                <Skeleton className="h-4 w-full" />
                            </CardHeader>
                            <CardContent>
                                <Skeleton className="h-20 w-full" />
                            </CardContent>
                        </Card>
                    ))}
                </div>
            ) : workflows && workflows.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {workflows.map((workflow) => (
                        <WorkflowCard
                            key={workflow.id}
                            workflow={workflow}
                            lastRun={getLastRun(workflow.id)}
                            onTrigger={() => handleTrigger(workflow)}
                            onViewRuns={() => navigate(`/github/actions/${owner}/${repo}/workflows/${workflow.id}`)}
                            onToggle={(enabled) => handleToggleWorkflow(workflow, enabled)}
                        />
                    ))}
                </div>
            ) : (
                <div className="text-center py-12">
                    <FileCode className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">No workflows found in this repository</p>
                </div>
            )}

            {/* Trigger Confirmation Dialog */}
            <Dialog open={triggerDialogOpen} onOpenChange={setTriggerDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Trigger Workflow</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to manually trigger "{selectedWorkflow?.name}"?
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setTriggerDialogOpen(false)}>
                            Cancel
                        </Button>
                        <Button onClick={confirmTrigger} disabled={triggerWorkflow.isPending}>
                            {triggerWorkflow.isPending ? 'Triggering...' : 'Trigger Workflow'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}

interface WorkflowCardProps {
    workflow: GitHubWorkflow;

    lastRun?: { status: string; conclusion: string | null; updated_at: string } | undefined;
    onTrigger: () => void;
    onViewRuns: () => void;
    onToggle: (enabled: boolean) => void;
}

function WorkflowCard({ workflow, lastRun, onTrigger, onViewRuns, onToggle }: WorkflowCardProps) {
    const getStatusIcon = () => {
        if (!lastRun) return <Clock className="h-4 w-4 text-muted-foreground" />;
        if (lastRun.status === 'in_progress' || lastRun.status === 'queued') {
            return <RefreshCw className="h-4 w-4 text-blue-500 animate-spin" />;
        }
        if (lastRun.conclusion === 'success') {
            return <CheckCircle2 className="h-4 w-4 text-green-500" />;
        }
        if (lastRun.conclusion === 'failure') {
            return <XCircle className="h-4 w-4 text-red-500" />;
        }
        return <Clock className="h-4 w-4 text-muted-foreground" />;
    };

    const getStatusText = () => {
        if (!lastRun) return 'Never run';
        if (lastRun.status === 'in_progress') return 'Running';
        if (lastRun.status === 'queued') return 'Queued';
        if (lastRun.conclusion === 'success') return 'Success';
        if (lastRun.conclusion === 'failure') return 'Failed';
        if (lastRun.conclusion === 'cancelled') return 'Cancelled';
        return 'Unknown';
    };

    return (
        <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
                <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                        <CardTitle className="text-lg truncate">{workflow.name}</CardTitle>
                        <CardDescription className="flex items-center gap-2 mt-1">
                            <GitBranch className="h-3 w-3" />
                            <span className="truncate">{workflow.path}</span>
                        </CardDescription>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                {/* Last Run Status */}
                <div className="flex items-center justify-between p-3 bg-muted/50 rounded-md">
                    <div className="flex items-center gap-2">
                        {getStatusIcon()}
                        <div>
                            <p className="text-sm font-medium">{getStatusText()}</p>
                            {lastRun && (
                                <p className="text-xs text-muted-foreground">
                                    {formatDistanceToNow(parseISO(lastRun.updated_at))} ago
                                </p>
                            )}
                        </div>
                    </div>
                </div>

                {/* State badge */}
                <div className="flex items-center gap-2">
                    <Badge variant={workflow.state === 'active' ? 'default' : 'secondary'}>
                        {workflow.state}
                    </Badge>
                </div>

                {/* Actions */}
                <div className="grid grid-cols-2 gap-2">
                    <Button size="sm" variant="outline" onClick={onTrigger}>
                        <Play className="mr-2 h-4 w-4" />
                        Run
                    </Button>
                    <Button size="sm" variant="outline" onClick={onViewRuns}>
                        View Runs
                    </Button>
                </div>

                {/* Enable/Disable Toggle */}
                <div className="flex items-center space-x-2">
                    <Switch
                        id={`workflow-${workflow.id}`}
                        checked={workflow.state === 'active'}
                        onCheckedChange={onToggle}
                    />
                    <Label htmlFor={`workflow-${workflow.id}`} className="text-sm">
                        {workflow.state === 'active' ? 'Enabled' : 'Disabled'}
                    </Label>
                </div>
            </CardContent>
        </Card>
    );
}
