import { useState, useEffect } from "react";
import {
    Palette,
    Copy,
    RefreshCcw,
    Download,
    Moon,
    Sun
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

type Scale = Record<number, string>;

export default function ThemeForge() {
    const { toast } = useToast();
    const [baseColor, setBaseColor] = useState("#6366f1");
    const [palette, setPalette] = useState<Scale>({});
    const [previewMode, setPreviewMode] = useState<"light" | "dark">("light");

    useEffect(() => {
        generatePalette(baseColor);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [baseColor]);

    // Color Utility Functions
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
        // A simplified algorithm to generate tailwind-like scales
        // In a real app we'd use HSL or OKLCH for better perception consistency
        const { r, g, b } = hexToRgb(hex);

        const scale: Scale = {};
        const steps = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950];

        steps.forEach(step => {
            // Simple interpolation logic
            // 50 = almost white, 500 = base, 950 = almost black
            let factor;
            let targetR, targetG, targetB;

            if (step < 500) {
                // Tint (mix with white)
                factor = (500 - step) / 500; // 0.9 for 50, 0 for 500
                targetR = r + (255 - r) * factor;
                targetG = g + (255 - g) * factor;
                targetB = b + (255 - b) * factor;
            } else if (step > 500) {
                // Shade (mix with black)
                factor = (step - 500) / 500; // 0.1 for 600, 0.9 for 950
                targetR = r * (1 - factor);
                targetG = g * (1 - factor);
                targetB = b * (1 - factor);
            } else {
                targetR = r;
                targetG = g;
                targetB = b;
            }
            scale[step] = rgbToHex(targetR, targetG, targetB);
        });
        setPalette(scale);
    };

    const copyConfig = () => {
        const config = `colors: {
  brand: {
${Object.entries(palette).map(([k, v]) => `    ${k}: '${v}',`).join('\n')}
  },
}`;
        navigator.clipboard.writeText(config);
        toast({ title: "Config Copied", description: "Paste into tailwind.config.js" });
    };

    const copyHex = (hex: string) => {
        navigator.clipboard.writeText(hex);
        toast({ title: "Color Copied", description: `${hex}` });
    };

    return (
        <div className="space-y-6 animate-fade-in p-6 h-[calc(100vh-2rem)] flex flex-col">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex flex-col gap-2">
                    <h1 className="text-3xl font-bold flex items-center gap-3">
                        <Palette className="h-8 w-8 text-purple-500" />
                        ThemeForge
                    </h1>
                    <p className="text-muted-foreground">Generate comprehensive Tailwind color scales instantly.</p>
                </div>

                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 bg-muted p-1 rounded-full px-3">
                        <Sun className="h-4 w-4" />
                        <Switch
                            checked={previewMode === "dark"}
                            onCheckedChange={(c) => setPreviewMode(c ? "dark" : "light")}
                        />
                        <Moon className="h-4 w-4" />
                    </div>
                    <Button variant="outline" className="gap-2" onClick={copyConfig}>
                        <Download className="h-4 w-4" /> Export Config
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 flex-1">
                {/* Generator Panel */}
                <div className="lg:col-span-1 space-y-6">
                    <Card className="glass-card">
                        <CardHeader>
                            <CardTitle>Base Color</CardTitle>
                            <CardDescription>Choose your primary brand color.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="flex gap-4">
                                <div
                                    className="w-20 h-20 rounded-xl shadow-lg border-4 border-background ring-2 ring-border"
                                    style={{ backgroundColor: baseColor }}
                                />
                                <div className="flex-1 space-y-2">
                                    <Label>Hex Code</Label>
                                    <div className="relative">
                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">#</span>
                                        <Input
                                            value={baseColor.replace("#", "")}
                                            onChange={(e) => setBaseColor(`#${e.target.value}`)}
                                            className="pl-6 font-mono"
                                            maxLength={7}
                                        />
                                    </div>
                                    <input
                                        type="color"
                                        value={baseColor}
                                        onChange={(e) => setBaseColor(e.target.value)}
                                        className="w-full h-8 cursor-pointer rounded overflow-hidden"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-5 gap-2">
                                {["#ef4444", "#f97316", "#eab308", "#22c55e", "#06b6d4", "#3b82f6", "#6366f1", "#a855f7", "#ec4899", "#64748b"].map(c => (
                                    <button
                                        key={c}
                                        className="w-8 h-8 rounded-full border border-white/10 hover:scale-110 transition-transform shadow-sm"
                                        style={{ backgroundColor: c }}
                                        onClick={() => setBaseColor(c)}
                                    />
                                ))}
                            </div>
                        </CardContent>
                    </Card>

                    <div className="space-y-2">
                        <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground ml-1">Generated Scale</h3>
                        <div className="space-y-1">
                            {Object.entries(palette).map(([step, hex]) => (
                                <div
                                    key={step}
                                    className="h-10 rounded-lg flex items-center justify-between px-4 cursor-pointer hover:scale-[1.02] transition-transform group"
                                    style={{ backgroundColor: hex, color: parseInt(step) > 400 ? 'white' : 'black' }}
                                    onClick={() => copyHex(hex)}
                                >
                                    <span className="text-xs font-bold">{step}</span>
                                    <span className="text-xs font-mono opacity-60 group-hover:opacity-100">{hex}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Preview Panel */}
                <div className="lg:col-span-2 space-y-6">
                    <Card className={cn(
                        "h-full transition-colors duration-500",
                        previewMode === "dark" ? "bg-slate-950 border-slate-800" : "bg-white border-slate-200"
                    )}
                    >
                        <CardHeader className="border-b">
                            <div className="flex items-center gap-2">
                                <div className="h-3 w-3 rounded-full bg-red-400" />
                                <div className="h-3 w-3 rounded-full bg-amber-400" />
                                <div className="h-3 w-3 rounded-full bg-emerald-400" />
                            </div>
                        </CardHeader>
                        <CardContent className="p-8 space-y-12">
                            {/* Typography Section */}
                            <div className="space-y-4">
                                <h2 className={cn("text-4xl font-extrabold tracking-tight", previewMode === "dark" ? "text-white" : "text-slate-900")}>
                                    Build faster with <span style={{ color: palette[500] }}>ThemeForge.</span>
                                </h2>
                                <p className={cn("text-xl max-w-lg", previewMode === "dark" ? "text-slate-400" : "text-slate-500")}>
                                    A color palette tool for modern interfaces. Visualize your brand across components instantly.
                                </p>
                                <div className="flex gap-4">
                                    <button
                                        className="px-6 py-2.5 rounded-lg font-medium shadow-lg shadow-indigo-500/20 transition-all hover:-translate-y-0.5"
                                        style={{ backgroundColor: palette[600], color: 'white' }}
                                    >
                                        Primary Action
                                    </button>
                                    <button
                                        className="px-6 py-2.5 rounded-lg font-medium border transition-colors hover:bg-slate-50 dark:hover:bg-slate-900"
                                        style={{
                                            borderColor: palette[200],
                                            color: previewMode === "dark" ? palette[300] : palette[700]
                                        }}
                                    >
                                        Secondary
                                    </button>
                                </div>
                            </div>

                            {/* Components Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                {/* Card 1 */}
                                <div className={cn(
                                    "p-6 rounded-2xl border shadow-sm relative overflow-hidden",
                                    previewMode === "dark" ? "bg-slate-900 border-slate-800" : "bg-white border-slate-100"
                                )}>
                                    <div className="absolute top-0 right-0 p-4 opacity-10">
                                        <Palette style={{ color: palette[500], width: 64, height: 64 }} />
                                    </div>
                                    <Badge className="mb-4" style={{ backgroundColor: palette[100], color: palette[700] }}>
                                        New Feature
                                    </Badge>

                                    <h3 className={cn("text-lg font-bold mb-2", previewMode === "dark" ? "text-white" : "text-slate-900")}>
                                        Modern Analytics
                                    </h3>
                                    <p className={cn("text-sm mb-4", previewMode === "dark" ? "text-slate-400" : "text-slate-500")}>
                                        Visualize data with colors that make sense.
                                    </p>
                                    <div className="h-2 w-full rounded-full overflow-hidden" style={{ backgroundColor: palette[100] }}>
                                        <div className="h-full rounded-full w-2/3" style={{ backgroundColor: palette[500] }} />
                                    </div>
                                </div>

                                {/* Card 2 */}
                                <div className={cn(
                                    "p-6 rounded-2xl border shadow-sm relative",
                                    previewMode === "dark" ? "bg-slate-900 border-slate-800" : "bg-white border-slate-100"
                                )}>
                                    <div className="flex items-center gap-4 mb-4">
                                        <div className="h-10 w-10 rounded-full flex items-center justify-center text-white" style={{ backgroundColor: palette[500] }}>
                                            <RefreshCcw className="h-5 w-5" />
                                        </div>
                                        <div>
                                            <h4 className={cn("font-bold", previewMode === "dark" ? "text-white" : "text-slate-900")}>Auto-Sync</h4>
                                            <p className="text-xs text-muted-foreground">Updated just now</p>
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <div className="h-2 w-3/4 rounded bg-slate-100 dark:bg-slate-800" />
                                        <div className="h-2 w-1/2 rounded bg-slate-100 dark:bg-slate-800" />
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
