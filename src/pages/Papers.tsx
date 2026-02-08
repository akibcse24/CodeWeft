import { useState } from "react";
import { Plus, FileText, Search, ExternalLink, Trash2, BookOpen, Calendar, Tag, Edit, Loader2, Copy, Sparkles, LayoutGrid, List as ListIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { usePapers, Paper } from "@/hooks/usePapers";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import WritingCenter from "@/components/research/WritingCenter";
import ResearchGraph from "@/components/research/ResearchGraph";
import { Share2, Wand2, Zap } from "lucide-react";
import { fetchArXivMetadata, fetchCrossrefMetadata, identifyInputType } from "@/utils/researchUtils";
import ResearchAIAssistant from "@/components/research/ResearchAIAssistant";
import { MessageSquareText, Upload } from "lucide-react";
import { uploadPaper } from "@/utils/storageUtils";

export default function Papers() {
  const { user } = useAuth();
  const { papers, isLoading, createPaper, updatePaper, deletePaper } = usePapers();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPaper, setEditingPaper] = useState<Paper | null>(null);
  const [viewMode, setViewMode] = useState<"gallery" | "list" | "graph">("gallery");
  const [activeTab, setActiveTab] = useState<"library" | "writing">("library");
  const [importId, setImportId] = useState("");
  const [isImporting, setIsImporting] = useState(false);
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [showAiAssistant, setShowAiAssistant] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const [newPaper, setNewPaper] = useState({
    title: "",
    authors: "",
    publication_year: new Date().getFullYear().toString(),
    url: "",
    status: "to_read",
    notes: "",
    tags: [] as string[],
    bibtex: "",
    summary: "",
    progress_percentage: 0
  });

  const generateBibTeX = (paper: Paper) => {
    const authors = paper.authors && paper.authors.length > 0
      ? paper.authors.join(" and ")
      : "Unknown Author";
    const year = paper.publication_year || "n.d.";
    const firstAuthor = paper.authors && paper.authors.length > 0
      ? paper.authors[0].split(" ").pop()?.toLowerCase() || "author"
      : "author";
    const key = `${firstAuthor}${year}${paper.title.split(" ")[0].toLowerCase().replace(/[^a-z0-9]/g, "")}`;

    return `@article{${key},
  title={${paper.title}},
  author={${authors}},
  year={${year}},
  url={${paper.url || ""}}
}`;
  };

  const copyToClipboard = (text: string, message: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: message });
  };

  const handleMagicImport = async () => {
    if (!importId.trim()) return;

    setIsImporting(true);
    try {
      const type = identifyInputType(importId);
      let metadata;

      if (type === "arxiv") {
        metadata = await fetchArXivMetadata(importId);
      } else if (type === "doi") {
        metadata = await fetchCrossrefMetadata(importId);
      } else {
        throw new Error("Invalid DOI or ArXiv ID format");
      }

      await createPaper.mutateAsync({
        title: metadata.title,
        authors: metadata.authors,
        publication_year: metadata.publication_year,
        url: metadata.url,
        status: "to_read",
        summary: metadata.abstract || "",
        user_id: user?.id as string,
        progress_percentage: 0,
        tags: [],
        notes: null,
        bibtex: null
      });

      toast({ title: "Paper imported successfully!", description: metadata.title });
      setIsImportDialogOpen(false);
      setImportId("");
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Handshake failure";
      toast({
        title: "Import failed",
        description: message || "Please check the ID and try again",
        variant: "destructive"
      });
    } finally {
      setIsImporting(false);
    }
  };

  const handleCreatePaper = async () => {
    if (!user) return;

    try {
      let finalUrl = newPaper.url;

      if (selectedFile && user?.id) {
        setIsUploading(true);
        finalUrl = await uploadPaper(selectedFile, user.id);
      }

      await createPaper.mutateAsync({
        title: newPaper.title,
        authors: newPaper.authors ? newPaper.authors.split(',').map(a => a.trim()) : [],
        publication_year: parseInt(newPaper.publication_year) || null,
        url: finalUrl || null,
        status: newPaper.status as "to_read" | "reading" | "completed",
        notes: newPaper.notes || null,
        tags: newPaper.tags,
        bibtex: newPaper.bibtex || null,
        summary: newPaper.summary || null,
        progress_percentage: newPaper.progress_percentage || 0,
        user_id: user.id
      });

      setSelectedFile(null);
      setNewPaper({
        title: "",
        authors: "",
        publication_year: new Date().getFullYear().toString(),
        url: "",
        status: "to_read",
        notes: "",
        tags: [],
        bibtex: "",
        summary: "",
        progress_percentage: 0
      });
      setIsDialogOpen(false);
      toast({ title: "Paper added successfully" });
    } catch (error) {
      toast({ title: "Failed to add paper", variant: "destructive" });
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeletePaper = async (id: string) => {
    try {
      await deletePaper.mutateAsync(id);
      toast({ title: "Paper deleted" });
    } catch (error) {
      toast({ title: "Failed to delete paper", variant: "destructive" });
    }
  };

  const handleStatusChange = async (id: string, newStatus: string) => {
    try {
      await updatePaper.mutateAsync({ id, status: newStatus });
      toast({ title: "Status updated" });
    } catch (error) {
      toast({ title: "Failed to update status", variant: "destructive" });
    }
  };

  const handleUpdatePaperDetail = async () => {
    if (!editingPaper) return;
    try {
      await updatePaper.mutateAsync({
        id: editingPaper.id,
        title: editingPaper.title,
        authors: Array.isArray(editingPaper.authors) ? editingPaper.authors : (editingPaper.authors as unknown as string).split(',').map((a: string) => a.trim()),
        publication_year: Number(editingPaper.publication_year) || null,
        url: editingPaper.url || null,
        status: editingPaper.status,
        notes: editingPaper.notes || null,
        summary: editingPaper.summary || null,
        progress_percentage: editingPaper.progress_percentage || 0
      });
      setEditingPaper(null);
      toast({ title: "Paper updated" });
    } catch (error) {
      toast({ title: "Failed to update paper", variant: "destructive" });
    }
  };

  const filteredPapers = papers.filter(p =>
    p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (p.authors && p.authors.some((a: string) => a.toLowerCase().includes(searchQuery.toLowerCase())))
  );

  const getPapersByStatus = (status: string) => {
    if (status === 'all') return filteredPapers;
    return filteredPapers.filter(p => p.status === status);
  };

  const PaperList = ({ status }: { status: string }) => {
    const list = getPapersByStatus(status);

    if (list.length === 0) {
      return (
        <Card className="border-dashed bg-muted/20">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="p-4 rounded-full bg-muted mb-4 opacity-50">
                <FileText className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="font-semibold text-lg">No papers found</h3>
              <p className="text-muted-foreground mt-1 max-w-sm">
                {status === 'all' ? "Start tracking your research reading list" : `No papers in '${status.replace('_', ' ')}' status`}
              </p>
            </div>
          </CardContent>
        </Card>
      );
    }

    return (
      <div className={cn(
        "grid gap-4",
        viewMode === "gallery" ? "md:grid-cols-2 lg:grid-cols-3" : "grid-cols-1"
      )}>
        <AnimatePresence mode="popLayout">
          {list.map((paper) => (
            <motion.div
              key={paper.id}
              layout
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2 }}
            >
              <Card className="h-full flex flex-col group relative border-border/50 hover:border-primary/40 transition-all shadow-sm hover:shadow-md overflow-hidden bg-card/60 backdrop-blur-sm">
                <CardHeader className="pb-3 px-4 pt-4">
                  <div className="flex justify-between items-start gap-2">
                    <div className="space-y-1">
                      <CardTitle className="text-base font-bold leading-tight line-clamp-2 min-h-[2.5rem]" title={paper.title}>
                        {paper.title}
                      </CardTitle>
                      <CardDescription className="line-clamp-1 text-[10px] opacity-70">
                        {paper.authors && paper.authors.join(", ")}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="flex-1 flex flex-col gap-4 px-4 pb-4">
                  <div className="flex flex-wrap gap-2 text-[10px] text-muted-foreground">
                    {paper.publication_year && (
                      <span className="flex items-center gap-1 bg-muted/60 px-2 py-0.5 rounded border border-border/20">
                        <Calendar className="h-3 w-3" /> {paper.publication_year}
                      </span>
                    )}
                    {paper.url && (
                      <a
                        href={paper.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 bg-muted/60 px-2 py-0.5 rounded border border-border/20 hover:text-primary hover:bg-primary/5 transition-all"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <ExternalLink className="h-3 w-3" /> PDF
                      </a>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-5 px-2 text-[10px] gap-1 hover:text-primary hover:bg-primary/5 bg-muted/40 transition-all border border-border/20"
                      onClick={(e) => {
                        e.stopPropagation();
                        copyToClipboard(paper.bibtex || generateBibTeX(paper), "BibTeX copied to clipboard");
                      }}
                    >
                      <Copy className="h-3 w-3" /> BibTeX
                    </Button>
                  </div>

                  {paper.status === 'reading' && (
                    <div className="space-y-1.5 p-2 rounded-lg bg-muted/20 border border-border/10">
                      <div className="flex justify-between text-[9px] text-muted-foreground uppercase tracking-widest font-bold">
                        <span>Reading Progress</span>
                        <span>{paper.progress_percentage || 0}%</span>
                      </div>
                      <div className="h-1.5 w-full bg-muted/40 rounded-full overflow-hidden">
                        <motion.div
                          className="h-full bg-primary shadow-[0_0_8px_rgba(var(--primary),0.5)]"
                          initial={{ width: 0 }}
                          animate={{ width: `${paper.progress_percentage || 0}%` }}
                          transition={{ duration: 1, ease: "circOut" }}
                        />
                      </div>
                    </div>
                  )}

                  {paper.summary ? (
                    <div className="bg-primary/5 p-3 rounded-xl border border-primary/10 text-[11px] text-foreground/90 relative group/summary hover:bg-primary/10 transition-colors">
                      <div className="text-[9px] font-bold text-primary uppercase tracking-widest mb-1.5 flex items-center gap-1">
                        <Sparkles className="h-3 w-3 animate-pulse" /> AI Summary
                      </div>
                      <p className="line-clamp-3 leading-relaxed italic opacity-85">
                        {paper.summary}
                      </p>
                    </div>
                  ) : paper.notes && (
                    <div className="bg-muted/30 p-2.5 rounded-lg text-[11px] text-muted-foreground line-clamp-3 italic border border-border/10">
                      "{paper.notes}"
                    </div>
                  )}

                  <div className="mt-auto pt-3 flex items-center justify-between border-t border-border/20">
                    <Select defaultValue={paper.status} onValueChange={(v) => handleStatusChange(paper.id, v)}>
                      <SelectTrigger className="w-[110px] h-7 text-[10px] bg-transparent border-none focus:ring-0 px-0 hover:text-primary transition-colors">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="to_read">To Read</SelectItem>
                        <SelectItem value="reading">Reading</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                      </SelectContent>
                    </Select>

                    <div className="flex gap-1.5 opacity-20 sm:opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-1 group-hover:translate-y-0">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 rounded-lg hover:bg-primary/10 hover:text-primary transition-colors"
                        onClick={(e) => { e.stopPropagation(); setEditingPaper(paper); }}
                      >
                        <Edit className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 rounded-lg hover:bg-destructive/10 hover:text-destructive transition-colors"
                        onClick={(e) => { e.stopPropagation(); handleDeletePaper(paper.id); }}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground animate-pulse">Syncing your library...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in pb-12 max-w-7xl mx-auto px-1">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/70">
            Research Hub
          </h1>
          <p className="text-muted-foreground text-sm font-medium">
            Personal Research Intelligence & Manuscript Management
          </p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "library" | "writing")} className="w-full">
        <TabsList className="bg-muted/40 p-1 rounded-2xl h-12 border border-border/20 mb-6">
          <TabsTrigger value="library" className="rounded-xl px-8 focus:ring-0">Reading Library</TabsTrigger>
          <TabsTrigger value="writing" className="rounded-xl px-8 focus:ring-0">Writing Center</TabsTrigger>
        </TabsList>

        <TabsContent value="library" className="space-y-8 focus-visible:outline-none focus-visible:ring-0">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            <div className="flex bg-muted/40 p-1 rounded-xl border border-white/5 backdrop-blur-md">
              <Button
                variant={viewMode === "gallery" ? "secondary" : "ghost"}
                size="sm"
                onClick={() => setViewMode("gallery")}
                className="rounded-lg px-3 h-8 text-[11px] font-bold uppercase tracking-wider"
              >
                <LayoutGrid className="h-3.5 w-3.5 mr-2" /> Gallery
              </Button>
              <Button
                variant={viewMode === "list" ? "secondary" : "ghost"}
                size="sm"
                onClick={() => setViewMode("list")}
                className="rounded-lg px-3 h-8 text-[11px] font-bold uppercase tracking-wider"
              >
                <ListIcon className="h-3.5 w-3.5 mr-2" /> List
              </Button>
              <Button
                variant={viewMode === "graph" ? "secondary" : "ghost"}
                size="sm"
                onClick={() => setViewMode("graph")}
                className="rounded-lg px-3 h-8 text-[11px] font-bold uppercase tracking-wider"
              >
                <Share2 className="h-3.5 w-3.5 mr-2" /> Graph
              </Button>
            </div>

            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.dispatchEvent(new Event("toggle-ai-bot"))}
                className="rounded-xl h-10 border-primary/20 gap-2 font-bold transition-all shadow-lg shadow-primary/5 bg-primary/5 text-primary hover:bg-primary/10"
              >
                <MessageSquareText className="h-4 w-4" /> AI Research assistant
              </Button>

              <Dialog open={isImportDialogOpen} onOpenChange={setIsImportDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm" className="rounded-xl h-10 border-amber-500/20 bg-amber-500/5 text-amber-500 hover:bg-amber-500/10 px-4 gap-2 font-bold">
                    <Wand2 className="h-4 w-4" /> Magic Import
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md glass-card border-white/10 shadow-2xl">
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                      <Zap className="h-5 w-5 text-amber-500 fill-amber-500/20" /> Metadata Auto-Fill
                    </DialogTitle>
                    <DialogDescription>
                      Paste a DOI or ArXiv ID to automatically fetch paper details.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="py-6 space-y-4">
                    <div className="space-y-2">
                      <Label className="text-[10px] uppercase font-bold opacity-60">ID</Label>
                      <Input
                        value={importId}
                        onChange={(e) => setImportId(e.target.value)}
                        placeholder="e.g. 10.1038/nature14539"
                        className="bg-muted/20 rounded-xl"
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="ghost" onClick={() => setIsImportDialogOpen(false)}>Cancel</Button>
                    <Button onClick={handleMagicImport} disabled={isImporting || !importId}>
                      {isImporting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Wand2 className="h-4 w-4 mr-2" />}
                      Import
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="rounded-xl px-5 shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all active:scale-95">
                    <Plus className="mr-2 h-4 w-4" /> Add Paper
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-xl glass-card border-white/10 shadow-2xl p-0 overflow-hidden">
                  <div className="p-6 pb-0">
                    <DialogTitle className="text-xl font-bold">New Research Entry</DialogTitle>
                  </div>
                  <div className="p-6 grid gap-6 max-h-[75vh] overflow-y-auto custom-scrollbar">
                    <div className="grid gap-2">
                      <Label htmlFor="title" className="text-[11px] uppercase tracking-widest font-bold opacity-60">Paper Title *</Label>
                      <Input
                        id="title"
                        value={newPaper.title}
                        onChange={(e) => setNewPaper({ ...newPaper, title: e.target.value })}
                        placeholder="e.g., Attention Is All You Need"
                        className="bg-muted/20 border-border/30 rounded-xl h-11"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="grid gap-2">
                        <Label htmlFor="year" className="text-[11px] uppercase tracking-widest font-bold opacity-60">Publication Year</Label>
                        <Input
                          id="year"
                          type="number"
                          value={newPaper.publication_year}
                          onChange={(e) => setNewPaper({ ...newPaper, publication_year: e.target.value })}
                          placeholder="2017"
                          className="bg-muted/20 border-border/30 rounded-xl"
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="status" className="text-[11px] uppercase tracking-widest font-bold opacity-60">Current Status</Label>
                        <Select value={newPaper.status} onValueChange={(v) => setNewPaper({ ...newPaper, status: v })}>
                          <SelectTrigger id="status" className="bg-muted/20 border-border/30 rounded-xl"><SelectValue /></SelectTrigger>
                          <SelectContent className="rounded-xl border-white/10 glass-card">
                            <SelectItem value="to_read">To Read</SelectItem>
                            <SelectItem value="reading">Reading</SelectItem>
                            <SelectItem value="completed">Completed</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="authors" className="text-[11px] uppercase tracking-widest font-bold opacity-60">Authors (comma separated)</Label>
                      <Input
                        id="authors"
                        value={newPaper.authors}
                        onChange={(e) => setNewPaper({ ...newPaper, authors: e.target.value })}
                        placeholder="Vaswani, Shazeer, Parmar..."
                        className="bg-muted/20 border-border/30 rounded-xl"
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="url" className="text-[11px] uppercase tracking-widest font-bold opacity-60">Source URL / ArXiv PDF</Label>
                      <Input
                        id="url"
                        value={newPaper.url}
                        onChange={(e) => setNewPaper({ ...newPaper, url: e.target.value })}
                        placeholder="https://arxiv.org/pdf/..."
                        className="bg-muted/20 border-border/30 rounded-xl"
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label className="text-[11px] uppercase tracking-widest font-bold opacity-60">Upload PDF</Label>
                      <div
                        className={cn(
                          "border-2 border-dashed border-border/30 rounded-xl p-4 flex flex-col items-center justify-center gap-2 cursor-pointer hover:bg-muted/10 transition-colors",
                          selectedFile && "border-primary/40 bg-primary/5"
                        )}
                        onClick={() => document.getElementById('paper-upload')?.click()}
                      >
                        <Upload className={cn("h-6 w-6", selectedFile ? "text-primary" : "text-muted-foreground")} />
                        <span className="text-xs font-medium">
                          {selectedFile ? selectedFile.name : "Click to select or drag & drop PDF"}
                        </span>
                        <input
                          id="paper-upload"
                          type="file"
                          accept=".pdf"
                          className="hidden"
                          onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                        />
                      </div>
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="notes" className="text-[11px] uppercase tracking-widest font-bold opacity-60">Initial Reading Motivation</Label>
                      <Textarea
                        id="notes"
                        value={newPaper.notes}
                        onChange={(e) => setNewPaper({ ...newPaper, notes: e.target.value })}
                        placeholder="Briefly describe why this paper is relevant to your work..."
                        className="bg-muted/20 border-border/30 rounded-xl min-h-[80px]"
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="summary" className="text-[11px] uppercase tracking-widest font-bold opacity-60">Abstract / Core Concept</Label>
                      <Textarea
                        id="summary"
                        value={newPaper.summary}
                        onChange={(e) => setNewPaper({ ...newPaper, summary: e.target.value })}
                        placeholder="Paste the abstract for future reference..."
                        className="bg-muted/20 border-border/30 rounded-xl min-h-[100px]"
                      />
                    </div>
                  </div>
                  <div className="p-6 bg-muted/20 border-t border-white/5 flex gap-3 justify-end">
                    <Button variant="ghost" onClick={() => setIsDialogOpen(false)} className="rounded-xl">Cancel</Button>
                    <Button onClick={handleCreatePaper} disabled={createPaper.isPending || isUploading} className="rounded-xl shadow-lg shadow-primary/10">
                      {createPaper.isPending || isUploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                      Save to Library
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          <div className="flex flex-col lg:flex-row gap-8 items-start">
            <div className="flex-1 space-y-6 w-full">
              <div className="relative max-w-lg">
                <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/40" />
                <Input
                  placeholder="Search by title, author, or research area..."
                  className="pl-12 bg-muted/20 border-border/40 focus:bg-muted/30 transition-all rounded-2xl h-11 text-sm shadow-inner"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              <Tabs defaultValue="all" className="w-full">
                <div className="flex items-center justify-between mb-4">
                  <TabsList className="bg-muted/40 p-1 rounded-xl h-10 border border-border/10">
                    <TabsTrigger value="all" className="rounded-lg px-6 text-[10px] font-bold uppercase tracking-wider">All</TabsTrigger>
                    <TabsTrigger value="to_read" className="rounded-lg px-6 text-[10px] font-bold uppercase tracking-wider">To Read</TabsTrigger>
                    <TabsTrigger value="reading" className="rounded-lg px-6 text-[10px] font-bold uppercase tracking-wider">Reading</TabsTrigger>
                    <TabsTrigger value="completed" className="rounded-lg px-6 text-[10px] font-bold uppercase tracking-wider">Done</TabsTrigger>
                  </TabsList>
                </div>

                <TabsContent value="all" className="mt-0 focus-visible:outline-none focus-visible:ring-0">
                  {filteredPapers.length === 0 ? (
                    <Card className="border-dashed border-2 bg-transparent/5 h-64 flex flex-col items-center justify-center text-muted-foreground">
                      <BookOpen className="h-12 w-12 mb-4 opacity-20" />
                      <p className="font-medium text-lg">No papers found</p>
                    </Card>
                  ) : viewMode === "graph" ? (
                    <ResearchGraph papers={filteredPapers} onSelectPaper={(p) => setEditingPaper(p)} />
                  ) : viewMode === "gallery" ? (
                    <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
                      <AnimatePresence mode="popLayout">
                        {filteredPapers.map((paper) => (
                          <motion.div
                            key={paper.id}
                            layout
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            transition={{ duration: 0.2 }}
                          >
                            <Card className="h-full glass-card border-white/10 group hover:border-primary/20 transition-all flex flex-col overflow-hidden">
                              <CardHeader className="p-5 pb-3">
                                <div className="flex items-start justify-between">
                                  <Badge variant="outline" className={cn(
                                    "text-[10px] font-bold uppercase tracking-wider h-5 px-2",
                                    paper.status === "completed" ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" :
                                      paper.status === "reading" ? "bg-amber-500/10 text-amber-500 border-amber-500/20" :
                                        "bg-slate-500/10 text-slate-500 border-slate-500/20"
                                  )}>
                                    {paper.status.replace("_", " ")}
                                  </Badge>
                                  <div className="flex items-center gap-1">
                                    <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full hover:bg-primary/20 hover:text-primary" onClick={() => {
                                      setEditingPaper(paper);
                                      setIsDialogOpen(true);
                                    }}>
                                      <Edit className="h-4 w-4" />
                                    </Button>
                                    <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full hover:bg-destructive/10 hover:text-destructive" onClick={() => handleDeletePaper(paper.id)}>
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </div>
                                </div>
                                <CardTitle className="text-lg font-bold line-clamp-2 leading-tight mt-2 group-hover:text-primary transition-colors">
                                  {paper.title}
                                </CardTitle>
                                <CardDescription className="text-xs font-medium line-clamp-1 mt-1">
                                  {paper.authors?.join(", ") || "No authors listed"}
                                </CardDescription>
                              </CardHeader>
                              <CardContent className="p-5 pt-0 flex-1 flex flex-col">
                                <div className="flex items-center gap-4 text-[10px] font-bold uppercase tracking-widest opacity-50 mb-4">
                                  <span className="flex items-center gap-1.5"><Calendar className="h-3 w-3" /> {paper.publication_year || "TBD"}</span>
                                  <span className="flex items-center gap-1.5"><BookOpen className="h-3 w-3" /> {paper.progress_percentage}% Read</span>
                                </div>

                                <div className="w-full bg-muted/30 h-1 rounded-full overflow-hidden mb-4">
                                  <motion.div
                                    className="h-full bg-primary"
                                    initial={{ width: 0 }}
                                    animate={{ width: `${paper.progress_percentage}%` }}
                                  />
                                </div>

                                {paper.summary && (
                                  <p className="text-xs text-muted-foreground line-clamp-3 leading-relaxed mb-4 opacity-70 italic">
                                    "{paper.summary}"
                                  </p>
                                )}

                                <div className="flex gap-2 pt-4 mt-auto">
                                  {paper.url && (
                                    <Button variant="outline" size="sm" className="h-8 rounded-lg text-[10px] font-bold px-3 gap-2" asChild>
                                      <a href={paper.url} target="_blank" rel="noopener noreferrer">
                                        <ExternalLink className="h-3 w-3" /> PDF
                                      </a>
                                    </Button>
                                  )}
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="h-8 rounded-lg text-[10px] font-bold px-3 gap-2"
                                    onClick={() => copyToClipboard(generateBibTeX(paper), "BibTeX copied to clipboard")}
                                  >
                                    <Copy className="h-3 w-3" /> BibTeX
                                  </Button>
                                </div>
                              </CardContent>
                            </Card>
                          </motion.div>
                        ))}
                      </AnimatePresence>
                    </div>
                  ) : (
                    <PaperList status="all" />
                  )}
                </TabsContent>
                <TabsContent value="to_read" className="mt-0 focus-visible:outline-none focus-visible:ring-0">
                  <PaperList status="to_read" />
                </TabsContent>
                <TabsContent value="reading" className="mt-0 focus-visible:outline-none focus-visible:ring-0">
                  <PaperList status="reading" />
                </TabsContent>
                <TabsContent value="completed" className="mt-0 focus-visible:outline-none focus-visible:ring-0">
                  <PaperList status="completed" />
                </TabsContent>
              </Tabs>
            </div>

            <AnimatePresence>
              {showAiAssistant && (
                <motion.div
                  initial={{ opacity: 0, x: 20, width: 0 }}
                  animate={{ opacity: 1, x: 0, width: 380 }}
                  exit={{ opacity: 0, x: 20, width: 0 }}
                  className="sticky top-6 hidden xl:block"
                >
                  <ResearchAIAssistant papers={filteredPapers} />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </TabsContent>

        <TabsContent value="writing" className="focus-visible:outline-none focus-visible:ring-0">
          <WritingCenter />
        </TabsContent>
      </Tabs>

      {/* Edit Dialog */}
      <Dialog open={!!editingPaper} onOpenChange={(open) => !open && setEditingPaper(null)}>
        <DialogContent className="max-w-xl glass-card border-white/10 shadow-2xl p-0 overflow-hidden">
          <div className="p-6 pb-0 flex items-center justify-between">
            <DialogTitle className="text-xl font-bold">Refine Entry Details</DialogTitle>
          </div>
          <AnimatePresence>
            {editingPaper && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-6 grid gap-6 max-h-[75vh] overflow-y-auto custom-scrollbar"
              >
                <div className="grid gap-2">
                  <Label htmlFor="edit-title" className="text-[11px] uppercase tracking-widest font-bold opacity-60">Title</Label>
                  <Input
                    id="edit-title"
                    value={editingPaper.title}
                    onChange={(e) => setEditingPaper({ ...editingPaper, title: e.target.value })}
                    className="bg-muted/20 border-border/30 rounded-xl h-11"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="edit-year" className="text-[11px] uppercase tracking-widest font-bold opacity-60">Year</Label>
                    <Input
                      id="edit-year"
                      type="number"
                      value={editingPaper.publication_year || ""}
                      onChange={(e) => setEditingPaper({ ...editingPaper, publication_year: parseInt(e.target.value) || null })}
                      className="bg-muted/20 border-border/30 rounded-xl"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="edit-status" className="text-[11px] uppercase tracking-widest font-bold opacity-60">Reading Status</Label>
                    <Select value={editingPaper.status} onValueChange={(v) => setEditingPaper({ ...editingPaper, status: v })}>
                      <SelectTrigger id="edit-status" className="bg-muted/20 border-border/30 rounded-xl"><SelectValue /></SelectTrigger>
                      <SelectContent className="rounded-xl border-white/10 glass-card">
                        <SelectItem value="to_read">To Read</SelectItem>
                        <SelectItem value="reading">Reading</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="edit-authors" className="text-[11px] uppercase tracking-widest font-bold opacity-60">Authors</Label>
                  <Input
                    id="edit-authors"
                    value={Array.isArray(editingPaper.authors) ? editingPaper.authors.join(", ") : (editingPaper.authors || "")}
                    onChange={(e) => setEditingPaper({ ...editingPaper, authors: e.target.value.split(",").map(a => a.trim()) })}
                    className="bg-muted/20 border-border/30 rounded-xl"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="edit-progress" className="text-[11px] uppercase tracking-widest font-bold opacity-60">Reading Progress</Label>
                  <div className="flex gap-5 items-center bg-muted/20 p-4 rounded-2xl border border-border/20 shadow-inner">
                    <input
                      type="range"
                      min="0"
                      max="100"
                      step="1"
                      className="flex-1 accent-primary h-1.5 rounded-full appearance-none bg-muted/50 cursor-pointer"
                      value={editingPaper.progress_percentage || 0}
                      onChange={(e) => setEditingPaper({ ...editingPaper, progress_percentage: parseInt(e.target.value) })}
                    />
                    <span className="text-base font-bold text-primary w-12 text-right tabular-nums">{editingPaper.progress_percentage || 0}%</span>
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="edit-summary" className="text-[11px] uppercase tracking-widest font-bold opacity-60">AI Summary / Key Concept</Label>
                  <Textarea
                    id="edit-summary"
                    className="min-h-[140px] bg-muted/20 border-border/40 rounded-xl resize-none text-[13px] leading-relaxed shadow-inner font-medium"
                    value={editingPaper.summary || ""}
                    onChange={(e) => setEditingPaper({ ...editingPaper, summary: e.target.value })}
                    placeholder="Paste paper abstract or summarized findings..."
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="edit-notes" className="text-[11px] uppercase tracking-widest font-bold opacity-60">Personal Insights & References</Label>
                  <Textarea
                    id="edit-notes"
                    className="min-h-[100px] bg-muted/20 border-border/40 rounded-xl resize-none text-[13px] shadow-inner"
                    value={editingPaper.notes || ""}
                    onChange={(e) => setEditingPaper({ ...editingPaper, notes: e.target.value })}
                    placeholder="Note takeaways, citations, or cross-references..."
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          <div className="p-6 bg-muted/20 border-t border-white/5 flex gap-3 justify-end">
            <Button variant="ghost" onClick={() => setEditingPaper(null)} className="rounded-xl">Discard</Button>
            <Button onClick={handleUpdatePaperDetail} disabled={updatePaper.isPending} className="rounded-xl px-6 shadow-lg shadow-primary/10">
              {updatePaper.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Updates
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div >
  );
}
