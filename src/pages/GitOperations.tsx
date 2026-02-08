import { useState } from 'react';
import { motion } from 'framer-motion';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card } from '@/components/ui/card';
import { GitBranch, GitCommit, Save, Users } from 'lucide-react';

// Components to be implemented
import { PushPullDashboard } from '@/components/github/git-ops/PushPullDashboard';
import { BranchVisualizer } from '@/components/github/git-ops/BranchVisualizer';
import { CommitTimeline } from '@/components/github/git-ops/CommitTimeline';
import { SnapshotSystem } from '@/components/github/git-ops/SnapshotSystem';
import { BatchOperations } from '@/components/github/git-ops/BatchOperations';

const GitOperations = () => {
    const [selectedRepo, setSelectedRepo] = useState<{ owner: string; repo: string } | null>(null);
    const [selectedBranch, setSelectedBranch] = useState<string>('main');

    return (
        <div className="container mx-auto p-6 space-y-6">
            {/* Header */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-2"
            >
                <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                    Git Operations
                </h1>
                <p className="text-muted-foreground text-lg">
                    Manage branches, commits, and synchronization
                </p>
            </motion.div>

            {/* Main Dashboard */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
            >
                <PushPullDashboard
                    onRepoSelect={setSelectedRepo}
                    onBranchSelect={setSelectedBranch}
                />
            </motion.div>

            {/* Conditional: Show details only when repo is selected */}
            {selectedRepo && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="space-y-6"
                >
                    {/* Tabs for different views */}
                    <Tabs defaultValue="branches" className="w-full">
                        <TabsList className="grid w-full grid-cols-4">
                            <TabsTrigger value="branches" className="flex items-center gap-2">
                                <GitBranch className="h-4 w-4" />
                                Branches
                            </TabsTrigger>
                            <TabsTrigger value="commits" className="flex items-center gap-2">
                                <GitCommit className="h-4 w-4" />
                                Commits
                            </TabsTrigger>
                            <TabsTrigger value="snapshots" className="flex items-center gap-2">
                                <Save className="h-4 w-4" />
                                Snapshots
                            </TabsTrigger>
                            <TabsTrigger value="batch" className="flex items-center gap-2">
                                <Users className="h-4 w-4" />
                                Batch Ops
                            </TabsTrigger>
                        </TabsList>

                        <TabsContent value="branches" className="mt-6">
                            <Card className="p-6 bg-card/50 backdrop-blur-sm">
                                <BranchVisualizer
                                    owner={selectedRepo.owner}
                                    repo={selectedRepo.repo}
                                    currentBranch={selectedBranch}
                                />
                            </Card>
                        </TabsContent>

                        <TabsContent value="commits" className="mt-6">
                            <Card className="p-6 bg-card/50 backdrop-blur-sm">
                                <CommitTimeline
                                    owner={selectedRepo.owner}
                                    repo={selectedRepo.repo}
                                    branch={selectedBranch}
                                />
                            </Card>
                        </TabsContent>

                        <TabsContent value="snapshots" className="mt-6">
                            <Card className="p-6 bg-card/50 backdrop-blur-sm">
                                <SnapshotSystem
                                    owner={selectedRepo.owner}
                                    repo={selectedRepo.repo}
                                    branch={selectedBranch}
                                />
                            </Card>
                        </TabsContent>

                        <TabsContent value="batch" className="mt-6">
                            <Card className="p-6 bg-card/50 backdrop-blur-sm">
                                <BatchOperations />
                            </Card>
                        </TabsContent>
                    </Tabs>
                </motion.div>
            )}

            {/* Empty state when no repo selected */}
            {!selectedRepo && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3 }}
                >
                    <Card className="p-12 text-center bg-card/50 backdrop-blur-sm">
                        <GitBranch className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                        <h3 className="text-xl font-semibold mb-2">Select a Repository</h3>
                        <p className="text-muted-foreground">
                            Choose a repository from the dropdown above to view branches, commits, and manage Git operations
                        </p>
                    </Card>
                </motion.div>
            )}
        </div>
    );
};

export default GitOperations;
