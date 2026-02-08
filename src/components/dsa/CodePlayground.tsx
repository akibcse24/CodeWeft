import { useState, useRef, useEffect } from "react";
import Editor, { OnMount } from "@monaco-editor/react";
import { Play, Trash2, Terminal, Code2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface CodePlaygroundProps {
    initialCode?: string;
    language?: string;
    height?: string | number;
}

export function CodePlayground({ initialCode = "// Write your code here\nconsole.log('Hello from CodeWeft!');", language = "javascript", height = "500px" }: CodePlaygroundProps) {
    const [code, setCode] = useState(initialCode);
    const [output, setOutput] = useState<string[]>([]);
    const [selectedLanguage, setSelectedLanguage] = useState(language);
    const [isRunning, setIsRunning] = useState(false);
    const editorRef = useRef<Parameters<OnMount>[0] | null>(null);

    const handleEditorDidMount: OnMount = (editor) => {
        editorRef.current = editor;
    };

    const runCode = async () => {
        if (selectedLanguage !== "javascript") {
            toast.error("Execution is currently only supported for JavaScript.");
            return;
        }

        setIsRunning(true);
        setOutput([]);

        // Capture console.log
        const logs: string[] = [];
        const originalLog = console.log;
        const originalError = console.error;
        const originalWarn = console.warn;

        console.log = (...args) => {
            logs.push(args.map(arg =>
                typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
            ).join(' '));
        };

        console.error = (...args) => {
            logs.push(`Error: ${args.map(arg => String(arg)).join(' ')}`);
        };

        console.warn = (...args) => {
            logs.push(`Warning: ${args.map(arg => String(arg)).join(' ')}`);
        };

        try {
            // Use a safe-ish eval or Function constructor
            // Note: This runs in the browser context, so it has access to window, etc. 
            // For a production app, use a sandboxed iframe or web worker.
            const run = new Function(code);
            run();
        } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            logs.push(`Runtime Error: ${errorMessage}`);
        } finally {
            console.log = originalLog;
            console.error = originalError;
            console.warn = originalWarn;
            setOutput(logs.length > 0 ? logs : ["No output"]);
            setIsRunning(false);
        }
    };

    const clearOutput = () => {
        setOutput([]);
    };

    return (
        <Card className="flex flex-col h-full border-none shadow-none md:border md:shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between py-3 px-4 border-b">
                <div className="flex items-center gap-2">
                    <Code2 className="h-5 w-5 text-primary" />
                    <CardTitle className="text-base">Code Playground</CardTitle>
                </div>
                <div className="flex items-center gap-2">
                    <Select value={selectedLanguage} onValueChange={setSelectedLanguage}>
                        <SelectTrigger className="w-[120px] h-8">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="javascript">JavaScript</SelectItem>
                            <SelectItem value="typescript">TypeScript</SelectItem>
                            <SelectItem value="python">Python</SelectItem>
                            <SelectItem value="html">HTML</SelectItem>
                            <SelectItem value="css">CSS</SelectItem>
                        </SelectContent>
                    </Select>
                    <Button
                        size="sm"
                        onClick={runCode}
                        disabled={isRunning || selectedLanguage !== "javascript"}
                        className="h-8"
                    >
                        <Play className="mr-2 h-3.5 w-3.5" />
                        Run
                    </Button>
                </div>
            </CardHeader>
            <CardContent className="p-0 flex-1 h-[500px]">
                <ResizablePanelGroup direction="vertical">
                    <ResizablePanel defaultSize={70}>
                        <Editor
                            height="100%"
                            defaultLanguage={selectedLanguage}
                            language={selectedLanguage}
                            value={code}
                            onChange={(value) => setCode(value || "")}
                            theme="vs-dark"
                            onMount={handleEditorDidMount}
                            options={{
                                minimap: { enabled: false },
                                fontSize: 14,
                                scrollBeyondLastLine: false,
                                automaticLayout: true,
                            }}
                            className="py-2"
                        />
                    </ResizablePanel>
                    <ResizableHandle />
                    <ResizablePanel defaultSize={30}>
                        <div className="h-full flex flex-col bg-slate-950 text-slate-50 font-mono text-sm">
                            <div className="flex items-center justify-between px-4 py-2 bg-slate-900 border-b border-slate-800">
                                <div className="flex items-center gap-2 text-muted-foreground">
                                    <Terminal className="h-4 w-4" />
                                    <span>Console Output</span>
                                </div>
                                <Button variant="ghost" size="icon" className="h-6 w-6 hover:bg-slate-800" onClick={clearOutput}>
                                    <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                            </div>
                            <div className="flex-1 overflow-auto p-4 space-y-1">
                                {output.length === 0 ? (
                                    <span className="text-slate-500 italic">Output will appear here...</span>
                                ) : (
                                    output.map((line, i) => (
                                        <div key={i} className={cn("whitespace-pre-wrap break-all", line.startsWith("Error:") ? "text-red-400" : line.startsWith("Warning:") ? "text-yellow-400" : "text-green-400")}>
                                            <span className="text-slate-600 mr-2 select-none">$</span>
                                            {line}
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </ResizablePanel>
                </ResizablePanelGroup>
            </CardContent>
        </Card>
    );
}
