/**
 * GistDashboard Component - Main gist management interface
 * 
 * Features:
 * - List all user gists
 * - Search and filter gists
 * - Create new gists
 * - View, edit, delete gists
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGists, useDeleteGist } from '@/hooks/github/useGistOperations';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
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
import {
    Code2,
    Plus,
    Search,
    RefreshCw,
    Eye,
    Edit,
    Trash2,
    Lock,
    Globe,
    ExternalLink,
    Copy,
} from 'lucide-react';
import { toast } from 'sonner';
import type { GitHubGist } from '@/types/github';
import { formatDistanceToNow, parseISO } from 'date-fns';

export function GistDashboard() {
    const navigate = useNavigate();
    const [filterType, setFilterType] = useState<'all' | 'public' | 'secret'>('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [gistToDelete, setGistToDelete] = useState<string | null>(null);

    const { data: gists, isLoading, error, refetch } = useGists(filterType);
    const deleteGist = useDeleteGist();

    // Filter gists by search query
    const filteredGists = gists?.filter(gist => {
        const searchLower = searchQuery.toLowerCase();
        const matchesDescription = gist.description?.toLowerCase().includes(searchLower);
        const matchesFilename = Object.keys(gist.files).some(filename =>
            filename.toLowerCase().includes(searchLower)
        );
        return matchesDescription || matchesFilename;
    });

    const handleDeleteGist = async () => {
        if (!gistToDelete) return;

        try {
            await deleteGist.mutateAsync(gistToDelete);
            setDeleteDialogOpen(false);
            setGistToDelete(null);
        } catch (error) {
            // Error handled by hook
        }
    };

    const confirmDelete = (gistId: string) => {
        setGistToDelete(gistId);
        setDeleteDialogOpen(true);
    };

    const handleCopyUrl = (gist: GitHubGist) => {
        navigator.clipboard.writeText(gist.html_url);
        toast.success('Gist URL copied to clipboard!');
    };

    if (error) {
        return (
            <div className="container mx-auto py-6">
                <div className="flex flex-col items-center justify-center h-96 space-y-4">
                    <p className="text-destructive">Failed to load gists: {(error as Error).message}</p>
                    <Button onClick={() => refetch()} variant="outline">
                        <RefreshCw className="mr-2 h-4 w-4" />
                        Retry
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="container mx-auto py-6 space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold">Gist Manager</h1>
                <p className="text-muted-foreground">
                    Manage your code snippets • {filteredGists?.length || 0} gists
                </p>
            </div>

            {/* Actions Bar */}
            <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search gists..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10"
                    />
                </div>
                <Select value={filterType} onValueChange={(value) => setFilterType(value as 'all' | 'public' | 'secret')}>
                    <SelectTrigger className="w-[180px]">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Gists</SelectItem>
                        <SelectItem value="public">Public Only</SelectItem>
                        <SelectItem value="secret">Secret Only</SelectItem>
                    </SelectContent>
                </Select>
                <Button onClick={() => navigate('/github/gists/new')}>
                    <Plus className="mr-2 h-4 w-4" />
                    New Gist
                </Button>
                <Button onClick={() => refetch()} variant="outline" disabled={isLoading}>
                    <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                </Button>
            </div>

            {/* Gist Grid */}
            {isLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {Array.from({ length: 6 }).map((_, i) => (
                        <Card key={i}>
                            <CardHeader>
                                <Skeleton className="h-6 w-3/4" />
                                <Skeleton className="h-4 w-full" />
                            </CardHeader>
                            <CardContent>
                                <Skeleton className="h-20 w-full" />
                            </CardContent>
                        </Card>
                    ))}
                </div>
            ) : filteredGists && filteredGists.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredGists.map((gist) => (
                        <GistCard
                            key={gist.id}
                            gist={gist}
                            onView={() => navigate(`/github/gists/${gist.id}`)}
                            onEdit={() => navigate(`/github/gists/${gist.id}/edit`)}
                            onDelete={() => confirmDelete(gist.id)}
                            onCopyUrl={() => handleCopyUrl(gist)}
                        />
                    ))}
                </div>
            ) : (
                <div className="text-center py-12">
                    <Code2 className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">No gists found</p>
                    <Button onClick={() => navigate('/github/gists/new')} className="mt-4">
                        Create Your First Gist
                    </Button>
                </div>
            )}

            {/* Delete Confirmation Dialog */}
            <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Gist</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to delete this gist? This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDeleteGist} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                            {deleteGist.isPending ? 'Deleting...' : 'Delete'}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}

interface GistCardProps {
    gist: GitHubGist;
    onView: () => void;
    onEdit: () => void;
    onDelete: () => void;
    onCopyUrl: () => void;
}

function GistCard({ gist, onView, onEdit, onDelete, onCopyUrl }: GistCardProps) {
    const fileCount = Object.keys(gist.files).length;
    const firstFile = Object.values(gist.files)[0];
    const firstFileName = Object.keys(gist.files)[0];

    // Get first few lines of the first file as preview
    const getPreview = () => {
        if (!firstFile?.content) return 'No content';
        const lines = firstFile.content.split('\n').slice(0, 3);
        return lines.join('\n');
    };

    return (
        <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
                <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                        <CardTitle className="text-lg truncate">
                            {gist.description || 'Untitled Gist'}
                        </CardTitle>
                        <CardDescription className="flex items-center gap-2 mt-1">
                            {gist.public ? (
                                <><Globe className="h-3 w-3" /> Public</>
                            ) : (
                                <><Lock className="h-3 w-3" /> Secret</>
                            )}
                            <span>•</span>
                            <span>{fileCount} {fileCount === 1 ? 'file' : 'files'}</span>
                        </CardDescription>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                {/* File preview */}
                <div className="bg-muted/50 p-3 rounded-md">
                    <p className="text-xs font-mono truncate mb-1 text-muted-foreground">
                        {firstFileName}
                    </p>
                    <pre className="text-xs font-mono overflow-hidden line-clamp-3 text-muted-foreground">
                        {getPreview()}
                    </pre>
                </div>

                {/* Metadata */}
                <div className="flex items-center gap-2 flex-wrap">
                    {firstFile?.language && (
                        <Badge variant="secondary" className="text-xs">
                            {firstFile.language}
                        </Badge>
                    )}
                    <span className="text-xs text-muted-foreground">
                        Updated {formatDistanceToNow(parseISO(gist.updated_at))} ago
                    </span>
                </div>

                {/* Action buttons */}
                <div className="grid grid-cols-2 gap-2">
                    <Button size="sm" variant="outline" onClick={onView}>
                        <Eye className="mr-2 h-4 w-4" />
                        View
                    </Button>
                    <Button size="sm" variant="outline" onClick={onEdit}>
                        <Edit className="mr-2 h-4 w-4" />
                        Edit
                    </Button>
                </div>

                <div className="grid grid-cols-2 gap-2">
                    <Button size="sm" variant="outline" onClick={onCopyUrl}>
                        <Copy className="mr-2 h-4 w-4" />
                        Copy URL
                    </Button>
                    <Button size="sm" variant="outline" onClick={onDelete} className="text-destructive">
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                    </Button>
                </div>

                {/* External link */}
                <a
                    href={gist.html_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-primary hover:underline flex items-center gap-1"
                >
                    View on GitHub
                    <ExternalLink className="h-3 w-3" />
                </a>
            </CardContent>
        </Card>
    );
}
