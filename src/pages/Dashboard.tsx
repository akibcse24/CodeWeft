import { useEffect, useState, useMemo } from "react";
import { motion } from "framer-motion";
import {
  FileText,
  CheckSquare,
  Code2,
  Clock,
  ArrowRight,
  Plus,
  Terminal,
  Brush,
  Zap,
  Activity,
  CalendarDays,
  Sparkles,
  Shield,
  Trophy,
  Target,
  ChevronRight,
  TrendingUp,
  Boxes,
  Network,
  Database,
  ArrowUpRight,
  Monitor,
  Fingerprint,
  Trash2
} from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { usePages } from "@/hooks/usePages";
import { useTasks } from "@/hooks/useTasks";
import { useDSAProblems } from "@/hooks/useDSAProblems";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid } from "recharts";
import { useProfile } from "@/hooks/useProfile";
import { VoiceCapture } from "@/components/ai/VoiceCapture";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";
import { Block } from "@/types/editor.types";

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good Morning";
  if (hour < 17) return "Good Afternoon";
  return "Good Evening";
}

export default function Dashboard() {
  const greeting = getGreeting();
  const { user } = useAuth();
  const { pages } = usePages();
  const { tasks } = useTasks();
  const { problems } = useDSAProblems();
  const { createPage, deletePage } = usePages();
  const { profile } = useProfile();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const problemsSolved = problems.filter((p) => p.status === "solved").length;
  const pendingTasks = tasks.filter((t) => t.status !== "completed").length;
  const recentPages = [...pages].sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()).slice(0, 4);

  const activityData = useMemo(() => {
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      return format(d, "MM.dd");
    });

    const neuralMap = new Map();
    const tacticalMap = new Map();
    const logicMap = new Map();

    last7Days.forEach(day => {
      neuralMap.set(day, 0);
      tacticalMap.set(day, 0);
      logicMap.set(day, 0);
    });

    tasks.forEach(t => {
      if (!t.created_at) return;
      const day = format(new Date(t.created_at), "MM.dd");
      if (tacticalMap.has(day)) tacticalMap.set(day, tacticalMap.get(day) + 1);
    });

    pages.forEach(p => {
      const date = p.updated_at || p.created_at;
      if (!date) return;
      const day = format(new Date(date), "MM.dd");
      if (neuralMap.has(day)) neuralMap.set(day, neuralMap.get(day) + 1);
    });

    problems.forEach(p => {
      if (!p.created_at) return;
      const day = format(new Date(p.created_at), "MM.dd");
      if (logicMap.has(day)) logicMap.set(day, logicMap.get(day) + 1);
    });

    return last7Days.map(day => {
      const n = (neuralMap.get(day) || 0) * 10;
      const t = (tacticalMap.get(day) || 0) * 8;
      const l = (logicMap.get(day) || 0) * 15;
      return {
        day,
        neural: n,
        tactical: t,
        logic: l,
        throughput: n + t + l
      };
    });
  }, [tasks, pages, problems]);



  const quickActions = [
    { label: "New Directive", icon: FileText, href: "/notes?new=true", color: "text-blue-400", bg: "bg-blue-500/10", desc: "Commit to neural archive" },
    { label: "Add Objective", icon: CheckSquare, href: "/tasks", color: "text-emerald-400", bg: "bg-emerald-500/10", desc: "Initialize primary goal" },
    { label: "Dev Control", icon: Terminal, href: "/devbox", color: "text-purple-400", bg: "bg-purple-500/10", desc: "Open protocol terminal" },
    { label: "Logic Map", icon: Brush, href: "/whiteboard", color: "text-amber-400", bg: "bg-amber-500/10", desc: "Visualize spatial data" },
  ];

  return (
    <div className="space-y-16 animate-fade-in max-w-[1700px] mx-auto pb-20 p-10 flex flex-col min-h-screen relative">
      {/* Background Atmosphere */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-[50%] h-[50%] bg-primary/5 rounded-full blur-[200px] animate-pulse-slow" />
        <div className="absolute bottom-0 left-0 w-[40%] h-[40%] bg-blue-600/5 rounded-full blur-[180px] animate-pulse" />
        <div className="absolute inset-0 bg-dot-pattern opacity-[0.03]" />
      </div>

      {/* Primary Header Segment */}
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-end gap-12 relative z-10">
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 px-4 py-1.5 bg-primary/10 rounded-full border border-primary/20 backdrop-blur-xl">
              <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse shadow-[0_0_8px_var(--primary)]" />
              <span className="text-[10px] font-black uppercase tracking-[0.3em] text-primary">System Core v4.1.2</span>
            </div>
            <div className="flex items-center gap-2 px-4 py-1.5 bg-emerald-500/5 rounded-full border border-emerald-500/10 backdrop-blur-xl">
              <Activity className="h-3 w-3 text-emerald-500" />
              <span className="text-[10px] font-black uppercase tracking-[0.3em] text-emerald-500/80">Uplink: Synchronized</span>
            </div>
          </div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-2"
          >
            <h1 className="text-8xl font-black tracking-tighter leading-[0.9] bg-clip-text text-transparent bg-gradient-to-br from-foreground via-foreground to-foreground/40">
              {greeting}, <br />
              <span className="text-primary italic px-2">{profile?.username || user?.email?.split('@')[0] || "Operator"}</span>
            </h1>
          </motion.div>
          <div className="flex flex-wrap items-center gap-8 text-muted-foreground font-medium italic opacity-70">
            <p className="flex items-center gap-3">
              <Fingerprint className="h-4 w-4 text-primary" />
              Identity Verified
            </p>
            <div className="h-1 w-1 rounded-full bg-border" />
            <p className="flex items-center gap-3 font-bold text-foreground opacity-100">
              <Monitor className="h-4 w-4 text-primary" />
              {pendingTasks} Actionable Objectives
            </p>
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex items-center gap-8 bg-card/[0.03] backdrop-blur-3xl p-8 rounded-[3rem] border border-white/5 shadow-2xl group transition-all duration-700"
        >
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Clock className="h-3 w-3 text-primary" />
              <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/40">Temporal Cycle</span>
            </div>
            <div className="text-3xl font-black tracking-tighter text-foreground group-hover:text-primary transition-colors">
              {format(new Date(), "HH:mm")} <span className="text-sm text-muted-foreground font-medium uppercase tracking-widest ml-1">{format(new Date(), "a")}</span>
            </div>
            <div className="text-[10px] font-bold text-muted-foreground/60">{format(new Date(), "EEEE, MMM dd")}</div>
          </div>
          <div className="h-12 w-px bg-white/5" />
          <div className="p-4 bg-primary/10 rounded-2xl group-hover:rotate-12 transition-transform duration-500">
            <CalendarDays className="h-8 w-8 text-primary" />
          </div>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16">
        {/* Intelligence Wing */}
        <div className="lg:col-span-8 space-y-12">

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="glass-premium border-white/5 overflow-hidden rounded-[3.5rem] shadow-2xl group/card">
              <div className="absolute inset-0 bg-dot-pattern opacity-[0.03] pointer-events-none" />
              <div className="absolute -right-40 -top-40 h-[500px] w-[500px] bg-primary/5 rounded-full blur-[150px] group-hover/card:bg-primary/10 transition-all duration-1000" />

              <CardHeader className="relative p-12 pb-0 flex flex-row items-center justify-between">
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-primary/10 rounded-xl">
                      <TrendingUp className="h-5 w-5 text-primary" />
                    </div>
                    <CardTitle className="text-2xl font-black uppercase tracking-tight">Cognitive Throughput</CardTitle>
                  </div>
                  <CardDescription className="text-lg font-medium opacity-60">Real-time performance metrics in decimal cycles</CardDescription>
                </div>
                <div className="flex items-center gap-4 bg-emerald-500/10 text-emerald-500 px-6 py-3 rounded-2xl border border-emerald-500/20 shadow-xl shadow-emerald-500/5">
                  <Zap className="h-4 w-4 fill-emerald-500" />
                  <span className="text-xs font-black uppercase tracking-widest">Gain Optimized</span>
                </div>
              </CardHeader>

              <CardContent className="h-[420px] p-12 pt-16 relative">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,hsla(var(--primary)/0.1),transparent)] pointer-events-none" />
                {isClient && (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={activityData} margin={{ top: 20, right: 30, left: 0, bottom: 0 }} barCategoryGap="20%" barGap={2}>
                      <defs>
                        <linearGradient id="neuralBarGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#60a5fa" stopOpacity={0.95} />
                          <stop offset="100%" stopColor="#3b82f6" stopOpacity={0.4} />
                        </linearGradient>
                        <linearGradient id="tacticalBarGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#34d399" stopOpacity={0.95} />
                          <stop offset="100%" stopColor="#10b981" stopOpacity={0.4} />
                        </linearGradient>
                        <linearGradient id="logicBarGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#a78bfa" stopOpacity={0.95} />
                          <stop offset="100%" stopColor="#8b5cf6" stopOpacity={0.4} />
                        </linearGradient>
                        <filter id="barGlow">
                          <feGaussianBlur stdDeviation="3" result="coloredBlur" />
                          <feMerge>
                            <feMergeNode in="coloredBlur" />
                            <feMergeNode in="SourceGraphic" />
                          </feMerge>
                        </filter>
                      </defs>
                      <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="rgba(255,255,255,0.04)" />
                      <XAxis
                        dataKey="day"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: 'rgba(255,255,255,0.25)', fontSize: 11, fontWeight: 900, letterSpacing: '0.05em' }}
                        dy={15}
                      />
                      <YAxis
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: 'rgba(255,255,255,0.15)', fontSize: 10, fontWeight: 700 }}
                        width={35}
                      />
                      <Tooltip
                        cursor={{ fill: 'rgba(255,255,255,0.03)', radius: 12 }}
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            const data = payload[0].payload;
                            return (
                              <div className="bg-background/60 backdrop-blur-3xl p-6 border border-white/10 rounded-2xl shadow-2xl space-y-3 min-w-[220px]">
                                <div className="flex justify-between items-center mb-1">
                                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">Neural Synchrony</span>
                                  <span className="text-[10px] font-bold opacity-30">{data.day}</span>
                                </div>

                                <div className="space-y-2.5">
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                      <div className="w-2.5 h-2.5 rounded-sm bg-gradient-to-b from-blue-400 to-blue-600 shadow-[0_0_8px_#3b82f6]" />
                                      <span className="text-xs font-bold opacity-60">Neural Archives</span>
                                    </div>
                                    <span className="text-xs font-black tracking-tight">{data.neural}</span>
                                  </div>
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                      <div className="w-2.5 h-2.5 rounded-sm bg-gradient-to-b from-emerald-400 to-emerald-600 shadow-[0_0_8px_#10b981]" />
                                      <span className="text-xs font-bold opacity-60">Tactical Directives</span>
                                    </div>
                                    <span className="text-xs font-black tracking-tight">{data.tactical}</span>
                                  </div>
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                      <div className="w-2.5 h-2.5 rounded-sm bg-gradient-to-b from-purple-400 to-purple-600 shadow-[0_0_8px_#8b5cf6]" />
                                      <span className="text-xs font-bold opacity-60">Logic Solutions</span>
                                    </div>
                                    <span className="text-xs font-black tracking-tight">{data.logic}</span>
                                  </div>
                                </div>

                                <div className="pt-3 border-t border-white/5 flex items-center justify-between">
                                  <span className="text-sm font-black uppercase tracking-widest text-foreground">Total Load</span>
                                  <div className="flex items-baseline gap-1">
                                    <span className="text-2xl font-black tracking-tighter text-primary">{data.throughput}</span>
                                    <span className="text-[9px] font-bold opacity-20 text-primary">cycles</span>
                                  </div>
                                </div>
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                      <Bar
                        dataKey="neural"
                        stackId="throughput"
                        fill="url(#neuralBarGrad)"
                        radius={[0, 0, 0, 0]}
                        animationDuration={1200}
                        animationBegin={0}
                        style={{ filter: 'url(#barGlow)' }}
                      />
                      <Bar
                        dataKey="tactical"
                        stackId="throughput"
                        fill="url(#tacticalBarGrad)"
                        radius={[0, 0, 0, 0]}
                        animationDuration={1200}
                        animationBegin={200}
                        style={{ filter: 'url(#barGlow)' }}
                      />
                      <Bar
                        dataKey="logic"
                        stackId="throughput"
                        fill="url(#logicBarGrad)"
                        radius={[6, 6, 0, 0]}
                        animationDuration={1200}
                        animationBegin={400}
                        style={{ filter: 'url(#barGlow)' }}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Quick Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            <motion.div initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }}>
              <div className="group cursor-pointer relative">
                <div className="absolute inset-0 bg-blue-500/5 blur-[100px] opacity-0 group-hover:opacity-100 transition-opacity" />
                <Card className="glass-premium border-blue-500/10 rounded-[3rem] shadow-xl hover:border-blue-500/30 transition-all duration-700 overflow-hidden">
                  <CardContent className="p-10 flex items-center gap-10">
                    <div className="w-24 h-24 rounded-[2.5rem] bg-blue-500/5 flex items-center justify-center text-blue-400 border border-blue-500/10 group-hover:scale-110 group-hover:bg-blue-500 group-hover:text-white transition-all duration-700 shadow-2xl">
                      <Target className="h-10 w-10" />
                    </div>
                    <div className="space-y-1">
                      <span className="text-[11px] font-black uppercase tracking-[0.3em] text-muted-foreground/40 block">Objectives Buffer</span>
                      <span className="text-6xl font-black tracking-tighter leading-none">{pendingTasks}</span>
                    </div>
                    <div className="ml-auto p-4 rounded-2xl opacity-20 group-hover:opacity-100 group-hover:translate-x-1 transition-all">
                      <ArrowUpRight className="h-6 w-6 text-blue-400" />
                    </div>
                  </CardContent>
                </Card>
              </div>
            </motion.div>

            <motion.div initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.4 }}>
              <div className="group cursor-pointer relative">
                <div className="absolute inset-0 bg-emerald-500/5 blur-[100px] opacity-0 group-hover:opacity-100 transition-opacity" />
                <Card className="glass-premium border-emerald-500/10 rounded-[3rem] shadow-xl hover:border-emerald-500/30 transition-all duration-700 overflow-hidden">
                  <CardContent className="p-10 flex items-center gap-10">
                    <div className="w-24 h-24 rounded-[2.5rem] bg-emerald-500/5 flex items-center justify-center text-emerald-400 border border-emerald-500/10 group-hover:scale-110 group-hover:bg-emerald-500 group-hover:text-white transition-all duration-700 shadow-2xl">
                      <Trophy className="h-10 w-10" />
                    </div>
                    <div className="space-y-1">
                      <span className="text-[11px] font-black uppercase tracking-[0.3em] text-muted-foreground/40 block">Neural Milestones</span>
                      <span className="text-6xl font-black tracking-tighter leading-none">{problemsSolved}</span>
                    </div>
                    <div className="ml-auto p-4 rounded-2xl opacity-20 group-hover:opacity-100 group-hover:translate-x-1 transition-all">
                      <ArrowUpRight className="h-6 w-6 text-emerald-400" />
                    </div>
                  </CardContent>
                </Card>
              </div>
            </motion.div>
          </div>

          {/* Neural Archive Grid */}
          <div className="space-y-8">
            <div className="flex items-center justify-between px-6">
              <div className="flex items-center gap-4">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Boxes className="h-5 w-5 text-primary" />
                </div>
                <h3 className="text-2xl font-black uppercase tracking-tight">Recent Archives</h3>
              </div>
              <Button variant="ghost" className="h-12 px-8 rounded-2xl hover:bg-primary/5 text-primary font-black uppercase tracking-widest text-[10px] gap-3" asChild>
                <Link to="/notes">
                  Search Vectors
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {recentPages.length > 0 ? recentPages.map((page, idx) => (
                <motion.div
                  key={page.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  whileHover={{ y: -5 }}
                  transition={{ delay: 0.5 + idx * 0.1 }}
                >
                  <Link
                    to={`/notes?id=${page.id}`}
                    className="flex flex-col gap-6 p-10 rounded-[3rem] border border-white/5 bg-card/[0.02] hover:bg-accent/[0.04] hover:border-primary/20 transition-all group relative overflow-hidden backdrop-blur-3xl shadow-xl hover:shadow-primary/5"
                  >
                    <div className="absolute top-0 right-0 p-8 opacity-[0.02] group-hover:opacity-[0.06] scale-[2.5] rotate-[20deg] transition-all duration-1000">
                      <FileText className="h-20 w-20" />
                    </div>
                    <div className="flex items-center gap-6 relative z-10">
                      <div className="w-20 h-20 rounded-[1.5rem] bg-primary/5 flex items-center justify-center text-4xl shadow-inner group-hover:scale-110 transition-transform duration-500 border border-white/5">
                        {page.icon || "📄"}
                      </div>
                      <div className="flex-1 min-w-0 space-y-2">
                        <span className="font-black text-xl truncate block leading-none tracking-tight">{page.title || "Unknown Cluster"}</span>
                        <div className="flex items-center gap-2 text-muted-foreground/40 font-bold uppercase tracking-[0.2em] text-[9px]">
                          <Clock className="h-3 w-3" />
                          {format(new Date(page.updated_at), "dd.MM.yy — HH:mm")}
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground/20 hover:text-destructive hover:bg-destructive/10 transition-colors z-20"
                        onClick={async (e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          if (confirm("Move this page to trash?")) {
                            await deletePage.mutateAsync(page.id);
                            toast({ title: "Page moved to trash" });
                          }
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </Link>
                </motion.div>
              )) : (
                <div className="col-span-2 flex flex-col items-center justify-center py-24 text-muted-foreground/20 border-2 border-dashed border-border/20 rounded-[4rem] bg-card/[0.01]">
                  <Database className="h-20 w-20 mb-6 opacity-5 animate-pulse" />
                  <p className="text-xs font-black uppercase tracking-[0.5em]">Central Database Empty</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Tactical Support Wing */}
        <div className="lg:col-span-4 space-y-12">
          <Card className="glass-premium border-white/5 rounded-[4rem] overflow-hidden shadow-[0_50px_100px_-20px_rgba(0,0,0,0.5)] bg-card/[0.02] relative group/launch">
            <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover/launch:opacity-100 transition-opacity duration-1000 blur-[100px] pointer-events-none" />
            <CardHeader className="p-12 pb-6">
              <div className="flex items-center gap-3 text-primary mb-3">
                <Sparkles className="h-5 w-5 fill-primary animate-pulse" />
                <span className="text-[11px] font-black uppercase tracking-[0.4em]">Fast Protocol</span>
              </div>
              <CardTitle className="text-4xl font-black tracking-tighter">Tactical Launchpad</CardTitle>
            </CardHeader>
            <CardContent className="p-8 pt-0 space-y-4">
              {quickActions.map((action, idx) => (
                <motion.div
                  key={action.label}
                  initial={{ opacity: 0, x: 40 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.6 + idx * 0.1 }}
                >
                  <Link
                    to={action.href}
                    className="flex items-center gap-6 p-6 rounded-[2.5rem] hover:bg-white/[0.03] transition-all group border border-transparent hover:border-white/5 active:scale-95 duration-500"
                  >
                    <div className={cn(
                      "w-16 h-16 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-all duration-700 shadow-2xl ring-1 ring-white/5",
                      action.bg, action.color
                    )}>
                      <action.icon className="h-8 w-8" />
                    </div>
                    <div className="flex-1 space-y-1">
                      <span className="font-black text-lg block tracking-tight group-hover:text-primary transition-colors">{action.label}</span>
                      <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/30 italic">{action.desc}</span>
                    </div>
                    <ArrowRight className="h-5 w-5 text-muted-foreground/10 group-hover:text-primary group-hover:translate-x-2 transition-all duration-500" />
                  </Link>
                </motion.div>
              ))}
            </CardContent>
          </Card>


        </div>
      </div>

      {/* Quick Global Capture */}
      <div className="fixed bottom-12 right-12 z-50 flex flex-col items-end gap-6">
        <div className="flex flex-col items-end">
          <span className="text-[10px] font-black uppercase tracking-[0.5em] text-primary mb-3 bg-primary/5 px-4 py-1.5 rounded-full border border-primary/20 backdrop-blur-3xl shadow-2xl">Neural Capture</span>
          <VoiceCapture onTranscription={async (text) => {
            const result = await createPage.mutateAsync({
              title: `Neural Clip: ${format(new Date(), "MMM d, HH:mm")}`,
              icon: "🎙️",
              content: [
                { id: "1", type: "paragraph", content: text }
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
              ] as any
            });
            toast({
              title: "Neural uplink successful",
              description: "Transcription archived in Knowledge Base.",
              action: (
                <Button variant="outline" size="sm" onClick={() => navigate(`/notes?id=${result.id}`)}>
                  Open Note
                </Button>
              )
            });
          }} />
        </div>
      </div>
    </div>
  );
}
