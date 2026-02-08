import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus, Key, Eye, EyeOff, Search, Copy, Trash2,
  Edit, Shield, Lock, Globe, Tag, MoreHorizontal, Loader2,
  Fingerprint, AlertTriangle, HardDrive, Wifi, ShieldAlert,
  ChevronRight, ArrowUpRight, Cpu, Terminal, Clock
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogDescription,
  DialogHeader, DialogTitle, DialogFooter
} from "@/components/ui/dialog";
import {
  DropdownMenu, DropdownMenuContent,
  DropdownMenuItem, DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem,
  SelectTrigger, SelectValue
} from "@/components/ui/select";
import { useSecrets } from "@/hooks/useSecrets";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

const CATEGORIES = [
  { value: "api_keys", label: "Access Keys", icon: Key, color: "text-blue-400" },
  { value: "passwords", label: "Credentials", icon: Lock, color: "text-emerald-400" },
  { value: "tokens", label: "Auth Tokens", icon: Shield, color: "text-purple-400" },
  { value: "urls", label: "Endpoints", icon: Globe, color: "text-amber-400" },
  { value: "general", label: "General", icon: Tag, color: "text-slate-400" },
];

export default function SecretsVault() {
  const { secrets, isLoading, createSecret, updateSecret, deleteSecret } = useSecrets();
  const { toast } = useToast();

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [editingSecret, setEditingSecret] = useState<any>(null);
  const [visibleSecrets, setVisibleSecrets] = useState<Set<string>>(new Set());

  // Form state
  const [formName, setFormName] = useState("");
  const [formValue, setFormValue] = useState("");
  const [formCategory, setFormCategory] = useState("general");
  const [formNotes, setFormNotes] = useState("");
  const [formWebsiteUrl, setFormWebsiteUrl] = useState("");

  const resetForm = () => {
    setFormName("");
    setFormValue("");
    setFormCategory("general");
    setFormNotes("");
    setFormWebsiteUrl("");
    setEditingSecret(null);
  };

  const openCreateDialog = () => {
    resetForm();
    setDialogOpen(true);
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const openEditDialog = (secret: any) => {
    setEditingSecret(secret);
    setFormName(secret.name);
    setFormValue(secret.value);
    setFormCategory(secret.category || "general");
    setFormNotes(secret.notes || "");
    setFormWebsiteUrl(secret.website_url || "");
    setDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!formName.trim() || !formValue.trim()) {
      toast({ title: "Name and value are required", variant: "destructive" });
      return;
    }

    try {
      if (editingSecret) {
        await updateSecret.mutateAsync({
          id: editingSecret.id,
          name: formName,
          value: formValue,
          category: formCategory,
          notes: formNotes || null,
          website_url: formWebsiteUrl || null,
        });
        toast({ title: "Secret updated" });
      } else {
        await createSecret.mutateAsync({
          name: formName,
          value: formValue,
          category: formCategory,
          notes: formNotes || null,
          website_url: formWebsiteUrl || null,
        });
        toast({ title: "Secret created" });
      }
      setDialogOpen(false);
      resetForm();
    } catch (error) {
      toast({ title: "Failed to save secret", variant: "destructive" });
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteSecret.mutateAsync(id);
      toast({ title: "Secret deleted" });
    } catch (error) {
      toast({ title: "Failed to delete secret", variant: "destructive" });
    }
  };

  const toggleVisibility = (id: string) => {
    setVisibleSecrets(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const copyToClipboard = async (value: string) => {
    await navigator.clipboard.writeText(value);
    toast({ title: "Copied to clipboard" });
  };

  const filteredSecrets = (secrets || []).filter(secret => {
    const matchesSearch = secret.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = !selectedCategory || secret.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const getCategoryInfo = (category: string) => {
    return CATEGORIES.find(c => c.value === category) || CATEGORIES[4];
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
        <div className="relative">
          <div className="absolute inset-0 bg-primary/20 blur-xl animate-pulse rounded-full" />
          <Loader2 className="h-10 w-10 animate-spin text-primary relative z-10" />
        </div>
        <p className="text-[10px] uppercase font-black tracking-[0.5em] text-muted-foreground animate-pulse">Decrypting Vault...</p>
      </div>
    );
  }

  return (
    <div className="space-y-10 animate-fade-in max-w-[1400px] mx-auto pb-20">
      {/* High-Sec Header */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8">
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
            <span className="text-[10px] font-black uppercase tracking-[0.4em] text-emerald-500/80">Vault Status: Optimized</span>
          </div>
          <h1 className="text-6xl font-black tracking-tight flex items-center gap-5">
            <div className="p-4 bg-primary/10 rounded-[2rem] border border-primary/20 shadow-inner">
              <ShieldAlert className="h-10 w-10 text-primary" />
            </div>
            Secrets Vault
          </h1>
          <p className="text-muted-foreground text-lg max-w-xl font-medium leading-relaxed italic opacity-80">
            "Security is not a product, but a process."
          </p>
        </div>
        <Button onClick={openCreateDialog} size="lg" className="h-16 px-10 rounded-2xl shadow-xl shadow-primary/20 font-black gap-3 uppercase tracking-widest text-xs hover:scale-105 active:scale-95 transition-all">
          <Plus className="h-5 w-5" /> Initialize Secret
        </Button>
      </div>

      {/* Security Monitoring Banner */}
      <Card className="border-warning/30 bg-warning/[0.03] backdrop-blur-xl rounded-[2.5rem] overflow-hidden group">
        <CardContent className="py-6 px-10">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-start gap-5">
              <div className="p-3 bg-warning/20 rounded-2xl">
                <ShieldAlert className="h-6 w-6 text-warning animate-pulse" />
              </div>
              <div className="space-y-1">
                <p className="font-black text-xs uppercase tracking-widest text-warning">Security Protocol: Level 4 Active</p>
                <p className="text-sm text-muted-foreground font-medium">
                  Your secrets are encrypted with <span className="text-foreground">AES-256</span> equivalent Row Level Security.
                  Only authenticated biometrics/tokens can surface visual data.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4 bg-black/20 p-2 rounded-2xl border border-white/5">
              <div className="flex items-center gap-2 px-4 py-2 bg-emerald-500/10 rounded-xl border border-emerald-500/20">
                <Wifi className="h-3 w-3 text-emerald-500" />
                <span className="text-[9px] font-black text-emerald-500 uppercase tracking-widest">Secure Link</span>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 bg-blue-500/10 rounded-xl border border-blue-500/20">
                <HardDrive className="h-3 w-3 text-blue-500" />
                <span className="text-[9px] font-black text-blue-500 uppercase tracking-widest">Host: 0.0.0.0</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tactical HUD Filters */}
      <div className="flex flex-col xl:flex-row gap-6">
        <div className="relative flex-1 group">
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors">
            <Terminal className="h-5 w-5" />
          </div>
          <Input
            placeholder="RUN QUERY: find_secret --all"
            className="h-16 pl-12 bg-card/40 border-border/20 backdrop-blur-3xl rounded-2xl font-mono text-sm tracking-tight focus-visible:ring-primary/20 placeholder:opacity-50"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex p-2 bg-card/40 border border-border/20 backdrop-blur-3xl rounded-2xl items-center gap-2">
          <Button
            variant={selectedCategory === null ? "default" : "ghost"}
            size="sm"
            className={cn("h-12 px-6 rounded-xl font-black uppercase tracking-widest text-[10px]", selectedCategory === null && "shadow-lg")}
            onClick={() => setSelectedCategory(null)}
          >
            All Protocols
          </Button>
          {CATEGORIES.map(cat => (
            <Button
              key={cat.value}
              variant={selectedCategory === cat.value ? "default" : "ghost"}
              size="sm"
              className={cn(
                "h-12 px-6 rounded-xl font-black uppercase tracking-widest text-[10px] gap-2 transition-all",
                selectedCategory === cat.value && "shadow-lg",
                selectedCategory !== cat.value && "hover:bg-primary/5"
              )}
              onClick={() => setSelectedCategory(cat.value)}
            >
              <cat.icon className={cn("h-3.5 w-3.5", selectedCategory === cat.value ? "text-primary-foreground" : cat.color)} />
              {cat.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Grid of Secrets */}
      <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3">
        <AnimatePresence mode="popLayout">
          {filteredSecrets.length === 0 ? (
            <motion.div layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="col-span-full">
              <Card className="border-dashed border-2 border-border/40 bg-transparent hover:bg-primary/[0.02] transition-colors cursor-pointer group rounded-[3rem]" onClick={openCreateDialog}>
                <CardContent className="py-20">
                  <div className="flex flex-col items-center justify-center text-center space-y-6">
                    <div className="p-8 rounded-full bg-muted/40 group-hover:scale-110 group-hover:bg-primary/10 transition-all duration-700 relative">
                      <div className="absolute inset-0 bg-primary/5 blur-2xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
                      <Fingerprint className="h-12 w-12 text-muted-foreground group-hover:text-primary relative z-10" />
                    </div>
                    <div className="space-y-2">
                      <h3 className="text-xl font-black uppercase tracking-tight">No Encrypted Data Found</h3>
                      <p className="text-muted-foreground font-medium">Your perimeter is clear. Initialize your first secret protocol.</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ) : (
            filteredSecrets.map(secret => {
              const catInfo = getCategoryInfo(secret.category || "general");
              const isVisible = visibleSecrets.has(secret.id);

              return (
                <motion.div
                  key={secret.id}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  whileHover={{ y: -8 }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  <Card className="glass-premium border-border/20 rounded-[2.5rem] overflow-hidden group shadow-xl hover:shadow-primary/5 transition-all h-full flex flex-col">
                    <CardHeader className="p-8 pb-4">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-4">
                          <div className={cn(
                            "p-3 rounded-2xl transition-all duration-500 ring-1 ring-white/5 shadow-inner",
                            "bg-primary/5 group-hover:bg-primary/10 group-hover:rotate-12"
                          )}>
                            <catInfo.icon className={cn("h-5 w-5", catInfo.color)} />
                          </div>
                          <div className="space-y-1">
                            <CardTitle className="text-lg font-black tracking-tight group-hover:text-primary transition-colors">{secret.name}</CardTitle>
                            <div className="flex items-center gap-2">
                              <Clock className="h-3 w-3 text-muted-foreground/60" />
                              <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">
                                Modified: {format(new Date(secret.updated_at), "dd.MM.yy")}
                              </span>
                            </div>
                          </div>
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="rounded-xl hover:bg-white/5 opacity-0 group-hover:opacity-100 transition-all">
                              <MoreHorizontal className="h-5 w-5" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="glass-premium border-border/30 rounded-2xl p-2 min-w-[160px]">
                            <DropdownMenuItem onClick={() => openEditDialog(secret)} className="rounded-xl py-3 font-bold gap-3">
                              <Edit className="h-4 w-4 text-primary" />
                              Update Record
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-destructive rounded-xl py-3 font-bold gap-3 focus:bg-destructive/10"
                              onClick={() => handleDelete(secret.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                              Purge data
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </CardHeader>
                    <CardContent className="p-8 pt-4 space-y-6 flex-1 flex flex-col">
                      <div className="space-y-3">
                        <div className="flex items-center justify-between px-2">
                          <span className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground/40 italic">Data Buffer</span>
                          <Badge variant="outline" className="text-[8px] font-black uppercase tracking-widest border-emerald-500/20 text-emerald-500 bg-emerald-500/5 px-2">Encrypted</Badge>
                        </div>
                        <div className="relative group/value">
                          <div className={cn(
                            "font-mono text-sm p-5 pr-24 rounded-2xl overflow-hidden transition-all duration-700 bg-black/40 border border-white/5 leading-relaxed break-all",
                            isVisible ? "text-primary shadow-[inset_0_0_20px_rgba(0,0,0,0.5)]" : "text-muted-foreground/30 select-none tracking-[0.5em]"
                          )}>
                            {isVisible ? secret.value : "XXXXXXXXXXXXXXXX"}
                          </div>
                          <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-10 w-10 rounded-xl hover:bg-white/10 text-muted-foreground hover:text-white"
                              onClick={() => toggleVisibility(secret.id)}
                            >
                              {isVisible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-10 w-10 rounded-xl hover:bg-white/10 text-muted-foreground hover:text-white"
                              onClick={() => copyToClipboard(secret.value)}
                            >
                              <Copy className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>

                      {secret.notes && (
                        <div className="space-y-2 p-4 bg-white/[0.02] rounded-2xl border border-white/5 italic">
                          <span className="text-[8px] font-black uppercase tracking-widest text-muted-foreground/30 flex items-center gap-2">
                            <Terminal className="h-2 w-2" /> Annotation
                          </span>
                          <p className="text-sm text-muted-foreground/80 line-clamp-2 leading-relaxed">
                            {secret.notes}
                          </p>
                        </div>
                      )}

                      {secret.website_url && (
                        <div className="mt-auto pt-4 border-t border-white/5">
                          <a
                            href={secret.website_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="group/link inline-flex items-center gap-2 text-xs font-black text-primary uppercase tracking-widest hover:text-primary/80 transition-all"
                          >
                            <Globe className="h-3.5 w-3.5 group-hover/link:rotate-12 transition-transform" />
                            {new URL(secret.website_url).hostname}
                            <ArrowUpRight className="h-3 w-3 opacity-0 group-hover/link:opacity-100 transition-all translate-y-1 group-hover/link:translate-y-0" />
                          </a>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })
          )}
        </AnimatePresence>
      </div>

      {/* Security Override Interface (Dialog) */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-xl glass-premium border-primary/20 p-0 overflow-hidden rounded-[3rem]">
          <div className="bg-primary/5 p-10 border-b border-white/5 relative">
            <div className="absolute top-0 right-0 p-10 opacity-10">
              <ShieldAlert className="h-24 w-24" />
            </div>
            <DialogHeader className="relative z-10">
              <div className="flex items-center gap-4 mb-2">
                <div className="p-3 bg-primary/20 rounded-2xl border border-primary/30">
                  <Key className="h-6 w-6 text-primary" />
                </div>
                <span className="text-[10px] font-black uppercase tracking-[0.4em] text-primary">Protocol Initialization</span>
              </div>
              <DialogTitle className="text-4xl font-black tracking-tight">
                {editingSecret ? "Update Record" : "Access Authorization"}
              </DialogTitle>
              <DialogDescription className="text-muted-foreground font-medium text-lg italic">
                Store your sensitive credentials within the encrypted perimeter
              </DialogDescription>
            </DialogHeader>
          </div>

          <div className="p-10 space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-3">
                <Label htmlFor="name" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-2">Protocol Identifier *</Label>
                <div className="relative group">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors">
                    <Tag className="h-4 w-4" />
                  </div>
                  <Input
                    id="name"
                    placeholder="e.g., QUANTUM_LINK_ALPHA"
                    className="h-14 pl-12 bg-white/[0.03] border-white/10 rounded-2xl font-black uppercase tracking-tight"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-3">
                <Label htmlFor="category" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-2">Protocol Class</Label>
                <Select value={formCategory} onValueChange={setFormCategory}>
                  <SelectTrigger className="h-14 bg-white/[0.03] border-white/10 rounded-2xl font-bold px-6">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="glass-premium border-white/10 rounded-2xl p-2">
                    {CATEGORIES.map(cat => (
                      <SelectItem key={cat.value} value={cat.value} className="rounded-xl py-3 font-bold uppercase tracking-widest text-[9px]">
                        <div className="flex items-center gap-3">
                          <cat.icon className={cn("h-4 w-4", cat.color)} />
                          {cat.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-3">
              <Label htmlFor="value" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-2">Secure Entropy *</Label>
              <div className="relative group">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors">
                  <Lock className="h-4 w-4" />
                </div>
                <Input
                  id="value"
                  type="password"
                  placeholder="Enter payload..."
                  className="h-16 pl-12 bg-white/[0.03] border-white/10 rounded-2xl font-mono"
                  value={formValue}
                  onChange={(e) => setFormValue(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-3">
              <Label htmlFor="website" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-2">Origin Endpoint (optional)</Label>
              <div className="relative group">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors">
                  <Globe className="h-4 w-4" />
                </div>
                <Input
                  id="website"
                  type="url"
                  placeholder="https://console.cloud.google.com"
                  className="h-14 pl-12 bg-white/[0.03] border-white/10 rounded-2xl italic font-medium"
                  value={formWebsiteUrl}
                  onChange={(e) => setFormWebsiteUrl(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-3">
              <Label htmlFor="notes" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-2">Transmission Notes (optional)</Label>
              <Textarea
                id="notes"
                placeholder="Include tactical metadata or recovery instructions..."
                value={formNotes}
                onChange={(e) => setFormNotes(e.target.value)}
                rows={3}
                className="bg-white/[0.03] border-white/10 rounded-2xl p-6 resize-none italic font-medium text-sm focus-visible:ring-primary/20"
              />
            </div>
          </div>

          <DialogFooter className="p-10 pt-0 bg-transparent gap-4 sm:justify-end">
            <Button variant="ghost" onClick={() => setDialogOpen(false)} className="h-14 px-8 rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-white/5">
              Abort
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={createSecret.isPending || updateSecret.isPending}
              className="h-14 px-10 rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-xl shadow-primary/20 gap-3"
            >
              {(createSecret.isPending || updateSecret.isPending) && (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              )}
              {editingSecret ? "Submit Updates" : "Confirm Authorization"}
              <ChevronRight className="h-4 w-4" />
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
