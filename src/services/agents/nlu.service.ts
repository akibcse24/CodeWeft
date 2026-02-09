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
  userPreferences?: Record<string, unknown>;
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
      ["complete", /\b(complete|finish|mark\s+as\s+done|check\s+off)\b/gi],
      ["github", /\b(github|repo|repository|gist|octokit)\b/gi]
    ]);
  }

  async parseCommand(text: string, context: NLUContext): Promise<ParsedCommand> {
    const patternMatch = this.patternMatchCommand(text, context);

    if (patternMatch.confidence > 0.8) {
      return patternMatch;
    }

    try {
      return await this.llmParseCommand(text, context);
    } catch (error) {
      console.warn("LLM parsing failed, using pattern match:", error);
      return patternMatch;
    }
  }

  private patternMatchCommand(text: string, context: NLUContext): ParsedCommand {
    const lowerText = text.toLowerCase();
    const entities = this.extractEntities(text);

    // Navigation
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

    // GitHub Repo patterns
    if (/\b(list|show|get)\s+(?:my\s+)?(?:github\s+)?(repos|repositories)\b/i.test(text)) {
      return {
        action: "list_github_repositories",
        params: { sort: "updated" },
        confidence: 0.9,
        originalText: text,
        intent: "github_list_repos",
        entities
      };
    }

    if (/\b(create|make|add)\s+(?:a\s+)?(?:new\s+)?(?:github\s+)?(repo|repository)\s+(?:called\s+)?(.+?)\b/i.test(text)) {
      const match = text.match(/\b(create|make|add)\s+(?:a\s+)?(?:new\s+)?(?:github\s+)?(repo|repository)\s+(?:called\s+)?(.+?)\b/i);
      const name = match?.[3]?.trim() || "new-repo";
      return {
        action: "create_github_repository",
        params: { name, description: "Created via CodeWeft AI" },
        confidence: 0.9,
        originalText: text,
        intent: "github_create_repo",
        entities
      };
    }

    // GitHub Gist patterns
    if (/\b(list|show|get)\s+(?:my\s+)?(?:github\s+)?gists\b/i.test(text)) {
      return {
        action: "list_github_gists",
        params: {},
        confidence: 0.9,
        originalText: text,
        intent: "github_list_gists",
        entities
      };
    }

    // GitHub Profile patterns
    if (/\b(show|get|who\s+am\s+i\s+on)\s+github\b/i.test(text) || /\b(my\s+)?github\s+profile\b/i.test(text)) {
      return {
        action: "get_github_profile",
        params: {},
        confidence: 0.9,
        originalText: text,
        intent: "github_profile",
        entities
      };
    }

    // GitHub Advanced: Workflows
    if (/\b(list|show)\s+(?:github\s+)?workflows?\s+(?:in|for)\s+([a-zA-Z0-9_-]+\/[a-zA-Z0-9_-]+)\b/i.test(text)) {
      const { owner, repo } = this.extractGitHubParams(text);
      return {
        action: "list_github_workflows",
        params: { owner, repo },
        confidence: 0.9,
        originalText: text,
        intent: "github_list_workflows",
        entities
      };
    }

    if (/\b(trigger|run|start)\s+(?:github\s+)?workflow\s+(.+?)\s+(?:in|for)\s+([a-zA-Z0-9_-]+\/[a-zA-Z0-9_-]+)\b/i.test(text)) {
      const match = text.match(/\b(trigger|run|start)\s+(?:github\s+)?workflow\s+(.+?)\s+(?:in|for)\s+([a-zA-Z0-9_-]+\/[a-zA-Z0-9_-]+)\b/i);
      const { owner, repo } = this.extractGitHubParams(text);
      return {
        action: "trigger_github_workflow",
        params: { owner, repo, workflow_id: match?.[2]?.trim() },
        confidence: 0.9,
        originalText: text,
        intent: "github_trigger_workflow",
        entities
      };
    }

    // GitHub Advanced: Git Operations (Files/Branches)
    if (/\b(read|show|get)\s+(?:content\s+of\s+)?file\s+(.+?)\s+(?:in|from)\s+([a-zA-Z0-9_-]+\/[a-zA-Z0-9_-]+)\b/i.test(text)) {
      const match = text.match(/\b(read|show|get)\s+(?:content\s+of\s+)?file\s+(.+?)\s+(?:in|from)\s+([a-zA-Z0-9_-]+\/[a-zA-Z0-9_-]+)\b/i);
      const { owner, repo } = this.extractGitHubParams(text);
      return {
        action: "get_github_file_content",
        params: { owner, repo, path: match?.[2]?.trim() },
        confidence: 0.9,
        originalText: text,
        intent: "github_read_file",
        entities
      };
    }

    if (/\b(list|show|get)\s+branches\s+(?:in|for)\s+([a-zA-Z0-9_-]+\/[a-zA-Z0-9_-]+)\b/i.test(text)) {
      const { owner, repo } = this.extractGitHubParams(text);
      return {
        action: "list_github_branches",
        params: { owner, repo },
        confidence: 0.9,
        originalText: text,
        intent: "github_list_branches",
        entities
      };
    }

    if (/\b(list|show|get)\s+(?:open\s+)?(?:pull\s+requests|prs)\s+(?:in|for)\s+([a-zA-Z0-9_-]+\/[a-zA-Z0-9_-]+)\b/i.test(text)) {
      const { owner, repo } = this.extractGitHubParams(text);
      return {
        action: "list_github_pull_requests",
        params: { owner, repo, state: "open" },
        confidence: 0.9,
        originalText: text,
        intent: "github_list_prs",
        entities
      };
    }

    if (/\b(search)\s+(?:github\s+)?code\s+(?:for\s+)?(.+?)\b/i.test(text)) {
      const match = text.match(/\b(search)\s+(?:github\s+)?code\s+(?:for\s+)?(.+?)\b/i);
      return {
        action: "search_github_code",
        params: { query: match?.[2]?.trim() },
        confidence: 0.85,
        originalText: text,
        intent: "github_search_code",
        entities
      };
    }

    // Codespaces
    if (/\b(list|show|get)\s+(?:my\s+)?codespaces\b/i.test(text)) {
      return {
        action: "list_codespaces",
        params: {},
        confidence: 0.9,
        originalText: text,
        intent: "github_list_codespaces",
        entities
      };
    }

    if (/\b(start|resume)\s+codespace\s+([a-zA-Z0-9_-]+)\b/i.test(text)) {
      const match = text.match(/\b(?:start|resume)\s+codespace\s+([a-zA-Z0-9_-]+)\b/i);
      return {
        action: "start_codespace",
        params: { name: match ? match[1] : "" },
        confidence: 0.9,
        originalText: text,
        intent: "github_start_codespace",
        entities
      };
    }

    if (/\b(stop|pause|suspend)\s+codespace\s+([a-zA-Z0-9_-]+)\b/i.test(text)) {
      const match = text.match(/\b(?:stop|pause|suspend)\s+codespace\s+([a-zA-Z0-9_-]+)\b/i);
      return {
        action: "stop_codespace",
        params: { name: match ? match[1] : "" },
        confidence: 0.9,
        originalText: text,
        intent: "github_stop_codespace",
        entities
      };
    }

    if (/\b(open|show|access)\s+terminal\s+(?:for\s+)?codespace\s+([a-zA-Z0-9_-]+)\b/i.test(text)) {
      const match = text.match(/\b(?:open|show|access)\s+terminal\s+(?:for\s+)?codespace\s+([a-zA-Z0-9_-]+)\b/i);
      return {
        action: "open_codespace_terminal",
        params: { name: match ? match[1] : "" },
        confidence: 0.9,
        originalText: text,
        intent: "github_open_terminal",
        entities
      };
    }

    if (/\b(create|new)\s+codespace\s+(?:for|in)\s+([a-zA-Z0-9_-]+\/[a-zA-Z0-9_-]+)\b/i.test(text)) {
      const { owner, repo } = this.extractGitHubParams(text);
      return {
        action: "create_codespace",
        params: { owner, repo },
        confidence: 0.9,
        originalText: text,
        intent: "github_create_codespace",
        entities
      };
    }

    // Task creation
    if (/\b(create|add|make)\s+(?:a\s+)?(?:new\s+)?task/i.test(text)) {
      const title = this.extractTitle(text);
      const priority = this.extractPriority(text);
      const dueDate = this.extractDate(text);

      return {
        action: "create_task",
        params: { title, priority, due_date: dueDate },
        confidence: 0.85,
        originalText: text,
        intent: "task_creation",
        entities
      };
    }

    // Note creation
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

    // Task completion
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

    // List tasks
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

    // Search
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

    // Explanation
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

    // Default
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

    if (!response.ok) throw new Error("Failed to parse command");

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
                if (!toolCalls[idx]) toolCalls[idx] = { id: tc.id, function: { name: "", arguments: "" } };
                if (tc.function?.name) toolCalls[idx].function.name = tc.function.name;
                if (tc.function?.arguments) toolCalls[idx].function.arguments += tc.function.arguments;
              }
            }
            if (delta?.content) content += delta.content;
          } catch { /* skip */ }
        }
      }
    }

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
      } catch { /* skip */ }
    }

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
      case "date": return this.parseDate(value);
      case "priority": return value.toLowerCase().replace(" priority", "");
      case "page": return value.replace(/^(go to|open|navigate to|switch to)\s+/i, "").trim();
      default: return value.trim();
    }
  }

  private parseDate(dateStr: string): string | null {
    const now = new Date();
    const lower = dateStr.toLowerCase();
    if (lower.includes("today")) return now.toISOString().split("T")[0];
    if (lower.includes("tomorrow")) {
      const d = new Date(now);
      d.setDate(d.getDate() + 1);
      return d.toISOString().split("T")[0];
    }
    if (lower.includes("next week")) {
      const d = new Date(now);
      d.setDate(d.getDate() + 7);
      return d.toISOString().split("T")[0];
    }
    const inDaysMatch = lower.match(/\bin\s+(\d+)\s+days?\b/i);
    if (inDaysMatch) {
      const d = new Date(now);
      d.setDate(d.getDate() + parseInt(inDaysMatch[1]));
      return d.toISOString().split("T")[0];
    }
    return null;
  }

  private extractPage(text: string, _context: NLUContext): string {
    const pageMap: Record<string, string> = {
      "notes": "/notes", "tasks": "/tasks", "dashboard": "/", "home": "/",
      "github": "/github", "papers": "/papers", "courses": "/courses",
      "dsa": "/dsa", "flashcards": "/flashcards", "settings": "/settings",
      "habits": "/habits", "projects": "/projects", "ai": "/ai",
      "pomodoro": "/pomodoro", "analytics": "/analytics"
    };
    const lowerText = text.toLowerCase();
    for (const [key, path] of Object.entries(pageMap)) {
      if (lowerText.includes(key)) return path;
    }
    return "/";
  }

  private extractTitle(text: string): string {
    const match = text.match(/(?:create|add|make)\s+(?:a\s+)?(?:new\s+)?(?:task|note|habit)\s+(?:to|for|about|called)\s+["']?(.+?)["']?(?:\s+|$)/i);
    return match?.[1]?.trim() || "Untitled";
  }

  private extractPriority(text: string): "low" | "medium" | "high" {
    const lower = text.toLowerCase();
    if (lower.includes("high") || lower.includes("urgent")) return "high";
    if (lower.includes("low")) return "low";
    return "medium";
  }

  private extractDate(text: string): string | null {
    const dateEntities = this.extractEntities(text).filter(e => e.type === "date");
    return dateEntities.length > 0 ? (dateEntities[0].normalized as string) : null;
  }

  private extractTaskReference(text: string, _context: NLUContext): string {
    const match = text.match(/(?:complete|finish|mark\s+as\s+done)\s+(?:task\s+)?["']?(.+?)["']?\b/i);
    return match?.[1]?.trim() || "";
  }

  private extractSearchType(text: string): "all" | "notes" | "tasks" | "papers" {
    const lower = text.toLowerCase();
    if (lower.includes("task")) return "tasks";
    if (lower.includes("note")) return "notes";
    if (lower.includes("paper")) return "papers";
    return "all";
  }

  private extractItemType(text: string): "task" | "note" | "habit" | "project" {
    const lower = text.toLowerCase();
    if (lower.includes("note")) return "note";
    if (lower.includes("habit")) return "habit";
    if (lower.includes("project")) return "project";
    return "task";
  }

  private extractItemId(text: string, _context: NLUContext): string | null {
    const match = text.match(/(?:delete|remove)\s+(?:the\s+)?(?:task|note|habit|project)\s+["']?(.+?)["']?\b/i);
    return match?.[1]?.trim() || null;
  }

  private extractGitHubParams(text: string): { owner: string; repo: string } {
    const match = text.match(/\b([a-zA-Z0-9_-]+)\/([a-zA-Z0-9_-]+)\b/);
    if (match) {
      return { owner: match[1], repo: match[2] };
    }
    return { owner: "", repo: "" };
  }

  generateSuggestions(context: NLUContext): string[] {
    const suggestions: string[] = [];
    if (context.currentPage === "/tasks") suggestions.push("Create a high priority task", "Show my completed tasks");
    if (context.currentPage === "/notes") suggestions.push("Create a new note", "Search my notes");
    suggestions.push("Show my GitHub repos", "Show my productivity stats");
    return suggestions;
  }

  validateCommand(parsed: ParsedCommand): { valid: boolean; error?: string } {
    const toolExists = agentTools.some(t => t.name === parsed.action);
    if (!toolExists && !["unknown", "general_response", "explain_concept"].includes(parsed.action)) {
      return { valid: false, error: `Unknown action: ${parsed.action}` };
    }
    if (parsed.confidence < 0.3) return { valid: false, error: "Low confidence" };
    return { valid: true };
  }
}

export const nluService = new NaturalLanguageUnderstandingService();
