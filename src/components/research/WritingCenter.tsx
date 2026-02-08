import { useState, useMemo } from "react";
import { Plus, Pencil, FileText, Calendar, Trash2, ExternalLink, Github, Send, Loader2, Sparkles, BookOpen, AlertCircle, StickyNote, Edit } from "lucide-react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { useDrafts, PaperDraft } from "@/hooks/useDrafts";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import LaTeXLibrary from "./LaTeXLibrary";
import VenueTracker from "./VenueTracker";
import VenueTimeline from "./VenueTimeline";

export default function WritingCenter() {
    const { user } = useAuth();
    const { drafts, isLoading, createDraft, updateDraft, deleteDraft } = useDrafts();
    const { toast } = useToast();
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingDraft, setEditingDraft] = useState<PaperDraft | null>(null);

    const [newDraft, setNewDraft] = useState({
        title: "",
        abstract: "",
        target_venue: "",
        venue_deadline: "",
        status: "draft" as PaperDraft['status'],
        repo_url: "",
        manuscript_url: "",
        page_id: ""
    });

    const handleCreateDraft = async () => {
        if (!newDraft.title.trim()) {
            toast({ title: "Please enter a draft title", variant: "destructive" });
            return;
        }
        if (!user?.id) return;

        try {
            await createDraft.mutateAsync({
                ...newDraft,
                user_id: user.id,
                venue_deadline: newDraft.venue_deadline || null,
                page_id: newDraft.page_id === "none" ? null : newDraft.page_id || null
            });
            setNewDraft({
                title: "",
                abstract: "",
                target_venue: "",
                venue_deadline: "",
                status: "draft",
                repo_url: "",
                manuscript_url: "",
                page_id: ""
            });
            setIsDialogOpen(false);
            toast({ title: "Research draft created" });
        } catch (error) {
            toast({ title: "Failed to create draft", variant: "destructive" });
        }
    };

    const handleUpdateDraft = async () => {
        if (!editingDraft) return;
        try {
            await updateDraft.mutateAsync({
                id: editingDraft.id,
                title: editingDraft.title,
                abstract: editingDraft.abstract,
                target_venue: editingDraft.target_venue,
                venue_deadline: editingDraft.venue_deadline,
                status: editingDraft.status,
                repo_url: editingDraft.repo_url,
                manuscript_url: editingDraft.manuscript_url,
                page_id: editingDraft.page_id
            });
            setEditingDraft(null);
            toast({ title: "Draft updated" });
        } catch (error) {
            toast({ title: "Failed to update draft", variant: "destructive" });
        }
    };

    const statusColors = {
        draft: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
        review: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300",
        submitted: "bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300",
        revising: "bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300",
        accepted: "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300",
        published: "bg-emerald-500 text-white"
    };

    // Mocked or previously fetched notes list (In a real app, this would come from a usePages hook)
    // For now, let's assume we want to show a select of existing notes
    const [pagesLoading, setPagesLoading] = useState(false);
    const [availablePages, setAvailablePages] = useState<{ id: string, title: string }[]>([]);

    // We should ideally fetch this from Supabase
    useMemo(() => {
        const fetchPages = async () => {
            setPagesLoading(true);
            const { data } = await supabase.from('pages').select('id, title').eq('user_id', user?.id).order('updated_at', { ascending: false });
            if (data) setAvailablePages(data);
            setPagesLoading(false);
        };
        if (user?.id) fetchPages();
    }, [user?.id]);

    if (isLoading) return <div className="p-8 text-center"><Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" /></div>;

    return (
        <div className="space-y-8 animate-fade-in">
            <VenueTimeline />
            <div className="grid lg:grid-cols-[1fr_350px] gap-8">
                <div className="space-y-8">
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-2xl font-bold tracking-tight">Manuscript Backlog</h2>
                            <p className="text-muted-foreground text-sm">Draft, track, and manage your research publications</p>
                        </div>
                        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                            <DialogTrigger asChild>
                                <Button className="rounded-xl shadow-lg shadow-primary/20">
                                    <Plus className="mr-2 h-4 w-4" /> Start New Draft
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-2xl glass-card border-white/10 shadow-2xl">
                                <DialogHeader>
                                    <DialogTitle>New Research Manuscript</DialogTitle>
                                    <DialogDescription>Initialize a new research project and track its progress.</DialogDescription>
                                </DialogHeader>
                                <div className="grid gap-6 py-4 max-h-[70vh] overflow-y-auto pr-2 custom-scrollbar">
                                    <div className="grid gap-2">
                                        <Label htmlFor="title" className="text-xs uppercase tracking-widest font-bold opacity-60">Working Title *</Label>
                                        <Input
                                            id="title"
                                            value={newDraft.title}
                                            onChange={(e) => setNewDraft({ ...newDraft, title: e.target.value })}
                                            placeholder="e.g., Optimizing Resource Allocation in Heterogeneous Clusters"
                                            className="bg-muted/20 border-border/30 rounded-xl"
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="grid gap-2">
                                            <Label htmlFor="venue" className="text-xs uppercase tracking-widest font-bold opacity-60">Target Venue</Label>
                                            <Input
                                                id="venue"
                                                value={newDraft.target_venue}
                                                onChange={(e) => setNewDraft({ ...newDraft, target_venue: e.target.value })}
                                                placeholder="e.g., NeurIPS 2026, IEEE Cloud"
                                                className="bg-muted/20 border-border/30 rounded-xl"
                                            />
                                        </div>
                                        <div className="grid gap-2">
                                            <Label htmlFor="deadline" className="text-xs uppercase tracking-widest font-bold opacity-60">Submission Deadline</Label>
                                            <Input
                                                id="deadline"
                                                type="date"
                                                value={newDraft.venue_deadline}
                                                onChange={(e) => setNewDraft({ ...newDraft, venue_deadline: e.target.value })}
                                                className="bg-muted/20 border-border/30 rounded-xl"
                                            />
                                        </div>
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="abstract" className="text-xs uppercase tracking-widest font-bold opacity-60">Abstract / Concept</Label>
                                        <Textarea
                                            id="abstract"
                                            value={newDraft.abstract}
                                            onChange={(e) => setNewDraft({ ...newDraft, abstract: e.target.value })}
                                            placeholder="Briefly describe the core contribution of this work..."
                                            className="bg-muted/20 border-border/30 rounded-xl min-h-[120px]"
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="grid gap-2">
                                            <Label htmlFor="repo" className="text-xs uppercase tracking-widest font-bold opacity-60">Code Repository URL</Label>
                                            <Input
                                                id="repo"
                                                value={newDraft.repo_url}
                                                onChange={(e) => setNewDraft({ ...newDraft, repo_url: e.target.value })}
                                                placeholder="https://github.com/..."
                                                className="bg-muted/20 border-border/30 rounded-xl"
                                            />
                                        </div>
                                        <div className="grid gap-2">
                                            <Label htmlFor="manuscript" className="text-xs uppercase tracking-widest font-bold opacity-60">Manuscript Link (Overleaf/GDoc)</Label>
                                            <Input
                                                id="manuscript"
                                                value={newDraft.manuscript_url}
                                                onChange={(e) => setNewDraft({ ...newDraft, manuscript_url: e.target.value })}
                                                placeholder="https://overleaf.com/..."
                                                className="bg-muted/20 border-border/30 rounded-xl"
                                            />
                                        </div>
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="page_id" className="text-xs uppercase tracking-widest font-bold opacity-60">Link to Note / Page</Label>
                                        <Select value={newDraft.page_id} onValueChange={(v) => setNewDraft({ ...newDraft, page_id: v })}>
                                            <SelectTrigger className="bg-muted/20 border-border/30 rounded-xl">
                                                <SelectValue placeholder="Select a note to link..." />
                                            </SelectTrigger>
                                            <SelectContent className="rounded-xl border-white/10 glass-card">
                                                <SelectItem value="none">None</SelectItem>
                                                {availablePages.map(page => (
                                                    <SelectItem key={page.id} value={page.id}>{page.title}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                                <DialogFooter className="border-t border-white/5 pt-4">
                                    <Button variant="ghost" onClick={() => setIsDialogOpen(false)} className="rounded-xl">Cancel</Button>
                                    <Button onClick={handleCreateDraft} className="rounded-xl shadow-lg shadow-primary/10">Initialize Draft</Button>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>
                    </div>

                    <div className="grid gap-6 md:grid-cols-1 xl:grid-cols-2">
                        <AnimatePresence mode="popLayout">
                            {drafts.length === 0 ? (
                                <div className="col-span-full py-20 text-center border-2 border-dashed rounded-3xl opacity-50 space-y-4">
                                    <div className="bg-muted w-16 h-16 rounded-full flex items-center justify-center mx-auto">
                                        <BookOpen className="h-8 w-8 text-muted-foreground" />
                                    </div>
                                    <div className="space-y-1">
                                        <h3 className="font-bold">No active drafts found</h3>
                                        <p className="text-sm">Start your next research paper today.</p>
                                    </div>
                                </div>
                            ) : (
                                drafts.map((draft) => (
                                    <motion.div
                                        key={draft.id}
                                        layout
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, scale: 0.95 }}
                                        transition={{ duration: 0.3 }}
                                    >
                                        <Card className="h-full border-border/50 hover:border-primary/30 transition-all shadow-sm hover:shadow-xl overflow-hidden group bg-card/40 backdrop-blur-md">
                                            <CardHeader className="pb-3 relative">
                                                <div className="absolute top-0 right-0 p-4">
                                                    <Badge className={cn("rounded-lg border-none px-3 py-1", statusColors[draft.status])}>
                                                        {draft.status.toUpperCase()}
                                                    </Badge>
                                                </div>
                                                <CardTitle className="text-xl pr-24 leading-tight group-hover:text-primary transition-colors cursor-pointer" onClick={() => setEditingDraft(draft)}>
                                                    {draft.title}
                                                </CardTitle>
                                                <CardDescription className="flex items-center gap-4 mt-2">
                                                    <span className="flex items-center gap-1.5 text-xs font-semibold">
                                                        <Send className="h-3 w-3" /> {draft.target_venue || "Self-Published"}
                                                    </span>
                                                    {draft.venue_deadline && (
                                                        <span className={cn("flex items-center gap-1.5 text-xs font-semibold",
                                                            new Date(draft.venue_deadline) < new Date() ? "text-destructive" : "text-primary"
                                                        )}>
                                                            <Calendar className="h-3 w-3" /> {format(new Date(draft.venue_deadline), "MMM d, yyyy")}
                                                        </span>
                                                    )}
                                                </CardDescription>
                                            </CardHeader>
                                            <CardContent className="space-y-4">
                                                {draft.abstract && (
                                                    <p className="text-sm text-muted-foreground line-clamp-3 leading-relaxed opacity-80">
                                                        {draft.abstract}
                                                    </p>
                                                )}

                                                <div className="flex gap-3 pt-2">
                                                    {draft.repo_url && (
                                                        <Button variant="outline" size="sm" className="h-8 rounded-lg text-[10px] uppercase tracking-wider font-bold gap-2" asChild>
                                                            <a href={draft.repo_url} target="_blank" rel="noopener noreferrer">
                                                                <Github className="h-3 w-3" /> Repo
                                                            </a>
                                                        </Button>
                                                    )}
                                                    {draft.manuscript_url && (
                                                        <Button variant="outline" size="sm" className="h-8 rounded-lg text-[10px] uppercase tracking-wider font-bold gap-2" asChild>
                                                            <a href={draft.manuscript_url} target="_blank" rel="noopener noreferrer">
                                                                <ExternalLink className="h-3 w-3" /> Manuscript
                                                            </a>
                                                        </Button>
                                                    )}
                                                    {draft.page_id && (
                                                        <Button variant="outline" size="sm" className="h-8 rounded-lg text-[10px] uppercase tracking-wider font-bold gap-2 bg-primary/5 border-primary/20 text-primary" asChild>
                                                            <Link to={`/notes?id=${draft.page_id}`}>
                                                                <StickyNote className="h-3 w-3" /> Linked Note
                                                            </Link>
                                                        </Button>
                                                    )}
                                                </div>

                                                <div className="pt-4 flex items-center justify-between border-t border-border/20">
                                                    <div className="flex gap-2">
                                                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg hover:bg-primary/10 hover:text-primary transition-colors" onClick={() => setEditingDraft(draft)}>
                                                            <Edit className="h-4 w-4" />
                                                        </Button>
                                                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg hover:bg-destructive/10 hover:text-destructive transition-colors" onClick={() => deleteDraft.mutate(draft.id)}>
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                    <div className="flex gap-2">
                                                        <Button variant="ghost" size="sm" className="h-8 rounded-lg text-xs hover:text-primary transition-all group/ai">
                                                            <Sparkles className="h-4 w-4 mr-2 group-hover/ai:animate-spin" /> AI Co-Author
                                                        </Button>
                                                    </div>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    </motion.div>
                                ))
                            )}
                        </AnimatePresence>
                    </div>
                </div>

                <aside className="space-y-8 h-fit lg:sticky lg:top-6">
                    <LaTeXLibrary />
                    <VenueTracker />
                </aside>
            </div>

            {/* Edit Draft Dialog */}
            <Dialog open={!!editingDraft} onOpenChange={(open) => !open && setEditingDraft(null)}>
                <DialogContent className="max-w-2xl glass-card border-white/10 shadow-2xl">
                    <DialogHeader>
                        <DialogTitle>Refine Research Project</DialogTitle>
                    </DialogHeader>
                    {editingDraft && (
                        <div className="grid gap-6 py-4 max-h-[70vh] overflow-y-auto pr-2 custom-scrollbar">
                            <div className="grid gap-2">
                                <Label htmlFor="edit-title" className="text-xs uppercase tracking-widest font-bold opacity-60">Manuscript Title</Label>
                                <Input
                                    id="edit-title"
                                    value={editingDraft.title}
                                    onChange={(e) => setEditingDraft({ ...editingDraft, title: e.target.value })}
                                    className="bg-muted/20 border-border/30 rounded-xl"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="edit-status" className="text-xs uppercase tracking-widest font-bold opacity-60">Phase</Label>
                                    <Select value={editingDraft.status} onValueChange={(v) => setEditingDraft({ ...editingDraft, status: v as PaperDraft['status'] })}>
                                        <SelectTrigger id="edit-status" className="bg-muted/20 border-border/30 rounded-xl focus:ring-primary/20"><SelectValue /></SelectTrigger>
                                        <SelectContent className="rounded-xl border-white/10 glass-card">
                                            <SelectItem value="draft">Drafting</SelectItem>
                                            <SelectItem value="review">Internal Review</SelectItem>
                                            <SelectItem value="submitted">Submitted</SelectItem>
                                            <SelectItem value="revising">Revising</SelectItem>
                                            <SelectItem value="accepted">Accepted</SelectItem>
                                            <SelectItem value="published">Published</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="edit-deadline" className="text-xs uppercase tracking-widest font-bold opacity-60">Venue Deadline</Label>
                                    <Input
                                        id="edit-deadline"
                                        type="date"
                                        value={editingDraft.venue_deadline || ""}
                                        onChange={(e) => setEditingDraft({ ...editingDraft, venue_deadline: e.target.value })}
                                        className="bg-muted/20 border-border/30 rounded-xl"
                                    />
                                </div>
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="edit-abstract" className="text-xs uppercase tracking-widest font-bold opacity-60">Abstract / Contribution</Label>
                                <Textarea
                                    id="edit-abstract"
                                    value={editingDraft.abstract || ""}
                                    onChange={(e) => setEditingDraft({ ...editingDraft, abstract: e.target.value })}
                                    className="bg-muted/20 border-border/30 rounded-xl min-h-[120px] text-sm leading-relaxed"
                                />
                            </div>
                        </div>
                    )}
                    <DialogFooter className="border-t border-white/5 pt-4">
                        <Button variant="ghost" onClick={() => setEditingDraft(null)} className="rounded-xl">Discard</Button>
                        <Button onClick={handleUpdateDraft} className="rounded-xl shadow-lg shadow-primary/10">Save Changes</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
