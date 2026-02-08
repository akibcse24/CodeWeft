import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mic, MicOff, Send, Sparkles, Command, X, Zap, Brain, MoreHorizontal, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import React from "react";

declare global {
  interface Window {
    SpeechRecognition?: new () => SpeechRecognition;
    webkitSpeechRecognition?: new () => SpeechRecognition;
  }
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
  start(): void;
  stop(): void;
}

interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
}

interface SpeechRecognitionResultList {
  length: number;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionResult {
  length: number;
  isFinal: boolean;
  [index: number]: SpeechRecognitionAlternative;
}

interface SpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
  message: string;
}
import { cn } from "@/lib/utils";
import { nluService, ParsedCommand, NLUContext } from "@/services/agents/nlu.service";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface SmartCommandInputProps {
  onCommand: (command: ParsedCommand) => void;
  onSubmit: (text: string) => void;
  context: NLUContext;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

export function SmartCommandInput({
  onCommand,
  onSubmit,
  context,
  placeholder = "Type a command or ask a question...",
  className,
  disabled = false
}: SmartCommandInputProps) {
  const [input, setInput] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [previewCommand, setPreviewCommand] = useState<ParsedCommand | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  useEffect(() => {
    // Generate suggestions based on context
    const contextSuggestions = nluService.generateSuggestions(context);
    setSuggestions(contextSuggestions);
  }, [context]);

  useEffect(() => {
    // Real-time parsing for command preview
    const timeoutId = setTimeout(async () => {
      if (input.length > 3) {
        const parsed = await nluService.parseCommand(input, context);
        setPreviewCommand(parsed);
      } else {
        setPreviewCommand(null);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [input, context]);

  // Voice recognition setup
  useEffect(() => {
    if ("webkitSpeechRecognition" in window || "SpeechRecognition" in window) {
      const SpeechRecognitionAPI = (window as unknown as { SpeechRecognition?: new () => SpeechRecognition; webkitSpeechRecognition?: new () => SpeechRecognition }).SpeechRecognition || (window as unknown as { webkitSpeechRecognition?: new () => SpeechRecognition }).webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognitionAPI();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = true;

      recognitionRef.current.onresult = (event: SpeechRecognitionEvent) => {
        const transcript = Array.from(event.results)
          .map((result: SpeechRecognitionResult) => result[0])
          .map((result: SpeechRecognitionAlternative) => result.transcript)
          .join("");

        setInput(transcript);
      };

      recognitionRef.current.onerror = (event: SpeechRecognitionErrorEvent) => {
        console.error("Speech recognition error:", event.error);
        setIsListening(false);
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
      };
    }
  }, []);

  const toggleVoice = () => {
    if (!recognitionRef.current) {
      alert("Voice recognition is not supported in your browser");
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      recognitionRef.current.start();
      setIsListening(true);
    }
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();

    if (!input.trim() || disabled || isProcessing) return;

    setIsProcessing(true);

    try {
      const parsed = await nluService.parseCommand(input, context);

      if (parsed.confidence > 0.7) {
        onCommand(parsed);
      } else {
        onSubmit(input);
      }

      setInput("");
      setPreviewCommand(null);
      setShowSuggestions(false);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    setInput(suggestion);
    setShowSuggestions(false);
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
    if (e.key === "Escape") {
      setShowSuggestions(false);
    }
    if (e.key === "/" && !input) {
      e.preventDefault();
      setShowSuggestions(true);
    }
  };

  return (
    <TooltipProvider>
      <div className={cn("relative w-full group", className)}>
        {/* Command Logic Feedback */}
        <AnimatePresence>
          {previewCommand && previewCommand.confidence > 0.6 && (
            <motion.div
              initial={{ opacity: 0, y: 15, filter: "blur(10px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              exit={{ opacity: 0, y: 15, filter: "blur(10px)" }}
              className="absolute bottom-full left-0 right-0 mb-4 px-5 py-3 rounded-2xl glass-ai border border-white/10 shadow-2xl overflow-hidden"
            >
              <div className="absolute inset-0 mesh-gradient-ai opacity-10 pointer-events-none" />
              <div className="flex items-center gap-3 text-sm relative z-10">
                <div className="p-1 bg-yellow-400/20 rounded-lg">
                  <Zap className="h-4 w-4 text-yellow-400 animate-pulse" />
                </div>
                <span className="text-white/60 font-medium tracking-tight">Intent Detected:</span>
                <Badge variant="secondary" className="capitalize bg-primary/20 text-primary-foreground border-primary/30 px-3 py-0.5 rounded-lg font-bold">
                  {previewCommand.action.replace(/_/g, " ")}
                </Badge>
                <div className="ml-auto flex items-center gap-2">
                  <div className="h-1 w-12 rounded-full bg-white/10 overflow-hidden">
                    <motion.div
                      className="h-full bg-primary"
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.round(previewCommand.confidence * 100)}%` }}
                    />
                  </div>
                  <span className="text-[10px] font-mono text-white/40">
                    {Math.round(previewCommand.confidence * 100)}%
                  </span>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Neural Input Chassis */}
        <form onSubmit={handleSubmit} className="relative z-10">
          <div className="relative flex items-center group/input">
            <div className="absolute inset-0 bg-primary/5 rounded-2xl blur-xl opacity-0 group-focus-within/input:opacity-100 transition-opacity" />
            <Input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              onFocus={() => setShowSuggestions(true)}
              placeholder={placeholder}
              disabled={disabled || isProcessing}
              className={cn(
                "pr-28 pl-14 h-16 text-lg rounded-2xl font-medium",
                "bg-white/5 backdrop-blur-xl",
                "border-white/10 focus:border-primary/50",
                "transition-all duration-500 shadow-2xl text-white placeholder:text-white/20",
                isListening && "border-red-500/50 shadow-[0_0_20px_rgba(239,68,68,0.2)]",
                previewCommand?.confidence > 0.8 && "border-green-500/30"
              )}
            />

            {/* AI Core Pulse */}
            <div className="absolute left-5 text-white/40 group-focus-within/input:text-primary transition-colors">
              {isProcessing ? (
                <div className="relative">
                  <div className="absolute inset-0 bg-primary/40 rounded-full blur-md animate-ping" />
                  <Loader2 className="h-5 w-5 animate-spin relative z-10 text-primary" />
                </div>
              ) : (
                <div className="relative">
                  {previewCommand?.confidence > 0.8 && <div className="absolute inset-0 bg-primary/30 rounded-full blur-md animate-brain-pulse" />}
                  <Brain className={cn("h-6 w-6 relative z-10 transition-transform duration-500", previewCommand?.confidence > 0.8 && "scale-110 text-primary")} />
                </div>
              )}
            </div>

            {/* Neural Action Cluster */}
            <div className="absolute right-3 flex items-center gap-2">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={toggleVoice}
                    className={cn(
                      "h-11 w-11 rounded-xl transition-all duration-300",
                      isListening ? "text-red-400 bg-red-400/20 shadow-[0_0_15px_rgba(239,68,68,0.3)] animate-pulse" : "text-white/40 hover:bg-white/10 hover:text-white"
                    )}
                    disabled={disabled}
                  >
                    {isListening ? <Mic className="h-5 w-5" /> : <MicOff className="h-5 w-5" />}
                  </Button>
                </TooltipTrigger>
                <TooltipContent className="bg-black/90 text-white border-white/10">
                  {isListening ? "Stop Neural Listening" : "Nueral Voice Input"}
                </TooltipContent>
              </Tooltip>

              <Button
                type="submit"
                disabled={!input.trim() || disabled || isProcessing}
                className={cn(
                  "h-11 w-11 rounded-xl transition-all duration-500",
                  input.trim() ? "bg-primary text-white shadow-lg shadow-primary/30 scale-100 opcaity-100" : "bg-white/5 text-white/20 scale-95 opacity-50"
                )}
              >
                <Send className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </form>

        {/* Intent Suggestions Grid */}
        <AnimatePresence>
          {showSuggestions && (
            <motion.div
              initial={{ opacity: 0, y: -15, filter: "blur(10px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              exit={{ opacity: 0, y: -15, filter: "blur(10px)" }}
              className="absolute top-full left-0 right-0 mt-4 p-3 rounded-2xl glass-ai border border-white/10 shadow-[0_20px_60px_rgba(0,0,0,0.6)] z-50 overflow-hidden"
            >
              <div className="absolute inset-0 mesh-gradient-ai opacity-5 pointer-events-none" />
              <div className="flex items-center justify-between mb-3 px-3 relative z-10">
                <span className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em]">
                  Predicted Invocations
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 rounded-lg hover:bg-white/10 text-white/40 hover:text-white"
                  onClick={() => setShowSuggestions(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              <div className="space-y-1.5 max-h-72 overflow-y-auto px-1 relative z-10 scrollbar-none">
                {suggestions.map((suggestion, index) => (
                  <button
                    key={index}
                    onClick={() => handleSuggestionClick(suggestion)}
                    className="w-full text-left px-4 py-3 rounded-xl text-[13px] font-medium text-white/70 hover:bg-white/10 hover:text-white hover:translate-x-1 transition-all flex items-center gap-3 group border border-transparent hover:border-white/10"
                  >
                    <div className="p-1.5 bg-primary/10 rounded-lg group-hover:bg-primary/20 transition-colors">
                      <Sparkles className="h-3.5 w-3.5 text-primary" />
                    </div>
                    {suggestion}
                    <MoreHorizontal className="h-4 w-4 ml-auto opacity-0 group-hover:opacity-40 transition-opacity" />
                  </button>
                ))}
              </div>

              <div className="mt-4 pt-3 border-t border-white/5 text-[10px] font-bold text-white/30 px-3 relative z-10 flex items-center justify-between">
                <span>PRESS "/" FOR QUICK ACTIONS</span>
                <span className="bg-white/5 px-2 py-0.5 rounded border border-white/5 uppercase">Neural NLP Active</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Sensory Capture Overlay */}
        <AnimatePresence>
          {isListening && (
            <motion.div
              initial={{ opacity: 0, backdropFilter: "blur(0px)" }}
              animate={{ opacity: 1, backdropFilter: "blur(20px)" }}
              exit={{ opacity: 0, backdropFilter: "blur(0px)" }}
              className="fixed inset-0 z-[100] bg-black/60 flex items-center justify-center p-8"
            >
              <div className="text-center relative max-w-2xl w-full">
                <div className="absolute inset-0 mesh-gradient-ai opacity-30 blur-3xl animate-pulse" />

                <motion.div
                  animate={{
                    scale: [1, 1.15, 1],
                    boxShadow: [
                      "0 0 0px 0px rgba(239,68,68,0)",
                      "0 0 50px 10px rgba(239,68,68,0.2)",
                      "0 0 0px 0px rgba(239,68,68,0)"
                    ]
                  }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="w-32 h-32 rounded-[2.5rem] glass-ai border-red-500/30 flex items-center justify-center mb-8 mx-auto relative z-10"
                >
                  <Mic className="h-14 w-14 text-red-500 drop-shadow-[0_0_10px_rgba(239,68,68,0.5)]" />
                </motion.div>

                <h2 className="text-3xl font-black text-white mb-4 tracking-tight relative z-10 uppercase italic">
                  Neural Audio Capture
                </h2>

                <div className="min-h-20 bg-white/5 border border-white/10 rounded-2xl p-6 mb-8 backdrop-blur-3xl relative z-10 shadow-2xl">
                  {input ? (
                    <p className="text-xl font-medium text-white/90 leading-relaxed">
                      {input}
                      <motion.span
                        animate={{ opacity: [0, 1, 0] }}
                        transition={{ duration: 0.8, repeat: Infinity }}
                        className="inline-block w-3 h-6 bg-primary ml-2 rounded"
                      />
                    </p>
                  ) : (
                    <p className="text-xl font-medium text-white/20 italic animate-pulse">
                      Awaiting sensory input...
                    </p>
                  )}
                </div>

                <div className="flex items-center justify-center gap-4 relative z-10">
                  <Button
                    variant="ghost"
                    size="lg"
                    className="rounded-2xl border border-white/10 text-white/60 hover:text-white"
                    onClick={toggleVoice}
                  >
                    TERMINATE
                  </Button>
                  <Button
                    variant="default"
                    size="lg"
                    className="rounded-2xl bg-primary text-white font-bold"
                    onClick={() => { toggleVoice(); handleSubmit(); }}
                    disabled={!input}
                  >
                    PROCESS INTENT
                  </Button>
                </div>

                {/* Spectral waves */}
                <div className="absolute bottom-[-100px] left-0 right-0 h-40 flex items-end justify-center gap-1.5 pointer-events-none overflow-hidden">
                  {[...Array(24)].map((_, i) => (
                    <motion.div
                      key={i}
                      animate={{
                        height: isListening ? [2, Math.random() * 80 + 10, 2] : 2
                      }}
                      transition={{
                        duration: 0.4 + Math.random() * 0.4,
                        repeat: Infinity,
                        ease: "easeInOut"
                      }}
                      className="w-1.5 rounded-full bg-primary/40"
                    />
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </TooltipProvider>
  );
}
