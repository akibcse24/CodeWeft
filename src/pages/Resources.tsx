import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus, BookOpen, Search, Filter, ExternalLink, Star,
  MoreHorizontal, Trash2, Edit, Loader2, Video, FileText,
  GraduationCap, BookMarked, Link as LinkIcon
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog, DialogContent, DialogDescription,
  DialogHeader, DialogTitle, DialogFooter
} from "@/components/ui/dialog";
import {
  DropdownMenu, DropdownMenuContent,
  DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem,
  SelectTrigger, SelectValue
} from "@/components/ui/select";
import { useResources } from "@/hooks/useResources";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

const RESOURCE_TYPES = [
  { value: "article", label: "Article", icon: FileText },
  { value: "video", label: "Video", icon: Video },
  { value: "course", label: "Course", icon: GraduationCap },
  { value: "book", label: "Book", icon: BookMarked },
  { value: "link", label: "Link", icon: LinkIcon },
];

const STATUSES = [
  { value: "to_read", label: "To Read" },
  { value: "reading", label: "Reading" },
  { value: "completed", label: "Completed" },
];

export default function Resources() {
  const { resources, isLoading, createResource, updateResource, deleteResource } = useResources();
  const { toast } = useToast();

  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [editingResource, setEditingResource] = useState<any>(null);

  // Form state
  const [formTitle, setFormTitle] = useState("");
  const [formUrl, setFormUrl] = useState("");
  const [formType, setFormType] = useState("article");
  const [formCategory, setFormCategory] = useState("");
  const [formStatus, setFormStatus] = useState("to_read");
  const [formNotes, setFormNotes] = useState("");
  const [formTags, setFormTags] = useState("");
  const [formRating, setFormRating] = useState<number | null>(null);

  const resetForm = () => {
    setFormTitle("");
    setFormUrl("");
    setFormType("article");
    setFormCategory("");
    setFormStatus("to_read");
    setFormNotes("");
    setFormTags("");
    setFormRating(null);
    setEditingResource(null);
  };

  const openCreateDialog = () => {
    resetForm();
    setDialogOpen(true);
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const openEditDialog = (resource: any) => {
    setEditingResource(resource);
    setFormTitle(resource.title);
    setFormUrl(resource.url || "");
    setFormType(resource.type || "article");
    setFormCategory(resource.category || "");
    setFormStatus(resource.status || "to_read");
    setFormNotes(resource.notes || "");
    setFormTags((resource.tags || []).join(", "));
    setFormRating(resource.rating);
    setDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!formTitle.trim()) {
      toast({ title: "Title is required", variant: "destructive" });
      return;
    }

    const tags = formTags.split(",").map(t => t.trim()).filter(Boolean);

    try {
      if (editingResource) {
        await updateResource.mutateAsync({
          id: editingResource.id,
          title: formTitle,
          url: formUrl || null,
          type: formType,
          category: formCategory || null,
          status: formStatus,
          notes: formNotes || null,
          tags,
          rating: formRating,
        });
        toast({ title: "Resource updated" });
      } else {
        await createResource.mutateAsync({
          title: formTitle,
          url: formUrl || null,
          type: formType,
          category: formCategory || null,
          status: formStatus,
          notes: formNotes || null,
          tags,
          rating: formRating,
        });
        toast({ title: "Resource added" });
      }
      setDialogOpen(false);
      resetForm();
    } catch (error) {
      toast({ title: "Failed to save resource", variant: "destructive" });
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteResource.mutateAsync(id);
      toast({ title: "Resource deleted" });
    } catch (error) {
      toast({ title: "Failed to delete resource", variant: "destructive" });
    }
  };

  const filteredResources = resources.filter(resource => {
    const matchesSearch = resource.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTab = activeTab === "all" || resource.type === activeTab;
    return matchesSearch && matchesTab;
  });

  const getTypeInfo = (type: string) => {
    return RESOURCE_TYPES.find(t => t.value === type) || RESOURCE_TYPES[0];
  };

  const getStatusInfo = (status: string) => {
    return STATUSES.find(s => s.value === status) || STATUSES[0];
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <BookOpen className="h-8 w-8 text-primary" />
            Resources
          </h1>
          <p className="text-muted-foreground">Your learning materials library</p>
        </div>
        <Button onClick={openCreateDialog}>
          <Plus className="mr-2 h-4 w-4" /> Add Resource
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search resources..."
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="all">All</TabsTrigger>
          {RESOURCE_TYPES.map(type => (
            <TabsTrigger key={type.value} value={type.value} className="gap-1">
              <type.icon className="h-3 w-3" />
              {type.label}s
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value={activeTab} className="mt-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredResources.length === 0 ? (
              <Card className="col-span-full border-dashed cursor-pointer" onClick={openCreateDialog}>
                <CardContent className="pt-6">
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <div className="p-4 rounded-full bg-muted mb-4">
                      <BookOpen className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <h3 className="font-semibold text-lg">No resources yet</h3>
                    <p className="text-muted-foreground mt-1 max-w-sm">
                      Save articles, videos, and courses to build your knowledge base
                    </p>
                    <Button className="mt-4">
                      <Plus className="mr-2 h-4 w-4" /> Add Resource
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              filteredResources.map(resource => {
                const typeInfo = getTypeInfo(resource.type || "article");
                const statusInfo = getStatusInfo(resource.status || "to_read");
                const TypeIcon = typeInfo.icon;

                return (
                  <motion.div
                    key={resource.id}
                    layout
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    <Card className="card-hover group h-full">
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-2">
                            <div className="p-2 rounded-lg bg-primary/10">
                              <TypeIcon className="h-4 w-4 text-primary" />
                            </div>
                            <div>
                              <CardTitle className="text-base line-clamp-1">{resource.title}</CardTitle>
                              <CardDescription className="text-xs mt-0.5 flex items-center gap-2">
                                <Badge variant="outline" className="text-xs">
                                  {statusInfo.label}
                                </Badge>
                                {resource.rating && (
                                  <span className="flex items-center gap-1">
                                    <Star className="h-3 w-3 fill-warning text-warning" />
                                    {resource.rating}/5
                                  </span>
                                )}
                              </CardDescription>
                            </div>
                          </div>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              {resource.url && (
                                <DropdownMenuItem asChild>
                                  <a href={resource.url} target="_blank" rel="noopener noreferrer">
                                    <ExternalLink className="h-4 w-4 mr-2" />
                                    Open Link
                                  </a>
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuItem onClick={() => openEditDialog(resource)}>
                                <Edit className="h-4 w-4 mr-2" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                className="text-destructive"
                                onClick={() => handleDelete(resource.id)}
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        {resource.url && (
                          <a
                            href={resource.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-primary hover:underline flex items-center gap-1 truncate"
                          >
                            <ExternalLink className="h-3 w-3 shrink-0" />
                            {new URL(resource.url).hostname}
                          </a>
                        )}
                        {resource.notes && (
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {resource.notes}
                          </p>
                        )}
                        {(resource.tags?.length ?? 0) > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {resource.tags?.slice(0, 3).map((tag: string) => (
                              <Badge key={tag} variant="secondary" className="text-xs px-1.5 py-0">
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        )}
                        <p className="text-xs text-muted-foreground">
                          Added {format(new Date(resource.created_at), "MMM d, yyyy")}
                        </p>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingResource ? "Edit Resource" : "Add New Resource"}</DialogTitle>
            <DialogDescription>
              Save learning materials to your library
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                placeholder="e.g., Introduction to Machine Learning"
                value={formTitle}
                onChange={(e) => setFormTitle(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="url">URL</Label>
              <Input
                id="url"
                type="url"
                placeholder="https://..."
                value={formUrl}
                onChange={(e) => setFormUrl(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="type">Type</Label>
                <Select value={formType} onValueChange={setFormType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {RESOURCE_TYPES.map(type => (
                      <SelectItem key={type.value} value={type.value}>
                        <div className="flex items-center gap-2">
                          <type.icon className="h-4 w-4" />
                          {type.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select value={formStatus} onValueChange={setFormStatus}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUSES.map(status => (
                      <SelectItem key={status.value} value={status.value}>
                        {status.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Input
                  id="category"
                  placeholder="e.g., Machine Learning"
                  value={formCategory}
                  onChange={(e) => setFormCategory(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="rating">Rating (1-5)</Label>
                <Select
                  value={formRating?.toString() || ""}
                  onValueChange={(v) => setFormRating(v ? parseInt(v) : null)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Rate it" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">No rating</SelectItem>
                    {[1, 2, 3, 4, 5].map(n => (
                      <SelectItem key={n} value={n.toString()}>
                        {"⭐".repeat(n)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="tags">Tags (comma-separated)</Label>
              <Input
                id="tags"
                placeholder="python, neural-networks, tutorial"
                value={formTags}
                onChange={(e) => setFormTags(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                placeholder="Your notes about this resource..."
                value={formNotes}
                onChange={(e) => setFormNotes(e.target.value)}
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={createResource.isPending || updateResource.isPending}
            >
              {(createResource.isPending || updateResource.isPending) && (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              )}
              {editingResource ? "Save Changes" : "Add Resource"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
