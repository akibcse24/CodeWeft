-- Create secrets_vault table for storing encrypted secrets
CREATE TABLE public.secrets_vault (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  value TEXT NOT NULL,
  category TEXT DEFAULT 'general',
  notes TEXT,
  website_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create index for faster lookups
CREATE INDEX idx_secrets_vault_user_id ON public.secrets_vault(user_id);
CREATE INDEX idx_secrets_vault_category ON public.secrets_vault(category);

-- Enable Row Level Security
ALTER TABLE public.secrets_vault ENABLE ROW LEVEL SECURITY;

-- RLS Policies - Users can only access their own secrets
CREATE POLICY "Users can view their own secrets" 
ON public.secrets_vault 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own secrets" 
ON public.secrets_vault 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own secrets" 
ON public.secrets_vault 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own secrets" 
ON public.secrets_vault 
FOR DELETE 
USING (auth.uid() = user_id);

-- Trigger for automatic timestamp updates
CREATE TRIGGER update_secrets_vault_updated_at
BEFORE UPDATE ON public.secrets_vault
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add tags column to pages table for better organization
ALTER TABLE public.pages ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}';

-- Add notes column to resources table  
ALTER TABLE public.resources ADD COLUMN IF NOT EXISTS description TEXT;

-- Create ml_notes table for machine learning concepts
CREATE TABLE public.ml_notes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  content JSONB DEFAULT '[]',
  category TEXT DEFAULT 'general',
  tags TEXT[] DEFAULT '{}',
  icon TEXT DEFAULT '🧠',
  is_favorite BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS for ml_notes
ALTER TABLE public.ml_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own ML notes" 
ON public.ml_notes FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own ML notes" 
ON public.ml_notes FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own ML notes" 
ON public.ml_notes FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own ML notes" 
ON public.ml_notes FOR DELETE USING (auth.uid() = user_id);

CREATE TRIGGER update_ml_notes_updated_at
BEFORE UPDATE ON public.ml_notes
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();