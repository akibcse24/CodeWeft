-- Migration: Formula Property and Real-time Collaboration
-- Created: 2026-02-09

-- Update property_type check constraint to include 'formula'
DO $$
BEGIN
    -- First check if the constraint exists
    IF EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'database_properties_property_type_check'
    ) THEN
        -- Drop the existing constraint
        ALTER TABLE database_properties DROP CONSTRAINT database_properties_property_type_check;
    END IF;
    
    -- Add the new constraint with 'formula' included
    ALTER TABLE database_properties 
    ADD CONSTRAINT database_properties_property_type_check 
    CHECK (property_type IN ('title', 'text', 'number', 'select', 'multi_select', 'date', 'checkbox', 'url', 'email', 'phone', 'formula'));
END $$;

-- Add formula_expression column to database_properties
ALTER TABLE database_properties 
ADD COLUMN IF NOT EXISTS formula_expression TEXT,
ADD COLUMN IF NOT EXISTS formula_dependencies JSONB DEFAULT '[]'::jsonb;

-- Add cached_formula_value column to database_cells
ALTER TABLE database_cells 
ADD COLUMN IF NOT EXISTS cached_formula_value JSONB,
ADD COLUMN IF NOT EXISTS formula_error TEXT,
ADD COLUMN IF NOT EXISTS formula_last_calculated TIMESTAMPTZ;

-- Create index for formula cells
CREATE INDEX IF NOT EXISTS idx_database_cells_formula_error ON database_cells(formula_error) WHERE formula_error IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_database_cells_formula_calculated ON database_cells(formula_last_calculated) WHERE formula_last_calculated IS NOT NULL;

-- Page Presence table for real-time collaboration
CREATE TABLE IF NOT EXISTS page_presence (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    page_id UUID NOT NULL REFERENCES pages(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    user_name TEXT,
    user_avatar_url TEXT,
    cursor_position JSONB,
    selected_blocks JSONB DEFAULT '[]'::jsonb,
    is_active BOOLEAN NOT NULL DEFAULT true,
    last_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(page_id, user_id)
);

-- Indexes for page presence
CREATE INDEX IF NOT EXISTS idx_page_presence_page_id ON page_presence(page_id);
CREATE INDEX IF NOT EXISTS idx_page_presence_user_id ON page_presence(user_id);
CREATE INDEX IF NOT EXISTS idx_page_presence_last_seen ON page_presence(last_seen_at);
CREATE INDEX IF NOT EXISTS idx_page_presence_is_active ON page_presence(is_active) WHERE is_active = true;

-- Enable RLS for page_presence
ALTER TABLE page_presence ENABLE ROW LEVEL SECURITY;

-- RLS Policies for page_presence
CREATE POLICY "Users can view presence for pages they have access to"
    ON page_presence FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM pages p
            LEFT JOIN page_shares ps ON p.id = ps.page_id
            LEFT JOIN page_collaborators pc ON p.id = pc.page_id
            WHERE p.id = page_presence.page_id
            AND (
                p.user_id = auth.uid()
                OR ps.is_public = true
                OR pc.user_id = auth.uid()
            )
        )
    );

CREATE POLICY "Users can update their own presence"
    ON page_presence FOR ALL
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

-- Cleanup function for old presence records
CREATE OR REPLACE FUNCTION cleanup_old_page_presence()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Delete presence records older than 5 minutes
    DELETE FROM page_presence
    WHERE last_seen_at < NOW() - INTERVAL '5 minutes'
    OR (is_active = false AND last_seen_at < NOW() - INTERVAL '1 hour');
END;
$$;

-- Trigger function to update last_seen_at automatically
CREATE OR REPLACE FUNCTION update_page_presence_last_seen()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.last_seen_at = NOW();
    RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_update_page_presence_last_seen
    BEFORE UPDATE ON page_presence
    FOR EACH ROW
    EXECUTE FUNCTION update_page_presence_last_seen();

-- Function to upsert page presence
CREATE OR REPLACE FUNCTION upsert_page_presence(
    p_page_id UUID,
    p_user_id UUID,
    p_user_name TEXT DEFAULT NULL,
    p_user_avatar_url TEXT DEFAULT NULL,
    p_cursor_position JSONB DEFAULT NULL,
    p_selected_blocks JSONB DEFAULT '[]'::jsonb
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    INSERT INTO page_presence (
        page_id, user_id, user_name, user_avatar_url, 
        cursor_position, selected_blocks, is_active, last_seen_at
    )
    VALUES (
        p_page_id, p_user_id, p_user_name, p_user_avatar_url,
        p_cursor_position, p_selected_blocks, true, NOW()
    )
    ON CONFLICT (page_id, user_id)
    DO UPDATE SET
        user_name = EXCLUDED.user_name,
        user_avatar_url = EXCLUDED.user_avatar_url,
        cursor_position = EXCLUDED.cursor_position,
        selected_blocks = EXCLUDED.selected_blocks,
        is_active = true,
        last_seen_at = NOW();
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION upsert_page_presence(UUID, UUID, TEXT, TEXT, JSONB, JSONB) TO authenticated;
