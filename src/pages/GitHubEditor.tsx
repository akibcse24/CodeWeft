import { useParams } from 'react-router-dom';
import { EditorWorkspace } from '@/components/github/editor/EditorWorkspace';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
    Code2,
    Github,
    Search,
    Command,
    FileText,
    Settings,
    GitBranch,
    FolderGit2
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

export default function GitHubEditorPage() {
    // If owner and repo params exist, render the actual editor workspace
    const { owner, repo } = useParams<{ owner: string; repo: string }>();

    if (owner && repo) {
        return <EditorWorkspace />;
    }

    // Otherwise, render the "Start Screen" resembling VS Code's empty state
    return (
        <div className="h-[calc(100vh-4rem)] flex flex-col items-center justify-center p-8 bg-background/50 relative overflow-hidden">

            {/* Background decoration */}
            <div className="absolute inset-0 -z-10 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]" />
            <div className="absolute left-0 right-0 top-0 -z-10 m-auto h-[310px] w-[310px] rounded-full bg-primary/20 opacity-20 blur-[100px]" />

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="max-w-4xl w-full grid grid-cols-1 md:grid-cols-2 gap-12"
            >
                {/* Left Column: Branding & Actions */}
                <div className="space-y-8">
                    <div className="space-y-2">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-3 rounded-xl bg-primary/10 border border-primary/20">
                                <Code2 className="h-10 w-10 text-primary" />
                            </div>
                            <h1 className="text-4xl font-bold tracking-tight">Code Editor</h1>
                        </div>
                        <p className="text-xl text-muted-foreground">
                            Lightweight, VS Code-inspired editor for your GitHub repositories.
                        </p>
                    </div>

                    <div className="space-y-4">
                        <div className="space-y-2">
                            <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Start</h3>

                            <Button variant="ghost" className="w-full justify-start h-10 px-0 hover:bg-transparent hover:text-primary group" asChild>
                                <Link to="/github/repositories" className="flex items-center gap-3">
                                    <FolderGit2 className="h-5 w-5 text-sky-500 group-hover:scale-110 transition-transform" />
                                    <div className="flex flex-col items-start text-left">
                                        <span className="text-base font-medium">Open Repository...</span>
                                        <span className="text-xs text-muted-foreground font-normal">Browse and edit a remote repo</span>
                                    </div>
                                </Link>
                            </Button>

                            <Button variant="ghost" className="w-full justify-start h-10 px-0 hover:bg-transparent hover:text-primary group" asChild>
                                <Link to="/github/gists" className="flex items-center gap-3">
                                    <FileText className="h-5 w-5 text-emerald-500 group-hover:scale-110 transition-transform" />
                                    <div className="flex flex-col items-start text-left">
                                        <span className="text-base font-medium">New Gist...</span>
                                        <span className="text-xs text-muted-foreground font-normal">Create a quick snippet</span>
                                    </div>
                                </Link>
                            </Button>
                        </div>

                        <div className="space-y-2 pt-4">
                            <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Recent</h3>
                            <div className="text-sm text-muted-foreground italic">No recent folders</div>
                        </div>
                    </div>
                </div>

                {/* Right Column: Help & Shortcuts */}
                <div className="space-y-8 md:pt-12">
                    <Card className="p-6 border-none bg-accent/5 shadow-none backdrop-blur-sm">
                        <div className="space-y-6">
                            <div className="space-y-2">
                                <h3 className="text-sm font-medium text-foreground">Customize</h3>
                                <div className="grid grid-cols-2 gap-2 text-sm text-muted-foreground">
                                    <div className="flex items-center gap-2">
                                        <Settings className="h-4 w-4" />
                                        <span>Settings</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Code2 className="h-4 w-4" />
                                        <span>Color Theme</span>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <h3 className="text-sm font-medium text-foreground">Learn</h3>
                                <div className="grid grid-cols-1 gap-2 text-sm text-muted-foreground">
                                    <div className="flex items-center gap-2 cursor-pointer hover:text-primary transition-colors">
                                        <Command className="h-4 w-4" />
                                        <span>Show All Commands</span>
                                        <kbd className="ml-auto pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">
                                            <span className="text-xs">⌘</span>K
                                        </kbd>
                                    </div>
                                    <div className="flex items-center gap-2 cursor-pointer hover:text-primary transition-colors">
                                        <Search className="h-4 w-4" />
                                        <span>Go to File</span>
                                        <kbd className="ml-auto pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">
                                            <span className="text-xs">⌘</span>P
                                        </kbd>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </Card>

                    {/* Features List */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="p-4 rounded-lg bg-card border shadow-sm">
                            <GitBranch className="h-6 w-6 text-purple-500 mb-2" />
                            <h4 className="font-semibold text-sm">Branch Aware</h4>
                            <p className="text-xs text-muted-foreground">Switch branches instantly</p>
                        </div>
                        <div className="p-4 rounded-lg bg-card border shadow-sm">
                            <Github className="h-6 w-6 text-orange-500 mb-2" />
                            <h4 className="font-semibold text-sm">Git Operations</h4>
                            <p className="text-xs text-muted-foreground">Commit & push changes</p>
                        </div>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}
