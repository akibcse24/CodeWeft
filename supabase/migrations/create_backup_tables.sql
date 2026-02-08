-- Migration: Create GitHub Backup System Tables
-- Description: Tables for storing backup metadata and schedules
-- Run this in Supabase SQL Editor

-- Create github_backups table
CREATE TABLE IF NOT EXISTS github_backups (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  backup_name VARCHAR(255) NOT NULL,
  repository_ids TEXT[] NOT NULL,
  backup_type VARCHAR(50) DEFAULT 'manual' CHECK (backup_type IN ('manual', 'scheduled')),
  storage_path TEXT NOT NULL,
  file_count INTEGER DEFAULT 0,
  size_bytes BIGINT DEFAULT 0,
  compressed BOOLEAN DEFAULT true,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for user lookups
CREATE INDEX IF NOT EXISTS idx_github_backups_user 
ON github_backups(user_id, created_at DESC);

-- Create index for repository lookups
CREATE INDEX IF NOT EXISTS idx_github_backups_repos 
ON github_backups USING GIN(repository_ids);

-- Create backup_schedules table
CREATE TABLE IF NOT EXISTS backup_schedules (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  schedule_name VARCHAR(255) NOT NULL,
  cron_expression VARCHAR(100) NOT NULL,
  repository_ids TEXT[] NOT NULL,
  is_active BOOLEAN DEFAULT true,
  last_run_at TIMESTAMPTZ,
  next_run_at TIMESTAMPTZ,
  backup_retention_days INTEGER DEFAULT 30,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for active schedule lookups
CREATE INDEX IF NOT EXISTS idx_backup_schedules_active 
ON backup_schedules(user_id, is_active, next_run_at);

-- Enable Row Level Security
ALTER TABLE github_backups ENABLE ROW LEVEL SECURITY;
ALTER TABLE backup_schedules ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can only view their own backups
CREATE POLICY "Users can view own backups" 
ON github_backups FOR SELECT 
USING (auth.uid() = user_id);

-- RLS Policy: Users can create their own backups
CREATE POLICY "Users can create own backups" 
ON github_backups FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- RLS Policy: Users can delete their own backups
CREATE POLICY "Users can delete own backups" 
ON github_backups FOR DELETE 
USING (auth.uid() = user_id);

-- RLS Policy: Users can view their own schedules
CREATE POLICY "Users can view own schedules" 
ON backup_schedules FOR SELECT 
USING (auth.uid() = user_id);

-- RLS Policy: Users can create their own schedules
CREATE POLICY "Users can create own schedules" 
ON backup_schedules FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- RLS Policy: Users can update their own schedules
CREATE POLICY "Users can update own schedules" 
ON backup_schedules FOR UPDATE 
USING (auth.uid() = user_id);

-- RLS Policy: Users can delete their own schedules
CREATE POLICY "Users can delete own schedules" 
ON backup_schedules FOR DELETE 
USING (auth.uid() = user_id);

-- Create Supabase Storage Bucket for backups
-- Run this separately or via Supabase Dashboard > Storage
INSERT INTO storage.buckets (id, name, public)
VALUES ('github-backups', 'github-backups', false)
ON CONFLICT (id) DO NOTHING;

-- Storage Policy: Users can upload their own backups
CREATE POLICY "Users can upload backups"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'github-backups' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Storage Policy: Users can view their own backups
CREATE POLICY "Users can view own backups"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'github-backups' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Storage Policy: Users can delete their own backups
CREATE POLICY "Users can delete own backups"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'github-backups' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Success message
DO $$
BEGIN
  RAISE NOTICE 'GitHub Backup System tables created successfully!';
  RAISE NOTICE 'Next steps:';
  RAISE NOTICE '1. Verify tables in Database > Tables';
  RAISE NOTICE '2. Check Storage > github-backups bucket exists';
  RAISE NOTICE '3. Test creating a backup from the app';
END $$;
