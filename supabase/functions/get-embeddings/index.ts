import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";
import { validateUser } from "../_shared/auth.ts";

serve(async (req) => {
    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    // Validate the user
    const { user, response: authResponse } = await validateUser(req);
    if (authResponse) return authResponse;

    console.log(`[get-embeddings] Processing request for user: ${user?.id}`);

    try {
        const body = await req.json().catch(() => null);

        if (!body || !body.text) {
            return new Response(
                JSON.stringify({ error: 'Text input is required' }),
                { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
            );
        }

        const { text } = body;
        const apiKey = Deno.env.get('GOOGLE_API_KEY');

        if (!apiKey) {
            console.error('GOOGLE_API_KEY not found in environment');
            return new Response(
                JSON.stringify({ error: 'Google API key not configured. Please add GOOGLE_API_KEY to Supabase Edge Function Secrets.' }),
                { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 503 }
            );
        }

        // Use Google Gemini text-embedding-004 model
        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/text-embedding-004:embedContent?key=${apiKey}`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    model: 'models/text-embedding-004',
                    content: {
                        parts: [{ text }]
                    },
                }),
            }
        );

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            console.error('Google Embedding API error:', {
                status: response.status,
                statusText: response.statusText,
                error: errorData.error,
            });

            const message = errorData.error?.message || `Google API returned ${response.status}: ${response.statusText}`;

            // Re-throw with clear messaging for the status codes
            if (response.status === 401 || response.status === 403) {
                throw new Error(`Google API Authentication Error: ${message}. Check your API key.`);
            } else if (response.status === 429) {
                throw new Error(`Google API Quota Exceeded: ${message}`);
            }

            throw new Error(message);
        }

        const data = await response.json();
        const embedding = data?.embedding?.values;

        if (!embedding || !Array.isArray(embedding)) {
            console.error('Invalid response format from Google:', JSON.stringify(data).slice(0, 500));
            throw new Error('Failed to retrieve embedding from Google response format');
        }

        return new Response(
            JSON.stringify({ embedding }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );

    } catch (error) {
        console.error('Error in get-embeddings:', error.message);

        let status = 500;
        if (error.message.includes('API key') || error.message.includes('Authentication')) status = 503;
        if (error.message.includes('Quota')) status = 429;

        return new Response(
            JSON.stringify({
                error: error.message,
                details: "Check Supabase project secrets for GOOGLE_API_KEY configuration."
            }),
            {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: status
            }
        );
    }
});
