import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    BarChart2,
    Play,
    RotateCcw,
    Shuffle,
    FastForward,
    Info,
    Cpu,
    Zap,
    Activity,
    Binary,
    ChevronDown,
    Settings2,
    Database,
    Clock,
    Layers
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { ALGORITHMS, COMPLEXITY, DEFAULT_SIZE, DEFAULT_SPEED } from "@/constants/algorithms";




export default function AlgoVisualizer() {
    const [array, setArray] = useState<number[]>([]);
    const [size, setSize] = useState(DEFAULT_SIZE);
    const [speed, setSpeed] = useState(DEFAULT_SPEED);
    const [algorithm, setAlgorithm] = useState<string>(ALGORITHMS.BUBBLE);
    const [isSorting, setIsSorting] = useState(false);
    const [activeIndices, setActiveIndices] = useState<number[]>([]);
    const [comparedIndices, setComparedIndices] = useState<number[]>([]);
    const [swappingIndices, setSwappingIndices] = useState<number[]>([]);
    const [sortedIndices, setSortedIndices] = useState<number[]>([]);

    useEffect(() => {
        resetArray();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [size]);

    const resetArray = () => {
        if (isSorting) return;
        const newArray = Array.from({ length: size }, () => Math.floor(Math.random() * 90) + 10);
        setArray(newArray);
        setActiveIndices([]);
        setComparedIndices([]);
        setSwappingIndices([]);
        setSortedIndices([]);
    };

    const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

    const getDelay = () => Math.max(1, 150 - speed * 1.4);

    const bubbleSort = async () => {
        const arr = [...array];
        const n = arr.length;

        for (let i = 0; i < n; i++) {
            for (let j = 0; j < n - i - 1; j++) {
                setComparedIndices([j, j + 1]);
                await sleep(getDelay());

                if (arr[j] > arr[j + 1]) {
                    setSwappingIndices([j, j + 1]);
                    const temp = arr[j];
                    arr[j] = arr[j + 1];
                    arr[j + 1] = temp;
                    setArray([...arr]);
                    await sleep(getDelay());
                    setSwappingIndices([]);
                }
            }
            setSortedIndices(prev => [...prev, n - i - 1]);
        }
        setSortedIndices(Array.from({ length: n }, (_, i) => i));
        setComparedIndices([]);
        setIsSorting(false);
    };

    const selectionSort = async () => {
        const arr = [...array];
        const n = arr.length;

        for (let i = 0; i < n; i++) {
            let minIdx = i;
            setActiveIndices([i]);

            for (let j = i + 1; j < n; j++) {
                setComparedIndices([minIdx, j]);
                await sleep(getDelay());
                if (arr[j] < arr[minIdx]) {
                    minIdx = j;
                }
            }
            if (minIdx !== i) {
                setSwappingIndices([i, minIdx]);
                [arr[i], arr[minIdx]] = [arr[minIdx], arr[i]];
                setArray([...arr]);
                await sleep(getDelay());
                if (swappingIndices.length) setSwappingIndices([]);
            }
            setSortedIndices(prev => [...prev, i]);
        }
        setComparedIndices([]);
        setActiveIndices([]);
        setSwappingIndices([]);
        setSortedIndices(Array.from({ length: n }, (_, i) => i));
        setIsSorting(false);
    };

    const insertionSort = async () => {
        const arr = [...array];
        const n = arr.length;

        for (let i = 1; i < n; i++) {
            const key = arr[i];
            let j = i - 1;
            setActiveIndices([i]);

            while (j >= 0 && arr[j] > key) {
                setComparedIndices([j, j + 1]);
                await sleep(getDelay());

                arr[j + 1] = arr[j];
                setArray([...arr]);
                setSwappingIndices([j, j + 1]);
                await sleep(getDelay());
                setSwappingIndices([]);
                j = j - 1;
            }
            arr[j + 1] = key;
            setArray([...arr]);
            setSortedIndices(Array.from({ length: i + 1 }, (_, k) => k));
        }
        setSortedIndices(Array.from({ length: n }, (_, i) => i));
        setComparedIndices([]);
        setActiveIndices([]);
        setIsSorting(false);
    };

    const mergeSort = async () => {
        const arr = [...array];
        const n = arr.length;

        const merge = async (start: number, mid: number, end: number) => {
            const left = arr.slice(start, mid + 1);
            const right = arr.slice(mid + 1, end + 1);
            let k = start;
            let i = 0, j = 0;

            while (i < left.length && j < right.length) {
                setComparedIndices([start + i, mid + 1 + j]);
                await sleep(getDelay());

                if (left[i] <= right[j]) {
                    arr[k] = left[i];
                    i++;
                } else {
                    arr[k] = right[j];
                    j++;
                }
                setArray([...arr]);
                setSwappingIndices([k]);
                await sleep(getDelay());
                setSwappingIndices([]);
                k++;
            }

            while (i < left.length) {
                arr[k] = left[i];
                i++;
                setArray([...arr]);
                setSwappingIndices([k]);
                await sleep(getDelay());
                setSwappingIndices([]);
                k++;
            }

            while (j < right.length) {
                arr[k] = right[j];
                j++;
                setArray([...arr]);
                setSwappingIndices([k]);
                await sleep(getDelay());
                setSwappingIndices([]);
                k++;
            }
        };

        const sort = async (start: number, end: number) => {
            if (start >= end) return;
            const mid = Math.floor((start + end) / 2);
            await sort(start, mid);
            await sort(mid + 1, end);
            await merge(start, mid, end);
            if (end - start + 1 === n) {
                // Final merge complete
            } else {
                setSortedIndices(prev => [...new Set([...prev, ...Array.from({ length: end - start + 1 }, (_, i) => start + i)])]);
            }
        };

        await sort(0, n - 1);
        setSortedIndices(Array.from({ length: n }, (_, i) => i));
        setComparedIndices([]);
        setIsSorting(false);
    };

    const quickSort = async () => {
        const arr = [...array];
        const n = arr.length;

        const partition = async (low: number, high: number) => {
            const pivot = arr[high];
            setActiveIndices([high]); // Pivot
            let i = low - 1;

            for (let j = low; j < high; j++) {
                setComparedIndices([j, high]);
                await sleep(getDelay());

                if (arr[j] < pivot) {
                    i++;
                    [arr[i], arr[j]] = [arr[j], arr[i]];
                    setArray([...arr]);
                    setSwappingIndices([i, j]);
                    await sleep(getDelay());
                    setSwappingIndices([]);
                }
            }
            [arr[i + 1], arr[high]] = [arr[high], arr[i + 1]];
            setArray([...arr]);
            setSwappingIndices([i + 1, high]);
            await sleep(getDelay());
            setSwappingIndices([]);
            return i + 1;
        };

        const sort = async (low: number, high: number) => {
            if (low < high) {
                const pi = await partition(low, high);
                setSortedIndices(prev => [...prev, pi]);
                await sort(low, pi - 1);
                await sort(pi + 1, high);
            } else if (low === high) {
                setSortedIndices(prev => [...prev, low]);
            }
        };

        await sort(0, n - 1);
        setSortedIndices(Array.from({ length: n }, (_, i) => i));
        setComparedIndices([]);
        setActiveIndices([]);
        setIsSorting(false);
    };

    const startSort = async () => {
        setIsSorting(true);
        setSortedIndices([]);
        if (algorithm === ALGORITHMS.BUBBLE) await bubbleSort();
        else if (algorithm === ALGORITHMS.SELECTION) await selectionSort();
        else if (algorithm === ALGORITHMS.INSERTION) await insertionSort();
        else if (algorithm === ALGORITHMS.MERGE) await mergeSort();
        else if (algorithm === ALGORITHMS.QUICK) await quickSort();
    };

    return (
        <div className="space-y-12 animate-fade-in max-w-[1600px] mx-auto pb-20 p-8 flex flex-col min-h-screen">
            {/* Scientific Header */}
            <div className="relative group">
                <div className="absolute -left-20 -top-20 w-80 h-80 bg-primary/5 rounded-full blur-[100px] pointer-events-none group-hover:bg-primary/10 transition-colors duration-1000" />
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-12 relative z-10">
                    <div className="space-y-4">
                        <div className="flex items-center gap-3 text-primary animate-pulse">
                            <Cpu className="h-5 w-5" />
                            <span className="text-[10px] font-black uppercase tracking-[0.4em]">Engine Specification: 0xA4F2</span>
                        </div>
                        <h1 className="text-7xl font-black tracking-tighter bg-clip-text text-transparent bg-gradient-to-br from-foreground via-foreground to-foreground/40 leading-none">
                            Array Engine
                        </h1>
                        <p className="text-muted-foreground text-xl max-w-2xl font-medium leading-relaxed italic opacity-80">
                            "The purpose of visualization is insight, not pictures."
                        </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-6">
                        <div className="flex flex-col gap-2">
                            <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/40 ml-4">Processor Protocol</span>
                            <div className="flex p-2 bg-card/40 rounded-[2rem] border border-border/20 backdrop-blur-3xl shadow-2xl">
                                <Select value={algorithm} onValueChange={(v) => !isSorting && setAlgorithm(v)} disabled={isSorting}>
                                    <SelectTrigger className="w-[240px] h-14 bg-transparent border-none rounded-2xl font-black text-lg uppercase tracking-tight focus:ring-0">
                                        <div className="flex items-center gap-3">
                                            <Binary className="h-5 w-5 text-primary" />
                                            <SelectValue />
                                        </div>
                                    </SelectTrigger>
                                    <SelectContent className="glass-premium border-primary/20 rounded-[2rem] p-2 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.5)]">
                                        {Object.values(ALGORITHMS).map(algo => (
                                            <SelectItem key={algo} value={algo} className="rounded-xl font-black uppercase tracking-widest text-[10px] py-3">{algo}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="flex items-center gap-8 px-10 h-20 bg-card/40 rounded-[2rem] border border-border/20 backdrop-blur-3xl shadow-2xl">
                            <div className="flex flex-col gap-1 items-center">
                                <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/60">Time Complexity</span>
                                <Badge variant="outline" className="text-primary text-sm font-black tracking-widest border-primary/20 bg-primary/5 px-4 py-1 rounded-full">{COMPLEXITY[algorithm as keyof typeof COMPLEXITY].time}</Badge>
                            </div>
                            <div className="w-px h-10 bg-border/20 mx-2" />
                            <div className="flex flex-col gap-1 items-center">
                                <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/60">Memory Space</span>
                                <Badge variant="outline" className="text-primary text-sm font-black tracking-widest border-primary/20 bg-primary/5 px-4 py-1 rounded-full">{COMPLEXITY[algorithm as keyof typeof COMPLEXITY].space}</Badge>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Core Visualizer Deck */}
            <Card className="flex-1 glass-premium border-border/30 rounded-[3.5rem] min-h-[600px] flex flex-col overflow-hidden relative group/deck shadow-2xl">
                <div className="absolute inset-0 bg-transparent opacity-[0.03] grayscale pointer-events-none mix-blend-overlay" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }} />
                <div className="absolute inset-0 bg-dot-pattern opacity-[0.05] pointer-events-none" />

                {/* Tactical Control Room */}
                <div className="p-10 border-b border-border/20 bg-card/30 backdrop-blur-3xl relative z-10">
                    <div className="flex flex-col xl:flex-row items-center justify-between gap-12">
                        <div className="flex flex-col md:flex-row items-center gap-16 flex-1 w-full lg:max-w-4xl">
                            <div className="space-y-4 flex-1 w-full">
                                <div className="flex justify-between items-center group/speed cursor-pointer">
                                    <div className="flex items-center gap-2">
                                        <Clock className="h-3 w-3 text-muted-foreground group-hover/speed:text-primary transition-colors" />
                                        <span className="text-[10px] uppercase font-black tracking-[0.3em] text-muted-foreground group-hover/speed:text-primary transition-colors">Tactical Velocity</span>
                                    </div>
                                    <span className="text-primary font-black tabular-nums tracking-widest">{speed}hz</span>
                                </div>
                                <div className="p-2 rounded-2xl bg-white/5 border border-white/5">
                                    <Slider
                                        value={[speed]}
                                        onValueChange={([v]) => setSpeed(v)}
                                        min={1}
                                        max={100}
                                        step={1}
                                        className="py-2"
                                    />
                                </div>
                            </div>
                            <div className="space-y-4 flex-1 w-full">
                                <div className="flex justify-between items-center group/capacity cursor-pointer">
                                    <div className="flex items-center gap-2">
                                        <Database className="h-3 w-3 text-muted-foreground group-hover/capacity:text-primary transition-colors" />
                                        <span className="text-[10px] uppercase font-black tracking-[0.3em] text-muted-foreground group-hover/capacity:text-primary transition-colors">Memory Allocation</span>
                                    </div>
                                    <span className="text-primary font-black tabular-nums tracking-widest">{size} units</span>
                                </div>
                                <div className="p-2 rounded-2xl bg-white/5 border border-white/5">
                                    <Slider
                                        value={[size]}
                                        onValueChange={([v]) => setSize(v)}
                                        min={10}
                                        max={300}
                                        step={10}
                                        disabled={isSorting}
                                        className="py-2"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-5">
                            <Button
                                variant="outline"
                                size="icon"
                                onClick={resetArray}
                                disabled={isSorting}
                                className="h-16 w-16 rounded-[1.5rem] bg-card/40 border-border/20 shadow-inner group hover:border-primary/40 transition-all active:scale-90"
                            >
                                <Shuffle className="h-6 w-6 text-muted-foreground group-hover:text-primary group-hover:rotate-180 transition-all duration-700" />
                            </Button>
                            <Button
                                onClick={startSort}
                                disabled={isSorting}
                                size="lg"
                                className={cn(
                                    "h-16 px-10 rounded-[1.5rem] shadow-2xl transition-all font-black gap-4 text-sm uppercase tracking-widest overflow-hidden relative",
                                    isSorting ? "shadow-primary/5 cursor-wait" : "shadow-primary/20 hover:scale-105 active:scale-95"
                                )}
                            >
                                <div className="flex items-center gap-4 relative z-10">
                                    {isSorting ? <Activity className="h-5 w-5 animate-pulse text-primary-foreground" /> : <Zap className="h-5 w-5 fill-current" />}
                                    {isSorting ? "Sorting Sequence..." : "Initialize Engine"}
                                </div>
                                {isSorting && (
                                    <motion.div
                                        initial={{ x: "-100%" }}
                                        animate={{ x: "100%" }}
                                        transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
                                        className="absolute inset-0 bg-white/10 skew-x-12"
                                    />
                                )}
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Visualization Deck */}
                <CardContent className="flex-1 flex items-end justify-center gap-[2px] p-12 lg:p-20 bg-black/40 relative z-10 group/viz hover:bg-black/50 transition-colors duration-1000">
                    <div className="absolute top-10 left-1/2 -translate-x-1/2 opacity-20 flex items-center gap-3">
                        <Layers className="h-4 w-4" />
                        <span className="text-[10px] font-black uppercase tracking-[0.5em]">Primary Visualization Buffer</span>
                    </div>

                    <AnimatePresence mode="popLayout">
                        {array.map((value, idx) => {
                            const isActive = activeIndices.includes(idx);
                            const isCompared = comparedIndices.includes(idx);
                            const isSwapping = swappingIndices.includes(idx);
                            const isSorted = sortedIndices.includes(idx);

                            return (
                                <motion.div
                                    key={idx}
                                    layout
                                    initial={{ scaleY: 0 }}
                                    animate={{ scaleY: 1 }}
                                    className={cn(
                                        "flex-1 rounded-full transition-all duration-300 relative",
                                        isSwapping ? "bg-gradient-to-t from-red-600 via-rose-500 to-amber-300 shadow-[0_0_35px_rgba(239,68,68,0.6)] z-30" :
                                            isActive ? "bg-gradient-to-t from-primary via-primary/60 to-blue-400 shadow-[0_0_30px_hsla(var(--primary)/0.6)] z-20" :
                                                isCompared ? "bg-gradient-to-t from-amber-500 to-yellow-300 shadow-[0_0_20px_rgba(245,158,11,0.5)] z-10" :
                                                    isSorted ? "bg-gradient-to-t from-emerald-600 via-emerald-400 to-teal-300 shadow-[0_5px_15px_rgba(16,185,129,0.2)]" :
                                                        "bg-white/[0.05] hover:bg-white/[0.15]"
                                    )}
                                    style={{
                                        height: `${value}%`,
                                        opacity: isSorted ? 1 : (isSorting && !isActive && !isCompared && !isSwapping ? 0.3 : 1)
                                    }}
                                >
                                    {isSwapping && (
                                        <motion.div
                                            initial={{ y: 20, opacity: 0 }}
                                            animate={{ y: 0, opacity: 1 }}
                                            className="absolute -top-14 left-1/2 -translate-x-1/2 z-50 pointer-events-none"
                                        >
                                            <div className="bg-red-500 text-white text-[9px] font-black px-3 py-1.5 rounded-full shadow-[0_0_20px_rgba(239,68,68,0.5)] flex items-center gap-1">
                                                <Zap className="h-2 w-2 fill-white" /> SWAP
                                            </div>
                                            <div className="w-px h-6 bg-red-500 mx-auto mt-1" />
                                        </motion.div>
                                    )}
                                </motion.div>
                            );
                        })}
                    </AnimatePresence>
                </CardContent>

                {/* Legend & Analytics Status */}
                <div className="p-10 border-t border-border/20 flex flex-wrap justify-between items-center gap-8 bg-card/40 backdrop-blur-3xl relative z-10">
                    <div className="flex flex-wrap items-center gap-x-14 gap-y-6">
                        {[
                            { label: "Stability Buffer", color: "bg-white/10" },
                            { label: "Comparative Scan", color: "bg-amber-500" },
                            { label: "Active Pointer", color: "bg-primary" },
                            { label: "Atomic Exchange", color: "bg-red-500" },
                            { label: "Validated Entropy", color: "bg-emerald-500" }
                        ].map((legend, i) => (
                            <div key={i} className="flex items-center gap-4 group/legend cursor-help">
                                <div className={cn("w-3 h-3 rounded-full group-hover/legend:scale-150 transition-transform shadow-lg", legend.color)} />
                                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 group-hover/legend:text-foreground transition-colors">{legend.label}</span>
                            </div>
                        ))}
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                        <span className="text-[9px] font-black uppercase tracking-[0.4em] text-muted-foreground/40 italic">Engine Diagnostic: OK_0xDA3</span>
                    </div>
                </div>
            </Card>
        </div>
    );
}
