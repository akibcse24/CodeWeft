/**
 * EditorWorkspace - Main editor container
 * 
 * Combines file tree, tabs, and code editor
 */

import { useState, useCallback } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { CodeEditor } from './CodeEditor';
import { getLanguageFromFilename } from '@/lib/editor-utils';
import { TabManager, EditorTab } from './TabManager';
import { FileTree } from './FileTree';
import { FileNode, buildFileTree } from './file-tree-utils';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { Save, AlertCircle } from 'lucide-react';
import { useRepository } from '@/hooks/github/useGitOperations';
import { getTree, getFileContent, updateFile } from '@/services/github/git.service';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useDialogs } from '@/hooks/useDialogs';

export function EditorWorkspace() {
    const { owner, repo } = useParams<{ owner: string; repo: string }>();
    const [searchParams] = useSearchParams();
    const branch = searchParams.get('branch') || 'main';

    const [tabs, setTabs] = useState<EditorTab[]>([]);
    const [activeTabId, setActiveTabId] = useState<string | null>(null);
    const queryClient = useQueryClient();
    const { confirm, Dialogs } = useDialogs();

    // Fetch repository info
    const { data: repository, isLoading: repoLoading } = useRepository(owner!, repo!);

    // Fetch file tree
    const { data: fileTree, isLoading: treeLoading } = useQuery({
        queryKey: ['github', 'tree', owner, repo, branch],
        queryFn: async () => {
            if (!owner || !repo) throw new Error('Missing owner or repo');
            const tree = await getTree(owner, repo, `refs/heads/${branch}`, true);
            return buildFileTree(tree.tree);
        },
        enabled: !!owner && !!repo,
    });

    // Save file mutation
    const saveFileMutation = useMutation({
        mutationFn: async ({ path, content, sha }: { path: string; content: string; sha?: string }) => {
            if (!owner || !repo) throw new Error('Missing owner or repo');
            return await updateFile(
                owner,
                repo,
                path,
                content,
                `Update ${path}`,
                branch,
                sha
            );
        },
        onSuccess: (data, variables) => {
            toast.success(`Saved ${variables.path}`);
            queryClient.invalidateQueries({ queryKey: ['github', 'file', owner, repo, variables.path] });

            // Mark tab as clean and update SHA
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const responseData = data as any;
            const newSha = responseData?.content?.sha || responseData?.sha; // GitHub API structure varies

            setTabs(prev =>
                prev.map(tab =>
                    tab.path === variables.path ? { ...tab, isDirty: false, sha: newSha || tab.sha } : tab
                )
            );
        },
        onError: (error) => {
            toast.error(`Failed to save file: ${(error as Error).message}`);
        },
    });

    const handleFileSelect = useCallback(async (file: FileNode) => {
        if (file.type !== 'file' || !owner || !repo) return;

        // Check if already open
        const existingTab = tabs.find(t => t.path === file.path);
        if (existingTab) {
            setActiveTabId(existingTab.id);
            return;
        }

        try {
            // Fetch file content
            const fileContent = await getFileContent(owner, repo, file.path, branch);

            // Decode base64 content
            const content = fileContent.content
                ? atob(fileContent.content)
                : '';

            const newTab: EditorTab = {
                id: file.path,
                filename: file.name,
                path: file.path,
                content,
                language: getLanguageFromFilename(file.name),
                isDirty: false,
                isNew: false,
                sha: fileContent.sha, // Store SHA for updates
            };

            setTabs(prev => [...prev, newTab]);
            setActiveTabId(newTab.id);
        } catch (error) {
            toast.error(`Failed to open file: ${(error as Error).message}`);
        }
    }, [tabs, owner, repo, branch]);

    const handleTabClose = useCallback(async (tabId: string) => {
        const tab = tabs.find(t => t.id === tabId);

        if (tab?.isDirty) {
            const confirmed = await confirm({
                title: "Unsaved Changes",
                description: `"${tab.filename}" has unsaved changes. Are you sure you want to close it?`,
                confirmText: "Close Without Saving",
                cancelText: "Keep Open",
                variant: "destructive"
            });
            if (!confirmed) return;
        }

        setTabs(prev => prev.filter(t => t.id !== tabId));

        if (activeTabId === tabId) {
            const remainingTabs = tabs.filter(t => t.id !== tabId);
            setActiveTabId(remainingTabs.length > 0 ? remainingTabs[0].id : null);
        }
    }, [tabs, activeTabId, confirm]);

    const handleTabSave = useCallback((tabId: string) => {
        const tab = tabs.find(t => t.id === tabId);
        if (!tab) return;

        saveFileMutation.mutate({
            path: tab.path,
            content: tab.content,
            sha: tab.sha, // Pass SHA for update
        });
    }, [tabs, saveFileMutation]);

    const handleEditorChange = useCallback((value: string | undefined) => {
        if (!activeTabId || value === undefined) return;

        setTabs(prev =>
            prev.map(tab =>
                tab.id === activeTabId
                    ? { ...tab, content: value, isDirty: true }
                    : tab
            )
        );
    }, [activeTabId]);

    const activeTab = tabs.find(t => t.id === activeTabId);

    if (!owner || !repo) {
        return (
            <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                    Invalid repository. Please select a repository from the repositories page.
                </AlertDescription>
            </Alert>
        );
    }

    if (repoLoading || treeLoading) {
        return (
            <div className="flex h-screen">
                <div className="w-64 border-r p-4">
                    <Skeleton className="h-8 w-full mb-2" />
                    <Skeleton className="h-6 w-3/4 mb-2" />
                    <Skeleton className="h-6 w-full mb-2" />
                    <Skeleton className="h-6 w-2/3" />
                </div>
                <div className="flex-1 p-4">
                    <Skeleton className="h-full w-full" />
                </div>
            </div>
        );
    }

    return (
        <>
            <Dialogs />
            <div className="flex h-screen flex-col">
                {/* Header */}
                <div className="flex items-center justify-between border-b px-4 py-2">
                    <div>
                        <h2 className="text-lg font-semibold">{repository?.name}</h2>
                        <p className="text-sm text-muted-foreground">
                            {owner}/{repo} • {branch}
                        </p>
                    </div>
                    {activeTab?.isDirty && (
                        <Button
                            size="sm"
                            onClick={() => handleTabSave(activeTab.id)}
                            disabled={saveFileMutation.isPending}
                        >
                            <Save className="mr-2 h-4 w-4" />
                            Save
                        </Button>
                    )}
                </div>

                <div className="flex flex-1 overflow-hidden">
                    {/* File Tree Sidebar */}
                    <div className="w-64 border-r flex flex-col overflow-hidden">
                        <div className="px-4 py-2 border-b">
                            <h3 className="font-semibold text-sm">Files</h3>
                        </div>
                        {fileTree && (
                            <FileTree
                                files={fileTree}
                                onFileSelect={handleFileSelect}
                                selectedPath={activeTab?.path}
                            />
                        )}
                    </div>

                    {/* Editor Area */}
                    <div className="flex-1 flex flex-col overflow-hidden">
                        <TabManager
                            tabs={tabs}
                            activeTabId={activeTabId}
                            onTabChange={setActiveTabId}
                            onTabClose={handleTabClose}
                            onTabSave={handleTabSave}
                            onCloseAll={() => setTabs([])}
                            onCloseOthers={(tabId) => setTabs(prev => prev.filter(t => t.id === tabId))}
                        />

                        <div className="flex-1 overflow-hidden">
                            {activeTab ? (
                                <CodeEditor
                                    value={activeTab.content}
                                    language={activeTab.language}
                                    onChange={handleEditorChange}
                                    onSave={(value) => {
                                        if (activeTab) {
                                            saveFileMutation.mutate({
                                                path: activeTab.path,
                                                content: value,
                                                sha: activeTab.sha, // Pass SHA for update
                                            });
                                        }
                                    }}
                                />
                            ) : (
                                <div className="flex items-center justify-center h-full text-muted-foreground">
                                    <p>Select a file to start editing</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
