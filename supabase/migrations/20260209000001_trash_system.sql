-- Migration: Trash System - Soft Delete Support
-- Created: 2026-02-09

-- Create deleted_pages table for soft delete support
CREATE TABLE IF NOT EXISTS deleted_pages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    original_parent_id UUID REFERENCES pages(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    icon TEXT,
    cover_url TEXT,
    content JSONB DEFAULT '[]'::jsonb,
    deleted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    permanently_delete_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '30 days'),
    deleted_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_deleted_pages_user_id ON deleted_pages(user_id);
CREATE INDEX IF NOT EXISTS idx_deleted_pages_original_parent_id ON deleted_pages(original_parent_id);
CREATE INDEX IF NOT EXISTS idx_deleted_pages_deleted_at ON deleted_pages(deleted_at);
CREATE INDEX IF NOT EXISTS idx_deleted_pages_permanently_delete_at ON deleted_pages(permanently_delete_at) WHERE permanently_delete_at <= NOW();

-- Enable RLS
ALTER TABLE deleted_pages ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own deleted pages"
    ON deleted_pages FOR SELECT
    USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own deleted pages"
    ON deleted_pages FOR INSERT
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete their own deleted pages"
    ON deleted_pages FOR DELETE
    USING (user_id = auth.uid());

CREATE POLICY "Users can update their own deleted pages"
    ON deleted_pages FOR UPDATE
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

-- Cleanup function for permanently deleting old records
CREATE OR REPLACE FUNCTION cleanup_deleted_pages()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    DELETE FROM deleted_pages
    WHERE permanently_delete_at <= NOW();
END;
$$;

-- Trigger function to automatically update updated_at
CREATE OR REPLACE FUNCTION update_deleted_pages_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_update_deleted_pages_updated_at
    BEFORE UPDATE ON deleted_pages
    FOR EACH ROW
    EXECUTE FUNCTION update_deleted_pages_updated_at();
