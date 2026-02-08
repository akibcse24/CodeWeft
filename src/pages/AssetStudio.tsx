import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Box,
    Upload,
    Copy,
    Trash2,
    Maximize2,
    Code,
    Component,
    Type,
    Palette,
    Check,
    RefreshCw,
    Eye,
    Settings2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

export default function AssetStudio() {
    const { toast } = useToast();
    const [svgInput, setSvgInput] = useState("");
    const [activeTab, setActiveTab] = useState("preview");
    const [copiedType, setCopiedType] = useState<string | null>(null);
    const [accentColor, setAccentColor] = useState("#6366f1");

    const copyCode = (type: "raw" | "react") => {
        let content = svgInput;
        if (type === "react") {
            // Very basic transformation for demo
            content = svgInput
                .replace(/class=/g, "className=")
                .replace(/stroke-width=/g, "strokeWidth=")
                .replace(/fill-opacity=/g, "fillOpacity=");
            content = `const Icon = (props: React.SVGProps<SVGSVGElement>) => (\n  ${content.split('\n').join('\n  ')}\n);`;
        }
        navigator.clipboard.writeText(content);
        setCopiedType(type);
        toast({ title: "Copied!", description: `${type === 'react' ? 'React Component' : 'Raw SVG'} copied.` });
        setTimeout(() => setCopiedType(null), 2000);
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file && file.type === "image/svg+xml") {
            const reader = new FileReader();
            reader.onload = (event) => {
                setSvgInput(event.target?.result as string);
            };
            reader.readAsText(file);
        } else {
            toast({ title: "Invalid File", description: "Please upload an SVG file.", variant: "destructive" });
        }
    };

    return (
        <div className="space-y-6 animate-fade-in p-6">
            <div className="flex flex-col gap-2">
                <h1 className="text-3xl font-bold flex items-center gap-3">
                    <Box className="h-8 w-8 text-rose-500" />
                    Asset Studio
                </h1>
                <p className="text-muted-foreground">Manage, optimize, and transform your UI assets and SVGs.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Left: Editor/Input */}
                <Card className="glass-card flex flex-col h-[600px]">
                    <CardHeader className="pb-3 border-b bg-muted/20">
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle className="text-sm">SVG Input</CardTitle>
                                <CardDescription className="text-[10px]">Paste SVG code or upload a file</CardDescription>
                            </div>
                            <div className="flex gap-2">
                                <Button variant="outline" size="sm" className="h-8 relative overflow-hidden">
                                    <Upload className="h-3 w-3 mr-2" />
                                    Upload SVG
                                    <input
                                        type="file"
                                        className="absolute inset-0 opacity-0 cursor-pointer"
                                        accept=".svg"
                                        onChange={handleFileUpload}
                                    />
                                </Button>
                                <Button variant="ghost" size="sm" className="h-8" onClick={() => setSvgInput("")}>
                                    <Trash2 className="h-3 w-3" />
                                </Button>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="p-0 flex-1 relative">
                        <textarea
                            className="w-full h-full p-4 font-mono text-xs bg-transparent border-none focus:ring-0 resize-none placeholder:text-muted-foreground/30"
                            placeholder='<svg width="100" height="100" ...'
                            value={svgInput}
                            onChange={(e) => setSvgInput(e.target.value)}
                        />
                    </CardContent>
                    <div className="p-4 border-t bg-muted/10 flex gap-2">
                        <Button className="flex-1" onClick={() => copyCode("raw")}>
                            {copiedType === "raw" ? <Check className="h-4 w-4 mr-2" /> : <Copy className="h-4 w-4 mr-2" />}
                            Copy Raw SVG
                        </Button>
                        <Button variant="outline" className="flex-1" onClick={() => copyCode("react")}>
                            {copiedType === "react" ? <Check className="h-4 w-4 mr-2" /> : <Component className="h-4 w-4 mr-2" />}
                            Copy React
                        </Button>
                    </div>
                </Card>

                {/* Right: Preview & Tools */}
                <div className="space-y-6">
                    <Card className="glass-card overflow-hidden h-[400px] flex flex-col">
                        <div className="bg-muted/30 px-4 py-2 border-b flex items-center justify-between">
                            <span className="text-xs font-semibold flex items-center gap-2">
                                <Eye className="h-3 w-3" /> Preview
                            </span>
                            <div className="flex gap-4">
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 rounded-full" style={{ background: accentColor }} />
                                    <span className="text-[10px] text-muted-foreground">Mock Accent</span>
                                </div>
                            </div>
                        </div>
                        <CardContent className="flex-1 flex items-center justify-center bg-checkered p-8 relative overflow-hidden">
                            {svgInput ? (
                                <div
                                    className="max-w-full max-h-full drop-shadow-2xl transition-all duration-500 hover:scale-110"
                                    dangerouslySetInnerHTML={{ __html: svgInput }}
                                    style={{ color: accentColor }}
                                />
                            ) : (
                                <div className="text-center space-y-3 opacity-20">
                                    <Box className="h-20 w-20 mx-auto" strokeWidth={1} />
                                    <p className="text-sm uppercase tracking-widest font-light">Waiting for input</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    <Card className="glass-card flex-1">
                        <CardHeader className="pb-3 border-b">
                            <CardTitle className="text-sm flex items-center gap-2">
                                <Settings2 className="h-4 w-4" /> Studio Tools
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-4 space-y-6">
                            <div className="space-y-3">
                                <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Adjust Colors</Label>
                                <div className="grid grid-cols-4 gap-2">
                                    {["#6366f1", "#f43f5e", "#10b981", "#f59e0b", "#8b5cf6", "#ec4899", "#06b6d4", "#ffffff"].map(c => (
                                        <button
                                            key={c}
                                            className={cn("h-8 rounded-lg border-2 transition-all", accentColor === c ? "border-primary scale-110" : "border-transparent opacity-80 hover:opacity-100")}
                                            style={{ background: c }}
                                            onClick={() => setAccentColor(c)}
                                        />
                                    ))}
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-4 rounded-xl bg-muted/20 border border-muted-foreground/10 space-y-2">
                                    <div className="flex items-center gap-2 text-primary">
                                        <RefreshCw className="h-3 w-3" />
                                        <span className="text-[10px] font-bold uppercase">Optimizer</span>
                                    </div>
                                    <p className="text-[10px] text-muted-foreground">Minify SVG paths and remove metadata (coming soon).</p>
                                </div>
                                <div className="p-4 rounded-xl bg-muted/20 border border-muted-foreground/10 space-y-2">
                                    <div className="flex items-center gap-2 text-rose-400">
                                        <Palette className="h-3 w-3" />
                                        <span className="text-[10px] font-bold uppercase">Multi-Tint</span>
                                    </div>
                                    <p className="text-[10px] text-muted-foreground">Generate icons in different brand colors automatically.</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
