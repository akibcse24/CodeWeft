/**
 * GistEditor Component - Create and edit gists
 * 
 * Features:
 * - Multi-file gist support
 * - Syntax highlighting
 * - Public/Private toggle
 * - Monaco Editor integration
 */

import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useGist, useCreateGist, useUpdateGist } from '@/hooks/github/useGistOperations';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, X, Save, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import Editor from '@monaco-editor/react';
import { useTheme } from "@/hooks/use-theme";

interface GistFile {
    filename: string;
    content: string;
    language?: string;
}

export function GistEditor() {
    const navigate = useNavigate();
    const { gistId } = useParams<{ gistId: string }>();
    const { theme } = useTheme();
    const isEditing = Boolean(gistId);

    const [description, setDescription] = useState('');
    const [isPublic, setIsPublic] = useState(true);
    const [files, setFiles] = useState<GistFile[]>([
        { filename: 'snippet.txt', content: '', language: 'plaintext' }
    ]);
    const [activeTabIndex, setActiveTabIndex] = useState(0);

    // Fetch existing gist if editing
    const { data: existingGist, isLoading } = useGist(gistId || '');
    const createGist = useCreateGist();
    const updateGist = useUpdateGist();

    // Load existing gist data when editing
    useEffect(() => {
        if (existingGist) {
            setDescription(existingGist.description || '');
            setIsPublic(existingGist.public);

            const gistFiles = Object.entries(existingGist.files).map(([filename, file]) => ({
                filename,
                content: file.content || '',
                language: file.language?.toLowerCase() || 'plaintext',
            }));

            setFiles(gistFiles);
        }
    }, [existingGist]);

    const addFile = () => {
        setFiles([...files, { filename: `file-${files.length + 1}.txt`, content: '', language: 'plaintext' }]);
        setActiveTabIndex(files.length);
    };

    const removeFile = (index: number) => {
        if (files.length === 1) {
            toast.error('Gist must have at least one file');
            return;
        }
        const newFiles = files.filter((_, i) => i !== index);
        setFiles(newFiles);
        if (activeTabIndex >= newFiles.length) {
            setActiveTabIndex(newFiles.length - 1);
        }
    };

    const updateFile = (index: number, updates: Partial<GistFile>) => {
        const newFiles = [...files];
        newFiles[index] = { ...newFiles[index], ...updates };
        setFiles(newFiles);
    };

    const detectLanguage = (filename: string): string => {
        const ext = filename.split('.').pop()?.toLowerCase();
        const languageMap: Record<string, string> = {
            'js': 'javascript',
            'jsx': 'javascript',
            'ts': 'typescript',
            'tsx': 'typescript',
            'py': 'python',
            'rb': 'ruby',
            'java': 'java',
            'go': 'go',
            'rs': 'rust',
            'cpp': 'cpp',
            'c': 'c',
            'cs': 'csharp',
            'php': 'php',
            'sh': 'shell',
            'bash': 'shell',
            'json': 'json',
            'xml': 'xml',
            'html': 'html',
            'css': 'css',
            'scss': 'scss',
            'md': 'markdown',
            'sql': 'sql',
            'yaml': 'yaml',
            'yml': 'yaml',
        };
        return languageMap[ext || ''] || 'plaintext';
    };

    const handleFilenameChange = (index: number, newFilename: string) => {
        const language = detectLanguage(newFilename);
        updateFile(index, { filename: newFilename, language });
    };

    const handleSave = async () => {
        // Validation
        if (files.some(f => !f.filename || !f.filename.trim())) {
            toast.error('All files must have a filename');
            return;
        }

        if (files.some(f => !f.content || !f.content.trim())) {
            toast.error('All files must have content');
            return;
        }

        // Check for duplicate filenames
        const filenames = files.map(f => f.filename);
        if (new Set(filenames).size !== filenames.length) {
            toast.error('Duplicate filenames are not allowed');
            return;
        }

        const gistFiles: Record<string, { content: string }> = {};
        files.forEach(file => {
            gistFiles[file.filename] = { content: file.content };
        });

        try {
            if (isEditing && gistId) {
                await updateGist.mutateAsync({
                    gistId,
                    files: gistFiles,
                    description,
                });
                navigate(`/github/gists/${gistId}`);
            } else {
                const result = await createGist.mutateAsync({
                    files: gistFiles,
                    description,
                    isPublic,
                });
                navigate(`/github/gists/${result.id}`);
            }
        } catch (error) {
            // Error handled by hook
        }
    };

    if (isEditing && isLoading) {
        return (
            <div className="container mx-auto py-6">
                <p>Loading gist...</p>
            </div>
        );
    }

    return (
        <div className="container mx-auto py-6 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <div className="flex items-center gap-2">
                        <Button variant="ghost" size="icon" onClick={() => navigate('/github/gists')}>
                            <ArrowLeft className="h-4 w-4" />
                        </Button>
                        <h1 className="text-3xl font-bold">
                            {isEditing ? 'Edit Gist' : 'Create New Gist'}
                        </h1>
                    </div>
                    <p className="text-muted-foreground ml-12">
                        {files.length} {files.length === 1 ? 'file' : 'files'}
                    </p>
                </div>
                <Button onClick={handleSave} disabled={createGist.isPending || updateGist.isPending}>
                    <Save className="mr-2 h-4 w-4" />
                    {createGist.isPending || updateGist.isPending ? 'Saving...' : 'Save Gist'}
                </Button>
            </div>

            {/* Gist Settings */}
            <Card>
                <CardHeader>
                    <CardTitle>Gist Settings</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div>
                        <Label htmlFor="description">Description</Label>
                        <Input
                            id="description"
                            placeholder="What's this gist about?"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                        />
                    </div>
                    <div className="flex items-center space-x-2">
                        <Switch
                            id="public"
                            checked={isPublic}
                            onCheckedChange={setIsPublic}
                            disabled={isEditing} // Can't change visibility after creation
                        />
                        <Label htmlFor="public">
                            {isPublic ? 'Public' : 'Secret'} Gist
                            {isEditing && <span className="text-xs text-muted-foreground ml-2">(cannot be changed)</span>}
                        </Label>
                    </div>
                </CardContent>
            </Card>

            {/* Files */}
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <CardTitle>Files</CardTitle>
                        <Button onClick={addFile} variant="outline" size="sm">
                            <Plus className="mr-2 h-4 w-4" />
                            Add File
                        </Button>
                    </div>
                </CardHeader>
                <CardContent>
                    <Tabs value={String(activeTabIndex)} onValueChange={(v) => setActiveTabIndex(Number(v))}>
                        <TabsList className="w-full justify-start overflow-x-auto">
                            {files.map((file, index) => (
                                <TabsTrigger key={index} value={String(index)} className="relative pr-8">
                                    {file.filename}
                                    {files.length > 1 && (
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-4 w-4 absolute right-1 top-1/2 -translate-y-1/2 hover:bg-destructive/20"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                removeFile(index);
                                            }}
                                        >
                                            <X className="h-3 w-3" />
                                        </Button>
                                    )}
                                </TabsTrigger>
                            ))}
                        </TabsList>

                        {files.map((file, index) => (
                            <TabsContent key={index} value={String(index)} className="space-y-4">
                                <div>
                                    <Label>Filename</Label>
                                    <Input
                                        value={file.filename}
                                        onChange={(e) => handleFilenameChange(index, e.target.value)}
                                        placeholder="filename.ext"
                                    />
                                </div>
                                <div>
                                    <Label>Content</Label>
                                    <div className="border rounded-md overflow-hidden">
                                        <Editor
                                            height="400px"
                                            language={file.language}
                                            value={file.content}
                                            onChange={(value) => updateFile(index, { content: value || '' })}
                                            theme={theme === 'dark' ? 'vs-dark' : 'light'}
                                            options={{
                                                minimap: { enabled: false },
                                                fontSize: 14,
                                                lineNumbers: 'on',
                                                wordWrap: 'on',
                                                formatOnPaste: true,
                                                formatOnType: true,
                                            }}
                                        />
                                    </div>
                                </div>
                            </TabsContent>
                        ))}
                    </Tabs>
                </CardContent>
            </Card>
        </div>
    );
}
