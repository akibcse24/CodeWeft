-- Create paper_drafts table for tracking user's own research work
CREATE TABLE public.paper_drafts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  abstract TEXT,
  target_venue TEXT,
  venue_deadline TIMESTAMP WITH TIME ZONE,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'review', 'submitted', 'revising', 'accepted', 'published')),
  repo_url TEXT,
  manuscript_url TEXT,
  bib_key TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- RLS Policies
ALTER TABLE public.paper_drafts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own drafts" ON public.paper_drafts
  FOR ALL USING (auth.uid() = user_id);

-- Venue Deadlines Table
CREATE TABLE public.research_venues (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  abbreviation TEXT,
  description TEXT,
  website_url TEXT,
  deadline_date TIMESTAMP WITH TIME ZONE,
  conference_date TIMESTAMP WITH TIME ZONE,
  tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Make venues public for read, restricted for write if needed
ALTER TABLE public.research_venues ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read access for venues" ON public.research_venues FOR SELECT USING (true);
