-- Create github_settings table
CREATE TABLE public.github_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  github_token TEXT,
  github_username TEXT,
  avatar_url TEXT,
  solutions_repo TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.github_settings ENABLE ROW LEVEL SECURITY;

-- RLS policies for github_settings
CREATE POLICY "Users can view their own github_settings"
ON public.github_settings
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own github_settings"
ON public.github_settings
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own github_settings"
ON public.github_settings
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own github_settings"
ON public.github_settings
FOR DELETE
USING (auth.uid() = user_id);

-- Add trigger for updated_at
CREATE TRIGGER update_github_settings_updated_at
BEFORE UPDATE ON public.github_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add GitHub columns to projects table
ALTER TABLE public.projects
ADD COLUMN github_stars INTEGER DEFAULT 0,
ADD COLUMN github_forks INTEGER DEFAULT 0,
ADD COLUMN github_watchers INTEGER DEFAULT 0,
ADD COLUMN github_open_issues INTEGER DEFAULT 0,
ADD COLUMN github_language TEXT,
ADD COLUMN last_commit_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN last_commit_message TEXT;