-- Run this in your Supabase SQL Editor to set up the database

-- Threads table (each top-level question is a thread)
create table threads (
  id uuid default gen_random_uuid() primary key,
  question text not null,
  user_name text not null,
  created_at timestamptz default now(),
  bot_replied boolean default false
);

-- Messages table (replies within a thread)
create table messages (
  id uuid default gen_random_uuid() primary key,
  thread_id uuid references threads(id) on delete cascade,
  user_name text not null,
  content text not null,
  is_bot boolean default false,
  created_at timestamptz default now()
);

-- Track when last human message was posted in a thread (for debounce)
create table thread_debounce (
  thread_id uuid primary key references threads(id) on delete cascade,
  last_human_message_at timestamptz default now(),
  bot_pending boolean default false
);

-- Enable realtime on both tables
alter publication supabase_realtime add table threads;
alter publication supabase_realtime add table messages;

-- Enable Row Level Security but allow all for anonymous (our app is public, <100 users)
alter table threads enable row level security;
alter table messages enable row level security;
alter table thread_debounce enable row level security;

create policy "Allow all on threads" on threads for all using (true) with check (true);
create policy "Allow all on messages" on messages for all using (true) with check (true);
create policy "Allow all on thread_debounce" on thread_debounce for all using (true) with check (true);

-- Index for fast thread message lookups
create index idx_messages_thread_id on messages(thread_id, created_at);
