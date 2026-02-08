import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  HelpCircle, X, MessageSquare, Zap, Search, Command,
  ArrowRight, CheckCircle, Lightbulb, BookOpen, ChevronRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface CommandExample {
  category: string;
  examples: {
    command: string;
    description: string;
    result: string;
  }[];
}

const commandExamples: CommandExample[] = [
  {
    category: "Tasks",
    examples: [
      { command: "Create a high priority task to review papers by Friday", description: "Creates a task with priority and due date", result: "✓ Task created" },
      { command: "Complete the machine learning task", description: "Marks a task as completed", result: "✓ Task completed" },
      { command: "Show all incomplete tasks from last week", description: "Filters tasks by status and date", result: "3 tasks found" },
      { command: "Delete the meeting task", description: "Removes a task", result: "✓ Task deleted" }
    ]
  },
  {
    category: "Notes",
    examples: [
      { command: "Create a new note about Python decorators", description: "Creates a note with title", result: "✓ Note created" },
      { command: "Search my notes for 'neural networks'", description: "Searches note content", result: "5 notes found" },
      { command: "Update the AI note with new insights", description: "Modifies existing note", result: "✓ Note updated" }
    ]
  },
  {
    category: "Navigation",
    examples: [
      { command: "Go to the tasks page", description: "Navigates to a specific page", result: "→ /tasks" },
      { command: "Switch to notes", description: "Quick page switch", result: "→ /notes" },
      { command: "Open the dashboard", description: "Goes to home dashboard", result: "→ /dashboard" }
    ]
  },
  {
    category: "Habits",
    examples: [
      { command: "Log my meditation habit", description: "Records habit completion", result: "✓ Habit logged" },
      { command: "Create a daily reading habit", description: "Creates a new habit", result: "✓ Habit created" },
      { command: "Show my habit streaks", description: "Displays habit progress", result: "7-day streak!" }
    ]
  },
  {
    category: "AI Assistant",
    examples: [
      { command: "Explain binary search in simple terms", description: "Educational explanation", result: "Binary search is..." },
      { command: "Help me understand dynamic programming", description: "Learning assistance", result: "DP is a technique..." },
      { command: "Suggest study materials for ML", description: "Resource recommendations", result: "Here are 3 papers..." }
    ]
  }
];

const tips = [
  "Use natural language - no need to remember exact command syntax",
  "Be specific about what you want: 'high priority task due tomorrow'",
  "You can chain commands: 'Create task and then navigate to notes'",
  "Voice input is available - click the microphone icon",
  "Press ⌘K to open the command palette anytime",
  "The AI learns your patterns - it gets better over time",
  "Use / to see available commands while typing"
];

interface CommandHelpProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CommandHelp({ isOpen, onClose }: CommandHelpProps) {
  const [activeCategory, setActiveCategory] = useState("Tasks");

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-background/90 backdrop-blur-sm flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="w-full max-w-4xl max-h-[90vh] bg-card rounded-2xl shadow-2xl border border-border overflow-hidden"
          onClick={e => e.stopPropagation()}
        >
          <CardHeader className="border-b border-border bg-gradient-to-r from-primary/5 to-transparent">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-primary/10">
                  <HelpCircle className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-2xl">Command Guide</CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">
                    Learn how to use natural language commands with the AI Agent
                  </p>
                </div>
              </div>
              <Button variant="ghost" size="icon" onClick={onClose}>
                <X className="h-5 w-5" />
              </Button>
            </div>
          </CardHeader>

          <Tabs defaultValue="examples" className="flex-1">
            <div className="px-6 pt-4">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="examples" className="gap-2">
                  <MessageSquare className="h-4 w-4" />
                  Examples
                </TabsTrigger>
                <TabsTrigger value="tips" className="gap-2">
                  <Lightbulb className="h-4 w-4" />
                  Tips
                </TabsTrigger>
                <TabsTrigger value="shortcuts" className="gap-2">
                  <Command className="h-4 w-4" />
                  Shortcuts
                </TabsTrigger>
              </TabsList>
            </div>

            <CardContent className="p-6">
              <TabsContent value="examples" className="mt-0">
                <div className="grid grid-cols-5 gap-6">
                  {/* Category Sidebar */}
                  <div className="col-span-1 border-r border-border pr-4">
                    <ScrollArea className="h-[50vh]">
                      <div className="space-y-1">
                        {commandExamples.map(cat => (
                          <button
                            key={cat.category}
                            onClick={() => setActiveCategory(cat.category)}
                            className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                              activeCategory === cat.category 
                                ? "bg-primary text-primary-foreground" 
                                : "hover:bg-muted"
                            }`}
                          >
                            {cat.category}
                          </button>
                        ))}
                      </div>
                    </ScrollArea>
                  </div>

                  {/* Examples Content */}
                  <div className="col-span-4">
                    <ScrollArea className="h-[50vh]">
                      <div className="space-y-4">
                        {commandExamples
                          .find(c => c.category === activeCategory)
                          ?.examples.map((example, idx) => (
                            <motion.div
                              key={idx}
                              initial={{ opacity: 0, x: 20 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: idx * 0.1 }}
                              className="p-4 rounded-xl bg-muted/50 border border-border"
                            >
                              <div className="flex items-start gap-4">
                                <div className="flex-1">
                                  <p className="font-medium text-sm mb-1">
                                    "{example.command}"
                                  </p>
                                  <p className="text-xs text-muted-foreground">
                                    {example.description}
                                  </p>
                                </div>
                                <Badge variant="outline" className="text-xs shrink-0">
                                  {example.result}
                                </Badge>
                              </div>
                            </motion.div>
                          ))}
                      </div>
                    </ScrollArea>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="tips" className="mt-0">
                <div className="grid grid-cols-2 gap-4">
                  {tips.map((tip, idx) => (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      className="flex items-start gap-3 p-4 rounded-xl bg-muted/50 border border-border"
                    >
                      <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                        <Zap className="h-4 w-4 text-primary" />
                      </div>
                      <p className="text-sm">{tip}</p>
                    </motion.div>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="shortcuts" className="mt-0">
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <h3 className="font-medium mb-4 flex items-center gap-2">
                      <Command className="h-4 w-4" />
                      Keyboard Shortcuts
                    </h3>
                    <div className="space-y-3">
                      {[
                        { key: "⌘K", action: "Open Command Palette" },
                        { key: "⌘/", action: "Open Command Help" },
                        { key: "⌘Enter", action: "Execute Command" },
                        { key: "Esc", action: "Close/Cancel" },
                        { key: "↑↓", action: "Navigate Commands" },
                        { key: "Tab", action: "Autocomplete" }
                      ].map((shortcut, idx) => (
                        <div key={idx} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                          <span className="text-sm">{shortcut.action}</span>
                          <kbd className="px-2 py-1 text-xs bg-background rounded border border-border font-mono">
                            {shortcut.key}
                          </kbd>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h3 className="font-medium mb-4 flex items-center gap-2">
                      <BookOpen className="h-4 w-4" />
                      Voice Commands
                    </h3>
                    <div className="p-4 rounded-xl bg-muted/50 border border-border">
                      <p className="text-sm text-muted-foreground mb-4">
                        Click the microphone icon or say "Hey AI" to activate voice input.
                        Speak naturally - the AI understands context and intent.
                      </p>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm">
                          <CheckCircle className="h-4 w-4 text-green-500" />
                          <span>"Create a task to review papers"</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <CheckCircle className="h-4 w-4 text-green-500" />
                          <span>"Navigate to my notes"</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <CheckCircle className="h-4 w-4 text-green-500" />
                          <span>"What are my pending tasks?"</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </TabsContent>
            </CardContent>
          </Tabs>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-border bg-muted/30">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Need more help? The AI learns from your interactions and improves over time.
              </p>
              <Button onClick={onClose}>
                Got it
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

export default CommandHelp;
