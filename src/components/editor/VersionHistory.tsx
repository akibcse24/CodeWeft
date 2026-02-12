import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { History, Clock, RotateCcw, ChevronRight, User, FileText, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { format, formatDistanceToNow } from 'date-fns';

export interface PageVersion {
    id: string;
    pageId: string;
    content: unknown;
    title: string;
    icon?: string;
    createdAt: string;
    createdBy: string;
    createdByName: string;
    createdByAvatar?: string;
    changeDescription?: string;
}

interface VersionHistoryProps {
    versions: PageVersion[];
    currentVersionId?: string;
    onRestore: (version: PageVersion) => void;
    onCompare?: (versionA: PageVersion, versionB: PageVersion) => void;
    isOpen: boolean;
    onClose: () => void;
}

// eslint-disable-next-line react-refresh/only-export-components
export function VersionHistory({
    versions,
    currentVersionId,
    onRestore,
    onCompare,
    isOpen,
    onClose,
}: VersionHistoryProps) {
    const [selectedVersions, setSelectedVersions] = useState<Set<string>>(new Set());
    const [expandedVersion, setExpandedVersion] = useState<string | null>(null);

    const toggleVersion = (versionId: string) => {
        setSelectedVersions(prev => {
            const newSet = new Set(prev);
            if (newSet.has(versionId)) {
                newSet.delete(versionId);
            } else if (newSet.size >= 2) {
                // Remove the oldest selection if we already have 2
                const first = newSet.values().next().value;
                newSet.delete(first);
                newSet.add(versionId);
            } else {
                newSet.add(versionId);
            }
            return newSet;
        });
    };

    const handleRestore = (version: PageVersion) => {
        if (confirm(`Restore page to "${version.title}" from ${formatDistanceToNow(new Date(version.createdAt), { addSuffix: true })}?`)) {
            onRestore(version);
        }
    };

    const handleCompare = () => {
        const selectedArray = Array.from(selectedVersions);
        if (selectedArray.length === 2 && onCompare) {
            const selectedVersionObjects = selectedArray
                .map(id => versions.find(v => v.id === id))
                .filter((v): v is PageVersion => v !== undefined);

            if (selectedVersionObjects.length === 2) {
                const [older, newer] = selectedVersionObjects.sort((a, b) =>
                    new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
                );
                onCompare(older, newer);
            }
        }
    };

    const selectedArray = Array.from(selectedVersions);

    if (!isOpen) return null;

    return (
        <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.2 }}
            className="fixed right-4 top-20 z-40 w-80 bg-popover border rounded-xl shadow-2xl overflow-hidden"
        >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-border">
                <div className="flex items-center gap-2">
                    <History className="h-4 w-4 text-primary" />
                    <h3 className="font-semibold text-sm">Version History</h3>
                    <span className="text-xs px-1.5 py-0.5 rounded-full bg-primary/10 text-primary">
                        {versions.length}
                    </span>
                </div>
                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={onClose}>
                    <X className="h-4 w-4" />
                </Button>
            </div>

            {/* Compare Actions */}
            {selectedArray.length === 2 && (
                <div className="px-3 py-2 bg-primary/5 border-b border-border flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">
                        {selectedArray.length} versions selected
                    </span>
                    <Button
                        size="sm"
                        className="h-7 text-xs"
                        onClick={handleCompare}
                    >
                        Compare
                        <ChevronRight className="h-3 w-3 ml-1" />
                    </Button>
                </div>
            )}

            {/* Versions List */}
            <div className="max-h-[500px] overflow-y-auto">
                {versions.length === 0 ? (
                    <div className="text-center py-12">
                        <History className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
                        <p className="text-sm text-muted-foreground">No version history yet</p>
                        <p className="text-xs text-muted-foreground/70">
                            Changes are automatically saved
                        </p>
                    </div>
                ) : (
                    <div className="divide-y divide-border">
                        {versions.map((version, index) => {
                            const isSelected = selectedVersions.has(version.id);
                            const isCurrent = version.id === currentVersionId;
                            const isExpanded = expandedVersion === version.id;

                            return (
                                <div key={version.id} className="group">
                                    {/* Version Header */}
                                    <div
                                        className={cn(
                                            "flex items-start gap-3 px-4 py-3 cursor-pointer transition-colors",
                                            isSelected
                                                ? "bg-primary/5"
                                                : "hover:bg-muted/30"
                                        )}
                                        onClick={() => setExpandedVersion(
                                            isExpanded ? null : version.id
                                        )}
                                    >
                                        {/* Checkbox (for comparison) */}
                                        <div
                                            className={cn(
                                                "w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 mt-0.5 transition-colors",
                                                isSelected
                                                    ? "bg-primary border-primary"
                                                    : "border-muted-foreground/30 hover:border-primary/50"
                                            )}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                toggleVersion(version.id);
                                            }}
                                        >
                                            {isSelected && (
                                                <svg className="w-3 h-3 text-primary-foreground" fill="currentColor" viewBox="0 0 20 20">
                                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                                </svg>
                                            )}
                                        </div>

                                        {/* Content */}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2">
                                                <span className="text-xl">{version.icon || '📄'}</span>
                                                <span className="font-medium text-sm truncate">
                                                    {version.title}
                                                </span>
                                                {isCurrent && (
                                                    <span className="text-xs px-1.5 py-0.5 rounded bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                                                        Current
                                                    </span>
                                                )}
                                            </div>

                                            <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                                                <Clock className="h-3 w-3" />
                                                <span>
                                                    {formatDistanceToNow(new Date(version.createdAt), { addSuffix: true })}
                                                </span>
                                            </div>

                                            {version.changeDescription && (
                                                <p className="text-xs text-muted-foreground mt-1">
                                                    {version.changeDescription}
                                                </p>
                                            )}
                                        </div>
                                    </div>

                                    {/* Expanded Details */}
                                    <AnimatePresence>
                                        {isExpanded && (
                                            <motion.div
                                                initial={{ height: 0, opacity: 0 }}
                                                animate={{ height: 'auto', opacity: 1 }}
                                                exit={{ height: 0, opacity: 0 }}
                                                className="overflow-hidden"
                                            >
                                                <div className="px-4 pb-3 pl-12 space-y-2">
                                                    {/* Author */}
                                                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                                        <User className="h-3 w-3" />
                                                        <span>{version.createdByName}</span>
                                                    </div>

                                                    {/* Timestamp */}
                                                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                                        <Clock className="h-3 w-3" />
                                                        <span>
                                                            {format(new Date(version.createdAt), 'MMM d, yyyy h:mm a')}
                                                        </span>
                                                    </div>

                                                    {/* Actions */}
                                                    <div className="flex items-center gap-2 pt-2">
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            className="h-7 text-xs"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleRestore(version);
                                                            }}
                                                            disabled={isCurrent}
                                                        >
                                                            <RotateCcw className="h-3 w-3 mr-1" />
                                                            Restore
                                                        </Button>
                                                    </div>
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Footer */}
            <div className="px-4 py-3 border-t border-border bg-muted/20">
                <p className="text-xs text-muted-foreground text-center">
                    Select 2 versions to compare
                </p>
            </div>
        </motion.div>
    );
}

// Hook for managing version history
export function useVersionHistory(
    pageId: string,
    onRestore?: (version: PageVersion) => void
) {
    const [versions, setVersions] = useState<PageVersion[]>([]);
    const [currentVersionId, setCurrentVersionId] = useState<string | undefined>();
    const [isOpen, setIsOpen] = useState(false);

    // Load versions from storage/API
    const loadVersions = async () => {
        // This would typically load from IndexedDB or API
        const storedVersions = await loadVersionsFromStorage(pageId);
        setVersions(storedVersions);
    };

    // Save current state as a version
    const saveVersion = async (
        content: unknown,
        title: string,
        icon?: string,
        changeDescription?: string
    ) => {
        const newVersion: PageVersion = {
            id: crypto.randomUUID(),
            pageId,
            content,
            title,
            icon,
            createdAt: new Date().toISOString(),
            createdBy: 'current-user',
            createdByName: 'You',
            changeDescription,
        };

        setVersions(prev => [newVersion, ...prev]);
        setCurrentVersionId(newVersion.id);

        await saveVersionToStorage(newVersion);
    };

    const restore = async (version: PageVersion) => {
        onRestore?.(version);
        setCurrentVersionId(version.id);
        await markAsCurrent(pageId, version.id);
    };

    return {
        versions,
        currentVersionId,
        isOpen,
        setIsOpen,
        loadVersions,
        saveVersion,
        restore,
    };
}

// Storage helpers (would typically use IndexedDB)
async function loadVersionsFromStorage(pageId: string): Promise<PageVersion[]> {
    try {
        const stored = localStorage.getItem(`page-versions-${pageId}`);
        return stored ? JSON.parse(stored) : [];
    } catch {
        return [];
    }
}

async function saveVersionToStorage(version: PageVersion): Promise<void> {
    try {
        const existing = await loadVersionsFromStorage(version.pageId);
        const updated = [version, ...existing].slice(0, 100); // Keep last 100 versions
        localStorage.setItem(`page-versions-${version.pageId}`, JSON.stringify(updated));
    } catch (error) {
        console.error('Failed to save version:', error);
    }
}

async function markAsCurrent(pageId: string, versionId: string): Promise<void> {
    try {
        localStorage.setItem(`page-current-version-${pageId}`, versionId);
    } catch (error) {
        console.error('Failed to mark version as current:', error);
    }
}
