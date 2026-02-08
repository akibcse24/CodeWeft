import { useState, useEffect, useRef } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MessageSquare, Send, Brain, Sparkles } from "lucide-react";
import { useAI } from "@/hooks/useAI";
import { usePage } from "@/hooks/usePages";
import { extractTextFromBlocks } from "@/lib/block-utils";
import { Block } from "@/types/editor.types";
import { cn } from "@/lib/utils";
import { streamCompletion } from "@/services/ai.service";
import { useAuth } from "@/hooks/useAuth";
import ReactMarkdown from "react-markdown";

interface ChatPanelProps {
    pageId?: string;
}

interface Message {
    role: "user" | "assistant" | "system";
    content: string;
}

export function ChatPanel({ pageId }: ChatPanelProps) {
    const { user } = useAuth();
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const { askAI } = useAI();
    const { data: page } = usePage(pageId || "");
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    const handleSubmit = async (e?: React.FormEvent) => {
        e?.preventDefault();
        if (!input.trim() || isLoading) return;

        const userMessage: Message = { role: "user", content: input };
        setMessages(prev => [...prev, userMessage]);
        setInput("");
        setIsLoading(true);

        try {
            let systemPrompt = "You are a helpful AI assistant.";
            if (page) {
                const text = extractTextFromBlocks(page.content as unknown as Block[]);
                systemPrompt += `\n\nCurrent Note Context:\nTitle: ${page.title}\nContent: ${text}\n\nAnswer the user's question based on this note if relevant. You can also use tools to search other notes or manage tasks.`;
            }

            const apiMessages = [
                { role: "system" as const, content: systemPrompt },
                ...messages.map(m => ({ role: m.role as "user" | "assistant" | "system", content: m.content })),
                { role: "user" as const, content: userMessage.content }
            ];

            // Use streaming via edge function
            const stream = await streamCompletion(apiMessages);
            
            let assistantMessage = "";
            setMessages(prev => [...prev, { role: "assistant", content: "" }]);

            for await (const chunk of stream) {
                const content = chunk.choices?.[0]?.delta?.content || "";
                if (content) {
                    assistantMessage += content;
                    setMessages(prev => {
                        const newMsg = [...prev];
                        newMsg[newMsg.length - 1].content = assistantMessage;
                        return newMsg;
                    });
                }
            }

        } catch (error) {
            console.error("Chat Panel AI Error:", error);
            setMessages(prev => [...prev, { role: "assistant", content: "Sorry, I encountered an error." }]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary">
                    <MessageSquare className="h-4 w-4" />
                </Button>
            </SheetTrigger>
            <SheetContent className="w-[400px] sm:w-[540px] flex flex-col p-0">
                <SheetHeader className="p-4 border-b">
                    <SheetTitle className="flex items-center gap-2">
                        <Sparkles className="h-4 w-4 text-purple-500" />
                        Chat with {page ? page.title : "AI"}
                    </SheetTitle>
                </SheetHeader>

                <ScrollArea className="flex-1 p-4" ref={scrollRef}>
                    <div className="space-y-4">
                        {messages.length === 0 && (
                            <div className="text-center text-muted-foreground py-10">
                                <Brain className="h-10 w-10 mx-auto mb-3 opacity-20" />
                                <p>Ask questions about this page or anything else.</p>
                            </div>
                        )}
                        {messages.map((msg, i) => (
                            <div key={i} className={cn(
                                "flex w-full mb-2",
                                msg.role === "user" ? "justify-end" : "justify-start"
                            )}>
                                <div className={cn(
                                    "max-w-[80%] rounded-lg px-3 py-2 text-sm",
                                    msg.role === "user"
                                        ? "bg-primary text-primary-foreground"
                                        : "bg-muted text-foreground"
                                )}>
                                    <div className="prose prose-sm dark:prose-invert max-w-none">
                                        <ReactMarkdown>{msg.content}</ReactMarkdown>
                                    </div>
                                </div>
                            </div>
                        ))}
                        {isLoading && (
                            <div className="flex justify-start w-full">
                                <div className="bg-muted rounded-lg px-3 py-2 text-xs animate-pulse">Thinking...</div>
                            </div>
                        )}
                        <div ref={scrollRef} />
                    </div>
                </ScrollArea>

                <div className="p-4 border-t mt-auto">
                    <form onSubmit={handleSubmit} className="flex gap-2">
                        <Input
                            value={input}
                            onChange={e => setInput(e.target.value)}
                            placeholder="Type a message..."
                            disabled={isLoading}
                        />
                        <Button type="submit" size="icon" disabled={isLoading || !input.trim()}>
                            <Send className="h-4 w-4" />
                        </Button>
                    </form>
                </div>
            </SheetContent>
        </Sheet>
    );
}
