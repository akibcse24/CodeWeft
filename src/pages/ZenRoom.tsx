import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Moon,
    Volume2,
    VolumeX,
    Wind,
    Droplets,
    Trees,
    Coffee,
    Maximize2,
    Minimize2,
    Trash2,
    Play,
    Pause,
    RotateCcw,
    Sparkles,
    Zap,
    ChevronDown,
    MoreHorizontal,
    Cloudy
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

const AMBIENT_SOUNDS = [
    { id: "rain", name: "Soft Rain", icon: Droplets, color: "text-blue-400", url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3" },
    { id: "forest", name: "Deep Forest", icon: Trees, color: "text-green-400", url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3" },
    { id: "wind", name: "Quiet Wind", icon: Wind, color: "text-slate-400", url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3" },
    { id: "cafe", name: "Study Cafe", icon: Coffee, color: "text-amber-600", url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3" },
];

export default function ZenRoom() {
    const { toast } = useToast();
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [isMuted, setIsMuted] = useState(false);
    const [volume, setVolume] = useState([50]);
    const [activeSound, setActiveSound] = useState<string | null>(null);
    const [thoughtInput, setThoughtInput] = useState("");

    const [currentTime, setCurrentTime] = useState(25 * 60);
    const [timerActive, setTimerActive] = useState(false);
    const audioRef = useRef<HTMLAudioElement | null>(null);

    useEffect(() => {
        let interval: ReturnType<typeof setInterval> | undefined;
        if (timerActive && currentTime > 0) {
            interval = setInterval(() => {
                setCurrentTime((prev) => prev - 1);
            }, 1000);
        } else if (currentTime === 0) {
            setTimerActive(false);
            toast({ title: "Session Complete", description: "Take a deep breath and rest." });
        }
        return () => clearInterval(interval);
    }, [timerActive, currentTime, toast]);

    useEffect(() => {
        if (audioRef.current) {
            audioRef.current.volume = volume[0] / 100;
            audioRef.current.muted = isMuted;
            if (activeSound) {
                audioRef.current.play().catch(console.error);
            } else {
                audioRef.current.pause();
            }
        }
    }, [activeSound, volume, isMuted]);

    const toggleFullscreen = () => {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen().then(() => setIsFullscreen(true));
        } else {
            if (document.exitFullscreen) {
                document.exitFullscreen().then(() => setIsFullscreen(false));
            }
        }
    };

    const handleClearThoughts = () => {
        setThoughtInput("");
        toast({ title: "Mind cleared", description: "Your temporary thoughts have been released." });
    };

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    const currentTrackUrl = AMBIENT_SOUNDS.find(s => s.id === activeSound)?.url;

    return (
        <div className={cn(
            "flex flex-col min-h-screen bg-[#020202] text-slate-100 transition-all duration-1000 selection:bg-white/10 selection:text-white relative",
            isFullscreen ? 'fixed inset-0 z-[100] overflow-hidden' : 'rounded-[3rem] overflow-hidden mb-20 border border-white/5'
        )}>
            {activeSound && <audio ref={audioRef} src={currentTrackUrl} loop />}

            {/* Immersive Atmospheric Layers */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-[-40%] left-[-20%] w-[100%] h-[100%] bg-blue-600/10 rounded-full blur-[200px] animate-pulse-slow" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] bg-purple-600/10 rounded-full blur-[180px] animate-float opacity-50" />
                <div className="absolute top-[20%] right-[10%] w-[40%] h-[40%] bg-indigo-600/5 rounded-full blur-[150px] animate-pulse-slow" />

                {/* Noise/Grain Overlay */}
                <div className="absolute inset-0 bg-transparent opacity-[0.03] grayscale pointer-events-none mix-blend-overlay" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }} />

                <div className="absolute inset-0 bg-dot-pattern opacity-[0.07]" />
                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black" />
            </div>

            {/* Content Container */}
            <div className="relative z-10 flex flex-col min-h-screen">
                {/* Header */}
                <header className="flex items-center justify-between p-10 lg:p-14">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="flex items-center gap-5 group cursor-pointer"
                    >
                        <div className="relative h-12 w-12 flex items-center justify-center">
                            <div className="absolute inset-0 bg-blue-500 blur-2xl opacity-40 group-hover:opacity-100 transition-all duration-700" />
                            <div className="absolute inset-0 bg-white/5 backdrop-blur-3xl rounded-2xl border border-white/10 group-hover:rotate-12 transition-transform duration-500" />
                            <Moon className="h-5 w-5 text-blue-400 relative z-10 animate-float" />
                        </div>
                        <div className="space-y-1">
                            <h1 className="text-[10px] font-black uppercase tracking-[0.5em] text-slate-500 group-hover:text-blue-400 transition-colors duration-500">
                                Zen Laboratory
                            </h1>
                            <div className="flex items-center gap-2">
                                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                                <span className="text-xs font-bold text-slate-400 group-hover:text-slate-100 transition-colors">Phase: Deep Concentration</span>
                            </div>
                        </div>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="flex items-center gap-5 bg-white/[0.03] backdrop-blur-3xl p-2 rounded-2xl border border-white/5"
                    >
                        <Button variant="ghost" size="icon" onClick={toggleFullscreen} className="rounded-xl hover:bg-white/5 h-10 w-10 text-slate-400 hover:text-white transition-all">
                            {isFullscreen ? <Minimize2 className="h-5 w-5" /> : <Maximize2 className="h-5 w-5" />}
                        </Button>
                        <Button variant="ghost" size="icon" className="rounded-xl hover:bg-white/5 h-10 w-10 text-slate-400">
                            <MoreHorizontal className="h-5 w-5" />
                        </Button>
                    </motion.div>
                </header>

                {/* Primary Interaction Area */}
                <main className="flex-1 flex flex-col items-center justify-center px-10 gap-20 lg:gap-32">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="relative flex flex-col items-center group"
                    >
                        <div className="absolute inset-0 bg-blue-500/5 rounded-full blur-[150px] scale-150 animate-pulse opacity-40 pointer-events-none" />

                        {/* The Timer */}
                        <div className="relative scale-100 group-hover:scale-[1.02] transition-transform duration-1000 ease-out">
                            <div className="text-[14rem] md:text-[22rem] font-thin leading-none tracking-tighter text-slate-200 tabular-nums select-none relative z-10 drop-shadow-[0_0_80px_rgba(255,255,255,0.05)]">
                                {formatTime(currentTime)}
                            </div>
                            <div className="absolute -inset-10 flex items-center justify-center opacity-0 group-hover:opacity-10 transition-opacity duration-1000">
                                <div className="w-full h-full rounded-full border border-white/20 animate-spin-slow" />
                            </div>
                        </div>

                        {/* Controls */}
                        <div className="flex items-center gap-10 relative z-20 -mt-10">
                            <div className="h-[2px] w-20 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                            <div className="flex gap-8">
                                <Button
                                    variant="ghost"
                                    className={cn(
                                        "h-24 w-24 rounded-[2.5rem] bg-white/[0.04] backdrop-blur-3xl hover:bg-white/10 border border-white/5 transition-all shadow-2xl group active:scale-95",
                                        timerActive && "border-blue-500/20 shadow-blue-500/10"
                                    )}
                                    onClick={() => setTimerActive(!timerActive)}
                                >
                                    {timerActive
                                        ? <Pause className="h-9 w-9 text-slate-100 fill-slate-100" />
                                        : <Play className="h-9 w-9 text-slate-100 fill-slate-100 translate-x-1" />
                                    }
                                </Button>
                                <Button
                                    variant="ghost"
                                    className="h-24 w-24 rounded-[2.5rem] bg-white/[0.04] backdrop-blur-3xl hover:bg-white/10 border border-white/5 transition-all text-slate-400 group active:scale-95"
                                    onClick={() => { setTimerActive(false); setCurrentTime(25 * 60); }}
                                >
                                    <RotateCcw className="h-7 w-7 group-hover:rotate-[-180deg] transition-transform duration-700" />
                                </Button>
                            </div>
                            <div className="h-[2px] w-20 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                        </div>
                    </motion.div>

                    {/* Dashboard/Controls Panel */}
                    <div className="w-full max-w-7xl animate-slide-up space-y-20 p-1">
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
                            {AMBIENT_SOUNDS.map((sound) => {
                                const Icon = sound.icon;
                                const isActive = activeSound === sound.id;
                                return (
                                    <motion.div key={sound.id} whileHover={{ y: -8, scale: 1.02 }} transition={{ type: "spring", stiffness: 300 }}>
                                        <Button
                                            variant="ghost"
                                            className={cn(
                                                "h-48 w-full flex flex-col items-center justify-center gap-6 rounded-[3rem] border transition-all duration-700 relative overflow-hidden group/card backdrop-blur-3xl",
                                                isActive
                                                    ? 'bg-white/10 border-white/20 shadow-[0_30px_60px_-15px_rgba(0,0,0,0.5)]'
                                                    : 'bg-white/[0.02] border-white/5 hover:bg-white/[0.04] hover:border-white/10'
                                            )}
                                            onClick={() => setActiveSound(isActive ? null : sound.id)}
                                        >
                                            <div className={cn(
                                                "p-5 rounded-3xl transition-all duration-700 ring-1 ring-white/5 shadow-inner",
                                                isActive ? "bg-white/10 scale-110 rotate-12" : "bg-white/5 group-hover/card:scale-110 transition-transform"
                                            )}>
                                                <Icon className={cn("h-8 w-8", isActive ? sound.color : "text-slate-500")} />
                                            </div>
                                            <div className="space-y-1.5 text-center">
                                                <span className="text-[11px] font-black uppercase tracking-[0.3em] text-slate-300">
                                                    {sound.name}
                                                </span>
                                                <div className="flex items-center justify-center gap-1.5">
                                                    <div className={cn("h-1 w-8 rounded-full transition-all duration-700", isActive ? "bg-blue-500" : "bg-white/5")} />
                                                </div>
                                            </div>

                                            {/* Decorative Background for Active */}
                                            {isActive && (
                                                <div className="absolute top-0 right-0 p-4 opacity-20">
                                                    <Sparkles className="h-4 w-4 text-blue-400" />
                                                </div>
                                            )}
                                        </Button>
                                    </motion.div>
                                );
                            })}
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-end pb-20">
                            {/* Sophisticated Volume Master */}
                            <div className="space-y-6">
                                <div className="flex items-center justify-between px-4">
                                    <div className="flex items-center gap-3">
                                        <Volume2 className="h-4 w-4 text-slate-500" />
                                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 italic">Amplitude Control</span>
                                    </div>
                                    <span className="text-[10px] font-black text-slate-300 bg-white/5 px-3 py-1 rounded-full border border-white/5">{volume[0]}%</span>
                                </div>
                                <div className="flex items-center gap-8 bg-white/[0.02] backdrop-blur-3xl px-10 h-24 rounded-[2.5rem] border border-white/5 relative group/volume">
                                    <div className="absolute inset-x-0 bottom-0 h-[2px] bg-gradient-to-r from-transparent via-blue-500/20 to-transparent opacity-0 group-hover/volume:opacity-100 transition-opacity" />
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => setIsMuted(!isMuted)}
                                        className="h-12 w-12 rounded-2xl bg-white/5 text-slate-500 hover:text-white transition-all hover:scale-110 active:scale-90"
                                    >
                                        {isMuted ? <VolumeX className="h-6 w-6" /> : <Volume2 className="h-6 w-6" />}
                                    </Button>
                                    <Slider
                                        value={volume}
                                        onValueChange={setVolume}
                                        max={100}
                                        step={1}
                                        className="flex-1"
                                    />
                                </div>
                            </div>

                            {/* Mind Mirror - Thought Dump */}
                            <div className="space-y-6">
                                <div className="flex items-center justify-between px-4">
                                    <div className="flex items-center gap-3">
                                        <Zap className="h-4 w-4 text-slate-500" />
                                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 italic">Distraction Registry</span>
                                    </div>
                                    <Button variant="ghost" size="sm" onClick={handleClearThoughts} className="h-7 px-4 rounded-full bg-red-500/5 text-[9px] font-black uppercase tracking-widest text-red-400/60 hover:text-red-400 hover:bg-red-500/10 transition-all border border-red-500/10">
                                        <Trash2 className="h-3 w-3 mr-2" /> Release Mind
                                    </Button>
                                </div>
                                <div className="relative group/thought">
                                    <div className="absolute inset-0 bg-blue-500/5 blur-3xl opacity-0 group-hover/thought:opacity-100 transition-opacity" />
                                    <Card className="bg-white/[0.02] border-white/5 backdrop-blur-3xl rounded-[2.5rem] overflow-hidden transition-all hover:bg-white/[0.03] hover:border-white/10 relative z-10">
                                        <CardContent className="p-8">
                                            <Textarea
                                                placeholder="Surface distractions to let them go..."
                                                className="bg-transparent border-none focus-visible:ring-0 min-h-[96px] h-24 resize-none text-slate-300 placeholder:text-slate-700 font-medium text-lg lg:text-xl placeholder:italic leading-normal"
                                                value={thoughtInput}
                                                onChange={(e) => setThoughtInput(e.target.value)}
                                            />
                                        </CardContent>
                                    </Card>
                                </div>
                            </div>
                        </div>
                    </div>
                </main>

                {/* Aesthetic Footer */}
                <footer className="p-10 flex flex-col items-center gap-4">
                    <div className="flex items-center gap-3 px-8 h-10 rounded-full bg-white/[0.03] border border-white/5 backdrop-blur-md">
                        <Wind className="h-3 w-3 text-blue-500 animate-pulse" />
                        <span className="text-[9px] font-black uppercase tracking-[0.6em] text-slate-500">Immersive Engine v2.043 Active</span>
                    </div>
                </footer>
            </div>
        </div>
    );
}
