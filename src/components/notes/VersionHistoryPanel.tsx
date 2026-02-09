import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { History, RotateCcw, Trash2, ChevronRight, Clock, User, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { formatDistanceToNow, format } from 'date-fns';
import { usePageVersions } from '@/hooks/usePageVersions';
import { Database } from '@/integrations/supabase/types';
import { cn } from '@/lib/utils';

type PageVersion = Database['public']['Tables']['page_versions']['Row'];

interface VersionHistoryPanelProps {
  pageId: string | null;
  isOpen: boolean;
  onClose: () => void;
  onRestore?: (version: PageVersion) => void;
}

export function VersionHistoryPanel({ pageId, isOpen, onClose, onRestore }: VersionHistoryPanelProps) {
  const { versions, latestVersion, isLoading, createVersion, restoreVersion, deleteVersion } = usePageVersions(pageId);
  const [selectedVersionId, setSelectedVersionId] = useState<string | null>(null);

  const handleCreateVersion = async () => {
    await createVersion.mutateAsync();
  };

  const handleRestore = async (version: PageVersion) => {
    if (onRestore) {
      onRestore(version);
    } else {
      await restoreVersion.mutateAsync(version);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-40" onClick={onClose} />
      
      {/* Panel */}
      <motion.div
        initial={{ x: 320, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        exit={{ x: 320, opacity: 0 }}
        className="fixed right-0 top-0 bottom-0 z-50 w-80 bg-background border-l shadow-2xl flex flex-col"
      >
        {/* Header */}
        <div className="p-4 border-b flex items-center justify-between">
          <div className="flex items-center gap-2">
            <History className="h-5 w-5 text-primary" />
            <h2 className="font-semibold">Version History</h2>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Actions */}
        <div className="p-3 border-b">
          <Button
            onClick={handleCreateVersion}
            disabled={createVersion.isPending}
            className="w-full"
            size="sm"
          >
            <Clock className="h-4 w-4 mr-2" />
            Save Current Version
          </Button>
        </div>

        {/* Version List */}
        <ScrollArea className="flex-1">
          <div className="p-3 space-y-2">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
              </div>
            ) : versions && versions.length > 0 ? (
              versions.map((version, index) => (
                <motion.div
                  key={version.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className={cn(
                    "p-3 rounded-lg border transition-colors cursor-pointer",
                    selectedVersionId === version.id
                      ? "bg-accent border-primary"
                      : "hover:bg-accent/50"
                  )}
                  onClick={() => setSelectedVersionId(
                    selectedVersionId === version.id ? null : version.id
                  )}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 mb-1">
                        <span className="text-xs font-medium">
                          v{version.version_number}
                        </span>
                        {index === 0 && (
                          <span className="text-xs px-1.5 py-0.5 bg-primary/10 text-primary rounded">
                            Current
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(version.created_at), { addSuffix: true })}
                      </p>
                      {version.title && (
                        <p className="text-sm font-medium mt-1 truncate">
                          {version.title}
                        </p>
                      )}
                    </div>
                    
                    <ChevronRight className={cn(
                      "h-4 w-4 text-muted-foreground transition-transform",
                      selectedVersionId === version.id && "rotate-90"
                    )} />
                  </div>

                  {/* Expanded Actions */}
                  <AnimatePresence>
                    {selectedVersionId === version.id && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="mt-3 pt-3 border-t flex gap-2"
                      >
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRestore(version);
                          }}
                          disabled={restoreVersion.isPending}
                          className="flex-1"
                        >
                          <RotateCcw className="h-3.5 w-3.5 mr-1.5" />
                          Restore
                        </Button>
                        {index !== 0 && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteVersion.mutate(version.id);
                            }}
                            disabled={deleteVersion.isPending}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              ))
            ) : (
              <div className="text-center py-8">
                <History className="h-10 w-10 text-muted-foreground/50 mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">No versions yet</p>
                <p className="text-xs text-muted-foreground/70 mt-1">
                  Save a version to track changes
                </p>
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Footer */}
        <div className="p-3 border-t bg-muted/30 text-xs text-muted-foreground text-center">
          {versions?.length || 0} version{versions?.length !== 1 ? 's' : ''} saved
        </div>
      </motion.div>
    </>
  );
}
