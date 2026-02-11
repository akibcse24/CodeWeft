import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "./cors.ts";

/**
 * Validates the Supabase JWT from the request and returns the user object.
 * Returns a Response object if validation fails, which can be returned directly by the Edge Function.
 */
export async function validateUser(req: Request) {
    const authHeader = req.headers.get("Authorization");
    console.log(`[Auth] Validating request. Auth header present: ${!!authHeader}`);

    if (authHeader) {
        console.log(`[Auth] Auth header length: ${authHeader.length}`);
    }

    if (!authHeader) {
        console.warn("[Auth] No Authorization header found in request");
        return {
            user: null,
            response: new Response(
                JSON.stringify({ error: "Missing Authorization header", code: "NO_AUTH" }),
                { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            )
        };
    }

    const token = authHeader.replace("Bearer ", "");
    const supabaseClient = createClient(
        Deno.env.get("SUPABASE_URL") ?? "",
        Deno.env.get("SUPABASE_ANON_KEY") ?? "",
        {
            auth: {
                persistSession: false,
                autoRefreshToken: false,
            },
        }
    );

    try {
        const { data: { user }, error } = await supabaseClient.auth.getUser(token);

        if (error || !user) {
            console.error(`[Auth] User verification failed for token beginning with ${authHeader.substring(0, 15)}...`);
            console.error(`[Auth] Error details:`, error);

            return {
                user: null,
                response: new Response(
                    JSON.stringify({
                        error: "Unauthorized",
                        details: error?.message || "Invalid session",
                        code: "AUTH_FAILED",
                        header_preview: authHeader.substring(0, 15),
                        url_used: Deno.env.get("SUPABASE_URL")?.substring(0, 15),
                        key_configured: !!Deno.env.get("SUPABASE_ANON_KEY")
                    }),
                    { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
                )
            };
        }

        console.log(`[Auth] User validated: ${user.id}`);
        return { user, response: null };
    } catch (err) {
        console.error("[Auth] Unexpected error during verification:", err);
        return {
            user: null,
            response: new Response(
                JSON.stringify({ error: "Internal Auth Error", details: String(err) }),
                { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            )
        };
    }
}
