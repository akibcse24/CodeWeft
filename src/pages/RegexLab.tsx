import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Regex,
    CheckCircle2,
    AlertCircle,
    Copy,
    RefreshCcw,
    Book,
    FlaskConical,
    Search,
    Code,
    ExternalLink,
    Terminal,
    Zap,
    History
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

const COMMON_PATTERNS = [
    { name: "Email Address", pattern: "[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}", description: "Matches standard email formats" },
    { name: "URL (Http/Https)", pattern: "https?:\\/\\/(www\\.)?[-a-zA-Z0-9@:%._\\+~#=]{1,256}\\.[a-zA-Z0-9()]{1,6}\\b([-a-zA-Z0-9()@:%_\\+.~#?&//=]*)", description: "Matches web URLs" },
    { name: "IPv4 Address", pattern: "\\b(?:\\d{1,3}\\.){3}\\d{1,3}\\b", description: "Matches standard IP addresses" },
    { name: "Date (YYYY-MM-DD)", pattern: "\\d{4}-\\d{2}-\\d{2}", description: "ISO 8601 Date format" },
    { name: "Hex Color", pattern: "#?([a-fA-F0-9]{6}|[a-fA-F0-9]{3})", description: "Matches hex color codes" },
];

const CHEAT_SHEET = [
    { char: ".", desc: "Any character" },
    { char: "\\d", desc: "Digit [0-9]" },
    { char: "\\w", desc: "Word char" },
    { char: "\\s", desc: "Whitespace" },
    { char: "+", desc: "1 or more" },
    { char: "*", desc: "0 or more" },
    { char: "?", desc: "0 or 1" },
    { char: "^", desc: "Boundary Start" },
    { char: "$", desc: "Boundary End" },
];

export default function RegexLab() {
    const { toast } = useToast();
    const [pattern, setPattern] = useState("");
    const [flags, setFlags] = useState("gm");
    const [testString, setTestString] = useState("");

    const matches = useMemo(() => {
        if (!pattern) return [];
        try {
            const regex = new RegExp(pattern, flags);
            const results = [];
            let match;
            if (!regex.global) {
                match = regex.exec(testString);
                if (match) results.push({ index: match.index, text: match[0], groups: match.slice(1) });
                return results;
            }

            let lastLastIndex = 0;
            while ((match = regex.exec(testString)) !== null) {
                results.push({ index: match.index, text: match[0], groups: match.slice(1) });
                if (regex.lastIndex === lastLastIndex) {
                    regex.lastIndex++;
                }
                lastLastIndex = regex.lastIndex;
            }
            return results;
        } catch (e) {
            return null;
        }
    }, [pattern, flags, testString]);

    const isValid = matches !== null;

    const renderHighlights = () => {
        if (!matches || matches.length === 0) return testString;

        let lastIndex = 0;
        const elements = [];

        matches.forEach((match, i) => {
            if (match.index > lastIndex) {
                elements.push(<span key={`text-${i}`}>{testString.slice(lastIndex, match.index)}</span>);
            }

            elements.push(
                <span key={`match-${i}`} className="bg-pink-500/20 text-pink-200 border-b-2 border-pink-500 font-bold relative group cursor-help transition-all duration-300 shadow-[0_4px_12px_rgba(236,72,153,0.1)]">
                    {match.text}
                    {match.groups.length > 0 && (
                        <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5 glass-premium text-[10px] rounded-xl border border-border/40 opacity-0 group-hover:opacity-100 whitespace-nowrap z-50 pointer-events-none transition-all duration-300 font-black uppercase tracking-widest shadow-2xl">
                            Groups: <span className="text-pink-400">{match.groups.join(", ")}</span>
                        </span>
                    )}
                </span>
            );

            lastIndex = match.index + match.text.length;
        });

        if (lastIndex < testString.length) {
            elements.push(<span key="text-end">{testString.slice(lastIndex)}</span>);
        }

        return elements;
    };

    return (
        <div className="space-y-8 animate-fade-in max-w-[1600px] mx-auto pb-20 p-6 flex flex-col min-h-screen">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 relative">
                <div className="absolute -left-20 -top-20 w-72 h-72 bg-pink-500/5 rounded-full blur-[100px] pointer-events-none" />
                <div className="space-y-3 relative z-10">
                    <div className="flex items-center gap-2 text-pink-500">
                        <Terminal className="h-5 w-5" />
                        <span className="text-xs font-black uppercase tracking-[0.3em]">Neural Parser</span>
                    </div>
                    <h1 className="text-6xl font-black tracking-tighter bg-clip-text text-transparent bg-gradient-to-br from-foreground to-foreground/40 leading-tight">
                        Regex Lab
                    </h1>
                    <p className="text-muted-foreground text-xl max-w-xl font-medium leading-relaxed">
                        Test, debug, and synthesize complex regular expressions in a high-fidelity environment.
                    </p>
                </div>

                <div className="flex items-center gap-4 relative z-10">
                    <div className="flex items-center gap-6 bg-pink-500/5 backdrop-blur-3xl px-8 py-5 rounded-[2rem] border border-pink-500/20">
                        <div className="flex flex-col items-center">
                            <span className="text-[10px] font-black uppercase tracking-widest text-pink-500/60 mb-0.5">Stability</span>
                            <span className={cn("text-xl font-black uppercase", isValid ? "text-emerald-400" : "text-pink-500 animate-pulse")}>
                                {isValid ? "Active" : "Error"}
                            </span>
                        </div>
                        <div className="w-px h-10 bg-pink-500/20" />
                        <div className="flex flex-col items-center">
                            <span className="text-[10px] font-black uppercase tracking-widest text-pink-500/60 mb-0.5">Matches</span>
                            <span className="text-xl font-black">{matches?.length || 0}</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 flex-1 min-h-0">
                <div className="lg:col-span-9 flex flex-col gap-8">
                    {/* Regex Input Bar */}
                    <Card className="glass-premium border-pink-500/30 overflow-hidden relative group">
                        <div className="absolute inset-0 bg-pink-500/[0.02] opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                        <CardContent className="p-6 flex items-center gap-4">
                            <span className="text-3xl font-black text-pink-500/40 select-none">/</span>
                            <Input
                                value={pattern}
                                onChange={(e) => setPattern(e.target.value)}
                                placeholder="Enter pattern (e.g. [a-z0-9]+)"
                                className={cn(
                                    "font-mono text-2xl h-14 border-none bg-transparent shadow-none focus-visible:ring-0 placeholder:italic placeholder:text-muted-foreground/20",
                                    !isValid && "text-pink-500"
                                )}
                            />
                            <span className="text-3xl font-black text-pink-500/40 select-none">/</span>
                            <Input
                                value={flags}
                                onChange={(e) => setFlags(e.target.value)}
                                className="w-24 font-mono text-xl h-14 border-none bg-transparent shadow-none focus-visible:ring-0 text-pink-500/70 text-center tracking-widest"
                                placeholder="flags"
                            />
                        </CardContent>
                    </Card>

                    {/* Test Area */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 flex-1 min-h-0">
                        <Card className="glass-premium flex flex-col h-[500px] relative group overflow-hidden">
                            <CardHeader className="pb-4 relative z-10 flex flex-row items-center justify-between bg-muted/20 border-b border-border/40">
                                <CardTitle className="text-[11px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 flex items-center gap-2">
                                    <Code className="h-4 w-4" /> Corpus Alpha
                                </CardTitle>
                                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg" onClick={() => setTestString("")}>
                                    <RefreshCcw className="h-4 w-4" />
                                </Button>
                            </CardHeader>
                            <CardContent className="flex-1 p-0 relative h-full">
                                <Textarea
                                    value={testString}
                                    onChange={(e) => setTestString(e.target.value)}
                                    className="absolute inset-0 w-full h-full resize-none p-8 font-mono text-lg bg-transparent border-none focus-visible:ring-0 z-10 text-transparent caret-pink-500 selection:bg-pink-500/20 leading-relaxed"
                                    spellCheck={false}
                                    placeholder="Input test string here..."
                                />
                                <div className="absolute inset-0 w-full h-full p-8 font-mono text-lg pointer-events-none whitespace-pre-wrap break-words text-foreground/80 leading-relaxed overflow-auto no-scrollbar">
                                    {renderHighlights()}
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="glass-premium flex flex-col h-[500px] overflow-hidden">
                            <CardHeader className="pb-4 relative z-10 flex flex-row items-center justify-between bg-muted/20 border-b border-border/40">
                                <CardTitle className="text-[11px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 flex items-center gap-2">
                                    <Search className="h-4 w-4" /> Extraction Logs
                                </CardTitle>
                                <Zap className={cn("h-4 w-4", isValid && matches?.length ? "text-yellow-500 fill-yellow-500 animate-pulse" : "text-muted-foreground/20")} />
                            </CardHeader>
                            <CardContent className="flex-1 overflow-auto p-6 space-y-4 no-scrollbar bg-muted/5">
                                <AnimatePresence mode="popLayout">
                                    {isValid && matches && matches.length > 0 ? (
                                        matches.map((m, i) => (
                                            <motion.div
                                                key={i}
                                                initial={{ opacity: 0, x: 10 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                className="p-5 rounded-2xl bg-muted/40 border border-border/40 hover:border-pink-500/20 transition-all flex flex-col gap-3 group/item relative overflow-hidden"
                                            >
                                                <div className="absolute top-0 right-0 p-2 opacity-0 group-hover/item:opacity-100 transition-opacity">
                                                    <Copy className="h-3 w-3 text-muted-foreground cursor-pointer hover:text-pink-500" onClick={() => {
                                                        navigator.clipboard.writeText(m.text);
                                                        toast({ title: "Fragment Captured" });
                                                    }} />
                                                </div>
                                                <div className="flex justify-between items-center">
                                                    <span className="text-[10px] font-black uppercase tracking-widest text-pink-500/60">Fragment {i + 1} System</span>
                                                    <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/40 font-mono">[{m.index}]</span>
                                                </div>
                                                <div className="font-mono text-emerald-400 break-all text-sm leading-relaxed bg-black/40 p-4 rounded-xl border border-emerald-500/10 shadow-inner">
                                                    {m.text}
                                                </div>
                                                {m.groups.length > 0 && (
                                                    <div className="grid grid-cols-1 gap-1.5 pt-2">
                                                        {m.groups.map((g, gi) => (
                                                            <div key={gi} className="flex items-center gap-3 bg-white/[0.02] px-3 py-1.5 rounded-lg border border-white/[0.05]">
                                                                <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/40 shrink-0">G-{gi + 1}</span>
                                                                <span className="font-mono text-xs text-pink-400 truncate">{g || "null"}</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </motion.div>
                                        ))
                                    ) : (
                                        <div className="h-full flex flex-col items-center justify-center text-muted-foreground/20 italic p-10 text-center">
                                            <Search className="h-16 w-16 mb-6 opacity-10" />
                                            <p className="font-black uppercase tracking-widest text-xs">Awaiting Synchronicity</p>
                                        </div>
                                    )}
                                </AnimatePresence>
                            </CardContent>
                        </Card>
                    </div>
                </div>

                {/* Sidebar */}
                <div className="lg:col-span-3 flex flex-col gap-8">
                    <Card className="glass-premium border-border/30 overflow-hidden flex flex-col h-[320px]">
                        <CardHeader className="bg-muted/30 border-b border-border/30 py-4">
                            <CardTitle className="text-[11px] font-black uppercase tracking-[0.2em] flex items-center gap-2">
                                <Book className="h-4 w-4" /> Codex
                            </CardTitle>
                        </CardHeader>
                        <ScrollArea className="flex-1">
                            <div className="p-5 space-y-2">
                                {CHEAT_SHEET.map((item, i) => (
                                    <div key={i} className="flex justify-between items-center group cursor-pointer hover:bg-pink-500/5 p-2 rounded-xl transition-all" onClick={() => setPattern(pattern + item.char)}>
                                        <code className="bg-pink-500/10 px-3 py-1 rounded-lg text-xs font-black text-pink-500 font-mono border border-pink-500/10 group-hover:scale-110 transition-transform">{item.char}</code>
                                        <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">{item.desc}</span>
                                    </div>
                                ))}
                            </div>
                        </ScrollArea>
                    </Card>

                    <Card className="glass-premium border-border/30 overflow-hidden flex flex-col h-[380px]">
                        <CardHeader className="bg-muted/30 border-b border-border/30 py-4">
                            <CardTitle className="text-[11px] font-black uppercase tracking-[0.2em] flex items-center gap-2">
                                <History className="h-4 w-4" /> Templates
                            </CardTitle>
                        </CardHeader>
                        <ScrollArea className="flex-1">
                            <div className="p-5 space-y-4">
                                {COMMON_PATTERNS.map((item, i) => (
                                    <div key={i} className="p-5 rounded-2xl border border-transparent bg-muted/20 hover:bg-muted/40 hover:border-pink-500/20 cursor-pointer transition-all group/tpl" onClick={() => {
                                        setPattern(item.pattern);
                                        toast({ title: "Template Initialized" });
                                    }}>
                                        <div className="flex justify-between items-center mb-2">
                                            <span className="text-[11px] font-black uppercase tracking-widest group-hover/tpl:text-pink-500 transition-colors">{item.name}</span>
                                            <ExternalLink className="h-3.5 w-3.5 text-muted-foreground/40 group-hover/tpl:text-pink-500 transition-colors" />
                                        </div>
                                        <p className="text-[10px] font-medium text-muted-foreground/60 leading-relaxed italic">{item.description}</p>
                                    </div>
                                ))}
                            </div>
                        </ScrollArea>
                    </Card>
                </div>
            </div>
        </div>
    );
}
