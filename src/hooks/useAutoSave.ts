import { useEffect, useCallback, useRef } from "react";
import { useToast } from "@/hooks/use-toast";

interface UseAutoSaveOptions<T> {
  data: T;
  onSave: (data: T) => Promise<void>;
  debounceMs?: number;
  enabled?: boolean;
  key?: string;
}

/**
 * Hook for auto-saving data with debouncing
 */
export function useAutoSave<T>({
  data,
  onSave,
  debounceMs = 2000,
  enabled = true,
  key,
}: UseAutoSaveOptions<T>) {
  const { toast } = useToast();
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastSavedDataRef = useRef<T>(data);
  const isSavingRef = useRef(false);

  const save = useCallback(async () => {
    if (isSavingRef.current) return;
    
    isSavingRef.current = true;
    try {
      await onSave(data);
      lastSavedDataRef.current = data;
      
      if (key) {
        localStorage.setItem(`autosave-${key}`, JSON.stringify({
          timestamp: Date.now(),
          data,
        }));
      }
    } catch (error) {
      toast({
        title: "Auto-save failed",
        description: "Your changes couldn't be saved. Please try again.",
        variant: "destructive",
      });
    } finally {
      isSavingRef.current = false;
    }
  }, [data, onSave, key, toast]);

  useEffect(() => {
    if (!enabled) return;

    // Clear existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Set new timeout
    timeoutRef.current = setTimeout(() => {
      // Only save if data has changed
      if (JSON.stringify(data) !== JSON.stringify(lastSavedDataRef.current)) {
        save();
      }
    }, debounceMs);

    // Cleanup on unmount
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [data, debounceMs, enabled, save]);

  // Save on page unload
  useEffect(() => {
    if (!enabled) return;

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (JSON.stringify(data) !== JSON.stringify(lastSavedDataRef.current)) {
        e.preventDefault();
        e.returnValue = "";
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [data, enabled]);

  return {
    save,
    isSaving: isSavingRef.current,
  };
}

/**
 * Hook for offline support with local storage
 */
export function useOfflineStorage<T>(key: string) {
  const saveToLocal = useCallback((data: T) => {
    try {
      localStorage.setItem(`offline-${key}`, JSON.stringify({
        timestamp: Date.now(),
        data,
      }));
      return true;
    } catch {
      return false;
    }
  }, [key]);

  const loadFromLocal = useCallback((): T | null => {
    try {
      const stored = localStorage.getItem(`offline-${key}`);
      if (stored) {
        const parsed = JSON.parse(stored);
        return parsed.data;
      }
      return null;
    } catch {
      return null;
    }
  }, [key]);

  const clearLocal = useCallback(() => {
    localStorage.removeItem(`offline-${key}`);
  }, [key]);

  return { saveToLocal, loadFromLocal, clearLocal };
}
