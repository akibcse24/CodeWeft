import { useState } from 'react';
import {
    Download,
    Trash2,
    Package,
    HardDrive,
    Calendar,
    Loader2,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
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
    AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    listWorkflowArtifacts,
    downloadArtifact,
    deleteArtifact,
} from '@/services/github/actions.service';
import { useToast } from '@/hooks/use-toast';
import { formatDistanceToNow } from 'date-fns';

interface ArtifactDownloaderProps {
    owner: string;
    repo: string;
    runId: number;
}

export function ArtifactDownloader({ owner, repo, runId }: ArtifactDownloaderProps) {
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const [downloadingId, setDownloadingId] = useState<number | null>(null);
    const [deletingId, setDeletingId] = useState<number | null>(null);

    // Fetch artifacts
    const { data: artifacts, isLoading } = useQuery({
        queryKey: ['workflow-artifacts', owner, repo, runId],
        queryFn: () => listWorkflowArtifacts(owner, repo, runId),
    });

    // Delete mutation
    const deleteMutation = useMutation({
        mutationFn: (artifactId: number) => deleteArtifact(owner, repo, artifactId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['workflow-artifacts', owner, repo, runId] });
            toast({
                title: 'Artifact deleted',
                description: 'Artifact has been permanently removed',
            });
            setDeletingId(null);
        },
        onError: (error: Error) => {
            toast({
                title: 'Failed to delete artifact',
                description: error.message,
                variant: 'destructive',
            });
            setDeletingId(null);
        },
    });

    const handleDownload = async (artifactId: number, name: string) => {
        try {
            setDownloadingId(artifactId);
            const data = await downloadArtifact(owner, repo, artifactId);
            const blob = new Blob([data], { type: 'application/zip' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${name}.zip`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
            toast({
                title: 'Download started',
                description: `Downloading artifact: ${name}`,
            });
        } catch (error) {
            toast({
                title: 'Download failed',
                description: 'Could not download artifact',
                variant: 'destructive',
            });
        } finally {
            setDownloadingId(null);
        }
    };

    const handleDelete = (artifactId: number) => {
        setDeletingId(artifactId);
        deleteMutation.mutate(artifactId);
    };

    if (isLoading) {
        return (
            <Card>
                <CardHeader>
                    <Skeleton className="h-6 w-1/3" />
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {[1, 2, 3].map((i) => (
                            <Skeleton key={i} className="h-16 w-full" />
                        ))}
                    </div>
                </CardContent>
            </Card>
        );
    }

    if (!artifacts || artifacts.length === 0) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg">Artifacts</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="text-center py-8 text-muted-foreground">
                        <Package className="h-12 w-12 mx-auto mb-3 opacity-50" />
                        <p>No artifacts produced by this run</p>
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-lg flex items-center justify-between">
                    <span>Artifacts ({artifacts.length})</span>
                    <span className="text-xs font-normal text-muted-foreground">
                        Total size: {calculateTotalSize(artifacts)}
                    </span>
                </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
                <ScrollArea className="h-[300px]">
                    <div className="divide-y divide-border">
                        {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                        {artifacts.map((artifact: any) => (
                            <div key={artifact.id} className="p-4 flex items-center justify-between hover:bg-muted/50 transition-colors">
                                <div className="flex items-start gap-3">
                                    <Package className="h-5 w-5 text-blue-400 mt-1" />
                                    <div>
                                        <h4 className="font-medium text-sm">{artifact.name}</h4>
                                        <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                                            <span className="flex items-center gap-1">
                                                <HardDrive className="h-3 w-3" />
                                                {formatFileSize(artifact.size_in_bytes)}
                                            </span>
                                            <span>•</span>
                                            <span className="flex items-center gap-1">
                                                <Calendar className="h-3 w-3" />
                                                {formatDistanceToNow(new Date(artifact.created_at), { addSuffix: true })}
                                            </span>
                                        </div>
                                        {artifact.expired && (
                                            <span className="text-xs text-red-400 font-medium mt-1 block">
                                                Expired
                                            </span>
                                        )}
                                    </div>
                                </div>

                                <div className="flex items-center gap-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handleDownload(artifact.id, artifact.name)}
                                        disabled={artifact.expired || downloadingId === artifact.id}
                                    >
                                        {downloadingId === artifact.id ? (
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                        ) : (
                                            <Download className="h-4 w-4" />
                                        )}
                                    </Button>

                                    <AlertDialog>
                                        <AlertDialogTrigger asChild>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="text-destructive hover:text-destructive hover:bg-destructive/10"
                                                disabled={deletingId === artifact.id}
                                            >
                                                {deletingId === artifact.id ? (
                                                    <Loader2 className="h-4 w-4 animate-spin" />
                                                ) : (
                                                    <Trash2 className="h-4 w-4" />
                                                )}
                                            </Button>
                                        </AlertDialogTrigger>
                                        <AlertDialogContent>
                                            <AlertDialogHeader>
                                                <AlertDialogTitle>Delete Artifact?</AlertDialogTitle>
                                                <AlertDialogDescription>
                                                    Are you sure you want to delete "{artifact.name}"? This action cannot be undone.
                                                </AlertDialogDescription>
                                            </AlertDialogHeader>
                                            <AlertDialogFooter>
                                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                <AlertDialogAction
                                                    onClick={() => handleDelete(artifact.id)}
                                                    className="bg-destructive hover:bg-destructive/90"
                                                >
                                                    Delete
                                                </AlertDialogAction>
                                            </AlertDialogFooter>
                                        </AlertDialogContent>
                                    </AlertDialog>
                                </div>
                            </div>
                        ))}
                    </div>
                </ScrollArea>
            </CardContent>
        </Card>
    );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function calculateTotalSize(artifacts: any[]) {
    const total = artifacts.reduce((acc, curr) => acc + curr.size_in_bytes, 0);
    return formatFileSize(total);
}

function formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}
