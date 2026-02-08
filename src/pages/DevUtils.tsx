import { useState, useEffect } from "react";
import {
    Wrench,
    FileCode,
    Binary,
    Hash,
    Clock,
    Palette,
    Copy,
    ArrowRightLeft,
    Sparkles,
    Braces,
    Cpu,
    Zap,
    Terminal,
    Key,
    Lock,
    Unlock,
    Activity,
    Code2,
    Calendar,
    ArrowRight,
    Search,
    ChevronRight,
    RefreshCw,
    Fingerprint
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

export default function DevUtils() {
    const { toast } = useToast();
    const [activeTab, setActiveTab] = useState("json");

    // JSON State
    const [jsonInput, setJsonInput] = useState("");
    const [jsonOutput, setJsonOutput] = useState("");

    // Base64 State
    const [base64Input, setBase64Input] = useState("");
    const [base64Output, setBase64Output] = useState("");

    // UUID State
    const [generatedUuid, setGeneratedUuid] = useState("");

    // Time State
    const [unixTimestamp, setUnixTimestamp] = useState(Math.floor(Date.now() / 1000).toString());
    const [humanTime, setHumanTime] = useState(new Date().toISOString());

    const copyToClipboard = (text: string) => {
        if (!text) return;
        navigator.clipboard.writeText(text);
        toast({ title: "Copied to clipboard", description: "Payload synchronized." });
    };

    const handleJsonFormat = () => {
        try {
            const parsed = JSON.parse(jsonInput);
            setJsonOutput(JSON.stringify(parsed, null, 2));
            toast({ title: "Protocol Formatted", description: "JSON structure optimized." });
        } catch (e) {
            toast({ variant: "destructive", title: "Syntax Error", description: "Malformed JSON detected." });
        }
    };

    const handleJsonMinify = () => {
        try {
            const parsed = JSON.parse(jsonInput);
            setJsonOutput(JSON.stringify(parsed));
            toast({ title: "Protocol Compressed", description: "JSON payload minified." });
        } catch (e) {
            toast({ variant: "destructive", title: "Syntax Error", description: "Malformed JSON detected." });
        }
    };

    const handleBase64Encode = () => {
        try {
            setBase64Output(btoa(base64Input));
            toast({ title: "Encoding Complete", description: "Standard-64 encryption applied." });
        } catch (e) {
            toast({ variant: "destructive", title: "Encoding Failed", description: "Stream corruption detected." });
        }
    };

    const handleBase64Decode = () => {
        try {
            setBase64Output(atob(base64Input));
            toast({ title: "Decoding Complete", description: "Cipher successfully resolved." });
        } catch (e) {
            toast({ variant: "destructive", title: "Decoding Failed", description: "Invalid Base64 sequence." });
        }
    };

    const handleGenerateUuid = () => {
        const uuid = crypto.randomUUID();
        setGeneratedUuid(uuid);
        toast({ title: "New Identity Initialized", description: "V4 UUID generated." });
    };

    const handleTimeConvert = () => {
        try {
            const date = new Date(parseInt(unixTimestamp) * 1000);
            setHumanTime(date.toISOString());
            toast({ title: "Temporal Sync", description: "Unix timestamp converted." });
        } catch (e) {
            toast({ variant: "destructive", title: "Time Parity Error", description: "Invalid timestamp." });
        }
    };

    const handleHumanToUnix = () => {
        try {
            const date = new Date(humanTime);
            setUnixTimestamp(Math.floor(date.getTime() / 1000).toString());
            toast({ title: "Epoch Resolution", description: "ISO date converted to Unix." });
        } catch (e) {
            toast({ variant: "destructive", title: "Format Mismatch", description: "Invalid ISO date string." });
        }
    };

    return (
        <div className="space-y-12 animate-fade-in p-8 max-w-[1400px] mx-auto pb-24 relative overflow-hidden">
            {/* Atmosphere */}
            <div className="absolute top-0 left-1/4 w-[50%] h-[20%] bg-primary/5 blur-[120px] rounded-full pointer-events-none" />

            {/* Tactical Header */}
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-8 border-b border-white/5 pb-12">
                <div className="space-y-4">
                    <div className="flex items-center gap-3">
                        <div className="h-2 w-2 rounded-full bg-primary animate-pulse shadow-[0_0_8px_rgba(var(--primary-rgb),0.5)]" />
                        <span className="text-[10px] font-black uppercase tracking-[0.4em] text-primary/80">DevBox Node: Active</span>
                    </div>
                    <h1 className="text-6xl font-black tracking-tighter flex items-center gap-6">
                        <div className="p-4 bg-primary/10 rounded-[2rem] border border-primary/20 shadow-inner group transition-all">
                            <Terminal className="h-10 w-10 text-primary group-hover:rotate-12 duration-500" />
                        </div>
                        DevBox Control
                    </h1>
                    <p className="text-muted-foreground text-lg max-w-xl font-medium leading-relaxed italic opacity-80">
                        "Real power is the ability to shape the digital ether."
                    </p>
                </div>
                <div className="flex items-center gap-4 bg-primary/5 p-2 rounded-2xl border border-primary/20 backdrop-blur-3xl">
                    <div className="flex items-center gap-3 px-6 py-3 bg-primary/10 rounded-xl border border-primary/20">
                        <Activity className="h-4 w-4 text-primary" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-primary">Core Stability: 99.9%</span>
                    </div>
                </div>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full space-y-10">
                <TabsList className="flex w-full overflow-x-auto p-2 bg-card/40 border border-white/5 backdrop-blur-3xl rounded-[2rem] h-20 items-center justify-start lg:justify-center gap-2 scrollbar-hide">
                    <TabsTrigger value="json" className="gap-3 h-14 px-8 rounded-2xl font-black uppercase tracking-widest text-[10px] data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-2xl transition-all">
                        <Braces className="h-4 w-4" /> Protocol Buffer
                    </TabsTrigger>
                    <TabsTrigger value="base64" className="gap-3 h-14 px-8 rounded-2xl font-black uppercase tracking-widest text-[10px] data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all">
                        <Binary className="h-4 w-4" /> Cipher Engine
                    </TabsTrigger>
                    <TabsTrigger value="uuid" className="gap-3 h-14 px-8 rounded-2xl font-black uppercase tracking-widest text-[10px] data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all">
                        <Key className="h-4 w-4" /> Identity Key
                    </TabsTrigger>
                    <TabsTrigger value="time" className="gap-3 h-14 px-8 rounded-2xl font-black uppercase tracking-widest text-[10px] data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all">
                        <Clock className="h-4 w-4" /> Temporal Portal
                    </TabsTrigger>
                </TabsList>

                <AnimatePresence mode="wait">
                    <motion.div
                        key={activeTab}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ duration: 0.3 }}
                    >
                        {/* Protocol Buffer (JSON) */}
                        <TabsContent value="json" className="mt-0 outline-none">
                            <div className="grid grid-cols-1 xl:grid-cols-2 gap-10 h-auto xl:h-[650px]">
                                <Card className="flex flex-col glass-premium border-white/5 rounded-[3rem] overflow-hidden shadow-2xl group">
                                    <div className="absolute inset-0 bg-dot-pattern opacity-[0.03] pointer-events-none" />
                                    <CardHeader className="p-8 pb-4 flex flex-row items-center justify-between">
                                        <div className="space-y-1">
                                            <CardTitle className="text-sm font-black uppercase tracking-widest text-primary/60">Raw Ingestion</CardTitle>
                                            <CardDescription className="text-xs italic">Feed the machine with JSON</CardDescription>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="flex-1 p-0 relative">
                                        <Textarea
                                            className="h-full resize-none border-0 focus-visible:ring-0 font-mono text-xs p-8 bg-black/40 text-blue-400 placeholder:text-blue-400/20 selection:bg-blue-500/30 leading-relaxed overflow-auto scrollbar-hide"
                                            placeholder="PASTE_JSON_STREAM_HERE..."
                                            value={jsonInput}
                                            onChange={(e) => setJsonInput(e.target.value)}
                                        />
                                        <div className="absolute right-6 bottom-6 flex gap-2">
                                            <Button size="sm" variant="outline" className="h-10 px-6 rounded-xl border-white/10 bg-black/40 hover:bg-white/5 font-black uppercase tracking-widest text-[9px]" onClick={() => setJsonInput("")}>
                                                Purge
                                            </Button>
                                        </div>
                                    </CardContent>
                                </Card>

                                <div className="flex flex-col gap-8 h-full">
                                    <div className="flex p-2 bg-card/40 border border-white/5 rounded-[2rem] gap-2 lg:flex-row flex-col">
                                        <Button onClick={handleJsonFormat} className="h-14 flex-1 rounded-2xl font-black uppercase tracking-widest text-[10px] gap-3 shadow-xl">
                                            <Sparkles className="h-4 w-4" /> Beautify Stream
                                        </Button>
                                        <Button onClick={handleJsonMinify} variant="ghost" className="h-14 flex-1 rounded-2xl font-black uppercase tracking-widest text-[10px] gap-3 border border-white/5 hover:bg-white/5">
                                            <Zap className="h-4 w-4" /> Minify Payload
                                        </Button>
                                    </div>

                                    <Card className="flex-1 flex flex-col glass-premium border-white/5 rounded-[3rem] overflow-hidden shadow-2xl relative group">
                                        <div className="absolute inset-0 bg-dot-pattern opacity-[0.03] pointer-events-none" />
                                        <CardHeader className="p-8 pb-4 flex flex-row items-center justify-between relative z-10">
                                            <div className="space-y-1">
                                                <CardTitle className="text-sm font-black uppercase tracking-widest text-emerald-500/60">Optimized Output</CardTitle>
                                                <CardDescription className="text-xs italic">Validated protocol data</CardDescription>
                                            </div>
                                            <Button variant="ghost" size="icon" className="h-12 w-12 rounded-xl bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500 hover:text-white transition-all shadow-xl shadow-emerald-500/5 group-hover:scale-110" onClick={() => copyToClipboard(jsonOutput)}>
                                                <Copy className="h-5 w-5" />
                                            </Button>
                                        </CardHeader>
                                        <CardContent className="flex-1 p-0">
                                            <Textarea
                                                readOnly
                                                className="h-full resize-none border-0 focus-visible:ring-0 font-mono text-xs p-8 bg-black/80 text-emerald-400 selection:bg-emerald-500/30 leading-relaxed overflow-auto scrollbar-hide"
                                                value={jsonOutput}
                                                placeholder="STRUCTURED_DATA_PENDING..."
                                            />
                                        </CardContent>
                                        <div className="absolute bottom-4 right-8 text-[9px] font-black uppercase tracking-[0.3em] text-emerald-500/20 italic">Validated: Dec - 256</div>
                                    </Card>
                                </div>
                            </div>
                        </TabsContent>

                        {/* Cipher Engine (Base64) */}
                        <TabsContent value="base64" className="mt-0 outline-none">
                            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                                <Card className="lg:col-span-12 glass-premium border-white/5 rounded-[4rem] overflow-hidden p-12 relative overflow-hidden group">
                                    <div className="absolute top-0 right-0 p-12 opacity-5 scale-[3] rotate-12 transition-transform duration-1000 group-hover:rotate-[20deg]">
                                        <Binary className="h-32 w-32" />
                                    </div>
                                    <CardContent className="space-y-10 p-0 relative z-10">
                                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                                            <div className="space-y-6">
                                                <div className="flex items-center gap-4 ml-6">
                                                    <div className="p-3 bg-blue-500/10 rounded-2xl">
                                                        <Unlock className="h-6 w-6 text-blue-500" />
                                                    </div>
                                                    <div className="space-y-1">
                                                        <h3 className="text-xl font-black tracking-tight">Primary Stream</h3>
                                                        <p className="text-xs text-muted-foreground font-medium uppercase tracking-widest opacity-60">Input vector</p>
                                                    </div>
                                                </div>
                                                <Textarea
                                                    value={base64Input}
                                                    onChange={(e) => setBase64Input(e.target.value)}
                                                    className="min-h-[250px] p-8 bg-black/40 border-white/5 rounded-[2.5rem] font-mono text-sm leading-relaxed focus-visible:ring-blue-500/20 selection:bg-blue-500/30"
                                                    placeholder="ENTER_PLAIN_TEXT_OR_BASE64_STREAM..."
                                                />
                                            </div>

                                            <div className="space-y-6">
                                                <div className="flex items-center gap-4 ml-6">
                                                    <div className="p-3 bg-emerald-500/10 rounded-2xl">
                                                        <Lock className="h-6 w-6 text-emerald-500" />
                                                    </div>
                                                    <div className="space-y-1">
                                                        <h3 className="text-xl font-black tracking-tight">Resolved Payload</h3>
                                                        <p className="text-xs text-muted-foreground font-medium uppercase tracking-widest opacity-60">Result vector</p>
                                                    </div>
                                                </div>
                                                <div className="relative group/output">
                                                    <Textarea
                                                        readOnly
                                                        value={base64Output}
                                                        className="min-h-[250px] p-8 bg-black/80 border-white/5 rounded-[2.5rem] font-mono text-sm leading-relaxed text-emerald-400 selection:bg-emerald-500/30"
                                                        placeholder="CIPHER_RESOLUTION_PENDING..."
                                                    />
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="absolute top-6 right-6 h-12 w-12 rounded-xl bg-white/5 hover:bg-emerald-500 hover:text-white transition-all shadow-2xl"
                                                        onClick={() => copyToClipboard(base64Output)}
                                                    >
                                                        <Copy className="h-5 w-5" />
                                                    </Button>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex flex-col lg:flex-row justify-center gap-6 pt-6">
                                            <Button onClick={handleBase64Encode} className="h-16 px-12 rounded-2xl font-black uppercase tracking-[0.2em] text-[10px] gap-4 shadow-xl shadow-blue-500/10">
                                                <ArrowRightLeft className="h-5 w-5" /> Encode Protocol
                                            </Button>
                                            <Button onClick={handleBase64Decode} variant="outline" className="h-16 px-12 rounded-2xl border-emerald-500/20 bg-emerald-500/5 hover:bg-emerald-500 hover:text-white font-black uppercase tracking-[0.2em] text-[10px] gap-4 transition-all duration-500">
                                                <RefreshCw className="h-5 w-5" /> Resolve Stream
                                            </Button>
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>
                        </TabsContent>

                        {/* Identity Key (UUID) */}
                        <TabsContent value="uuid" className="mt-0 outline-none">
                            <Card className="glass-premium border-white/5 rounded-[4rem] max-w-2xl mx-auto shadow-[0_40px_100px_-20px_rgba(0,0,0,0.5)] bg-card/[0.02] border-b-primary/30 border-b-2 overflow-hidden relative group">
                                <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-1000 blur-[120px]" />
                                <CardContent className="p-16 flex flex-col items-center gap-12 text-center relative z-10">
                                    <div className="p-8 rounded-[2.5rem] bg-primary/10 text-primary border border-primary/20 shadow-2xl group-hover:scale-110 group-hover:rotate-12 transition-all duration-700">
                                        <Fingerprint className="h-16 w-16" />
                                    </div>
                                    <div className="space-y-3">
                                        <h2 className="text-4xl font-black tracking-tighter uppercase">V4 Identity Init</h2>
                                        <p className="text-muted-foreground font-medium italic opacity-60">Cryptographically strong random unique identifier.</p>
                                    </div>
                                    <div className="flex items-center gap-4 w-full p-2 bg-black/40 rounded-[2rem] border border-white/5">
                                        <Input
                                            readOnly
                                            value={generatedUuid}
                                            placeholder="INITIALIZE_SEQUENCE..."
                                            className="text-center font-mono text-xl h-16 border-0 focus-visible:ring-0 bg-transparent text-primary tracking-tight"
                                        />
                                        <Button size="icon" className="h-16 w-16 shrink-0 rounded-[1.5rem] shadow-2xl hover:scale-105 transition-all" onClick={() => copyToClipboard(generatedUuid)}>
                                            <Copy className="h-6 w-6" />
                                        </Button>
                                    </div>
                                    <Button size="lg" className="h-16 px-12 rounded-[1.8rem] w-full font-black uppercase tracking-[0.3em] text-[10px] shadow-2xl shadow-primary/20 gap-4" onClick={handleGenerateUuid}>
                                        <Cpu className="h-5 w-5" /> Generate New Identity
                                    </Button>

                                    <div className="flex items-center gap-3 text-[9px] font-black uppercase tracking-widest text-muted-foreground/30 italic">
                                        <Zap className="h-3 w-3 shadow-[0_0_5px_currentColor]" />
                                        Entropy Source: crypto.randomUUID()
                                    </div>
                                </CardContent>
                            </Card>
                        </TabsContent>

                        {/* Temporal Portal (Time) */}
                        <TabsContent value="time" className="mt-0 outline-none">
                            <div className="grid grid-cols-1 xl:grid-cols-2 gap-10">
                                <Card className="glass-premium border-white/5 rounded-[3rem] overflow-hidden p-12 shadow-2xl bg-card/[0.02] group">
                                    <div className="absolute top-0 right-0 p-12 opacity-5 scale-[2.5] rotate-x-12">
                                        <Clock className="h-32 w-32" />
                                    </div>
                                    <CardHeader className="p-0 mb-10 text-center relative z-10">
                                        <div className="inline-flex items-center gap-3 px-6 py-2 bg-primary/10 rounded-full border border-primary/20 mb-6 mx-auto">
                                            <Calendar className="h-3.5 w-3.5 text-primary" />
                                            <span className="text-[10px] font-black uppercase tracking-widest text-primary">Unix Epoch Decoder</span>
                                        </div>
                                        <CardTitle className="text-3xl font-black tracking-tight">Temporal Converter</CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-12 p-0 relative z-10">
                                        <div className="space-y-4">
                                            <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 ml-6">Unix Timestamp (seconds)</Label>
                                            <div className="flex gap-4">
                                                <div className="relative flex-1 group/input">
                                                    <div className="absolute left-6 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within/input:text-primary transition-colors">
                                                        <Terminal className="h-5 w-5" />
                                                    </div>
                                                    <Input
                                                        value={unixTimestamp}
                                                        onChange={(e) => setUnixTimestamp(e.target.value)}
                                                        className="h-16 pl-16 bg-black/40 border-white/5 rounded-2xl font-mono text-lg focus-visible:ring-primary/20"
                                                        placeholder="STAMP_INT..."
                                                    />
                                                </div>
                                                <Button onClick={handleTimeConvert} size="icon" className="h-16 w-16 shrink-0 rounded-2xl shadow-xl hover:bg-primary/80">
                                                    <ChevronRight className="h-6 w-6" />
                                                </Button>
                                            </div>
                                        </div>

                                        <div className="space-y-4">
                                            <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 ml-6">ISO 8601 Human Format</Label>
                                            <div className="flex gap-4">
                                                <div className="relative flex-1 group/input">
                                                    <div className="absolute left-6 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within/input:text-primary transition-colors">
                                                        <Code2 className="h-5 w-5" />
                                                    </div>
                                                    <Input
                                                        value={humanTime}
                                                        onChange={(e) => setHumanTime(e.target.value)}
                                                        className="h-16 pl-16 bg-black/40 border-white/5 rounded-2xl font-mono text-lg focus-visible:ring-primary/20"
                                                        placeholder="YYYY-MM-DD..."
                                                    />
                                                </div>
                                                <Button onClick={handleHumanToUnix} size="icon" variant="outline" className="h-16 w-16 shrink-0 rounded-2xl border-white/5 bg-white/5 hover:bg-white/10 active:scale-95 transition-all">
                                                    <RefreshCw className="h-5 w-5" />
                                                </Button>
                                            </div>
                                        </div>

                                        <div className="flex justify-center gap-6 pt-6">
                                            <Button variant="ghost" className="h-12 px-8 rounded-xl font-black uppercase tracking-widest text-[9px] gap-3 border border-white/5" onClick={() => {
                                                const now = Math.floor(Date.now() / 1000).toString();
                                                setUnixTimestamp(now);
                                                setHumanTime(new Date().toISOString());
                                                toast({ title: "Clock Synchronized", description: "Temporal parity restored." });
                                            }}>
                                                <Activity className="h-4 w-4" /> Reset to Current
                                            </Button>
                                            <Button variant="ghost" className="h-12 px-8 rounded-xl font-black uppercase tracking-widest text-[9px] gap-3 border border-white/5" onClick={() => copyToClipboard(`${unixTimestamp} | ${humanTime}`)}>
                                                <Copy className="h-4 w-4" /> Export Pair
                                            </Button>
                                        </div>
                                    </CardContent>
                                </Card>

                                <Card className="glass-premium border-white/5 rounded-[3rem] overflow-hidden p-12 shadow-2xl bg-primary/5 flex flex-col items-center justify-center text-center space-y-8 relative group">
                                    <div className="absolute inset-0 bg-dot-pattern opacity-[0.05] pointer-events-none" />
                                    <div className="p-8 rounded-[2.5rem] bg-primary/10 text-primary animate-pulse border border-primary/20 shadow-2xl">
                                        <Clock className="h-20 w-20" />
                                    </div>
                                    <div className="space-y-4 relative z-10">
                                        <h3 className="text-4xl font-black tracking-tight uppercase">System Chrono</h3>
                                        <p className="text-muted-foreground font-medium italic text-lg leading-relaxed opacity-60">
                                            The universe evolves relative to the observer. Ensure your timestamps are normalized.
                                        </p>
                                    </div>
                                    <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden relative">
                                        <motion.div
                                            animate={{ x: ["-100%", "100%"] }}
                                            transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                                            className="absolute inset-0 w-1/3 bg-gradient-to-r from-transparent via-primary to-transparent"
                                        />
                                    </div>
                                </Card>
                            </div>
                        </TabsContent>
                    </motion.div>
                </AnimatePresence>
            </Tabs>
        </div>
    );
}
