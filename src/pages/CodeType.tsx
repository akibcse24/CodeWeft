import { useState, useEffect, useCallback, useRef } from "react";
import {
    Keyboard,
    RotateCcw,
    Trophy,
    Play,
    Code,
    Timer,
    CheckCircle2,
    XCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { Progress } from "@/components/ui/progress";

// Snippets Library
const SNIPPETS = {
    REACT_HOOK: {
        title: "React useEffect",
        lang: "javascript",
        code: `useEffect(() => {
  const handleResize = () => {
    setWidth(window.innerWidth);
  };
  window.addEventListener('resize', handleResize);
  return () => {
    window.removeEventListener('resize', handleResize);
  };
}, []);`
    },
    PYTHON_CLASS: {
        title: "Python Class",
        lang: "python",
        code: `class Node:
    def __init__(self, data):
        self.data = data
        self.next = None

class LinkedList:
    def __init__(self):
        self.head = None`
    },
    CSS_GRID: {
        title: "CSS Grid Center",
        lang: "css",
        code: `.container {
  display: grid;
  place-items: center;
  height: 100vh;
  grid-template-columns: repeat(3, 1fr);
  gap: 1rem;
}`
    },
    TYPESCRIPT_INTERFACE: {
        title: "TS Interface",
        lang: "typescript",
        code: `interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'user';
  preferences?: {
    theme: 'light' | 'dark';
  };
}`
    }
};

export default function CodeType() {
    const [activeSnippetKey, setActiveSnippetKey] = useState<keyof typeof SNIPPETS>("REACT_HOOK");
    const [input, setInput] = useState("");
    const [startTime, setStartTime] = useState<number | null>(null);
    const [endTime, setEndTime] = useState<number | null>(null);
    const [wpm, setWpm] = useState(0);
    const [accuracy, setAccuracy] = useState(100);
    const [isFinished, setIsFinished] = useState(false);
    const inputRef = useRef<HTMLTextAreaElement>(null);

    const activeSnippet = SNIPPETS[activeSnippetKey];
    const targetText = activeSnippet.code;

    // Reset logic
    const reset = useCallback(() => {
        setInput("");
        setStartTime(null);
        setEndTime(null);
        setWpm(0);
        setAccuracy(100);
        setIsFinished(false);
        if (inputRef.current) inputRef.current.focus();
    }, []);

    // Handle snippet change
    const handleSnippetChange = (value: string) => {
        setActiveSnippetKey(value as keyof typeof SNIPPETS);
        reset();
    };

    // Typing logic
    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        if (isFinished) return;

        const value = e.target.value;

        // Start timer on first char
        if (!startTime) {
            setStartTime(Date.now());
        }

        // Check completion
        if (value === targetText) {
            const end = Date.now();
            setEndTime(end);
            setIsFinished(true);
            calculateStats(value, startTime || Date.now(), end);
        } else {
            // Calculate live stats roughly
            calculateStats(value, startTime || Date.now(), Date.now());
        }

        setInput(value);
    };

    const calculateStats = (currentInput: string, start: number, end: number) => {
        const timeInMinutes = (end - start) / 60000;
        if (timeInMinutes <= 0) return;

        // WPM: (Characters / 5) / Minutes
        const words = currentInput.length / 5;
        const currentWpm = Math.round(words / timeInMinutes);

        // Accuracy
        let errors = 0;
        for (let i = 0; i < currentInput.length; i++) {
            if (currentInput[i] !== targetText[i]) {
                errors++;
            }
        }
        // const accuracyVal = Math.max(0, 100 - (errors / currentInput.length) * 100); // Simple percentage of current input
        // More robust accuracy: Correct chars / Total typed
        const correctChars = currentInput.length - errors;
        const accuracyVal = currentInput.length > 0 ? Math.round((correctChars / currentInput.length) * 100) : 100;

        setWpm(currentWpm);
        setAccuracy(accuracyVal);
    };

    // Render logic for the visual overlay
    const renderCode = () => {
        return targetText.split("").map((char, index) => {
            let colorClass = "text-muted-foreground/50"; // Default untyped
            let bgClass = "";

            if (index < input.length) {
                if (input[index] === char) {
                    colorClass = "text-emerald-400"; // Correct
                } else {
                    colorClass = "text-red-500"; // Incorrect
                    bgClass = "bg-red-500/10";
                }
            } else if (index === input.length) {
                bgClass = "bg-primary/50 animate-pulse"; // Cursor
                colorClass = "text-foreground";
            }

            return (
                <span key={index} className={cn(colorClass, bgClass, "font-mono")}>
                    {char === "\n" ? "↵\n" : char}
                </span>
            );
        });
    };

    return (
        <div className="space-y-6 animate-fade-in p-6 h-[calc(100vh-2rem)] flex flex-col">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex flex-col gap-2">
                    <h1 className="text-3xl font-bold flex items-center gap-3">
                        <Keyboard className="h-8 w-8 text-emerald-500" />
                        CodeType
                    </h1>
                    <p className="text-muted-foreground">Master code syntax through muscle memory.</p>
                </div>

                <div className="flex items-center gap-4">
                    <Select value={activeSnippetKey} onValueChange={handleSnippetChange}>
                        <SelectTrigger className="w-[200px]">
                            <SelectValue placeholder="Select Snippet" />
                        </SelectTrigger>
                        <SelectContent>
                            {Object.entries(SNIPPETS).map(([key, snippet]) => (
                                <SelectItem key={key} value={key}>{snippet.title}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <Button variant="outline" size="icon" onClick={reset}>
                        <RotateCcw className="h-4 w-4" />
                    </Button>
                </div>
            </div>

            {/* Stats Bar */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card className={cn("transition-all", isFinished ? "bg-emerald-500/10 border-emerald-500/50" : "")}>
                    <CardContent className="pt-4 flex flex-col items-center">
                        <span className="text-xs font-bold text-muted-foreground uppercase">WPM</span>
                        <span className={cn("text-3xl font-mono font-bold", isFinished ? "text-emerald-500" : "")}>{wpm}</span>
                    </CardContent>
                </Card>
                <Card className={cn("transition-all", accuracy < 90 ? "bg-red-500/5" : "")}>
                    <CardContent className="pt-4 flex flex-col items-center">
                        <span className="text-xs font-bold text-muted-foreground uppercase">Accuracy</span>
                        <span className={cn("text-3xl font-mono font-bold", accuracy === 100 ? "text-emerald-500" : accuracy < 90 ? "text-red-500" : "")}>{accuracy}%</span>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-4 flex flex-col items-center">
                        <span className="text-xs font-bold text-muted-foreground uppercase">Progress</span>
                        <span className="text-3xl font-mono font-bold">{Math.round((input.length / targetText.length) * 100)}%</span>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-4 flex flex-col items-center">
                        <span className="text-xs font-bold text-muted-foreground uppercase">Mode</span>
                        <span className="text-xl font-bold mt-1 text-primary">{activeSnippet.lang}</span>
                    </CardContent>
                </Card>
            </div>

            {/* Typing Area */}
            <Card className="flex-1 min-h-0 relative overflow-hidden glass-card border-primary/20">
                <div className="absolute inset-0 p-8 font-mono text-lg leading-relaxed whitespace-pre-wrap">
                    {renderCode()}
                </div>
                <textarea
                    ref={inputRef}
                    className="absolute inset-0 w-full h-full p-8 font-mono text-lg leading-relaxed whitespace-pre-wrap opacity-0 z-10 resize-none cursor-text focus:outline-none"
                    value={input}
                    onChange={handleChange}
                    spellCheck={false}
                    autoFocus
                    onBlur={(e) => {
                        if (!isFinished) e.target.focus(); // Keep focus if possible/desired, or show "Click to focus" logic
                    }}
                />

                {isFinished && (
                    <div className="absolute inset-0 bg-background/80 backdrop-blur-sm z-20 flex flex-col items-center justify-center animate-in fade-in zoom-in-95 duration-300">
                        <Trophy className="h-16 w-16 text-yellow-500 mb-4 animate-bounce" />
                        <h2 className="text-4xl font-bold mb-2">Complete!</h2>
                        <div className="flex gap-8 text-center mb-8">
                            <div>
                                <p className="text-sm text-muted-foreground uppercase">Final WPM</p>
                                <p className="text-3xl font-bold text-emerald-400">{wpm}</p>
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground uppercase">Accuracy</p>
                                <p className="text-3xl font-bold text-blue-400">{accuracy}%</p>
                            </div>
                        </div>
                        <Button size="lg" onClick={reset} className="gap-2">
                            <RotateCcw className="h-4 w-4" /> Try Again
                        </Button>
                    </div>
                )}
            </Card>
        </div>
    );
}
