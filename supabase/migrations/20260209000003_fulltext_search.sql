-- Migration: Full-text Search Support
-- Created: 2026-02-09

-- Add search columns to pages table
ALTER TABLE pages ADD COLUMN IF NOT EXISTS search_content TEXT;
ALTER TABLE pages ADD COLUMN IF NOT EXISTS search_vector TSVECTOR;

-- Create GIN index for full-text search
CREATE INDEX IF NOT EXISTS idx_pages_search_vector ON pages USING GIN(search_vector);

-- Function to extract text from block content JSONB
CREATE OR REPLACE FUNCTION extract_text_from_blocks(blocks JSONB)
RETURNS TEXT
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
    result TEXT := '';
    block JSONB;
    block_text TEXT;
BEGIN
    IF blocks IS NULL OR blocks = '[]'::jsonb THEN
        RETURN '';
    END IF;

    FOR block IN SELECT * FROM jsonb_array_elements(blocks)
    LOOP
        -- Extract text from different block types
        block_text := '';
        
        -- Handle paragraph blocks
        IF block->>'type' = 'paragraph' THEN
            SELECT string_agg(
                COALESCE((text_obj->>'text'), ''),
                ''
            )
            INTO block_text
            FROM jsonb_array_elements(block->'content') AS text_obj;
        END IF;
        
        -- Handle heading blocks
        IF block->>'type' IN ('heading_1', 'heading_2', 'heading_3') THEN
            SELECT string_agg(
                COALESCE((text_obj->>'text'), ''),
                ''
            )
            INTO block_text
            FROM jsonb_array_elements(block->'content') AS text_obj;
        END IF;
        
        -- Handle list blocks
        IF block->>'type' IN ('bulleted_list_item', 'numbered_list_item', 'todo') THEN
            SELECT string_agg(
                COALESCE((text_obj->>'text'), ''),
                ''
            )
            INTO block_text
            FROM jsonb_array_elements(block->'content') AS text_obj;
        END IF;
        
        -- Handle quote blocks
        IF block->>'type' = 'quote' THEN
            SELECT string_agg(
                COALESCE((text_obj->>'text'), ''),
                ''
            )
            INTO block_text
            FROM jsonb_array_elements(block->'content') AS text_obj;
        END IF;
        
        -- Handle callout blocks
        IF block->>'type' = 'callout' THEN
            SELECT string_agg(
                COALESCE((text_obj->>'text'), ''),
                ''
            )
            INTO block_text
            FROM jsonb_array_elements(block->'content') AS text_obj;
        END IF;
        
        -- Handle code blocks
        IF block->>'type' = 'code' THEN
            block_text := COALESCE(block->>'code', '');
        END IF;

        -- Append to result with space separator
        IF block_text IS NOT NULL AND block_text != '' THEN
            result := result || ' ' || block_text;
        END IF;
    END LOOP;

    RETURN trim(result);
END;
$$;

-- Function to update search content for a page
CREATE OR REPLACE FUNCTION update_page_search_content()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    -- Combine title and extracted content
    NEW.search_content := COALESCE(NEW.title, '') || ' ' || extract_text_from_blocks(NEW.content);
    
    -- Create search vector with weights
    NEW.search_vector := 
        setweight(to_tsvector('english', COALESCE(NEW.title, '')), 'A') ||
        setweight(to_tsvector('english', extract_text_from_blocks(NEW.content)), 'B');
    
    RETURN NEW;
END;
$$;

-- Drop existing trigger if exists
DROP TRIGGER IF EXISTS trigger_update_page_search_content ON pages;

-- Create trigger to auto-update search content
CREATE TRIGGER trigger_update_page_search_content
    BEFORE INSERT OR UPDATE OF title, content ON pages
    FOR EACH ROW
    EXECUTE FUNCTION update_page_search_content();

-- RPC function for searching pages
CREATE OR REPLACE FUNCTION search_pages(
    search_query TEXT,
    user_uuid UUID DEFAULT NULL,
    page_limit INTEGER DEFAULT 20,
    page_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
    id UUID,
    title TEXT,
    icon TEXT,
    parent_id UUID,
    updated_at TIMESTAMPTZ,
    rank REAL
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.id,
        p.title,
        p.icon,
        p.parent_id,
        p.updated_at,
        ts_rank(p.search_vector, plainto_tsquery('english', search_query)) AS rank
    FROM pages p
    WHERE 
        p.search_vector @@ plainto_tsquery('english', search_query)
        AND (user_uuid IS NULL OR p.user_id = user_uuid)
    ORDER BY rank DESC, p.updated_at DESC
    LIMIT page_limit
    OFFSET page_offset;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION search_pages(TEXT, UUID, INTEGER, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION search_pages(TEXT, UUID, INTEGER, INTEGER) TO anon;

-- Backfill existing pages (optional, can be run separately for large datasets)
-- UPDATE pages SET search_content = COALESCE(title, '') || ' ' || extract_text_from_blocks(content);
-- UPDATE pages SET search_vector = 
--     setweight(to_tsvector('english', COALESCE(title, '')), 'A') ||
--     setweight(to_tsvector('english', extract_text_from_blocks(content)), 'B');
