import { motion } from 'framer-motion';
import { GitCommit, User, Copy, Check } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useGitOperations } from '@/hooks/useGitOperations';
import { useState } from 'react';
import { toast } from '@/hooks/use-toast';
import { formatDistanceToNow } from 'date-fns';

interface CommitTimelineProps {
    owner: string;
    repo: string;
    branch: string;
}

export function CommitTimeline({ owner, repo, branch }: CommitTimelineProps) {
    const [copiedSha, setCopiedSha] = useState<string | null>(null);

    const { commits, isLoadingCommits } = useGitOperations({ owner, repo });

    const handleCopySha = (sha: string) => {
        navigator.clipboard.writeText(sha);
        setCopiedSha(sha);
        toast({
            title: 'Copied',
            description: 'Commit SHA copied to clipboard',
        });
        setTimeout(() => setCopiedSha(null), 2000);
    };

    if (isLoadingCommits) {
        return (
            <div className="space-y-4">
                {[1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className="flex gap-4">
                        <Skeleton className="h-10 w-10 rounded-full" />
                        <div className="flex-1 space-y-2">
                            <Skeleton className="h-4 w-3/4" />
                            <Skeleton className="h-3 w-1/2" />
                        </div>
                    </div>
                ))}
            </div>
        );
    }

    if (!commits || commits.length === 0) {
        return (
            <div className="text-center py-12 text-muted-foreground">
                <GitCommit className="h-16 w-16 mx-auto mb-4 opacity-50" />
                <p>No commits found for this branch</p>
            </div>
        );
    }

    return (
        <ScrollArea className="h-[600px] pr-4">
            <div className="space-y-4">
                {commits.map((commit, index) => (
                    <motion.div
                        key={commit.sha}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                    >
                        <Card className="p-4 hover:border-primary/50 transition-colors">
                            <div className="flex gap-4">
                                {/* Avatar */}
                                <Avatar className="h-10 w-10">
                                    <AvatarImage src={commit.author?.avatar_url} />
                                    <AvatarFallback>
                                        <User className="h-5 w-5" />
                                    </AvatarFallback>
                                </Avatar>

                                {/* Commit Info */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-start justify-between gap-2">
                                        <div className="flex-1 min-w-0">
                                            <p className="font-medium text-sm truncate">
                                                {commit.commit.message.split('\n')[0]}
                                            </p>
                                            <p className="text-xs text-muted-foreground mt-1">
                                                {commit.commit.author.name} committed{' '}
                                                {formatDistanceToNow(new Date(commit.commit.author.date), {
                                                    addSuffix: true,
                                                })}
                                            </p>
                                        </div>

                                        {/* Actions */}
                                        <div className="flex items-center gap-2">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="h-7 px-2 text-xs"
                                                onClick={() => handleCopySha(commit.sha)}
                                            >
                                                {copiedSha === commit.sha ? (
                                                    <Check className="h-3 w-3 mr-1" />
                                                ) : (
                                                    <Copy className="h-3 w-3 mr-1" />
                                                )}
                                                {commit.sha.substring(0, 7)}
                                            </Button>
                                        </div>
                                    </div>

                                    {/* Extended message */}
                                    {commit.commit.message.split('\n').slice(1).filter(Boolean).length > 0 && (
                                        <p className="text-xs text-muted-foreground mt-2 line-clamp-2">
                                            {commit.commit.message.split('\n').slice(1).join('\n').trim()}
                                        </p>
                                    )}

                                    {/* Stats */}
                                    <div className="flex items-center gap-2 mt-2">
                                        {commit.parents.length > 1 && (
                                            <Badge variant="outline" className="text-xs">
                                                Merge
                                            </Badge>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </Card>
                    </motion.div>
                ))}
            </div>
        </ScrollArea>
    );
}
