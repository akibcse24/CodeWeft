-- Add enhancement columns to papers table
ALTER TABLE public.papers 
ADD COLUMN IF NOT EXISTS bibtex TEXT,
ADD COLUMN IF NOT EXISTS summary TEXT,
ADD COLUMN IF NOT EXISTS progress_percentage INTEGER DEFAULT 0 CHECK (progress_percentage >= 0 AND progress_percentage <= 100);

-- Update RLS policies (usually not needed if adding columns, but good to check)
-- Existing policies cover all columns for the owner.
