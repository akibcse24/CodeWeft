import { useState } from 'react';
import { motion } from 'framer-motion';
import {
    FolderOpen,
    File,
    ChevronRight,
    ChevronDown,
    Search,
    RefreshCw,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useQuery } from '@tanstack/react-query';
import { listUserRepositories } from '@/services/github/repository.service';
import { getTree } from '@/services/github/git.service';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import type { TreeNode } from '@/types/github';

interface FileExplorerProps {
    onFileSelect?: (file: TreeNode) => void;
}

export function FileExplorer({ onFileSelect }: FileExplorerProps) {
    const [selectedRepo, setSelectedRepo] = useState<{
        owner: string;
        name: string;
    } | null>(null);
    const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
    const [searchQuery, setSearchQuery] = useState('');

    // Fetch repositories
    const { data: repositories, isLoading: isLoadingRepos } = useQuery({
        queryKey: ['user-repositories'],
        queryFn: () => listUserRepositories({ sort: 'updated', per_page: 50 }),
        staleTime: 5 * 60 * 1000,
    });

    // Fetch file tree
    const {
        data: fileTree,
        isLoading: isLoadingTree,
        refetch: refetchTree,
    } = useQuery({
        queryKey: ['file-tree', selectedRepo?.owner, selectedRepo?.name],
        queryFn: async (): Promise<TreeNode[]> => {
            if (!selectedRepo) return [];
            // Get default branch first, then tree
            const result = await getTree(selectedRepo.owner, selectedRepo.name, 'HEAD', true);
            return (result.tree || []).map(item => ({
                ...item,
                type: item.type as 'blob' | 'tree',
                name: item.path?.split('/').pop() || item.path || '',
            }));
        },
        enabled: !!selectedRepo,
        staleTime: 3 * 60 * 1000,
    });

    const handleRepositoryChange = (value: string) => {
        const [owner, name] = value.split('/');
        setSelectedRepo({ owner, name });
        setExpandedFolders(new Set());
    };

    const toggleFolder = (path: string) => {
        const newExpanded = new Set(expandedFolders);
        if (newExpanded.has(path)) {
            newExpanded.delete(path);
        } else {
            newExpanded.add(path);
        }
        setExpandedFolders(newExpanded);
    };

    const handleFileClick = (file: TreeNode) => {
        if (file.type === 'tree') {
            toggleFolder(file.path);
        } else {
            onFileSelect?.(file);
        }
    };

    // Build tree structure
    const buildTreeStructure = (nodes: TreeNode[]): Map<string, TreeNode[]> => {
        const structure = new Map<string, TreeNode[]>();

        nodes.forEach((node) => {
            const parts = node.path.split('/');
            const parent = parts.slice(0, -1).join('/') || 'root';

            if (!structure.has(parent)) {
                structure.set(parent, []);
            }
            structure.get(parent)!.push(node);
        });

        // Sort: folders first, then files
        structure.forEach((children) => {
            children.sort((a, b) => {
                if (a.type === b.type) {
                    return a.path.localeCompare(b.path);
                }
                return a.type === 'tree' ? -1 : 1;
            });
        });

        return structure;
    };

    const filterNodes = (nodes: TreeNode[], query: string): TreeNode[] => {
        if (!query) return nodes;
        return nodes.filter((node) =>
            node.path.toLowerCase().includes(query.toLowerCase())
        );
    };

    const renderTreeNode = (
        node: TreeNode,
        level: number,
        structure: Map<string, TreeNode[]>
    ): React.ReactNode => {
        const isFolder = node.type === 'tree';
        const isExpanded = expandedFolders.has(node.path);
        const children = structure.get(node.path) || [];
        const fileName = node.path.split('/').pop() || node.path;

        return (
            <div key={node.path}>
                <motion.div
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className={cn(
                        'flex items-center gap-2 py-1.5 px-2 rounded hover:bg-accent/50 cursor-pointer transition-colors',
                        'text-sm'
                    )}
                    style={{ paddingLeft: `${level * 16 + 8}px` }}
                    onClick={() => handleFileClick(node)}
                >
                    {isFolder && (
                        <span className="text-muted-foreground">
                            {isExpanded ? (
                                <ChevronDown className="h-4 w-4" />
                            ) : (
                                <ChevronRight className="h-4 w-4" />
                            )}
                        </span>
                    )}
                    {!isFolder && <span className="w-4" />}

                    {isFolder ? (
                        <FolderOpen className="h-4 w-4 text-blue-400" />
                    ) : (
                        <File className="h-4 w-4 text-muted-foreground" />
                    )}

                    <span className="flex-1 truncate">{fileName}</span>
                </motion.div>

                {isFolder && isExpanded && children.length > 0 && (
                    <div>
                        {children.map((child) => renderTreeNode(child, level + 1, structure))}
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left: Tree View */}
            <div className="lg:col-span-1">
                <Card className="p-4 h-[600px] flex flex-col">
                    <div className="space-y-4 mb-4">
                        <div>
                            <label className="text-sm font-medium mb-2 block">Repository</label>
                            {isLoadingRepos ? (
                                <Skeleton className="h-10 w-full" />
                            ) : (
                                <Select
                                    onValueChange={handleRepositoryChange}
                                    value={
                                        selectedRepo ? `${selectedRepo.owner}/${selectedRepo.name}` : undefined
                                    }
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select repository..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {repositories?.map((repo) => (
                                            <SelectItem key={repo.id} value={`${repo.owner.login}/${repo.name}`}>
                                                {repo.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            )}
                        </div>

                        {selectedRepo && (
                            <>
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        placeholder="Search files..."
                                        className="pl-9"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                    />
                                </div>

                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="w-full"
                                    onClick={() => refetchTree()}
                                    disabled={isLoadingTree}
                                >
                                    <RefreshCw
                                        className={cn('h-4 w-4 mr-2', isLoadingTree && 'animate-spin')}
                                    />
                                    Refresh
                                </Button>
                            </>
                        )}
                    </div>

                    <ScrollArea className="flex-1">
                        {isLoadingTree ? (
                            <div className="space-y-2">
                                {[1, 2, 3, 4, 5].map((i) => (
                                    <Skeleton key={i} className="h-8 w-full" />
                                ))}
                            </div>
                        ) : fileTree && fileTree.length > 0 ? (
                            <div>
                                {(() => {
                                    const structure = buildTreeStructure(fileTree);
                                    const rootNodes = structure.get('root') || [];
                                    const filteredNodes = filterNodes(rootNodes, searchQuery);

                                    return filteredNodes.map((node) => renderTreeNode(node, 0, structure));
                                })()}
                            </div>
                        ) : selectedRepo ? (
                            <div className="text-center py-12 text-muted-foreground">
                                <FolderOpen className="h-16 w-16 mx-auto mb-4 opacity-50" />
                                <p>No files found</p>
                            </div>
                        ) : (
                            <div className="text-center py-12 text-muted-foreground">
                                <FolderOpen className="h-16 w-16 mx-auto mb-4 opacity-50" />
                                <p>Select a repository to browse files</p>
                            </div>
                        )}
                    </ScrollArea>
                </Card>
            </div>

            {/* Right: File Preview (Placeholder) */}
            <div className="lg:col-span-2">
                <Card className="p-6 h-[600px] flex items-center justify-center text-muted-foreground">
                    <div className="text-center">
                        <File className="h-16 w-16 mx-auto mb-4 opacity-50" />
                        <p>Select a file to preview</p>
                        <p className="text-sm mt-2">File preview coming soon</p>
                    </div>
                </Card>
            </div>
        </div>
    );
}
