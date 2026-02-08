-- Add missing columns to resources
ALTER TABLE public.resources ADD COLUMN IF NOT EXISTS type TEXT;

-- Add missing columns to tasks
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS completed_at TIMESTAMP WITH TIME ZONE;

-- Add missing columns to courses
ALTER TABLE public.courses ADD COLUMN IF NOT EXISTS semester TEXT;
ALTER TABLE public.courses ADD COLUMN IF NOT EXISTS credits INTEGER;
ALTER TABLE public.courses ADD COLUMN IF NOT EXISTS grade TEXT;
ALTER TABLE public.courses ADD COLUMN IF NOT EXISTS color TEXT DEFAULT '#3b82f6';

-- Add missing columns to flashcard_decks
ALTER TABLE public.flashcard_decks ADD COLUMN IF NOT EXISTS card_count INTEGER DEFAULT 0;

-- Add missing columns to habits
ALTER TABLE public.habits ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
ALTER TABLE public.habits ADD COLUMN IF NOT EXISTS longest_streak INTEGER DEFAULT 0;

-- Create secrets_vault table
CREATE TABLE public.secrets_vault (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  value TEXT NOT NULL,
  category TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.secrets_vault ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can CRUD their own secrets" ON public.secrets_vault FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE INDEX idx_secrets_vault_user_id ON public.secrets_vault(user_id);