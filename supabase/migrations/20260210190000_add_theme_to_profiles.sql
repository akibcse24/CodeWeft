-- Add theme column to profiles if it doesn't exist
do $$ 
begin
  if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'profiles' and column_name = 'theme') then
    alter table public.profiles add column theme text not null default 'system';
    
    -- Add check constraint for valid themes
    alter table public.profiles add constraint profiles_theme_check check (theme in ('light', 'dark', 'system', 'cyberpunk', 'professional', 'nature'));
  end if;
end $$;
