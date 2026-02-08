import { useState, useRef, useEffect } from "react";
import { Bot, Send, Sparkles, Loader2, Brain, Command, HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { nluService } from "@/services/agents/nlu.service";
import { handleToolCall } from "@/services/agent.service";
import { useNavigate } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AgentControlPanel } from "@/components/agent/AgentControlPanel";
import { AgentActivityLog } from "@/components/agent/AgentActivityLog";
import { AgentSuggestions } from "@/components/agent/AgentSuggestions";

interface Message {
    id: string;
    role: "user" | "assistant";
    content: string;
    type?: "text" | "success" | "error";
}

export default function AIAssistant() {
    const [messages, setMessages] = useState<Message[]>([
        {
            id: "welcome",
            role: "assistant",
            content: "Hello! I'm your AI Agent. I understand natural language commands. Try:\n\n• 'Create a high priority task'\n• 'Navigate to notes'\n• 'Show my tasks'\n• Type 'help' for more commands"
        }
    ]);
    const [input, setInput] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [activeTab, setActiveTab] = useState("chat");
    const scrollRef = useRef<HTMLDivElement>(null);
    const { user } = useAuth();
    const { toast } = useToast();
    const navigate = useNavigate();

    useEffect(() => {
        if (scrollRef.current) {
            const scrollArea = scrollRef.current.querySelector('[data-radix-scroll-area-viewport]');
            if (scrollArea) scrollArea.scrollTop = scrollArea.scrollHeight;
        }
    }, [messages]);

    const getContext = () => ({
        userId: user?.id || "",
        currentPage: window.location.pathname,
        recentCommands: [],
        conversationHistory: messages.map(m => ({ role: m.role, content: m.content }))
    });

    const handleSend = async () => {
        if (!input.trim() || isLoading || !user) return;

        const userMsg: Message = {
            id: `msg_${Date.now()}`,
            role: "user",
            content: input
        };
        setMessages(prev => [...prev, userMsg]);
        setInput("");
        setIsLoading(true);

        try {
            const lowerInput = input.toLowerCase().trim();

            // Handle help command
            if (lowerInput === "help" || lowerInput === "?") {
                setMessages(prev => [...prev, {
                    id: `msg_${Date.now()}_help`,
                    role: "assistant",
                    content: `**🤖 Available Commands:**\n\n📝 **Tasks:**\n• "Create a high priority task to review papers by Friday"\n• "Complete the machine learning task"\n• "Show all incomplete tasks"\n\n📄 **Notes:**\n• "Create a new note about Python"\n• "Search my notes for neural networks"\n\n🧭 **Navigation:**\n• "Go to notes" / "Navigate to tasks"\n• "Open dashboard"\n\n💡 Just type naturally! The AI understands your intent.`
                }]);
                setIsLoading(false);
                return;
            }

            // Parse command
            const parsed = await nluService.parseCommand(input, getContext());

            if (parsed.confidence > 0.6 && parsed.action !== "unknown") {
                // Handle navigation
                if (parsed.action === "navigate_to_page" && parsed.params.path) {
                    navigate(parsed.params.path);
                    setMessages(prev => [...prev, {
                        id: `msg_${Date.now()}_nav`,
                        role: "assistant",
                        content: `✓ Navigating to ${parsed.params.path}...`,
                        type: "success"
                    }]);
                    return;
                }

                // Execute command
                const result = await handleToolCall(parsed.action, parsed.params, user.id);

                setMessages(prev => [...prev, {
                    id: `msg_${Date.now()}_success`,
                    role: "assistant",
                    content: `✓ ${parsed.action.replace(/_/g, " ")} completed successfully!`,
                    type: "success"
                }]);

                toast({
                    title: "Success",
                    description: `${parsed.action.replace(/_/g, " ")} completed`
                });
            } else {
                // Low confidence
                setMessages(prev => [...prev, {
                    id: `msg_${Date.now()}_clarify`,
                    role: "assistant",
                    content: `I'm not sure what you mean by "${input}". Try:\n\n• "Create a high priority task"\n• "Show my notes"\n• "Navigate to dashboard"\n• Type "help" for all commands`
                }]);
            }
        } catch (error) {
            console.error("Error:", error);
            setMessages(prev => [...prev, {
                id: `msg_${Date.now()}_error`,
                role: "assistant",
                content: "❌ Sorry, I encountered an error. Please try again.",
                type: "error"
            }]);

            toast({
                title: "Error",
                description: "Failed to execute command",
                variant: "destructive"
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="space-y-6 animate-fade-in h-[calc(100vh-8rem)]">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold flex items-center gap-3">
                        <Brain className="h-8 w-8 text-primary" />
                        AI Agent Hub
                    </h1>
                    <p className="text-muted-foreground mt-1">
                        Natural language commands for your productivity
                    </p>
                </div>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="h-[calc(100%-7rem)]">
                <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="chat">Chat</TabsTrigger>
                    <TabsTrigger value="agents">Agents</TabsTrigger>
                    <TabsTrigger value="activity">Activity</TabsTrigger>
                    <TabsTrigger value="settings">Settings</TabsTrigger>
                </TabsList>

                <TabsContent value="chat" className="h-[calc(100%-3rem)] mt-4">
                    <Card className="flex flex-col h-full shadow-xl border-white/10 glass-card overflow-hidden">
                        <CardContent className="flex-1 pt-6 flex flex-col p-0 overflow-hidden">
                            <ScrollArea className="flex-1 p-6" ref={scrollRef}>
                                <div className="space-y-6">
                                    {messages.map((msg, idx) => (
                                        <motion.div
                                            key={msg.id}
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            className={cn(
                                                "flex gap-4 max-w-[80%]",
                                                msg.role === "user" ? "ml-auto flex-row-reverse" : "mr-auto"
                                            )}
                                        >
                                            <div className={cn(
                                                "p-3 rounded-xl h-fit shrink-0",
                                                msg.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted"
                                            )}>
                                                {msg.role === "user" ? (
                                                    <Sparkles className="h-4 w-4" />
                                                ) : msg.type === "error" ? (
                                                    <span className="text-red-500">✕</span>
                                                ) : msg.type === "success" ? (
                                                    <span className="text-green-500">✓</span>
                                                ) : (
                                                    <Bot className="h-4 w-4" />
                                                )}
                                            </div>
                                            <div className={cn(
                                                "p-4 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap",
                                                msg.role === "user" 
                                                    ? "bg-primary/10 border border-primary/20" 
                                                    : msg.type === "error"
                                                        ? "bg-red-500/10 border border-red-500/20"
                                                        : msg.type === "success"
                                                            ? "bg-green-500/10 border border-green-500/20"
                                                            : "bg-background border border-border"
                                            )}>
                                                {msg.content}
                                            </div>
                                        </motion.div>
                                    ))}
                                    {isLoading && (
                                        <div className="flex gap-4">
                                            <div className="p-3 rounded-xl bg-muted">
                                                <Loader2 className="h-4 w-4 animate-spin" />
                                            </div>
                                            <div className="flex flex-col gap-2">
                                                <div className="bg-muted h-4 w-24 rounded animate-pulse" />
                                                <div className="bg-muted h-4 w-48 rounded animate-pulse" />
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </ScrollArea>

                            <div className="p-4 border-t bg-muted/20">
                                <div className="flex gap-2 max-w-4xl mx-auto">
                                    <Input
                                        placeholder="Type a command... (e.g., 'Create task', 'Navigate to notes', 'help')"
                                        value={input}
                                        onChange={(e) => setInput(e.target.value)}
                                        onKeyDown={(e) => e.key === "Enter" && handleSend()}
                                        className="flex-1 rounded-xl h-11"
                                        disabled={isLoading}
                                    />
                                    <Button
                                        variant="outline"
                                        size="icon"
                                        onClick={() => setMessages([{
                                            id: "help",
                                            role: "assistant",
                                            content: `**🤖 Available Commands:**\n\n📝 **Tasks:**\n• "Create a high priority task to review papers by Friday"\n• "Complete the machine learning task"\n• "Show all incomplete tasks"\n\n📄 **Notes:**\n• "Create a new note about Python"\n• "Search my notes for neural networks"\n\n🧭 **Navigation:**\n• "Go to notes" / "Navigate to tasks"\n• "Open dashboard"\n\n💡 Just type naturally! The AI understands your intent.`
                                        }])}
                                    >
                                        <HelpCircle className="h-4 w-4" />
                                    </Button>
                                    <Button
                                        onClick={handleSend}
                                        disabled={!input.trim() || isLoading}
                                        className="h-11 w-11 rounded-xl"
                                    >
                                        {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                                    </Button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="agents" className="h-[calc(100%-3rem)] mt-4">
                    <div className="grid grid-cols-2 gap-4 h-full">
                        {user?.id && <AgentControlPanel userId={user.id} />}
                        {user?.id && <AgentSuggestions userId={user.id} />}
                    </div>
                </TabsContent>

                <TabsContent value="activity" className="h-[calc(100%-3rem)] mt-4">
                    <AgentActivityLog />
                </TabsContent>

                <TabsContent value="settings" className="h-[calc(100%-3rem)] mt-4">
                    <Card className="p-6">
                        <h3 className="text-lg font-semibold mb-4">Agent Settings</h3>
                        <p className="text-muted-foreground">Configure your AI agent preferences here.</p>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
