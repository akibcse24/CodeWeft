import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Code2, Search, ExternalLink, Loader2, Trash2, Edit, Star, Filter, Github, Terminal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useDSAProblems } from "@/hooks/useDSAProblems";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { ImportSolutionsDialog } from "@/components/github/ImportSolutionsDialog";
import { CodePlayground } from "@/components/dsa/CodePlayground";

const topics = ["Array", "String", "Hash Table", "Dynamic Programming", "Tree", "Graph", "Linked List", "Stack", "Two Pointers", "Sliding Window", "Backtracking", "Binary Search"];
const platforms = ["LeetCode", "HackerRank", "Codeforces", "Other"];

export default function DSA() {
  const { problems, isLoading, createProblem, updateProblem, deleteProblem } = useDSAProblems();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [playgroundOpen, setPlaygroundOpen] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [editingProblem, setEditingProblem] = useState<any>(null);
  const [filterDifficulty, setFilterDifficulty] = useState<string>("all");
  const [newProblem, setNewProblem] = useState({
    title: "",
    url: "",
    platform: "LeetCode",
    difficulty: "medium",
    topics: [] as string[],
    status: "not_started",
    solution_notes: "",
    understanding_rating: 0,
  });

  const handleCreateProblem = async () => {
    if (!newProblem.title.trim()) {
      toast({ title: "Please enter a problem title", variant: "destructive" });
      return;
    }
    await createProblem.mutateAsync({
      title: newProblem.title,
      url: newProblem.url || null,
      platform: newProblem.platform,
      difficulty: newProblem.difficulty,
      topics: newProblem.topics,
      status: newProblem.status,
      solution_notes: newProblem.solution_notes || null,
      understanding_rating: newProblem.understanding_rating || null,
    });
    setNewProblem({ title: "", url: "", platform: "LeetCode", difficulty: "medium", topics: [], status: "not_started", solution_notes: "", understanding_rating: 0 });
    setIsDialogOpen(false);
    toast({ title: "Problem added successfully" });
  };

  const handleDeleteProblem = async (id: string) => {
    await deleteProblem.mutateAsync(id);
    toast({ title: "Problem deleted" });
  };

  const toggleTopic = (topic: string) => {
    if (newProblem.topics.includes(topic)) {
      setNewProblem({ ...newProblem, topics: newProblem.topics.filter(t => t !== topic) });
    } else {
      setNewProblem({ ...newProblem, topics: [...newProblem.topics, topic] });
    }
  };

  const filteredProblems = problems.filter(p => {
    const matchesSearch = p.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesDifficulty = filterDifficulty === "all" || p.difficulty === filterDifficulty;
    return matchesSearch && matchesDifficulty;
  });

  const solvedCount = problems.filter(p => p.status === "solved").length;

  const difficultyColors: Record<string, string> = {
    easy: "text-difficulty-easy bg-difficulty-easy/10",
    medium: "text-difficulty-medium bg-difficulty-medium/10",
    hard: "text-difficulty-hard bg-difficulty-hard/10",
  };

  const statusColors: Record<string, string> = {
    not_started: "bg-muted",
    attempted: "bg-warning/20 text-warning",
    solved: "bg-success/20 text-success",
    review: "bg-info/20 text-info",
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const ProblemCard = ({ problem }: { problem: any }) => (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors group"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-medium">{problem.title}</span>
            {problem.difficulty && (
              <span className={cn("text-xs px-2 py-0.5 rounded-full capitalize", difficultyColors[problem.difficulty] || "bg-muted")}>
                {problem.difficulty}
              </span>
            )}
            {problem.status && (
              <span className={cn("text-xs px-2 py-0.5 rounded-full capitalize", statusColors[problem.status] || "bg-muted")}>
                {problem.status.replace("_", " ")}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
            {problem.platform && <span>{problem.platform}</span>}
            {problem.url && (
              <a href={problem.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-primary hover:underline">
                <ExternalLink className="h-3 w-3" /> Link
              </a>
            )}
          </div>
          {problem.topics && problem.topics.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {problem.topics.map((topic: string) => (
                <Badge key={topic} variant="secondary" className="text-xs">{topic}</Badge>
              ))}
            </div>
          )}
          {problem.understanding_rating > 0 && (
            <div className="flex items-center gap-1 mt-2">
              {[1, 2, 3, 4, 5].map(i => (
                <Star key={i} className={cn("h-3 w-3", i <= problem.understanding_rating ? "fill-warning text-warning" : "text-muted")} />
              ))}
            </div>
          )}
        </div>
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button variant="ghost" size="icon" onClick={() => setEditingProblem(problem)}>
            <Edit className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={() => handleDeleteProblem(problem.id)}>
            <Trash2 className="h-4 w-4 text-destructive" />
          </Button>
        </div>
      </div>
    </motion.div>
  );

  if (isLoading) {
    return <div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">DSA Problems</h1>
          <p className="text-muted-foreground">Track your algorithm practice</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setPlaygroundOpen(true)}>
            <Terminal className="mr-2 h-4 w-4" /> Playground
          </Button>
          <Button variant="outline" onClick={() => setImportDialogOpen(true)}>
            <Github className="mr-2 h-4 w-4" /> Import from GitHub
          </Button>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button><Plus className="mr-2 h-4 w-4" /> Add Problem</Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader><DialogTitle>Add New Problem</DialogTitle></DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Title</Label>
                  <Input placeholder="Two Sum" value={newProblem.title} onChange={(e) => setNewProblem({ ...newProblem, title: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>URL</Label>
                  <Input placeholder="https://leetcode.com/problems/..." value={newProblem.url} onChange={(e) => setNewProblem({ ...newProblem, url: e.target.value })} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Platform</Label>
                    <Select value={newProblem.platform} onValueChange={(v) => setNewProblem({ ...newProblem, platform: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>{platforms.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Difficulty</Label>
                    <Select value={newProblem.difficulty} onValueChange={(v) => setNewProblem({ ...newProblem, difficulty: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="easy">Easy</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="hard">Hard</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Topics</Label>
                  <div className="flex flex-wrap gap-2">
                    {topics.map(topic => (
                      <Badge key={topic} variant={newProblem.topics.includes(topic) ? "default" : "outline"} className="cursor-pointer" onClick={() => toggleTopic(topic)}>
                        {topic}
                      </Badge>
                    ))}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select value={newProblem.status} onValueChange={(v) => setNewProblem({ ...newProblem, status: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="not_started">Not Started</SelectItem>
                      <SelectItem value="attempted">Attempted</SelectItem>
                      <SelectItem value="solved">Solved</SelectItem>
                      <SelectItem value="review">Review</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Solution Notes</Label>
                  <Textarea placeholder="Your approach..." value={newProblem.solution_notes} onChange={(e) => setNewProblem({ ...newProblem, solution_notes: e.target.value })} />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                <Button onClick={handleCreateProblem} disabled={createProblem.isPending}>
                  {createProblem.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                  Add Problem
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card><CardContent className="pt-4"><div className="text-2xl font-bold">{problems.length}</div><p className="text-xs text-muted-foreground">Total</p></CardContent></Card>
        <Card><CardContent className="pt-4"><div className="text-2xl font-bold text-success">{solvedCount}</div><p className="text-xs text-muted-foreground">Solved</p></CardContent></Card>
        <Card><CardContent className="pt-4"><div className="text-2xl font-bold text-warning">{problems.filter(p => p.status === "attempted").length}</div><p className="text-xs text-muted-foreground">Attempted</p></CardContent></Card>
        <Card><CardContent className="pt-4"><div className="text-2xl font-bold text-info">{problems.filter(p => p.status === "review").length}</div><p className="text-xs text-muted-foreground">Review</p></CardContent></Card>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search problems..." className="pl-10" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
        </div>
        <Select value={filterDifficulty} onValueChange={setFilterDifficulty}>
          <SelectTrigger className="w-40"><Filter className="h-4 w-4 mr-2" /><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="easy">Easy</SelectItem>
            <SelectItem value="medium">Medium</SelectItem>
            <SelectItem value="hard">Hard</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-3">
        {filteredProblems.length === 0 ? (
          <Card><CardContent className="pt-6 flex flex-col items-center justify-center py-12 text-center">
            <div className="p-4 rounded-full bg-muted mb-4"><Code2 className="h-8 w-8 text-muted-foreground" /></div>
            <h3 className="font-semibold text-lg">No problems yet</h3>
            <p className="text-muted-foreground mt-1">Start tracking your DSA practice</p>
          </CardContent></Card>
        ) : (
          <AnimatePresence>{filteredProblems.map(problem => <ProblemCard key={problem.id} problem={problem} />)}</AnimatePresence>
        )}
      </div>

      <ImportSolutionsDialog open={importDialogOpen} onOpenChange={setImportDialogOpen} />

      <Dialog open={playgroundOpen} onOpenChange={setPlaygroundOpen}>
        <DialogContent className="max-w-4xl h-[80vh]">
          <DialogHeader><DialogTitle>Code Playground</DialogTitle></DialogHeader>
          <div className="flex-1 h-full min-h-[500px]">
            <CodePlayground />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
