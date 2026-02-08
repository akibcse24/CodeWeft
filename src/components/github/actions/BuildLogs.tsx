import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import {
    Download,
    Search,
    ArrowDownCircle,
    Clock,
    CheckCircle,
    XCircle,
    ChevronRight,
    ChevronDown,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { useQuery } from '@tanstack/react-query';
import { downloadWorkflowLogs, getWorkflowRun, listWorkflowJobs } from '@/services/github/actions.service';
import Converter from 'ansi-to-html';
import { cn } from '@/lib/utils';
import { formatDuration } from '@/services/github/actions.service';

interface BuildLogsProps {
    owner: string;
    repo: string;
    runId: number;
}

const converter = new Converter({
    fg: '#e5e7eb',
    bg: '#000000',
    newline: true,
    escapeXML: true,
});

export function BuildLogs({ owner, repo, runId }: BuildLogsProps) {
    const [searchQuery, setSearchQuery] = useState('');
    const [autoScroll, setAutoScroll] = useState(true);
    const scrollRef = useRef<HTMLDivElement>(null);
    const [expandedJobs, setExpandedJobs] = useState<number[]>([]);

    // Fetch run details
    const { data: run, isLoading: isLoadingRun } = useQuery({
        queryKey: ['workflow-run', owner, repo, runId],
        queryFn: () => getWorkflowRun(owner, repo, runId),
    });

    // Fetch jobs
    const { data: jobs, isLoading: isLoadingJobs } = useQuery({
        queryKey: ['workflow-jobs', owner, repo, runId],
        queryFn: () => listWorkflowJobs(owner, repo, runId),
        refetchInterval: (query) => {
            const data = query.state.data;
            if (run?.status === 'in_progress' || run?.status === 'queued') return 5000;
            return false;
        },
    });

    // Fetch logs (mock implementation for now as real logs require zip parsing)
    // In a real app, we'd fetch the zip, extract it, and read content.
    // For this demo, we'll simulate logs or use a simplified endpoint if available.
    // However, since we can't easily parse ZIPs in browser without heavier libs,
    // we will focus on displaying job steps and their status/logs if available via API.
    // GitHub API V3 allows getting logs for specific jobs.

    const toggleJob = (jobId: number) => {
        setExpandedJobs((prev) =>
            prev.includes(jobId) ? prev.filter((id) => id !== jobId) : [...prev, jobId]
        );
    };

    // Auto-scroll
    useEffect(() => {
        if (autoScroll && scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [jobs, autoScroll]);

    // Download logs handler
    const handleDownloadLogs = async () => {
        try {
            const data = await downloadWorkflowLogs(owner, repo, runId);
            const blob = new Blob([data], { type: 'application/zip' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `logs-${runId}.zip`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
        } catch (error) {
            console.error('Failed to download logs', error);
        }
    };

    if (isLoadingRun || isLoadingJobs) {
        return (
            <Card className="h-[600px] flex flex-col">
                <CardHeader>
                    <Skeleton className="h-8 w-1/3" />
                    <Skeleton className="h-4 w-1/4 mt-2" />
                </CardHeader>
                <CardContent className="flex-1 p-0">
                    <div className="space-y-4 p-4">
                        {[1, 2, 3].map((i) => (
                            <Skeleton key={i} className="h-24 w-full" />
                        ))}
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="h-[700px] flex flex-col font-mono text-sm">
            <CardHeader className="border-b bg-muted/40 py-3">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <CardTitle className="text-lg font-medium flex items-center gap-2">
                            Build Logs
                            <Badge variant="outline">Run #{run?.run_number}</Badge>
                        </CardTitle>
                        <div className="flex items-center gap-2 text-muted-foreground text-xs">
                            <Clock className="h-3 w-3" />
                            {run?.created_at && run.updated_at
                                ? formatDuration(
                                    new Date(run.updated_at).getTime() - new Date(run.created_at).getTime()
                                )
                                : 'N/A'}
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="flex items-center space-x-2 mr-2">
                            <Switch
                                id="auto-scroll"
                                checked={autoScroll}
                                onCheckedChange={setAutoScroll}
                            />
                            <Label htmlFor="auto-scroll">Auto-scroll</Label>
                        </div>
                        <Button variant="outline" size="sm" onClick={handleDownloadLogs}>
                            <Download className="h-4 w-4 mr-2" />
                            Download Logs
                        </Button>
                    </div>
                </div>
                <div className="mt-2 relative">
                    <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search within logs..."
                        className="pl-8 h-8 bg-background"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
            </CardHeader>

            <CardContent className="flex-1 p-0 overflow-hidden bg-[#0d1117] text-gray-300 relative">
                <div
                    ref={scrollRef}
                    className="h-full overflow-auto p-4 space-y-2 scroll-smooth"
                >
                    {jobs?.map((job) => (
                        <div key={job.id} className="border border-gray-800 rounded-md overflow-hidden">
                            <button
                                onClick={() => toggleJob(job.id)}
                                className={cn(
                                    "w-full flex items-center justify-between p-3 text-left transition-colors hover:bg-gray-800/50",
                                    expandedJobs.includes(job.id) ? "bg-gray-800/50" : "bg-[#161b22]"
                                )}
                            >
                                <div className="flex items-center gap-3">
                                    {expandedJobs.includes(job.id) ? (
                                        <ChevronDown className="h-4 w-4 text-gray-500" />
                                    ) : (
                                        <ChevronRight className="h-4 w-4 text-gray-500" />
                                    )}
                                    <span className={cn(
                                        "font-semibold",
                                        job.status === 'completed' && job.conclusion === 'failure' ? "text-red-400" :
                                            job.status === 'completed' && job.conclusion === 'success' ? "text-green-400" :
                                                "text-blue-400"
                                    )}>
                                        {job.name}
                                    </span>
                                </div>
                                <div className="flex items-center gap-3 text-xs">
                                    <span className="text-gray-500">
                                        {job.started_at && job.completed_at
                                            ? formatDuration(
                                                new Date(job.completed_at).getTime() - new Date(job.started_at).getTime()
                                            )
                                            : job.status}
                                    </span>
                                    {job.status === 'completed' ? (
                                        job.conclusion === 'success' ? (
                                            <CheckCircle className="h-4 w-4 text-green-500" />
                                        ) : (
                                            <XCircle className="h-4 w-4 text-red-500" />
                                        )
                                    ) : (
                                        <Clock className="h-4 w-4 text-blue-500 animate-spin" />
                                    )}
                                </div>
                            </button>

                            {expandedJobs.includes(job.id) && (
                                <div className="p-4 bg-[#0d1117] space-y-1 font-mono text-xs">
                                    {job.steps?.map((step) => (
                                        <div key={step.number} className="flex items-start gap-3 py-1 hover:bg-white/5 rounded px-2">
                                            <span className="w-6 text-right text-gray-600 select-none">
                                                {step.number}
                                            </span>
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2">
                                                    <span className={cn(
                                                        step.status === 'completed' && step.conclusion === 'failure' ? "text-red-400" :
                                                            step.status === 'completed' && step.conclusion === 'success' ? "text-green-400" :
                                                                "text-yellow-400"
                                                    )}>
                                                        [{step.status === 'completed' ? (step.conclusion === 'success' ? 'OK' : 'ERR') : 'RUN'}]
                                                    </span>
                                                    <span className="font-semibold">{step.name}</span>
                                                </div>
                                                {/* 
                            Note: Real log lines would typically be fetched here.
                            Since GitHub API v3 logs download as ZIP, accessing individual lines requires extracting.
                            For this implementation, we show step structure.
                          */}
                                            </div>
                                            <span className="text-gray-600 text-[10px]">
                                                {step.completed_at && step.started_at ?
                                                    `${Math.floor((new Date(step.completed_at).getTime() - new Date(step.started_at).getTime()) / 1000)}s`
                                                    : ''}
                                            </span>
                                        </div>
                                    ))}
                                    {job.steps?.length === 0 && (
                                        <div className="text-gray-500 italic pl-9">No steps recorded</div>
                                    )}
                                </div>
                            )}
                        </div>
                    ))}

                    {jobs?.length === 0 && (
                        <div className="text-center text-gray-500 py-12">
                            Waiting for jobs to start...
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
