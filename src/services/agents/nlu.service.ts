/* eslint-disable @typescript-eslint/no-explicit-any */
import { agentTools } from "../agent.service";

export interface ParsedCommand {
  action: string;
  params: Record<string, unknown>;
  confidence: number;
  originalText: string;
  intent: string;
  entities: ExtractedEntity[];
  followUp?: string;
  clarificationNeeded?: boolean;
}

export interface ExtractedEntity {
  type: string;
  value: string;
  normalized: unknown;
  start: number;
  end: number;
}

export interface NLUContext {
  userId: string;
  currentPage?: string;
  recentCommands: string[];
  userPreferences?: Record<string, any>;
  conversationHistory: unknown[];
}

const SUPABASE_URL = "https://zysbkswyoxnlwahkbruf.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp5c2Jrc3d5b3hubHdhaGticnVmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAyMDY1OTAsImV4cCI6MjA4NTc4MjU5MH0.yOfKlFnOkHKlJ-IsNxk38RiAJKAtKeOnOFB-aG_XLsA";

class NaturalLanguageUnderstandingService {
  private entityPatterns: Map<string, RegExp>;

  constructor() {
    this.entityPatterns = new Map([
      ["priority", /\b(high|medium|low)\s+priority\b/gi],
      ["date", /\b(by\s+)?(tomorrow|today|yesterday|next\s+week|this\s+week|on\s+(?:monday|tuesday|wednesday|thursday|friday|saturday|sunday)|in\s+\d+\s+days?)\b/gi],
      ["time", /\b(\d{1,2}:\d{2}\s*(?:am|pm)?)\b/gi],
      ["page", /\b(go\s+to|open|navigate\s+to|switch\s+to)\s+(.+?)\b/gi],
      ["task", /\b(create|add|make)\s+(?:a\s+)?(?:new\s+)?task\b/gi],
      ["note", /\b(create|add|make)\s+(?:a\s+)?(?:new\s+)?note\b/gi],
      ["search", /\b(find|search|look\s+for|where\s+is)\b/gi],
      ["delete", /\b(delete|remove|get\s+rid\s+of)\b/gi],
      ["update", /\b(update|change|modify|edit)\b/gi],
      ["complete", /\b(complete|finish|mark\s+as\s+done|check\s+off)\b/gi]
    ]);
  }

  async parseCommand(text: string, context: NLUContext): Promise<ParsedCommand> {
    // Quick pattern matching for common commands
    const patternMatch = this.patternMatchCommand(text, context);

    if (patternMatch.confidence > 0.8) {
      return patternMatch;
    }

    // Use edge function for complex commands
    try {
      const llmMatch = await this.llmParseCommand(text, context);
      return llmMatch;
    } catch (error) {
      console.warn("LLM parsing failed, using pattern match:", error);
      return patternMatch;
    }
  }

  private patternMatchCommand(text: string, context: NLUContext): ParsedCommand {
    const lowerText = text.toLowerCase();
    const entities = this.extractEntities(text);

    // Navigation patterns
    if (/\b(navigate|go|open|switch)\s+(?:to\s+)?(.+?)\b/i.test(text)) {
      const page = this.extractPage(text, context);
      return {
        action: "navigate_to_page",
        params: { path: page },
        confidence: 0.9,
        originalText: text,
        intent: "navigation",
        entities
      };
    }

    // Task creation patterns
    if (/\b(create|add|make)\s+(?:a\s+)?(?:new\s+)?task/i.test(text)) {
      const title = this.extractTitle(text);
      const priority = this.extractPriority(text);
      const dueDate = this.extractDate(text);

      return {
        action: "create_task",
        params: {
          title,
          priority,
          due_date: dueDate
        },
        confidence: 0.85,
        originalText: text,
        intent: "task_creation",
        entities
      };
    }

    // Note creation patterns
    if (/\b(create|add|make)\s+(?:a\s+)?(?:new\s+)?note/i.test(text)) {
      const title = this.extractTitle(text);

      return {
        action: "create_note",
        params: { title, content: "" },
        confidence: 0.85,
        originalText: text,
        intent: "note_creation",
        entities
      };
    }

    // Task completion patterns
    if (/\b(complete|finish|mark\s+as\s+done)\s+(?:task\s+)?(.+?)\b/i.test(text)) {
      const taskId = this.extractTaskReference(text, context);

      return {
        action: "complete_task",
        params: { task_id: taskId },
        confidence: 0.8,
        originalText: text,
        intent: "task_completion",
        entities
      };
    }

    // Show/list tasks patterns
    if (/\b(show|list|get|display)\s+(?:my\s+)?(?:all\s+)?tasks?\b/i.test(text)) {
      return {
        action: "list_tasks",
        params: { status: "all" },
        confidence: 0.85,
        originalText: text,
        intent: "list_tasks",
        entities
      };
    }

    // Show/list notes patterns
    if (/\b(show|list|get|display)\s+(?:my\s+)?(?:all\s+)?(?:recent\s+)?notes?\b/i.test(text)) {
      return {
        action: "list_notes",
        params: { limit: 10 },
        confidence: 0.85,
        originalText: text,
        intent: "list_notes",
        entities
      };
    }

    // Search patterns
    if (/\b(find|search|look\s+for)\s+(.+?)\b/i.test(text)) {
      const query = text.replace(/\b(find|search|look\s+for)\s+/i, "").trim();
      const type = this.extractSearchType(text);

      return {
        action: "search_content",
        params: { query, type },
        confidence: 0.8,
        originalText: text,
        intent: "search",
        entities
      };
    }

    // Habit creation patterns
    if (/\b(create|add|start|track)\s+(?:a\s+)?(?:new\s+)?(?:daily\s+|weekly\s+)?habit/i.test(text)) {
      const name = this.extractTitle(text).replace(/habit/i, "").trim() || "New Habit";
      const frequency = lowerText.includes("weekly") ? "weekly" : "daily";

      return {
        action: "create_habit",
        params: { name, frequency },
        confidence: 0.8,
        originalText: text,
        intent: "habit_creation",
        entities
      };
    }

    // Explanation patterns
    if (/\b(explain|what\s+is|tell\s+me\s+about|describe)\s+(.+?)\b/i.test(text)) {
      const match = text.match(/\b(explain|what\s+is|tell\s+me\s+about|describe)\s+(.+)/i);
      const topic = match?.[2]?.trim() || text;

      return {
        action: "explain_concept",
        params: { topic, depth: "detailed" },
        confidence: 0.75,
        originalText: text,
        intent: "explanation",
        entities
      };
    }

    // Delete patterns
    if (/\b(delete|remove)\s+(?:the\s+)?(.+?)\b/i.test(text)) {
      const itemType = this.extractItemType(text);
      const itemId = this.extractItemId(text, context);

      return {
        action: `delete_${itemType}`,
        params: { [`${itemType}_id`]: itemId },
        confidence: 0.75,
        originalText: text,
        intent: "deletion",
        entities,
        clarificationNeeded: !itemId
      };
    }

    // Default - try general AI response
    return {
      action: "general_response",
      params: { query: text },
      confidence: 0.5,
      originalText: text,
      intent: "general",
      entities,
      clarificationNeeded: false
    };
  }

  private async llmParseCommand(text: string, context: NLUContext): Promise<ParsedCommand> {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/ai-agent`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${SUPABASE_KEY}`,
      },
      body: JSON.stringify({
        messages: [
          ...context.conversationHistory.slice(-5),
          { role: "user", content: text }
        ],
        mode: "agent",
        userId: context.userId
      }),
    });

    if (!response.ok) {
      throw new Error("Failed to parse command");
    }

    // Parse streaming response to get tool calls
    const reader = response.body?.getReader();
    if (!reader) throw new Error("No response body");

    const decoder = new TextDecoder();
    let buffer = "";
    const toolCalls: any[] = [];
    let content = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() || "";

      for (const line of lines) {
        if (line.startsWith("data: ")) {
          const data = line.slice(6).trim();
          if (data === "[DONE]") break;

          try {
            const parsed = JSON.parse(data);
            const delta = parsed.choices?.[0]?.delta;

            if (delta?.tool_calls) {
              for (const tc of delta.tool_calls) {
                const idx = tc.index || 0;
                if (!toolCalls[idx]) {
                  toolCalls[idx] = { id: tc.id, function: { name: "", arguments: "" } };
                }
                if (tc.function?.name) toolCalls[idx].function.name = tc.function.name;
                if (tc.function?.arguments) toolCalls[idx].function.arguments += tc.function.arguments;
              }
            }

            if (delta?.content) {
              content += delta.content;
            }
          } catch {
            // Skip invalid JSON
          }
        }
      }
    }

    // If we got tool calls, extract the action
    if (toolCalls.length > 0) {
      const tc = toolCalls[0];
      try {
        const args = JSON.parse(tc.function.arguments);
        return {
          action: tc.function.name,
          params: args,
          confidence: 0.9,
          originalText: text,
          intent: tc.function.name,
          entities: this.extractEntities(text)
        };
      } catch {
        // Failed to parse args
      }
    }

    // Return general response with content
    return {
      action: "general_response",
      params: { query: text, response: content },
      confidence: 0.6,
      originalText: text,
      intent: "general",
      entities: this.extractEntities(text)
    };
  }

  private extractEntities(text: string): ExtractedEntity[] {
    const entities: ExtractedEntity[] = [];

    this.entityPatterns.forEach((pattern, type) => {
      const matches = text.matchAll(pattern);
      for (const match of matches) {
        entities.push({
          type,
          value: match[0],
          normalized: this.normalizeEntity(type, match[0]),
          start: match.index || 0,
          end: (match.index || 0) + match[0].length
        });
      }
    });

    return entities;
  }

  private normalizeEntity(type: string, value: string): any {
    switch (type) {
      case "date":
        return this.parseDate(value);
      case "priority":
        return value.toLowerCase().replace(" priority", "");
      case "page":
        return value.replace(/^(go to|open|navigate to|switch to)\s+/i, "").trim();
      default:
        return value.trim();
    }
  }

  private parseDate(dateStr: string): string | null {
    const now = new Date();
    const lower = dateStr.toLowerCase();

    if (lower.includes("today")) {
      return now.toISOString().split("T")[0];
    }
    if (lower.includes("tomorrow")) {
      const tomorrow = new Date(now);
      tomorrow.setDate(tomorrow.getDate() + 1);
      return tomorrow.toISOString().split("T")[0];
    }
    if (lower.includes("next week")) {
      const nextWeek = new Date(now);
      nextWeek.setDate(nextWeek.getDate() + 7);
      return nextWeek.toISOString().split("T")[0];
    }
    if (/\bin\s+(\d+)\s+days?\b/i.test(lower)) {
      const days = parseInt(lower.match(/\bin\s+(\d+)\s+days?\b/i)?.[1] || "0");
      const future = new Date(now);
      future.setDate(future.getDate() + days);
      return future.toISOString().split("T")[0];
    }

    return null;
  }

  private extractPage(text: string, context: NLUContext): string {
    const pageMap: Record<string, string> = {
      "notes": "/notes",
      "tasks": "/tasks",
      "dashboard": "/",
      "home": "/",
      "github": "/github",
      "papers": "/papers",
      "courses": "/courses",
      "dsa": "/dsa",
      "flashcards": "/flashcards",
      "settings": "/settings",
      "habits": "/habits",
      "projects": "/projects",
      "agent": "/ai",
      "ai": "/ai",
      "pomodoro": "/pomodoro",
      "analytics": "/analytics",
      "resources": "/resources",
      "ml": "/ml-notes",
      "machine learning": "/ml-notes"
    };

    const lowerText = text.toLowerCase();

    for (const [key, path] of Object.entries(pageMap)) {
      if (lowerText.includes(key)) {
        return path;
      }
    }

    return "/";
  }

  private extractTitle(text: string): string {
    const patterns = [
      /(?:create|add|make)\s+(?:a\s+)?(?:new\s+)?(?:task|note|habit)\s+(?:to|for|about|called)\s+["']?(.+?)["']?(?:\s+(?:by|with|and|on)\s+|$)/i,
      /(?:create|add|make)\s+(?:a\s+)?(?:new\s+)?(?:task|note|habit)\s+["']?(.+?)["']?(?:\s+(?:by|with|and|on|priority)\s+|$)/i
    ];

    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match && match[1]) {
        return match[1].trim();
      }
    }

    // Fallback - extract everything after "task/note/habit"
    const fallback = text.match(/(?:task|note|habit)\s+(.+?)(?:\s+(?:by|with|priority|$))/i);
    if (fallback) {
      return fallback[1].replace(/^(to|for|about|called)\s+/i, "").trim();
    }

    return "Untitled";
  }

  private extractPriority(text: string): "low" | "medium" | "high" {
    const lowerText = text.toLowerCase();

    if (lowerText.includes("high priority") || lowerText.includes("urgent") || lowerText.includes("important")) {
      return "high";
    }
    if (lowerText.includes("low priority") || lowerText.includes("minor")) {
      return "low";
    }

    return "medium";
  }

  private extractDate(text: string): string | null {
    const dateEntities = this.extractEntities(text).filter(e => e.type === "date");

    if (dateEntities.length > 0) {
      return dateEntities[0].normalized as string | null;
    }

    return null;
  }

  private extractTaskReference(text: string, context: NLUContext): string {
    const patterns = [
      /(?:complete|finish|mark\s+as\s+done)\s+(?:task\s+)?["']?(.+?)["']?\b/i,
      /(?:complete|finish)\s+(?:the\s+)?task\s+(?:called\s+)?["']?(.+?)["']?\b/i
    ];

    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match) {
        return match[1].trim();
      }
    }

    return "";
  }

  private extractSearchType(text: string): "all" | "notes" | "tasks" | "papers" {
    const lowerText = text.toLowerCase();

    if (lowerText.includes("task")) return "tasks";
    if (lowerText.includes("note")) return "notes";
    if (lowerText.includes("paper")) return "papers";

    return "all";
  }

  private extractItemType(text: string): "task" | "note" | "habit" | "project" {
    const lowerText = text.toLowerCase();

    if (lowerText.includes("task")) return "task";
    if (lowerText.includes("note")) return "note";
    if (lowerText.includes("habit")) return "habit";
    if (lowerText.includes("project")) return "project";

    return "task";
  }

  private extractItemId(text: string, context: NLUContext): string | null {
    const patterns = [
      /(?:delete|remove)\s+(?:the\s+)?(?:task|note|habit|project)\s+["']?(.+?)["']?\b/i
    ];

    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match) {
        return match[1].trim();
      }
    }

    return null;
  }

  generateSuggestions(context: NLUContext): string[] {
    const suggestions: string[] = [];

    if (context.currentPage === "/tasks") {
      suggestions.push(
        "Create a high priority task",
        "Show my completed tasks",
        "What tasks are due this week?"
      );
    }

    if (context.currentPage === "/notes") {
      suggestions.push(
        "Create a new note about...",
        "Search my notes for...",
        "Show recent notes"
      );
    }

    suggestions.push(
      "Navigate to dashboard",
      "Show my productivity stats",
      "What can you help me with?"
    );

    return suggestions;
  }

  validateCommand(parsed: ParsedCommand): { valid: boolean; error?: string } {
    const toolExists = agentTools.some(t => t.name === parsed.action);

    if (!toolExists && !["unknown", "multi_step", "general_response", "explain_concept"].includes(parsed.action)) {
      return { valid: false, error: `Unknown action: ${parsed.action}` };
    }

    if (parsed.confidence < 0.3) {
      return { valid: false, error: "Low confidence in command interpretation" };
    }

    return { valid: true };
  }
}

export const nluService = new NaturalLanguageUnderstandingService();
