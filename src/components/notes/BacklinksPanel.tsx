import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link2, X, ArrowRight, ArrowLeft, ExternalLink, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { usePageBacklinks } from '@/hooks/usePageBacklinks';
import { cn } from '@/lib/utils';

interface BacklinksPanelProps {
  pageId: string | null;
  isOpen: boolean;
  onClose: () => void;
  onNavigate?: (pageId: string) => void;
}

export function BacklinksPanel({ pageId, isOpen, onClose, onNavigate }: BacklinksPanelProps) {
  const { incomingBacklinks, outgoingBacklinks, isLoading } = usePageBacklinks(pageId);

  const handleNavigate = (targetPageId: string) => {
    if (onNavigate) {
      onNavigate(targetPageId);
    } else {
      window.location.hash = `#/notes?page=${targetPageId}`;
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-40" onClick={onClose} />
      
      {/* Panel */}
      <motion.div
        initial={{ x: -320, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        exit={{ x: -320, opacity: 0 }}
        className="fixed left-0 top-0 bottom-0 z-50 w-80 bg-background border-r shadow-2xl flex flex-col"
      >
        {/* Header */}
        <div className="p-4 border-b flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Link2 className="h-5 w-5 text-primary" />
            <h2 className="font-semibold">Linked Pages</h2>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Content */}
        <ScrollArea className="flex-1">
          <div className="p-3 space-y-6">
            {/* Incoming Links */}
            {incomingBacklinks.length > 0 && (
              <div>
                <div className="flex items-center gap-1.5 mb-3">
                  <ArrowLeft className="h-4 w-4 text-muted-foreground" />
                  <h3 className="text-sm font-medium text-muted-foreground">
                    Linked to this page ({incomingBacklinks.length})
                  </h3>
                </div>
                <div className="space-y-1">
                  {incomingBacklinks.map((backlink) => (
                    <button
                      key={backlink.id}
                      onClick={() => handleNavigate(backlink.source_page_id)}
                      className={cn(
                        "w-full flex items-center gap-2 p-2 rounded-lg transition-colors",
                        "hover:bg-accent hover:text-accent-foreground text-left"
                      )}
                    >
                      {backlink.source_page?.icon ? (
                        <span className="text-lg">{backlink.source_page.icon}</span>
                      ) : (
                        <FileText className="h-4 w-4 text-muted-foreground" />
                      )}
                      <span className="flex-1 truncate text-sm">
                        {backlink.source_page?.title || 'Untitled'}
                      </span>
                      <ExternalLink className="h-3 w-3 text-muted-foreground" />
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Outgoing Links */}
            {outgoingBacklinks.length > 0 && (
              <div>
                <div className="flex items-center gap-1.5 mb-3">
                  <ArrowRight className="h-4 w-4 text-muted-foreground" />
                  <h3 className="text-sm font-medium text-muted-foreground">
                    Links from this page ({outgoingBacklinks.length})
                  </h3>
                </div>
                <div className="space-y-1">
                  {outgoingBacklinks.map((backlink) => (
                    <button
                      key={backlink.id}
                      onClick={() => handleNavigate(backlink.target_page_id)}
                      className={cn(
                        "w-full flex items-center gap-2 p-2 rounded-lg transition-colors",
                        "hover:bg-accent hover:text-accent-foreground text-left"
                      )}
                    >
                      {backlink.target_page?.icon ? (
                        <span className="text-lg">{backlink.target_page.icon}</span>
                      ) : (
                        <FileText className="h-4 w-4 text-muted-foreground" />
                      )}
                      <span className="flex-1 truncate text-sm">
                        {backlink.target_page?.title || 'Untitled'}
                      </span>
                      <ExternalLink className="h-3 w-3 text-muted-foreground" />
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Empty State */}
            {!isLoading && incomingBacklinks.length === 0 && outgoingBacklinks.length === 0 && (
              <div className="text-center py-8">
                <Link2 className="h-10 w-10 text-muted-foreground/50 mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">No links yet</p>
                <p className="text-xs text-muted-foreground/70 mt-1">
                  Link to other pages using [[page name]]
                </p>
              </div>
            )}

            {/* Loading */}
            {isLoading && (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Footer */}
        <div className="p-3 border-t bg-muted/30 text-xs text-muted-foreground text-center">
          {incomingBacklinks.length + outgoingBacklinks.length} link{incomingBacklinks.length + outgoingBacklinks.length !== 1 ? 's' : ''}
        </div>
      </motion.div>
    </>
  );
}
