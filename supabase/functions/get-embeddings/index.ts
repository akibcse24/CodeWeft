import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version, x-requested-with",
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
    "Access-Control-Max-Age": "86400",
};

serve(async (req) => {
    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders, status: 200 });
    }

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
            throw new Error(
                errorData.error?.message || `Google API returned ${response.status}: ${response.statusText}`
            );
        }

        const data = await response.json();
        const embedding = data?.embedding?.values;

        if (!embedding || !Array.isArray(embedding)) {
            console.error('Invalid response format from Google:', JSON.stringify(data).slice(0, 500));
            throw new Error('Failed to retrieve embedding from Google response');
        }

        return new Response(
            JSON.stringify({ embedding }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );

    } catch (error) {
        console.error('Error in get-embeddings:', error.message);
        return new Response(
            JSON.stringify({ error: error.message }),
            {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: error.message.includes('API key') ? 503 : 500
            }
        );
    }
});
