/**
 * BackupDashboard Component
 * 
 * Manage local repository backups.
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useBackups, useDeleteBackup } from '@/hooks/github/useBackupOperations';
import { useRepositories } from '@/hooks/github/useGitOperations';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Archive, Download, Trash2, Search, Plus, MoreVertical, FileArchive, Loader2 } from 'lucide-react';
import { formatDistanceToNow, parseISO, format } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { saveAs } from 'file-saver';

export function BackupDashboard() {
    const navigate = useNavigate();
    const [searchQuery, setSearchQuery] = useState('');
    const [createDialogOpen, setCreateDialogOpen] = useState(false);
    const [repoSearch, setRepoSearch] = useState('');

    const { data: backups, isLoading: isLoadingBackups } = useBackups();
    const deleteBackup = useDeleteBackup();
    const { data: repos, isLoading: isLoadingRepos } = useRepositories();

    const filteredBackups = backups?.filter(backup =>
        backup.repo.toLowerCase().includes(searchQuery.toLowerCase()) ||
        backup.fileName.toLowerCase().includes(searchQuery.toLowerCase())
    ) || [];

    const filteredRepos = repos?.filter(repo =>
        repo.full_name.toLowerCase().includes(repoSearch.toLowerCase())
    ) || [];

    const handleDelete = async (id: number) => {
        if (confirm('Are you sure you want to delete this backup record? This only removes the history entry, not the downloaded file.')) {
            deleteBackup.mutate(id);
        }
    };

    const formatSize = (bytes: number) => {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    return (
        <div className="container mx-auto py-6 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold flex items-center gap-2">
                        <Archive className="h-8 w-8" />
                        Backup Manager
                    </h1>
                    <p className="text-muted-foreground">
                        Create and manage local ZIP backups of your repositories.
                    </p>
                </div>
                <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
                    <DialogTrigger asChild>
                        <Button>
                            <Plus className="mr-2 h-4 w-4" />
                            New Backup
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                            <DialogTitle>Create New Backup</DialogTitle>
                            <DialogDescription>
                                Select a repository to create a backup. You will be redirected to the file explorer to confirm options.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                            <Input
                                placeholder="Search repositories..."
                                value={repoSearch}
                                onChange={(e) => setRepoSearch(e.target.value)}
                            />
                            <div className="max-h-[300px] overflow-y-auto space-y-2 border rounded-md p-2">
                                {isLoadingRepos ? (
                                    <div className="flex justify-center p-4">
                                        <Loader2 className="animate-spin h-6 w-6 text-muted-foreground" />
                                    </div>
                                ) : filteredRepos.length > 0 ? (
                                    filteredRepos.map(repo => (
                                        <div
                                            key={repo.id}
                                            className="flex items-center justify-between p-2 hover:bg-muted rounded-md cursor-pointer transition-colors"
                                            onClick={() => {
                                                setCreateDialogOpen(false);
                                                navigate(`/github/backup/${repo.owner.login}/${repo.name}`);
                                            }}
                                        >
                                            <span className="font-medium text-sm">{repo.full_name}</span>
                                            <Button variant="ghost" size="sm">Select</Button>
                                        </div>
                                    ))
                                ) : (
                                    <p className="text-center text-sm text-muted-foreground p-4">
                                        No repositories found
                                    </p>
                                )}
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>Cancel</Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">Total Backups</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{backups?.length || 0}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">Last Backup</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {backups && backups.length > 0 ? (
                                formatDistanceToNow(parseISO(backups[0].createdAt), { addSuffix: true })
                            ) : 'Never'}
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">Total Size Logged</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {formatSize(backups?.reduce((acc, curr) => acc + curr.size, 0) || 0)}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Backups List */}
            <Card>
                <CardHeader>
                    <CardTitle>History</CardTitle>
                    <CardDescription>
                        List of generated backups. Note: Files are downloaded to your local machine, this history just tracks the events.
                    </CardDescription>
                    <div className="pt-4">
                        <div className="relative">
                            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search backups..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-8"
                            />
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    {isLoadingBackups ? (
                        <div className="flex justify-center p-8">
                            <Loader2 className="animate-spin h-8 w-8 text-muted-foreground" />
                        </div>
                    ) : filteredBackups.length > 0 ? (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Repository</TableHead>
                                    <TableHead>File Name</TableHead>
                                    <TableHead>Size</TableHead>
                                    <TableHead>Files</TableHead>
                                    <TableHead>Date</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredBackups.map((backup) => (
                                    <TableRow key={backup.id}>
                                        <TableCell className="font-medium">
                                            <div className="flex flex-col">
                                                <span>{backup.owner}/{backup.repo}</span>
                                                <span className="text-xs text-muted-foreground">{backup.branch}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-xs font-mono bg-muted/50 p-1 rounded">
                                            {backup.fileName}
                                        </TableCell>
                                        <TableCell>{formatSize(backup.size)}</TableCell>
                                        <TableCell>{backup.fileCount}</TableCell>
                                        <TableCell>
                                            {format(parseISO(backup.createdAt), 'MMM dd, yyyy HH:mm')}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" className="h-8 w-8 p-0">
                                                        <MoreVertical className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuItem onClick={() => handleDelete(backup.id!)} className="text-destructive">
                                                        <Trash2 className="mr-2 h-4 w-4" />
                                                        Remove Record
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    ) : (
                        <div className="text-center py-10">
                            <FileArchive className="mx-auto h-12 w-12 text-muted-foreground mb-3" />
                            <h3 className="text-lg font-medium">No backups found</h3>
                            <p className="text-muted-foreground mb-4">Create your first repository backup to get started.</p>
                            <Button onClick={() => setCreateDialogOpen(true)}>Create Backup</Button>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
