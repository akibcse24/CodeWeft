import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Sparkles,
    FastForward,
    Map,
    Target,
    History,
    Github,
    Plus,
    PlusCircle,
    FastForward as FastForwardIcon,
    ArrowUpRight,
    Star,
    GitBranch,
    Zap,
    Book,
    Trash2,
    TrendingUp,
    History as HistoryIcon,
    Dna
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useGrowth, RoadmapItem, SkillItem } from "@/hooks/useGrowth";
import { useGitHub } from "@/hooks/useGitHub";
import { cn } from "@/lib/utils";

export default function GrowthHub() {
    const {
        roadmaps,
        roadmapsLoading,
        addRoadmap,
        advanceMilestone,
        removeRoadmap,
        skills,
        skillsLoading,
        addSkill,
        levelUpSkill,
        removeSkill,
        retros,
        retrosLoading,
        addRetro,
        removeRetro
    } = useGrowth();

    const { contributions, repositories } = useGitHub();

    const [activeTab, setActiveTab] = useState("roadmap");
    const [retroInput, setRetroInput] = useState("");
    const [takeawayInput, setTakeawayInput] = useState("");
    const [newSkillName, setNewSkillName] = useState("");

    // New Roadmap form state
    const [showRoadmapForm, setShowRoadmapForm] = useState(false);
    const [newRoadmapTitle, setNewRoadmapTitle] = useState("");
    const [newRoadmapDesc, setNewRoadmapDesc] = useState("");

    const handleSaveRetro = async () => {
        if (!retroInput) return;
        await addRetro.mutateAsync({
            content: retroInput,
            takeaway: takeawayInput || "No key takeaway logged."
        });
        setRetroInput("");
        setTakeawayInput("");
    };

    const handleCreateRoadmap = async () => {
        if (!newRoadmapTitle) return;
        await addRoadmap.mutateAsync({
            title: newRoadmapTitle,
            description: newRoadmapDesc,
            milestonesCount: 3
        });
        setNewRoadmapTitle("");
        setNewRoadmapDesc("");
        setShowRoadmapForm(false);
    };

    return (
        <div className="space-y-12 animate-fade-in max-w-[1400px] mx-auto pb-20 p-6 flex flex-col min-h-screen">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 relative">
                <div className="absolute -left-20 -top-20 w-80 h-80 bg-primary/5 rounded-full blur-[120px] pointer-events-none" />
                <div className="space-y-3 relative z-10">
                    <div className="flex items-center gap-2 text-primary">
                        <Sparkles className="h-5 w-5 animate-pulse" />
                        <span className="text-xs font-black uppercase tracking-[0.3em] overflow-hidden">Evolution Protocol</span>
                    </div>
                    <h1 className="text-6xl font-black tracking-tighter bg-clip-text text-transparent bg-gradient-to-br from-foreground to-foreground/40 leading-tight">
                        Growth Hub
                    </h1>
                    <p className="text-muted-foreground text-xl max-w-xl font-medium leading-relaxed">
                        Strategize your ascent to mastery and document the transformation of your engineering prowess.
                    </p>
                </div>

                <div className="flex flex-wrap items-center gap-4 relative z-10">
                    <div className="flex items-center gap-10 bg-muted/20 backdrop-blur-3xl px-10 py-6 rounded-[2.5rem] border border-border/40 shadow-2xl shadow-black/10">
                        <div className="flex flex-col">
                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 mb-1">Active Paths</span>
                            <span className="text-3xl font-black text-primary leading-none">{roadmaps.length}</span>
                        </div>
                        <div className="w-px h-10 bg-border/40" />
                        <div className="flex flex-col">
                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 mb-1">Mastery Points</span>
                            <span className="text-3xl font-black text-indigo-400 leading-none">
                                {skills.reduce((acc, s) => acc + (s.level || 0), 0)}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <div className="flex items-center justify-between mb-10 overflow-x-auto pb-4 no-scrollbar">
                    <TabsList className="bg-muted/30 p-2 h-16 rounded-[1.25rem] border border-border/20 backdrop-blur-xl">
                        <TabsTrigger value="roadmap" className="rounded-xl px-8 h-12 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground font-black text-[11px] uppercase tracking-widest gap-2.5 transition-all">
                            <Map className="h-4 w-4" /> Roadmaps
                        </TabsTrigger>
                        <TabsTrigger value="matrix" className="rounded-xl px-8 h-12 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground font-black text-[11px] uppercase tracking-widest gap-2.5 transition-all">
                            <Target className="h-4 w-4" /> Mastery Matrix
                        </TabsTrigger>
                        <TabsTrigger value="retro" className="rounded-xl px-8 h-12 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground font-black text-[11px] uppercase tracking-widest gap-2.5 transition-all">
                            <History className="h-4 w-4" /> Daily Retro
                        </TabsTrigger>
                        <TabsTrigger value="oss" className="rounded-xl px-8 h-12 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground font-black text-[11px] uppercase tracking-widest gap-2.5 transition-all">
                            <Github className="h-4 w-4" /> Open Source
                        </TabsTrigger>
                    </TabsList>
                </div>

                <AnimatePresence mode="wait">
                    <motion.div
                        key={activeTab}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                    >
                        <TabsContent value="roadmap" className="mt-0">
                            {roadmaps.length === 0 && !showRoadmapForm ? (
                                <div className="flex flex-col items-center justify-center py-40 bg-muted/10 rounded-[3rem] border-2 border-dashed border-border/40 text-center px-6">
                                    <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mb-8">
                                        <Map className="h-10 w-10 text-primary" />
                                    </div>
                                    <h3 className="text-2xl font-black mb-4 uppercase tracking-tighter italic">No Active Trajectories</h3>
                                    <p className="text-muted-foreground text-lg mb-10 max-w-sm font-medium leading-relaxed italic">
                                        You haven't initiated an evolution roadmap. Architect your growth path.
                                    </p>
                                    <Button size="lg" className="rounded-2xl h-16 px-12 font-black text-lg gap-3 shadow-2xl shadow-primary/20" onClick={() => setShowRoadmapForm(true)}>
                                        Initiate Protocol <Plus className="h-6 w-6" />
                                    </Button>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                                    <AnimatePresence>
                                        {showRoadmapForm && (
                                            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}>
                                                <Card className="glass-premium border-primary/20 h-full">
                                                    <CardHeader className="p-10 pb-6">
                                                        <CardTitle className="text-3xl font-black tracking-tighter">New Trajectory</CardTitle>
                                                        <CardDescription>Define the scope of your engineering ascent.</CardDescription>
                                                    </CardHeader>
                                                    <CardContent className="p-10 pt-0 space-y-6">
                                                        <Input placeholder="Roadmap Title (e.g. Distributed Systems Mastery)" value={newRoadmapTitle} onChange={e => setNewRoadmapTitle(e.target.value)} className="h-14 rounded-xl bg-muted/20" />
                                                        <Textarea placeholder="Description of the path..." value={newRoadmapDesc} onChange={e => setNewRoadmapDesc(e.target.value)} className="min-h-[120px] rounded-xl bg-muted/20" />
                                                        <div className="flex gap-4">
                                                            <Button className="flex-1 h-16 rounded-2xl font-black text-lg" onClick={handleCreateRoadmap} disabled={addRoadmap.isPending}>
                                                                Initiate Path
                                                            </Button>
                                                            <Button variant="ghost" className="h-16 px-8 rounded-2xl font-black" onClick={() => setShowRoadmapForm(false)}>Cancel</Button>
                                                        </div>
                                                    </CardContent>
                                                </Card>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>

                                    {roadmaps.map((roadmap) => (
                                        <motion.div
                                            layout
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            key={roadmap.id}
                                        >
                                            <Card className="group glass-premium border-border/30 hover:border-primary/40 transition-all duration-700 relative overflow-hidden h-full flex flex-col">
                                                <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-[100px] -mr-32 -mt-32 opacity-0 group-hover:opacity-100 transition-opacity" />
                                                <CardHeader className="p-10 pb-6 relative z-10">
                                                    <div className="flex items-start justify-between mb-2">
                                                        <Badge variant="outline" className="px-4 py-1.5 rounded-full border-primary/20 bg-primary/5 text-primary text-[10px] font-black uppercase tracking-[0.2em]">
                                                            Level {Math.floor((roadmap.progress || 0) / 33) + 1} Architect
                                                        </Badge>
                                                        <div className="flex gap-2">
                                                            <Button variant="ghost" size="icon" className="h-10 w-10 text-muted-foreground/40 hover:text-destructive transition-colors" onClick={() => removeRoadmap.mutate(roadmap.id)}>
                                                                <Trash2 className="h-4 w-4" />
                                                            </Button>
                                                        </div>
                                                    </div>
                                                    <CardTitle className="text-4xl font-black tracking-tighter leading-none mb-4 italic group-hover:text-primary transition-colors">{roadmap.title}</CardTitle>
                                                    <CardDescription className="text-lg leading-relaxed font-medium line-clamp-2 italic">{roadmap.description}</CardDescription>
                                                </CardHeader>
                                                <CardContent className="p-10 pt-0 flex-1 flex flex-col justify-between space-y-10 relative z-10">
                                                    <div className="space-y-6">
                                                        <div className="flex justify-between items-end">
                                                            <div className="space-y-1">
                                                                <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">Current Progress</span>
                                                                <p className="text-4xl font-black leading-none italic">{roadmap.progress}%</p>
                                                            </div>
                                                            <div className="text-right space-y-1">
                                                                <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">Milestones</span>
                                                                <div className="flex gap-1.5">
                                                                    {roadmap.milestones?.map((m, i) => (
                                                                        <div key={i} className={cn("w-3 h-3 rounded-full transition-all duration-500", m ? "bg-primary shadow-[0_0_12px_rgba(255,42,109,0.5)] scale-110" : "bg-muted/30 border border-border/40")} />
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <div className="h-4 w-full bg-muted/20 rounded-full overflow-hidden border border-border/20 p-1">
                                                            <motion.div
                                                                className="h-full bg-primary rounded-full shadow-[0_0_20px_rgba(255,42,109,0.3)]"
                                                                initial={{ width: 0 }}
                                                                animate={{ width: `${roadmap.progress}%` }}
                                                                transition={{ duration: 1.5, ease: "circOut" }}
                                                            />
                                                        </div>
                                                    </div>

                                                    <Button
                                                        className="w-full h-14 rounded-2xl font-black shadow-xl shadow-primary/5 hover:shadow-primary/10 hover:scale-[1.02] transition-all gap-3 bg-primary text-primary-foreground border-none"
                                                        onClick={() => advanceMilestone.mutate({ id: roadmap.id, milestones: roadmap.milestones })}
                                                        disabled={roadmap.progress === 100 || advanceMilestone.isPending}
                                                    >
                                                        {roadmap.progress === 100 ? "Zenith Reached" : "Advance Pipeline"} <FastForwardIcon className="h-5 w-5" />
                                                    </Button>
                                                </CardContent>
                                            </Card>
                                        </motion.div>
                                    ))}

                                    {roadmaps.length > 0 && !showRoadmapForm && (
                                        <Button variant="outline" className="h-full min-h-[400px] border-2 border-dashed border-border/40 rounded-[3rem] text-muted-foreground hover:text-primary hover:border-primary/40 hover:bg-primary/5 transition-all flex flex-col gap-6" onClick={() => setShowRoadmapForm(true)}>
                                            <PlusCircle className="h-16 w-16 opacity-20" />
                                            <span className="font-black uppercase tracking-widest italic">Initiate New Trajectory</span>
                                        </Button>
                                    )}
                                </div>
                            )}
                        </TabsContent>

                        <TabsContent value="matrix" className="mt-0">
                            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 py-10">
                                <div className="lg:col-span-8">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        {skills.map(skill => (
                                            <motion.div
                                                whileHover={{ y: -5, scale: 1.02 }}
                                                key={skill.id}
                                                className="group relative cursor-pointer"
                                                onClick={() => levelUpSkill.mutate({ id: skill.id, level: skill.level })}
                                            >
                                                <Card className="h-full glass-premium border-border/30 group-hover:border-primary/40 transition-all duration-300 relative overflow-hidden">
                                                    <div className="absolute inset-0 bg-gradient-to-tr from-primary/[0.03] to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                                                    <CardContent className="p-8">
                                                        <div className="flex items-start justify-between mb-8">
                                                            <div className="space-y-1">
                                                                <Badge variant="outline" className="text-[9px] font-black uppercase tracking-widest border-primary/20 text-primary px-2 mb-2">
                                                                    {skill.category}
                                                                </Badge>
                                                                <h4 className="text-2xl font-black italic tracking-tighter group-hover:text-primary transition-colors">{skill.name}</h4>
                                                            </div>
                                                            <div className="w-12 h-12 bg-muted/20 rounded-xl flex items-center justify-center font-black text-xl italic group-hover:scale-110 transition-transform">
                                                                {skill.level}
                                                            </div>
                                                        </div>
                                                        <div className="flex gap-1 h-3">
                                                            {[...Array(10)].map((_, i) => (
                                                                <div
                                                                    key={i}
                                                                    className={cn(
                                                                        "flex-1 rounded-sm transition-all duration-500",
                                                                        i < (skill.level || 0) ? "bg-primary shadow-[0_0_8px_rgba(255,42,109,0.4)]" : "bg-muted/20"
                                                                    )}
                                                                />
                                                            ))}
                                                        </div>
                                                        <div className="flex justify-between mt-3 px-1">
                                                            <span className="text-[10px] font-black tracking-widest text-muted-foreground/40 uppercase">Initiate</span>
                                                            <span className="text-[10px] font-black tracking-widest text-primary uppercase">Grandmaster</span>
                                                        </div>
                                                    </CardContent>
                                                    <Button variant="ghost" size="icon" className="absolute top-2 right-2 h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive" onClick={(e) => { e.stopPropagation(); removeSkill.mutate(skill.id); }}>
                                                        <Trash2 className="h-3.5 w-3.5" />
                                                    </Button>
                                                </Card>
                                            </motion.div>
                                        ))}
                                        <div className="glass-premium border-border/40 p-1 rounded-[2.5rem] flex flex-col md:flex-row items-center gap-4">
                                            <Input
                                                placeholder="Inject New Discipline..."
                                                className="h-16 bg-transparent border-none text-lg font-bold placeholder:text-muted-foreground/30 focus-visible:ring-0 px-8"
                                                value={newSkillName}
                                                onChange={(e) => setNewSkillName(e.target.value)}
                                                onKeyDown={(e) => e.key === 'Enter' && addSkill.mutate({ name: newSkillName, category: "Core" })}
                                            />
                                            <Button size="icon" variant="ghost" className="rounded-full w-12 h-12 bg-primary/10 text-primary hover:bg-primary/20" onClick={() => addSkill.mutate({ name: newSkillName, category: "Core" })}>
                                                <Plus className="h-6 w-6" />
                                            </Button>
                                        </div>
                                    </div>
                                </div>

                                <Card className="lg:col-span-4 glass-premium border-border/30 p-10 space-y-10 h-fit sticky top-24">
                                    <div className="space-y-4">
                                        <div className="w-14 h-14 bg-emerald-500/10 rounded-2xl flex items-center justify-center">
                                            <TrendingUp className="h-7 w-7 text-emerald-400" />
                                        </div>
                                        <h4 className="text-3xl font-black tracking-tighter italic">Engine Optimization</h4>
                                        <p className="text-muted-foreground font-medium italic leading-relaxed">
                                            Total Skill Saturation: {skills.reduce((acc, s) => acc + (s.level || 0), 0)} Mastery Points localized.
                                        </p>
                                    </div>
                                    <div className="space-y-6">
                                        <div className="p-6 rounded-2xl bg-muted/10 border border-border/40 italic">
                                            <p className="text-sm text-primary font-black mb-2 uppercase tracking-widest">Growth Recommendation</p>
                                            <p className="text-sm font-medium leading-relaxed">
                                                Your {skills[0]?.name || "Primary Skill"} is dominant. Consider diversifying into secondary disciplines to reach Architect status.
                                            </p>
                                        </div>
                                    </div>
                                </Card>
                            </div>
                        </TabsContent>

                        <TabsContent value="retro" className="mt-0">
                            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 py-10">
                                <div className="lg:col-span-12">
                                    <Card className="glass-premium border-border/30 overflow-hidden mb-12">
                                        <div className="grid grid-cols-1 md:grid-cols-[1fr,350px]">
                                            <div className="p-10 space-y-8">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-12 h-12 rounded-2xl bg-amber-500/10 flex items-center justify-center">
                                                        <HistoryIcon className="h-6 w-6 text-amber-500" />
                                                    </div>
                                                    <div>
                                                        <h4 className="text-3xl font-black tracking-tighter italic leading-none">Daily Reflection</h4>
                                                        <p className="text-muted-foreground text-sm font-medium italic mt-1">Archive today's cerebral output.</p>
                                                    </div>
                                                </div>
                                                <div className="space-y-6">
                                                    <div className="space-y-3">
                                                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 px-2">Cerebral Log</label>
                                                        <Textarea
                                                            placeholder="What complex paradigms did you navigate today?"
                                                            className="min-h-[160px] bg-muted/10 border-border/20 rounded-3xl p-8 text-lg font-medium italic placeholder:text-muted-foreground/20 italic"
                                                            value={retroInput}
                                                            onChange={(e) => setRetroInput(e.target.value)}
                                                        />
                                                    </div>
                                                    <div className="space-y-3">
                                                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 px-2">Key Synthesized Takeaway</label>
                                                        <Input
                                                            placeholder="The singular lesson to archive..."
                                                            className="h-16 bg-muted/10 border-border/20 rounded-2xl px-8 text-lg font-medium italic"
                                                            value={takeawayInput}
                                                            onChange={(e) => setTakeawayInput(e.target.value)}
                                                        />
                                                    </div>
                                                    <Button className="h-18 w-full rounded-2xl text-xl font-black italic shadow-2xl shadow-primary/20 bg-primary text-primary-foreground transform active:scale-95 transition-all" onClick={handleSaveRetro} disabled={addRetro.isPending}>
                                                        Archive Evolution <Zap className="h-6 w-6 ml-4" />
                                                    </Button>
                                                </div>
                                            </div>
                                            <div className="bg-muted/10 border-l border-border/20 p-10 flex flex-col justify-center gap-10">
                                                <div className="space-y-4">
                                                    <p className="text-[10px] font-black uppercase tracking-widest text-primary text-center">Protocol Status</p>
                                                    <div className="flex items-center justify-center gap-3">
                                                        {[...Array(7)].map((_, i) => (
                                                            <div key={i} className={cn("w-3 h-3 rounded-full", i < 4 ? "bg-primary" : "bg-muted/40")} />
                                                        ))}
                                                    </div>
                                                </div>
                                                <div className="p-6 rounded-2xl border border-border/40 bg-background/40 italic">
                                                    <p className="text-xs leading-relaxed text-muted-foreground font-medium">
                                                        Consistent daily reflection increases synaptic resonance by <span className="text-primary font-black">42%</span>. Your streak is localized to 4 cycles.
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    </Card>

                                    <div className="space-y-6">
                                        <div className="flex items-center gap-3 px-4 uppercase tracking-[0.3em] text-xs font-black text-muted-foreground/60 mb-8">
                                            <Dna className="h-4 w-4" /> Historical Records
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                            {retros.map(retro => (
                                                <Card key={retro.id} className="glass-premium border-border/30 p-8 space-y-6 relative group overflow-hidden">
                                                    <div className="absolute top-0 right-0 p-4">
                                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground/20 hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => removeRetro.mutate(retro.id)}>
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                    <div className="flex justify-between items-start">
                                                        <time className="text-[10px] font-black tracking-widest text-primary uppercase">{retro.date}</time>
                                                    </div>
                                                    <p className="text-muted-foreground text-sm font-medium leading-relaxed italic line-clamp-3">
                                                        "{retro.content}"
                                                    </p>
                                                    <div className="pt-4 border-t border-border/20">
                                                        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/40 mb-2">Synthesis</p>
                                                        <p className="text-xs font-black italic text-foreground">{retro.takeaway}</p>
                                                    </div>
                                                </Card>
                                            ))}
                                            {retros.length === 0 && (
                                                <div className="col-span-full py-20 text-center opacity-30 italic font-black uppercase tracking-widest text-xs">
                                                    No growth records localized in temporal database.
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </TabsContent>

                        <TabsContent value="oss" className="mt-0">
                            <div className="space-y-12 py-10">
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                    <Card className="glass-premium border-border/30 p-8 flex flex-col items-center text-center gap-4">
                                        <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center">
                                            <Github className="h-6 w-6 text-primary" />
                                        </div>
                                        <div>
                                            <h4 className="text-2xl font-black">{contributions?.total || 0}</h4>
                                            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">Annual Contributions</p>
                                        </div>
                                    </Card>
                                    <Card className="glass-premium border-border/30 p-8 flex flex-col items-center text-center gap-4">
                                        <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 flex items-center justify-center">
                                            <GitBranch className="h-6 w-6 text-indigo-400" />
                                        </div>
                                        <div>
                                            <h4 className="text-2xl font-black">{repositories?.length || 0}</h4>
                                            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">Active Repositories</p>
                                        </div>
                                    </Card>
                                    <Card className="glass-premium border-border/30 p-8 flex flex-col items-center text-center gap-4">
                                        <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center">
                                            <Star className="h-6 w-6 text-emerald-400" />
                                        </div>
                                        <div>
                                            <h4 className="text-2xl font-black">{repositories?.reduce((acc: number, r: any) => acc + (r.stargazers_count || 0), 0) || 0}</h4>
                                            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">Total Stars Received</p>
                                        </div>
                                    </Card>
                                    <Card className="glass-premium border-border/30 p-8 flex flex-col items-center text-center gap-4">
                                        <div className="w-12 h-12 rounded-2xl bg-amber-500/10 flex items-center justify-center">
                                            <Zap className="h-6 w-6 text-amber-400" />
                                        </div>
                                        <div>
                                            <h4 className="text-2xl font-black">Elite</h4>
                                            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">Developer Status</p>
                                        </div>
                                    </Card>
                                </div>

                                <Card className="glass-premium border-border/30 overflow-hidden">
                                    <CardHeader className="p-8">
                                        <CardTitle className="text-2xl font-black flex items-center gap-3">
                                            <Sparkles className="h-6 w-6 text-primary" /> Open Source Pulse
                                        </CardTitle>
                                        <CardDescription>Your real-time impact on the global engineering collective.</CardDescription>
                                    </CardHeader>
                                    <CardContent className="p-8 pt-0">
                                        {repositories && repositories.length > 0 ? (
                                            <div className="grid gap-4">
                                                {repositories.slice(0, 5).map((repo: any) => (
                                                    <div key={repo.name} className="flex items-center justify-between p-4 rounded-2xl bg-muted/20 border border-border/40 group hover:bg-muted/30 transition-all">
                                                        <div className="flex items-center gap-4">
                                                            <div className="p-2 rounded-xl bg-background/50 border border-border/20">
                                                                <Book className="h-4 w-4" />
                                                            </div>
                                                            <div>
                                                                <h5 className="font-black text-sm">{repo.name}</h5>
                                                                <p className="text-[10px] font-medium text-muted-foreground">{repo.language || 'Documentation'}</p>
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center gap-6">
                                                            <div className="text-right">
                                                                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/40">Stars</p>
                                                                <p className="font-black text-sm">{repo.stargazers_count}</p>
                                                            </div>
                                                            <div className="text-right">
                                                                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/40">Forks</p>
                                                                <p className="font-black text-sm">{repo.forks_count}</p>
                                                            </div>
                                                            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg" onClick={() => window.open(repo.html_url, '_blank')}>
                                                                <ArrowUpRight className="h-4 w-4" />
                                                            </Button>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="py-20 text-center space-y-4 opacity-40">
                                                <Github className="h-12 w-12 mx-auto" />
                                                <p className="font-black uppercase tracking-widest text-xs">Awaiting GitHub Synchronization</p>
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            </div>
                        </TabsContent>
                    </motion.div>
                </AnimatePresence>
            </Tabs>
        </div>
    );
}
