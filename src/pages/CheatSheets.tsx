import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Book,
    Search,
    Copy,
    Terminal,
    GitBranch,
    Container,
    Layout,
    Database,
    ExternalLink,
    Plus,
    Filter,
    Layers,
    Check,
    Sparkles,
    Zap,
    ChevronRight,
    SearchX
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

const CHEATSHEETS = [
    {
        id: "git",
        title: "Git Commands",
        icon: GitBranch,
        color: "text-orange-500",
        categories: ["Basics", "Branches", "Stashing", "Undo"],
        items: [
            { cmd: "git init", desc: "Initialize a local Git repository", cat: "Basics" },
            { cmd: "git clone <url>", desc: "Create a local copy of a remote repo", cat: "Basics" },
            { cmd: "git add .", desc: "Add all current changes to the next commit", cat: "Basics" },
            { cmd: "git commit -m '<msg>'", desc: "Commit staged changes", cat: "Basics" },
            { cmd: "git checkout -b <name>", desc: "Create and switch to a new branch", cat: "Branches" },
            { cmd: "git merge <branch>", desc: "Merge a branch into the active branch", cat: "Branches" },
            { cmd: "git status", desc: "List new or modified files not yet committed", cat: "Basics" },
            { cmd: "git stash", desc: "Temporarily store modified, tracked files", cat: "Stashing" },
            { cmd: "git reset --hard HEAD", desc: "Discard all local changes", cat: "Undo" },
        ]
    },
    {
        id: "docker",
        title: "Docker CLI",
        icon: Container,
        color: "text-blue-500",
        categories: ["Containers", "Images", "Cleanup"],
        items: [
            { cmd: "docker ps", desc: "List running containers", cat: "Containers" },
            { cmd: "docker images", desc: "List available images", cat: "Images" },
            { cmd: "docker build -t <tag> .", desc: "Build an image from a Dockerfile", cat: "Images" },
            { cmd: "docker run <image>", desc: "Run a container from an image", cat: "Containers" },
            { cmd: "docker stop <id>", desc: "Stop a running container", cat: "Containers" },
            { cmd: "docker rm <id>", desc: "Remove a container", cat: "Containers" },
            { cmd: "docker system prune", desc: "Remove all unused data", cat: "Cleanup" },
        ]
    },
    {
        id: "css",
        title: "CSS Layouts",
        icon: Layout,
        color: "text-indigo-500",
        categories: ["Flexbox", "Grid"],
        items: [
            { cmd: "display: flex;", desc: "Start a flex layout", cat: "Flexbox" },
            { cmd: "justify-content: center;", desc: "Center on main axis", cat: "Flexbox" },
            { cmd: "align-items: center;", desc: "Center on cross axis", cat: "Flexbox" },
            { cmd: "flex-direction: column;", desc: "Stack items vertically", cat: "Flexbox" },
            { cmd: "display: grid;", desc: "Start a grid layout", cat: "Grid" },
            { cmd: "grid-template-columns: repeat(3, 1fr);", desc: "3 equal columns", cat: "Grid" },
            { cmd: "gap: 20px;", desc: "Space between items", cat: "Grid" },
        ]
    },
    {
        id: "sql",
        title: "SQL Querying",
        icon: Database,
        color: "text-pink-500",
        categories: ["Select", "Joins", "Modify"],
        items: [
            { cmd: "SELECT * FROM <table>;", desc: "Fetch all columns", cat: "Select" },
            { cmd: "WHERE <cond> AND <cond>;", desc: "Filter results", cat: "Select" },
            { cmd: "JOIN <tbl> ON <rel>;", desc: "Combine two tables", cat: "Joins" },
            { cmd: "INSERT INTO <table> (...);", desc: "Create new record", cat: "Modify" },
            { cmd: "UPDATE <table> SET ...;", desc: "Update existing record", cat: "Modify" },
        ]
    }
];

export default function CheatSheets() {
    const { toast } = useToast();
    const [search, setSearch] = useState("");
    const [activeSheet, setActiveSheet] = useState(CHEATSHEETS[0]);
    const [copiedCmd, setCopiedCmd] = useState<string | null>(null);

    const copyToClipboard = (cmd: string) => {
        navigator.clipboard.writeText(cmd);
        setCopiedCmd(cmd);
        toast({ title: "Command Copied!", description: cmd });
        setTimeout(() => setCopiedCmd(null), 2000);
    };

    const filteredItems = activeSheet.items.filter(item =>
        item.cmd.toLowerCase().includes(search.toLowerCase()) ||
        item.desc.toLowerCase().includes(search.toLowerCase()) ||
        item.cat.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="space-y-12 animate-fade-in max-w-[1400px] mx-auto pb-20 p-6 flex flex-col min-h-screen">
            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8 relative">
                <div className="absolute -left-20 -top-20 w-80 h-80 bg-primary/5 rounded-full blur-[120px] pointer-events-none" />
                <div className="space-y-4 relative z-10">
                    <div className="flex items-center gap-2 text-primary">
                        <Sparkles className="h-5 w-5 animate-pulse" />
                        <span className="text-xs font-black uppercase tracking-[0.3em]">Knowledge Base</span>
                    </div>
                    <h1 className="text-6xl font-black tracking-tighter bg-clip-text text-transparent bg-gradient-to-br from-foreground to-foreground/40 leading-tight">
                        Cheat Sheets
                    </h1>
                    <p className="text-muted-foreground text-xl max-w-xl font-medium leading-relaxed">
                        Precision-engineered reference guides for high-velocity engineering workflows.
                    </p>
                </div>

                <div className="relative w-full lg:w-[400px] z-10">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground/40" />
                    <Input
                        placeholder="Search for command sequences..."
                        className="h-16 pl-12 pr-6 bg-muted/20 backdrop-blur-3xl border-border/40 rounded-2xl text-lg font-medium shadow-2xl shadow-black/10 focus-visible:ring-primary/20 transition-all"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                {/* Navigation Sidebar */}
                <div className="lg:col-span-3 space-y-4">
                    <div className="flex items-center gap-3 px-2 mb-6 uppercase tracking-[0.2em] text-[10px] font-black text-muted-foreground/60">
                        <Zap className="h-4 w-4" /> Available Protocols
                    </div>
                    <div className="grid gap-2">
                        {CHEATSHEETS.map((sheet) => {
                            const Icon = sheet.icon;
                            const isActive = activeSheet.id === sheet.id;
                            return (
                                <motion.div
                                    whileHover={{ x: 5 }}
                                    key={sheet.id}
                                >
                                    <Button
                                        variant="ghost"
                                        className={cn(
                                            "w-full justify-start gap-4 h-16 rounded-2xl transition-all border border-transparent",
                                            isActive ? "bg-primary/5 border-primary/20 translate-x-1" : "hover:bg-muted/10"
                                        )}
                                        onClick={() => {
                                            setActiveSheet(sheet);
                                            setSearch("");
                                        }}
                                    >
                                        <div className={cn(
                                            "w-10 h-10 rounded-xl flex items-center justify-center transition-all",
                                            isActive ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20" : "bg-muted/40 text-muted-foreground group-hover:bg-muted"
                                        )}>
                                            <Icon className="h-5 w-5" />
                                        </div>
                                        <div className="flex flex-col items-start gap-0.5">
                                            <span className={cn("text-base font-black transition-colors", isActive ? "text-foreground" : "text-muted-foreground")}>{sheet.title}</span>
                                            <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/40">{sheet.items.length} Shortcuts</span>
                                        </div>
                                        {isActive && <ChevronRight className="h-4 w-4 ml-auto text-primary" />}
                                    </Button>
                                </motion.div>
                            );
                        })}
                    </div>
                    <Button variant="outline" className="w-full h-16 rounded-2xl border-2 border-dashed border-border/40 text-muted-foreground hover:text-primary hover:border-primary/40 hover:bg-primary/5 mt-4 group">
                        <Plus className="h-5 w-5 mr-3 transition-transform group-hover:rotate-90" /> Request Module
                    </Button>
                </div>

                {/* Content Area */}
                <div className="lg:col-span-9 space-y-8">
                    <div className="flex items-center gap-4 flex-wrap bg-muted/20 p-4 rounded-2xl border border-border/40 backdrop-blur-xl">
                        <Badge variant="outline" className="h-10 px-4 rounded-xl border-border/40 bg-background/50 flex items-center gap-2">
                            <Layers className="h-3.5 w-3.5 text-primary" />
                            <span className="font-black uppercase tracking-widest text-[10px]">{activeSheet.categories.length} Sub-Protocols</span>
                        </Badge>
                        {activeSheet.categories.map(cat => (
                            <button key={cat} onClick={() => setSearch(cat)} className="h-10 px-4 rounded-xl bg-muted/40 hover:bg-muted transition-all font-black uppercase tracking-widest text-[10px] text-muted-foreground hover:text-foreground border border-transparent hover:border-border/40">
                                {cat}
                            </button>
                        ))}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <AnimatePresence mode="popLayout">
                            {filteredItems.map((item, i) => (
                                <motion.div
                                    key={item.cmd}
                                    layout
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.9 }}
                                    transition={{ duration: 0.3, delay: i * 0.03 }}
                                >
                                    <Card className="glass-premium border-border/30 hover:border-primary/40 transition-all duration-500 group overflow-hidden h-full flex flex-col relative">
                                        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-[48px] -mr-16 -mt-16 opacity-0 group-hover:opacity-100 transition-opacity" />
                                        <CardHeader className="p-6 pb-2 space-y-4 relative z-10">
                                            <div className="flex items-center justify-between">
                                                <Badge variant="secondary" className="bg-primary/5 text-primary border-none rounded-lg px-2 py-0.5 text-[9px] font-black uppercase tracking-widest">
                                                    {item.cat}
                                                </Badge>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-9 w-9 rounded-xl opacity-0 group-hover:opacity-100 transition-all hover:bg-primary hover:text-primary-foreground transform active:scale-95"
                                                    onClick={() => copyToClipboard(item.cmd)}
                                                >
                                                    {copiedCmd === item.cmd ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                                                </Button>
                                            </div>
                                        </CardHeader>
                                        <CardContent className="p-6 pt-2 flex-1 flex flex-col justify-between gap-6 relative z-10">
                                            <div className="space-y-4">
                                                <code className="bg-black/50 text-indigo-300 p-4 rounded-xl text-sm font-mono block border border-white/5 break-all shadow-inner leading-relaxed group-hover:text-primary transition-colors">
                                                    {item.cmd}
                                                </code>
                                                <p className="text-sm font-medium text-muted-foreground/80 leading-relaxed italic px-1">
                                                    {item.desc}
                                                </p>
                                            </div>
                                            <div className="h-1 w-0 group-hover:w-full bg-primary transition-all duration-700 rounded-full" />
                                        </CardContent>
                                    </Card>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>

                    {filteredItems.length === 0 && (
                        <div className="flex flex-col items-center justify-center py-32 bg-dot-pattern rounded-[3rem] border-2 border-dashed border-border/40">
                            <div className="w-20 h-20 bg-muted/40 rounded-full flex items-center justify-center mb-8">
                                <SearchX className="h-10 w-10 text-muted-foreground/20" />
                            </div>
                            <h3 className="text-xl font-black mb-2 uppercase tracking-widest">Protocol Null</h3>
                            <p className="text-muted-foreground text-sm font-medium mb-8 italic">No commands localized for "{search}"</p>
                            <Button variant="outline" className="rounded-xl h-12 px-6 font-black uppercase tracking-widest text-[10px]" onClick={() => setSearch("")}>
                                Clear Transmission
                            </Button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
