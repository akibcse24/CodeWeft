/**
 * GistViewer Component - View a single gist
 * 
 * Features:
 * - Display gist content with syntax highlighting
 * - Multiple file tabs
 * - Copy code to clipboard
 * - Edit/delete/fork actions
 */

import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useGist, useDeleteGist, useForkGist } from '@/hooks/github/useGistOperations';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
    ArrowLeft,
    Edit,
    Trash2,
    Copy,
    ExternalLink,
    Globe,
    Lock,
    GitFork,
    Check,
} from 'lucide-react';
import { toast } from 'sonner';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark, oneLight } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { useTheme } from "@/hooks/use-theme";
import { formatDistanceToNow, parseISO } from 'date-fns';

export function GistViewer() {
    const { gistId } = useParams<{ gistId: string }>();
    const navigate = useNavigate();
    const { theme } = useTheme();
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [copiedFile, setCopiedFile] = useState<string | null>(null);
    const [selectedFile, setSelectedFile] = useState<string | null>(null);

    const { data: gist, isLoading, error } = useGist(gistId || '');
    const deleteGist = useDeleteGist();
    const forkGist = useForkGist();

    const handleDelete = async () => {
        if (!gistId) return;

        try {
            await deleteGist.mutateAsync(gistId);
            navigate('/github/gists');
        } catch (error) {
            // Error handled by hook
        }
    };

    const handleFork = async () => {
        if (!gistId) return;

        try {
            const forked = await forkGist.mutateAsync(gistId);
            toast.success('Gist forked successfully!');
            navigate(`/github/gists/${forked.id}`);
        } catch (error) {
            // Error handled by hook
        }
    };

    const handleCopyFile = (filename: string, content: string) => {
        navigator.clipboard.writeText(content);
        setCopiedFile(filename);
        toast.success(`Copied ${filename} to clipboard!`);
        setTimeout(() => setCopiedFile(null), 2000);
    };

    const handleCopyUrl = () => {
        if (!gist) return;
        const normalUrl = `https://gist.github.com/${gist.owner?.login || 'anonymous'}/${gist.id}`;
        navigator.clipboard.writeText(normalUrl);
        toast.success('Gist URL copied to clipboard!');
    };

    const handleCopyRawUrl = () => {
        if (!gist || !selectedFile) return;
        const rawUrl = `https://gist.githubusercontent.com/${gist.owner?.login || 'anonymous'}/${gist.id}/raw/${selectedFile}`;
        navigator.clipboard.writeText(rawUrl);
        toast.success('Raw URL copied to clipboard!');
    };

    if (isLoading) {
        return (
            <div className="container mx-auto py-6">
                <p>Loading gist...</p>
            </div>
        );
    }

    if (error || !gist) {
        return (
            <div className="container mx-auto py-6">
                <p className="text-destructive">Failed to load gist</p>
                <Button onClick={() => navigate('/github/gists')} className="mt-4">
                    Back to Gists
                </Button>
            </div>
        );
    }

    const files = Object.entries(gist.files);

    return (
        <div className="container mx-auto py-6 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex-1">
                    <div className="flex items-center gap-2">
                        <Button variant="ghost" size="icon" onClick={() => navigate('/github/gists')}>
                            <ArrowLeft className="h-4 w-4" />
                        </Button>
                        <div>
                            <h1 className="text-3xl font-bold">
                                {gist.description || 'Untitled Gist'}
                            </h1>
                            <div className="flex items-center gap-2 mt-1">
                                {gist.public ? (
                                    <Badge variant="default">
                                        <Globe className="mr-1 h-3 w-3" />
                                        Public
                                    </Badge>
                                ) : (
                                    <Badge variant="secondary">
                                        <Lock className="mr-1 h-3 w-3" />
                                        Secret
                                    </Badge>
                                )}
                                <span className="text-sm text-muted-foreground">
                                    Created {formatDistanceToNow(parseISO(gist.created_at))} ago
                                </span>
                                <span className="text-sm text-muted-foreground">•</span>
                                <span className="text-sm text-muted-foreground">
                                    {files.length} {files.length === 1 ? 'file' : 'files'}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Action buttons */}
                <div className="flex items-center gap-2">
                    <Button variant="outline" onClick={handleCopyUrl}>
                        <Copy className="mr-2 h-4 w-4" />
                        Copy URL
                    </Button>
                    <Button variant="outline" onClick={handleCopyRawUrl} disabled={!selectedFile}>
                        <Copy className="mr-2 h-4 w-4" />
                        Copy Raw URL
                    </Button>
                    <Button variant="outline" onClick={handleFork}>
                        <GitFork className="mr-2 h-4 w-4" />
                        Fork
                    </Button>
                    <Button variant="outline" onClick={() => navigate(`/github/gists/${gistId}/edit`)}>
                        <Edit className="mr-2 h-4 w-4" />
                        Edit
                    </Button>
                    <Button variant="outline" onClick={() => setDeleteDialogOpen(true)} className="text-destructive">
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                    </Button>
                    <a href={gist.html_url} target="_blank" rel="noopener noreferrer">
                        <Button variant="outline">
                            <ExternalLink className="mr-2 h-4 w-4" />
                            GitHub
                        </Button>
                    </a>
                </div>
            </div>

            {/* Files */}
            <Card>
                <CardHeader>
                    <CardTitle>Files</CardTitle>
                    <CardDescription>
                        {gist.owner && `Created by ${gist.owner.login}`}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Tabs defaultValue={files[0]?.[0]} className="w-full" onValueChange={setSelectedFile}>
                        <TabsList className="w-full justify-start overflow-x-auto">
                            {files.map(([filename]) => (
                                <TabsTrigger key={filename} value={filename}>
                                    {filename}
                                </TabsTrigger>
                            ))}
                        </TabsList>

                        {files.map(([filename, file]) => (
                            <TabsContent key={filename} value={filename} className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <h3 className="font-mono text-sm">{filename}</h3>
                                        {file.language && (
                                            <Badge variant="secondary">{file.language}</Badge>
                                        )}
                                    </div>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handleCopyFile(filename, file.content || '')}
                                    >
                                        {copiedFile === filename ? (
                                            <><Check className="mr-2 h-4 w-4" /> Copied</>
                                        ) : (
                                            <><Copy className="mr-2 h-4 w-4" /> Copy</>
                                        )}
                                    </Button>
                                </div>

                                <div className="border rounded-md overflow-hidden">
                                    <SyntaxHighlighter
                                        language={file.language?.toLowerCase() || 'text'}
                                        style={theme === 'dark' ? oneDark : oneLight}
                                        showLineNumbers
                                        customStyle={{
                                            margin: 0,
                                            borderRadius: 0,
                                            fontSize: '14px',
                                        }}
                                    >
                                        {file.content || ''}
                                    </SyntaxHighlighter>
                                </div>
                            </TabsContent>
                        ))}
                    </Tabs>
                </CardContent>
            </Card>

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
                        <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                            {deleteGist.isPending ? 'Deleting...' : 'Delete'}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
