import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Hammer, Bug, Code2, Plus, Copy, Search, ChevronRight, FileJson,
    Layout, Database, Shield, Trash2, Check, AlertCircle, Construction,
    Monitor, Download, Save, FileCode, Edit, Flag, X, Zap, Layers,
    Boxes, Star, Rocket, GitBranch, CheckCircle, Sparkles, Loader2
} from "lucide-react";
import { format } from "date-fns";
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select";
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { callAI, isAIConfigured } from "@/services/ai.service";

interface Bug {
    id: string;
    title: string;
    description: string;
    status: string;
    priority: string;
    created_at: string;
}

interface Snippet {
    id: string;
    title: string;
    language: string;
    code: string;
    tags: string[];
    created_at: string;
}

// Basic hook for local storage persistence
function useStickyState<T>(defaultValue: T, key: string): [T, React.Dispatch<React.SetStateAction<T>>] {
    const [value, setValue] = useState<T>(() => {
        try {
            const stickyValue = window.localStorage.getItem(key);
            return stickyValue !== null ? JSON.parse(stickyValue) : defaultValue;
        } catch (e) {
            console.error("Error reading from localStorage", e);
            return defaultValue;
        }
    });

    useEffect(() => {
        window.localStorage.setItem(key, JSON.stringify(value));
    }, [key, value]);

    return [value, setValue];
}

export default function BuilderHub() {
    const { toast } = useToast();
    const [activeTab, setActiveTab] = useState("architect");

    // Project Architect State
    const [projectDraft, setProjectDraft] = useStickyState({
        title: "",
        description: "",
        concept: "",
        techStack: [] as string[],
        features: [] as string[],
        schema: "",
    }, "builder_project_draft");

    const [newTech, setNewTech] = useState("");
    const [newFeature, setNewFeature] = useState("");

    // Bug Journal State
    const [bugs, setBugs] = useStickyState<Bug[]>([], "builder_bug_journal");
    const [isBugDialogOpen, setIsBugDialogOpen] = useState(false);
    const [newBug, setNewBug] = useState({
        title: "",
        description: "",
        status: "open",
        priority: "medium",
    });

    // Snippet Vault State
    const [snippets, setSnippets] = useStickyState<Snippet[]>([], "builder_snippet_vault");
    const [searchSnippet, setSearchSnippet] = useState("");
    const [isSnippetDialogOpen, setIsSnippetDialogOpen] = useState(false);
    const [newSnippet, setNewSnippet] = useState({
        title: "",
        language: "javascript",
        code: "",
        tags: [] as string[],
    });

    const [isLoadingSchema, setIsLoadingSchema] = useState(false);

    const generateSchema = async () => {
        if (!isAIConfigured()) {
            toast({
                title: "AI Protocol Offline",
                description: "Please configure your AI API key in Settings to use the Architect.",
                variant: "destructive"
            });
            return;
        }

        setIsLoadingSchema(true);
        try {
            const prompt = `Act as an expert software architect. Generate a clean, production-ready Prisma schema (.prisma) based on this project concept:
            
            Title: ${projectDraft.title}
            Concept: ${projectDraft.concept}
            Tech Stack: ${projectDraft.techStack.join(", ")}
            Core Features: ${projectDraft.features.join(", ")}
            
            Include necessary models, relations, and clear comments. Provide ONLY the prisma code block.`;

            const { result } = await callAI({
                action: "custom",
                text: "",
                prompt
            });

            setProjectDraft({ ...projectDraft, schema: result });
            toast({ title: "Architecture Synthesized", description: "Database schema has been generated." });
        } catch (error) {
            console.error("Schema generation failed:", error);
            toast({
                title: "Generation Error",
                description: "The AI failed to synthesize the schema. Check your API key and connection.",
                variant: "destructive"
            });
        } finally {
            setIsLoadingSchema(false);
        }
    };

    const addBug = () => {
        if (!newBug.title) return;
        const bug = { ...newBug, id: crypto.randomUUID(), created_at: new Date().toISOString() };
        setBugs([bug, ...bugs]);
        setIsBugDialogOpen(false);
        setNewBug({ title: "", description: "", status: "open", priority: "medium" });
    };

    const addSnippet = () => {
        if (!newSnippet.title || !newSnippet.code) return;
        const snippet = { ...newSnippet, id: crypto.randomUUID(), created_at: new Date().toISOString() };
        setSnippets([snippet, ...snippets]);
        setIsSnippetDialogOpen(false);
        setNewSnippet({ title: "", language: "javascript", code: "", tags: [] });
    };

    const statusColors = {
        open: "bg-red-500/10 text-red-500 border-red-500/20",
        "in-progress": "bg-blue-500/10 text-blue-500 border-blue-500/20",
        resolved: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
    };

    const priorityColors = {
        urgent: "bg-red-500",
        high: "bg-orange-500",
        medium: "bg-blue-500",
        low: "bg-emerald-500",
    };

    return (
        <div className="space-y-10 animate-fade-in max-w-[1400px] mx-auto pb-20">
            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
                <div className="space-y-2">
                    <div className="flex items-center gap-3 text-primary mb-1">
                        <div className="p-2 rounded-xl bg-primary/10">
                            <Boxes className="h-6 w-6" />
                        </div>
                        <span className="text-sm font-black uppercase tracking-widest">Project Hub</span>
                    </div>
                    <h1 className="text-5xl font-black tracking-tight bg-clip-text text-transparent bg-gradient-to-br from-foreground to-foreground/60">
                        Builder Hub
                    </h1>
                    <p className="text-muted-foreground text-lg max-w-lg">
                        Connect your architectural designs with code execution and bug tracking.
                    </p>
                </div>

                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full lg:w-auto">
                    <TabsList className="bg-muted/40 p-1.5 rounded-2xl border border-border/40 min-h-[56px] gap-1">
                        <TabsTrigger
                            value="architect"
                            className="rounded-xl px-6 h-10 font-bold data-[state=active]:bg-background data-[state=active]:shadow-lg gap-2"
                        >
                            <Layout className="h-4 w-4" /> Project Architect
                        </TabsTrigger>
                        <TabsTrigger
                            value="bugs"
                            className="rounded-xl px-6 h-10 font-bold data-[state=active]:bg-background data-[state=active]:shadow-lg gap-2"
                        >
                            <Bug className="h-4 w-4" /> Bug & Fix Journal
                        </TabsTrigger>
                        <TabsTrigger
                            value="snippets"
                            className="rounded-xl px-6 h-10 font-bold data-[state=active]:bg-background data-[state=active]:shadow-lg gap-2"
                        >
                            <Code2 className="h-4 w-4" /> Snippet Vault
                        </TabsTrigger>
                    </TabsList>
                </Tabs>
            </div>

            <AnimatePresence mode="wait">
                <motion.div
                    key={activeTab}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.25 }}
                >
                    {activeTab === "architect" && (
                        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                            {/* Architecture Inputs */}
                            <div className="xl:col-span-2 space-y-8">
                                <Card className="glass-premium border-border/40 overflow-hidden relative">
                                    <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none">
                                        <Layers className="h-48 w-48" />
                                    </div>
                                    <CardHeader className="p-8 pb-4">
                                        <CardTitle className="text-2xl font-black flex items-center gap-3">
                                            <Zap className="h-6 w-6 text-primary" /> Basic Foundation
                                        </CardTitle>
                                        <CardDescription className="text-base">Define the core identity and concept of your project</CardDescription>
                                    </CardHeader>
                                    <CardContent className="p-8 space-y-8 relative z-10">
                                        <div className="grid gap-8 sm:grid-cols-2">
                                            <div className="space-y-3">
                                                <Label className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground/60 ml-1">Project Title</Label>
                                                <Input
                                                    placeholder="Project Name (e.g., E-commerce Platform)"
                                                    className="h-14 bg-muted/30 border-none rounded-2xl focus-visible:ring-1 focus-visible:ring-primary/20 text-lg font-bold"
                                                    value={projectDraft.title}
                                                    onChange={(e) => setProjectDraft({ ...projectDraft, title: e.target.value })}
                                                />
                                            </div>
                                            <div className="space-y-3">
                                                <Label className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground/60 ml-1">Core Tech</Label>
                                                <div className="flex gap-2">
                                                    <Input
                                                        placeholder="Add tech stack..."
                                                        className="h-14 bg-muted/30 border-none rounded-2xl focus-visible:ring-1"
                                                        value={newTech}
                                                        onChange={(e) => setNewTech(e.target.value)}
                                                        onKeyDown={(e) => {
                                                            if (e.key === 'Enter' && newTech) {
                                                                setProjectDraft({ ...projectDraft, techStack: [...projectDraft.techStack, newTech] });
                                                                setNewTech("");
                                                            }
                                                        }}
                                                    />
                                                    <Button
                                                        variant="secondary"
                                                        className="h-14 w-14 rounded-2xl shrink-0"
                                                        onClick={() => {
                                                            if (newTech) {
                                                                setProjectDraft({ ...projectDraft, techStack: [...projectDraft.techStack, newTech] });
                                                                setNewTech("");
                                                            }
                                                        }}
                                                    >
                                                        <Plus className="h-5 w-5" />
                                                    </Button>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex flex-wrap gap-2">
                                            {projectDraft.techStack.map((tech, i) => (
                                                <Badge key={i} className="h-9 px-4 rounded-xl bg-primary/10 text-primary hover:bg-primary/20 transition-colors border-none gap-2 text-sm font-bold">
                                                    {tech}
                                                    <X
                                                        className="h-3.5 w-3.5 cursor-pointer opacity-60 hover:opacity-100"
                                                        onClick={() => setProjectDraft({ ...projectDraft, techStack: projectDraft.techStack.filter((_, idx) => idx !== i) })}
                                                    />
                                                </Badge>
                                            ))}
                                        </div>

                                        <div className="space-y-3">
                                            <Label className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground/60 ml-1">The Vision (Concept)</Label>
                                            <Textarea
                                                placeholder="What problem does this solve? Describe your unique vision..."
                                                className="bg-muted/30 border-none rounded-2xl focus-visible:ring-1 focus-visible:ring-primary/20 min-h-[160px] p-6 text-lg"
                                                value={projectDraft.concept}
                                                onChange={(e) => setProjectDraft({ ...projectDraft, concept: e.target.value })}
                                            />
                                        </div>
                                    </CardContent>
                                </Card>

                                <div className="grid gap-8 sm:grid-cols-2">
                                    <Card className="glass-premium border-border/40 overflow-hidden relative group">
                                        <CardHeader className="p-8">
                                            <CardTitle className="text-xl font-black flex items-center gap-3">
                                                <Star className="h-5 w-5 text-warning" /> Key Features
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent className="p-8 pt-0 space-y-6">
                                            <div className="flex gap-2">
                                                <Input
                                                    placeholder="Feature title..."
                                                    className="h-12 bg-muted/30 border-none rounded-xl"
                                                    value={newFeature}
                                                    onChange={(e) => setNewFeature(e.target.value)}
                                                    onKeyDown={(e) => {
                                                        if (e.key === 'Enter' && newFeature) {
                                                            setProjectDraft({ ...projectDraft, features: [...projectDraft.features, newFeature] });
                                                            setNewFeature("");
                                                        }
                                                    }}
                                                />
                                                <Button
                                                    variant="secondary"
                                                    className="h-12 w-12 rounded-xl shrink-0"
                                                    onClick={() => {
                                                        if (newFeature) {
                                                            setProjectDraft({ ...projectDraft, features: [...projectDraft.features, newFeature] });
                                                            setNewFeature("");
                                                        }
                                                    }}
                                                >
                                                    <Plus className="h-4 w-4" />
                                                </Button>
                                            </div>
                                            <div className="space-y-2 mt-2">
                                                {projectDraft.features.map((feature, i) => (
                                                    <div key={i} className="flex items-center gap-3 p-4 rounded-xl bg-muted/40 group/item hover:bg-muted/60 transition-all border border-transparent hover:border-primary/10">
                                                        <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-[10px] font-black text-primary border border-primary/20">
                                                            {i + 1}
                                                        </div>
                                                        <span className="flex-1 font-bold text-sm tracking-tight">{feature}</span>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-8 w-8 opacity-0 group-hover/item:opacity-100"
                                                            onClick={() => setProjectDraft({ ...projectDraft, features: projectDraft.features.filter((_, idx) => idx !== i) })}
                                                        >
                                                            <X className="h-3.5 w-3.5" />
                                                        </Button>
                                                    </div>
                                                ))}
                                            </div>
                                        </CardContent>
                                    </Card>

                                    <Card className="glass-premium border-border/40 overflow-hidden">
                                        <CardHeader className="p-8">
                                            <CardTitle className="text-xl font-black flex items-center gap-3">
                                                <GitBranch className="h-5 w-5 text-primary" /> Roadmap
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent className="p-8 pt-0 space-y-8">
                                            <div className="space-y-6 relative">
                                                <div className="absolute left-[11px] top-2 bottom-2 w-0.5 bg-gradient-to-b from-primary/40 to-muted-foreground/10" />
                                                {[
                                                    { title: "Alpha (MVP)", icon: <Rocket className="h-3 w-3" />, color: "bg-primary" },
                                                    { title: "Beta Test", icon: <CheckCircle className="h-3 w-3" />, color: "bg-muted-foreground/30" },
                                                    { title: "Scale Phase", icon: <ChevronRight className="h-3 w-3" />, color: "bg-muted-foreground/30" }
                                                ].map((m, i) => (
                                                    <div key={i} className="flex items-center gap-5 relative z-10 group/node">
                                                        <div className={cn("w-6 h-6 rounded-full flex items-center justify-center text-background border-2 border-background", m.color)}>
                                                            {m.icon}
                                                        </div>
                                                        <div className="p-3 rounded-xl bg-muted/40 flex-1 font-bold text-xs tracking-wide group-hover/node:bg-muted/60 transition-colors">
                                                            {m.title}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </CardContent>
                                    </Card>
                                </div>
                            </div>

                            {/* Schema Generator AI */}
                            <div className="space-y-8">
                                <Card className="glass-premium border-border/40 min-h-[600px] flex flex-col overflow-hidden">
                                    <div className="p-8 border-b border-border/40 bg-muted/20">
                                        <CardTitle className="text-xl font-black flex items-center gap-3">
                                            <Database className="h-5 w-5 text-primary" /> Schema Architect
                                        </CardTitle>
                                        <CardDescription className="mt-2">Generate technical database structures from your concept.</CardDescription>
                                    </div>
                                    <CardContent className="p-0 flex-1 flex flex-col">
                                        <div className="flex-1 p-8 font-mono text-xs leading-relaxed overflow-auto bg-black/5 dark:bg-black/40">
                                            {projectDraft.schema ? (
                                                <pre className="whitespace-pre-wrap">{projectDraft.schema}</pre>
                                            ) : (
                                                <div className="h-full flex flex-col items-center justify-center text-center text-muted-foreground opacity-40 italic space-y-4">
                                                    <Code2 className="h-12 w-12" />
                                                    <p>Ready to blueprint your data models...</p>
                                                </div>
                                            )}
                                        </div>
                                    </CardContent>
                                    <div className="p-8 bg-muted/20 border-t border-border/40">
                                        <Button
                                            onClick={generateSchema}
                                            disabled={isLoadingSchema}
                                            className="w-full h-14 rounded-2xl shadow-xl shadow-primary/10 font-bold gap-2"
                                        >
                                            {isLoadingSchema ? (
                                                <>
                                                    <Loader2 className="h-5 w-5 animate-spin" />
                                                    Synthesizing...
                                                </>
                                            ) : (
                                                <>
                                                    <Sparkles className="h-5 w-5" />
                                                    Generate Architecture
                                                </>
                                            )}
                                        </Button>
                                    </div>
                                </Card>

                                <Card className="glass-premium border-border/40 bg-gradient-to-br from-primary/10 to-transparent">
                                    <CardHeader className="p-8 pb-4">
                                        <CardTitle className="text-lg font-black italic tracking-tight">Pro Tip</CardTitle>
                                    </CardHeader>
                                    <CardContent className="px-8 pb-8 text-sm text-primary/80 leading-relaxed font-medium">
                                        Use concrete examples in your vision to help the Schema Architect design more accurate relations.
                                    </CardContent>
                                </Card>
                            </div>
                        </div>
                    )}

                    {activeTab === "bugs" && (
                        <div className="space-y-8">
                            <div className="flex items-center justify-between">
                                <div className="space-y-1">
                                    <h2 className="text-2xl font-black tracking-tight">Bug & Fix Journal</h2>
                                    <p className="text-muted-foreground">Document failures, troubleshoot, and track resolutions.</p>
                                </div>
                                <Dialog open={isBugDialogOpen} onOpenChange={setIsBugDialogOpen}>
                                    <DialogTrigger asChild>
                                        <Button size="lg" className="rounded-2xl h-12 shadow-xl shadow-primary/10 gap-2">
                                            <Bug className="h-5 w-5" /> Log New Issue
                                        </Button>
                                    </DialogTrigger>
                                    <DialogContent className="glass-premium border-border/40 max-w-lg rounded-3xl">
                                        <DialogHeader>
                                            <DialogTitle className="text-2xl font-black">Report Bug</DialogTitle>
                                        </DialogHeader>
                                        <div className="space-y-6 py-4">
                                            <div className="space-y-2">
                                                <Label className="text-xs font-black uppercase tracking-widest ml-1 opacity-60">Issue Name</Label>
                                                <Input
                                                    placeholder="What went wrong?"
                                                    className="h-12 bg-muted/30 border-none rounded-xl"
                                                    value={newBug.title}
                                                    onChange={(e) => setNewBug({ ...newBug, title: e.target.value })}
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label className="text-xs font-black uppercase tracking-widest ml-1 opacity-60">Description</Label>
                                                <Textarea
                                                    placeholder="Reproduction steps, expected vs actual behavior..."
                                                    className="bg-muted/30 border-none rounded-xl min-h-[120px]"
                                                    value={newBug.description}
                                                    onChange={(e) => setNewBug({ ...newBug, description: e.target.value })}
                                                />
                                            </div>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="space-y-2">
                                                    <Label className="text-xs font-black uppercase tracking-widest ml-1 opacity-60">Priority</Label>
                                                    <Select value={newBug.priority} onValueChange={(v) => setNewBug({ ...newBug, priority: v })}>
                                                        <SelectTrigger className="h-12 bg-muted/30 border-none rounded-xl">
                                                            <SelectValue />
                                                        </SelectTrigger>
                                                        <SelectContent className="glass-premium border-border/40 rounded-xl">
                                                            <SelectItem value="low">Low</SelectItem>
                                                            <SelectItem value="medium">Medium</SelectItem>
                                                            <SelectItem value="high">High</SelectItem>
                                                            <SelectItem value="urgent">Urgent</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                                <div className="space-y-2">
                                                    <Label className="text-xs font-black uppercase tracking-widest ml-1 opacity-60">Status</Label>
                                                    <Select value={newBug.status} onValueChange={(v) => setNewBug({ ...newBug, status: v })}>
                                                        <SelectTrigger className="h-12 bg-muted/30 border-none rounded-xl">
                                                            <SelectValue />
                                                        </SelectTrigger>
                                                        <SelectContent className="glass-premium border-border/40 rounded-xl">
                                                            <SelectItem value="open">Open</SelectItem>
                                                            <SelectItem value="in-progress">In Progress</SelectItem>
                                                            <SelectItem value="resolved">Resolved</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                            </div>
                                        </div>
                                        <DialogFooter>
                                            <Button onClick={addBug} className="w-full h-12 rounded-xl font-bold">Submit Report</Button>
                                        </DialogFooter>
                                    </DialogContent>
                                </Dialog>
                            </div>

                            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                                <AnimatePresence>
                                    {bugs.length === 0 ? (
                                        <div className="col-span-full bg-dot-pattern py-32 rounded-3xl border-2 border-dashed border-border/40 flex flex-col items-center justify-center text-center opacity-40">
                                            <CheckCircle className="h-16 w-16 mb-6" />
                                            <h3 className="text-2xl font-black mb-2">Zero Bugs Detected</h3>
                                            <p className="max-w-xs">Everything looks stable. Time to break things and innovate!</p>
                                        </div>
                                    ) : (
                                        bugs.map((bug) => (
                                            <motion.div
                                                key={bug.id}
                                                initial={{ opacity: 0, scale: 0.98 }}
                                                animate={{ opacity: 1, scale: 1 }}
                                                exit={{ opacity: 0, scale: 0.98 }}
                                                layout
                                            >
                                                <Card className="glass-premium border-border/30 hover:border-primary/20 transition-all group h-full flex flex-col">
                                                    <CardHeader className="p-6">
                                                        <div className="flex items-start justify-between mb-4">
                                                            <Badge variant="outline" className={cn("text-[10px] font-black uppercase py-0.5 rounded-md", statusColors[bug.status as keyof typeof statusColors])}>
                                                                {bug.status}
                                                            </Badge>
                                                            <div className={cn("w-2 h-2 rounded-full", priorityColors[bug.priority as keyof typeof priorityColors])} />
                                                        </div>
                                                        <CardTitle className="text-lg font-black leading-tight group-hover:text-primary transition-colors">{bug.title}</CardTitle>
                                                    </CardHeader>
                                                    <CardContent className="p-6 pt-0 flex-1">
                                                        <p className="text-sm text-muted-foreground line-clamp-3 leading-relaxed mb-6 font-medium">{bug.description}</p>
                                                        <div className="flex items-center justify-between mt-auto pt-4 border-t border-border/20">
                                                            <span className="text-[10px] font-bold text-muted-foreground/40 uppercase tracking-widest">{format(new Date(bug.created_at), 'MMM d, yyyy')}</span>
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                className="h-8 px-3 rounded-lg hover:bg-destructive/10 hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                                                                onClick={() => setBugs(bugs.filter(b => b.id !== bug.id))}
                                                            >
                                                                <Trash2 className="h-3.5 w-3.5 mr-1" /> Delete
                                                            </Button>
                                                        </div>
                                                    </CardContent>
                                                </Card>
                                            </motion.div>
                                        ))
                                    )}
                                </AnimatePresence>
                            </div>
                        </div>
                    )}

                    {activeTab === "snippets" && (
                        <div className="space-y-8">
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                                <div className="space-y-1">
                                    <h2 className="text-2xl font-black tracking-tight">Snippet Vault</h2>
                                    <p className="text-muted-foreground">Store reusable logic, complex regex, and utility functions.</p>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="relative group min-w-[300px]">
                                        <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors" />
                                        <Input
                                            placeholder="Search snippets..."
                                            className="pl-12 h-12 bg-muted/30 border-none rounded-2xl focus-visible:ring-1"
                                            value={searchSnippet}
                                            onChange={(e) => setSearchSnippet(e.target.value)}
                                        />
                                    </div>
                                    <Button onClick={() => setIsSnippetDialogOpen(true)} size="lg" className="rounded-2xl h-12 shadow-xl shadow-primary/10 gap-2">
                                        <Plus className="h-5 w-5" /> New Snippet
                                    </Button>
                                </div>
                            </div>

                            <div className="grid gap-6 sm:grid-cols-2">
                                <AnimatePresence>
                                    {snippets.filter(s => s.title.toLowerCase().includes(searchSnippet.toLowerCase())).map((snippet: Snippet) => (
                                        <motion.div
                                            key={snippet.id}
                                            initial={{ opacity: 0, x: -10 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            exit={{ opacity: 0, x: 10 }}
                                            layout
                                        >
                                            <Card className="glass-premium border-border/30 overflow-hidden flex flex-col group h-full">
                                                <div className="p-5 border-b border-border/20 bg-muted/20 flex items-center justify-between">
                                                    <div className="flex items-center gap-3">
                                                        <div className="p-2 rounded-lg bg-primary/10">
                                                            <Code2 className="h-4 w-4 text-primary" />
                                                        </div>
                                                        <h3 className="font-black text-sm tracking-tight">{snippet.title}</h3>
                                                    </div>
                                                    <Badge variant="secondary" className="text-[9px] uppercase font-black px-2 py-0.5 rounded-md">{snippet.language}</Badge>
                                                </div>
                                                <CardContent className="p-0 flex-1 relative">
                                                    <div className="p-6 font-mono text-xs max-h-48 overflow-auto bg-black/5 dark:bg-black/40 text-muted-foreground leading-relaxed">
                                                        <pre>{snippet.code}</pre>
                                                    </div>
                                                    <div className="absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-card to-transparent pointer-events-none" />
                                                </CardContent>
                                                <div className="p-4 border-t border-border/20 flex items-center justify-between bg-muted/10 opacity-60 group-hover:opacity-100 transition-opacity">
                                                    <div className="flex gap-2">
                                                        {snippet.tags?.map((tag: string) => (
                                                            <Badge key={tag} variant="outline" className="text-[10px] px-2 py-0 border-border/40">#{tag}</Badge>
                                                        ))}
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl hover:bg-primary/10 hover:text-primary">
                                                            <Edit className="h-4 w-4" />
                                                        </Button>
                                                        <Button variant="ghost" size="icon" onClick={() => setSnippets(snippets.filter((s: Snippet) => s.id !== snippet.id))} className="h-9 w-9 rounded-xl hover:bg-destructive/10 hover:text-destructive">
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                </div>
                                            </Card>
                                        </motion.div>
                                    ))}
                                </AnimatePresence>
                            </div>

                            <Dialog open={isSnippetDialogOpen} onOpenChange={setIsSnippetDialogOpen}>
                                <DialogContent className="glass-premium border-border/40 max-w-2xl rounded-3xl">
                                    <DialogHeader>
                                        <DialogTitle className="text-2xl font-black">Save Snippet</DialogTitle>
                                    </DialogHeader>
                                    <div className="space-y-6 py-6 border-y border-border/20 my-4">
                                        <div className="grid grid-cols-2 gap-6">
                                            <div className="space-y-2">
                                                <Label className="text-xs font-black uppercase tracking-widest ml-1 opacity-60">Snippet Title</Label>
                                                <Input
                                                    placeholder="e.g., UseDebounce Hook"
                                                    className="h-12 bg-muted/30 border-none rounded-xl"
                                                    value={newSnippet.title}
                                                    onChange={(e) => setNewSnippet({ ...newSnippet, title: e.target.value })}
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label className="text-xs font-black uppercase tracking-widest ml-1 opacity-60">Language</Label>
                                                <Select value={newSnippet.language} onValueChange={(v) => setNewSnippet({ ...newSnippet, language: v })}>
                                                    <SelectTrigger className="h-12 bg-muted/30 border-none rounded-xl capitalize">
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent className="glass-premium border-border/40 rounded-xl">
                                                        <SelectItem value="javascript">JavaScript</SelectItem>
                                                        <SelectItem value="typescript">TypeScript</SelectItem>
                                                        <SelectItem value="python">Python</SelectItem>
                                                        <SelectItem value="css">CSS</SelectItem>
                                                        <SelectItem value="sql">SQL</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-xs font-black uppercase tracking-widest ml-1 opacity-60">Code Content</Label>
                                            <Textarea
                                                placeholder="Paste your source code here..."
                                                className="bg-muted/30 border-none rounded-xl min-h-[260px] font-mono text-sm p-6"
                                                value={newSnippet.code}
                                                onChange={(e) => setNewSnippet({ ...newSnippet, code: e.target.value })}
                                            />
                                        </div>
                                    </div>
                                    <DialogFooter className="gap-3">
                                        <Button variant="ghost" onClick={() => setIsSnippetDialogOpen(false)} className="rounded-xl h-12 px-6">Cancel</Button>
                                        <Button onClick={addSnippet} className="rounded-xl h-12 px-8 shadow-xl shadow-primary/10 gap-2 font-bold">
                                            <Save className="h-4 w-4" /> Save to Vault
                                        </Button>
                                    </DialogFooter>
                                </DialogContent>
                            </Dialog>
                        </div>
                    )}
                </motion.div>
            </AnimatePresence>
        </div>
    );
}
