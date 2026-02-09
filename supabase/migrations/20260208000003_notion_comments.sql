-- Migration: Core Notion-like Features - Part 3: Comments & Discussions
-- Description: Adds threaded comments on pages and blocks
-- Created: 2026-02-08

-- ============================================
-- PAGE COMMENTS (Threaded discussions)
-- ============================================
CREATE TABLE IF NOT EXISTS public.page_comments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  page_id UUID NOT NULL REFERENCES public.pages(id) ON DELETE CASCADE,
  block_id TEXT,
  parent_id UUID REFERENCES public.page_comments(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  mentions TEXT[] DEFAULT '{}',
  resolved_at TIMESTAMPTZ,
  resolved_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_page_comments_page ON public.page_comments(page_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_page_comments_block ON public.page_comments(block_id, created_at DESC) WHERE block_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_page_comments_parent ON public.page_comments(parent_id);
CREATE INDEX IF NOT EXISTS idx_page_comments_unresolved ON public.page_comments(page_id, resolved_at) WHERE resolved_at IS NULL;

-- Enable RLS
ALTER TABLE public.page_comments ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view comments on accessible pages" 
ON public.page_comments FOR SELECT 
USING (
  EXISTS (SELECT 1 FROM public.pages WHERE id = page_id AND user_id = auth.uid())
);

CREATE POLICY "Users can create comments on own pages" 
ON public.page_comments FOR INSERT 
WITH CHECK (
  EXISTS (SELECT 1 FROM public.pages WHERE id = page_id AND user_id = auth.uid())
);

CREATE POLICY "Users can update own comments" 
ON public.page_comments FOR UPDATE 
USING (
  auth.uid() = user_id OR 
  EXISTS (SELECT 1 FROM public.pages WHERE id = page_id AND user_id = auth.uid())
);

CREATE POLICY "Users can delete own comments" 
ON public.page_comments FOR DELETE 
USING (
  auth.uid() = user_id OR 
  EXISTS (SELECT 1 FROM public.pages WHERE id = page_id AND user_id = auth.uid())
);

CREATE POLICY "Users can resolve comments on own pages" 
ON public.page_comments FOR UPDATE 
USING (
  (resolved_at IS NOT NULL) OR
  EXISTS (SELECT 1 FROM public.pages WHERE id = page_id AND user_id = auth.uid())
);

-- ============================================
-- COMMENT MENTIONS (Track @ mentions in comments)
-- ============================================
CREATE TABLE IF NOT EXISTS public.comment_mentions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  comment_id UUID NOT NULL REFERENCES public.page_comments(id) ON DELETE CASCADE,
  mentioned_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  mentioned_page_id UUID REFERENCES public.pages(id) ON DELETE CASCADE,
  mentioned_block_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_comment_mentions_comment ON public.comment_mentions(comment_id);
CREATE INDEX IF NOT EXISTS idx_comment_mentions_user ON public.comment_mentions(mentioned_user_id);

-- Enable RLS
ALTER TABLE public.comment_mentions ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own mentions" 
ON public.comment_mentions FOR SELECT 
USING (
  auth.uid() = mentioned_user_id OR
  EXISTS (
    SELECT 1 FROM public.page_comments pc
    WHERE pc.id = comment_id
    AND EXISTS (SELECT 1 FROM public.pages WHERE id = pc.page_id AND user_id = auth.uid())
  )
);

-- ============================================
-- COMMENT REACTIONS (Emoji reactions to comments)
-- ============================================
CREATE TABLE IF NOT EXISTS public.comment_reactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  comment_id UUID NOT NULL REFERENCES public.page_comments(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  emoji TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(comment_id, user_id, emoji)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_comment_reactions_comment ON public.comment_reactions(comment_id);

-- Enable RLS
ALTER TABLE public.comment_reactions ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view comment reactions" 
ON public.comment_reactions FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.page_comments pc
    WHERE pc.id = comment_id
    AND EXISTS (SELECT 1 FROM public.pages WHERE id = pc.page_id AND user_id = auth.uid())
  )
);

CREATE POLICY "Users can manage own comment reactions" 
ON public.comment_reactions FOR ALL 
USING (auth.uid() = user_id);

-- ============================================
-- HELPER FUNCTIONS
-- ============================================

-- Function to resolve a comment
CREATE OR REPLACE FUNCTION resolve_comment(comment_id UUID, resolver_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE public.page_comments
  SET resolved_at = NOW(), resolved_by = resolver_id
  WHERE id = comment_id;
END;
$$ LANGUAGE plpgsql;

-- Function to unresolve a comment
CREATE OR REPLACE FUNCTION unresolve_comment(comment_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE public.page_comments
  SET resolved_at = NULL, resolved_by = NULL
  WHERE id = comment_id;
END;
$$ LANGUAGE plpgsql;

-- Function to add comment reaction
CREATE OR REPLACE FUNCTION add_comment_reaction(comment_id UUID, user_id UUID, emoji TEXT)
RETURNS void AS $$
BEGIN
  INSERT INTO public.comment_reactions (comment_id, user_id, emoji)
  VALUES (comment_id, user_id, emoji)
  ON CONFLICT (comment_id, user_id, emoji) DO NOTHING;
END;
$$ LANGUAGE plpgsql;

-- Function to remove comment reaction
CREATE OR REPLACE FUNCTION remove_comment_reaction(comment_id UUID, user_id UUID, emoji TEXT)
RETURNS void AS $$
BEGIN
  DELETE FROM public.comment_reactions
  WHERE comment_id = comment_id AND user_id = user_id AND emoji = emoji;
END;
$$ LANGUAGE plpgsql;

-- Updated_at trigger for comments
DROP TRIGGER IF EXISTS update_comments_updated_at ON public.page_comments;
CREATE TRIGGER update_comments_updated_at
  BEFORE UPDATE ON public.page_comments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Success message
DO $$
BEGIN
  RAISE NOTICE 'Comments feature (Part 3) migration completed successfully!';
  RAISE NOTICE 'Tables created:';
  RAISE NOTICE '  - page_comments: Threaded comments on pages/blocks';
  RAISE NOTICE '  - comment_mentions: Track @ mentions in comments';
  RAISE NOTICE '  - comment_reactions: Emoji reactions to comments';
  RAISE NOTICE '';
  RAISE NOTICE 'Functions added:';
  RAISE NOTICE '  - resolve_comment(comment_id, user_id)';
  RAISE NOTICE '  - unresolve_comment(comment_id)';
  RAISE NOTICE '  - add_comment_reaction(comment_id, user_id, emoji)';
  RAISE NOTICE '  - remove_comment_reaction(comment_id, user_id, emoji)';
END $$;
