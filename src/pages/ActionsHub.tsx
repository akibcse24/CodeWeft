import { useState } from 'react';
import { motion } from 'framer-motion';
import {
    Workflow,
    CheckCircle,
    XCircle,
    Clock,
    TrendingUp,
    Play,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { WorkflowList } from '@/components/github/actions/WorkflowList';
import { useWorkflows } from '@/hooks/useWorkflows';
import { calculateSuccessRate, calculateAverageDuration, formatDuration } from '@/services/github/actions.service';
import { useRepositories } from '@/hooks/github/useGitOperations';

export default function ActionsHub() {
    const { data: repositories = [], isLoading: isLoadingRepos } = useRepositories();
    const [selectedRepo, setSelectedRepo] = useState<{ owner: string; repo: string } | null>(null);

    // Auto-select first repo
    useState(() => {
        if (repositories.length > 0 && !selectedRepo) {
            const firstRepo = repositories[0];
            setSelectedRepo({ owner: firstRepo.owner.login, repo: firstRepo.name });
        }
    });

    const { runs, isLoadingRuns } = useWorkflows({
        owner: selectedRepo?.owner || '',
        repo: selectedRepo?.repo || '',
        enabled: !!selectedRepo,
    });

    const successRate = calculateSuccessRate(runs);
    const avgDuration = calculateAverageDuration(runs);
    const totalRuns = runs.length;
    const successfulRuns = runs.filter((r) => r.conclusion === 'success').length;
    const failedRuns = runs.filter((r) => r.conclusion === 'failure').length;
    const runningRuns = runs.filter((r) => r.status === 'in_progress').length;

    const stats = [
        {
            label: 'Success Rate',
            value: `${successRate.toFixed(1)}%`,
            icon: TrendingUp,
            color: 'text-green-400',
            bgColor: 'bg-green-500/10',
        },
        {
            label: 'Successful',
            value: successfulRuns,
            icon: CheckCircle,
            color: 'text-green-400',
            bgColor: 'bg-green-500/10',
        },
        {
            label: 'Failed',
            value: failedRuns,
            icon: XCircle,
            color: 'text-red-400',
            bgColor: 'bg-red-500/10',
        },
        {
            label: 'Running',
            value: runningRuns,
            icon: Clock,
            color: 'text-blue-400',
            bgColor: 'bg-blue-500/10',
        },
    ];

    return (
        <div className="container mx-auto p-6 space-y-6">
            {/* Header */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center justify-between"
            >
                <div className="space-y-2">
                    <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                        GitHub Actions
                    </h1>
                    <p className="text-muted-foreground text-lg">
                        Monitor workflows, view logs, and manage CI/CD pipelines
                    </p>
                </div>

                <div className="flex items-center gap-2">
                    <Workflow className="h-8 w-8 text-blue-400" />
                </div>
            </motion.div>

            {/* Repository Selector */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
            >
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg">Select Repository</CardTitle>
                        <CardDescription>Choose a repository to view its workflows</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Select
                            value={selectedRepo ? `${selectedRepo.owner}/${selectedRepo.repo}` : undefined}
                            onValueChange={(value) => {
                                const [owner, repo] = value.split('/');
                                setSelectedRepo({ owner, repo });
                            }}
                            disabled={isLoadingRepos}
                        >
                            <SelectTrigger className="w-full">
                                <SelectValue placeholder="Select a repository..." />
                            </SelectTrigger>
                            <SelectContent>
                                {repositories.map((repo) => (
                                    <SelectItem key={repo.id} value={`${repo.owner.login}/${repo.name}`}>
                                        {repo.owner.login}/{repo.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </CardContent>
                </Card>
            </motion.div>

            {selectedRepo && (
                <>
                    {/* Quick Stats */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
                    >
                        {stats.map((stat, index) => (
                            <Card key={stat.label} className="bg-card/50 backdrop-blur-sm">
                                <CardHeader className="pb-3">
                                    <div className="flex items-center justify-between">
                                        <CardTitle className="text-sm font-medium text-muted-foreground">
                                            {stat.label}
                                        </CardTitle>
                                        <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                                            <stat.icon className={`h-4 w-4 ${stat.color}`} />
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    {isLoadingRuns ? (
                                        <Skeleton className="h-8 w-16" />
                                    ) : (
                                        <motion.p
                                            initial={{ opacity: 0, scale: 0.5 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            transition={{ delay: 0.1 * (index + 3) }}
                                            className="text-3xl font-bold"
                                        >
                                            {stat.value}
                                        </motion.p>
                                    )}
                                </CardContent>
                            </Card>
                        ))}
                    </motion.div>

                    {/* Additional Metrics */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                    >
                        <Card>
                            <CardContent className="p-6">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    <div>
                                        <p className="text-sm text-muted-foreground">Total Runs</p>
                                        <p className="text-2xl font-bold mt-1">{totalRuns}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-muted-foreground">Average Duration</p>
                                        <p className="text-2xl font-bold mt-1">
                                            {avgDuration > 0 ? formatDuration(avgDuration) : 'N/A'}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-muted-foreground">Repository</p>
                                        <p className="text-2xl font-bold mt-1 truncate">
                                            {selectedRepo.owner}/{selectedRepo.repo}
                                        </p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </motion.div>

                    {/* Workflow List */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4 }}
                    >
                        <WorkflowList owner={selectedRepo.owner} repo={selectedRepo.repo} />
                    </motion.div>
                </>
            )}
        </div>
    );
}
