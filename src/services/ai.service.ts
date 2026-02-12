// AI Service - Uses secure backend edge function
import { supabase, safeInvoke } from "@/integrations/supabase/client";

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
    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token || import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
    const projectUrl = import.meta.env.VITE_SUPABASE_URL;

    if (!projectUrl) throw new Error("VITE_SUPABASE_URL is not defined");

    const response = await fetch(
        `${projectUrl}/functions/v1/ai-chat`,
        {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ messages }),
        }
    );

    if (!response.ok) {
        let errorMessage = "AI service error";
        try {
            const error = await response.json();
            errorMessage = error.error || errorMessage;
        } catch {
            // Ignore JSON parse error
        }
        throw new Error(errorMessage);
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
    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token || import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
    const projectUrl = import.meta.env.VITE_SUPABASE_URL;

    if (!projectUrl) throw new Error("VITE_SUPABASE_URL is not defined");

    const response = await fetch(
        `${projectUrl}/functions/v1/ai-chat`,
        {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
                action: request.action,
                text: request.text,
                prompt: request.prompt,
            }),
        }
    );

    if (!response.ok) {
        let errorMessage = "AI service error";
        try {
            const error = await response.json();
            errorMessage = error.error || errorMessage;
        } catch {
            // Ignore JSON parse error
        }
        throw new Error(errorMessage);
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
    if (!text) return [];

    const { data, error } = await safeInvoke<{ embedding: number[] }>("get-embeddings", {
        body: { text },
        showErrorToast: false
    });

    if (error) {
        // We already have a toast from safeInvoke, but we can be more specific here if needed
        console.warn("[AI Service] Falling back to zero-vector due to embedding failure. Check Supabase function logs.");
        return new Array(768).fill(0);
    }

    if (!data?.embedding) {
        console.error("Embedding response missing embedding data:", data);
        return new Array(768).fill(0);
    }

    return data.embedding;
};
