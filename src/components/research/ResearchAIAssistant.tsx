import { useState } from "react";
import { Sparkles, Send, Loader2, MessageSquare, BookOpen, BrainCircuit, Search, Bot } from "lucide-react";
import { streamCompletion } from "@/services/ai.service";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Paper } from "@/hooks/usePapers";
import { motion, AnimatePresence } from "framer-motion";

interface ChatMessage {
    role: "user" | "assistant";
    content: string;
}

interface ResearchAIAssistantProps {
    papers: Paper[];
}

export default function ResearchAIAssistant({ papers }: ResearchAIAssistantProps) {
    const [messages, setMessages] = useState<ChatMessage[]>([
        { role: "assistant", content: "I'm your Research Assistant. Ask me anything about your library (e.g., 'Summarize my papers on AI' or 'Which papers discuss transformers?')" }
    ]);
    const [input, setInput] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    const handleSend = async () => {
        if (!input.trim() || isLoading) return;

        const userMessage = input.trim();
        setMessages(prev => [...prev, { role: "user", content: userMessage }]);
        setInput("");
        setIsLoading(true);

        try {
            const contextPrompt = `You are a Research Assistant. Here is the metadata of the papers in the user's library:
            ${papers.map(p => `- ${p.title} (${p.publication_year}). Tags: ${p.tags?.join(", ") || "none"}. Summary: ${p.summary?.substring(0, 200)}...`).join("\n")}
            
            Use this context to answer the user's question. If you don't find the answer, answer based on your general knowledge but mention you didn't find specific papers in the library.`;

            const apiMessages: Array<{ role: "system" | "user" | "assistant"; content: string }> = [
                { role: "system" as const, content: contextPrompt },
                ...messages.map(m => ({ role: m.role as "system" | "user" | "assistant", content: m.content })),
                { role: "user" as const, content: userMessage }
            ];

            const stream = await streamCompletion(apiMessages);
            let assistantMessage = "";
            setMessages(prev => [...prev, { role: "assistant", content: "" }]);

            for await (const chunk of stream) {
                const content = chunk.choices[0]?.delta?.content || "";
                assistantMessage += content;
                setMessages(prev => {
                    const newMsg = [...prev];
                    newMsg[newMsg.length - 1].content = assistantMessage;
                    return newMsg;
                });
            }
        } catch (error) {
            console.error("Research AI Error:", error);
            setMessages(prev => [...prev, { role: "assistant", content: "I'm sorry, I encountered an error connecting to the AI service." }]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Card className="glass-card border-white/10 shadow-2xl flex flex-col h-[500px] overflow-hidden">
            <CardHeader className="bg-primary/5 pb-4 border-b border-white/5">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/20 rounded-lg text-primary animate-pulse">
                        <BrainCircuit className="h-5 w-5" />
                    </div>
                    <div>
                        <CardTitle className="text-lg">Research AI</CardTitle>
                        <CardDescription className="text-xs">Query your literature repository</CardDescription>
                    </div>
                </div>
            </CardHeader>

            <CardContent className="flex-1 flex flex-col p-0 overflow-hidden">
                <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar bg-black/5">
                    <AnimatePresence initial={false}>
                        {messages.map((msg, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                className={cn(
                                    "flex gap-3 max-w-[85%]",
                                    msg.role === "user" ? "ml-auto flex-row-reverse" : "mr-auto"
                                )}
                            >
                                <div className={cn(
                                    "p-2 rounded-lg mt-1",
                                    msg.role === "user" ? "bg-primary/20" : "bg-muted/40"
                                )}>
                                    {msg.role === "user" ? <Search className="h-3 w-3" /> : <Sparkles className="h-3 w-3 text-primary" />}
                                </div>
                                <div className={cn(
                                    "p-3 rounded-2xl text-[13px] leading-relaxed",
                                    msg.role === "user"
                                        ? "bg-primary text-primary-foreground shadow-lg shadow-primary/10"
                                        : "bg-muted/40 backdrop-blur-md border border-white/5"
                                )}>
                                    {msg.content.split('\n').map((line, j) => (
                                        <p key={j} className={line.startsWith('-') ? "ml-2" : ""}>{line}</p>
                                    ))}
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                    {isLoading && (
                        <div className="flex gap-3">
                            <div className="p-2 rounded-lg bg-muted/40 mt-1"><Loader2 className="h-3 w-3 animate-spin" /></div>
                            <div className="bg-muted/20 h-8 w-24 rounded-2xl animate-pulse" />
                        </div>
                    )}
                </div>

                <div className="p-4 bg-muted/30 border-t border-white/5 flex gap-2">
                    <Input
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleSend()}
                        placeholder="Ask AI about your library..."
                        className="rounded-xl bg-background/50 border-white/10 h-10"
                    />
                    <Button
                        size="icon"
                        onClick={handleSend}
                        disabled={isLoading || !input.trim()}
                        className="rounded-xl h-10 w-10 shrink-0 shadow-lg shadow-primary/20"
                    >
                        <Send className="h-4 w-4" />
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}

const cn = (...classes: unknown[]) => classes.filter(Boolean).join(" ");
