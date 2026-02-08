import { useState } from 'react';
import { motion } from 'framer-motion';
import {
    FileText,
    Star,
    Copy,
    Trash2,
    ExternalLink,
    Lock,
    Globe,
    Search,
    Grid3x3,
    List,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useGists } from '@/hooks/useGists';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import type { GitHubGist } from '@/types/github';
import { formatDistanceToNow } from 'date-fns';

type ViewMode = 'grid' | 'list';

export function GistList() {
    const [viewMode, setViewMode] = useState<ViewMode>('grid');
    const [searchQuery, setSearchQuery] = useState('');
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [gistToDelete, setGistToDelete] = useState<string | null>(null);

    const { gists, isLoadingGists, deleteGist, isDeletingGist, starGist, unstarGist } =
        useGists();

    const filteredGists = gists.filter((gist) => {
        if (!searchQuery) return true;
        const searchLower = searchQuery.toLowerCase();
        return (
            gist.description?.toLowerCase().includes(searchLower) ||
            Object.keys(gist.files || {}).some((filename) =>
                filename.toLowerCase().includes(searchLower)
            )
        );
    });

    const handleCopyLink = (gist: GitHubGist) => {
        navigator.clipboard.writeText(gist.html_url);
        toast({
            title: 'Link copied',
            description: 'Gist URL copied to clipboard',
        });
    };

    const handleDeleteClick = (gistId: string) => {
        setGistToDelete(gistId);
        setDeleteDialogOpen(true);
    };

    const handleDeleteConfirm = () => {
        if (gistToDelete) {
            deleteGist(gistToDelete);
            setDeleteDialogOpen(false);
            setGistToDelete(null);
        }
    };

    const getFirstFile = (gist: GitHubGist) => {
        const files = gist.files || {};
        const firstFilename = Object.keys(files)[0];
        return firstFilename ? { name: firstFilename, ...files[firstFilename] } : null;
    };

    if (isLoadingGists) {
        return (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                    <Card key={i}>
                        <CardHeader>
                            <Skeleton className="h-6 w-3/4" />
                            <Skeleton className="h-4 w-1/2 mt-2" />
                        </CardHeader>
                        <CardContent>
                            <Skeleton className="h-20 w-full" />
                        </CardContent>
                    </Card>
                ))}
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* Header Controls */}
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search gists..."
                        className="pl-9"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>

                <div className="flex gap-2">
                    <Button
                        variant={viewMode === 'grid' ? 'default' : 'outline'}
                        size="icon"
                        onClick={() => setViewMode('grid')}
                    >
                        <Grid3x3 className="h-4 w-4" />
                    </Button>
                    <Button
                        variant={viewMode === 'list' ? 'default' : 'outline'}
                        size="icon"
                        onClick={() => setViewMode('list')}
                    >
                        <List className="h-4 w-4" />
                    </Button>
                </div>
            </div>

            {/* Gist List */}
            {filteredGists.length === 0 ? (
                <Card className="p-12">
                    <div className="text-center text-muted-foreground">
                        <FileText className="h-16 w-16 mx-auto mb-4 opacity-50" />
                        <p className="text-lg font-medium">
                            {searchQuery ? 'No gists found' : 'No gists yet'}
                        </p>
                        <p className="text-sm mt-2">
                            {searchQuery
                                ? 'Try a different search term'
                                : 'Create your first gist to get started'}
                        </p>
                    </div>
                </Card>
            ) : viewMode === 'grid' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredGists.map((gist, index) => {
                        const firstFile = getFirstFile(gist);
                        const fileCount = Object.keys(gist.files || {}).length;

                        return (
                            <motion.div
                                key={gist.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.05 }}
                            >
                                <Card className="h-full hover:border-primary/50 transition-all group">
                                    <CardHeader className="pb-3">
                                        <div className="flex items-start justify-between gap-2">
                                            <div className="flex-1 min-w-0">
                                                <CardTitle className="text-base truncate">
                                                    {firstFile?.name || 'Untitled'}
                                                </CardTitle>
                                                <CardDescription className="line-clamp-2 mt-1">
                                                    {gist.description || 'No description'}
                                                </CardDescription>
                                            </div>
                                            <div className="flex-shrink-0">
                                                {gist.public ? (
                                                    <Globe className="h-4 w-4 text-green-400" />
                                                ) : (
                                                    <Lock className="h-4 w-4 text-amber-400" />
                                                )}
                                            </div>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="space-y-3">
                                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                            <FileText className="h-3 w-3" />
                                            <span>{fileCount} {fileCount === 1 ? 'file' : 'files'}</span>
                                            <span>•</span>
                                            <span>
                                                {formatDistanceToNow(new Date(gist.created_at), { addSuffix: true })}
                                            </span>
                                        </div>

                                        <div className="flex items-center gap-1 flex-wrap">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="h-8"
                                                onClick={() => window.open(gist.html_url, '_blank')}
                                            >
                                                <ExternalLink className="h-3 w-3 mr-1" />
                                                View
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="h-8"
                                                onClick={() => handleCopyLink(gist)}
                                            >
                                                <Copy className="h-3 w-3 mr-1" />
                                                Copy
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="h-8 text-destructive hover:text-destructive"
                                                onClick={() => handleDeleteClick(gist.id)}
                                            >
                                                <Trash2 className="h-3 w-3" />
                                            </Button>
                                        </div>
                                    </CardContent>
                                </Card>
                            </motion.div>
                        );
                    })}
                </div>
            ) : (
                <ScrollArea className="h-[600px]">
                    <div className="space-y-2">
                        {filteredGists.map((gist) => {
                            const firstFile = getFirstFile(gist);
                            const fileCount = Object.keys(gist.files || {}).length;

                            return (
                                <Card key={gist.id} className="hover:border-primary/50 transition-all">
                                    <CardContent className="p-4">
                                        <div className="flex items-center justify-between gap-4">
                                            <div className="flex items-center gap-3 flex-1 min-w-0">
                                                <FileText className="h-5 w-5 flex-shrink-0 text-muted-foreground" />
                                                <div className="flex-1 min-w-0">
                                                    <h3 className="font-medium truncate">
                                                        {firstFile?.name || 'Untitled'}
                                                    </h3>
                                                    <p className="text-sm text-muted-foreground truncate">
                                                        {gist.description || 'No description'}
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-2 flex-shrink-0">
                                                <Badge variant="outline">
                                                    {fileCount} {fileCount === 1 ? 'file' : 'files'}
                                                </Badge>
                                                {gist.public ? (
                                                    <Badge variant="outline" className="border-green-500/50">
                                                        <Globe className="h-3 w-3 mr-1" />
                                                        Public
                                                    </Badge>
                                                ) : (
                                                    <Badge variant="outline" className="border-amber-500/50">
                                                        <Lock className="h-3 w-3 mr-1" />
                                                        Secret
                                                    </Badge>
                                                )}
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => handleCopyLink(gist)}
                                                >
                                                    <Copy className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => window.open(gist.html_url, '_blank')}
                                                >
                                                    <ExternalLink className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="text-destructive hover:text-destructive"
                                                    onClick={() => handleDeleteClick(gist.id)}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            );
                        })}
                    </div>
                </ScrollArea>
            )}

            {/* Delete Confirmation Dialog */}
            <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Gist?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete your gist from GitHub.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDeleteConfirm}
                            className="bg-destructive hover:bg-destructive/90"
                            disabled={isDeletingGist}
                        >
                            {isDeletingGist ? 'Deleting...' : 'Delete'}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
