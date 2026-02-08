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

/**
 * Initialize Octokit with GitHub token from Supabase settings
 */
export async function initializeOctokit(forceRefresh = false): Promise<Octokit> {
    // Return cached instance if token hasn't changed
    if (octokitInstance && !forceRefresh && currentToken) {
        return octokitInstance;
    }

    // Fetch user's GitHub token from Supabase
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        throw new Error('User not authenticated');
    }

    const { data: settings, error } = await supabase
        .from('github_settings')
        .select('github_token')
        .eq('user_id', user.id)
        .maybeSingle();

    if (error) throw error;

    if (!settings?.github_token) {
        throw new Error('GitHub token not configured. Please connect GitHub in Settings.');
    }

    currentToken = settings.github_token;

    // Create new Octokit instance with authentication
    octokitInstance = new Octokit({
        auth: currentToken,
        userAgent: 'my-personal-space/1.0.0',
        throttle: {
            onRateLimit: (retryAfter, options, octokit) => {
                logger.warn(
                    `Request quota exhausted for request ${options.method} ${options.url}`
                );

                if (options.request.retryCount === 0) {
                    // Retry once after rate limit
                    logger.info(`Retrying after ${retryAfter} seconds!`);
                    return true;
                }
                return false;
            },
            onSecondaryRateLimit: (retryAfter, options, octokit) => {
                // Does not retry - warns only
                logger.warn(
                    `Secondary rate limit hit for request ${options.method} ${options.url}`
                );
                return false;
            },
        },
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
