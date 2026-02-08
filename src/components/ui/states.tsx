import { useState, useEffect } from "react";
import { Loader2, FileText, FolderKanban, BookOpen, GraduationCap, Database, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  size?: "sm" | "md" | "lg";
}

export function EmptyState({ icon, title, description, action, size = "md" }: EmptyStateProps) {
  const sizes = {
    sm: "p-4",
    md: "p-8",
    lg: "p-12",
  };

  const iconSizes = {
    sm: "h-8 w-8",
    md: "h-12 w-12",
    lg: "h-16 w-16",
  };

  return (
    <div className={cn("flex flex-col items-center justify-center text-center", sizes[size])}>
      <div className={cn("text-muted-foreground mb-4", iconSizes[size])}>
        {icon || <AlertCircle />}
      </div>
      <h3 className="font-semibold text-lg mb-2">{title}</h3>
      {description && (
        <p className="text-muted-foreground text-sm max-w-md mb-4">{description}</p>
      )}
      {action && (
        <button
          onClick={action.onClick}
          className="inline-flex items-center justify-center px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:bg-primary/90 transition-colors"
        >
          {action.label}
        </button>
      )}
    </div>
  );
}

// Empty state for different content types
export function EmptyNotes() {
  return (
    <EmptyState
      icon={<FileText />}
      title="No notes yet"
      description="Create your first note to get started organizing your thoughts."
      action={{
        label: "Create Note",
        onClick: () => {
          window.dispatchEvent(new CustomEvent("create-note"));
        },
      }}
    />
  );
}

export function EmptyTasks() {
  return (
    <EmptyState
      icon={<FolderKanban />}
      title="No tasks yet"
      description="Track your work and stay organized by creating tasks."
      action={{
        label: "Add Task",
        onClick: () => {
          window.dispatchEvent(new CustomEvent("create-task"));
        },
      }}
    />
  );
}

export function EmptyResources() {
  return (
    <EmptyState
      icon={<BookOpen />}
      title="No resources yet"
      description="Save useful links and resources for quick access."
      action={{
        label: "Add Resource",
        onClick: () => {
          window.dispatchEvent(new CustomEvent("create-resource"));
        },
      }}
    />
  );
}

export function EmptyCourses() {
  return (
    <EmptyState
      icon={<GraduationCap />}
      title="No courses yet"
      description="Add your courses to track assignments and progress."
      action={{
        label: "Add Course",
        onClick: () => {
          window.dispatchEvent(new CustomEvent("create-course"));
        },
      }}
    />
  );
}

export function EmptyDatasets() {
  return (
    <EmptyState
      icon={<Database />}
      title="No datasets yet"
      description="Organize your ML datasets here for easy access."
    />
  );
}

// Loading state component
interface LoadingStateProps {
  message?: string;
  size?: "sm" | "md" | "lg";
}

export function LoadingState({ message = "Loading...", size = "md" }: LoadingStateProps) {
  const sizes = {
    sm: "h-4 w-4",
    md: "h-8 w-8",
    lg: "h-12 w-12",
  };

  return (
    <div className="flex flex-col items-center justify-center p-8 space-y-4">
      <Loader2 className={cn("animate-spin text-muted-foreground", sizes[size])} />
      {message && (
        <p className="text-sm text-muted-foreground animate-pulse">{message}</p>
      )}
    </div>
  );
}

// Error state component
interface ErrorStateProps {
  title?: string;
  message: string;
  onRetry?: () => void;
}

export function ErrorState({ title = "Something went wrong", message, onRetry }: ErrorStateProps) {
  return (
    <div className="flex flex-col items-center justify-center p-8 space-y-4">
      <AlertCircle className="h-12 w-12 text-destructive" />
      <div className="text-center space-y-2">
        <h3 className="font-semibold text-lg">{title}</h3>
        <p className="text-sm text-muted-foreground">{message}</p>
      </div>
      {onRetry && (
        <button
          onClick={onRetry}
          className="inline-flex items-center justify-center px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:bg-primary/90 transition-colors"
        >
          Try Again
        </button>
      )}
    </div>
  );
}
