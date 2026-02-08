import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        const { text } = await req.json();

        if (!text) {
            return new Response(
                JSON.stringify({ error: 'Text input is required' }),
                { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
            );
        }

        // We use the built-in OpenAI service if available via environment variables
        // or just proxy to OpenAI if the user provides a key.
        // For this implementation, we assume the user has OPENAI_API_KEY in their Supabase Secrets.
        const apiKey = Deno.env.get('OPENAI_API_KEY');

        if (!apiKey) {
            console.error('OPENAI_API_KEY not found in environment');
            return new Response(
                JSON.stringify({ error: 'OpenAI API key not configured in Edge Function secrets' }),
                { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
            );
        }

        const response = await fetch('https://api.openai.com/v1/embeddings', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                input: text,
                model: 'text-embedding-3-small',
            }),
        });

        const data = await response.json();

        if (data.error) {
            throw new Error(data.error.message || 'OpenAI API error');
        }

        const embedding = data.data[0].embedding;

        return new Response(
            JSON.stringify({ embedding }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );

    } catch (error) {
        console.error('Error in get-embeddings:', error);
        return new Response(
            JSON.stringify({ error: error.message }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
        );
    }
});
