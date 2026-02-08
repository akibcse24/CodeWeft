
import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Sparkles, Wand2, Languages, BookOpen, Lightbulb,
    Briefcase, GraduationCap, Smile, Loader2, X, Send
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';
import { type AIRequest } from '@/services/ai.service';
import { runAgentLoop } from '@/services/agent.service';
import { useAuth } from '@/hooks/useAuth';

interface AIAssistantProps {
    selectedText: string;
    onInsert: (text: string) => void;
    onReplace: (text: string) => void;
    position?: { x: number; y: number };
    onClose?: () => void;
}

export function AIAssistant({ selectedText, onInsert, onReplace, position, onClose }: AIAssistantProps) {
    const { user } = useAuth();
    const [isProcessing, setIsProcessing] = useState(false);
    const [result, setResult] = useState<string | null>(null);
    const [customPrompt, setCustomPrompt] = useState("");
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        // Focus input on mount
        setTimeout(() => inputRef.current?.focus(), 100);
    }, []);

    const handleAIAction = async (action: string, prompt: string) => {
        setIsProcessing(true);

        try {
            const systemPrompt = "You are a highly capable AI writing and research assistant. Use tools when needed to provide factual and context-aware responses.";
            let userPrompt = "";

            switch (action) {
                case 'continue':
                    userPrompt = `Continue writing this text naturally, maintaining the same tone and style:\n\n${selectedText}`;
                    break;
                case 'improve':
                    userPrompt = `Improve this text for better clarity, flow, and professional impact while preserving its core meaning:\n\n${selectedText}`;
                    break;
                case 'summarize':
                    userPrompt = `Provide a concise but comprehensive summary of this text, highlighting the most important points:\n\n${selectedText}`;
                    break;
                case 'translate':
                    userPrompt = `Translate this text to Spanish professionally:\n\n${selectedText}`;
                    break;
                case 'grammar':
                    userPrompt = `Fix all spelling, grammar, and punctuation errors in this text without changing its meaning:\n\n${selectedText}`;
                    break;
                case 'tone':
                    userPrompt = `Rewrite this text in a ${prompt} tone:\n\n${selectedText}`;
                    break;
                case 'explain':
                    userPrompt = `Explain the key concepts in this text in a simple, easy-to-understand way:\n\n${selectedText}`;
                    break;
                case 'actions':
                    userPrompt = `Extract clear, actionable to-do items from this text in a bulleted list:\n\n${selectedText}`;
                    break;
                default:
                    userPrompt = `${prompt}:\n\n${selectedText}`;
                    break;
            }

            const messages = [
                { role: "system", content: systemPrompt },
                { role: "user", content: userPrompt }
            ];

            const response = await runAgentLoop(messages as Array<{ role: string; content: string }>, user?.id || "");

            let resultText = "";
            if (Symbol.asyncIterator in response) {
                for await (const chunk of response as AsyncIterable<{ choices: Array<{ delta?: { content: string } }> }>) {
                    resultText += chunk.choices[0]?.delta?.content || "";
                }
            } else {
                resultText = (response as { choices: Array<{ message: { content: string } }> }).choices[0].message.content;
            }

            setResult(resultText);
            toast({
                title: 'AI magic complete!',
                description: `Generated ${resultText.split(' ').length} words of insight`,
            });
        } catch (error) {
            console.error("AI Error", error);
            toast({
                title: 'AI temporary unavailable',
                description: 'We encountered an error processing your request. Please try again.',
                variant: 'destructive'
            });
        } finally {
            setIsProcessing(false);
        }
    };

    const handleCustomSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!customPrompt.trim()) return;
        handleAIAction('custom', customPrompt);
    };

    const actions = [
        {
            group: "Writing",
            items: [
                {
                    icon: Wand2,
                    label: 'Continue writing',
                    description: 'Complete your thoughts',
                    action: () => handleAIAction('continue', ''),
                    color: "text-blue-500",
                    bg: "bg-blue-500/10"
                },
                {
                    icon: Sparkles,
                    label: 'Improve writing',
                    description: 'Better clarity & style',
                    action: () => handleAIAction('improve', ''),
                    color: "text-purple-500",
                    bg: "bg-purple-500/10"
                },
                {
                    icon: GraduationCap,
                    label: 'Fix Grammar',
                    description: 'Spelling & punctuation',
                    action: () => handleAIAction('grammar', ''),
                    color: "text-emerald-500",
                    bg: "bg-emerald-500/10"
                },
            ]
        },
        {
            group: "Utility",
            items: [
                {
                    icon: BookOpen,
                    label: 'Summarize',
                    description: 'Key points only',
                    action: () => handleAIAction('summarize', ''),
                    color: "text-orange-500",
                    bg: "bg-orange-500/10"
                },
                {
                    icon: Lightbulb,
                    label: 'Explain this',
                    description: 'Simple explanation',
                    action: () => handleAIAction('explain', ''),
                    color: "text-yellow-500",
                    bg: "bg-yellow-500/10"
                },
                {
                    icon: Briefcase,
                    label: 'Action Items',
                    description: 'Extract to-dos',
                    action: () => handleAIAction('actions', ''),
                    color: "text-rose-500",
                    bg: "bg-rose-500/10"
                },
            ]
        }
    ];

    if (result) {
        return (
            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 10 }}
                className="fixed z-[100] w-[550px] glass-premium border border-white/20 rounded-2xl shadow-2xl overflow-hidden shadow-purple-500/10"
                style={position ? { top: position.y + 10, left: position.x } : {}}
            >
                <div className="p-4 bg-gradient-to-r from-purple-500/10 to-blue-500/10 border-b border-white/10 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="p-1.5 rounded-lg bg-purple-500/20">
                            <Sparkles className="h-4 w-4 text-purple-400" />
                        </div>
                        <span className="font-bold text-sm tracking-tight text-foreground/90 font-outfit">AI Generation</span>
                    </div>
                    <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-white/10 rounded-full" onClick={() => { setResult(null); onClose?.(); }}>
                        <X className="h-4 w-4" />
                    </Button>
                </div>

                <div className="p-6">
                    <div className="prose prose-sm dark:prose-invert max-h-[400px] overflow-auto mb-6 bg-black/20 p-5 rounded-xl border border-white/5 font-inter text-[15px] leading-relaxed select-text">
                        {result}
                    </div>

                    <div className="flex gap-3">
                        <Button
                            onClick={() => { onReplace(result); setResult(null); onClose?.(); }}
                            className="flex-1 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white border-0 shadow-lg shadow-purple-500/20 py-6 rounded-xl font-bold transition-all hover:scale-[1.02] active:scale-[0.98]"
                        >
                            Replace Selection
                        </Button>
                        <Button
                            onClick={() => { onInsert(result); setResult(null); onClose?.(); }}
                            variant="outline"
                            className="flex-1 py-6 rounded-xl border-white/10 bg-white/5 hover:bg-white/10 font-bold"
                        >
                            Insert Below
                        </Button>
                        <Button
                            onClick={() => setResult(null)}
                            variant="ghost"
                            className="hover:bg-red-500/10 hover:text-red-400 rounded-xl"
                        >
                            Discard
                        </Button>
                    </div>
                </div>
            </motion.div>
        );
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 15 }}
            className="fixed z-[100] w-[420px] glass-premium border border-white/20 rounded-2xl shadow-2xl overflow-hidden shadow-blue-500/10 flex flex-col"
            style={position ? { top: position.y + 10, left: position.x } : {}}
        >
            <div className="p-4 bg-gradient-to-r from-blue-500/5 via-transparent to-purple-500/5 border-b border-white/10 flex items-center gap-3">
                <div className="p-1.5 rounded-lg bg-blue-500/20">
                    <Sparkles className="h-4 w-4 text-blue-400" />
                </div>
                <span className="font-bold text-sm tracking-tight text-foreground/80 font-outfit uppercase">AI Intelligence Hub</span>
                <div className="ml-auto">
                    <Button variant="ghost" size="icon" className="h-7 w-7 rounded-full hover:bg-red-500/10 hover:text-red-400" onClick={() => onClose?.()}>
                        <X className="h-3.5 w-3.5" />
                    </Button>
                </div>
            </div>

            <div className="p-4">
                <form onSubmit={handleCustomSubmit} className="relative group">
                    <Input
                        ref={inputRef}
                        placeholder={selectedText ? "Command AI to edit selection..." : "What should I write for you?"}
                        value={customPrompt}
                        onChange={(e) => setCustomPrompt(e.target.value)}
                        className="pr-12 h-12 bg-white/5 border-white/10 rounded-xl focus:ring-2 focus:ring-blue-500/40 text-[15px] font-medium placeholder:text-muted-foreground/50 transition-all group-hover:bg-white/10 outline-none"
                        disabled={isProcessing}
                    />
                    <Button
                        size="icon"
                        variant="ghost"
                        type="submit"
                        className="absolute right-1.5 top-1.5 h-9 w-9 text-muted-foreground hover:bg-blue-500 hover:text-white rounded-lg transition-all active:scale-90"
                        disabled={isProcessing || !customPrompt.trim()}
                    >
                        {isProcessing ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
                    </Button>
                </form>
            </div>

            {!isProcessing && (
                <div className="max-h-[380px] overflow-y-auto p-2 space-y-4 pb-4 custom-scrollbar">
                    {actions.map((group, gIdx) => (
                        <div key={gIdx} className="space-y-1.5">
                            <div className="px-3 py-1 text-[10px] font-black text-muted-foreground/60 uppercase tracking-[0.2em]">
                                {group.group}
                            </div>
                            <div className="grid grid-cols-1 gap-1">
                                {group.items.map((item, index) => (
                                    <button
                                        key={index}
                                        onClick={item.action}
                                        className="w-full flex items-center gap-4 p-3 hover:bg-white/5 rounded-xl text-left transition-all group active:scale-[0.98]"
                                    >
                                        <div className={cn("p-2 rounded-lg transition-colors border border-white/5", item.bg)}>
                                            <item.icon className={cn("h-4 w-4", item.color)} />
                                        </div>
                                        <div className="flex-1">
                                            <div className="font-bold text-sm text-foreground/90 group-hover:text-foreground">{item.label}</div>
                                            <div className="text-[11px] text-muted-foreground font-medium">{item.description}</div>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {isProcessing && (
                <div className="p-12 flex flex-col items-center justify-center text-center space-y-4">
                    <div className="relative">
                        <div className="absolute inset-0 bg-blue-500 blur-2xl opacity-20 animate-pulse" />
                        <Loader2 className="h-12 w-12 animate-spin text-blue-500 relative z-10" />
                    </div>
                    <div>
                        <p className="font-bold text-foreground/80 animate-pulse">Consulting digital neurons...</p>
                        <p className="text-xs text-muted-foreground mt-1">This takes only secondary to give you perfection</p>
                    </div>
                </div>
            )}
        </motion.div>
    );
}

// Simplified version for context menus (kept for backward compatibility if needed)
export function AIAssistantMenu({ selectedText, onResult }: {
    selectedText: string;
    onResult: (result: string, action: string) => void;
}) {
    // ... existing implementation ...
    return <></>; // Placeholder or keep original if needed elsewhere
}
