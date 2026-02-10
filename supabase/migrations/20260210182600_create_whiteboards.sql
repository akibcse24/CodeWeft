create table if not exists public.whiteboards (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  content jsonb,
  name text default 'Untitled Whiteboard',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.whiteboards enable row level security;

create policy "Users can view their own whiteboards"
  on public.whiteboards for select
  using (auth.uid() = user_id);

create policy "Users can insert their own whiteboards"
  on public.whiteboards for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own whiteboards"
  on public.whiteboards for update
  using (auth.uid() = user_id);

create policy "Users can delete their own whiteboards"
  on public.whiteboards for delete
  using (auth.uid() = user_id);

-- Optional: Enable realtime if we want multi-user collab later (or just live updates across tabs)
alter publication supabase_realtime add table public.whiteboards;
