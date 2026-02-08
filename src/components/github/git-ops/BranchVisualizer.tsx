import { motion } from 'framer-motion';
import { GitBranch, Circle } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { useGitOperations } from '@/hooks/useGitOperations';
import { cn } from '@/lib/utils';

interface BranchVisualizerProps {
    owner: string;
    repo: string;
    currentBranch: string;
}

export function BranchVisualizer({ owner, repo, currentBranch }: BranchVisualizerProps) {
    const { branches, isLoadingBranches } = useGitOperations({ owner, repo });

    if (isLoadingBranches) {
        return (
            <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-16 w-full" />
                ))}
            </div>
        );
    }

    if (!branches || branches.length === 0) {
        return (
            <div className="text-center py-12 text-muted-foreground">
                <GitBranch className="h-16 w-16 mx-auto mb-4 opacity-50" />
                <p>No branches found</p>
            </div>
        );
    }

    // Sort branches: main/master first, then protected, then others
    const sortedBranches = [...branches].sort((a, b) => {
        if (a.name === 'main' || a.name === 'master') return -1;
        if (b.name === 'main' || b.name === 'master') return 1;
        if (a.protected && !b.protected) return -1;
        if (!a.protected && b.protected) return 1;
        return a.name.localeCompare(b.name);
    });

    return (
        <div className="space-y-4">
            <div className="space-y-2">
                {sortedBranches.map((branch, index) => {
                    const isCurrent = branch.name === currentBranch;
                    const isMain = branch.name === 'main' || branch.name === 'master';

                    return (
                        <motion.div
                            key={branch.name}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.05 }}
                            className={cn(
                                'relative flex items-center gap-4 p-4 rounded-lg border transition-all',
                                isCurrent
                                    ? 'bg-primary/10 border-primary/50 shadow-sm'
                                    : 'bg-card/50 hover:bg-card/80 hover:border-muted-foreground/30'
                            )}
                        >
                            {/* Branch Line Visualization */}
                            <div className="flex flex-col items-center gap-1">
                                <Circle
                                    className={cn(
                                        'h-3 w-3',
                                        isCurrent ? 'fill-primary text-primary' : 'fill-muted text-muted',
                                        isMain && 'fill-green-500 text-green-500'
                                    )}
                                />
                                {index < sortedBranches.length - 1 && (
                                    <div className="h-8 w-0.5 bg-muted" />
                                )}
                            </div>

                            {/* Branch Info */}
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                    <GitBranch
                                        className={cn(
                                            'h-4 w-4',
                                            isCurrent && 'text-primary',
                                            isMain && 'text-green-500'
                                        )}
                                    />
                                    <span
                                        className={cn(
                                            'font-medium',
                                            isCurrent && 'text-primary',
                                            isMain && 'text-green-500'
                                        )}
                                    >
                                        {branch.name}
                                    </span>

                                    {isCurrent && (
                                        <Badge variant="default" className="text-xs">
                                            Current
                                        </Badge>
                                    )}

                                    {branch.protected && (
                                        <Badge variant="outline" className="text-xs">
                                            Protected
                                        </Badge>
                                    )}

                                    {isMain && (
                                        <Badge variant="outline" className="text-xs border-green-500/50 text-green-500">
                                            Default
                                        </Badge>
                                    )}
                                </div>

                                <p className="text-xs text-muted-foreground mt-1">
                                    SHA: {branch.commit.sha.substring(0, 7)}
                                </p>
                            </div>

                            {/* Quick Actions (placeholder for future) */}
                            {!branch.protected && !isCurrent && (
                                <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                                    {/* Future: Switch, Delete buttons */}
                                </div>
                            )}
                        </motion.div>
                    );
                })}
            </div>
        </div>
    );
}
