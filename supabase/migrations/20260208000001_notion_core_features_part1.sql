-- Migration: Core Notion-like Features - Part 1: Page Enhancements
-- Description: Adds version history, page templates, and backlinks support
-- Created: 2026-02-08

-- ============================================
-- PAGE VERSION HISTORY
-- ============================================
CREATE TABLE IF NOT EXISTS public.page_versions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  page_id UUID NOT NULL REFERENCES public.pages(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content JSONB,
  cover_url TEXT,
  icon TEXT,
  tags TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW(),
  version_number INTEGER NOT NULL
);

-- Create indexes for version lookups
CREATE INDEX IF NOT EXISTS idx_page_versions_page ON public.page_versions(page_id, version_number DESC);
CREATE INDEX IF NOT EXISTS idx_page_versions_user ON public.page_versions(user_id, created_at DESC);

-- Enable RLS
ALTER TABLE public.page_versions ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own page versions" 
ON public.page_versions FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create page versions" 
ON public.page_versions FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own page versions" 
ON public.page_versions FOR DELETE 
USING (auth.uid() = user_id);

-- ============================================
-- PAGE TEMPLATES
-- ============================================
CREATE TABLE IF NOT EXISTS public.page_templates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT,
  content JSONB NOT NULL,
  category TEXT DEFAULT 'custom',
  is_default BOOLEAN DEFAULT false,
  usage_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_page_templates_user ON public.page_templates(user_id, category);
CREATE INDEX IF NOT EXISTS idx_page_templates_default ON public.page_templates(is_default) WHERE is_default = true;

-- Enable RLS
ALTER TABLE public.page_templates ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own templates" 
ON public.page_templates FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create templates" 
ON public.page_templates FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own templates" 
ON public.page_templates FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own templates" 
ON public.page_templates FOR DELETE 
USING (auth.uid() = user_id);

-- ============================================
-- PAGE BACKLINKS (for bidirectional linking)
-- ============================================
CREATE TABLE IF NOT EXISTS public.page_backlinks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  source_page_id UUID NOT NULL REFERENCES public.pages(id) ON DELETE CASCADE,
  target_page_id UUID NOT NULL REFERENCES public.pages(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(source_page_id, target_page_id)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_backlinks_target ON public.page_backlinks(target_page_id);
CREATE INDEX IF NOT EXISTS idx_backlinks_source ON public.page_backlinks(source_page_id);

-- Enable RLS
ALTER TABLE public.page_backlinks ENABLE ROW LEVEL SECURITY;

-- RLS Policies - Check user ownership through pages
CREATE POLICY "Users can view backlinks for own pages" 
ON public.page_backlinks FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.pages 
    WHERE id = target_page_id AND user_id = auth.uid()
  ) OR 
  EXISTS (
    SELECT 1 FROM public.pages 
    WHERE id = source_page_id AND user_id = auth.uid()
  )
);

CREATE POLICY "Users can create backlinks for own pages" 
ON public.page_backlinks FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.pages 
    WHERE id = source_page_id AND user_id = auth.uid()
  )
);

CREATE POLICY "Users can delete own backlinks" 
ON public.page_backlinks FOR DELETE 
USING (
  EXISTS (
    SELECT 1 FROM public.pages 
    WHERE id = source_page_id AND user_id = auth.uid()
  )
);

-- ============================================
-- FUNCTIONS FOR AUTOMATIC TIMESTAMP UPDATES
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at trigger to page_templates
DROP TRIGGER IF EXISTS update_page_templates_updated_at ON public.page_templates;
CREATE TRIGGER update_page_templates_updated_at
  BEFORE UPDATE ON public.page_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- DEFAULT TEMPLATES SEED DATA
-- ============================================
INSERT INTO public.page_templates (name, description, icon, content, category, is_default)
VALUES 
  ('Empty', 'Start with a blank page', '📝', '{"blocks": [{"id": "1", "type": "paragraph", "content": ""}]}', 'basic', true),
  ('Daily Notes', 'Template for daily journal entries', '📅', '{"blocks": [{"id": "1", "type": "heading2", "content": "Daily Notes"}, {"id": "2", "type": "paragraph", "content": "Date: "}, {"id": "3", "type": "divider", "content": ""}, {"id": "4", "type": "heading3", "content": "Tasks"}, {"id": "5", "type": "todo", "content": "", "checked": false}, {"id": "6", "type": "heading3", "content": "Notes"}, {"id": "7", "type": "paragraph", "content": ""}]}', 'productivity', true),
  ('Meeting Notes', 'Template for meeting documentation', '🤝', '{"blocks": [{"id": "1", "type": "heading1", "content": "Meeting Notes"}, {"id": "2", "type": "paragraph", "content": "<strong>Date:</strong> "}, {"id": "3", "type": "paragraph", "content": "<strong>Attendees:</strong> "}, {"id": "4", "type": "heading2", "content": "Agenda"}, {"id": "5", "type": "bulletList", "content": ""}, {"id": "6", "type": "heading2", "content": "Notes"}, {"id": "7", "type": "paragraph", "content": ""}, {"id": "8", "type": "heading2", "content": "Action Items"}, {"id": "9", "type": "todo", "content": "", "checked": false}]}', 'productivity', true),
  ('Project Plan', 'Template for project planning', '🚀', '{"blocks": [{"id": "1", "type": "heading1", "content": "Project Name"}, {"id": "2", "type": "callout", "content": "Project overview and description", "calloutType": "info"}, {"id": "3", "type": "heading2", "content": "Goals"}, {"id": "4", "type": "numberedList", "content": ""}, {"id": "5", "type": "heading2", "content": "Timeline"}, {"id": "6", "type": "paragraph", "content": ""}, {"id": "7", "type": "heading2", "content": "Resources"}, {"id": "8", "type": "bulletList", "content": ""}]}', 'project', true),
  ('Weekly Review', 'Template for weekly reflection', '📊', '{"blocks": [{"id": "1", "type": "heading1", "content": "Weekly Review"}, {"id": "2", "type": "paragraph", "content": "Week of: "}, {"id": "3", "type": "divider", "content": ""}, {"id": "4", "type": "heading2", "content": "Wins"}, {"id": "5", "type": "bulletList", "content": ""}, {"id": "6", "type": "heading2", "content": "Challenges"}, {"id": "7", "type": "bulletList", "content": ""}, {"id": "8", "type": "heading2", "content": "Lessons Learned"}, {"id": "9", "type": "paragraph", "content": ""}, {"id": "10", "type": "heading2", "content": "Next Week Goals"}, {"id": "11", "type": "todo", "content": "", "checked": false}]}', 'productivity', true),
  ('Journal Entry', 'Personal journal template', '📔', '{"blocks": [{"id": "1", "type": "heading1", "content": "Journal Entry"}, {"id": "2", "type": "paragraph", "content": "<em>Date: </em>"}, {"id": "3", "type": "divider", "content": ""}, {"id": "4", "type": "heading2", "content": "Today I..."}, {"id": "5", "type": "paragraph", "content": ""}, {"id": "6", "type": "heading2", "content": "I am grateful for..."}, {"id": "7", "type": "bulletList", "content": ""}, {"id": "8", "type": "heading2", "content": "Thoughts & Reflections"}, {"id": "9", "type": "paragraph", "content": ""}]}', 'personal', true),
  ('Code Snippet', 'Track code snippets and patterns', '💻', '{"blocks": [{"id": "1", "type": "heading1", "content": "Code Snippet"}, {"id": "2", "type": "paragraph", "content": "<strong>Language:</strong> "}, {"id": "3", "type": "paragraph", "content": "<strong>Description:</strong> "}, {"id": "4", "type": "paragraph", "content": "<strong>Tags:</strong> "}, {"id": "5", "type": "divider", "content": ""}, {"id": "6", "type": "heading2", "content": "Code"}, {"id": "7", "type": "code", "content": "", "language": "javascript"}, {"id": "8", "type": "heading2", "content": "Explanation"}, {"id": "9", "type": "paragraph", "content": ""}, {"id": "10", "type": "heading2", "content": "Use Cases"}, {"id": "11", "type": "bulletList", "content": ""}]}', 'developer', true)
ON CONFLICT DO NOTHING;

-- Success message
DO $$
BEGIN
  RAISE NOTICE 'Core Notion-like features (Part 1) migration completed successfully!';
  RAISE NOTICE 'Tables created: page_versions, page_templates, page_backlinks';
  RAISE NOTICE 'Default templates added for: Empty, Daily Notes, Meeting Notes, Project Plan, Weekly Review, Journal Entry, Code Snippet';
END $$;
