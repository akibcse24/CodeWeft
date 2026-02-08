import { useState } from 'react';
import { motion } from 'framer-motion';
import {
    Play,
    RotateCcw,
    XCircle,
    CheckCircle,
    Clock,
    AlertCircle,
    Search,
    Filter,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { useWorkflows } from '@/hooks/useWorkflows';
import {
    getRunStatusColor,
    getRunStatusIcon,
    formatDuration,
} from '@/services/github/actions.service';
import { formatDistanceToNow } from 'date-fns';
import type { GitHubWorkflowRun } from '@/types/github';
import { useNavigate } from 'react-router-dom';

interface WorkflowListProps {
    owner: string;
    repo: string;
}

export function WorkflowList({ owner, repo }: WorkflowListProps) {
    const navigate = useNavigate();
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('all');

    const {
        workflows,
        runs,
        isLoading,
        triggerWorkflow,
        isTriggeringWorkflow,
        rerunWorkflow,
        cancelWorkflow,
    } = useWorkflows({ owner, repo });

    // Group runs by workflow
    const workflowMap = new Map<number, GitHubWorkflowRun[]>();
    runs.forEach((run) => {
        if (run.workflow_id) {
            if (!workflowMap.has(run.workflow_id)) {
                workflowMap.set(run.workflow_id, []);
            }
            workflowMap.get(run.workflow_id)!.push(run);
        }
    });

    // Filter workflows
    const filteredWorkflows = workflows.filter((workflow) => {
        if (searchQuery && !workflow.name.toLowerCase().includes(searchQuery.toLowerCase())) {
            return false;
        }
        if (statusFilter !== 'all') {
            const latestRun = workflowMap.get(workflow.id)?.[0];
            if (statusFilter === 'success' && latestRun?.conclusion !== 'success') return false;
            if (statusFilter === 'failure' && latestRun?.conclusion !== 'failure') return false;
            if (statusFilter === 'running' && latestRun?.status !== 'in_progress') return false;
        }
        return true;
    });

    if (isLoading) {
        return (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                    <Card key={i}>
                        <CardHeader>
                            <Skeleton className="h-6 w-3/4" />
                            <Skeleton className="h-4 w-1/2 mt-2" />
                        </CardHeader>
                        <CardContent>
                            <Skeleton className="h-16 w-full" />
                        </CardContent>
                    </Card>
                ))}
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search workflows..."
                        className="pl-9"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>

                <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-full sm:w-[180px]">
                        <Filter className="h-4 w-4 mr-2" />
                        <SelectValue placeholder="Filter by status" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Workflows</SelectItem>
                        <SelectItem value="success">✓ Success</SelectItem>
                        <SelectItem value="failure">✗ Failure</SelectItem>
                        <SelectItem value="running">⟳ Running</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            {/* Workflow Cards */}
            {filteredWorkflows.length === 0 ? (
                <Card className="p-12">
                    <div className="text-center text-muted-foreground">
                        <AlertCircle className="h-16 w-16 mx-auto mb-4 opacity-50" />
                        <p className="text-lg font-medium">
                            {searchQuery || statusFilter !== 'all' ? 'No workflows found' : 'No workflows'}
                        </p>
                        <p className="text-sm mt-2">
                            {searchQuery || statusFilter !== 'all'
                                ? 'Try adjusting your filters'
                                : 'This repository has no GitHub Actions workflows'}
                        </p>
                    </div>
                </Card>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredWorkflows.map((workflow, index) => {
                        const workflowRuns = workflowMap.get(workflow.id) || [];
                        const latestRun = workflowRuns[0];
                        const runCount = workflowRuns.length;

                        return (
                            <motion.div
                                key={workflow.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.05 }}
                            >
                                <Card
                                    className="h-full hover:border-primary/50 transition-all cursor-pointer group"
                                    onClick={() => latestRun && navigate(`/github/actions/${owner}/${repo}/${latestRun.id}`)}
                                >
                                    <CardHeader className="pb-3">
                                        <div className="flex items-start justify-between gap-2">
                                            <div className="flex-1 min-w-0">
                                                <CardTitle className="text-base truncate group-hover:text-primary transition-colors">
                                                    {workflow.name}
                                                </CardTitle>
                                                <CardDescription className="mt-1">
                                                    {latestRun ? (
                                                        <span className="flex items-center gap-1">
                                                            <span
                                                                className={getRunStatusColor(
                                                                    latestRun.status,
                                                                    latestRun.conclusion
                                                                )}
                                                            >
                                                                {getRunStatusIcon(latestRun.status, latestRun.conclusion)}
                                                            </span>
                                                            <span className="truncate">
                                                                {latestRun.head_branch || 'main'} •{' '}
                                                                {formatDistanceToNow(new Date(latestRun.created_at), {
                                                                    addSuffix: true,
                                                                })}
                                                            </span>
                                                        </span>
                                                    ) : (
                                                        'No runs yet'
                                                    )}
                                                </CardDescription>
                                            </div>
                                            {latestRun && (
                                                <StatusBadge status={latestRun.status} conclusion={latestRun.conclusion} />
                                            )}
                                        </div>
                                    </CardHeader>
                                    <CardContent className="space-y-3">
                                        {latestRun && (
                                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                                <Clock className="h-3 w-3" />
                                                <span>
                                                    {latestRun.updated_at && latestRun.created_at
                                                        ? formatDuration(
                                                            new Date(latestRun.updated_at).getTime() -
                                                            new Date(latestRun.created_at).getTime()
                                                        )
                                                        : 'N/A'}
                                                </span>
                                                <span>•</span>
                                                <span>
                                                    Run #{latestRun.run_number} • {runCount} total
                                                </span>
                                            </div>
                                        )}

                                        <div className="flex items-center gap-1 flex-wrap">
                                            {latestRun?.status === 'in_progress' ? (
                                                <>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="h-8 text-destructive hover:text-destructive"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            cancelWorkflow(latestRun.id);
                                                        }}
                                                    >
                                                        <XCircle className="h-3 w-3 mr-1" />
                                                        Cancel
                                                    </Button>
                                                </>
                                            ) : (
                                                <>
                                                    {latestRun && (
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            className="h-8"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                rerunWorkflow(latestRun.id);
                                                            }}
                                                        >
                                                            <RotateCcw className="h-3 w-3 mr-1" />
                                                            Re-run
                                                        </Button>
                                                    )}
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="h-8"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            triggerWorkflow({ workflowId: workflow.id, ref: 'main' });
                                                        }}
                                                        disabled={isTriggeringWorkflow}
                                                    >
                                                        <Play className="h-3 w-3 mr-1" />
                                                        Trigger
                                                    </Button>
                                                </>
                                            )}
                                        </div>
                                    </CardContent>
                                </Card>
                            </motion.div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

function StatusBadge({ status, conclusion }: { status: string; conclusion?: string | null }) {
    if (status === 'completed') {
        switch (conclusion) {
            case 'success':
                return (
                    <Badge variant="outline" className="border-green-500/50 text-green-400">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Success
                    </Badge>
                );
            case 'failure':
                return (
                    <Badge variant="outline" className="border-red-500/50 text-red-400">
                        <XCircle className="h-3 w-3 mr-1" />
                        Failed
                    </Badge>
                );
            case 'cancelled':
                return (
                    <Badge variant="outline" className="border-gray-500/50 text-gray-400">
                        Cancelled
                    </Badge>
                );
            default:
                return <Badge variant="outline">Completed</Badge>;
        }
    } else if (status === 'in_progress') {
        return (
            <Badge variant="outline" className="border-blue-500/50 text-blue-400">
                <Clock className="h-3 w-3 mr-1 animate-spin" />
                Running
            </Badge>
        );
    } else if (status === 'queued') {
        return (
            <Badge variant="outline" className="border-gray-500/50">
                Queued
            </Badge>
        );
    }
    return null;
}
