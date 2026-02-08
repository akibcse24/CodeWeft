import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Tool definitions for the agent
const agentTools = [
  {
    type: "function",
    function: {
      name: "navigate_to_page",
      description: "Navigate to a specific page in the application",
      parameters: {
        type: "object",
        properties: {
          path: { type: "string", description: "The path to navigate to (e.g., /notes, /tasks, /dashboard)" }
        },
        required: ["path"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "create_task",
      description: "Create a new task",
      parameters: {
        type: "object",
        properties: {
          title: { type: "string", description: "The title of the task" },
          priority: { type: "string", enum: ["low", "medium", "high"], description: "Task priority" },
          due_date: { type: "string", description: "Due date in ISO format (optional)" }
        },
        required: ["title"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "create_note",
      description: "Create a new note",
      parameters: {
        type: "object",
        properties: {
          title: { type: "string", description: "The title of the note" },
          content: { type: "string", description: "Initial content (optional)" }
        },
        required: ["title"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "search_content",
      description: "Search for content across notes, tasks, or all",
      parameters: {
        type: "object",
        properties: {
          query: { type: "string", description: "Search query" },
          type: { type: "string", enum: ["all", "notes", "tasks", "papers"], description: "Type of content to search" }
        },
        required: ["query"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "complete_task",
      description: "Mark a task as completed",
      parameters: {
        type: "object",
        properties: {
          task_id: { type: "string", description: "The ID or name of the task to complete" }
        },
        required: ["task_id"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "list_tasks",
      description: "List all tasks, optionally filtered",
      parameters: {
        type: "object",
        properties: {
          status: { type: "string", enum: ["all", "pending", "completed"], description: "Filter by status" },
          priority: { type: "string", enum: ["low", "medium", "high"], description: "Filter by priority" }
        }
      }
    }
  },
  {
    type: "function",
    function: {
      name: "list_notes",
      description: "List recent notes",
      parameters: {
        type: "object",
        properties: {
          limit: { type: "number", description: "Maximum number of notes to return" }
        }
      }
    }
  },
  {
    type: "function",
    function: {
      name: "create_habit",
      description: "Create a new habit to track",
      parameters: {
        type: "object",
        properties: {
          name: { type: "string", description: "Name of the habit" },
          frequency: { type: "string", enum: ["daily", "weekly"], description: "How often to track" }
        },
        required: ["name"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "explain_concept",
      description: "Explain a programming or CS concept",
      parameters: {
        type: "object",
        properties: {
          topic: { type: "string", description: "The concept to explain" },
          depth: { type: "string", enum: ["brief", "detailed"], description: "Level of detail" }
        },
        required: ["topic"]
      }
    }
  }
];

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, mode = "chat", userId } = await req.json();
    const GROQ_API_KEY = Deno.env.get("GROQ_API_KEY");

    if (!GROQ_API_KEY) {
      throw new Error("GROQ_API_KEY is not configured");
    }

    const systemPrompt = mode === "agent" 
      ? `You are an intelligent AI agent for CodeWeft, a CS learning hub. You can:
- Navigate users to different pages (notes, tasks, dashboard, courses, dsa, habits, etc.)
- Create and manage tasks with priorities and due dates
- Create and search notes
- Track habits
- Explain programming concepts

When the user asks you to do something, use the appropriate tool. Be helpful, concise, and proactive.
If asked to do something you cannot do directly, explain what tools are available.

Current capabilities: navigation, task management, note management, habit tracking, search, and explanations.`
      : `You are a helpful AI assistant for CodeWeft, a CS learning hub. Help users with their questions about programming, computer science, and using the application. Be concise and helpful.`;

    const apiMessages = [
      { role: "system", content: systemPrompt },
      ...messages
    ];

    // For agent mode, include tools
    const requestBody: Record<string, unknown> = {
      model: "llama-3.3-70b-versatile",
      messages: apiMessages,
      stream: true,
    };

    if (mode === "agent") {
      requestBody.tools = agentTools;
      requestBody.tool_choice = "auto";
    }

    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${GROQ_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Groq API error:", response.status, errorText);
      
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again later." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      
      return new Response(JSON.stringify({ error: "AI service error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });

  } catch (error) {
    console.error("AI agent error:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
