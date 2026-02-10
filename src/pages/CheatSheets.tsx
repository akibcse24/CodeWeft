import { useState, useMemo, useRef, useCallback } from "react";
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
    Plus,
    Layers,
    Check,
    Sparkles,
    Zap,
    ChevronRight,
    SearchX,
    Trash2,
    Loader2,
    Palette,
    Download,
    Upload,
    GripVertical,
    Pencil,
    GitFork,
    X,
    PlusCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { useAI } from "@/hooks/useAI";
import { useCheatSheets, CheatSheet } from "@/hooks/useCheatSheets";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// ─── Color Palette for custom sheets ───
const COLOR_PALETTE = [
    { name: "Primary", value: "text-primary" },
    { name: "Orange", value: "text-orange-500" },
    { name: "Blue", value: "text-blue-500" },
    { name: "Indigo", value: "text-indigo-500" },
    { name: "Pink", value: "text-pink-500" },
    { name: "Emerald", value: "text-emerald-500" },
    { name: "Amber", value: "text-amber-500" },
    { name: "Violet", value: "text-violet-500" },
];

// ─── Static built-in sheets (read-only, forkable) ───
const STATIC_CHEATSHEETS = [
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
    const { generateCheatSheet, isSearching: aiSearching } = useAI();
    const { customSheets, isLoading, createSheet, deleteSheet, duplicateSheet, isDuplicating, isCreating, updateSheet, isUpdating } = useCheatSheets();

    const [search, setSearch] = useState("");
    const [activeSheetId, setActiveSheetId] = useState<string>(STATIC_CHEATSHEETS[0].id);
    const [copiedCmd, setCopiedCmd] = useState<string | null>(null);

    // AI/Create Dialog state
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [dialogTab, setDialogTab] = useState<"ai" | "manual">("manual");
    const [topic, setTopic] = useState("");
    const [previewSheet, setPreviewSheet] = useState<any>(null);

    // Manual Create form
    const [manualTitle, setManualTitle] = useState("");
    const [manualColor, setManualColor] = useState("text-primary");
    const [manualCategory, setManualCategory] = useState("");

    // Manual Item Dialog state
    const [isItemDialogOpen, setIsItemDialogOpen] = useState(false);
    const [editingItemIndex, setEditingItemIndex] = useState<number | null>(null);
    const [itemForm, setItemForm] = useState({ cmd: "", desc: "", cat: "" });

    // Inline title editing
    const [editingTitle, setEditingTitle] = useState(false);
    const [titleDraft, setTitleDraft] = useState("");

    // Color picker popover
    const [showColorPicker, setShowColorPicker] = useState(false);

    // Category management
    const [addingCategory, setAddingCategory] = useState(false);
    const [newCategoryName, setNewCategoryName] = useState("");
    const [editingCategory, setEditingCategory] = useState<string | null>(null);
    const [categoryDraft, setCategoryDraft] = useState("");

    // Drag and drop
    const [dragIndex, setDragIndex] = useState<number | null>(null);
    const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

    // Import ref
    const fileInputRef = useRef<HTMLInputElement>(null);

    const allSheets = useMemo(() => {
        const dynamic = customSheets.map(s => ({
            ...s,
            icon: Book,
            isCustom: true
        }));
        return [...STATIC_CHEATSHEETS, ...dynamic];
    }, [customSheets]);

    const activeSheet = useMemo(() => {
        return allSheets.find(s => s.id === activeSheetId) || allSheets[0];
    }, [allSheets, activeSheetId]);

    const isCustom = (activeSheet as any).isCustom === true;

    // ─── Clipboard ───
    const copyToClipboard = (cmd: string) => {
        navigator.clipboard.writeText(cmd);
        setCopiedCmd(cmd);
        toast({ title: "Command Copied!", description: cmd });
        setTimeout(() => setCopiedCmd(null), 2000);
    };

    // ─── AI Generate ───
    const handleGenerate = async () => {
        if (!topic) return;
        try {
            const result = await generateCheatSheet(topic);
            setPreviewSheet(result);
        } catch {
            toast({ title: "Generation failed", description: "Please try a different topic.", variant: "destructive" });
        }
    };

    const handleSaveAISheet = async () => {
        if (!previewSheet) return;
        try {
            await createSheet({
                title: previewSheet.title,
                categories: previewSheet.categories,
                items: previewSheet.items,
                color: "text-primary",
            });
            setIsDialogOpen(false);
            setTopic("");
            setPreviewSheet(null);
        } catch {
            // Error toast handled by hook
        }
    };

    // ─── Manual Create ───
    const handleManualCreate = async () => {
        if (!manualTitle.trim()) {
            toast({ title: "Title Required", description: "Give your cheat sheet a name.", variant: "destructive" });
            return;
        }
        const categories = manualCategory.trim() ? [manualCategory.trim()] : ["General"];
        try {
            await createSheet({
                title: manualTitle.trim(),
                categories,
                items: [],
                color: manualColor,
            });
            setIsDialogOpen(false);
            setManualTitle("");
            setManualColor("text-primary");
            setManualCategory("");
        } catch {
            // Error handled by hook
        }
    };

    // ─── Fork Static Sheet ───
    const handleForkSheet = async (sheet: typeof STATIC_CHEATSHEETS[0]) => {
        try {
            const result = await duplicateSheet({
                title: `${sheet.title} (Custom)`,
                categories: [...sheet.categories],
                items: [...sheet.items],
                color: sheet.color,
            });
            if (result?.id) setActiveSheetId(result.id);
        } catch {
            // Error handled by hook
        }
    };

    // ─── Delete Sheet ───
    const handleDeleteSheet = async (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        if (confirm("Delete this entire cheat sheet?")) {
            await deleteSheet(id);
            if (activeSheetId === id) {
                setActiveSheetId(STATIC_CHEATSHEETS[0].id);
            }
        }
    };

    // ─── Inline Title Edit ───
    const startTitleEdit = () => {
        if (!isCustom) return;
        setTitleDraft(activeSheet.title);
        setEditingTitle(true);
    };

    const saveTitleEdit = async () => {
        if (!titleDraft.trim() || !isCustom) return;
        try {
            await updateSheet({ id: activeSheet.id, title: titleDraft.trim() });
        } catch { /* hook handles */ }
        setEditingTitle(false);
    };

    // ─── Color Change ───
    const handleColorChange = async (color: string) => {
        if (!isCustom) return;
        try {
            await updateSheet({ id: activeSheet.id, color });
        } catch { /* hook handles */ }
        setShowColorPicker(false);
    };

    // ─── Category Management ───
    const handleAddCategory = async () => {
        if (!newCategoryName.trim() || !isCustom) return;
        const newCategories = [...activeSheet.categories, newCategoryName.trim()];
        try {
            await updateSheet({ id: activeSheet.id, categories: newCategories });
        } catch { /* hook handles */ }
        setAddingCategory(false);
        setNewCategoryName("");
    };

    const handleDeleteCategory = async (cat: string) => {
        if (!isCustom) return;
        const itemsInCat = activeSheet.items.filter(i => i.cat === cat);
        if (itemsInCat.length > 0) {
            toast({ title: "Category Not Empty", description: `Move or delete ${itemsInCat.length} item(s) first.`, variant: "destructive" });
            return;
        }
        const newCategories = activeSheet.categories.filter(c => c !== cat);
        try {
            await updateSheet({ id: activeSheet.id, categories: newCategories });
        } catch { /* hook handles */ }
    };

    const handleRenameCategory = async (oldName: string) => {
        if (!categoryDraft.trim() || !isCustom) return;
        const newCategories = activeSheet.categories.map(c => c === oldName ? categoryDraft.trim() : c);
        const newItems = activeSheet.items.map(i => i.cat === oldName ? { ...i, cat: categoryDraft.trim() } : i);
        try {
            await updateSheet({ id: activeSheet.id, categories: newCategories, items: newItems });
        } catch { /* hook handles */ }
        setEditingCategory(null);
        setCategoryDraft("");
    };

    // ─── Item CRUD ───
    const handleSaveItem = async () => {
        if (!itemForm.cmd || !itemForm.desc || !itemForm.cat) {
            toast({ title: "Validation Error", description: "Please fill all fields.", variant: "destructive" });
            return;
        }
        if (!isCustom) return;

        let newItems = [...activeSheet.items];
        let newCategories = [...activeSheet.categories];

        if (editingItemIndex !== null) {
            newItems[editingItemIndex] = { ...itemForm };
        } else {
            newItems.push({ ...itemForm });
        }

        if (!newCategories.includes(itemForm.cat)) {
            newCategories.push(itemForm.cat);
        }

        try {
            await updateSheet({ id: activeSheet.id, items: newItems, categories: newCategories });
            setIsItemDialogOpen(false);
            setItemForm({ cmd: "", desc: "", cat: "" });
            setEditingItemIndex(null);
        } catch { /* hook handles */ }
    };

    const handleDeleteItem = async (index: number) => {
        if (!isCustom) return;
        if (confirm("Delete this command?")) {
            const newItems = activeSheet.items.filter((_, i) => i !== index);
            try {
                await updateSheet({ id: activeSheet.id, items: newItems });
            } catch { /* hook handles */ }
        }
    };

    const openEditItem = (index: number) => {
        const item = activeSheet.items[index];
        setItemForm({ ...item });
        setEditingItemIndex(index);
        setIsItemDialogOpen(true);
    };

    // ─── Drag and Drop Reorder ───
    const handleDragStart = (index: number) => {
        if (!isCustom) return;
        setDragIndex(index);
    };

    const handleDragOver = (e: React.DragEvent, index: number) => {
        e.preventDefault();
        setDragOverIndex(index);
    };

    const handleDrop = useCallback(async (targetIndex: number) => {
        if (dragIndex === null || dragIndex === targetIndex || !isCustom) return;
        const newItems = [...activeSheet.items];
        const [moved] = newItems.splice(dragIndex, 1);
        newItems.splice(targetIndex, 0, moved);
        try {
            await updateSheet({ id: activeSheet.id, items: newItems });
        } catch { /* hook handles */ }
        setDragIndex(null);
        setDragOverIndex(null);
    }, [dragIndex, isCustom, activeSheet, updateSheet]);

    // ─── Export ───
    const handleExport = () => {
        const exportData = {
            title: activeSheet.title,
            categories: activeSheet.categories,
            items: activeSheet.items,
            color: (activeSheet as any).color || "text-primary",
        };
        const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${activeSheet.title.replace(/\s+/g, "-").toLowerCase()}.json`;
        a.click();
        URL.revokeObjectURL(url);
        toast({ title: "Exported!", description: `${activeSheet.title} saved as JSON.` });
    };

    // ─── Import ───
    const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = async (ev) => {
            try {
                const data = JSON.parse(ev.target?.result as string);
                if (!data.title || !data.items || !Array.isArray(data.items)) {
                    throw new Error("Invalid format");
                }
                await createSheet({
                    title: data.title,
                    categories: data.categories || ["General"],
                    items: data.items,
                    color: data.color || "text-primary",
                });
            } catch (err: any) {
                toast({ title: "Import Failed", description: err.message || "Invalid JSON file.", variant: "destructive" });
            }
        };
        reader.readAsText(file);
        // Reset input so same file can be re-imported
        e.target.value = "";
    };

    const filteredItems = activeSheet.items.filter(item =>
        item.cmd.toLowerCase().includes(search.toLowerCase()) ||
        item.desc.toLowerCase().includes(search.toLowerCase()) ||
        item.cat.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="space-y-12 animate-fade-in max-w-[1400px] mx-auto pb-20 p-6 flex flex-col min-h-screen">
            {/* Hidden file input for import */}
            <input ref={fileInputRef} type="file" accept=".json" className="hidden" onChange={handleImport} />

            {/* ─── HEADER ─── */}
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
                        Precision-engineered reference guides. Create manually, generate with AI, or fork built-in sheets.
                    </p>
                </div>

                <div className="flex items-center gap-3 relative z-10">
                    {/* Import / Export buttons */}
                    <Button
                        variant="outline"
                        size="icon"
                        className="h-12 w-12 rounded-xl border-border/40 hover:border-primary/40 hover:bg-primary/5"
                        onClick={() => fileInputRef.current?.click()}
                        title="Import JSON"
                    >
                        <Upload className="h-5 w-5" />
                    </Button>
                    <Button
                        variant="outline"
                        size="icon"
                        className="h-12 w-12 rounded-xl border-border/40 hover:border-primary/40 hover:bg-primary/5"
                        onClick={handleExport}
                        title="Export Active Sheet"
                    >
                        <Download className="h-5 w-5" />
                    </Button>

                    <div className="relative w-full lg:w-[350px]">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground/40" />
                        <Input
                            placeholder="Search commands..."
                            className="h-12 pl-12 pr-6 bg-muted/20 backdrop-blur-3xl border-border/40 rounded-2xl text-base font-medium shadow-2xl shadow-black/10 focus-visible:ring-primary/20 transition-all"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                {/* ─── NAVIGATION SIDEBAR ─── */}
                <div className="lg:col-span-3 space-y-4">
                    <div className="flex items-center gap-3 px-2 mb-6 uppercase tracking-[0.2em] text-[10px] font-black text-muted-foreground/60">
                        <Zap className="h-4 w-4" /> Available Protocols
                    </div>
                    <div className="grid gap-2">
                        {allSheets.map((sheet) => {
                            const Icon = (sheet as any).icon || Book;
                            const isActive = activeSheetId === sheet.id;
                            const sheetIsCustom = (sheet as any).isCustom;

                            return (
                                <motion.div
                                    whileHover={{ x: 5 }}
                                    key={sheet.id}
                                    className="group/item relative"
                                >
                                    <Button
                                        variant="ghost"
                                        className={cn(
                                            "w-full justify-start gap-4 h-16 rounded-2xl transition-all border border-transparent pr-10",
                                            isActive ? "bg-primary/5 border-primary/20 translate-x-1" : "hover:bg-muted/10"
                                        )}
                                        onClick={() => {
                                            setActiveSheetId(sheet.id);
                                            setSearch("");
                                            setEditingTitle(false);
                                            setShowColorPicker(false);
                                        }}
                                    >
                                        <div className={cn(
                                            "w-10 h-10 rounded-xl flex items-center justify-center transition-all",
                                            isActive ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20" : "bg-muted/40 text-muted-foreground group-hover:bg-muted"
                                        )}>
                                            <Icon className="h-5 w-5" />
                                        </div>
                                        <div className="flex flex-col items-start gap-0.5">
                                            <span className={cn("text-base font-black transition-colors truncate max-w-[140px]", isActive ? "text-foreground" : "text-muted-foreground")}>{sheet.title}</span>
                                            <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/40">{sheet.items.length} Commands</span>
                                        </div>
                                        {isActive && <ChevronRight className="h-4 w-4 ml-auto text-primary" />}
                                    </Button>

                                    {/* Actions on hover */}
                                    <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1 opacity-0 group-hover/item:opacity-100 transition-all">
                                        {!sheetIsCustom && (
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 text-muted-foreground hover:text-primary"
                                                onClick={(e) => { e.stopPropagation(); handleForkSheet(sheet as typeof STATIC_CHEATSHEETS[0]); }}
                                                title="Fork & Customize"
                                                disabled={isDuplicating}
                                            >
                                                {isDuplicating ? <Loader2 className="h-4 w-4 animate-spin" /> : <GitFork className="h-4 w-4" />}
                                            </Button>
                                        )}
                                        {sheetIsCustom && (
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 text-muted-foreground hover:text-destructive transition-all"
                                                onClick={(e) => handleDeleteSheet(e, sheet.id)}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        )}
                                    </div>
                                </motion.div>
                            );
                        })}
                    </div>

                    {/* ─── ADD CUSTOM SHEET DIALOG (Dual Mode) ─── */}
                    <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if (!open) { setPreviewSheet(null); setTopic(""); } }}>
                        <DialogTrigger asChild>
                            <Button variant="outline" className="w-full h-16 rounded-2xl border-2 border-dashed border-border/40 text-muted-foreground hover:text-primary hover:border-primary/40 hover:bg-primary/5 mt-4 group">
                                <Plus className="h-5 w-5 mr-3 transition-transform group-hover:rotate-90" /> Add Custom Sheet
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="glass-premium border-border/40 sm:max-w-[600px]">
                            <DialogHeader>
                                <DialogTitle className="text-2xl font-black italic uppercase tracking-tight flex items-center gap-2">
                                    <Sparkles className="h-5 w-5 text-primary" />
                                    New Cheat Sheet
                                </DialogTitle>
                                <DialogDescription>
                                    Create a sheet manually or let AI generate one for you.
                                </DialogDescription>
                            </DialogHeader>

                            <Tabs value={dialogTab} onValueChange={(v) => setDialogTab(v as "ai" | "manual")} className="mt-2">
                                <TabsList className="w-full rounded-xl bg-muted/30 h-12">
                                    <TabsTrigger value="manual" className="flex-1 rounded-lg h-10 text-xs font-black uppercase tracking-widest data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                                        <Pencil className="h-4 w-4 mr-2" /> Manual
                                    </TabsTrigger>
                                    <TabsTrigger value="ai" className="flex-1 rounded-lg h-10 text-xs font-black uppercase tracking-widest data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                                        <Zap className="h-4 w-4 mr-2" /> AI Generate
                                    </TabsTrigger>
                                </TabsList>

                                {/* ── Manual Tab ── */}
                                <TabsContent value="manual" className="space-y-5 pt-4">
                                    <div className="space-y-2">
                                        <label className="text-xs font-black uppercase tracking-widest text-muted-foreground px-1">Sheet Title</label>
                                        <Input
                                            placeholder="e.g. My Python Snippets"
                                            value={manualTitle}
                                            onChange={(e) => setManualTitle(e.target.value)}
                                            className="h-12 rounded-xl bg-muted/20 border-border/40"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-black uppercase tracking-widest text-muted-foreground px-1">Initial Category</label>
                                        <Input
                                            placeholder="e.g. Basics (optional, defaults to General)"
                                            value={manualCategory}
                                            onChange={(e) => setManualCategory(e.target.value)}
                                            className="h-12 rounded-xl bg-muted/20 border-border/40"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-black uppercase tracking-widest text-muted-foreground px-1">Accent Color</label>
                                        <div className="flex gap-2 flex-wrap">
                                            {COLOR_PALETTE.map(c => (
                                                <button
                                                    key={c.value}
                                                    onClick={() => setManualColor(c.value)}
                                                    className={cn(
                                                        "w-9 h-9 rounded-xl border-2 transition-all flex items-center justify-center",
                                                        manualColor === c.value ? "border-foreground scale-110 shadow-lg" : "border-transparent hover:border-border"
                                                    )}
                                                    title={c.name}
                                                >
                                                    <div className={cn("w-5 h-5 rounded-full", c.value.replace("text-", "bg-"))} />
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                    <DialogFooter>
                                        <Button variant="ghost" onClick={() => setIsDialogOpen(false)} className="rounded-xl">Cancel</Button>
                                        <Button onClick={handleManualCreate} disabled={isCreating} className="rounded-xl px-8 gap-2">
                                            {isCreating && <Loader2 className="h-4 w-4 animate-spin" />}
                                            Create Sheet
                                        </Button>
                                    </DialogFooter>
                                </TabsContent>

                                {/* ── AI Tab ── */}
                                <TabsContent value="ai" className="space-y-5 pt-4">
                                    <div className="space-y-2">
                                        <label className="text-xs font-black uppercase tracking-widest text-muted-foreground px-1">Subject Matter</label>
                                        <div className="flex gap-2">
                                            <Input
                                                placeholder="e.g. Kubernetes, React Hooks, Vim..."
                                                value={topic}
                                                onChange={(e) => setTopic(e.target.value)}
                                                onKeyDown={(e) => e.key === 'Enter' && handleGenerate()}
                                                className="h-12 rounded-xl bg-muted/20 border-border/40"
                                            />
                                            <Button
                                                onClick={handleGenerate}
                                                disabled={aiSearching || !topic}
                                                className="h-12 rounded-xl px-6 gap-2"
                                            >
                                                {aiSearching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Zap className="h-4 w-4" />}
                                                Generate
                                            </Button>
                                        </div>
                                    </div>

                                    {previewSheet && (
                                        <div className="space-y-4 animate-in fade-in slide-in-from-top-4">
                                            <div className="p-4 rounded-xl bg-muted/20 border border-border/40 space-y-4">
                                                <h4 className="font-black italic flex items-center gap-2 text-primary">
                                                    <Check className="h-4 w-4" />
                                                    {previewSheet.title}
                                                </h4>
                                                <div className="max-h-[250px] overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                                                    {previewSheet.items.map((item: any, i: number) => (
                                                        <div key={i} className="text-xs p-2 rounded-lg bg-background/50 border border-border/10">
                                                            <code className="text-primary font-mono">{item.cmd}</code>
                                                            <p className="text-muted-foreground mt-1">{item.desc}</p>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                    <DialogFooter>
                                        <Button variant="ghost" onClick={() => setIsDialogOpen(false)} className="rounded-xl">Cancel</Button>
                                        <Button
                                            onClick={handleSaveAISheet}
                                            disabled={!previewSheet || isCreating}
                                            className="rounded-xl px-8 gap-2"
                                        >
                                            {isCreating && <Loader2 className="h-4 w-4 animate-spin" />}
                                            Deploy Protocol
                                        </Button>
                                    </DialogFooter>
                                </TabsContent>
                            </Tabs>
                        </DialogContent>
                    </Dialog>
                </div>

                {/* ─── CONTENT AREA ─── */}
                <div className="lg:col-span-9 space-y-8">
                    {/* ── Sheet Header (editable for custom) ── */}
                    <div className="flex items-center gap-4 flex-wrap">
                        {editingTitle && isCustom ? (
                            <div className="flex items-center gap-2">
                                <Input
                                    value={titleDraft}
                                    onChange={(e) => setTitleDraft(e.target.value)}
                                    onKeyDown={(e) => { if (e.key === "Enter") saveTitleEdit(); if (e.key === "Escape") setEditingTitle(false); }}
                                    className="h-10 w-64 rounded-xl bg-muted/20 border-primary/40 text-lg font-black"
                                    autoFocus
                                />
                                <Button size="icon" variant="ghost" className="h-8 w-8 rounded-lg" onClick={saveTitleEdit}>
                                    <Check className="h-4 w-4 text-primary" />
                                </Button>
                                <Button size="icon" variant="ghost" className="h-8 w-8 rounded-lg" onClick={() => setEditingTitle(false)}>
                                    <X className="h-4 w-4" />
                                </Button>
                            </div>
                        ) : (
                            <button
                                onClick={startTitleEdit}
                                className={cn(
                                    "text-2xl font-black tracking-tight flex items-center gap-2 transition-colors",
                                    isCustom ? "hover:text-primary cursor-pointer" : "cursor-default"
                                )}
                                disabled={!isCustom}
                            >
                                {activeSheet.title}
                                {isCustom && <Pencil className="h-4 w-4 text-muted-foreground/40" />}
                            </button>
                        )}

                        {/* Color picker for custom sheets */}
                        {isCustom && (
                            <div className="relative">
                                <Button
                                    variant="outline"
                                    size="icon"
                                    className="h-9 w-9 rounded-xl border-border/40"
                                    onClick={() => setShowColorPicker(!showColorPicker)}
                                    title="Change Color"
                                >
                                    <Palette className="h-4 w-4" />
                                </Button>
                                {showColorPicker && (
                                    <div className="absolute top-full mt-2 left-0 z-50 p-3 rounded-xl bg-background/95 backdrop-blur-xl border border-border/40 shadow-2xl flex gap-2">
                                        {COLOR_PALETTE.map(c => (
                                            <button
                                                key={c.value}
                                                onClick={() => handleColorChange(c.value)}
                                                className={cn(
                                                    "w-8 h-8 rounded-lg border-2 transition-all flex items-center justify-center hover:scale-110",
                                                    (activeSheet as any).color === c.value ? "border-foreground shadow-lg" : "border-transparent"
                                                )}
                                                title={c.name}
                                            >
                                                <div className={cn("w-4 h-4 rounded-full", c.value.replace("text-", "bg-"))} />
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* ── Category Toolbar ── */}
                    <div className="flex items-center gap-3 flex-wrap bg-muted/20 p-4 rounded-2xl border border-border/40 backdrop-blur-xl">
                        <Badge variant="outline" className="h-10 px-4 rounded-xl border-border/40 bg-background/50 flex items-center gap-2">
                            <Layers className="h-3.5 w-3.5 text-primary" />
                            <span className="font-black uppercase tracking-widest text-[10px]">{activeSheet.categories.length} Categories</span>
                        </Badge>

                        {activeSheet.categories.map(cat => (
                            <div key={cat} className="relative group/cat flex items-center">
                                {editingCategory === cat && isCustom ? (
                                    <div className="flex items-center gap-1">
                                        <Input
                                            value={categoryDraft}
                                            onChange={(e) => setCategoryDraft(e.target.value)}
                                            onKeyDown={(e) => { if (e.key === "Enter") handleRenameCategory(cat); if (e.key === "Escape") setEditingCategory(null); }}
                                            className="h-8 w-28 rounded-lg text-xs bg-muted/30 border-primary/40"
                                            autoFocus
                                        />
                                        <Button size="icon" variant="ghost" className="h-7 w-7 rounded-md" onClick={() => handleRenameCategory(cat)}>
                                            <Check className="h-3 w-3" />
                                        </Button>
                                    </div>
                                ) : (
                                    <button
                                        onClick={() => setSearch(search === cat ? "" : cat)}
                                        onDoubleClick={() => {
                                            if (isCustom) {
                                                setCategoryDraft(cat);
                                                setEditingCategory(cat);
                                            }
                                        }}
                                        className={cn(
                                            "h-10 px-4 rounded-xl transition-all font-black uppercase tracking-widest text-[10px] border",
                                            search === cat ? "bg-primary text-primary-foreground border-primary" : "bg-muted/40 text-muted-foreground hover:bg-muted hover:text-foreground border-transparent hover:border-border/40"
                                        )}
                                    >
                                        {cat}
                                    </button>
                                )}
                                {isCustom && editingCategory !== cat && (
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-6 w-6 rounded-full opacity-0 group-hover/cat:opacity-100 transition-all absolute -top-2 -right-2 bg-destructive/80 text-destructive-foreground hover:bg-destructive"
                                        onClick={() => handleDeleteCategory(cat)}
                                        title="Remove category"
                                    >
                                        <X className="h-3 w-3" />
                                    </Button>
                                )}
                            </div>
                        ))}

                        {/* Add Category */}
                        {isCustom && (
                            addingCategory ? (
                                <div className="flex items-center gap-1">
                                    <Input
                                        value={newCategoryName}
                                        onChange={(e) => setNewCategoryName(e.target.value)}
                                        onKeyDown={(e) => { if (e.key === "Enter") handleAddCategory(); if (e.key === "Escape") setAddingCategory(false); }}
                                        placeholder="Category name"
                                        className="h-8 w-32 rounded-lg text-xs bg-muted/30 border-primary/40"
                                        autoFocus
                                    />
                                    <Button size="icon" variant="ghost" className="h-7 w-7 rounded-md" onClick={handleAddCategory}>
                                        <Check className="h-3 w-3" />
                                    </Button>
                                    <Button size="icon" variant="ghost" className="h-7 w-7 rounded-md" onClick={() => setAddingCategory(false)}>
                                        <X className="h-3 w-3" />
                                    </Button>
                                </div>
                            ) : (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-10 px-3 rounded-xl text-muted-foreground hover:text-primary border border-dashed border-border/40 hover:border-primary/40"
                                    onClick={() => setAddingCategory(true)}
                                >
                                    <PlusCircle className="h-4 w-4 mr-1" /> Category
                                </Button>
                            )
                        )}

                        {/* Add Command button for custom sheets */}
                        {isCustom && (
                            <Dialog open={isItemDialogOpen} onOpenChange={setIsItemDialogOpen}>
                                <DialogTrigger asChild>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => {
                                            setEditingItemIndex(null);
                                            setItemForm({ cmd: "", desc: "", cat: activeSheet.categories[0] || "" });
                                        }}
                                        className="h-10 px-4 rounded-xl border-primary/20 bg-primary/5 text-primary hover:bg-primary/10 ml-auto"
                                    >
                                        <Plus className="h-4 w-4 mr-2" /> Add Command
                                    </Button>
                                </DialogTrigger>
                                <DialogContent className="glass-premium border-border/40">
                                    <DialogHeader>
                                        <DialogTitle className="text-xl font-black italic uppercase tracking-tight">
                                            {editingItemIndex !== null ? "Edit Command" : "New Command"}
                                        </DialogTitle>
                                    </DialogHeader>
                                    <div className="space-y-4 py-4">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-1">Command Sequence</label>
                                            <Input
                                                placeholder="e.g. git commit -m '...'"
                                                value={itemForm.cmd}
                                                onChange={(e) => setItemForm({ ...itemForm, cmd: e.target.value })}
                                                className="h-12 bg-muted/20 border-border/40 rounded-xl font-mono"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-1">Protocol Description</label>
                                            <Textarea
                                                placeholder="What does this do?"
                                                value={itemForm.desc}
                                                onChange={(e) => setItemForm({ ...itemForm, desc: e.target.value })}
                                                className="bg-muted/20 border-border/40 rounded-xl min-h-[100px]"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-1">Category</label>
                                            <Input
                                                placeholder="e.g. Basics, Advanced..."
                                                value={itemForm.cat}
                                                onChange={(e) => setItemForm({ ...itemForm, cat: e.target.value })}
                                                className="h-12 bg-muted/20 border-border/40 rounded-xl"
                                            />
                                        </div>
                                    </div>
                                    <DialogFooter>
                                        <Button variant="ghost" onClick={() => setIsItemDialogOpen(false)}>Cancel</Button>
                                        <Button onClick={handleSaveItem} disabled={isUpdating}>
                                            {isUpdating && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                                            Save Command
                                        </Button>
                                    </DialogFooter>
                                </DialogContent>
                            </Dialog>
                        )}
                    </div>

                    {/* ── Items Grid ── */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <AnimatePresence mode="popLayout">
                            {filteredItems.map((item, i) => {
                                const realIndex = activeSheet.items.findIndex(it => it.cmd === item.cmd && it.desc === item.desc);

                                return (
                                    <motion.div
                                        key={`${activeSheet.id}-${realIndex}`}
                                        layout
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{
                                            opacity: 1,
                                            y: 0,
                                            scale: dragOverIndex === realIndex ? 1.02 : 1,
                                            borderColor: dragOverIndex === realIndex ? "hsl(var(--primary))" : "transparent",
                                        }}
                                        exit={{ opacity: 0, scale: 0.9 }}
                                        transition={{ duration: 0.3, delay: i * 0.03 }}
                                        draggable={isCustom}
                                        onDragStart={() => handleDragStart(realIndex)}
                                        onDragOver={(e: any) => handleDragOver(e, realIndex)}
                                        onDrop={() => handleDrop(realIndex)}
                                        onDragEnd={() => { setDragIndex(null); setDragOverIndex(null); }}
                                    >
                                        <Card className={cn(
                                            "glass-premium border-border/30 hover:border-primary/40 transition-all duration-500 group overflow-hidden h-full flex flex-col relative",
                                            dragIndex === realIndex && "opacity-50"
                                        )}>
                                            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-[48px] -mr-16 -mt-16 opacity-0 group-hover:opacity-100 transition-opacity" />
                                            <CardHeader className="p-6 pb-2 space-y-4 relative z-10">
                                                <div className="flex items-center justify-between">
                                                    <Badge variant="secondary" className="bg-primary/5 text-primary border-none rounded-lg px-2 py-0.5 text-[9px] font-black uppercase tracking-widest">
                                                        {item.cat}
                                                    </Badge>
                                                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
                                                        {isCustom && (
                                                            <>
                                                                <div className="cursor-grab active:cursor-grabbing mr-1" title="Drag to reorder">
                                                                    <GripVertical className="h-4 w-4 text-muted-foreground/40" />
                                                                </div>
                                                                <Button
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    className="h-8 w-8 rounded-lg hover:bg-primary/10"
                                                                    onClick={() => openEditItem(realIndex)}
                                                                >
                                                                    <Pencil className="h-3.5 w-3.5" />
                                                                </Button>
                                                                <Button
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    className="h-8 w-8 rounded-lg hover:bg-destructive/10 hover:text-destructive"
                                                                    onClick={() => handleDeleteItem(realIndex)}
                                                                >
                                                                    <Trash2 className="h-3.5 w-3.5" />
                                                                </Button>
                                                            </>
                                                        )}
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-8 w-8 rounded-lg hover:bg-primary hover:text-primary-foreground transform active:scale-95"
                                                            onClick={() => copyToClipboard(item.cmd)}
                                                        >
                                                            {copiedCmd === item.cmd ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                                                        </Button>
                                                    </div>
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
                                );
                            })}
                        </AnimatePresence>
                    </div>

                    {/* ── Empty State ── */}
                    {(filteredItems.length === 0 || isLoading) && (
                        <div className="flex flex-col items-center justify-center py-32 bg-dot-pattern rounded-[3rem] border-2 border-dashed border-border/40">
                            {isLoading ? (
                                <Loader2 className="h-10 w-10 text-primary animate-spin" />
                            ) : (
                                <>
                                    <div className="w-20 h-20 bg-muted/40 rounded-full flex items-center justify-center mb-8">
                                        <SearchX className="h-10 w-10 text-muted-foreground/20" />
                                    </div>
                                    <h3 className="text-xl font-black mb-2 uppercase tracking-widest">
                                        {activeSheet.items.length === 0 && isCustom ? "Empty Sheet" : "No Results"}
                                    </h3>
                                    <p className="text-muted-foreground text-sm font-medium mb-8 italic">
                                        {activeSheet.items.length === 0 && isCustom
                                            ? "Click \"Add Command\" above to start building your reference."
                                            : `No commands found for "${search}"`
                                        }
                                    </p>
                                    {search && (
                                        <Button variant="outline" className="rounded-xl h-12 px-6 font-black uppercase tracking-widest text-[10px]" onClick={() => setSearch("")}>
                                            Clear Search
                                        </Button>
                                    )}
                                </>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
