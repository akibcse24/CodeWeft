import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle, CheckCircle2, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";

import { createPageSchema, createTaskSchema, createCourseSchema } from "@/lib/schemas";

// Form validation component with error states
interface FormFieldWithErrorProps {
  label: string;
  error?: string;
  description?: string;
  required?: boolean;
  children: React.ReactNode;
}

export function FormFieldWithError({ label, error, description, required, children }: FormFieldWithErrorProps) {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <FormLabel className={cn(error && "text-destructive")}>
          {label}
          {required && <span className="text-destructive ml-1">*</span>}
        </FormLabel>
        {error && <AlertCircle className="h-4 w-4 text-destructive flex-shrink-0" />}
      </div>
      {children}
      {error && (
        <p className="text-sm text-destructive flex items-center gap-1">
          <XCircle className="h-3.5 w-3.5" />
          {error}
        </p>
      )}
      {description && !error && (
        <FormDescription>{description}</FormDescription>
      )}
    </div>
  );
}

// Success/Error banner component
interface ValidationBannerProps {
  type: "success" | "error" | "warning";
  message: string;
  onDismiss?: () => void;
}

export function ValidationBanner({ type, message, onDismiss }: ValidationBannerProps) {
  const icons = {
    success: <CheckCircle2 className="h-4 w-4" />,
    error: <XCircle className="h-4 w-4" />,
    warning: <AlertCircle className="h-4 w-4" />,
  };

  const colors = {
    success: "bg-green-50 border-green-200 text-green-800 dark:bg-green-950 dark:border-green-800 dark:text-green-100",
    error: "bg-red-50 border-red-200 text-red-800 dark:bg-red-950 dark:border-red-800 dark:text-red-100",
    warning: "bg-yellow-50 border-yellow-200 text-yellow-800 dark:bg-yellow-950 dark:border-yellow-800 dark:text-yellow-100",
  };

  return (
    <div className={cn("flex items-center gap-3 px-4 py-3 rounded-lg border", colors[type])}>
      {icons[type]}
      <p className="flex-1 text-sm font-medium">{message}</p>
      {onDismiss && (
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 opacity-70 hover:opacity-100"
          onClick={onDismiss}
        >
          <XCircle className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
}

// Form status indicator
interface FormStatusProps {
  isValid: boolean;
  isDirty: boolean;
  isSubmitting: boolean;
  error?: string;
  successMessage?: string;
}

export function FormStatus({ isValid, isDirty, isSubmitting, error, successMessage }: FormStatusProps) {
  if (isSubmitting) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        <span>Saving...</span>
      </div>
    );
  }

  if (successMessage) {
    return <ValidationBanner type="success" message={successMessage} />;
  }

  if (error) {
    return <ValidationBanner type="error" message={error} />;
  }

  if (isDirty && !isValid) {
    return <ValidationBanner type="warning" message="Please fix errors before submitting" />;
  }

  return null;
}

// Character counter component
interface CharacterCounterProps {
  current: number;
  max: number;
  warningThreshold?: number;
}

export function CharacterCounter({ current, max, warningThreshold = 0.8 }: CharacterCounterProps) {
  const percentage = current / max;
  const isWarning = percentage >= warningThreshold && percentage < 1;
  const isError = percentage >= 1;

  return (
    <div className="flex items-center justify-between text-xs">
      <span className={cn(
        isWarning && "text-yellow-600 dark:text-yellow-400",
        isError && "text-destructive"
      )}>
        {current}/{max} characters
      </span>
      {isWarning && <AlertCircle className="h-3 w-3 text-yellow-600 dark:text-yellow-400" />}
    </div>
  );
}

// Form wrapper component
interface EnhancedFormProps {
  children: React.ReactNode;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void | Promise<void>;
  isLoading?: boolean;
  submitLabel?: string;
  submitDisabled?: boolean;
  successMessage?: string;
  error?: string;
}

export function EnhancedForm({
  children,
  onSubmit,
  isLoading = false,
  submitLabel = "Submit",
  submitDisabled = false,
  successMessage,
  error,
}: EnhancedFormProps) {
  return (
    <form onSubmit={onSubmit as React.FormEventHandler<HTMLFormElement>} className="space-y-6">
      {successMessage && <ValidationBanner type="success" message={successMessage} />}
      {error && <ValidationBanner type="error" message={error} />}
      {children}
      <div className="flex justify-end">
        <Button type="submit" disabled={submitDisabled || isLoading}>
          {isLoading ? (
            <>
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent mr-2" />
              Processing...
            </>
          ) : (
            submitLabel
          )}
        </Button>
      </div>
    </form>
  );
}
