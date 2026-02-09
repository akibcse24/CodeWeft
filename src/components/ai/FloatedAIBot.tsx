import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bot, X, Send, Sparkles, Brain, Loader2, Minus, Maximize2, BookOpen, CheckSquare, HelpCircle, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { nluService, ParsedCommand, NLUContext } from "@/services/agents/nlu.service";
import { handleToolCall } from "@/services/agent.service";
import { eventBus } from "@/services/event-bus.service";
import { useNavigate } from "react-router-dom";
import ReactMarkdown from "react-markdown";

interface Message {
    id: string;
    role: "user" | "assistant" | "system" | "tool";
    content: string;
    type?: "text" | "command" | "error" | "success" | "loading";
    metadata?: unknown;
}

export function FloatedAIBot() {
    const { user } = useAuth();
    const { toast } = useToast();
    const navigate = useNavigate();
    const [isOpen, setIsOpen] = useState(false);
    const [isExpanded, setIsExpanded] = useState(false);
    const [messages, setMessages] = useState<Message[]>([
        {
            id: "welcome",
            role: "assistant",
            content: "Hello! I'm your agentic assistant. Type naturally to manage tasks, notes, and more. Try: 'Create a high priority task' or 'Navigate to notes'",
            type: "text"
        }
    ]);
    const [input, setInput] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [status, setStatus] = useState<string | null>(null);
    const [showSuggestions, setShowSuggestions] = useState(true);
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleToggle = () => setIsOpen(prev => !prev);
        window.addEventListener("toggle-ai-bot", handleToggle);
        return () => window.removeEventListener("toggle-ai-bot", handleToggle);
    }, []);

    useEffect(() => {
        if (scrollRef.current) {
            const scrollArea = scrollRef.current.querySelector('[data-radix-scroll-area-viewport]');
            if (scrollArea) scrollArea.scrollTop = scrollArea.scrollHeight;
        }
    }, [messages, isLoading, status]);

    const getNLUContext = (): NLUContext => ({
        userId: user?.id || "",
        currentPage: window.location.pathname,
        recentCommands: [],
        conversationHistory: messages.map(m => ({ role: m.role, content: m.content }))
    });

    const handleSend = async () => {
        if (!input.trim() || isLoading || !user) return;

        const userMessage: Message = {
            id: `msg_${Date.now()}`,
            role: "user",
            content: input,
            type: "text"
        };
        setMessages(prev => [...prev, userMessage]);
        setInput("");
        setIsLoading(true);
        setStatus("Understanding...");
        setShowSuggestions(false);

        try {
            // Handle special commands first
            const lowerInput = input.toLowerCase().trim();

            if (lowerInput === "help" || lowerInput === "?") {
                setMessages(prev => [...prev, {
                    id: `msg_${Date.now()}_help`,
                    role: "assistant",
                    content: `**🤖 Available Commands:**\n\n📝 **Tasks:**\n• "Create a high priority task to review papers by Friday"\n• "Complete the machine learning task"\n• "Show all incomplete tasks"\n• "Delete the meeting task"\n\n📄 **Notes:**\n• "Create a new note about Python"\n• "Search my notes for neural networks"\n• "Show recent notes"\n\n🧭 **Navigation:**\n• "Go to notes" / "Navigate to tasks"\n• "Open dashboard" / "Switch to courses"\n\n📊 **Other:**\n• "Show my productivity stats"\n• "Create a daily reading habit"\n• "Explain binary search"\n\n💡 **Tips:**\n• Type naturally - no special syntax needed\n• Be specific about priorities and dates\n• Use the quick action buttons below\n• Click "Open Full AI Hub" for advanced features`,
                    type: "text"
                }]);
                setIsLoading(false);
                setStatus(null);
                return;
            }

            // Parse natural language command
            const parsed = await nluService.parseCommand(input, getNLUContext());

            // Handle general response / explanation (use AI streaming)
            if (parsed.action === "general_response" || parsed.action === "explain_concept") {
                setStatus("Generating response...");

                // Stream AI response
                try {
                    const { streamCompletion } = await import("@/services/ai.service");
                    const stream = await streamCompletion([
                        { role: "system", content: "You are a helpful AI assistant for CodeWeft, a CS learning hub. Be concise, accurate, and helpful." },
                        ...messages.slice(-5).map(m => ({ role: m.role, content: m.content })),
                        { role: "user", content: input }
                    ]);

                    let assistantContent = "";
                    const msgId = `msg_${Date.now()}_ai`;
                    setMessages(prev => [...prev, { id: msgId, role: "assistant", content: "", type: "text" }]);

                    for await (const chunk of stream) {
                        const content = chunk.choices?.[0]?.delta?.content || "";
                        if (content) {
                            assistantContent += content;
                            setMessages(prev => prev.map(m =>
                                m.id === msgId ? { ...m, content: assistantContent } : m
                            ));
                        }
                    }
                } catch (aiError) {
                    console.error("AI streaming failed:", aiError);
                    setMessages(prev => [...prev, {
                        id: `msg_${Date.now()}_fallback`,
                        role: "assistant",
                        content: "I'd be happy to help! However, I'm having trouble connecting to the AI service right now. Please try again in a moment.",
                        type: "text"
                    }]);
                }
                return;
            }

            if (parsed.confidence > 0.6 && parsed.action !== "unknown") {
                // Execute as command
                setStatus(`Executing: ${parsed.action.replace(/_/g, " ")}...`);

                // Handle navigation specially
                if (parsed.action === "navigate_to_page" && typeof parsed.params.path === "string") {
                    const path = parsed.params.path;
                    navigate(path);
                    setMessages(prev => [...prev, {
                        id: `msg_${Date.now()}_nav`,
                        role: "assistant",
                        content: `✨ Navigating to **${path.replace("/", "")}**...`,
                        type: "success"
                    }]);
                    setIsOpen(false);
                    return;
                }

                // Execute other commands
                const result = await handleToolCall(parsed.action, parsed.params, user.id);

                // Format result message based on action type
                let resultMessage = `✓ **${parsed.action.replace(/_/g, " ")}** completed!`;
                const res = result as Record<string, unknown>;

                if (parsed.action === "create_task" && res?.title) {
                    resultMessage = `✅ Created task: **${res.title}**${res.priority ? ` (${res.priority} priority)` : ""}`;
                } else if (parsed.action === "create_note" && res?.title) {
                    resultMessage = `📝 Created note: **${res.title}**`;
                } else if (parsed.action === "list_tasks" && Array.isArray(result)) {
                    resultMessage = `📋 **Your Tasks (${result.length}):**\n${result.slice(0, 5).map((t: { title: string; status: string }) => `• ${t.title} ${t.status === "completed" ? "✓" : ""}`).join("\n")}${result.length > 5 ? `\n... and ${result.length - 5} more` : ""}`;
                } else if (parsed.action === "list_notes" && Array.isArray(result)) {
                    resultMessage = `📄 **Recent Notes (${result.length}):**\n${result.slice(0, 5).map((n: { title: string }) => `• ${n.title}`).join("\n")}${result.length > 5 ? `\n... and ${result.length - 5} more` : ""}`;
                } else if (parsed.action === "search_content" && res?.results) {
                    const searchResults = res.results as { title: string; type: string }[];
                    resultMessage = `🔍 **Search Results for "${res.query}":**\n${searchResults.slice(0, 5).map((r: { title: string; type: string }) => `• ${r.title} (${r.type})`).join("\n") || "No results found"}`;
                } else if (parsed.action === "create_habit" && res?.name) {
                    resultMessage = `🎯 Created habit: **${res.name}** (${res.frequency || "daily"})`;
                } else if (parsed.action === "list_github_repositories" && Array.isArray(result)) {
                    resultMessage = `📦 **GitHub Repositories (${result.length}):**\n${(result as { name: string; private: boolean; language: string | null }[]).slice(0, 8).map((r) => `• **${r.name}**${r.private ? " 🔒" : ""} - ${r.language || "No language"}`).join("\n")}${result.length > 8 ? `\n... and ${result.length - 8} more` : ""}`;
                } else if (parsed.action === "list_github_workflows" && Array.isArray(result)) {
                    resultMessage = `⚙️ **Workflows for ${parsed.params.repo}:**\n${(result as { name: string; state: string }[]).map((w) => `• ${w.name} (\`${w.state}\`)`).join("\n") || "No workflows found"}`;
                } else if (parsed.action === "get_github_file_content" && res?.content) {
                    const fileName = (res.name as string) || "file";
                    resultMessage = `📄 **${fileName}** in \`${parsed.params.owner}/${parsed.params.repo}\`:\n\n\`\`\`${fileName.split('.').pop()}\n${res.content}\n\`\`\``;
                } else if (parsed.action === "list_codespaces" && Array.isArray(result)) {
                    resultMessage = `💻 **GitHub Codespaces (${result.length}):**\n${(result as { name: string; state: string; repository: { full_name: string }; machine?: { display_name: string } }[]).map((c) => `• **${c.name}** (${c.state === 'Available' ? '🟢 Running' : '🔴 ' + c.state})\n  └ ${c.repository.full_name} • ${c.machine?.display_name || 'Standard'}`).join('\n')}`;
                } else if (parsed.action === "start_codespace" && (res as { success: boolean })?.success) {
                    resultMessage = `🚀 Codespace **${parsed.params.name}** is starting up...`;
                } else if (parsed.action === "stop_codespace" && (res as { success: boolean })?.success) {
                    resultMessage = `🛑 Codespace **${parsed.params.name}** has been stopped.`;
                } else if (parsed.action === "open_codespace_terminal") {
                    resultMessage = `📟 Opening terminal for **${parsed.params.name}**...`;
                } else if (parsed.action === "search_github_code" && Array.isArray(result)) {
                    resultMessage = `🔍 **GitHub Code Search Results (${result.length}):**\n${(result as { name: string; repository: { full_name: string } }[]).map((r) => `• **${r.name}** in ${r.repository.full_name}`).join("\n") || "No code found"}`;
                } else if (parsed.action === "list_github_branches" && Array.isArray(result)) {
                    resultMessage = `🌿 **Branches in ${parsed.params.repo}:**\n${(result as { name: string }[]).map((b) => `• ${b.name}`).join("\n")}`;
                } else if (parsed.action === "get_github_profile" && res?.login) {
                    resultMessage = `👤 **GitHub Profile: ${res.name || res.login}**\n• Bio: ${res.bio || "No bio"}\n• Repos: ${res.public_repos}\n• Followers: ${res.followers}\n• URL: ${res.html_url}`;
                }

                setMessages(prev => [...prev, {
                    id: `msg_${Date.now()}_success`,
                    role: "assistant",
                    content: resultMessage,
                    type: "success",
                    metadata: result
                }]);

                await eventBus.emitAgentAction("floated_bot", parsed.action, result, user.id);

                toast({
                    title: "Done!",
                    description: parsed.action.replace(/_/g, " ")
                });
            } else {
                // Low confidence - use AI for general response
                setStatus("Thinking...");

                try {
                    const { streamCompletion } = await import("@/services/ai.service");
                    const stream = await streamCompletion([
                        { role: "system", content: "You are a helpful AI assistant for CodeWeft. Help users with CS concepts, coding questions, and app usage. Be concise." },
                        { role: "user", content: input }
                    ]);

                    let assistantContent = "";
                    const msgId = `msg_${Date.now()}_ai`;
                    setMessages(prev => [...prev, { id: msgId, role: "assistant", content: "", type: "text" }]);

                    for await (const chunk of stream) {
                        const content = chunk.choices?.[0]?.delta?.content || "";
                        if (content) {
                            assistantContent += content;
                            setMessages(prev => prev.map(m =>
                                m.id === msgId ? { ...m, content: assistantContent } : m
                            ));
                        }
                    }
                } catch {
                    setMessages(prev => [...prev, {
                        id: `msg_${Date.now()}_help`,
                        role: "assistant",
                        content: `I understood "${parsed.originalText}" but I'm not sure how to help. Try:\n• "Create a task called..."\n• "Navigate to notes"\n• "Search for..."\n\nType **help** for all commands.`,
                        type: "text"
                    }]);
                }
            }
        } catch (error) {
            console.error("Agent failed:", error);
            setMessages(prev => [...prev, {
                id: `msg_${Date.now()}_error`,
                role: "assistant",
                content: "❌ I'm sorry, I encountered an error. Please try again or rephrase your command.",
                type: "error"
            }]);

            await eventBus.emitAgentError("floated_bot", "Command execution failed", user.id);

            toast({
                title: "Error",
                description: "Failed to execute command",
                variant: "destructive"
            });
        } finally {
            setIsLoading(false);
            setStatus(null);
        }
    };

    const handleQuickAction = (action: string) => {
        switch (action) {
            case "search_notes":
                setInput("Search my notes for ");
                break;
            case "manage_tasks":
                setInput("Show my tasks");
                break;
            case "query_papers":
                setInput("List my research papers");
                break;
            case "help":
                setMessages(prev => [...prev, {
                    id: `msg_${Date.now()}_help`,
                    role: "assistant",
                    content: `**Available Commands:**\n\n📝 **Tasks:**\n• "Create a high priority task to review papers by Friday"\n• "Complete the machine learning task"\n• "Show all incomplete tasks"\n\n📄 **Notes:**\n• "Create a new note about Python"\n• "Search my notes for neural networks"\n• "Show recent notes"\n\n🧭 **Navigation:**\n• "Go to notes" / "Navigate to tasks"\n• "Open dashboard" / "Switch to courses"\n\n📊 **Other:**\n• "Show my productivity stats"\n• "Create a daily reading habit"\n• "Explain binary search"\n\nType naturally - no special syntax needed!`,
                    type: "text"
                }]);
                break;
        }
    };

    const suggestionCommands = [
        { id: "search_notes", icon: BookOpen, label: "Search Notes" },
        { id: "manage_tasks", icon: CheckSquare, label: "Manage Tasks" },
        { id: "query_papers", icon: Brain, label: "Query Papers" },
        { id: "help", icon: HelpCircle, label: "Help" }
    ];

    return (
        <div className="flex flex-col items-end gap-5 pointer-events-none mb-6 mr-6">
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 30, filter: "blur(10px)" }}
                        animate={{ opacity: 1, scale: 1, y: 0, filter: "blur(0px)" }}
                        exit={{ opacity: 0, scale: 0.95, y: 30, filter: "blur(10px)" }}
                        className={cn(
                            "pointer-events-auto rounded-[2rem] overflow-hidden shadow-[0_32px_64px_rgba(0,0,0,0.5)] border border-white/10 transition-all duration-500 ease-in-out",
                            isExpanded ? "w-[650px] h-[850px]" : "w-[420px] h-[640px]"
                        )}
                    >
                        <div className="glass-ai h-full flex flex-col relative overflow-hidden">
                            {/* Ambient background decoration */}
                            <div className="absolute inset-0 mesh-gradient-ai opacity-40 pointer-events-none" />

                            <CardHeader className="p-5 border-b border-white/10 flex flex-row items-center justify-between space-y-0 relative z-10 bg-white/5 backdrop-blur-md">
                                <div className="flex items-center gap-4">
                                    <div className="relative">
                                        <div className="p-2.5 bg-primary/20 rounded-2xl text-primary relative z-10">
                                            <Brain className="h-6 w-6 animate-brain-pulse" />
                                        </div>
                                        <div className="absolute inset-0 bg-primary/40 rounded-2xl blur-lg animate-pulse" />
                                    </div>
                                    <div>
                                        <CardTitle className="text-base font-bold tracking-tight flex items-center gap-2 text-white">
                                            Aether AI
                                            <Badge variant="outline" className="text-[10px] font-mono bg-primary/10 border-primary/30 text-primary-foreground animate-pulse-glow">PREMIUM AGENT</Badge>
                                        </CardTitle>
                                        <CardDescription className="text-[11px] text-white/50 font-medium tracking-wide uppercase">Neural Interaction System</CardDescription>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-9 w-9 rounded-xl hover:bg-white/10 text-white/70"
                                        onClick={() => setIsExpanded(!isExpanded)}
                                    >
                                        {isExpanded ? <Minus className="h-5 w-5" /> : <Maximize2 className="h-5 w-5" />}
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-9 w-9 rounded-xl hover:bg-destructive/20 hover:text-destructive text-white/70"
                                        onClick={() => setIsOpen(false)}
                                    >
                                        <X className="h-5 w-5" />
                                    </Button>
                                </div>
                            </CardHeader>

                            <CardContent className="flex-1 flex flex-col p-0 overflow-hidden relative z-10 mt-1">
                                <ScrollArea className="flex-1 px-5 py-4" ref={scrollRef}>
                                    <div className="space-y-6">
                                        {messages.map((msg) => (
                                            <motion.div
                                                key={msg.id}
                                                initial={{ opacity: 0, x: msg.role === "user" ? 20 : -20 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                className={cn(
                                                    "flex gap-4 max-w-[88%]",
                                                    msg.role === "user" ? "ml-auto flex-row-reverse" : "mr-auto"
                                                )}
                                            >
                                                <div className={cn(
                                                    "p-2.5 rounded-2xl mt-1 shrink-0 h-fit shadow-lg",
                                                    msg.role === "user" ? "bg-primary/30 text-primary-foreground" : "bg-white/10 text-white"
                                                )}>
                                                    {msg.role === "user" ? (
                                                        <Sparkles className="h-4 w-4" />
                                                    ) : msg.type === "error" ? (
                                                        <AlertTriangle className="h-4 w-4 text-red-400" />
                                                    ) : msg.type === "success" ? (
                                                        <CheckSquare className="h-4 w-4 text-green-400" />
                                                    ) : (
                                                        <Bot className="h-4 w-4 text-primary" />
                                                    )}
                                                </div>
                                                <div className={cn(
                                                    "p-4 rounded-3xl text-[14px] leading-[1.6] whitespace-pre-wrap shadow-xl transition-all duration-300",
                                                    msg.role === "user"
                                                        ? "bg-primary text-primary-foreground border-t border-white/20 rounded-tr-none"
                                                        : msg.type === "error"
                                                            ? "bg-red-500/10 border border-red-500/30 text-red-200 rounded-tl-none"
                                                            : msg.type === "success"
                                                                ? "bg-green-500/10 border border-green-500/30 text-green-200 rounded-tl-none"
                                                                : "bg-white/5 backdrop-blur-2xl border border-white/10 text-white/90 rounded-tl-none msg-bubble-ai"
                                                )}>
                                                    <div className="prose prose-sm prose-invert max-w-none">
                                                        <ReactMarkdown>{msg.content}</ReactMarkdown>
                                                    </div>
                                                </div>
                                            </motion.div>
                                        ))}
                                        {isLoading && (
                                            <div className="flex gap-4">
                                                <div className="p-2.5 rounded-2xl bg-white/10 mt-1 shrink-0 h-fit">
                                                    <Loader2 className="h-4 w-4 animate-spin text-primary" />
                                                </div>
                                                <div className="flex flex-col gap-3">
                                                    <div className="bg-white/5 h-10 w-48 rounded-3xl animate-pulse border border-white/5" />
                                                    {status && (
                                                        <div className="text-[11px] text-primary/70 font-medium flex items-center gap-2 ml-1 px-3 py-1 bg-primary/5 rounded-full border border-primary/10 w-fit">
                                                            <div className="h-1.5 w-1.5 rounded-full bg-primary animate-ping" />
                                                            {status}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </ScrollArea>

                                {/* Interface Layer: Quick Actions */}
                                {showSuggestions && !isLoading && (
                                    <div className="px-5 pb-3">
                                        <div className="flex items-center gap-2 overflow-x-auto pb-3 scrollbar-none mask-fade-right">
                                            {suggestionCommands.map((cmd) => (
                                                <button
                                                    key={cmd.id}
                                                    onClick={() => handleQuickAction(cmd.id)}
                                                    className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-white/5 border border-white/10 text-[12px] text-white/70 hover:bg-white/15 hover:text-white hover:border-primary/50 transition-all duration-300 shrink-0 group shadow-md backdrop-blur-sm"
                                                >
                                                    <cmd.icon className="h-4 w-4 text-primary group-hover:scale-110 transition-transform" />
                                                    {cmd.label}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Input Engine */}
                                <div className="p-5 bg-black/20 border-t border-white/10 backdrop-blur-xl">
                                    <div className="relative group">
                                        <div className="absolute inset-0 bg-primary/10 rounded-[1.5rem] blur-xl opacity-0 group-focus-within:opacity-100 transition-opacity" />
                                        <Input
                                            value={input}
                                            onChange={(e) => setInput(e.target.value)}
                                            onKeyDown={(e) => e.key === "Enter" && handleSend()}
                                            placeholder="Summon an action... (e.g. 'Build a task')"
                                            className="rounded-[1.5rem] bg-white/5 border-white/10 h-14 pl-6 pr-14 focus-visible:ring-primary/40 text-[15px] text-white placeholder:text-white/30 backdrop-blur-lg transition-all"
                                            disabled={isLoading}
                                        />
                                        <Button
                                            size="icon"
                                            variant="ghost"
                                            onClick={handleSend}
                                            disabled={isLoading || !input.trim()}
                                            className="absolute right-2 top-2 h-10 w-10 rounded-2xl text-primary hover:bg-primary/20 hover:text-white transition-all disabled:opacity-30"
                                        >
                                            <Send className="h-5 w-5" />
                                        </Button>
                                    </div>
                                    <div className="flex items-center justify-between mt-4 px-1">
                                        <p className="text-[11px] text-white/30 font-medium tracking-tight">
                                            <kbd className="px-1.5 py-0.5 rounded bg-white/10 border border-white/10 text-[10px] mr-1">⌘</kbd>K Command Hub
                                        </p>
                                        <button
                                            onClick={() => navigate("/ai-assistant")}
                                            className="text-[11px] text-primary/70 hover:text-primary transition-colors font-semibold flex items-center gap-1.5"
                                        >
                                            OPEN AGENT HUB <Maximize2 className="h-3 w-3" />
                                        </button>
                                    </div>
                                </div>
                            </CardContent>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Core Neural Node (Floating Button) */}
            <motion.button
                layout
                whileHover={{ scale: 1.08, rotate: 5 }}
                whileTap={{ scale: 0.92, rotate: -5 }}
                onClick={() => setIsOpen(!isOpen)}
                className={cn(
                    "pointer-events-auto h-16 w-16 rounded-[1.75rem] flex items-center justify-center shadow-[0_20px_50px_rgba(0,0,0,0.4)] transition-all duration-500 border-2 relative overflow-hidden",
                    isOpen
                        ? "bg-white/10 border-white/20 text-white backdrop-blur-xl"
                        : "bg-primary border-primary/30 text-primary-foreground orb-glow"
                )}
            >
                <AnimatePresence mode="wait">
                    {isOpen ? (
                        <motion.div
                            key="close"
                            initial={{ rotate: -90, opacity: 0, scale: 0.5 }}
                            animate={{ rotate: 0, opacity: 1, scale: 1 }}
                            exit={{ rotate: 90, opacity: 0, scale: 0.5 }}
                        >
                            <X className="h-7 w-7" />
                        </motion.div>
                    ) : (
                        <motion.div
                            key="bot"
                            initial={{ rotate: 90, opacity: 0, scale: 0.5 }}
                            animate={{ rotate: 0, opacity: 1, scale: 1 }}
                            exit={{ rotate: -90, opacity: 0, scale: 0.5 }}
                            className="relative z-10"
                        >
                            <Bot className="h-7 w-7" />
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Internal energy flash */}
                {!isOpen && (
                    <motion.div
                        initial={{ left: '-100%' }}
                        animate={{ left: '200%' }}
                        transition={{ repeat: Infinity, duration: 3, ease: "linear" }}
                        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent skew-x-12"
                    />
                )}
            </motion.button>
        </div>
    );
}

export default FloatedAIBot;
