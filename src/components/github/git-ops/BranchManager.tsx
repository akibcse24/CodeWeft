/**
 * BranchManager Component - Visual branch management
 * 
 * Features:
 * - List all branches with metadata
 * - Create new branches
 * - Switch between branches
 * - Merge branches
 * - Delete branches (with protection for default branch)
 */

import { useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { useRepository, useBranches, useCreateBranch, useDeleteBranch, useMergeBranches } from '@/hooks/github/useGitOperations';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
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
import { GitBranch, Plus, Trash2, GitMerge, CheckCircle, RefreshCw, Code2 } from 'lucide-react';
import { toast } from 'sonner';
import type { GitHubBranch } from '@/types/github';
import { formatDistanceToNow, parseISO } from 'date-fns';

export function BranchManager() {
    const { owner, repo } = useParams<{ owner: string; repo: string }>();
    const [searchParams, setSearchParams] = useSearchParams();
    const currentBranch = searchParams.get('branch') || 'main';

    const [searchQuery, setSearchQuery] = useState('');
    const [createDialogOpen, setCreateDialogOpen] = useState(false);
    const [newBranchName, setNewBranchName] = useState('');
    const [baseBranch, setBaseBranch] = useState(currentBranch);
    const [mergeDialogOpen, setMergeDialogOpen] = useState(false);
    const [sourceBranch, setSourceBranch] = useState('');
    const [targetBranch, setTargetBranch] = useState(currentBranch);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [branchToDelete, setBranchToDelete] = useState<string | null>(null);

    // Fetch data
    const { data: repository } = useRepository(owner!, repo!);
    const { data: branches, isLoading, error, refetch } = useBranches(owner!, repo!);

    // Mutations
    const createBranch = useCreateBranch();
    const deleteBranch = useDeleteBranch();
    const mergeBranches = useMergeBranches();

    // Filter branches
    const filteredBranches = branches?.filter(branch =>
        branch.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleCreateBranch = async () => {
        if (!owner || !repo || !newBranchName) return;

        try {
            await createBranch.mutateAsync({
                owner,
                repo,
                branchName: newBranchName,
                fromBranch: baseBranch,
            });
            setCreateDialogOpen(false);
            setNewBranchName('');
            toast.success(`Branch "${newBranchName}" created successfully`);
        } catch (error) {
            toast.error(`Failed to create branch: ${(error as Error).message}`);
        }
    };

    const handleDeleteBranch = async () => {
        if (!owner || !repo || !branchToDelete) return;

        try {
            await deleteBranch.mutateAsync({
                owner,
                repo,
                branchName: branchToDelete,
            });
            setDeleteDialogOpen(false);
            setBranchToDelete(null);
            toast.success(`Branch "${branchToDelete}" deleted successfully`);
        } catch (error) {
            toast.error(`Failed to delete branch: ${(error as Error).message}`);
        }
    };

    const handleMergeBranches = async () => {
        if (!owner || !repo || !sourceBranch || !targetBranch) return;

        try {
            await mergeBranches.mutateAsync({
                owner,
                repo,
                base: targetBranch,
                head: sourceBranch,
            });
            setMergeDialogOpen(false);
            setSourceBranch('');
            toast.success(`Merged "${sourceBranch}" into "${targetBranch}"`);
        } catch (error) {
            toast.error(`Failed to merge branches: ${(error as Error).message}`);
        }
    };

    const handleSwitchBranch = (branchName: string) => {
        setSearchParams({ branch: branchName });
        toast.success(`Switched to branch "${branchName}"`);
    };

    const confirmDelete = (branchName: string) => {
        if (branchName === repository?.default_branch) {
            toast.error(`Cannot delete default branch "${branchName}"`);
            return;
        }
        setBranchToDelete(branchName);
        setDeleteDialogOpen(true);
    };

    if (!owner || !repo) {
        return (
            <div className="container mx-auto py-6">
                <p className="text-destructive">Invalid repository parameters</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="container mx-auto py-6">
                <div className="flex flex-col items-center justify-center h-96 space-y-4">
                    <p className="text-destructive">Failed to load branches: {(error as Error).message}</p>
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
                <h1 className="text-3xl font-bold">Branch Manager</h1>
                <p className="text-muted-foreground">
                    {repository?.name} • {filteredBranches?.length || 0} branches
                </p>
            </div>

            {/* Actions Bar */}
            <div className="flex flex-col sm:flex-row gap-4">
                <Input
                    placeholder="Search branches..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="flex-1"
                />
                <div className="flex gap-2">
                    <Button onClick={() => setCreateDialogOpen(true)}>
                        <Plus className="mr-2 h-4 w-4" />
                        New Branch
                    </Button>
                    <Button onClick={() => setMergeDialogOpen(true)} variant="outline">
                        <GitMerge className="mr-2 h-4 w-4" />
                        Merge
                    </Button>
                    <Button onClick={() => refetch()} variant="outline" disabled={isLoading}>
                        <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                    </Button>
                </div>
            </div>

            {/* Branch List */}
            {isLoading ? (
                <div className="space-y-4">
                    {Array.from({ length: 5 }).map((_, i) => (
                        <Card key={i}>
                            <CardHeader>
                                <Skeleton className="h-6 w-48" />
                                <Skeleton className="h-4 w-full" />
                            </CardHeader>
                        </Card>
                    ))}
                </div>
            ) : filteredBranches && filteredBranches.length > 0 ? (
                <div className="space-y-4">
                    {filteredBranches.map((branch) => (
                        <BranchCard
                            key={branch.name}
                            branch={branch}
                            isDefault={branch.name === repository?.default_branch}
                            isCurrent={branch.name === currentBranch}
                            onSwitch={() => handleSwitchBranch(branch.name)}
                            onDelete={() => confirmDelete(branch.name)}
                            owner={owner}
                            repo={repo}
                        />
                    ))}
                </div>
            ) : (
                <div className="text-center py-12">
                    <p className="text-muted-foreground">No branches found</p>
                </div>
            )}

            {/* Create Branch Dialog */}
            <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Create New Branch</DialogTitle>
                        <DialogDescription>
                            Create a new branch from an existing branch
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div>
                            <label className="text-sm font-medium">Branch Name</label>
                            <Input
                                placeholder="feature/new-feature"
                                value={newBranchName}
                                onChange={(e) => setNewBranchName(e.target.value)}
                            />
                        </div>
                        <div>
                            <label className="text-sm font-medium">Create from</label>
                            <Select value={baseBranch} onValueChange={setBaseBranch}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {branches?.map((branch) => (
                                        <SelectItem key={branch.name} value={branch.name}>
                                            {branch.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
                            Cancel
                        </Button>
                        <Button onClick={handleCreateBranch} disabled={createBranch.isPending || !newBranchName}>
                            {createBranch.isPending ? 'Creating...' : 'Create Branch'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Merge Branches Dialog */}
            <Dialog open={mergeDialogOpen} onOpenChange={setMergeDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Merge Branches</DialogTitle>
                        <DialogDescription>
                            Merge one branch into another
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div>
                            <label className="text-sm font-medium">Source Branch (merge from)</label>
                            <Select value={sourceBranch} onValueChange={setSourceBranch}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select source branch" />
                                </SelectTrigger>
                                <SelectContent>
                                    {branches?.map((branch) => (
                                        <SelectItem key={branch.name} value={branch.name}>
                                            {branch.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div>
                            <label className="text-sm font-medium">Target Branch (merge into)</label>
                            <Select value={targetBranch} onValueChange={setTargetBranch}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {branches?.map((branch) => (
                                        <SelectItem key={branch.name} value={branch.name}>
                                            {branch.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        {sourceBranch && targetBranch && (
                            <div className="p-4 border rounded-lg bg-muted/50">
                                <p className="text-sm">
                                    <GitMerge className="inline h-4 w-4 mr-2" />
                                    Merge <Badge variant="secondary">{sourceBranch}</Badge> into <Badge>{targetBranch}</Badge>
                                </p>
                            </div>
                        )}
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setMergeDialogOpen(false)}>
                            Cancel
                        </Button>
                        <Button onClick={handleMergeBranches} disabled={mergeBranches.isPending || !sourceBranch}>
                            {mergeBranches.isPending ? 'Merging...' : 'Merge Branches'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation Dialog */}
            <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Branch</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to delete the branch "<strong>{branchToDelete}</strong>"?
                            This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDeleteBranch} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                            {deleteBranch.isPending ? 'Deleting...' : 'Delete'}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}

interface BranchCardProps {
    branch: GitHubBranch;
    isDefault: boolean;
    isCurrent: boolean;
    onSwitch: () => void;
    onDelete: () => void;
    owner: string;
    repo: string;
}

function BranchCard({ branch, isDefault, isCurrent, onSwitch, onDelete, owner, repo }: BranchCardProps) {
    return (
        <Card className={isCurrent ? 'border-primary' : ''}>
            <CardHeader>
                <div className="flex items-start justify-between">
                    <div className="flex-1">
                        <CardTitle className="flex items-center gap-2">
                            <GitBranch className="h-5 w-5" />
                            {branch.name}
                            {isCurrent && (
                                <Badge variant="default">
                                    <CheckCircle className="mr-1 h-3 w-3" />
                                    Current
                                </Badge>
                            )}
                            {isDefault && <Badge variant="secondary">Default</Badge>}
                        </CardTitle>
                        <CardDescription className="mt-2">
                            Last commit: {branch.commit.sha.substring(0, 7)} • {branch.commit.commit.message}
                        </CardDescription>
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                <div className="flex items-center gap-2">
                    {!isCurrent && (
                        <Button size="sm" onClick={onSwitch}>
                            Switch to Branch
                        </Button>
                    )}
                    <Button
                        size="sm"
                        variant="outline"
                        onClick={() => window.open(`/github/editor/${owner}/${repo}?branch=${branch.name}`, '_blank')}
                    >
                        <Code2 className="mr-2 h-4 w-4" />
                        Open in Editor
                    </Button>
                    {!isDefault && (
                        <Button size="sm" variant="outline" onClick={onDelete} className="text-destructive">
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                        </Button>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
