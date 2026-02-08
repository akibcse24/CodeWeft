-- Add github_installation_id to github_settings table
ALTER TABLE public.github_settings 
ADD COLUMN IF NOT EXISTS github_installation_id TEXT;

-- Add comment for documentation
COMMENT ON COLUMN public.github_settings.github_installation_id IS 'The installation ID for the GitHub App, used for App-based authentication.';
