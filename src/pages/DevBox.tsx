import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Terminal,
    Code,
    Hash,
    Repeat,
    ShieldCheck,
    Search,
    Copy,
    RefreshCw,
    Trash2,
    Check,
    Binary,
    Palette,
    Ruler,
    Sparkles,
    Braces,
    Cpu,
    Zap,
    History,
    FileJson,
    Key,
    Fingerprint,
    Command
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";

export default function DevBox() {
    const { toast } = useToast();
    const [activeTab, setActiveTab] = useState("json");

    // JSON Tool State
    const [jsonInput, setJsonInput] = useState("");
    const [jsonOutput, setJsonOutput] = useState("");

    // Base64 Tool State
    const [b64Input, setB64Input] = useState("");
    const [b64Output, setB64Output] = useState("");
    const [b64Mode, setB64Mode] = useState<"encode" | "decode">("encode");

    // JWT Tool State
    const [jwtInput, setJwtInput] = useState("");
    const [jwtOutput, setJwtOutput] = useState<{ header: unknown; payload: unknown } | null>(null);

    // Regex Tool State
    const [regexPattern, setRegexPattern] = useState("");
    const [regexFlags, setRegexFlags] = useState("g");
    const [regexInput, setRegexInput] = useState("");
    const [regexMatches, setRegexMatches] = useState<string[]>([]);

    // ID Gen State
    const [generatedIds, setGeneratedIds] = useState<string[]>([]);

    // Units State
    const [pixels, setPixels] = useState("16");
    const [baseSize, setBaseSize] = useState("16");

    // Colors State
    const [baseColor, setBaseColor] = useState("#3b82f6");
    const [palette, setPalette] = useState<string[]>([]);

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        toast({
            title: "Captured to Clipboard",
            description: "Fragment has been serialized.",
        });
    };

    const formatJson = () => {
        try {
            const parsed = JSON.parse(jsonInput);
            setJsonOutput(JSON.stringify(parsed, null, 2));
        } catch (e: unknown) {
            const message = e instanceof Error ? e.message : "Invalid JSON";
            toast({
                title: "Parsing Error",
                description: message,
                variant: "destructive",
            });
        }
    };

    const handleBase64 = () => {
        try {
            if (b64Mode === "encode") {
                setB64Output(btoa(b64Input));
            } else {
                setB64Output(atob(b64Input));
            }
        } catch (e: unknown) {
            toast({
                title: "B64 Failure",
                description: "Invalid seed for " + b64Mode,
                variant: "destructive",
            });
        }
    };

    const decodeJwt = () => {
        try {
            const parts = jwtInput.split(".");
            if (parts.length !== 3) throw new Error("Invalid format (3 parts req)");

            const decode = (str: string) => {
                str = str.replace(/-/g, "+").replace(/_/g, "/");
                while (str.length % 4) str += "=";
                return JSON.parse(atob(str));
            };

            const header = decode(parts[0]);
            const payload = decode(parts[1]);
            setJwtOutput({ header, payload });
        } catch (e: unknown) {
            const message = e instanceof Error ? e.message : "Handshake failure";
            toast({
                title: "JWT Compromised",
                description: message,
                variant: "destructive",
            });
        }
    };

    const testRegex = () => {
        try {
            if (!regexPattern) return;
            const re = new RegExp(regexPattern, regexFlags);
            const matches = Array.from(regexInput.matchAll(re)).map(m => m[0]);
            setRegexMatches(matches);
        } catch (e: unknown) {
            const message = e instanceof Error ? e.message : "Invalid frequency";
            toast({
                title: "Pattern Error",
                description: message,
                variant: "destructive",
            });
        }
    };

    const generateIds = (type: "uuid" | "nanoid" | "timestamp") => {
        const newIds = [];
        for (let i = 0; i < 5; i++) {
            if (type === "uuid") {
                newIds.push(crypto.randomUUID());
            } else if (type === "nanoid") {
                newIds.push(Math.random().toString(36).substring(2, 12).toUpperCase());
            } else {
                newIds.push(Date.now().toString() + i);
            }
        }
        setGeneratedIds(newIds);
    };

    const hexToRgb = (hex: string) => {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16)
        } : { r: 0, g: 0, b: 0 };
    };

    const rgbToHex = (r: number, g: number, b: number) => {
        return "#" + [r, g, b].map(x => {
            const hex = Math.round(x).toString(16);
            return hex.length === 1 ? "0" + hex : hex;
        }).join("");
    };

    const generatePalette = (hex: string) => {
        const { r, g, b } = hexToRgb(hex);
        const newPalette = [];
        for (let i = 0; i < 10; i++) {
            const factor = i / 9;
            let tr, tg, tb;
            if (factor < 0.5) {
                const mix = factor * 2;
                tr = 255 + (r - 255) * mix;
                tg = 255 + (g - 255) * mix;
                tb = 255 + (b - 255) * mix;
            } else {
                const shade = (factor - 0.5) * 2;
                tr = r * (1 - shade);
                tg = g * (1 - shade);
                tb = b * (1 - shade);
            }
            newPalette.push(rgbToHex(tr, tg, tb));
        }
        setPalette(newPalette);
    };

    const convertPxToRem = (px: string, base: string) => {
        const p = parseFloat(px);
        const b = parseFloat(base);
        if (isNaN(p) || isNaN(b) || b === 0) return "0";
        return (p / b).toFixed(3);
    };

    return (
        <div className="space-y-8 animate-fade-in max-w-[1600px] mx-auto pb-20 p-6 flex flex-col min-h-screen">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 relative">
                <div className="absolute -left-20 -top-20 w-80 h-80 bg-primary/5 rounded-full blur-[100px] pointer-events-none" />
                <div className="space-y-3 relative z-10">
                    <div className="flex items-center gap-2 text-primary">
                        <Cpu className="h-5 w-5 animate-pulse" />
                        <span className="text-xs font-black uppercase tracking-[0.3em]">Developer Unit 01</span>
                    </div>
                    <h1 className="text-6xl font-black tracking-tighter bg-clip-text text-transparent bg-gradient-to-br from-foreground to-foreground/40 leading-tight">
                        DevBox
                    </h1>
                    <p className="text-muted-foreground text-xl max-w-xl font-medium leading-relaxed">
                        A centralized laboratory for protocol manipulation and data synthesis.
                    </p>
                </div>

                <div className="flex items-center gap-4 relative z-10">
                    <div className="flex items-center gap-6 bg-primary/5 backdrop-blur-3xl px-8 py-5 rounded-[2.5rem] border border-primary/20">
                        <div className="flex flex-col items-center">
                            <span className="text-[10px] font-black uppercase tracking-widest text-primary/60 mb-0.5">Frequency</span>
                            <span className="text-xl font-black tracking-tighter">2.4 GHz</span>
                        </div>
                        <div className="w-px h-10 bg-primary/20" />
                        <div className="flex flex-col items-center">
                            <span className="text-[10px] font-black uppercase tracking-widest text-primary/60 mb-0.5">Uplink</span>
                            <span className="text-xl font-black text-emerald-400">ACTIVE</span>
                        </div>
                    </div>
                </div>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full space-y-8">
                <div className="sticky top-0 z-50 py-2">
                    <TabsList className="flex items-center justify-start bg-muted/20 backdrop-blur-3xl border border-border/40 p-2 rounded-2xl w-fit overflow-x-auto no-scrollbar">
                        {[
                            { id: "json", label: "JSON", icon: FileJson },
                            { id: "base64", label: "BASE64", icon: Binary },
                            { id: "jwt", label: "JWT", icon: Key },
                            { id: "regex", label: "REGEX", icon: Search },
                            { id: "ids", label: "IDs", icon: Fingerprint },
                            { id: "units", label: "UNITS", icon: Ruler },
                            { id: "colors", label: "COLORS", icon: Palette },
                        ].map((tab) => (
                            <TabsTrigger
                                key={tab.id}
                                value={tab.id}
                                className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground h-12 px-6 rounded-xl gap-3 transition-all font-black uppercase tracking-widest text-[10px]"
                            >
                                <tab.icon className="h-4 w-4" /> {tab.label}
                            </TabsTrigger>
                        ))}
                    </TabsList>
                </div>

                <AnimatePresence mode="wait">
                    <motion.div
                        key={activeTab}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ duration: 0.3 }}
                    >
                        {/* JSON Formatter */}
                        <TabsContent value="json" className="mt-0 outline-none">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 h-[600px]">
                                <Card className="glass-premium flex flex-col h-full group">
                                    <CardHeader className="relative z-10 flex flex-row items-center justify-between bg-muted/20 border-b border-border/40 px-6 py-4">
                                        <CardTitle className="text-[11px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 flex items-center gap-2">
                                            <Braces className="h-4 w-4" /> Input Buffer
                                        </CardTitle>
                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary" onClick={() => setJsonInput("")}>
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </CardHeader>
                                    <CardContent className="flex-1 p-0 relative h-full">
                                        <Textarea
                                            placeholder="Paste raw sequence data here..."
                                            className="absolute inset-0 w-full h-full resize-none p-8 font-mono text-sm bg-transparent border-none focus-visible:ring-0 z-10 leading-relaxed placeholder:italic placeholder:text-muted-foreground/20"
                                            value={jsonInput}
                                            onChange={(e) => setJsonInput(e.target.value)}
                                        />
                                        <div className="absolute bottom-6 right-6 z-20">
                                            <Button className="h-12 px-8 rounded-xl font-black uppercase tracking-widest text-[10px] shadow-2xl" onClick={formatJson}>
                                                <RefreshCw className="mr-3 h-4 w-4" /> Sync Format
                                            </Button>
                                        </div>
                                    </CardContent>
                                </Card>
                                <Card className="glass-premium flex flex-col h-full">
                                    <CardHeader className="relative z-10 flex flex-row items-center justify-between bg-muted/20 border-b border-border/40 px-6 py-4">
                                        <CardTitle className="text-[11px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 flex items-center gap-2">
                                            <Command className="h-4 w-4" /> Processed Output
                                        </CardTitle>
                                        <Button variant="ghost" size="sm" className="h-8 px-3 text-muted-foreground hover:text-primary font-black uppercase tracking-widest text-[9px]" onClick={() => copyToClipboard(jsonOutput)}>
                                            <Copy className="h-3 w-3 mr-2" /> Clone
                                        </Button>
                                    </CardHeader>
                                    <CardContent className="flex-1 p-0 relative h-full overflow-hidden">
                                        <ScrollArea className="h-full w-full">
                                            <pre className="p-8 font-mono text-sm leading-relaxed text-indigo-400 min-h-full">
                                                {jsonOutput || "// Waiting for sync..."}
                                            </pre>
                                        </ScrollArea>
                                    </CardContent>
                                </Card>
                            </div>
                        </TabsContent>

                        {/* Base64 Tool */}
                        <TabsContent value="base64" className="mt-0 outline-none">
                            <Card className="glass-premium max-w-4xl mx-auto overflow-hidden">
                                <CardHeader className="p-8 bg-muted/20 border-b border-border/40 flex flex-row items-center justify-between">
                                    <div className="space-y-1">
                                        <CardTitle className="text-2xl font-black tracking-tight">BASE64 TRANSLATOR</CardTitle>
                                        <CardDescription className="text-xs font-black uppercase tracking-widest opacity-50">Symmetry-based sequence encoding</CardDescription>
                                    </div>
                                    <div className="flex gap-2 bg-background/50 p-1.5 rounded-2xl border border-border/40">
                                        <button
                                            className={cn("px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all", b64Mode === "encode" ? "bg-primary text-primary-foreground shadow-lg" : "text-muted-foreground hover:text-foreground")}
                                            onClick={() => setB64Mode("encode")}
                                        >
                                            Encode
                                        </button>
                                        <button
                                            className={cn("px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all", b64Mode === "decode" ? "bg-primary text-primary-foreground shadow-lg" : "text-muted-foreground hover:text-foreground")}
                                            onClick={() => setB64Mode("decode")}
                                        >
                                            Decode
                                        </button>
                                    </div>
                                </CardHeader>
                                <CardContent className="p-8 space-y-8">
                                    <div className="space-y-4">
                                        <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 ml-1">Input Stream</Label>
                                        <Textarea
                                            placeholder={b64Mode === "encode" ? "Enter plain protocols..." : "Enter encoded sequence..."}
                                            className="min-h-[150px] font-mono text-lg bg-muted/20 p-6 rounded-2xl border-border/40 focus-visible:ring-primary/20"
                                            value={b64Input}
                                            onChange={(e) => setB64Input(e.target.value)}
                                        />
                                    </div>
                                    <Button className="w-full h-16 rounded-2xl font-black uppercase tracking-widest text-[11px] shadow-2xl shadow-primary/10 transition-transform active:scale-[0.98]" onClick={handleBase64}>
                                        <Zap className="mr-3 h-5 w-5 fill-primary-foreground" /> Initializing Translation
                                    </Button>
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between ml-1">
                                            <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60">Resolved Matrix</Label>
                                            <Button variant="ghost" size="sm" className="h-8 px-3 text-muted-foreground hover:text-primary font-black uppercase tracking-widest text-[9px]" onClick={() => copyToClipboard(b64Output)}>
                                                <Copy className="h-3 w-3 mr-2" /> Duplicate
                                            </Button>
                                        </div>
                                        <div className="p-8 rounded-2xl bg-black/40 border border-white/5 font-mono text-emerald-400 break-all leading-relaxed shadow-inner">
                                            {b64Output || "Awaiting sequence input..."}
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </TabsContent>

                        {/* JWT Decoder */}
                        <TabsContent value="jwt" className="mt-0 outline-none">
                            <div className="grid grid-cols-1 gap-8 max-w-5xl mx-auto">
                                <Card className="glass-premium">
                                    <CardHeader className="p-8 pb-4">
                                        <CardTitle className="text-2xl font-black tracking-tight">JWT ANALYZER</CardTitle>
                                        <CardDescription className="text-xs font-black uppercase tracking-widest opacity-50">Token payload verification hub</CardDescription>
                                    </CardHeader>
                                    <CardContent className="p-8 space-y-6">
                                        <div className="space-y-4">
                                            <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 block">Encoded Handshake</Label>
                                            <Textarea
                                                placeholder="Paste token (header.payload.sig)..."
                                                className="min-h-[120px] font-mono text-sm bg-muted/20 p-6 rounded-2xl border-border/40 focus-visible:ring-primary/20"
                                                value={jwtInput}
                                                onChange={(e) => setJwtInput(e.target.value)}
                                            />
                                        </div>
                                        <Button className="w-full h-16 rounded-2xl font-black uppercase tracking-widest text-[11px]" onClick={decodeJwt}>
                                            <ShieldCheck className="mr-3 h-5 w-5" /> Decrypt Handshake
                                        </Button>
                                    </CardContent>
                                </Card>

                                {jwtOutput && (
                                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                        <Card className="glass-premium border-blue-500/30">
                                            <CardHeader className="pb-4 border-b border-blue-500/10 bg-blue-500/[0.02]">
                                                <CardTitle className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-500">Header Cluster</CardTitle>
                                            </CardHeader>
                                            <CardContent className="p-6">
                                                <pre className="p-6 rounded-2xl bg-black/40 font-mono text-xs text-blue-400 overflow-auto max-h-[300px] border border-blue-500/10">
                                                    {JSON.stringify(jwtOutput.header, null, 2)}
                                                </pre>
                                            </CardContent>
                                        </Card>
                                        <Card className="glass-premium border-purple-500/30">
                                            <CardHeader className="pb-4 border-b border-purple-500/10 bg-purple-500/[0.02]">
                                                <CardTitle className="text-[10px] font-black uppercase tracking-[0.2em] text-purple-500">Payload Cluster</CardTitle>
                                            </CardHeader>
                                            <CardContent className="p-6">
                                                <pre className="p-6 rounded-2xl bg-black/40 font-mono text-xs text-purple-400 overflow-auto max-h-[300px] border border-purple-500/10">
                                                    {JSON.stringify(jwtOutput.payload, null, 2)}
                                                </pre>
                                            </CardContent>
                                        </Card>
                                    </motion.div>
                                )}
                            </div>
                        </TabsContent>

                        {/* Regex Tester */}
                        <TabsContent value="regex" className="mt-0 outline-none">
                            <Card className="glass-premium max-w-4xl mx-auto">
                                <CardHeader className="p-8 pb-4">
                                    <CardTitle className="text-2xl font-black tracking-tight">PATTERN SCANNER</CardTitle>
                                    <CardDescription className="text-xs font-black uppercase tracking-widest opacity-50">Recursive expression matching unit</CardDescription>
                                </CardHeader>
                                <CardContent className="p-8 space-y-8">
                                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                                        <div className="md:col-span-3 space-y-4">
                                            <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 ml-1">Pattern Oscillator</Label>
                                            <div className="relative">
                                                <span className="absolute left-6 top-1/2 -translate-y-1/2 text-2xl font-black text-primary/40 select-none">/</span>
                                                <Input
                                                    value={regexPattern}
                                                    onChange={(e) => setRegexPattern(e.target.value)}
                                                    className="h-16 pl-12 pr-12 font-mono text-xl bg-muted/20 border-border/40 rounded-2xl focus-visible:ring-primary/20"
                                                    placeholder="expression.segments"
                                                />
                                                <span className="absolute right-6 top-1/2 -translate-y-1/2 text-2xl font-black text-primary/40 select-none">/</span>
                                            </div>
                                        </div>
                                        <div className="space-y-4">
                                            <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 ml-1">Flags</Label>
                                            <Input
                                                value={regexFlags}
                                                onChange={(e) => setRegexFlags(e.target.value)}
                                                className="h-16 font-mono text-xl bg-muted/20 border-border/40 rounded-2xl text-center tracking-[0.5em] text-primary"
                                                placeholder="gim"
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 ml-1">Test Corpus</Label>
                                        <Textarea
                                            placeholder="Input source text for analysis..."
                                            className="min-h-[150px] font-mono text-lg bg-muted/20 p-8 rounded-[2.5rem] border-border/40 focus-visible:ring-primary/20 leading-relaxed"
                                            value={regexInput}
                                            onChange={(e) => setRegexInput(e.target.value)}
                                        />
                                    </div>

                                    <Button className="w-full h-16 rounded-2xl font-black uppercase tracking-widest text-[11px] shadow-2xl" onClick={testRegex}>
                                        <Search className="mr-3 h-5 w-5" /> Execute Scan
                                    </Button>

                                    <div className="space-y-4">
                                        <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 ml-1">Matched Fragments ({regexMatches.length})</Label>
                                        <div className="p-8 rounded-[2rem] bg-black/40 border border-white/5 min-h-[120px] flex flex-wrap gap-3">
                                            {regexMatches.length > 0 ? (
                                                regexMatches.map((match, i) => (
                                                    <motion.span
                                                        key={i}
                                                        initial={{ scale: 0.8, opacity: 0 }}
                                                        animate={{ scale: 1, opacity: 1 }}
                                                        transition={{ delay: i * 0.05 }}
                                                        className="px-4 py-2 bg-primary/10 border border-primary/20 rounded-xl text-xs font-black font-mono text-primary shadow-lg"
                                                    >
                                                        {match}
                                                    </motion.span>
                                                ))
                                            ) : (
                                                <span className="text-muted-foreground text-sm font-medium italic opacity-20 w-full text-center mt-4 uppercase tracking-[0.3em]">No hits localized</span>
                                            )}
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </TabsContent>

                        {/* ID Generator */}
                        <TabsContent value="ids" className="mt-0 outline-none">
                            <Card className="glass-premium max-w-4xl mx-auto">
                                <CardHeader className="p-8">
                                    <CardTitle className="text-2xl font-black tracking-tight uppercase">Identity Synthesis</CardTitle>
                                    <CardDescription className="text-xs font-black uppercase tracking-widest opacity-50">Generate cryptographically secure identifiers</CardDescription>
                                </CardHeader>
                                <CardContent className="p-8 space-y-10">
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                                        {[
                                            { id: "uuid", label: "UUID v4", icon: ShieldCheck, color: "text-blue-500", bg: "bg-blue-500/10" },
                                            { id: "nanoid", label: "Protocol ID", icon: Code, color: "text-purple-500", bg: "bg-purple-500/10" },
                                            { id: "timestamp", label: "TS-Delta", icon: Hash, color: "text-emerald-500", bg: "bg-emerald-500/10" },
                                        ].map((t) => (
                                            <motion.button
                                                key={t.id}
                                                whileHover={{ y: -5 }}
                                                whileTap={{ scale: 0.98 }}
                                                className="h-32 flex flex-col items-center justify-center gap-4 rounded-[2.5rem] border border-border/40 bg-muted/20 hover:bg-muted/40 transition-all hover:border-primary/20 group"
                                                onClick={() => generateIds(t.id as "uuid" | "nanoid" | "timestamp")}
                                            >
                                                <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center transition-all group-hover:scale-110", t.bg, t.color)}>
                                                    <t.icon className="h-6 w-6" />
                                                </div>
                                                <span className="text-[11px] font-black uppercase tracking-widest">{t.label}</span>
                                            </motion.button>
                                        ))}
                                    </div>

                                    <AnimatePresence>
                                        {generatedIds.length > 0 && (
                                            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="space-y-6">
                                                <div className="flex items-center gap-3 px-1">
                                                    <History className="h-4 w-4 text-primary" />
                                                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">Generated Output Stream</Label>
                                                </div>
                                                <div className="space-y-3">
                                                    {generatedIds.map((id, i) => (
                                                        <motion.div
                                                            key={i}
                                                            initial={{ x: 20, opacity: 0 }}
                                                            animate={{ x: 0, opacity: 1 }}
                                                            transition={{ delay: i * 0.05 }}
                                                            className="flex items-center justify-between p-5 rounded-2xl bg-black/40 border border-white/5 hover:border-primary/20 transition-all group/id"
                                                        >
                                                            <code className="text-sm font-black text-indigo-400 font-mono tracking-wider">{id}</code>
                                                            <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl opacity-0 group-hover/id:opacity-100 hover:bg-primary hover:text-white" onClick={() => copyToClipboard(id)}>
                                                                <Copy className="h-4 w-4" />
                                                            </Button>
                                                        </motion.div>
                                                    ))}
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </CardContent>
                            </Card>
                        </TabsContent>

                        {/* Units Converter */}
                        <TabsContent value="units" className="mt-0 outline-none">
                            <Card className="glass-premium max-w-3xl mx-auto">
                                <CardHeader className="p-8">
                                    <CardTitle className="text-2xl font-black tracking-tight">SPATIAL CONVERTER</CardTitle>
                                    <CardDescription className="text-xs font-black uppercase tracking-widest opacity-50">Pixel-to-Relative unit scaling</CardDescription>
                                </CardHeader>
                                <CardContent className="p-8 space-y-10">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                                        <div className="space-y-4">
                                            <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 ml-2">Pixel Amplitude (px)</Label>
                                            <Input type="number" value={pixels} onChange={(e) => setPixels(e.target.value)} className="h-16 rounded-2xl bg-muted/20 border-border/40 font-black text-xl px-6" />
                                        </div>
                                        <div className="space-y-4">
                                            <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 ml-2">Root Basis (px)</Label>
                                            <Input type="number" value={baseSize} onChange={(e) => setBaseSize(e.target.value)} className="h-16 rounded-2xl bg-muted/20 border-border/40 font-black text-xl px-6" />
                                        </div>
                                    </div>
                                    <div className="p-12 rounded-[2.5rem] bg-background/50 border border-primary/20 text-center relative overflow-hidden group">
                                        <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary/40 to-transparent" />
                                        <div className="text-7xl font-black text-primary tracking-tighter drop-shadow-2xl">
                                            {convertPxToRem(pixels, baseSize)}<span className="text-2xl font-black uppercase tracking-widest ml-1 text-primary/40 italic">rem</span>
                                        </div>
                                        <p className="text-[10px] font-black uppercase tracking-[0.4em] text-muted-foreground/40 mt-8">Relative Mapping Initialized</p>
                                    </div>
                                </CardContent>
                            </Card>
                        </TabsContent>

                        {/* Color Palette */}
                        <TabsContent value="colors" className="mt-0 outline-none">
                            <Card className="glass-premium max-w-4xl mx-auto">
                                <CardHeader className="p-8">
                                    <CardTitle className="text-2xl font-black tracking-tight uppercase">Spectrum Synthesizer</CardTitle>
                                    <CardDescription className="text-xs font-black uppercase tracking-widest opacity-50">Chromatic variance generation</CardDescription>
                                </CardHeader>
                                <CardContent className="p-8 space-y-10">
                                    <div className="flex gap-4 p-4 rounded-3xl bg-muted/20 border border-border/40">
                                        <div className="relative w-24 h-16 rounded-2xl overflow-hidden border border-border/40 shrink-0">
                                            <Input type="color" value={baseColor} onChange={(e) => setBaseColor(e.target.value)} className="absolute inset-x-[-20%] inset-y-[-20%] w-[140%] h-[140%] cursor-pointer p-0" />
                                        </div>
                                        <Input
                                            value={baseColor}
                                            onChange={(e) => setBaseColor(e.target.value)}
                                            className="h-16 font-mono text-xl font-black bg-transparent border-none focus-visible:ring-0 uppercase tracking-widest"
                                        />
                                        <Button className="h-16 px-10 rounded-2xl font-black uppercase tracking-widest text-[11px] shadow-2xl" onClick={() => generatePalette(baseColor)}>
                                            Synthesize
                                        </Button>
                                    </div>
                                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
                                        {palette.length > 0 ? palette.map((c, i) => (
                                            <motion.div
                                                key={i}
                                                initial={{ scale: 0.9, opacity: 0 }}
                                                animate={{ scale: 1, opacity: 1 }}
                                                transition={{ delay: i * 0.05 }}
                                                className="space-y-4 group/color"
                                            >
                                                <div
                                                    className="h-32 rounded-[2rem] cursor-pointer transition-all duration-500 hover:scale-105 active:scale-95 shadow-2xl border border-white/5 relative overflow-hidden"
                                                    style={{ backgroundColor: c }}
                                                    onClick={() => copyToClipboard(c)}
                                                >
                                                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover/color:opacity-100 bg-black/20 backdrop-blur-sm transition-all">
                                                        <Copy className="h-6 w-6 text-white" />
                                                    </div>
                                                </div>
                                                <p className="text-[10px] text-center font-black font-mono uppercase tracking-widest opacity-40 group-hover/color:opacity-100 group-hover/color:text-primary transition-all">{c}</p>
                                            </motion.div>
                                        )) : (
                                            <div className="col-span-5 py-20 flex flex-col items-center justify-center border-2 border-dashed border-border/40 rounded-[3rem] text-muted-foreground/20 italic">
                                                <Palette className="h-12 w-12 mb-4" />
                                                <span className="font-black uppercase tracking-widest">Awaiting Chromatic Input</span>
                                            </div>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        </TabsContent>
                    </motion.div>
                </AnimatePresence>
            </Tabs>
        </div >
    );
}
