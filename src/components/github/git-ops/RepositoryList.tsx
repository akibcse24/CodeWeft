import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useRepositories, useStarRepository, useUnstarRepository } from '@/hooks/github/useGitOperations';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Search, Star, GitFork, Eye, RefreshCw, ExternalLink, Code2, GitBranch } from 'lucide-react';
import { formatDistanceToNow, parseISO } from 'date-fns';
import type { GitHubRepository } from '@/types/github';

export function RepositoryList() {
    const { data: repositories, isLoading, error, refetch } = useRepositories();
    const [searchQuery, setSearchQuery] = useState('');
    const [sortBy, setSortBy] = useState<'updated' | 'stars' | 'name'>('updated');
    const [filterLanguage, setFilterLanguage] = useState<string>('all');

    const starRepo = useStarRepository();
    const unstarRepo = useUnstarRepository();

    // Filter and sort repositories
    const filteredRepos = repositories?.filter(repo => {
        const matchesSearch = repo.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            repo.description?.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesLanguage = filterLanguage === 'all' || repo.language === filterLanguage;
        return matchesSearch && matchesLanguage;
    }).sort((a, b) => {
        if (sortBy === 'stars') return b.stargazers_count - a.stargazers_count;
        if (sortBy === 'name') return a.name.localeCompare(b.name);
        return new Date(b.pushed_at).getTime() - new Date(a.pushed_at).getTime();
    });

    // Get unique languages for filter
    const languages = Array.from(
        new Set(repositories?.map(r => r.language).filter(Boolean) as string[])
    ).sort();

    const handleToggleStar = async (repo: GitHubRepository) => {
        //Note: GitHub API doesn't return starred status in repo list
        // We'd need a separate API call to check if starred
        // For now, just toggle assuming not starred
        await starRepo.mutateAsync({ owner: repo.owner.login, repo: repo.name });
    };

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center h-96 space-y-4">
                <p className="text-destructive">Failed to load repositories: {(error as Error).message}</p>
                <Button onClick={() => refetch()} variant="outline">
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Retry
                </Button>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold">Repositories</h1>
                    <p className="text-muted-foreground">
                        {filteredRepos?.length || 0} repositories
                    </p>
                </div>
                <Button onClick={() => refetch()} variant="outline" disabled={isLoading}>
                    <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                    Refresh
                </Button>
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search repositories..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10"
                    />
                </div>

                <Select value={sortBy} onValueChange={(value) => setSortBy(value as 'updated' | 'stars' | 'name')}>
                    <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Sort by" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="updated">Last updated</SelectItem>
                        <SelectItem value="stars">Most stars</SelectItem>
                        <SelectItem value="name">Name (A-Z)</SelectItem>
                    </SelectContent>
                </Select>

                <Select value={filterLanguage} onValueChange={setFilterLanguage}>
                    <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Language" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All languages</SelectItem>
                        {languages.map(lang => (
                            <SelectItem key={lang} value={lang}>{lang}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            {/* Repository Grid */}
            {isLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {Array.from({ length: 6 }).map((_, i) => (
                        <Card key={i}>
                            <CardHeader>
                                <Skeleton className="h-6 w-3/4" />
                                <Skeleton className="h-4 w-full" />
                            </CardHeader>
                            <CardContent>
                                <Skeleton className="h-4 w-1/2" />
                            </CardContent>
                        </Card>
                    ))}
                </div>
            ) : filteredRepos && filteredRepos.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredRepos.map(repo => (
                        <RepositoryCard
                            key={repo.id}
                            repo={repo}
                            onToggleStar={() => handleToggleStar(repo)}
                        />
                    ))}
                </div>
            ) : (
                <div className="text-center py-12">
                    <p className="text-muted-foreground">No repositories found</p>
                </div>
            )}
        </div>
    );
}

interface RepositoryCardProps {
    repo: GitHubRepository;
    onToggleStar: () => void;
}

function RepositoryCard({ repo, onToggleStar }: RepositoryCardProps) {
    const navigate = useNavigate();

    return (
        <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
                <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                        <CardTitle className="text-lg truncate flex items-center gap-2">
                            <a
                                href={repo.html_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="hover:underline flex items-center gap-2"
                            >
                                {repo.name}
                                <ExternalLink className="h-3 w-3" />
                            </a>
                        </CardTitle>
                        <CardDescription className="line-clamp-2 mt-1">
                            {repo.description || 'No description'}
                        </CardDescription>
                    </div>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={onToggleStar}
                        className="ml-2"
                    >
                        <Star className="h-4 w-4" />
                    </Button>
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                {/* Stats */}
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                        <Star className="h-4 w-4" />
                        {repo.stargazers_count}
                    </span>
                    <span className="flex items-center gap-1">
                        <GitFork className="h-4 w-4" />
                        {repo.forks_count}
                    </span>
                    <span className="flex items-center gap-1">
                        <Eye className="h-4 w-4" />
                        {repo.watchers_count}
                    </span>
                </div>

                {/* Language and visibility */}
                <div className="flex items-center gap-2 flex-wrap">
                    {repo.language && (
                        <Badge variant="secondary" className="text-xs">
                            {repo.language}
                        </Badge>
                    )}
                    <Badge variant={repo.private ? 'destructive' : 'default'} className="text-xs">
                        {repo.private ? 'Private' : 'Public'}
                    </Badge>
                </div>

                {/* Last updated */}
                <p className="text-xs text-muted-foreground">
                    Updated {formatDistanceToNow(parseISO(repo.pushed_at))} ago
                </p>

                {/* Action buttons */}
                <div className="grid grid-cols-2 gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigate(`/github/branches/${repo.owner.login}/${repo.name}`)}
                    >
                        <GitBranch className="mr-2 h-4 w-4" />
                        View Branches
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigate(`/github/editor/${repo.owner.login}/${repo.name}`)}
                    >
                        <Code2 className="mr-2 h-4 w-4" />
                        Open in Editor
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}
