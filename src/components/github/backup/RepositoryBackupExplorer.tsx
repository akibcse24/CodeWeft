/**
 * RepositoryBackupExplorer Component
 * 
 * Explore repository files and trigger backups
 */

import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useRepositoryTree } from '@/hooks/github/useGitOperations';
import { useCreateBackup } from '@/hooks/github/useBackupOperations';
import { useRepository } from '@/hooks/github/useGitOperations';
import { FileTree } from '@/components/github/editor/FileTree';
import { buildFileTree, FileNode } from '@/components/github/editor/file-tree-utils';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Download, Loader2, GitBranch, Archive } from 'lucide-react';
import { format } from 'date-fns';

export function RepositoryBackupExplorer() {
    const { owner, repo } = useParams<{ owner: string; repo: string }>();
    const navigate = useNavigate();
    const [backupProgress, setBackupProgress] = useState(0);
    const [currentFile, setCurrentFile] = useState('');

    // Default branch 'main' for now, ideally fetch default branch
    const { data: repository } = useRepository(owner!, repo!);
    const defaultBranch = repository?.default_branch || 'main';

    const { data: tree, isLoading: isLoadingTree } = useRepositoryTree(owner!, repo!, defaultBranch);
    const createBackup = useCreateBackup();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const fileTree = tree ? buildFileTree(tree as any[]) : [];

    const handleBackup = () => {
        if (!owner || !repo) return;

        setBackupProgress(0);
        createBackup.mutate({
            owner,
            repo,
            branch: defaultBranch,
            onProgress: (progress, file) => {
                setBackupProgress(progress);
                setCurrentFile(file);
            }
        });
    };

    const handleFileSelect = (node: FileNode) => {
        // Maybe preview file? For now, do nothing or show info
        // File selection handled silently
    };

    if (!owner || !repo) return <div className="p-10 text-center">Invalid Repository URL</div>;

    return (
        <div className="container mx-auto py-6 space-y-6 h-[cal(100vh-4rem)] flex flex-col">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" onClick={() => navigate('/github/backup')}>
                    <ArrowLeft className="h-4 w-4" />
                </Button>
                <div>
                    <h1 className="text-2xl font-bold flex items-center gap-2">
                        <Archive className="h-6 w-6" />
                        {owner}/{repo}
                    </h1>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                        <GitBranch className="h-3 w-3" />
                        <span>{defaultBranch}</span>
                        {tree && <Badge variant="outline" className="ml-2">{tree.length} files</Badge>}
                    </div>
                </div>
                <div className="ml-auto">
                    <Button onClick={handleBackup} disabled={createBackup.isPending || isLoadingTree}>
                        {createBackup.isPending ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Backing Up...
                            </>
                        ) : (
                            <>
                                <Download className="mr-2 h-4 w-4" />
                                Download Backup
                            </>
                        )}
                    </Button>
                </div>
            </div>

            {/* Progress Bar */}
            {createBackup.isPending && (
                <Card className="border-blue-200 bg-blue-50 dark:bg-blue-950/20 dark:border-blue-900">
                    <CardContent className="pt-6">
                        <div className="mb-2 flex justify-between text-sm">
                            <span className="font-medium text-blue-700 dark:text-blue-300">Creating ZIP Archive...</span>
                            <span className="text-blue-700 dark:text-blue-300">{backupProgress}%</span>
                        </div>
                        <Progress value={backupProgress} className="h-2" />
                        <p className="text-xs text-muted-foreground mt-2 truncate">
                            Processing: {currentFile}
                        </p>
                    </CardContent>
                </Card>
            )}

            {/* File Explorer */}
            <Card className="flex-1 flex flex-col min-h-0">
                <CardHeader className="py-3 border-b">
                    <CardTitle className="text-sm font-medium">Repository Explorer</CardTitle>
                </CardHeader>
                <CardContent className="flex-1 p-0 overflow-hidden relative">
                    {isLoadingTree ? (
                        <div className="absolute inset-0 flex items-center justify-center bg-background/50 z-10">
                            <div className="flex flex-col items-center gap-2">
                                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                                <p className="text-sm text-muted-foreground">Fetching file list...</p>
                            </div>
                        </div>
                    ) : (
                        <FileTree
                            files={fileTree}
                            onFileSelect={handleFileSelect}
                        />
                    )}
                </CardContent>
                <CardFooter className="py-2 border-t text-xs text-muted-foreground bg-muted/20">
                    Files are fetched directly from GitHub API. Large repositories may take time.
                </CardFooter>
            </Card>
        </div>
    );
}
