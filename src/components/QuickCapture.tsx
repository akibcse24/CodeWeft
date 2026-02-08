import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, X, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { BLOCK_TEMPLATES, instantiateTemplate } from '@/data/templates';
import { cn } from '@/lib/utils';

interface QuickCaptureProps {
    onCreateNote: (title: string, template?: string) => void;
}

export function QuickCapture({ onCreateNote }: QuickCaptureProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [title, setTitle] = useState('');
    const [quickNote, setQuickNote] = useState('');
    const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);

    const handleCreate = () => {
        if (!title.trim()) return;

        onCreateNote(title.trim(), selectedTemplate || undefined);

        // Reset and close
        setTitle('');
        setQuickNote('');
        setSelectedTemplate(null);
        setIsOpen(false);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
            handleCreate();
        }
    };

    // Global keyboard shortcut to open
    useState(() => {
        const handleGlobalKeyDown = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'n') {
                e.preventDefault();
                setIsOpen(true);
            }
        };

        window.addEventListener('keydown', handleGlobalKeyDown);
        return () => window.removeEventListener('keydown', handleGlobalKeyDown);
    });

    return (
        <>
            {/* Floating Action Button */}
            <motion.button
                className={cn(
                    "relative pointer-events-auto",
                    "w-14 h-14 rounded-2xl",
                    "bg-primary text-primary-foreground",
                    "shadow-lg hover:shadow-xl",
                    "flex items-center justify-center",
                    "transition-shadow duration-200 border-2 border-primary/20"
                )}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsOpen(true)}
                title="Quick Capture (Ctrl+N)"
            >
                <Plus className="h-6 w-6" />
            </motion.button>

            {/* Quick Capture Modal */}
            <Dialog open={isOpen} onOpenChange={setIsOpen}>
                <DialogContent className="sm:max-w-[600px]">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Sparkles className="h-5 w-5 text-primary" />
                            Quick Capture
                        </DialogTitle>
                    </DialogHeader>

                    <div className="space-y-4 py-4">
                        {/* Title Input */}
                        <div>
                            <Input
                                placeholder="Note title..."
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                onKeyDown={handleKeyDown}
                                autoFocus
                                className="text-lg font-medium"
                            />
                        </div>

                        {/* Quick Note (Optional) */}
                        <div>
                            <Textarea
                                placeholder="Quick note (optional)..."
                                value={quickNote}
                                onChange={(e) => setQuickNote(e.target.value)}
                                rows={3}
                                className="resize-none"
                            />
                            <p className="text-xs text-muted-foreground mt-1">
                                Or choose a template below
                            </p>
                        </div>

                        {/* Template Selection */}
                        <div>
                            <p className="text-sm font-medium mb-2">Start with template:</p>
                            <div className="grid grid-cols-2 gap-2">
                                <button
                                    onClick={() => setSelectedTemplate(null)}
                                    className={cn(
                                        "p-3 rounded-lg border-2 text-left transition-colors",
                                        selectedTemplate === null
                                            ? "border-primary bg-primary/5"
                                            : "border-border hover:border-muted-foreground"
                                    )}
                                >
                                    <div className="text-lg mb-1">📄</div>
                                    <div className="font-medium text-sm">Blank Page</div>
                                    <div className="text-xs text-muted-foreground">Start from scratch</div>
                                </button>

                                {BLOCK_TEMPLATES.slice(0, 5).map((template) => (
                                    <button
                                        key={template.id}
                                        onClick={() => setSelectedTemplate(template.id)}
                                        className={cn(
                                            "p-3 rounded-lg border-2 text-left transition-colors",
                                            selectedTemplate === template.id
                                                ? "border-primary bg-primary/5"
                                                : "border-border hover:border-muted-foreground"
                                        )}
                                    >
                                        <div className="text-lg mb-1">{template.icon}</div>
                                        <div className="font-medium text-sm">{template.name}</div>
                                        <div className="text-xs text-muted-foreground line-clamp-1">
                                            {template.description}
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center justify-between pt-2">
                            <p className="text-xs text-muted-foreground">
                                Press <kbd className="px-1.5 py-0.5 bg-muted rounded text-xs">Ctrl+Enter</kbd> to create
                            </p>
                            <div className="flex gap-2">
                                <Button
                                    variant="outline"
                                    onClick={() => setIsOpen(false)}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    onClick={handleCreate}
                                    disabled={!title.trim()}
                                >
                                    Create Note
                                </Button>
                            </div>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
}
