import { useState, useEffect, useRef } from 'react';
import { Loader2, AlertCircle, Maximize2, Columns, LayoutTemplate } from 'lucide-react';
import mermaid from 'mermaid';
import { cn } from '@/lib/utils';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

interface DiagramBlockProps {
    content: string;
    onChange: (content: string) => void;
    onFocus?: () => void;
    isFocused?: boolean;
    readOnly?: boolean;
}

// Initialize Mermaid
mermaid.initialize({
    startOnLoad: true,
    theme: 'default',
    securityLevel: 'loose',
    fontFamily: 'inherit',
});

import { DIAGRAM_TEMPLATES } from './diagram-constants';

export function DiagramBlock({
    content,
    onChange,
    onFocus,
    isFocused,
    readOnly
}: DiagramBlockProps) {
    const [isEditing, setIsEditing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isRendering, setIsRendering] = useState(false);
    const diagramRef = useRef<HTMLDivElement>(null);
    const renderIdRef = useRef(0);

    // Re-render when content changes (debounced by parent or useEffect here)
    useEffect(() => {
        if (content && diagramRef.current) {
            renderDiagram();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [content]);

    const renderDiagram = async () => {
        if (!diagramRef.current || !content.trim()) {
            if (diagramRef.current) diagramRef.current.innerHTML = '';
            return;
        }

        setIsRendering(true);
        setError(null);

        try {
            const id = `mermaid-${Date.now()}-${renderIdRef.current++}`;
            const { svg } = await mermaid.render(id, content);

            if (diagramRef.current) {
                diagramRef.current.innerHTML = svg;
            }
        } catch (err: unknown) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to render diagram';
            // Only set error if not empty content effectively
            if (content.trim().length > 0) {
                setError(errorMessage);
                // Keep previous successful render if possible? No, clear logic is safer to avoid mismatch
            }
        } finally {
            setIsRendering(false);
        }
    };

    const handleBlur = () => {
        // Only exit edit mode if we are actually blurring the block context? 
        // For split view, we might want an explicit "Done" button or stricter blur check.
        // For now, simple blur on textarea works if user clicks outside.
    };

    const handleTemplateSelect = (value: string) => {
        if (DIAGRAM_TEMPLATES[value as keyof typeof DIAGRAM_TEMPLATES]) {
            onChange(DIAGRAM_TEMPLATES[value as keyof typeof DIAGRAM_TEMPLATES]);
        }
    };

    if (readOnly) {
        return (
            <div className="my-2 p-4 rounded-lg border border-border/50 bg-muted/30">
                <div
                    ref={diagramRef}
                    className="mermaid-diagram flex items-center justify-center overflow-x-auto"
                />
            </div>
        );
    }

    if (isEditing) {
        return (
            <div className="my-4 space-y-2 p-4 border rounded-lg bg-background shadow-sm ring-1 ring-primary/20">
                <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                        <Columns className="h-4 w-4 text-muted-foreground" />
                        <span className="text-xs font-medium text-muted-foreground">Editor Preview</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <Select onValueChange={handleTemplateSelect}>
                            <SelectTrigger className="h-7 w-[130px] text-xs">
                                <SelectValue placeholder="Load Template" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="flowchart">Flowchart</SelectItem>
                                <SelectItem value="sequence">Sequence</SelectItem>
                                <SelectItem value="gantt">Gantt</SelectItem>
                                <SelectItem value="classDiagram">Class</SelectItem>
                                <SelectItem value="erDiagram">ER Diagram</SelectItem>
                            </SelectContent>
                        </Select>
                        <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => setIsEditing(false)}>
                            Done
                        </Button>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Textarea
                            value={content}
                            onChange={(e) => onChange(e.target.value)}
                            onFocus={onFocus}
                            placeholder="Enter Mermaid diagram code..."
                            className="font-mono text-sm min-h-[300px] bg-muted/30 resize-none"
                            autoFocus
                        />
                        <div className="flex items-center justify-between text-xs text-muted-foreground px-1">
                            <span>Mermaid syntax</span>
                            <a href="https://mermaid.js.org/intro/" target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors">Documentation →</a>
                        </div>
                    </div>

                    <div className="rounded-md border bg-card p-4 min-h-[300px] flex flex-col items-center justify-center overflow-hidden relative">
                        {error ? (
                            <div className="text-destructive text-sm text-center p-4 bg-destructive/10 rounded-md max-w-full overflow-auto">
                                <p className="font-semibold mb-1 flex items-center justify-center gap-2">
                                    <AlertCircle className="h-4 w-4" /> Syntax Error
                                </p>
                                <code className="block whitespace-pre-wrap text-xs font-mono">{error}</code>
                            </div>
                        ) : isRendering ? (
                            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                        ) : (
                            <div
                                ref={diagramRef}
                                className="mermaid-diagram w-full h-full overflow-auto flex items-center justify-center"
                            />
                        )}
                    </div>
                </div>
            </div>
        );
    }

    // Default View (Preview Mode)
    return (
        <div
            className={cn(
                "my-2 p-4 rounded-lg border border-border/50 bg-muted/30 cursor-pointer group relative min-h-[100px] flex items-center justify-center transition-all hover:border-primary/20",
                isFocused && "ring-2 ring-primary/20"
            )}
            onClick={() => setIsEditing(true)}
            onFocus={onFocus}
            tabIndex={0}
        >
            {error ? (
                <div className="flex items-center gap-2 text-destructive">
                    <AlertCircle className="h-4 w-4" />
                    <span className="text-sm">Failed to render diagram</span>
                </div>
            ) : (
                <div
                    ref={diagramRef}
                    className="mermaid-diagram w-full overflow-x-auto flex items-center justify-center"
                />
            )}

            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button variant="secondary" size="sm" className="h-6 text-xs gap-1 shadow-sm px-2">
                    <Maximize2 className="h-3 w-3" /> Edit
                </Button>
            </div>

            {!content && <span className="text-muted-foreground text-sm">Empty diagram. Click to edit.</span>}
        </div>
    );
}
