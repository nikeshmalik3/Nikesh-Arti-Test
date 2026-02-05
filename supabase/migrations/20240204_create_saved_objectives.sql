-- Create table for saved learning objectives
create table if not exists public.saved_objectives (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,

  -- Content
  topic text not null,
  level text,
  objectives_text text not null,
  objective_count integer not null,

  -- Metadata
  had_context boolean default false,
  sources jsonb default '[]'::jsonb,

  -- Optional fields
  title text,
  notes text,
  tags text[] default array[]::text[]
);

-- Enable RLS
alter table public.saved_objectives enable row level security;

-- Create policy to allow all operations (adjust based on your auth needs)
create policy "Allow all operations on saved_objectives"
  on public.saved_objectives
  for all
  using (true)
  with check (true);

-- Create index on created_at for faster queries
create index if not exists saved_objectives_created_at_idx
  on public.saved_objectives (created_at desc);

-- Create index on topic for searching
create index if not exists saved_objectives_topic_idx
  on public.saved_objectives using gin (to_tsvector('english', topic));
