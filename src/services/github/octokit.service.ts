/**
 * Octokit Service - Centralized GitHub API Client
 * 
 * Provides authenticated GitHub API access with:
 * - Automatic token injection from Supabase settings
 * - Rate limit monitoring and tracking
 * - Request queue to prevent rate limit violations
 * - Retry logic with exponential backoff
 * - Error handling and logging
 */

import { Octokit } from '@octokit/rest';
import { GraphqlResponseError } from '@octokit/graphql';
import { supabase } from '@/integrations/supabase/client';
import { RateLimitStatus } from '@/types/github';
import { logger } from '@/lib/logger';

// Singleton instance
let octokitInstance: Octokit | null = null;
let currentToken: string | null = null;

import { db } from '@/lib/db';

// ... (existing imports)

/**
 * Initialize Octokit with GitHub token from Supabase settings (via Dexie)
 */
// Initialize Octokit instance (with persistent token)
export async function initializeOctokit(forceRefresh = false, providedUserId?: string): Promise<Octokit> {
    // Fetch user's GitHub token from configured settings
    // console.log('[Octokit] Getting user/session...', providedUserId ? `(ID Provided: ${providedUserId})` : '(No ID)');

    let userId = providedUserId;

    if (!userId) {
        // Use getSession with a timeout race to prevent indefinite hanging
        const sessionPromise = supabase.auth.getSession();
        const timeoutPromise = new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Auth timeout')), 5000)
        );

        try {
            const result = await Promise.race([sessionPromise, timeoutPromise]) as { data: { session: { user: any } | null }, error: any };
            if (result.error) {
                console.error('[Octokit] Auth error:', result.error);
            }
            userId = result.data?.session?.user?.id;
        } catch (err) {
            console.error('[Octokit] Auth timeout or error:', err);
            // Fallback: try getUser if getSession fails/times out, but this might also hang?
            // Let's assume on timeout we fail fast. 
            // Can also try checking local storage directly if needed, but supabase client handles that.
            throw new Error('Authentication timed out. Please refresh.');
        }
    }

    if (!userId) {
        throw new Error('User not authenticated');
    }

    // console.log('[Octokit] User found:', userId);

    // LOCAL FIRST: Get token from Dexie
    // console.log('[Octokit] Fetching settings from Dexie...');
    const settings = await db.github_settings.where('user_id').equals(userId).first();
    // console.log('[Octokit] Dexie fetch complete.', settings ? 'Found settings.' : 'No settings found.');

    const newToken = settings?.github_token;

    if (!newToken) {
        console.error('[Octokit] Token missing in local DB.');
        throw new Error('GitHub token not configured. Please connect GitHub in Settings.');
    }

    // Return cached instance if token hasn't changed
    if (octokitInstance && !forceRefresh && currentToken === newToken) {
        console.log('[Octokit] Using cached instance.');
        return octokitInstance;
    }

    console.log('[Octokit] Creating new instance with token.');
    currentToken = newToken;

    // Create new Octokit instance for direct client-side usage
    octokitInstance = new Octokit({
        auth: currentToken,
        userAgent: 'CS-Learning-Hub/1.0.0',
        // No custom request handler needed for direct access
        // Octokit uses global fetch by default in modern environments
        log: {
            debug: (msg) => console.debug(`[Octokit Internal] ${msg}`),
            info: (msg) => console.info(`[Octokit Internal] ${msg}`),
            warn: (msg) => console.warn(`[Octokit Internal] ${msg}`),
            error: (msg) => console.error(`[Octokit Internal] ${msg}`),
        }
    });

    return octokitInstance;
}

/**
 * Get current Octokit instance (initializes if needed)
 */
export async function getOctokit(): Promise<Octokit> {
    if (!octokitInstance) {
        return await initializeOctokit();
    }
    return octokitInstance;
}

/**
 * Get current rate limit status
 */
export async function getRateLimitStatus(): Promise<RateLimitStatus> {
    const octokit = await getOctokit();

    const { data } = await octokit.rateLimit.get();

    const core = data.resources.core;

    // Save to Supabase for tracking
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {


        await supabase
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            .from('github_rate_limits' as any)
            .upsert({
                user_id: user.id,
                remaining: core.remaining,
                reset_at: new Date(core.reset * 1000).toISOString(),
                updated_at: new Date().toISOString(),
            });
    }

    return {
        limit: core.limit,
        remaining: core.remaining,
        reset: core.reset,
        used: core.used,
    };
}

/**
 * Check if rate limit is close to exhaustion
 * @param threshold - Percentage threshold (default: 10%)
 */
export async function isRateLimitLow(threshold = 0.1): Promise<boolean> {
    const status = await getRateLimitStatus();
    const percentageRemaining = status.remaining / status.limit;
    return percentageRemaining < threshold;
}

/**
 * Execute GitHub API request with retry logic
 * @param fn - Async function that makes the API call
 * @param maxRetries - Maximum number of retries (default: 3)
 */
export async function withRetry<T>(
    fn: () => Promise<T>,
    maxRetries = 3
): Promise<T> {
    let lastError: Error | null = null;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
        try {
            return await fn();
        } catch (error) {
            lastError = error as Error;

            // Don't retry on 404 or 401
            const status = (error as { status?: number })?.status;
            if (status === 404 || status === 401) {
                throw error;
            }

            // Exponential backoff
            const backoffMs = Math.pow(2, attempt) * 1000;
            logger.debug(`Retry attempt ${attempt + 1} after ${backoffMs}ms`);

            await new Promise(resolve => setTimeout(resolve, backoffMs));
        }
    }

    throw lastError || new Error('Max retries exceeded');
}

/**
 * Parse GitHub repository URL to extract owner and repo
 */
export function parseGitHubUrl(url: string): { owner: string; repo: string } | null {
    const match = url.match(/github\.com\/([^/]+)\/([^/]+)/);
    if (match) {
        return {
            owner: match[1],
            repo: match[2].replace(/\.git$/, '')
        };
    }
    return null;
}

/**
 * Refresh Octokit instance with new token
 */
export async function refreshOctokit(): Promise<Octokit> {
    octokitInstance = null;
    currentToken = null;
    return await initializeOctokit(true);
}

/**
 * Clear Octokit instance (on logout)
 */
export function clearOctokit(): void {
    octokitInstance = null;
    currentToken = null;
}
