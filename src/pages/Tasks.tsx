import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  CheckSquare,
  Search,
  Calendar,
  Loader2,
  Trash2,
  Edit,
  Flag,
  Target,
  Rocket,
  Layers,
  ChevronRight,
  Filter,
  MoreVertical,
  Clock,
  Zap,
  LayoutGrid,
  List
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useTasks, Task } from "@/hooks/useTasks";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { format, isToday, isPast } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { EmptyState, EmptyTasksIcon } from "@/components/shared/EmptyState";
import { SkeletonList } from "@/components/ui/skeleton";

const priorityColors = {
  urgent: "bg-red-500/10 text-red-500 border-red-500/20 shadow-red-500/10",
  high: "bg-orange-500/10 text-orange-500 border-orange-500/20 shadow-orange-500/10",
  medium: "bg-blue-500/10 text-blue-500 border-blue-500/20 shadow-blue-500/10",
  low: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20 shadow-emerald-500/10",
};

interface TaskItemProps {
  task: Task;
  handleToggleComplete: (task: Task) => void;
  setEditingTask: (task: Task) => void;
  handleDeleteTask: (id: string) => void;
}

const TaskItem = ({ task, handleToggleComplete, setEditingTask, handleDeleteTask }: TaskItemProps) => (
  <motion.div
    layout
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, scale: 0.95 }}
    className={cn(
      "flex items-start gap-5 p-6 rounded-[2rem] border border-border/30 bg-card/40 backdrop-blur-xl transition-all group hover:bg-muted/30 hover:shadow-2xl hover:border-primary/20",
      task.status === "completed" && "opacity-40 grayscale-[0.5]"
    )}
  >
    <div className="pt-1 select-none">
      <Checkbox
        checked={task.status === "completed"}
        onCheckedChange={() => handleToggleComplete(task)}
        className="h-6 w-6 rounded-lg border-primary/20 data-[state=checked]:bg-primary data-[state=checked]:border-primary transition-all shadow-inner"
      />
    </div>
    <div className="flex-1 min-w-0 space-y-3">
      <div className="flex items-center gap-3 flex-wrap">
        <span className={cn(
          "font-black text-xl tracking-tighter leading-none",
          task.status === "completed" && "line-through text-muted-foreground"
        )}>
          {task.title}
        </span>
        {task.priority && (
          <Badge variant="outline" className={cn(
            "text-[9px] px-2 py-0.5 border-2 uppercase tracking-widest font-black shadow-lg",
            priorityColors[task.priority as keyof typeof priorityColors]
          )}>
            {task.priority}
          </Badge>
        )}
      </div>
      {task.description && (
        <p className="text-sm text-muted-foreground/80 line-clamp-2 leading-relaxed font-bold tracking-tight">
          {task.description}
        </p>
      )}
      <div className="flex items-center gap-5">
        {task.due_date && (
          <div className={cn(
            "flex items-center gap-2 text-[10px] font-black uppercase tracking-widest px-4 py-1.5 rounded-full border shadow-sm",
            isPast(new Date(task.due_date)) && !isToday(new Date(task.due_date))
              ? "bg-red-500/10 text-red-500 border-red-500/20"
              : "bg-muted/50 text-muted-foreground border-border/40"
          )}>
            <Clock className="h-3 w-3" />
            {format(new Date(task.due_date), "MMM d")}
          </div>
        )}
        {task.category && (
          <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest px-4 py-1.5 rounded-full bg-primary/10 text-primary border border-primary/20 shadow-sm">
            <Layers className="h-3 w-3" />
            {task.category}
          </div>
        )}
      </div>
    </div>
    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-all scale-90 group-hover:scale-100">
      <Button variant="ghost" size="icon" onClick={() => setEditingTask(task)} className="h-10 w-10 rounded-2xl hover:bg-primary/10 hover:text-primary transition-all">
        <Edit className="h-4 w-4" />
      </Button>
      <Button variant="ghost" size="icon" onClick={() => handleDeleteTask(task.id)} className="h-10 w-10 rounded-2xl hover:bg-destructive/10 hover:text-destructive transition-all">
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  </motion.div>
);

export default function Tasks() {
  const { tasks, isLoading, createTask, updateTask, deleteTask } = useTasks();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [viewMode, setViewMode] = useState<"list" | "kanban">("list");
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [newTask, setNewTask] = useState({
    title: "",
    description: "",
    priority: "medium",
    due_date: "",
    category: "",
  });

  const handleCreateTask = async () => {
    if (!newTask.title.trim()) {
      toast({ title: "Objective Title Required", variant: "destructive" });
      return;
    }
    await createTask.mutateAsync({
      title: newTask.title,
      description: newTask.description || null,
      priority: newTask.priority,
      due_date: newTask.due_date ? new Date(newTask.due_date).toISOString() : null,
      category: newTask.category || null,
    });
    setNewTask({ title: "", description: "", priority: "medium", due_date: "", category: "" });
    setIsDialogOpen(false);
    toast({ title: "Task Initialized", description: "Primary directive established." });
  };

  const handleToggleComplete = async (task: Task) => {
    await updateTask.mutateAsync({
      id: task.id,
      status: task.status === "completed" ? "todo" : "completed",
      completed_at: task.status === "completed" ? null : new Date().toISOString(),
    });
  };

  const handleUpdateTask = async () => {
    if (!editingTask || !editingTask.title.trim()) return;
    await updateTask.mutateAsync({
      id: editingTask.id,
      title: editingTask.title,
      description: editingTask.description,
      priority: editingTask.priority,
      due_date: editingTask.due_date,
      category: editingTask.category,
    });
    setEditingTask(null);
    toast({ title: "Objective Updated" });
  };

  const handleDeleteTask = async (id: string) => {
    await deleteTask.mutateAsync(id);
    toast({ title: "Objective Terminated" });
  };

  const filteredTasks = tasks.filter(task =>
    task.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const todoTasks = filteredTasks.filter(t => t.status !== "completed");
  const completedTasks = filteredTasks.filter(t => t.status === "completed");
  const todayTasks = filteredTasks.filter(t => t.due_date && isToday(new Date(t.due_date)));
  const overdueTasks = filteredTasks.filter(t =>
    t.status !== "completed" && t.due_date && isPast(new Date(t.due_date)) && !isToday(new Date(t.due_date))
  );

  if (isLoading) {
    return (
      <div className="space-y-12 animate-slide-up max-w-[1400px] mx-auto p-6">
        <div className="space-y-6">
          <div className="h-12 w-48 bg-muted/40 rounded-2xl animate-pulse" />
          <div className="h-6 w-96 bg-muted/20 rounded-xl animate-pulse" />
        </div>
        <div className="grid gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-32 w-full bg-muted/10 rounded-[2rem] animate-pulse border border-border/20" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-12 animate-fade-in max-w-[1400px] mx-auto pb-20 p-6 flex flex-col min-h-screen">
      <div className="relative">
        <div className="absolute -left-32 -top-32 w-96 h-96 bg-primary/5 rounded-full blur-[120px] pointer-events-none" />
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-10 relative z-10">
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-primary">
              <Target className="h-5 w-5" />
              <span className="text-xs font-black uppercase tracking-[0.3em]">Operational Objectives</span>
            </div>
            <h1 className="text-7xl font-black tracking-tighter bg-clip-text text-transparent bg-gradient-to-br from-foreground to-foreground/30 leading-tight">
              Tasks
            </h1>
            <p className="text-muted-foreground text-xl max-w-xl font-medium leading-relaxed italic">
              "Efficiency is doing things right; effectiveness is doing the right things."
            </p>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex p-2 bg-muted/20 backdrop-blur-3xl rounded-[1.5rem] border border-border/40 shadow-2xl">
              <Button
                variant={viewMode === 'list' ? 'secondary' : 'ghost'}
                size="sm"
                className="rounded-xl h-10 px-5 gap-2 font-black uppercase tracking-widest text-[9px]"
                onClick={() => setViewMode('list')}
              >
                <List className="h-3 w-3" /> List
              </Button>
              <Button
                variant={viewMode === 'kanban' ? 'secondary' : 'ghost'}
                size="sm"
                className="rounded-xl h-10 px-5 gap-2 font-black uppercase tracking-widest text-[9px]"
                onClick={() => setViewMode('kanban')}
              >
                <LayoutGrid className="h-3 w-3" /> Kanban
              </Button>
            </div>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button size="lg" className="h-14 px-8 rounded-[2rem] shadow-2xl shadow-primary/20 hover:shadow-primary/40 hover:-translate-y-1 transition-all group font-black uppercase tracking-widest text-xs">
                  <Rocket className="mr-3 h-5 w-5 group-hover:animate-float" /> Initiate Protocol
                </Button>
              </DialogTrigger>
              <DialogContent className="glass-premium border-primary/20 max-w-xl rounded-[3rem] p-4">
                <div className="p-8 space-y-8">
                  <DialogHeader>
                    <DialogTitle className="text-4xl font-black tracking-tighter uppercase italic">New Objective</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-6">
                    <div className="space-y-3">
                      <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 ml-2">Objective Title</Label>
                      <Input
                        placeholder="Define sequence..."
                        className="h-16 bg-muted/20 border-border/40 rounded-2xl px-6 font-black text-xl placeholder:italic focus-visible:ring-primary/20"
                        value={newTask.title}
                        onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                      />
                    </div>
                    <div className="space-y-3">
                      <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 ml-2">Data Parameters</Label>
                      <Textarea
                        placeholder="Establish context and operational bounds..."
                        className="bg-muted/20 border-border/40 rounded-[2rem] p-6 focus-visible:ring-primary/20 min-h-[120px] font-bold text-base leading-relaxed"
                        value={newTask.description}
                        onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-6">
                      <div className="space-y-3">
                        <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 ml-2">Priority Tier</Label>
                        <Select value={newTask.priority} onValueChange={(v) => setNewTask({ ...newTask, priority: v })}>
                          <SelectTrigger className="h-14 bg-muted/20 border-border/40 rounded-2xl px-6 font-black uppercase tracking-widest text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="glass-premium border-primary/10 rounded-2xl overflow-hidden p-1 shadow-2xl">
                            <SelectItem value="low" className="rounded-xl font-black uppercase tracking-widest text-[10px]">Tier 4 - Routine</SelectItem>
                            <SelectItem value="medium" className="rounded-xl font-black uppercase tracking-widest text-[10px]">Tier 3 - Standard</SelectItem>
                            <SelectItem value="high" className="rounded-xl font-black uppercase tracking-widest text-[10px]">Tier 2 - Critical</SelectItem>
                            <SelectItem value="urgent" className="rounded-xl font-black uppercase tracking-widest text-[10px]">Tier 1 - ABSOLUTE</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-3">
                        <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 ml-2">Temporal Limit</Label>
                        <Input
                          type="date"
                          className="h-14 bg-muted/20 border-border/40 rounded-2xl px-6 font-black text-sm"
                          value={newTask.due_date}
                          onChange={(e) => setNewTask({ ...newTask, due_date: e.target.value })}
                        />
                      </div>
                    </div>
                  </div>
                  <DialogFooter className="gap-4 pt-4">
                    <Button variant="ghost" onClick={() => setIsDialogOpen(false)} className="rounded-2xl h-14 px-8 font-black uppercase tracking-widest text-[10px]">Abort</Button>
                    <Button onClick={handleCreateTask} disabled={createTask.isPending} size="lg" className="rounded-[2rem] h-14 px-10 shadow-xl shadow-primary/20 font-black uppercase tracking-widest text-[10px]">
                      {createTask.isPending ? <Loader2 className="h-5 w-5 animate-spin mr-3" /> : <Zap className="h-5 w-5 mr-3 fill-primary-foreground" />}
                      Sync Objective
                    </Button>
                  </DialogFooter>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-8 items-start sticky top-[100px] z-50">
        <div className="relative group flex-1 w-full scale-100 focus-within:scale-[1.01] transition-all">
          <Search className="absolute left-6 top-1/2 h-6 w-6 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-all duration-500" />
          <Input
            placeholder="Search through localized objectives..."
            className="pl-16 h-20 bg-card/60 backdrop-blur-3xl border-border/20 rounded-[2.5rem] focus-visible:ring-primary/20 text-xl font-bold shadow-2xl border shadow-black/5"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <div className="absolute right-4 top-1/2 -translate-y-1/2">
            <div className="flex items-center gap-2 bg-muted/40 p-1.5 rounded-full border border-border/20 px-4">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/80">Active Scan</span>
            </div>
          </div>
        </div>
      </div>

      <div className="lg:col-span-12 space-y-12">
        {overdueTasks.length > 0 && (
          <motion.section
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="p-1.5 rounded-[3rem] bg-gradient-to-br from-red-500/20 via-red-500/5 to-transparent border border-red-500/20 shadow-2xl shadow-red-500/5 relative overflow-hidden"
          >
            <div className="p-8 space-y-6">
              <div className="absolute -right-10 -top-10 p-4 opacity-[0.03] pointer-events-none rotate-12">
                <Flag className="h-64 w-64 text-red-500" />
              </div>
              <div className="flex items-center justify-between">
                <h3 className="text-[11px] font-black text-red-500 flex items-center gap-3 tracking-[0.3em] uppercase">
                  <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse shadow-[0_0_10px_rgba(239,68,68,0.5)]" />
                  Terminal Delinquency ({overdueTasks.length})
                </h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <AnimatePresence mode="popLayout">
                  {overdueTasks.map(task => (
                    <TaskItem
                      key={task.id}
                      task={task}
                      handleToggleComplete={handleToggleComplete}
                      setEditingTask={setEditingTask}
                      handleDeleteTask={handleDeleteTask}
                    />
                  ))}
                </AnimatePresence>
              </div>
            </div>
          </motion.section>
        )}

        {viewMode === "list" ? (
          <Tabs defaultValue="all" className="w-full space-y-8">
            <div className="flex items-center justify-between">
              <TabsList className="bg-muted/10 backdrop-blur-3xl p-1.5 rounded-[2.5rem] border border-border/20 h-16 gap-2 px-3 shadow-xl">
                <TabsTrigger value="all" className="rounded-[2rem] px-10 h-12 font-black uppercase tracking-widest text-[10px] data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-2xl transition-all">
                  Registry <Badge variant="secondary" className="ml-3 h-5 min-w-[20px] px-1.5 font-black text-[9px] bg-white/10 text-white border-white/20">{todoTasks.length}</Badge>
                </TabsTrigger>
                <TabsTrigger value="today" className="rounded-[2rem] px-10 h-12 font-black uppercase tracking-widest text-[10px] data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-2xl transition-all">
                  Current Cycle <Badge variant="secondary" className="ml-3 h-5 min-w-[20px] px-1.5 font-black text-[9px] bg-white/10 text-white border-white/20">{todayTasks.length}</Badge>
                </TabsTrigger>
                <TabsTrigger value="completed" className="rounded-[2rem] px-10 h-12 font-black uppercase tracking-widest text-[10px] data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-2xl transition-all">
                  Archived <Badge variant="secondary" className="ml-3 h-5 min-w-[20px] px-1.5 font-black text-[9px] bg-white/10 text-white border-white/20">{completedTasks.length}</Badge>
                </TabsTrigger>
              </TabsList>
            </div>

            <AnimatePresence mode="wait">
              <TabsContent value="all" className="mt-0 outline-none">
                {todoTasks.length === 0 ? (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="py-32 rounded-[3.5rem] border-4 border-dashed border-border/20 bg-muted/5 flex flex-col items-center justify-center text-center group">
                    <div className="w-24 h-24 rounded-full bg-primary/5 flex items-center justify-center mb-10 group-hover:scale-110 transition-transform duration-700 shadow-2xl">
                      <EmptyTasksIcon className="w-10 h-10 text-primary/40" />
                    </div>
                    <h3 className="text-3xl font-black tracking-tighter uppercase italic mb-4">Registry Clear</h3>
                    <p className="text-muted-foreground max-w-sm font-bold text-lg mb-10 opacity-60">No pending directives identified in system memory.</p>
                    <Button onClick={() => setIsDialogOpen(true)} size="lg" className="rounded-[1.5rem] h-14 px-10 shadow-2xl font-black uppercase tracking-widest text-[10px]">
                      Initialize First Objective
                    </Button>
                  </motion.div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <AnimatePresence mode="popLayout">
                      {todoTasks.map(task => (
                        <TaskItem
                          key={task.id}
                          task={task}
                          handleToggleComplete={handleToggleComplete}
                          setEditingTask={setEditingTask}
                          handleDeleteTask={handleDeleteTask}
                        />
                      ))}
                    </AnimatePresence>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="today" className="mt-0 outline-none">
                {todayTasks.length === 0 ? (
                  <div className="py-32 rounded-[3.5rem] border-2 border-dashed border-border/20 bg-muted/5 flex flex-col items-center justify-center text-center">
                    <Calendar className="w-16 h-16 text-primary/10 mb-8" />
                    <h3 className="text-2xl font-black uppercase tracking-widest opacity-20">Cycle Inactive</h3>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <AnimatePresence mode="popLayout">
                      {todayTasks.map(task => (
                        <TaskItem
                          key={task.id}
                          task={task}
                          handleToggleComplete={handleToggleComplete}
                          setEditingTask={setEditingTask}
                          handleDeleteTask={handleDeleteTask}
                        />
                      ))}
                    </AnimatePresence>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="completed" className="mt-0 outline-none">
                {completedTasks.length === 0 ? (
                  <div className="py-32 rounded-[3.5rem] border-2 border-dashed border-border/20 bg-muted/5 flex flex-col items-center justify-center text-center">
                    <CheckSquare className="w-16 h-16 text-primary/10 mb-8" />
                    <h3 className="text-2xl font-black uppercase tracking-widest opacity-20">Archives Empty</h3>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <AnimatePresence mode="popLayout">
                      {completedTasks.map(task => (
                        <TaskItem
                          key={task.id}
                          task={task}
                          handleToggleComplete={handleToggleComplete}
                          setEditingTask={setEditingTask}
                          handleDeleteTask={handleDeleteTask}
                        />
                      ))}
                    </AnimatePresence>
                  </div>
                )}
              </TabsContent>
            </AnimatePresence>
          </Tabs>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10 lg:gap-14">
            {[
              { title: "Active Sequence", tasks: todoTasks.filter(t => t.priority !== 'urgent' && t.priority !== 'high'), color: "border-blue-500/20" },
              { title: "Priority Cluster", tasks: todoTasks.filter(t => t.priority === 'urgent' || t.priority === 'high'), color: "border-orange-500/20" },
              { title: "Sync Accomplished", tasks: completedTasks, color: "border-emerald-500/20" }
            ].map((column, i) => (
              <div key={i} className="space-y-8 flex flex-col h-full">
                <div className="flex items-center justify-between px-6 bg-muted/10 backdrop-blur-3xl rounded-[2rem] border border-border/20 h-16 shadow-lg">
                  <h3 className="text-[10px] font-black uppercase tracking-[.25em] text-muted-foreground/60">{column.title}</h3>
                  <Badge className="rounded-xl font-black bg-primary/20 text-primary border-primary/20 px-3">{column.tasks.length}</Badge>
                </div>
                <div className={cn("flex-1 space-y-6 min-h-[500px] p-4 rounded-[2.5rem] bg-muted/5 border-2 border-dashed transition-all duration-700", column.color)}>
                  <AnimatePresence mode="popLayout">
                    {column.tasks.map(task => (
                      <motion.div key={task.id} layout layoutId={task.id}>
                        <Card
                          className="p-6 rounded-[2rem] glass-premium border-border/40 hover:border-primary/40 shadow-xl transition-all cursor-pointer group active:scale-[0.98]"
                          onClick={() => handleToggleComplete(task)}
                        >
                          <div className="flex items-start gap-4 mb-4">
                            <Checkbox checked={task.status === 'completed'} className="mt-1 h-5 w-5 rounded-lg shrink-0 pointer-events-none" />
                            <h4 className={cn("font-black text-lg tracking-tight leading-tight", task.status === 'completed' && "line-through text-muted-foreground")}>{task.title}</h4>
                          </div>
                          <div className="flex items-center justify-between mt-auto">
                            <Badge variant="outline" className={cn("text-[9px] font-black uppercase tracking-widest px-2.5 py-0.5 shadow-sm", priorityColors[task.priority as keyof typeof priorityColors])}>
                              {task.priority}
                            </Badge>
                            {task.due_date && (
                              <div className="flex items-center gap-1.5 text-[10px] font-black text-muted-foreground/60 uppercase tracking-widest">
                                <Calendar className="h-3 w-3" />
                                {format(new Date(task.due_date), "MMM d")}
                              </div>
                            )}
                          </div>
                        </Card>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Dialog open={!!editingTask} onOpenChange={(open) => !open && setEditingTask(null)}>
        <DialogContent className="glass-premium border-primary/20 max-w-xl rounded-[3rem] p-4">
          {editingTask && (
            <div className="p-8 space-y-8">
              <DialogHeader>
                <DialogTitle className="text-4xl font-black tracking-tighter uppercase italic">Redefine Objective</DialogTitle>
              </DialogHeader>
              <div className="space-y-6">
                <div className="space-y-3">
                  <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 ml-2">Objective Title</Label>
                  <Input
                    placeholder="Update title..."
                    className="h-16 bg-muted/20 border-border/40 rounded-2xl px-6 font-black text-xl focus-visible:ring-primary/20"
                    value={editingTask.title}
                    onChange={(e) => setEditingTask({ ...editingTask, title: e.target.value })}
                  />
                </div>
                <div className="space-y-3">
                  <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 ml-2">Data Parameters</Label>
                  <Textarea
                    placeholder="Update context..."
                    className="bg-muted/20 border-border/40 rounded-[2rem] p-6 focus-visible:ring-primary/20 min-h-[120px] font-bold text-base"
                    value={editingTask.description || ""}
                    onChange={(e) => setEditingTask({ ...editingTask, description: e.target.value })}
                  />
                </div>
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 ml-2">Priority Tier</Label>
                    <Select value={editingTask.priority || "medium"} onValueChange={(v) => setEditingTask({ ...editingTask, priority: v })}>
                      <SelectTrigger className="h-14 bg-muted/20 border-border/40 rounded-2xl px-6 font-black uppercase tracking-widest text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="glass-premium border-primary/10 rounded-2xl p-1">
                        <SelectItem value="low">Tier 4 - Routine</SelectItem>
                        <SelectItem value="medium">Tier 3 - Standard</SelectItem>
                        <SelectItem value="high">Tier 2 - Critical</SelectItem>
                        <SelectItem value="urgent">Tier 1 - ABSOLUTE</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-3">
                    <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 ml-2">Temporal Limit</Label>
                    <Input
                      type="date"
                      className="h-14 bg-muted/20 border-border/40 rounded-2xl px-6 font-black text-sm"
                      value={editingTask.due_date ? format(new Date(editingTask.due_date), "yyyy-MM-dd") : ""}
                      onChange={(e) => setEditingTask({ ...editingTask, due_date: e.target.value ? new Date(e.target.value).toISOString() : null })}
                    />
                  </div>
                </div>
              </div>
              <DialogFooter className="gap-4 pt-4">
                <Button variant="ghost" onClick={() => setEditingTask(null)} className="rounded-2xl h-14 px-8 font-black uppercase tracking-widest text-[10px]">Abort</Button>
                <Button onClick={handleUpdateTask} disabled={updateTask.isPending} size="lg" className="rounded-[2rem] h-14 px-10 shadow-xl font-black uppercase tracking-widest text-[10px]">
                  {updateTask.isPending ? <Loader2 className="h-5 w-5 animate-spin mr-3" /> : <Zap className="h-5 w-5 mr-3 fill-primary-foreground" />}
                  Commit Update
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
