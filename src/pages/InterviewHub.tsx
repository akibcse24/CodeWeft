import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Briefcase,
    MapPin,
    DollarSign,
    Calendar,
    CheckCircle2,
    Circle,
    BookOpen,
    Brain,
    MessageSquare,
    Plus,
    Trash2,
    MoreVertical,
    ExternalLink,
    ChevronRight,
    TrendingUp,
    Building2,
    Code2
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

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


type JobStage = "Applied" | "Screening" | "Technical" | "Behavioral" | "Offer" | "Rejected";

interface JobApplication {
    id: string;
    company: string;
    role: string;
    location: string;
    salary: string;
    stage: JobStage;
    date: string;
}

const INITIAL_JOBS: JobApplication[] = [];

const INITIAL_MASTERY = [
    { topic: "Operating Systems", progress: 0, subtopics: ["Process Management", "Memory Management", "Concurrency", "File Systems"] },
    { topic: "DBMS", progress: 0, subtopics: ["SQL", "Normalization", "ACID Properties", "Indexing"] },
    { topic: "Computer Networks", progress: 0, subtopics: ["OSI Model", "TCP/IP", "HTTP/HTTPS", "DNS"] },
    { topic: "System Design", progress: 0, subtopics: ["Load Balancing", "Caching", "Sharding", "CAP Theorem"] },
];

export default function InterviewHub() {
    const { toast } = useToast();
    const [activeTab, setActiveTab] = useState("pipeline");

    // Persisted Data
    const [jobs, setJobs] = useStickyState<JobApplication[]>(INITIAL_JOBS, "interview-jobs");
    const [mastery, setMastery] = useStickyState(INITIAL_MASTERY, "interview-mastery");

    // Form State
    const [isAddingJob, setIsAddingJob] = useState(false);
    const [newJob, setNewJob] = useState<Partial<JobApplication>>({ stage: "Applied" });

    const stages: JobStage[] = ["Applied", "Screening", "Technical", "Behavioral", "Offer"];

    const handleAddJob = () => {
        if (!newJob.company || !newJob.role) return;
        const job: JobApplication = {
            id: crypto.randomUUID(),
            company: newJob.company,
            role: newJob.role,
            location: newJob.location || "Remote",
            salary: newJob.salary || "Not Disclosed",
            stage: "Applied",
            date: new Date().toLocaleDateString()
        };
        setJobs([job, ...jobs]);
        setIsAddingJob(false);
        setNewJob({ stage: "Applied" });
        toast({ title: "Application Tracked", description: `Good luck with ${job.company}!` });
    };

    const deleteJob = (id: string) => {
        setJobs(jobs.filter(j => j.id !== id));
        toast({ title: "Job Removed" });
    };

    const moveJobStage = (id: string, direction: 'next' | 'prev') => {
        setJobs(jobs.map(job => {
            if (job.id !== id) return job;
            const currentIndex = stages.indexOf(job.stage as JobStage);
            if (currentIndex === -1) return job;

            const nextIndex = direction === 'next' ? currentIndex + 1 : currentIndex - 1;
            if (nextIndex < 0 || nextIndex >= stages.length) return job;

            return { ...job, stage: stages[nextIndex] };
        }));
    };

    const markJobRejected = (id: string) => {
        setJobs(jobs.map(j => j.id === id ? { ...j, stage: "Rejected" } : j));
        toast({ title: "Updated Status", description: "Stay strong, the right one is coming!" });
    };

    const increaseMastery = (topicIndex: number) => {
        const updated = [...mastery];
        if (updated[topicIndex].progress < 100) {
            updated[topicIndex].progress = Math.min(100, updated[topicIndex].progress + 10);
            setMastery(updated);
        }
    };

    const totalApplications = jobs.length;
    const activeApplications = jobs.filter(j => j.stage !== "Rejected" && j.stage !== "Offer").length;
    const offersCount = jobs.filter(j => j.stage === "Offer").length;

    return (
        <div className="space-y-10 animate-fade-in max-w-[1600px] mx-auto pb-20 p-6 flex flex-col min-h-screen">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 relative">
                <div className="absolute -left-20 -top-20 w-64 h-64 bg-primary/5 rounded-full blur-3xl pointer-events-none" />
                <div className="space-y-2 relative z-10">
                    <div className="flex items-center gap-2 text-primary">
                        <Briefcase className="h-5 w-5" />
                        <span className="text-xs font-black uppercase tracking-[0.2em]">Career Command</span>
                    </div>
                    <h1 className="text-5xl font-black tracking-tight bg-clip-text text-transparent bg-gradient-to-br from-foreground to-foreground/60">
                        Interview Hub
                    </h1>
                    <p className="text-muted-foreground text-lg max-w-lg">
                        Strategize your career moves and master the core foundations of engineering.
                    </p>
                </div>

                <div className="flex items-center gap-3 relative z-10">
                    <div className="hidden sm:flex items-center gap-8 mr-4 px-8 py-4 bg-muted/20 backdrop-blur-xl rounded-[2rem] border border-border/40">
                        <div className="flex flex-col">
                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60">Active Pipeline</span>
                            <span className="text-xl font-black text-primary">{activeApplications}</span>
                        </div>
                        <div className="w-px h-8 bg-border/40" />
                        <div className="flex flex-col">
                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60">Offers</span>
                            <span className="text-xl font-black text-emerald-500">{offersCount}</span>
                        </div>
                    </div>
                    <Button onClick={() => setIsAddingJob(!isAddingJob)} size="lg" className="h-14 px-8 rounded-2xl shadow-xl shadow-primary/20 hover:scale-105 transition-all gap-3">
                        <Plus className="h-5 w-5" /> New Application
                    </Button>
                </div>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <div className="flex items-center justify-between mb-8">
                    <TabsList className="bg-muted/40 p-1.5 h-14 rounded-2xl border border-border/40 backdrop-blur-xl">
                        <TabsTrigger value="pipeline" className="rounded-xl px-6 h-11 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground font-bold gap-2">
                            <TrendingUp className="h-4 w-4" /> Pipeline
                        </TabsTrigger>
                        <TabsTrigger value="mastery" className="rounded-xl px-6 h-11 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground font-bold gap-2">
                            <Brain className="h-4 w-4" /> CS Mastery
                        </TabsTrigger>
                        <TabsTrigger value="resources" className="rounded-xl px-6 h-11 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground font-bold gap-2">
                            <BookOpen className="h-4 w-4" /> Intelligence
                        </TabsTrigger>
                    </TabsList>
                </div>

                {/* Form Section */}
                <AnimatePresence>
                    {isAddingJob && (
                        <motion.div
                            initial={{ opacity: 0, y: -20, height: 0 }}
                            animate={{ opacity: 1, y: 0, height: "auto" }}
                            exit={{ opacity: 0, y: -20, height: 0 }}
                            className="mb-10 overflow-hidden"
                        >
                            <Card className="glass-premium border-primary/20 bg-primary/[0.02]">
                                <CardContent className="p-8">
                                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-end">
                                        <div className="space-y-3">
                                            <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/70 ml-1">Organization</Label>
                                            <Input
                                                placeholder="Google, Stripe, etc."
                                                className="h-12 bg-muted/40 border-none rounded-xl"
                                                value={newJob.company || ""}
                                                onChange={e => setNewJob({ ...newJob, company: e.target.value })}
                                            />
                                        </div>
                                        <div className="space-y-3">
                                            <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/70 ml-1">Target Role</Label>
                                            <Input
                                                placeholder="Frontend Engineer"
                                                className="h-12 bg-muted/40 border-none rounded-xl"
                                                value={newJob.role || ""}
                                                onChange={e => setNewJob({ ...newJob, role: e.target.value })}
                                            />
                                        </div>
                                        <div className="space-y-3">
                                            <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/70 ml-1">Office / Remote</Label>
                                            <Input
                                                placeholder="Remote, NYC..."
                                                className="h-12 bg-muted/40 border-none rounded-xl"
                                                value={newJob.location || ""}
                                                onChange={e => setNewJob({ ...newJob, location: e.target.value })}
                                            />
                                        </div>
                                        <div className="flex gap-3">
                                            <Button className="flex-1 h-12 rounded-xl font-bold" onClick={handleAddJob}>Initiate Tracking</Button>
                                            <Button variant="ghost" className="h-12 rounded-xl px-4" onClick={() => setIsAddingJob(false)}>Cancel</Button>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </motion.div>
                    )}
                </AnimatePresence>

                <AnimatePresence mode="wait">
                    <motion.div
                        key={activeTab}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ duration: 0.3 }}
                    >
                        <TabsContent value="pipeline" className="mt-0">
                            <ScrollArea className="w-full whitespace-nowrap pb-6">
                                <div className="flex gap-6 min-w-full">
                                    {stages.map(stage => {
                                        const stageJobs = jobs.filter(j => j.stage === stage);
                                        return (
                                            <div key={stage} className="w-[320px] shrink-0 space-y-6">
                                                <div className="flex items-center justify-between px-2">
                                                    <div className="flex items-center gap-2">
                                                        <div className={cn(
                                                            "w-2 h-2 rounded-full",
                                                            stage === "Offer" ? "bg-emerald-500" :
                                                                stage === "Technical" ? "bg-primary" : "bg-muted-foreground/40"
                                                        )} />
                                                        <h3 className="font-black text-xs uppercase tracking-[0.2em] text-muted-foreground">{stage}</h3>
                                                    </div>
                                                    <Badge variant="outline" className="rounded-lg h-6 px-2 font-black opacity-40">{stageJobs.length}</Badge>
                                                </div>

                                                <div className="space-y-4">
                                                    {stageJobs.map(job => (
                                                        <motion.div key={job.id} layout layoutId={job.id}>
                                                            <Card className="group relative overflow-hidden glass-premium border-border/40 hover:border-primary/40 transition-all duration-300">
                                                                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl -mr-16 -mt-16 group-hover:bg-primary/10 transition-colors" />
                                                                <CardContent className="p-5 space-y-4 relative">
                                                                    <div className="flex justify-between items-start">
                                                                        <div className="space-y-1">
                                                                            <h4 className="font-black text-lg leading-tight group-hover:text-primary transition-colors">{job.company}</h4>
                                                                            <p className="text-xs font-bold text-muted-foreground/80 tracking-tight">{job.role}</p>
                                                                        </div>
                                                                        <DropdownMenu>
                                                                            <DropdownMenuTrigger asChild>
                                                                                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity">
                                                                                    <MoreVertical className="h-4 w-4" />
                                                                                </Button>
                                                                            </DropdownMenuTrigger>
                                                                            <DropdownMenuContent align="end" className="glass-premium rounded-xl border-border/40">
                                                                                <DropdownMenuItem onClick={() => markJobRejected(job.id)} className="text-red-500 focus:text-red-500 font-bold">
                                                                                    Mark Rejected
                                                                                </DropdownMenuItem>
                                                                                <DropdownMenuSeparator />
                                                                                <DropdownMenuItem onClick={() => deleteJob(job.id)} className="text-muted-foreground">
                                                                                    Delete Entry
                                                                                </DropdownMenuItem>
                                                                            </DropdownMenuContent>
                                                                        </DropdownMenu>
                                                                    </div>

                                                                    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">
                                                                        <div className="flex items-center gap-1.5"><MapPin className="h-3 w-3" /> {job.location}</div>
                                                                        <div className="flex items-center gap-1.5"><DollarSign className="h-3 w-3 text-emerald-500" /> {job.salary}</div>
                                                                    </div>

                                                                    <div className="pt-2 flex justify-end">
                                                                        <Button
                                                                            size="sm"
                                                                            variant="secondary"
                                                                            className="h-10 px-4 rounded-xl gap-2 font-black text-[10px] uppercase tracking-widest bg-primary/10 hover:bg-primary/20 text-primary border-none"
                                                                            onClick={() => moveJobStage(job.id, 'next')}
                                                                            disabled={stage === "Offer"}
                                                                        >
                                                                            Advance Stage <ChevronRight className="h-4 w-4" />
                                                                        </Button>
                                                                    </div>
                                                                </CardContent>
                                                            </Card>
                                                        </motion.div>
                                                    ))}
                                                    {stageJobs.length === 0 && (
                                                        <div className="h-32 rounded-[2rem] border-2 border-dashed border-border/20 flex flex-col items-center justify-center text-muted-foreground/30">
                                                            <Circle className="h-6 w-6 opacity-20 mb-2" />
                                                            <span className="text-[10px] font-black uppercase tracking-widest">Available Slot</span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}

                                    {/* Rejected Section */}
                                    <div className="w-[320px] shrink-0 space-y-6 opacity-40 grayscale group hover:grayscale-0 hover:opacity-100 transition-all duration-500">
                                        <div className="flex items-center justify-between px-2">
                                            <h3 className="font-black text-xs uppercase tracking-[0.2em] text-muted-foreground">Shadow Archives</h3>
                                            <Badge variant="outline" className="rounded-lg h-6 px-2 font-black">{jobs.filter(j => j.stage === "Rejected").length}</Badge>
                                        </div>
                                        <div className="space-y-4">
                                            {jobs.filter(j => j.stage === "Rejected").map(job => (
                                                <Card key={job.id} className="glass-premium border-red-500/10">
                                                    <CardContent className="p-4 flex items-center justify-between">
                                                        <div>
                                                            <h4 className="font-bold text-sm text-muted-foreground line-through">{job.company}</h4>
                                                            <p className="text-[10px] uppercase font-black tracking-widest text-muted-foreground/60">{job.role}</p>
                                                        </div>
                                                        <Button variant="ghost" size="icon" onClick={() => deleteJob(job.id)} className="h-8 w-8 hover:bg-red-500/10 hover:text-red-500 rounded-xl">
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </CardContent>
                                                </Card>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </ScrollArea>
                        </TabsContent>

                        <TabsContent value="mastery" className="mt-0">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                {mastery.map((item, i) => (
                                    <Card key={item.topic} className="glass-premium border-border/40 hover:border-primary/20 transition-all duration-500 group">
                                        <CardHeader className="pb-6 relative overflow-hidden">
                                            <div className="absolute top-0 right-0 w-48 h-48 bg-primary/5 rounded-full blur-[80px] -mr-24 -mt-24 group-hover:bg-primary/10 transition-colors" />
                                            <div className="flex items-center justify-between mb-4 relative z-10">
                                                <div className="p-3 bg-primary/10 rounded-2xl">
                                                    <Brain className="h-6 w-6 text-primary" />
                                                </div>
                                                <div className="flex flex-col items-end">
                                                    <span className="text-2xl font-black text-primary tracking-tight">{Math.round(item.progress)}%</span>
                                                    <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">Competency Level</span>
                                                </div>
                                            </div>
                                            <div className="space-y-2 relative z-10">
                                                <CardTitle className="text-xl font-black">{item.topic}</CardTitle>
                                                <Progress value={item.progress} className="h-2.5 bg-muted/40" />
                                            </div>
                                        </CardHeader>
                                        <CardContent className="space-y-6">
                                            <div className="flex flex-wrap gap-2">
                                                {item.subtopics.map(sub => (
                                                    <Badge key={sub} variant="secondary" className="bg-muted px-3 py-1 text-[10px] font-bold uppercase tracking-wider rounded-lg border-none">
                                                        {sub}
                                                    </Badge>
                                                ))}
                                            </div>
                                            <Button
                                                className="w-full h-14 rounded-2xl font-black shadow-lg shadow-primary/5 hover:shadow-primary/10 hover:scale-[1.02] transition-all gap-2"
                                                onClick={() => increaseMastery(i)}
                                                disabled={item.progress >= 100}
                                            >
                                                <CheckCircle2 className="h-5 w-5" /> Log Deep Study Session
                                            </Button>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        </TabsContent>

                        <TabsContent value="resources" className="mt-0">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                                {[
                                    { title: "Behavioral Blueprint", desc: "Master the narrative logic behind every STAR question.", icon: MessageSquare, accent: "text-indigo-400" },
                                    { title: "Infrastructure Atlas", desc: "High-level map of distributed systems and scalability patterns.", icon: Building2, accent: "text-emerald-400" },
                                    { title: "Logical Circuits", desc: "Refined cheat sheet for common algorithm patterns and optimizations.", icon: Code2, accent: "text-rose-400" }
                                ].map((res, i) => (
                                    <Card key={i} className="glass-premium border-border/40 hover:border-primary/40 group cursor-pointer h-full transition-all duration-500">
                                        <CardContent className="p-8 flex flex-col items-center text-center gap-6">
                                            <div className={cn("p-6 rounded-[2rem] bg-muted/40 group-hover:bg-primary/10 transition-colors relative")}>
                                                <res.icon className={cn("h-12 w-12", res.accent)} />
                                                <div className="absolute inset-0 bg-current opacity-10 blur-2xl rounded-full scale-50" />
                                            </div>
                                            <div className="space-y-2">
                                                <h3 className="text-xl font-black tracking-tight">{res.title}</h3>
                                                <p className="text-sm text-muted-foreground/80 leading-relaxed">{res.desc}</p>
                                            </div>
                                            <div className="pt-4 mt-auto">
                                                <Button variant="ghost" className="rounded-xl font-black text-[10px] uppercase tracking-[0.2em] group-hover:text-primary transition-colors">
                                                    Access Archive <ChevronRight className="ml-2 h-4 w-4" />
                                                </Button>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        </TabsContent>
                    </motion.div>
                </AnimatePresence>
            </Tabs>
        </div>
    );
}
