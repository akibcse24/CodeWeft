import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";
import { validateUser } from "../_shared/auth.ts";

serve(async (req) => {
    if (req.method === "OPTIONS") {
        return new Response("ok", { headers: corsHeaders });
    }

    // Validate the user
    const { user, response: authResponse } = await validateUser(req);
    if (authResponse) return authResponse;

    try {
        const formData = await req.formData();
        const file = formData.get("file") as File;

        if (!file) {
            throw new Error("No file uploaded");
        }

        const apiKey = Deno.env.get("OPENAI_API_KEY");
        if (!apiKey) {
            throw new Error("OPENAI_API_KEY is not configured");
        }

        const openAiFormData = new FormData();
        openAiFormData.append("file", file);
        openAiFormData.append("model", "whisper-1");

        const response = await fetch("https://api.openai.com/v1/audio/transcriptions", {
            method: "POST",
            headers: {
                Authorization: `Bearer ${apiKey}`,
            },
            body: openAiFormData,
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error?.message || "Transcription failed");
        }

        return new Response(JSON.stringify({ text: data.text }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
        });

    } catch (error) {
        console.error("Transcription error:", error);
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }
});
