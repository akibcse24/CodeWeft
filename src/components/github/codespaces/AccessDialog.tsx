/**
 * AccessDialog Component
 * 
 * Dialog wrapper for CodespaceAccessPanel
 * Replaces the old TerminalDialog
 */

import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { X, Monitor, GitBranch } from 'lucide-react';
import { CodespaceAccessPanel } from './CodespaceAccessPanel';
import type { GitHubCodespace } from '@/services/github/codespaces.service';

interface AccessDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    codespace: GitHubCodespace | null;
}

export function AccessDialog({ open, onOpenChange, codespace }: AccessDialogProps) {
    if (!codespace) return null;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                <DialogHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-primary/10">
                            <Monitor className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                            <DialogTitle className="text-lg">Codespace Access</DialogTitle>
                            <p className="text-sm text-muted-foreground flex items-center gap-1.5 mt-0.5">
                                <GitBranch className="h-3 w-3" />
                                {codespace.git_status.ref}
                            </p>
                        </div>
                    </div>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => onOpenChange(false)}
                    >
                        <X className="h-4 w-4" />
                    </Button>
                </DialogHeader>

                <CodespaceAccessPanel codespace={codespace} />
            </DialogContent>
        </Dialog>
    );
}
