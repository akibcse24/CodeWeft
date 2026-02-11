import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";
import { validateUser } from "../_shared/auth.ts";

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  // Validate the user
  const { user, response: authResponse } = await validateUser(req);
  if (authResponse) return authResponse;

  try {
    const { messages, action, text, prompt } = await req.json();
    const GROQ_API_KEY = Deno.env.get("GROQ_API_KEY");

    if (!GROQ_API_KEY) {
      throw new Error("GROQ_API_KEY is not configured");
    }

    // Build messages based on action type or use provided messages
    let apiMessages;

    if (action) {
      // Handle predefined actions (continue, improve, summarize, translate, custom)
      const systemPrompt = "You are a helpful engineering assistant. Focus on technical accuracy and concise code generation.";
      let userPrompt = "";

      switch (action) {
        case 'continue':
          userPrompt = `Continue writing this text naturally:\n\n${text}`;
          break;
        case 'improve':
          userPrompt = `Improve this text for better clarity and style:\n\n${text}`;
          break;
        case 'summarize':
          userPrompt = `Summarize this text concisely:\n\n${text}`;
          break;
        case 'translate':
          userPrompt = `Translate this text to Spanish:\n\n${text}`;
          break;
        case 'custom':
          userPrompt = `${prompt || "Process this text"}:\n\n${text}`;
          break;
        default:
          userPrompt = text;
      }

      apiMessages = [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ];
    } else {
      // Use provided messages for chat
      apiMessages = [
        { role: "system", content: "You are a helpful assistant for a personal knowledge base. Provide clear, accurate, and helpful responses." },
        ...messages
      ];
    }

    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${GROQ_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: apiMessages,
        stream: true,
      }),
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

    // Return the stream
    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });

  } catch (error) {
    console.error("AI chat error:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
