import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

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
