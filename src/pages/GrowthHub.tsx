import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    TrendingUp,
    Map,
    Target,
    Github,
    History,
    Plus,
    CheckCircle2,
    Circle,
    Award,
    FastForward,
    Star,
    Sparkles,
    GitPullRequest,
    Coffee,
    Trophy,
    ArrowUpRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";

// Persistence Hook
function useStickyState<T>(defaultValue: T, key: string): [T, React.Dispatch<React.SetStateAction<T>>] {
    const [value, setValue] = useState<T>(() => {
        try {
            const stickyValue = window.localStorage.getItem(key);
            return stickyValue !== null ? JSON.parse(stickyValue) : defaultValue;
        } catch (error) {
            console.warn(`Error parsing localStorage key "${key}":`, error);
            return defaultValue;
        }
    });

    useEffect(() => {
        try {
            window.localStorage.setItem(key, JSON.stringify(value));
        } catch (error) {
            console.warn(`Error saving to localStorage key "${key}":`, error);
        }
    }, [key, value]);

    return [value, setValue];
}


interface RoadmapItem {
    id: string;
    title: string;
    description: string;
    color: string;
    progress: number;
    milestones: boolean[];
}

interface SkillItem {
    name: string;
    level: number;
    category: string;
}

const INITIAL_ROADMAPS: RoadmapItem[] = [];

const INITIAL_SKILLS: SkillItem[] = [];

export default function GrowthHub() {
    const { toast } = useToast();
    const [activeTab, setActiveTab] = useState("roadmap");

    // Persisted Logic
    const [roadmaps, setRoadmaps] = useStickyState<RoadmapItem[]>(INITIAL_ROADMAPS, "growth-roadmaps");
    const [skills, setSkills] = useStickyState<SkillItem[]>(INITIAL_SKILLS, "growth-skills");
    const [retros, setRetros] = useStickyState<{ date: string, content: string, takeaway: string }[]>([], "growth-retros");

    // Form states
    const [retroInput, setRetroInput] = useState("");
    const [takeawayInput, setTakeawayInput] = useState("");
    const [newSkillName, setNewSkillName] = useState("");

    const handleSaveRetro = () => {
        if (!retroInput) return;
        const newEntry = {
            date: new Date().toLocaleDateString(),
            content: retroInput,
            takeaway: takeawayInput || "No key takeaway logged."
        };
        setRetros([newEntry, ...retros]);
        setRetroInput("");
        setTakeawayInput("");
        toast({ title: "Reflection Captured", description: "Your evolution has been recorded." });
    };

    const advanceMilestone = (roadmapId: string) => {
        const updated = roadmaps.map(r => {
            if (r.id !== roadmapId) return r;
            const nextIndex = r.milestones.findIndex(m => !m);
            if (nextIndex === -1) return r;

            const newMilestones = [...r.milestones];
            newMilestones[nextIndex] = true;
            const newProgress = Math.round(((nextIndex + 1) / r.milestones.length) * 100);

            toast({
                title: "Level Up!",
                description: `You've conquered a new milestone in ${r.title}.`
            });
            return { ...r, milestones: newMilestones, progress: newProgress };
        });
        setRoadmaps(updated);
    };

    const levelUpSkill = (skillName: string) => {
        setSkills(skills.map(s => {
            if (s.name === skillName && s.level < 10) {
                toast({ title: "Mastery Increased", description: `${s.name} specialized knowledge expanded.` });
                return { ...s, level: s.level + 1 };
            }
            return s;
        }));
    };

    const addSkill = () => {
        if (!newSkillName) return;
        setSkills([...skills, { name: newSkillName, level: 1, category: "Core" }]);
        setNewSkillName("");
        toast({ title: "New Skill Initiated", description: `${newSkillName} added to your matrix.` });
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
                                {skills.reduce((acc, s) => acc + s.level, 0)}
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
                            {roadmaps.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-32 bg-dot-pattern rounded-[3rem] border-2 border-dashed border-border/40">
                                    <div className="w-24 h-24 bg-primary/5 rounded-full flex items-center justify-center mb-8 animate-pulse">
                                        <Map className="w-12 h-12 text-primary/40" />
                                    </div>
                                    <h3 className="text-2xl font-black mb-3">No active roadmaps found</h3>
                                    <p className="text-muted-foreground mb-8 text-lg">Initiate a new growth vector from the Project Architect.</p>
                                    <Button size="lg" className="rounded-2xl h-14 px-8 font-black gap-3" onClick={() => setActiveTab("matrix")}>
                                        <Plus className="h-5 w-5" /> Start Learning Path
                                    </Button>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                                    {roadmaps.map((roadmap) => (
                                        <Card key={roadmap.id} className="group relative overflow-hidden glass-premium border-border/30 hover:border-primary/40 transition-all duration-500">
                                            <div className="absolute top-0 right-0 w-48 h-48 bg-primary/5 rounded-full blur-[64px] -mr-24 -mt-24 group-hover:bg-primary/10 transition-colors" />
                                            <CardHeader className="relative z-10 space-y-4">
                                                <div className="flex items-center justify-between">
                                                    <Badge variant="secondary" className={cn("text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-lg bg-muted/60", roadmap.color)}>
                                                        {roadmap.progress === 100 ? "Architected" : "In Focus"}
                                                    </Badge>
                                                    {roadmap.progress === 100 && <Trophy className="h-6 w-6 text-yellow-500" />}
                                                </div>
                                                <div className="space-y-1">
                                                    <CardTitle className="text-2xl font-black group-hover:text-primary transition-colors">{roadmap.title}</CardTitle>
                                                    <CardDescription className="text-sm font-medium leading-relaxed line-clamp-2 italic">{roadmap.description}</CardDescription>
                                                </div>
                                            </CardHeader>
                                            <CardContent className="relative z-10 space-y-8">
                                                <div className="space-y-3">
                                                    <div className="flex justify-between items-end">
                                                        <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">Completion Density</span>
                                                        <span className="text-xl font-black">{roadmap.progress}%</span>
                                                    </div>
                                                    <Progress value={roadmap.progress} className="h-3 bg-muted/30" />
                                                </div>

                                                <div className="space-y-4 bg-muted/20 p-4 rounded-2xl border border-border/40">
                                                    {roadmap.milestones.map((completed, i) => (
                                                        <div key={i} className="flex items-center gap-3">
                                                            <div className={cn(
                                                                "w-6 h-6 rounded-lg flex items-center justify-center shrink-0 border transition-all",
                                                                completed ? "bg-emerald-500/10 border-emerald-500/20" : "bg-muted/40 border-transparent"
                                                            )}>
                                                                {completed ? <CheckCircle2 className="h-4 w-4 text-emerald-500" /> : <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground/30" />}
                                                            </div>
                                                            <span className={cn(
                                                                "text-[11px] font-black uppercase tracking-widest",
                                                                completed ? "text-muted-foreground line-through opacity-40" : "text-foreground"
                                                            )}>
                                                                Milestone Phase {i + 1}
                                                            </span>
                                                        </div>
                                                    ))}
                                                </div>

                                                <Button
                                                    className="w-full h-14 rounded-2xl font-black shadow-xl shadow-primary/5 hover:shadow-primary/10 hover:scale-[1.02] transition-all gap-3 bg-primary text-primary-foreground border-none"
                                                    onClick={() => advanceMilestone(roadmap.id)}
                                                    disabled={roadmap.progress === 100}
                                                >
                                                    {roadmap.progress === 100 ? "Zenith Reached" : "Advance Pipeline"} <FastForward className="h-5 w-5" />
                                                </Button>
                                            </CardContent>
                                        </Card>
                                    ))}
                                </div>
                            )}
                        </TabsContent>

                        <TabsContent value="matrix" className="mt-0">
                            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                                <div className="lg:col-span-8 flex flex-col gap-8">
                                    <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-6">
                                        {skills.map(skill => (
                                            <motion.div
                                                whileHover={{ y: -5, scale: 1.02 }}
                                                key={skill.name}
                                                className="group relative cursor-pointer"
                                                onClick={() => levelUpSkill(skill.name)}
                                            >
                                                <Card className="h-full glass-premium border-border/30 group-hover:border-primary/40 transition-all duration-300 relative overflow-hidden">
                                                    <div className="absolute inset-0 bg-gradient-to-tr from-primary/[0.03] to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                                                    <CardContent className="p-6 flex flex-col items-center gap-4 text-center">
                                                        <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/50">{skill.category}</span>
                                                        <span className="text-xl font-black group-hover:text-primary transition-colors">{skill.name}</span>
                                                        <div className="flex gap-1 py-1">
                                                            {[...Array(5)].map((_, i) => {
                                                                const fill = i < Math.ceil(skill.level / 2);
                                                                return <Star key={i} className={cn("h-4 w-4 transition-colors", fill ? "fill-primary text-primary" : "text-muted/40")} />;
                                                            })}
                                                        </div>
                                                        <div className="w-full h-1.5 bg-muted/40 rounded-full overflow-hidden mt-2">
                                                            <div className="h-full bg-primary transition-all duration-500" style={{ width: `${(skill.level / 10) * 100}%` }} />
                                                        </div>
                                                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 mt-2">Level {skill.level}</span>
                                                    </CardContent>
                                                </Card>
                                            </motion.div>
                                        ))}
                                        <div className="group border-2 border-dashed border-border/40 rounded-3xl p-6 flex flex-col gap-4 items-center justify-center bg-muted/5 hover:bg-muted/10 transition-colors">
                                            <Input
                                                className="bg-transparent border-none text-center font-black text-lg focus-visible:ring-0 placeholder:text-muted-foreground/30"
                                                placeholder="INIT_SKILL"
                                                value={newSkillName}
                                                onChange={(e) => setNewSkillName(e.target.value)}
                                                onKeyDown={(e) => e.key === 'Enter' && addSkill()}
                                            />
                                            <Button size="icon" variant="ghost" className="rounded-full w-12 h-12 bg-primary/10 text-primary hover:bg-primary/20" onClick={addSkill}>
                                                <Plus className="h-6 w-6" />
                                            </Button>
                                        </div>
                                    </div>
                                </div>

                                <div className="lg:col-span-4 space-y-8">
                                    <Card className="glass-premium border-primary/20 bg-primary/[0.02]">
                                        <CardHeader>
                                            <CardTitle className="font-black flex items-center gap-3">
                                                <Award className="h-6 w-6 text-primary" /> Peak Competencies
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent className="space-y-8">
                                            {skills.length === 0 ? (
                                                <p className="text-center text-sm text-muted-foreground py-10 italic">Your skills matrix is currently dormant.</p>
                                            ) : (
                                                skills.sort((a, b) => b.level - a.level).slice(0, 3).map((skill) => (
                                                    <div key={skill.name} className="space-y-4">
                                                        <div className="flex justify-between items-center">
                                                            <h4 className="font-black text-lg leading-none">{skill.name}</h4>
                                                            <Badge className="bg-primary/10 text-primary border-none rounded-lg px-2 text-[10px] font-black uppercase">Lv. {skill.level}</Badge>
                                                        </div>
                                                        <div className="flex gap-1.5 h-4">
                                                            {[...Array(10)].map((_, i) => (
                                                                <div
                                                                    key={i}
                                                                    className={cn(
                                                                        "flex-1 rounded-sm transition-all duration-700",
                                                                        i < skill.level ? "bg-gradient-to-t from-primary to-primary/60 shadow-[0_0_15px_hsla(var(--primary)/0.3)]" : "bg-muted/40"
                                                                    )}
                                                                />
                                                            ))}
                                                        </div>
                                                    </div>
                                                )))}
                                        </CardContent>
                                    </Card>
                                </div>
                            </div>
                        </TabsContent>

                        <TabsContent value="retro" className="mt-0">
                            <div className="grid grid-cols-1 xl:grid-cols-12 gap-10 items-start">
                                <div className="xl:col-span-5">
                                    <Card className="glass-premium border-primary/20 p-4">
                                        <CardHeader className="space-y-4">
                                            <div className="w-16 h-16 rounded-3xl bg-amber-500/10 flex items-center justify-center">
                                                <Coffee className="h-8 w-8 text-amber-500" />
                                            </div>
                                            <div>
                                                <CardTitle className="text-3xl font-black">Daily Reflection</CardTitle>
                                                <CardDescription className="text-base">Synthesize today's experiences into actionable wisdom.</CardDescription>
                                            </div>
                                        </CardHeader>
                                        <CardContent className="space-y-8 mt-4">
                                            <div className="space-y-4">
                                                <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 ml-1">Hardest Obstacle Countered</Label>
                                                <Textarea
                                                    placeholder="e.g. Navigating the complexity of recursive state updates..."
                                                    className="min-h-[160px] bg-muted/40 border-none rounded-2xl p-6 text-lg placeholder:italic"
                                                    value={retroInput}
                                                    onChange={(e) => setRetroInput(e.target.value)}
                                                />
                                            </div>
                                            <div className="space-y-4">
                                                <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 ml-1">Core Takeaway</Label>
                                                <Input
                                                    placeholder="What is the one thing you won't forget?"
                                                    className="h-16 bg-muted/40 border-none rounded-2xl px-6 text-lg font-bold"
                                                    value={takeawayInput}
                                                    onChange={(e) => setTakeawayInput(e.target.value)}
                                                />
                                            </div>
                                            <Button className="w-full h-16 rounded-2xl font-black text-lg shadow-2xl shadow-primary/10" onClick={handleSaveRetro}>
                                                Archive Reflection
                                            </Button>
                                        </CardContent>
                                    </Card>
                                </div>

                                <div className="xl:col-span-7 space-y-6">
                                    <div className="flex items-center gap-3 px-2">
                                        <History className="h-5 w-5 text-muted-foreground" />
                                        <h3 className="font-black text-xs uppercase tracking-[0.3em] text-muted-foreground">Historical Records</h3>
                                    </div>
                                    <div className="grid gap-6">
                                        {retros.length === 0 ? (
                                            <div className="p-20 text-center bg-muted/10 rounded-[2.5rem] border-2 border-dashed border-border/40">
                                                <span className="text-muted-foreground italic text-lg">Your chronicle begins with the first save.</span>
                                            </div>
                                        ) : (
                                            retros.map((entry, i) => (
                                                <Card key={i} className="glass-premium border-border/30 hover:border-primary/20 transition-all group overflow-hidden">
                                                    <CardContent className="p-8 flex items-start gap-8 relative">
                                                        <div className="absolute top-0 left-0 w-1 h-full bg-primary/20 group-hover:bg-primary transition-colors" />
                                                        <div className="text-center min-w-[80px] space-y-1">
                                                            <span className="text-4xl font-black text-muted-foreground/20 group-hover:text-primary/20 transition-colors uppercase leading-none block">
                                                                {entry.date.split('/')[1] || entry.date.split('.')[0]}
                                                            </span>
                                                            <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">{new Date(entry.date).toLocaleString('default', { month: 'short' })}</span>
                                                        </div>
                                                        <div className="flex-1 space-y-4">
                                                            <p className="text-lg font-medium leading-relaxed text-foreground/80 italic">"{entry.content}"</p>
                                                            <div className="flex items-center gap-3 bg-primary/5 p-4 rounded-xl border border-primary/10">
                                                                <Sparkles className="h-4 w-4 text-primary" />
                                                                <p className="text-xs font-black uppercase tracking-widest text-primary">{entry.takeaway}</p>
                                                            </div>
                                                        </div>
                                                    </CardContent>
                                                </Card>
                                            ))
                                        )}
                                    </div>
                                </div>
                            </div>
                        </TabsContent>

                        <TabsContent value="oss" className="mt-0">
                            <div className="max-w-4xl mx-auto py-20">
                                <div className="relative group">
                                    <div className="absolute -inset-1 bg-gradient-to-r from-primary to-indigo-500 rounded-[3rem] blur opacity-25 group-hover:opacity-40 transition duration-1000 group-hover:duration-200" />
                                    <Card className="relative glass-premium border-none bg-background/60 p-12 text-center overflow-hidden">
                                        <div className="absolute -right-20 -top-20 w-80 h-80 bg-primary/10 rounded-full blur-[100px] pointer-events-none" />
                                        <CardContent className="space-y-10">
                                            <div className="w-24 h-24 mx-auto rounded-[2rem] bg-indigo-500/10 flex items-center justify-center">
                                                <Github className="h-12 w-12 text-indigo-400" />
                                            </div>
                                            <div className="space-y-4">
                                                <h4 className="text-4xl font-black tracking-tighter italic">Collaborative Synthesis Incoming</h4>
                                                <p className="text-muted-foreground text-xl max-w-lg mx-auto leading-relaxed">
                                                    We are architecting a direct neural link to your GitHub profile to visualize your Open Source impact.
                                                </p>
                                            </div>
                                            <div className="flex flex-col sm:flex-row gap-4 items-center justify-center pt-6">
                                                <Button size="lg" className="h-16 px-12 rounded-2xl font-black text-lg gap-3" onClick={() => window.open("https://github.com/explore", "_blank")}>
                                                    Explore Frontiers <ArrowUpRight className="h-6 w-6" />
                                                </Button>
                                                <Button variant="ghost" size="lg" className="h-16 px-12 rounded-2xl font-black text-muted-foreground">
                                                    Read Strategy Guide
                                                </Button>
                                            </div>
                                        </CardContent>
                                    </Card>
                                </div>
                            </div>
                        </TabsContent>
                    </motion.div>
                </AnimatePresence>
            </Tabs>
        </div>
    );
}
