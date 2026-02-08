import { useState } from "react";
import { Copy, Check, Terminal, Code2, Layers, Type, Table as TableIcon, Hash } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface Snippet {
    id: string;
    name: string;
    description: string;
    code: string;
    category: "structure" | "math" | "tables" | "bib";
}

const SNIPPETS: Snippet[] = [
    {
        id: "abstract",
        name: "Abstract Section",
        category: "structure",
        description: "Standard LaTeX abstract environment",
        code: "\\begin{abstract}\nYour abstract text goes here. It should be a single paragraph that summarizes the problem, method, results, and conclusion.\n\\end{abstract}"
    },
    {
        id: "fig",
        name: "Figure with Caption",
        category: "structure",
        description: "Floating figure environment",
        code: "\\begin{figure}[htbp]\n\\centering\n\\includegraphics[width=\\columnwidth]{image.pdf}\n\\caption{Description of the figure.}\n\\label{fig:my_label}\n\\end{figure}"
    },
    {
        id: "equation",
        name: "Numbered Equation",
        category: "math",
        description: "Standard equation environment",
        code: "\\begin{equation}\n    E = mc^2\n    \\label{eq:einstein}\n\\end{equation}"
    },
    {
        id: "table",
        name: "Simple Table",
        category: "tables",
        description: "A 2x2 tabular environment",
        code: "\\begin{table}[ht]\n\\caption{Example Table}\n\\centering\n\\begin{tabular}{|c|c|}\n\\hline\nHeader 1 & Header 2 \\\\ [0.5ex]\n\\hline\nRow 1, Col 1 & Row 1, Col 2 \\\\\nRow 2, Col 1 & Row 2, Col 2 \\\\\n\\hline\n\\end{tabular}\n\\end{table}"
    },
    {
        id: "cite",
        name: "Standard Citation",
        category: "bib",
        description: "Citing one or more entries",
        code: "\\cite{author2024title}"
    }
];

export default function LaTeXLibrary() {
    const { toast } = useToast();
    const [copiedId, setCopiedId] = useState<string | null>(null);

    const copyToClipboard = (text: string, id: string) => {
        navigator.clipboard.writeText(text);
        setCopiedId(id);
        toast({
            title: "Snippet Copied",
            description: "LaTeX code copied to clipboard",
        });
        setTimeout(() => setCopiedId(null), 2000);
    };

    const categories = [
        { id: "all", label: "All", icon: <Layers className="h-4 w-4" /> },
        { id: "structure", label: "Structure", icon: <Type className="h-4 w-4" /> },
        { id: "math", label: "Math", icon: <Hash className="h-4 w-4" /> },
        { id: "tables", label: "Tables", icon: <TableIcon className="h-4 w-4" /> },
        { id: "bib", label: "Citations", icon: <BookOpen className="h-4 w-4" /> },
    ];

    return (
        <Card className="glass-card border-white/10 shadow-xl overflow-hidden">
            <CardHeader className="bg-muted/30 pb-4">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-lg text-primary">
                        <Code2 className="h-5 w-5" />
                    </div>
                    <div>
                        <CardTitle className="text-lg">LaTeX Snippet Library</CardTitle>
                        <CardDescription className="text-xs">Common formatting templates for manuscripts</CardDescription>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="p-0">
                <Tabs defaultValue="all" className="w-full">
                    <div className="px-4 py-2 border-b border-white/5 bg-muted/10 overflow-x-auto scrollbar-hide">
                        <TabsList className="bg-transparent h-auto p-0 gap-2">
                            {categories.map(cat => (
                                <TabsTrigger
                                    key={cat.id}
                                    value={cat.id}
                                    className="rounded-full px-4 py-1.5 text-[11px] font-bold uppercase tracking-wider data-[state=active]:bg-primary data-[state=active]:text-white transition-all bg-muted/20 border border-white/5"
                                >
                                    <span className="flex items-center gap-2">
                                        {cat.icon} {cat.label}
                                    </span>
                                </TabsTrigger>
                            ))}
                        </TabsList>
                    </div>

                    {categories.map(cat => (
                        <TabsContent key={cat.id} value={cat.id} className="p-4 m-0 max-h-[400px] overflow-y-auto custom-scrollbar">
                            <div className="grid gap-3">
                                {SNIPPETS.filter(s => cat.id === "all" || s.category === cat.id).map(snippet => (
                                    <div key={snippet.id} className="group p-3 rounded-xl bg-muted/20 border border-white/5 hover:border-primary/30 transition-all">
                                        <div className="flex items-start justify-between mb-2">
                                            <div>
                                                <h4 className="text-sm font-bold">{snippet.name}</h4>
                                                <p className="text-[10px] text-muted-foreground">{snippet.description}</p>
                                            </div>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 rounded-lg hover:bg-primary/10 hover:text-primary transition-colors"
                                                onClick={() => copyToClipboard(snippet.code, snippet.id)}
                                            >
                                                {copiedId === snippet.id ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
                                            </Button>
                                        </div>
                                        <div className="relative">
                                            <pre className="text-[10px] font-mono p-3 bg-black/40 rounded-lg overflow-x-auto border border-white/5 text-emerald-400/80">
                                                <code>{snippet.code}</code>
                                            </pre>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </TabsContent>
                    ))}
                </Tabs>
            </CardContent>
        </Card>
    );
}

import { BookOpen } from "lucide-react";
