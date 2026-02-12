import { useState, useCallback, useMemo } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";

interface ConfirmDialogOptions {
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  variant?: "default" | "destructive";
}

interface PromptDialogOptions {
  title: string;
  description?: string;
  defaultValue?: string;
  placeholder?: string;
  confirmText?: string;
  cancelText?: string;
  validate?: (value: string) => string | null;
}

// Global state for confirmation dialogs
let confirmCallback: ((result: boolean) => void) | null = null;
let promptCallback: ((result: string | null) => void) | null = null;

export function useConfirmDialog() {
  const [isOpen, setIsOpen] = useState(false);
  const [options, setOptions] = useState<ConfirmDialogOptions>({
    title: "",
    description: "",
  });
  const [isLoading, setIsLoading] = useState(false);

  const confirm = useCallback((opts: ConfirmDialogOptions): Promise<boolean> => {
    return new Promise((resolve) => {
      setOptions(opts);
      setIsOpen(true);
      confirmCallback = (result: boolean) => {
        resolve(result);
        setIsOpen(false);
      };
    });
  }, []);

  const handleConfirm = useCallback(async () => {
    setIsLoading(true);
    if (confirmCallback) {
      confirmCallback(true);
    }
    setIsLoading(false);
  }, []);

  const handleCancel = useCallback(() => {
    if (confirmCallback) {
      confirmCallback(false);
    }
    setIsOpen(false);
  }, []);

  const ConfirmDialog = useCallback(() => (
    <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{options.title}</AlertDialogTitle>
          <AlertDialogDescription>{options.description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={handleCancel} disabled={isLoading}>
            {options.cancelText || "Cancel"}
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            disabled={isLoading}
            className={options.variant === "destructive" ? "bg-destructive hover:bg-destructive/90" : ""}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              options.confirmText || "Confirm"
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  ), [isOpen, options, isLoading, handleConfirm, handleCancel]);

  return useMemo(() => ({ confirm, ConfirmDialog }), [confirm, ConfirmDialog]);
}

export function usePromptDialog() {
  const [isOpen, setIsOpen] = useState(false);
  const [options, setOptions] = useState<PromptDialogOptions>({
    title: "",
  });
  const [value, setValue] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const prompt = useCallback((opts: PromptDialogOptions): Promise<string | null> => {
    return new Promise((resolve) => {
      setOptions(opts);
      setValue(opts.defaultValue || "");
      setError(null);
      setIsOpen(true);
      promptCallback = (result: string | null) => {
        resolve(result);
        setIsOpen(false);
      };
    });
  }, []);

  const handleConfirm = useCallback(async () => {
    setIsLoading(true);

    // Validate if validator provided
    if (options.validate) {
      const validationError = options.validate(value);
      if (validationError) {
        setError(validationError);
        setIsLoading(false);
        return;
      }
    }

    if (promptCallback) {
      promptCallback(value);
    }
    setIsLoading(false);
  }, [value, options]);

  const handleCancel = useCallback(() => {
    if (promptCallback) {
      promptCallback(null);
    }
    setIsOpen(false);
  }, []);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleConfirm();
    }
  }, [handleConfirm]);

  const PromptDialog = useCallback(() => (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{options.title}</DialogTitle>
          {options.description && (
            <DialogDescription>{options.description}</DialogDescription>
          )}
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="prompt-input">Value</Label>
            <Input
              id="prompt-input"
              value={value}
              onChange={(e) => {
                setValue(e.target.value);
                setError(null);
              }}
              onKeyDown={handleKeyDown}
              placeholder={options.placeholder}
              disabled={isLoading}
              autoFocus
            />
            {error && (
              <p className="text-sm text-destructive">{error}</p>
            )}
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={handleCancel} disabled={isLoading}>
            {options.cancelText || "Cancel"}
          </Button>
          <Button onClick={handleConfirm} disabled={isLoading || !value.trim()}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              options.confirmText || "Confirm"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  ), [isOpen, options, value, error, isLoading, handleConfirm, handleCancel, handleKeyDown]);

  return useMemo(() => ({ prompt, PromptDialog }), [prompt, PromptDialog]);
}

// Hook that provides both confirm and prompt dialogs
export function useDialogs() {
  const confirmDialog = useConfirmDialog();
  const promptDialog = usePromptDialog();

  const Dialogs = useCallback(() => (
    <>
      <confirmDialog.ConfirmDialog />
      <promptDialog.PromptDialog />
    </>
  ), []);

  return useMemo(() => ({
    confirm: confirmDialog.confirm,
    prompt: promptDialog.prompt,
    Dialogs,
  }), [confirmDialog.confirm, promptDialog.prompt, Dialogs]);
}
