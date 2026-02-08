import { useState } from 'react';
import { motion } from 'framer-motion';
import { Save, Trash2, RotateCcw, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { toast } from '@/hooks/use-toast';
import { formatDistanceToNow } from 'date-fns';

interface SnapshotSystemProps {
    owner: string;
    repo: string;
    branch: string;
}

interface Snapshot {
    id: string;
    name: string;
    description: string;
    commitSha: string;
    createdAt: Date;
    tags: string[];
}

export function SnapshotSystem({ owner, repo, branch }: SnapshotSystemProps) {
    const [snapshots, setSnapshots] = useState<Snapshot[]>([]);
    const [isCreating, setIsCreating] = useState(false);
    const [newSnapshot, setNewSnapshot] = useState({
        name: '',
        description: '',
    });

    // Placeholder: In real implementation, fetch from Supabase
    // const { data: snapshots } = useQuery(['snapshots', owner, repo]);

    const handleCreateSnapshot = async () => {
        if (!newSnapshot.name.trim()) {
            toast({
                title: 'Name required',
                description: 'Please enter a snapshot name',
                variant: 'destructive',
            });
            return;
        }

        // Placeholder: Get current commit SHA from API
        const mockSha = 'abc123def456';

        const snapshot: Snapshot = {
            id: Math.random().toString(36).substring(7),
            name: newSnapshot.name,
            description: newSnapshot.description,
            commitSha: mockSha,
            createdAt: new Date(),
            tags: [],
        };

        setSnapshots([snapshot, ...snapshots]);
        setNewSnapshot({ name: '', description: '' });
        setIsCreating(false);

        toast({
            title: 'Snapshot created',
            description: `Created snapshot "${snapshot.name}"`,
        });
    };

    const handleDeleteSnapshot = (id: string) => {
        setSnapshots(snapshots.filter((s) => s.id !== id));
        toast({
            title: 'Snapshot deleted',
            description: 'Snapshot has been removed',
        });
    };

    const handleRestoreSnapshot = (snapshot: Snapshot) => {
        toast({
            title: 'Restore initiated',
            description: `Restoring to snapshot "${snapshot.name}"...`,
        });
        // Placeholder: Implement restore logic using git.service.ts
    };

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-lg font-semibold">Snapshots</h3>
                    <p className="text-sm text-muted-foreground">
                        Create restore points before making risky changes
                    </p>
                </div>

                <Dialog open={isCreating} onOpenChange={setIsCreating}>
                    <DialogTrigger asChild>
                        <Button>
                            <Plus className="mr-2 h-4 w-4" />
                            Create Snapshot
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Create New Snapshot</DialogTitle>
                            <DialogDescription>
                                Create a restore point at the current commit
                            </DialogDescription>
                        </DialogHeader>

                        <div className="space-y-4 py-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Name *</label>
                                <Input
                                    placeholder="e.g., Before refactoring"
                                    value={newSnapshot.name}
                                    onChange={(e) =>
                                        setNewSnapshot({ ...newSnapshot, name: e.target.value })
                                    }
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium">Description</label>
                                <Textarea
                                    placeholder="Optional details about this snapshot..."
                                    value={newSnapshot.description}
                                    onChange={(e) =>
                                        setNewSnapshot({ ...newSnapshot, description: e.target.value })
                                    }
                                    rows={3}
                                />
                            </div>
                        </div>

                        <DialogFooter>
                            <Button variant="outline" onClick={() => setIsCreating(false)}>
                                Cancel
                            </Button>
                            <Button onClick={handleCreateSnapshot}>Create</Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>

            {/* Snapshot List */}
            {snapshots.length === 0 ? (
                <Card className="p-12 text-center bg-card/50">
                    <Save className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                    <h4 className="font-semibold mb-2">No snapshots yet</h4>
                    <p className="text-sm text-muted-foreground mb-4">
                        Create your first snapshot to enable safe rollbacks
                    </p>
                </Card>
            ) : (
                <div className="space-y-2">
                    {snapshots.map((snapshot, index) => (
                        <motion.div
                            key={snapshot.id}
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.05 }}
                        >
                            <Card className="p-4 hover:border-primary/50 transition-colors">
                                <div className="flex items-start justify-between gap-4">
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                            <h4 className="font-semibold">{snapshot.name}</h4>
                                            <Badge variant="outline" className="text-xs">
                                                {snapshot.commitSha.substring(0, 7)}
                                            </Badge>
                                        </div>

                                        {snapshot.description && (
                                            <p className="text-sm text-muted-foreground mb-2">
                                                {snapshot.description}
                                            </p>
                                        )}

                                        <p className="text-xs text-muted-foreground">
                                            Created{' '}
                                            {formatDistanceToNow(snapshot.createdAt, { addSuffix: true })}
                                        </p>
                                    </div>

                                    {/* Actions */}
                                    <div className="flex items-center gap-2">
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={() => handleRestoreSnapshot(snapshot)}
                                        >
                                            <RotateCcw className="mr-2 h-3 w-3" />
                                            Restore
                                        </Button>
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            onClick={() => handleDeleteSnapshot(snapshot.id)}
                                        >
                                            <Trash2 className="h-3 w-3 text-destructive" />
                                        </Button>
                                    </div>
                                </div>
                            </Card>
                        </motion.div>
                    ))}
                </div>
            )}
        </div>
    );
}
