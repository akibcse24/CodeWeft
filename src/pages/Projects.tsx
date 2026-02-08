import { useState } from "react";
import { Plus, FolderKanban, GitBranch, ExternalLink, MoreVertical, Trash2, Edit, History } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Slider } from "@/components/ui/slider";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useProjects } from "@/hooks/useProjects";
import { ProjectDialog } from "@/components/projects/ProjectDialog";
import { GitHubRepoStats } from "@/components/github/GitHubRepoStats";
import { GitHubCommitLog } from "@/components/github/GitHubCommitLog";
import { toast } from "sonner";
import { Tables } from "@/integrations/supabase/types";

type Project = Tables<"projects">;

const STATUS_STYLES: Record<string, string> = {
  planning: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  in_progress: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  completed: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  on_hold: "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200",
};

const STATUS_LABELS: Record<string, string> = {
  planning: "Planning",
  in_progress: "In Progress",
  completed: "Completed",
  on_hold: "On Hold",
};

export default function Projects() {
  const { projects, isLoading, createProject, updateProject, deleteProject } = useProjects();
  
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [commitLogProject, setCommitLogProject] = useState<Project | null>(null);

  const handleCreate = async (data: {
    name: string; 
    description?: string; 
    status?: string;
    github_url?: string;
    tech_stack?: string[];
    color?: string;
  }) => {
    try {
      await createProject.mutateAsync(data);
      toast.success("Project created!");
    } catch (error) {
      toast.error("Failed to create project");
    }
  };

  const handleUpdate = async (data: { 
    name: string; 
    description?: string; 
    status?: string;
    github_url?: string;
    tech_stack?: string[];
    color?: string;
  }) => {
    if (!editingProject) return;
    try {
      await updateProject.mutateAsync({ id: editingProject.id, ...data });
      toast.success("Project updated!");
    } catch (error) {
      toast.error("Failed to update project");
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteProject.mutateAsync(id);
      toast.success("Project deleted");
    } catch (error) {
      toast.error("Failed to delete project");
    }
  };

  const handleProgressChange = async (projectId: string, progress: number) => {
    try {
      await updateProject.mutateAsync({ id: projectId, progress });
    } catch (error) {
      toast.error("Failed to update progress");
    }
  };

  // Calculate stats
  const inProgress = projects.filter(p => p.status === "in_progress").length;
  const completed = projects.filter(p => p.status === "completed").length;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Projects</h1>
          <p className="text-muted-foreground">Manage your coding projects</p>
        </div>
        <Button onClick={() => { setEditingProject(null); setDialogOpen(true); }}>
          <Plus className="mr-2 h-4 w-4" /> New Project
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold">{projects.length}</div>
            <p className="text-xs text-muted-foreground">Total Projects</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold">{inProgress}</div>
            <p className="text-xs text-muted-foreground">In Progress</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold">{completed}</div>
            <p className="text-xs text-muted-foreground">Completed</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold">
              {projects.length > 0 
                ? Math.round(projects.reduce((sum, p) => sum + (p.progress || 0), 0) / projects.length)
                : 0}%
            </div>
            <p className="text-xs text-muted-foreground">Avg Progress</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {projects.map((project) => (
          <Card key={project.id} className="card-hover group">
            <CardHeader className="pb-2">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <span 
                    className="h-3 w-3 rounded-full" 
                    style={{ backgroundColor: project.color || "#f59e0b" }}
                  />
                  <CardTitle className="text-lg">{project.name}</CardTitle>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100 h-8 w-8">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => {
                      setEditingProject(project);
                      setDialogOpen(true);
                    }}>
                      <Edit className="mr-2 h-4 w-4" /> Edit
                    </DropdownMenuItem>
                    {project.github_url && (
                      <DropdownMenuItem onClick={() => window.open(project.github_url!, "_blank")}>
                        <GitBranch className="mr-2 h-4 w-4" /> Open GitHub
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem 
                      className="text-destructive"
                      onClick={() => handleDelete(project.id)}
                    >
                      <Trash2 className="mr-2 h-4 w-4" /> Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              {project.description && (
                <CardDescription className="line-clamp-2">{project.description}</CardDescription>
              )}
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-2">
                <Badge className={STATUS_STYLES[project.status || "planning"]}>
                  {STATUS_LABELS[project.status || "planning"]}
                </Badge>
                {project.github_url && (
                  <>
                    <a 
                      href={project.github_url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-muted-foreground hover:text-foreground"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <GitBranch className="h-4 w-4" />
                  </a>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-6 w-6"
                      onClick={(e) => {
                        e.stopPropagation();
                        setCommitLogProject(project);
                      }}
                    >
                      <History className="h-4 w-4" />
                    </Button>
                  </>
                )}
              </div>

              {/* GitHub Stats */}
              {project.github_url && (
                <GitHubRepoStats githubUrl={project.github_url} compact />
              )}

              {project.tech_stack && project.tech_stack.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {project.tech_stack.slice(0, 4).map((tech) => (
                    <Badge key={tech} variant="outline" className="text-xs">
                      {tech}
                    </Badge>
                  ))}
                  {project.tech_stack.length > 4 && (
                    <Badge variant="outline" className="text-xs">
                      +{project.tech_stack.length - 4}
                    </Badge>
                  )}
                </div>
              )}

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Progress</span>
                  <span className="font-medium">{project.progress || 0}%</span>
                </div>
                <Slider
                  value={[project.progress || 0]}
                  max={100}
                  step={5}
                  onValueCommit={([value]) => handleProgressChange(project.id, value)}
                  className="cursor-pointer"
                />
              </div>
            </CardContent>
          </Card>
        ))}

        {projects.length === 0 && !isLoading && (
          <Card 
            className="card-hover cursor-pointer border-dashed" 
            onClick={() => { setEditingProject(null); setDialogOpen(true); }}
          >
            <CardContent className="pt-6">
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <div className="p-3 rounded-full bg-muted mb-3">
                  <FolderKanban className="h-6 w-6 text-muted-foreground" />
                </div>
                <h3 className="font-medium">Create your first project</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Track milestones and progress
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      <ProjectDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        project={editingProject}
        onSave={editingProject ? handleUpdate : handleCreate}
      />

      {/* Commit Log Dialog */}
      <Dialog open={!!commitLogProject} onOpenChange={() => setCommitLogProject(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{commitLogProject?.name} - Commits</DialogTitle>
          </DialogHeader>
          {commitLogProject && (
            <GitHubCommitLog githubUrl={commitLogProject.github_url} />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
