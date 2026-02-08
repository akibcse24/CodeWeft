-- Add missing columns to various tables

-- Tasks
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS category TEXT;

-- Courses  
ALTER TABLE public.courses ADD COLUMN IF NOT EXISTS notes TEXT;

-- Resources
ALTER TABLE public.resources ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active';
ALTER TABLE public.resources ADD COLUMN IF NOT EXISTS rating INTEGER;
ALTER TABLE public.resources ADD COLUMN IF NOT EXISTS notes TEXT;

-- Projects
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS progress INTEGER DEFAULT 0;

-- Secrets vault
ALTER TABLE public.secrets_vault ADD COLUMN IF NOT EXISTS website_url TEXT;

-- Flashcards - add next_review_date alias
ALTER TABLE public.flashcards ADD COLUMN IF NOT EXISTS next_review_date TIMESTAMP WITH TIME ZONE;

-- Habit completions - add completed_date alias (we'll use completed_at but this ensures compatibility)
ALTER TABLE public.habit_completions ADD COLUMN IF NOT EXISTS completed_date DATE;

-- Update habit_completions to sync completed_date with completed_at
UPDATE public.habit_completions SET completed_date = completed_at WHERE completed_date IS NULL;

-- Create trigger to keep them in sync
CREATE OR REPLACE FUNCTION public.sync_completed_date()
RETURNS TRIGGER AS $$
BEGIN
  NEW.completed_date := NEW.completed_at;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER sync_habit_completed_date
  BEFORE INSERT OR UPDATE ON public.habit_completions
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_completed_date();