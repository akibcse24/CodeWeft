import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { GitBranch, GitPullRequest, Upload, Download, RefreshCw } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { listUserRepositories } from '@/services/github/repository.service';
import { useRepositoryStatus, getSyncStatusColor, getSyncStatusLabel } from '@/hooks/useRepositoryStatus';
import { useGitOperations } from '@/hooks/useGitOperations';
import { Separator } from '@/components/ui/separator';

interface PushPullDashboardProps {
    onRepoSelect?: (repo: { owner: string; repo: string } | null) => void;
    onBranchSelect?: (branch: string) => void;
}

export function PushPullDashboard({ onRepoSelect, onBranchSelect }: PushPullDashboardProps) {
    const [selectedRepo, setSelectedRepo] = useState<{ owner: string; repo: string } | null>(null);
    const [selectedBranch, setSelectedBranch] = useState<string>('main');

    // Fetch repositories
    const { data: repositories, isLoading: isLoadingRepos } = useQuery({
        queryKey: ['user-repositories'],
        queryFn: () => listUserRepositories({ sort: 'updated', per_page: 50 }),
        staleTime: 5 * 60 * 1000,
    });

    // Fetch branches and status when repo is selected
    const {
        branches,
        isLoadingBranches,
    } = useGitOperations({
        owner: selectedRepo?.owner || '',
        repo: selectedRepo?.repo || '',
        enabled: !!selectedRepo,
    });

    const { status, isLoading: isLoadingStatus } = useRepositoryStatus({
        owner: selectedRepo?.owner || '',
        repo: selectedRepo?.repo || '',
        branch: selectedBranch,
        enabled: !!selectedRepo,
    });

    // Update parent component when selections change
    useEffect(() => {
        onRepoSelect?.(selectedRepo);
    }, [selectedRepo, onRepoSelect]);

    useEffect(() => {
        onBranchSelect?.(selectedBranch);
    }, [selectedBranch, onBranchSelect]);

    // Update branch when repo changes
    useEffect(() => {
        if (selectedRepo && branches.length > 0) {
            const defaultBranch = branches.find(b => b.name === 'main' || b.name === 'master') || branches[0];
            setSelectedBranch(defaultBranch.name);
        }
    }, [selectedRepo, branches]);

    const handleRepoChange = (value: string) => {
        const [owner, repo] = value.split('/');
        setSelectedRepo({ owner, repo });
    };

    const handleBranchChange = (value: string) => {
        setSelectedBranch(value);
    };

    return (
        <Card className="bg-card/50 backdrop-blur-sm">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <GitBranch className="h-5 w-5" />
                    Repository Control Center
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
                {/* Repository Selection */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Repository</label>
                        {isLoadingRepos ? (
                            <Skeleton className="h-10 w-full" />
                        ) : (
                            <Select onValueChange={handleRepoChange}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select a repository..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {repositories?.map((repo) => (
                                        <SelectItem key={repo.id} value={`${repo.owner.login}/${repo.name}`}>
                                            <div className="flex items-center gap-2">
                                                <span>{repo.name}</span>
                                                {repo.private && (
                                                    <Badge variant="outline" className="text-xs">
                                                        Private
                                                    </Badge>
                                                )}
                                            </div>
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        )}
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium">Branch</label>
                        {isLoadingBranches || !selectedRepo ? (
                            <Skeleton className="h-10 w-full" />
                        ) : (
                            <Select value={selectedBranch} onValueChange={handleBranchChange}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {branches.map((branch) => (
                                        <SelectItem key={branch.name} value={branch.name}>
                                            <div className="flex items-center gap-2">
                                                <GitBranch className="h-3 w-3" />
                                                {branch.name}
                                                {branch.protected && (
                                                    <Badge variant="outline" className="text-xs">
                                                        Protected
                                                    </Badge>
                                                )}
                                            </div>
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        )}
                    </div>
                </div>

                {/* Sync Status */}
                {selectedRepo && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="space-y-4"
                    >
                        <Separator />

                        {/* Status Banner */}
                        <div className="flex items-center justify-between p-4 rounded-lg border bg-muted/30">
                            <div className="flex items-center gap-4">
                                <div>
                                    <p className="text-sm text-muted-foreground">Sync Status</p>
                                    {isLoadingStatus ? (
                                        <Skeleton className="h-6 w-32 mt-1" />
                                    ) : status ? (
                                        <div className="flex items-center gap-2 mt-1">
                                            <Badge className={getSyncStatusColor(status.syncStatus)}>
                                                {getSyncStatusLabel(status.syncStatus, status.aheadBy, status.behindBy)}
                                            </Badge>
                                            <span className="text-xs text-muted-foreground">
                                                {status.recentCommits[0] && (
                                                    <>Last: {new Date(status.recentCommits[0].commit.author.date).toLocaleDateString()}</>
                                                )}
                                            </span>
                                        </div>
                                    ) : (
                                        <p className="text-sm mt-1">Unknown</p>
                                    )}
                                </div>
                            </div>

                            {/* Branch Info */}
                            <div className="text-right">
                                <p className="text-sm text-muted-foreground">Current Branch</p>
                                <p className="font-medium text-lg">{selectedBranch}</p>
                            </div>
                        </div>

                        {/* Quick Actions */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                            <Button
                                variant="outline"
                                className="flex items-center gap-2"
                                disabled={!status || status.behindBy === 0}
                            >
                                <Download className="h-4 w-4" />
                                Pull
                                {status && status.behindBy > 0 && (
                                    <Badge variant="secondary" className="ml-1">
                                        {status.behindBy}
                                    </Badge>
                                )}
                            </Button>

                            <Button
                                variant="outline"
                                className="flex items-center gap-2"
                                disabled={!status || status.aheadBy === 0}
                            >
                                <Upload className="h-4 w-4" />
                                Push
                                {status && status.aheadBy > 0 && (
                                    <Badge variant="secondary" className="ml-1">
                                        {status.aheadBy}
                                    </Badge>
                                )}
                            </Button>

                            <Button variant="outline" className="flex items-center gap-2">
                                <RefreshCw className="h-4 w-4" />
                                Fetch
                            </Button>

                            <Button variant="outline" className="flex items-center gap-2">
                                <GitPullRequest className="h-4 w-4" />
                                Sync
                            </Button>
                        </div>

                        {/* Stats Grid */}
                        {status && (
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <div className="space-y-1">
                                    <p className="text-xs text-muted-foreground">Total Branches</p>
                                    <p className="text-2xl font-bold">{status.totalBranches}</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-xs text-muted-foreground">Commits Ahead</p>
                                    <p className="text-2xl font-bold text-blue-400">{status.aheadBy}</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-xs text-muted-foreground">Commits Behind</p>
                                    <p className="text-2xl font-bold text-amber-400">{status.behindBy}</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-xs text-muted-foreground">Last Commit</p>
                                    <p className="text-sm font-medium truncate">
                                        {status.lastCommitAuthor || 'Unknown'}
                                    </p>
                                </div>
                            </div>
                        )}
                    </motion.div>
                )}
            </CardContent>
        </Card>
    );
}
