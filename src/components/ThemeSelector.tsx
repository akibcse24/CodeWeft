import { useTheme, Theme } from "@/hooks/use-theme";
import { Check, Moon, Sun, Monitor, Laptop, Zap, Leaf } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export function ThemeSelector() {
    const { theme, setTheme } = useTheme();

    const themes: { value: Theme; label: string; icon: React.ReactNode; color: string }[] = [
        { value: "light", label: "Light", icon: <Sun className="h-4 w-4" />, color: "bg-white border-slate-200" },
        { value: "dark", label: "Dark", icon: <Moon className="h-4 w-4" />, color: "bg-slate-950 border-slate-800" },
        { value: "system", label: "System", icon: <Monitor className="h-4 w-4" />, color: "bg-slate-100 border-slate-300" },
        { value: "cyberpunk", label: "Cyberpunk", icon: <Zap className="h-4 w-4" />, color: "bg-[#1a0b2e] border-[#ff00ff]" },
        { value: "professional", label: "Professional", icon: <Laptop className="h-4 w-4" />, color: "bg-[#0b1121] border-[#3b82f6]" },
        { value: "nature", label: "Nature", icon: <Leaf className="h-4 w-4" />, color: "bg-[#f0fdf4] border-[#16a34a]" },
    ];

    return (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {themes.map((t) => (
                <Card
                    key={t.value}
                    className={cn(
                        "cursor-pointer overflow-hidden transition-all hover:ring-2 hover:ring-primary/50 relative",
                        theme === t.value && "ring-2 ring-primary shadow-lg"
                    )}
                    onClick={() => setTheme(t.value)}
                >
                    <div className={cn("h-24 w-full flex items-center justify-center", t.color)}>
                        <div className={cn(
                            "rounded-full p-2 bg-background/50 backdrop-blur-sm",
                            theme === t.value ? "text-primary" : "text-foreground"
                        )}>
                            {t.icon}
                        </div>
                    </div>
                    <div className="p-3 bg-card flex items-center justify-between">
                        <span className="font-medium text-sm">{t.label}</span>
                        {theme === t.value && <Check className="h-4 w-4 text-primary" />}
                    </div>
                </Card>
            ))}
        </div>
    );
}
