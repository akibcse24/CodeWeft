-- Add missing columns to pages
ALTER TABLE public.pages ADD COLUMN IF NOT EXISTS is_archived BOOLEAN DEFAULT false;

-- Add missing columns to dsa_problems  
ALTER TABLE public.dsa_problems ADD COLUMN IF NOT EXISTS solution_notes TEXT;
ALTER TABLE public.dsa_problems ADD COLUMN IF NOT EXISTS next_review_date TIMESTAMP WITH TIME ZONE;
ALTER TABLE public.dsa_problems ADD COLUMN IF NOT EXISTS solved_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE public.dsa_problems ADD COLUMN IF NOT EXISTS topics TEXT[] DEFAULT '{}';

-- Add missing column to flashcards
ALTER TABLE public.flashcards ADD COLUMN IF NOT EXISTS interval_days INTEGER DEFAULT 0;

-- Add missing columns to ml_notes
ALTER TABLE public.ml_notes ADD COLUMN IF NOT EXISTS icon TEXT DEFAULT '📝';
ALTER TABLE public.ml_notes ADD COLUMN IF NOT EXISTS is_favorite BOOLEAN DEFAULT false;

-- Create github_settings table
CREATE TABLE public.github_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  github_token TEXT,
  github_username TEXT,
  avatar_url TEXT,
  solutions_repo TEXT,
  github_installation_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.github_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can CRUD their own github_settings" ON public.github_settings FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Rename habit_logs to habit_completions for compatibility (or create alias)
-- Actually let's create habit_completions as well since the code expects it
CREATE TABLE public.habit_completions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  habit_id UUID NOT NULL REFERENCES public.habits(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  completed_at DATE NOT NULL DEFAULT CURRENT_DATE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.habit_completions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can CRUD their own habit_completions" ON public.habit_completions FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Add name and code columns to courses for search compatibility
ALTER TABLE public.courses ADD COLUMN IF NOT EXISTS name TEXT;
ALTER TABLE public.courses ADD COLUMN IF NOT EXISTS code TEXT;

-- Create indexes
CREATE INDEX idx_github_settings_user_id ON public.github_settings(user_id);
CREATE INDEX idx_habit_completions_habit_id ON public.habit_completions(habit_id);