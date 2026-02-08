// AI Service - Uses secure backend edge function
import { supabase } from "@/integrations/supabase/client";

export interface AIConfig {
    apiKey: string;
    baseUrl?: string;
    model?: string;
}

const STORAGE_KEY_MODEL = "ai_model";

export const getAIConfig = (): AIConfig & { provider: string } => {
    return {
        apiKey: "", // No longer needed client-side
        baseUrl: "",
        model: localStorage.getItem(STORAGE_KEY_MODEL) || "llama-3.3-70b-versatile",
        provider: "groq"
    };
};

export const saveAIConfig = (config: AIConfig & { provider?: string }) => {
    if (config.model) localStorage.setItem(STORAGE_KEY_MODEL, config.model);
};

export interface AIRequest {
    action: 'continue' | 'improve' | 'summarize' | 'translate' | 'custom';
    text: string;
    prompt?: string;
}

export const isAIConfigured = () => {
    // AI is always available via edge function
    return true;
};

// Stream chat completion via edge function
export const streamCompletion = async (messages: Array<{ role: string; content: string }>) => {
    const response = await fetch(
        `https://zysbkswyoxnlwahkbruf.supabase.co/functions/v1/ai-chat`,
        {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp5c2Jrc3d5b3hubHdhaGticnVmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAyMDY1OTAsImV4cCI6MjA4NTc4MjU5MH0.yOfKlFnOkHKlJ-IsNxk38RiAJKAtKeOnOFB-aG_XLsA"}`,
            },
            body: JSON.stringify({ messages }),
        }
    );

    if (!response.ok) {
        const error = await response.json().catch(() => ({ error: "AI service error" }));
        throw new Error(error.error || "Failed to get AI response");
    }

    return {
        async *[Symbol.asyncIterator]() {
            const reader = response.body?.getReader();
            if (!reader) throw new Error("No response body");

            const decoder = new TextDecoder();
            let buffer = "";

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                buffer += decoder.decode(value, { stream: true });

                const lines = buffer.split("\n");
                buffer = lines.pop() || "";

                for (const line of lines) {
                    if (line.startsWith("data: ")) {
                        const data = line.slice(6).trim();
                        if (data === "[DONE]") return;

                        try {
                            const parsed = JSON.parse(data);
                            yield parsed;
                        } catch {
                            // Skip invalid JSON
                        }
                    }
                }
            }
        }
    };
};

export const callAI = async (request: AIRequest): Promise<{ result: string }> => {
    const response = await fetch(
        `https://zysbkswyoxnlwahkbruf.supabase.co/functions/v1/ai-chat`,
        {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp5c2Jrc3d5b3hubHdhaGticnVmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAyMDY1OTAsImV4cCI6MjA4NTc4MjU5MH0.yOfKlFnOkHKlJ-IsNxk38RiAJKAtKeOnOFB-aG_XLsA"}`,
            },
            body: JSON.stringify({
                action: request.action,
                text: request.text,
                prompt: request.prompt,
            }),
        }
    );

    if (!response.ok) {
        const error = await response.json().catch(() => ({ error: "AI service error" }));
        throw new Error(error.error || "Failed to get AI response");
    }

    // Parse streaming response
    const reader = response.body?.getReader();
    if (!reader) throw new Error("No response body");

    const decoder = new TextDecoder();
    let result = "";
    let buffer = "";

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
                    const content = parsed.choices?.[0]?.delta?.content;
                    if (content) result += content;
                } catch {
                    // Skip invalid JSON
                }
            }
        }
    }

    return { result };
};

// Embeddings - will need separate implementation or disable for now
export const getEmbedding = async (text: string): Promise<number[]> => {
    try {
        const { data, error } = await supabase.functions.invoke("get-embeddings", {
            body: { text }
        });

        if (error) throw error;
        return data.embedding;
    } catch (error) {
        console.error("Embedding failure:", error);
        // Fallback or rethrow? For now, rethrow to handle in UI if needed
        throw error;
    }
};
