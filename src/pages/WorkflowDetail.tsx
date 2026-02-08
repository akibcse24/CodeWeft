import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
    ChevronLeft,
    Calendar,
    Clock,
    GitBranch,
    GitCommit,
    User,
    RotateCcw,
    XCircle,
    AlertCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { BuildLogs } from '@/components/github/actions/BuildLogs';
import { ArtifactDownloader } from '@/components/github/actions/ArtifactDownloader';
import { useWorkflowRun } from '@/hooks/useWorkflows';
import { useWorkflows } from '@/hooks/useWorkflows'; // for mutations
import { formatDistanceToNow } from 'date-fns';
import { getRunStatusColor, getRunStatusIcon, formatDuration } from '@/services/github/actions.service';

export default function WorkflowDetail() {
    const { owner, repo, runId } = useParams<{ owner: string; repo: string; runId: string }>();
    const navigate = useNavigate();
    const parsedRunId = runId ? parseInt(runId) : null;

    const { run, isLoading, refetch } = useWorkflowRun(owner || '', repo || '', parsedRunId);

    // Get mutation hooks
    const {
        rerunWorkflow,
        cancelWorkflow,
        isRerunningWorkflow,
        isCancellingWorkflow
    } = useWorkflows({ owner: owner || '', repo: repo || '' });

    if (isLoading) {
        return (
            <div className="container mx-auto p-6 space-y-6">
                <div className="flex items-center gap-4">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <div className="space-y-2">
                        <Skeleton className="h-8 w-64" />
                        <Skeleton className="h-4 w-48" />
                    </div>
                </div>
                <Skeleton className="h-[400px] w-full" />
            </div>
        );
    }

    if (!run) {
        return (
            <div className="container mx-auto p-6">
                <Card className="p-12 text-center">
                    <AlertCircle className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                    <h2 className="text-2xl font-bold mb-2">Workflow Run Not Found</h2>
                    <Button onClick={() => navigate('/github/actions')}>Go Back</Button>
                </Card>
            </div>
        );
    }

    return (
        <div className="container mx-auto p-6 space-y-6">
            {/* Header */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
            >
                <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
                            <ChevronLeft className="h-6 w-6" />
                        </Button>
                        <div>
                            <div className="flex items-center gap-3">
                                <h1 className="text-2xl font-bold">{run.name}</h1>
                                <Badge variant="outline" className="text-base font-normal">
                                    #{run.run_number}
                                </Badge>
                                <div className={`flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${run.status === 'completed'
                                        ? run.conclusion === 'success' ? 'bg-green-500/10 text-green-500 border-green-500/20'
                                            : run.conclusion === 'failure' ? 'bg-red-500/10 text-red-500 border-red-500/20'
                                                : 'bg-gray-500/10 text-gray-500 border-gray-500/20'
                                        : 'bg-blue-500/10 text-blue-500 border-blue-500/20'
                                    }`}>
                                    <span className="mr-1.5 text-sm">
                                        {getRunStatusIcon(run.status, run.conclusion)}
                                    </span>
                                    {run.status === 'completed' ? run.conclusion : run.status}
                                </div>
                            </div>
                            <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                                <span className="flex items-center gap-1">
                                    <GitBranch className="h-3 w-3" />
                                    {run.head_branch}
                                </span>
                                <span className="flex items-center gap-1">
                                    <GitCommit className="h-3 w-3" />
                                    <span className="font-mono">{run.head_sha.substring(0, 7)}</span>
                                </span>
                                <span className="flex items-center gap-1">
                                    <User className="h-3 w-3" />
                                    {run.actor?.login}
                                </span>
                                <span className="flex items-center gap-1">
                                    <Calendar className="h-3 w-3" />
                                    {formatDistanceToNow(new Date(run.created_at), { addSuffix: true })}
                                </span>
                                <span className="flex items-center gap-1">
                                    <Clock className="h-3 w-3" />
                                    {run.updated_at && run.created_at
                                        ? formatDuration(new Date(run.updated_at).getTime() - new Date(run.created_at).getTime())
                                        : 'N/A'
                                    }
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        {run.status === 'in_progress' || run.status === 'queued' ? (
                            <Button
                                variant="destructive"
                                onClick={() => cancelWorkflow(run.id)}
                                disabled={isCancellingWorkflow}
                            >
                                <XCircle className="h-4 w-4 mr-2" />
                                Cancel Run
                            </Button>
                        ) : (
                            <Button
                                variant="outline"
                                onClick={() => rerunWorkflow(run.id)}
                                disabled={isRerunningWorkflow}
                            >
                                <RotateCcw className="h-4 w-4 mr-2" />
                                Re-run Jobs
                            </Button>
                        )}
                    </div>
                </div>
            </motion.div>

            {/* Content */}
            <Tabs defaultValue="logs" className="w-full">
                <TabsList>
                    <TabsTrigger value="logs">Build Logs</TabsTrigger>
                    <TabsTrigger value="artifacts">Artifacts</TabsTrigger>
                </TabsList>
                <TabsContent value="logs" className="mt-4">
                    {parsedRunId && owner && repo && (
                        <BuildLogs owner={owner} repo={repo} runId={parsedRunId} />
                    )}
                </TabsContent>
                <TabsContent value="artifacts" className="mt-4">
                    <div className="max-w-3xl">
                        {parsedRunId && owner && repo && (
                            <ArtifactDownloader owner={owner} repo={repo} runId={parsedRunId} />
                        )}
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
}
