import { useState } from 'react';
import { motion } from 'framer-motion';
import { GitPullRequest, Download, Upload, CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { useQuery } from '@tanstack/react-query';
import { listUserRepositories } from '@/services/github/repository.service';
import { toast } from '@/hooks/use-toast';

type BatchAction = 'pull' | 'push' | 'fetch' | 'sync';

interface BatchOperationResult {
    repo: string;
    status: 'pending' | 'running' | 'success' | 'error';
    message?: string;
}

export function BatchOperations() {
    const [selectedRepos, setSelectedRepos] = useState<Set<string>>(new Set());
    const [isRunning, setIsRunning] = useState(false);
    const [results, setResults] = useState<BatchOperationResult[]>([]);
    const [currentAction, setCurrentAction] = useState<BatchAction | null>(null);
    const [progress, setProgress] = useState(0);

    const { data: repositories, isLoading } = useQuery({
        queryKey: ['user-repositories'],
        queryFn: () => listUserRepositories({ sort: 'updated', per_page: 50 }),
        staleTime: 5 * 60 * 1000,
    });

    const handleToggleRepo = (repoFullName: string) => {
        const newSelected = new Set(selectedRepos);
        if (newSelected.has(repoFullName)) {
            newSelected.delete(repoFullName);
        } else {
            newSelected.add(repoFullName);
        }
        setSelectedRepos(newSelected);
    };

    const handleSelectAll = () => {
        if (repositories) {
            if (selectedRepos.size === repositories.length) {
                setSelectedRepos(new Set());
            } else {
                setSelectedRepos(new Set(repositories.map((r) => r.full_name)));
            }
        }
    };

    const runBatchOperation = async (action: BatchAction) => {
        if (selectedRepos.size === 0) {
            toast({
                title: 'No repositories selected',
                description: 'Please select at least one repository',
                variant: 'destructive',
            });
            return;
        }

        setIsRunning(true);
        setCurrentAction(action);
        setProgress(0);

        const selectedList = Array.from(selectedRepos);
        const operationResults: BatchOperationResult[] = selectedList.map((repo) => ({
            repo,
            status: 'pending',
        }));

        setResults(operationResults);

        // Simulate batch operation (placeholder - implement real logic later)
        for (let i = 0; i < selectedList.length; i++) {
            const repo = selectedList[i];

            // Update status to running
            setResults((prev) =>
                prev.map((r) => (r.repo === repo ? { ...r, status: 'running' } : r))
            );

            // Simulate API call delay
            await new Promise((resolve) => setTimeout(resolve, 1500));

            // Mock success/failure (90% success rate)
            const isSuccess = Math.random() > 0.1;
            const status = isSuccess ? 'success' : 'error';
            const message = isSuccess
                ? `${action} completed successfully`
                : `Failed to ${action}: Network error`;

            setResults((prev) =>
                prev.map((r) =>
                    r.repo === repo
                        ? { ...r, status, message }
                        : r
                )
            );

            setProgress(((i + 1) / selectedList.length) * 100);
        }

        setIsRunning(false);
        toast({
            title: 'Batch operation complete',
            description: `Processed ${selectedList.length} repositories`,
        });
    };

    const successCount = results.filter((r) => r.status === 'success').length;
    const errorCount = results.filter((r) => r.status === 'error').length;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h2 className="text-2xl font-bold">Batch Operations</h2>
                <p className="text-sm text-muted-foreground">
                    Apply Git operations across multiple repositories at once
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Repository Selection */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center justify-between">
                            <span>Select Repositories</span>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={handleSelectAll}
                                disabled={isLoading || isRunning}
                            >
                                {selectedRepos.size === repositories?.length ? 'Deselect All' : 'Select All'}
                            </Button>
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ScrollArea className="h-[400px] pr-4">
                            {isLoading ? (
                                <div className="text-center py-8 text-muted-foreground">
                                    Loading repositories...
                                </div>
                            ) : repositories && repositories.length > 0 ? (
                                <div className="space-y-2">
                                    {repositories.map((repo) => (
                                        <div
                                            key={repo.id}
                                            className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-accent/50 transition-colors"
                                        >
                                            <Checkbox
                                                checked={selectedRepos.has(repo.full_name)}
                                                onCheckedChange={() => handleToggleRepo(repo.full_name)}
                                                disabled={isRunning}
                                            />
                                            <div className="flex-1 min-w-0">
                                                <p className="font-medium text-sm truncate">{repo.name}</p>
                                                <p className="text-xs text-muted-foreground truncate">
                                                    {repo.description || 'No description'}
                                                </p>
                                            </div>
                                            {repo.private && (
                                                <Badge variant="outline" className="text-xs">
                                                    Private
                                                </Badge>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-8 text-muted-foreground">
                                    No repositories found
                                </div>
                            )}
                        </ScrollArea>

                        <div className="mt-4 p-3 bg-muted/50 rounded-lg">
                            <p className="text-sm text-muted-foreground">
                                Selected: <span className="font-semibold text-foreground">{selectedRepos.size}</span>{' '}
                                repositories
                            </p>
                        </div>
                    </CardContent>
                </Card>

                {/* Actions & Results */}
                <Card>
                    <CardHeader>
                        <CardTitle>Actions</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {/* Action Buttons */}
                        <div className="grid grid-cols-2 gap-2">
                            <Button
                                onClick={() => runBatchOperation('pull')}
                                disabled={isRunning || selectedRepos.size === 0}
                                className="flex items-center gap-2"
                            >
                                <Download className="h-4 w-4" />
                                Pull All
                            </Button>
                            <Button
                                onClick={() => runBatchOperation('push')}
                                disabled={isRunning || selectedRepos.size === 0}
                                className="flex items-center gap-2"
                            >
                                <Upload className="h-4 w-4" />
                                Push All
                            </Button>
                            <Button
                                onClick={() => runBatchOperation('fetch')}
                                disabled={isRunning || selectedRepos.size === 0}
                                variant="outline"
                                className="flex items-center gap-2"
                            >
                                <Download className="h-4 w-4" />
                                Fetch All
                            </Button>
                            <Button
                                onClick={() => runBatchOperation('sync')}
                                disabled={isRunning || selectedRepos.size === 0}
                                variant="outline"
                                className="flex items-center gap-2"
                            >
                                <GitPullRequest className="h-4 w-4" />
                                Sync All
                            </Button>
                        </div>

                        {/* Progress */}
                        {isRunning && (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="space-y-2"
                            >
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-muted-foreground">
                                        Running {currentAction}...
                                    </span>
                                    <span className="font-medium">{Math.round(progress)}%</span>
                                </div>
                                <Progress value={progress} />
                            </motion.div>
                        )}

                        <Separator />

                        {/* Results */}
                        {results.length > 0 && (
                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <h4 className="font-semibold text-sm">Results</h4>
                                    <div className="flex items-center gap-2 text-xs">
                                        <span className="flex items-center gap-1 text-green-500">
                                            <CheckCircle2 className="h-3 w-3" />
                                            {successCount}
                                        </span>
                                        <span className="flex items-center gap-1 text-red-500">
                                            <XCircle className="h-3 w-3" />
                                            {errorCount}
                                        </span>
                                    </div>
                                </div>

                                <ScrollArea className="h-[200px] pr-4">
                                    <div className="space-y-2">
                                        {results.map((result) => (
                                            <motion.div
                                                key={result.repo}
                                                initial={{ opacity: 0, x: -10 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                className="flex items-start gap-2 p-2 rounded border"
                                            >
                                                {result.status === 'pending' && (
                                                    <div className="h-4 w-4 rounded-full bg-muted" />
                                                )}
                                                {result.status === 'running' && (
                                                    <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
                                                )}
                                                {result.status === 'success' && (
                                                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                                                )}
                                                {result.status === 'error' && (
                                                    <XCircle className="h-4 w-4 text-red-500" />
                                                )}

                                                <div className="flex-1 min-w-0">
                                                    <p className="font-medium text-xs truncate">
                                                        {result.repo.split('/')[1]}
                                                    </p>
                                                    {result.message && (
                                                        <p className="text-xs text-muted-foreground">
                                                            {result.message}
                                                        </p>
                                                    )}
                                                </div>
                                            </motion.div>
                                        ))}
                                    </div>
                                </ScrollArea>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
