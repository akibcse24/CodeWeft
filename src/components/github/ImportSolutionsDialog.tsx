import { useState } from "react";
import { Github, Download, Loader2, CheckCircle, FileCode } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { useGitHub, useGitHubSolutions } from "@/hooks/useGitHub";
import { useDSAProblems } from "@/hooks/useDSAProblems";
import { toast } from "sonner";

interface Solution {
  path: string;
  name: string;
  language: string;
  url: string;
}

interface ImportSolutionsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ImportSolutionsDialog({ open, onOpenChange }: ImportSolutionsDialogProps) {
  const { settings, isConnected } = useGitHub();
  const { fetchSolutions } = useGitHubSolutions();
  const { createProblem } = useDSAProblems();

  const [repo, setRepo] = useState(settings?.solutions_repo || "");
  const [solutions, setSolutions] = useState<Solution[]>([]);
  const [selectedSolutions, setSelectedSolutions] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [step, setStep] = useState<"input" | "select" | "done">("input");
  const [importedCount, setImportedCount] = useState(0);

  const handleFetchSolutions = async () => {
    if (!repo.trim()) {
      toast.error("Please enter a repository");
      return;
    }

    setIsLoading(true);
    try {
      const result = await fetchSolutions.mutateAsync(repo);
      setSolutions(result.solutions);
      setSelectedSolutions(new Set(result.solutions.map((s) => s.path)));
      setStep("select");
      toast.success(`Found ${result.total} solution files`);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to fetch solutions";
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleImport = async () => {
    const toImport = solutions.filter((s) => selectedSolutions.has(s.path));
    if (toImport.length === 0) {
      toast.error("Please select at least one solution");
      return;
    }

    setIsImporting(true);
    let imported = 0;

    for (const solution of toImport) {
      try {
        // Create DSA problem entry
        await createProblem.mutateAsync({
          title: formatTitle(solution.name),
          url: solution.url,
          status: "solved",
          platform: "GitHub Import",
          solution_notes: `Imported from: ${solution.path}`,
          difficulty: guessDifficulty(solution.path),
          topics: guessTopics(solution.path),
        });
        imported++;
      } catch (error) {
        console.error(`Failed to import ${solution.name}:`, error);
      }
    }

    setImportedCount(imported);
    setStep("done");
    toast.success(`Imported ${imported} solutions`);
    setIsImporting(false);
  };

  const handleClose = () => {
    onOpenChange(false);
    // Reset state after dialog closes
    setTimeout(() => {
      setStep("input");
      setSolutions([]);
      setSelectedSolutions(new Set());
      setImportedCount(0);
    }, 200);
  };

  const toggleAll = () => {
    if (selectedSolutions.size === solutions.length) {
      setSelectedSolutions(new Set());
    } else {
      setSelectedSolutions(new Set(solutions.map((s) => s.path)));
    }
  };

  if (!isConnected) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Github className="h-5 w-5" />
              Import from GitHub
            </DialogTitle>
          </DialogHeader>
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <Github className="h-12 w-12 text-muted-foreground mb-3" />
            <p className="text-muted-foreground">
              Please connect your GitHub account in Settings first
            </p>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Github className="h-5 w-5" />
            Import DSA Solutions from GitHub
          </DialogTitle>
          <DialogDescription>
            {step === "input" && "Enter the repository containing your coding solutions"}
            {step === "select" && "Select the solutions you want to import"}
            {step === "done" && "Import complete!"}
          </DialogDescription>
        </DialogHeader>

        {step === "input" && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="repo">Repository</Label>
              <Input
                id="repo"
                placeholder="username/leetcode-solutions"
                value={repo}
                onChange={(e) => setRepo(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Format: owner/repository (e.g., octocat/leetcode-solutions)
              </p>
            </div>
            <Button
              onClick={handleFetchSolutions}
              disabled={isLoading || !repo.trim()}
              className="w-full"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Scanning repository...
                </>
              ) : (
                <>
                  <Download className="h-4 w-4 mr-2" />
                  Scan Repository
                </>
              )}
            </Button>
          </div>
        )}

        {step === "select" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Found {solutions.length} solution files
              </p>
              <Button variant="ghost" size="sm" onClick={toggleAll}>
                {selectedSolutions.size === solutions.length ? "Deselect All" : "Select All"}
              </Button>
            </div>
            <ScrollArea className="h-[300px] border rounded-lg p-2">
              <div className="space-y-1">
                {solutions.map((solution) => (
                  <div
                    key={solution.path}
                    className="flex items-start gap-2 p-2 rounded hover:bg-muted"
                  >
                    <Checkbox
                      id={solution.path}
                      checked={selectedSolutions.has(solution.path)}
                      onCheckedChange={(checked) => {
                        const newSelected = new Set(selectedSolutions);
                        if (checked) {
                          newSelected.add(solution.path);
                        } else {
                          newSelected.delete(solution.path);
                        }
                        setSelectedSolutions(newSelected);
                      }}
                    />
                    <div className="flex-1 min-w-0">
                      <label
                        htmlFor={solution.path}
                        className="text-sm font-medium cursor-pointer block truncate"
                      >
                        {formatTitle(solution.name)}
                      </label>
                      <p className="text-xs text-muted-foreground truncate">{solution.path}</p>
                    </div>
                    <Badge variant="outline" className="text-xs shrink-0">
                      {solution.language}
                    </Badge>
                  </div>
                ))}
              </div>
            </ScrollArea>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setStep("input")} className="flex-1">
                Back
              </Button>
              <Button
                onClick={handleImport}
                disabled={isImporting || selectedSolutions.size === 0}
                className="flex-1"
              >
                {isImporting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Importing...
                  </>
                ) : (
                  <>
                    <Download className="h-4 w-4 mr-2" />
                    Import {selectedSolutions.size} Solutions
                  </>
                )}
              </Button>
            </div>
          </div>
        )}

        {step === "done" && (
          <div className="flex flex-col items-center justify-center py-8 text-center space-y-4">
            <div className="p-4 rounded-full bg-green-100 dark:bg-green-900/30">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <div>
              <p className="font-medium">Successfully imported {importedCount} solutions!</p>
              <p className="text-sm text-muted-foreground">
                Check your DSA Tracker to see the imported problems
              </p>
            </div>
            <Button onClick={handleClose}>Done</Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

// Helper functions
function formatTitle(name: string): string {
  return name
    .replace(/[-_]/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .trim();
}

function guessDifficulty(path: string): string {
  const lower = path.toLowerCase();
  if (lower.includes("easy")) return "easy";
  if (lower.includes("medium")) return "medium";
  if (lower.includes("hard")) return "hard";
  return "medium";
}

function guessTopics(path: string): string[] {
  const topics: string[] = [];
  const lower = path.toLowerCase();

  const topicMap: Record<string, string> = {
    array: "Arrays",
    string: "Strings",
    "linked-list": "Linked List",
    linkedlist: "Linked List",
    tree: "Trees",
    graph: "Graphs",
    dp: "Dynamic Programming",
    "dynamic-programming": "Dynamic Programming",
    greedy: "Greedy",
    backtrack: "Backtracking",
    "binary-search": "Binary Search",
    binarysearch: "Binary Search",
    stack: "Stack",
    queue: "Queue",
    heap: "Heap",
    hash: "Hash Table",
    "two-pointer": "Two Pointers",
    twopointer: "Two Pointers",
    "sliding-window": "Sliding Window",
    slidingwindow: "Sliding Window",
    sort: "Sorting",
    recursion: "Recursion",
    math: "Math",
    bit: "Bit Manipulation",
  };

  for (const [key, value] of Object.entries(topicMap)) {
    if (lower.includes(key)) {
      topics.push(value);
    }
  }

  return topics.length > 0 ? topics : ["Algorithms"];
}
