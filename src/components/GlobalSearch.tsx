/**
 * GlobalSearch Component
 * 
 * Unified search interface for repositories, files, gists, and actions.
 * Features:
 * - Tabbed search results
 * - Recent searches
 * - Filter by type
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
    Search,
    Github,
    FileText,
    Code2,
    Play,
    Loader2,
    LucideIcon
} from 'lucide-react';
import { useRepositories } from '@/hooks/github/useGitOperations';
import { useGists } from '@/hooks/github/useGistOperations';

export function GlobalSearch() {
    const navigate = useNavigate();
    const [query, setQuery] = useState('');
    const [activeTab, setActiveTab] = useState('all');

    // Fetch data
    const { data: repos, isLoading: isLoadingRepos } = useRepositories();
    const { data: gists, isLoading: isLoadingGists } = useGists('all');

    // Filter logic
    const filteredRepos = repos?.filter(repo =>
        repo.name.toLowerCase().includes(query.toLowerCase()) ||
        repo.description?.toLowerCase().includes(query.toLowerCase())
    ) || [];

    const filteredGists = gists?.filter(gist =>
        gist.description?.toLowerCase().includes(query.toLowerCase()) ||
        Object.keys(gist.files).some(f => f.toLowerCase().includes(query.toLowerCase()))
    ) || [];

    const hasResults = filteredRepos.length > 0 || filteredGists.length > 0;
    const isLoading = isLoadingRepos || isLoadingGists;

    const ResultItem = ({
        icon: Icon,
        title,
        subtitle,
        meta,
        onClick
    }: {
        icon: LucideIcon,
        title: string,
        subtitle?: string | null,
        meta?: string,
        onClick: () => void
    }) => (
        <div
            onClick={onClick}
            className="flex items-start gap-4 p-4 hover:bg-muted/50 rounded-lg cursor-pointer transition-colors border mb-2"
        >
            <div className="p-2 bg-muted rounded-md">
                <Icon className="h-5 w-5 text-muted-foreground" />
            </div>
            <div className="flex-1 min-w-0">
                <h4 className="font-medium truncate">{title}</h4>
                {subtitle && (
                    <p className="text-sm text-muted-foreground truncate">{subtitle}</p>
                )}
            </div>
            {meta && (
                <Badge variant="outline">{meta}</Badge>
            )}
        </div>
    );

    return (
        <div className="container mx-auto py-6 space-y-6 max-w-4xl">
            <div className="flex flex-col gap-4">
                <h1 className="text-3xl font-bold">Global Search</h1>
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search repositories, gists, and more..."
                        className="pl-10 h-12 text-lg"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        autoFocus
                    />
                </div>
            </div>

            <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="all">All Results</TabsTrigger>
                    <TabsTrigger value="repos">Repositories ({filteredRepos.length})</TabsTrigger>
                    <TabsTrigger value="gists">Gists ({filteredGists.length})</TabsTrigger>
                    <TabsTrigger value="actions" disabled>Actions (Coming Soon)</TabsTrigger>
                </TabsList>

                {/* Loading State */}
                {isLoading && (
                    <div className="flex justify-center p-12">
                        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    </div>
                )}

                {/* Empty State */}
                {!isLoading && !hasResults && query && (
                    <div className="text-center py-12 text-muted-foreground">
                        No results found for "{query}"
                    </div>
                )}

                {/* All Results Tab */}
                <TabsContent value="all" className="space-y-6 mt-6">
                    {!isLoading && hasResults && (
                        <>
                            {filteredRepos.length > 0 && (
                                <section>
                                    <h3 className="text-sm font-medium mb-3 text-muted-foreground uppercase tracking-wider">
                                        Repositories
                                    </h3>
                                    <div className="space-y-1">
                                        {filteredRepos.slice(0, 3).map(repo => (
                                            <ResultItem
                                                key={repo.id}
                                                icon={Github}
                                                title={repo.name}
                                                subtitle={repo.description}
                                                meta={repo.language}
                                                onClick={() => navigate(`/github/git/repos/${repo.owner.login}/${repo.name}`)}
                                            />
                                        ))}
                                    </div>
                                    {filteredRepos.length > 3 && (
                                        <Button variant="link" onClick={() => setActiveTab('repos')} className="mt-2">
                                            View all {filteredRepos.length} repositories
                                        </Button>
                                    )}
                                </section>
                            )}

                            {filteredGists.length > 0 && (
                                <section>
                                    <h3 className="text-sm font-medium mb-3 text-muted-foreground uppercase tracking-wider">
                                        Gists
                                    </h3>
                                    <div className="space-y-1">
                                        {filteredGists.slice(0, 3).map(gist => (
                                            <ResultItem
                                                key={gist.id}
                                                icon={FileText}
                                                title={Object.keys(gist.files)[0] || 'Untitled'}
                                                subtitle={gist.description || 'No description'}
                                                meta={Object.values(gist.files)[0]?.language}
                                                onClick={() => navigate(`/github/gists/${gist.id}`)}
                                            />
                                        ))}
                                    </div>
                                    {filteredGists.length > 3 && (
                                        <Button variant="link" onClick={() => setActiveTab('gists')} className="mt-2">
                                            View all {filteredGists.length} gists
                                        </Button>
                                    )}
                                </section>
                            )}
                        </>
                    )}
                </TabsContent>

                {/* Repos Tab */}
                <TabsContent value="repos" className="mt-6">
                    <ScrollArea className="h-[60vh]">
                        <div className="space-y-2">
                            {filteredRepos.map(repo => (
                                <ResultItem
                                    key={repo.id}
                                    icon={Github}
                                    title={repo.name}
                                    subtitle={repo.description}
                                    meta={repo.language}
                                    onClick={() => navigate(`/github/git/repos/${repo.owner.login}/${repo.name}`)}
                                />
                            ))}
                        </div>
                    </ScrollArea>
                </TabsContent>

                {/* Gists Tab */}
                <TabsContent value="gists" className="mt-6">
                    <ScrollArea className="h-[60vh]">
                        <div className="space-y-2">
                            {filteredGists.map(gist => (
                                <ResultItem
                                    key={gist.id}
                                    icon={FileText}
                                    title={Object.keys(gist.files)[0] || 'Untitled'}
                                    subtitle={gist.description || 'No description'}
                                    meta={Object.values(gist.files)[0]?.language}
                                    onClick={() => navigate(`/github/gists/${gist.id}`)}
                                />
                            ))}
                        </div>
                    </ScrollArea>
                </TabsContent>
            </Tabs>
        </div>
    );
}
