import { useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus, FlaskConical, Search, Star, MoreHorizontal, Trash2,
  Loader2, Brain, Cpu, BarChart3, Calculator, Filter
} from "lucide-react";
import { Tables, Json } from "@/integrations/supabase/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuTrigger, DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";
import { BlockEditor, Block } from "@/components/editor/BlockEditor";
import { EmojiPicker } from "@/components/editor/EmojiPicker";
import { useMLNotes } from "@/hooks/useMLNotes";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

const ML_CATEGORIES = [
  { value: "general", label: "General", icon: FlaskConical },
  { value: "algorithms", label: "Algorithms", icon: Cpu },
  { value: "neural-nets", label: "Neural Networks", icon: Brain },
  { value: "math", label: "Math & Stats", icon: Calculator },
  { value: "data", label: "Data Processing", icon: BarChart3 },
];

export default function MLNotes() {
  const { notes, favoriteNotes, isLoading, createNote, updateNote, deleteNote, toggleFavorite } = useMLNotes();
  const { toast } = useToast();

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("all");
  const [noteTitle, setNoteTitle] = useState("");
  const [noteIcon, setNoteIcon] = useState("🧠");
  const [noteCategory, setNoteCategory] = useState("general");
  const [noteTags, setNoteTags] = useState<string[]>([]);
  const [blocks, setBlocks] = useState<Block[]>([{ id: "1", type: "paragraph", content: "" }]);
  const [isSaving, setIsSaving] = useState(false);
  const [newTag, setNewTag] = useState("");

  const selectedNote = notes.find(n => n.id === selectedNoteId);

  useEffect(() => {
    if (selectedNote) {
      setNoteTitle(selectedNote.title);
      setNoteIcon(selectedNote.icon || "🧠");
      setNoteCategory(selectedNote.category || "general");
      setNoteTags(selectedNote.tags || []);
      const content = selectedNote.content;
      if (Array.isArray(content) && content.length > 0) {
        setBlocks(content as unknown as Block[]);
      } else {
        setBlocks([{ id: "1", type: "paragraph", content: "" }]);
      }
    }
  }, [selectedNote]);

  const handleCreateNote = async (category = "general") => {
    const result = await createNote.mutateAsync({
      title: "Untitled",
      icon: "🧠",
      category,
    });
    setSelectedNoteId(result.id);
    toast({ title: "New ML note created" });
  };

  const handleSave = useCallback(async () => {
    if (!selectedNoteId) return;
    setIsSaving(true);
    await updateNote.mutateAsync({
      id: selectedNoteId,
      title: noteTitle,
      icon: noteIcon,
      category: noteCategory,
      tags: noteTags,
      content: JSON.stringify(blocks),
    });
    setIsSaving(false);
  }, [selectedNoteId, noteTitle, noteIcon, noteCategory, noteTags, blocks, updateNote]);

  useEffect(() => {
    if (!selectedNoteId) return;
    const timer = setTimeout(() => {
      handleSave();
    }, 1000);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [noteTitle, blocks, noteIcon, noteCategory, noteTags]);

  const handleDeleteNote = async (id: string) => {
    await deleteNote.mutateAsync(id);
    if (selectedNoteId === id) {
      setSelectedNoteId(null);
    }
    toast({ title: "Note deleted" });
  };

  const handleToggleFavorite = async (id: string, isFavorite: boolean) => {
    await toggleFavorite.mutateAsync({ id, isFavorite });
    toast({ title: isFavorite ? "Removed from favorites" : "Added to favorites" });
  };

  const addTag = () => {
    if (newTag.trim() && !noteTags.includes(newTag.trim())) {
      setNoteTags([...noteTags, newTag.trim()]);
      setNewTag("");
    }
  };

  const removeTag = (tag: string) => {
    setNoteTags(noteTags.filter(t => t !== tag));
  };

  const filteredNotes = notes.filter(note => {
    const matchesSearch = note.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = activeTab === "all" || note.category === activeTab;
    return matchesSearch && matchesCategory;
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Editor view
  if (selectedNoteId && selectedNote) {
    const categoryInfo = ML_CATEGORIES.find(c => c.value === noteCategory) || ML_CATEGORIES[0];

    return (
      <div className="max-w-4xl mx-auto animate-fade-in">
        <div className="flex items-center justify-between mb-6">
          <Button variant="ghost" onClick={() => setSelectedNoteId(null)}>
            ← Back to ML Notes
          </Button>
          <div className="flex items-center gap-2">
            {isSaving && <span className="text-sm text-muted-foreground">Saving...</span>}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => handleToggleFavorite(selectedNoteId, selectedNote.is_favorite || false)}
            >
              <Star className={cn(
                "h-5 w-5",
                selectedNote.is_favorite && "fill-warning text-warning"
              )} />
            </Button>
          </div>
        </div>

        {/* Page Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <EmojiPicker onSelect={setNoteIcon}>
              <button className="text-4xl hover:bg-muted p-2 rounded-lg transition-colors">
                {noteIcon}
              </button>
            </EmojiPicker>
            <input
              type="text"
              value={noteTitle}
              onChange={(e) => setNoteTitle(e.target.value)}
              placeholder="Untitled"
              className="text-4xl font-bold bg-transparent border-none outline-none flex-1"
            />
          </div>

          {/* Category & Tags */}
          <div className="flex flex-wrap items-center gap-3 mb-4">
            <select
              value={noteCategory}
              onChange={(e) => setNoteCategory(e.target.value)}
              className="text-sm bg-muted px-3 py-1.5 rounded-md border-none outline-none"
            >
              {ML_CATEGORIES.map(cat => (
                <option key={cat.value} value={cat.value}>{cat.label}</option>
              ))}
            </select>

            <div className="flex flex-wrap items-center gap-2">
              {noteTags.map(tag => (
                <Badge key={tag} variant="secondary" className="cursor-pointer" onClick={() => removeTag(tag)}>
                  {tag} ×
                </Badge>
              ))}
              <div className="flex items-center gap-1">
                <Input
                  type="text"
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && addTag()}
                  placeholder="Add tag..."
                  className="h-7 w-24 text-xs"
                />
              </div>
            </div>
          </div>

          <p className="text-sm text-muted-foreground">
            Last edited {format(new Date(selectedNote.updated_at), "MMM d, yyyy 'at' h:mm a")}
          </p>
        </div>

        {/* Block Editor */}
        <BlockEditor blocks={blocks} onChange={setBlocks} />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Brain className="h-8 w-8 text-primary" />
            ML Notes
          </h1>
          <p className="text-muted-foreground">Machine learning concepts, algorithms, and architectures</p>
        </div>
        <Button onClick={() => handleCreateNote()}>
          <Plus className="mr-2 h-4 w-4" /> New Note
        </Button>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search ML notes..."
          className="pl-10"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="all">All</TabsTrigger>
          {ML_CATEGORIES.map(cat => (
            <TabsTrigger key={cat.value} value={cat.value} className="gap-1">
              <cat.icon className="h-3 w-3" />
              {cat.label}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value={activeTab} className="mt-4">
          {/* Favorites */}
          {activeTab === "all" && favoriteNotes.length > 0 && (
            <div className="mb-6">
              <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <Star className="h-5 w-5 text-warning fill-warning" />
                Favorites
              </h2>
              <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                {favoriteNotes.map(note => (
                  <NoteCard
                    key={note.id}
                    note={note}
                    onSelect={() => setSelectedNoteId(note.id)}
                    onDelete={() => handleDeleteNote(note.id)}
                    onToggleFavorite={() => handleToggleFavorite(note.id, true)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* All Notes */}
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {filteredNotes.length === 0 ? (
              <Card className="col-span-full border-dashed cursor-pointer" onClick={() => handleCreateNote(activeTab === "all" ? "general" : activeTab)}>
                <CardContent className="pt-6">
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <div className="p-4 rounded-full bg-muted mb-4">
                      <FlaskConical className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <h3 className="font-semibold text-lg">No ML notes yet</h3>
                    <p className="text-muted-foreground mt-1 max-w-sm">
                      Start documenting ML concepts, algorithms, and architectures
                    </p>
                    <Button className="mt-4">
                      <Plus className="mr-2 h-4 w-4" /> Create Note
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              filteredNotes.map(note => (
                <NoteCard
                  key={note.id}
                  note={note}
                  onSelect={() => setSelectedNoteId(note.id)}
                  onDelete={() => handleDeleteNote(note.id)}
                  onToggleFavorite={() => handleToggleFavorite(note.id, note.is_favorite || false)}
                />
              ))
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function NoteCard({
  note,
  onSelect,
  onDelete,
  onToggleFavorite
}: {
  note: Tables<"ml_notes">;
  onSelect: () => void;
  onDelete: () => void;
  onToggleFavorite: () => void;
}) {
  const categoryInfo = ML_CATEGORIES.find(c => c.value === note.category) || ML_CATEGORIES[0];
  const tags = note.tags || [];

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <Card className="card-hover cursor-pointer group" onClick={onSelect}>
        <CardContent className="pt-6">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <span className="text-2xl">{note.icon || "🧠"}</span>
              <div className="flex-1 min-w-0">
                <h3 className="font-medium line-clamp-1">{note.title}</h3>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="outline" className="text-xs">
                    <categoryInfo.icon className="h-3 w-3 mr-1" />
                    {categoryInfo.label}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {format(new Date(note.updated_at), "MMM d, yyyy")}
                </p>
                {tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {tags.slice(0, 2).map((tag: string) => (
                      <Badge key={tag} variant="secondary" className="text-xs px-1.5 py-0">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onToggleFavorite(); }}>
                  <Star className="h-4 w-4 mr-2" />
                  {note.is_favorite ? "Remove from favorites" : "Add to favorites"}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-destructive"
                  onClick={(e) => { e.stopPropagation(); onDelete(); }}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
