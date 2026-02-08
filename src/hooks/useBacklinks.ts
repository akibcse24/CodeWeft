import { useMemo } from 'react';
import { Block } from '@/components/editor/BlockEditor';
import { Json } from '@/integrations/supabase/types';

interface Page {
    id: string;
    title: string;
    content: Block[] | Json | null;
    updated_at: string;
}

export function useBacklinks(currentPageId: string, allPages: Page[]) {
    return useMemo(() => {
        if (!currentPageId || !allPages) return [];

        const links: Page[] = [];

        allPages.forEach(page => {
            // Skip self-reference
            if (page.id === currentPageId) return;

            // Check if this page links to currentPageId
            const hasLink = checkBlocksForLink(page.content, currentPageId);

            if (hasLink) {
                links.push(page);
            }
        });

        return links;
    }, [currentPageId, allPages]);
}

function checkBlocksForLink(blocks: unknown, targetId: string): boolean {
    if (!Array.isArray(blocks)) return false;

    for (const block of blocks) {
        if (typeof block !== 'object' || block === null) continue;

        const blockObj = block as Record<string, unknown>;

        // 1. Check explicit link blocks
        if (blockObj.type === 'link' || blockObj.type === 'bookmark') {
            const linkUrl = blockObj.linkUrl;
            if (typeof linkUrl === 'string' && (
                linkUrl.includes(targetId) ||
                linkUrl === `page://${targetId}`
            )) {
                return true;
            }
        }

        // 2. Check text content for wiki links or markdown links
        // Matches: [Title](page://id) OR [[Title|id]] OR simple containment of ID if unique enough (risky)
        // Let's stick to page:// protocol
        const content = blockObj.content;
        if (typeof content === 'string') {
            if (content.includes(`page://${targetId}`)) {
                return true;
            }
            if (content.includes(`(${targetId})`)) { // simplistic markdown check
                return true;
            }
        }

        // 3. Search children recursively
        if (blockObj.children && checkBlocksForLink(blockObj.children, targetId)) {
            return true;
        }

        // 4. Search columns
        if (Array.isArray(blockObj.columns)) {
            for (const column of blockObj.columns) {
                if (checkBlocksForLink(column, targetId)) return true;
            }
        }
    }

    return false;
}
