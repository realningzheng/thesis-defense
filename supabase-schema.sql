-- Run this in your Supabase SQL Editor to set up the database
-- Run Part 1 first, then Part 2

-- ============================================
-- PART 1: Core tables
-- ============================================

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

-- ============================================
-- PART 2: RAG vector store
-- ============================================

-- Enable the pgvector extension
create extension if not exists vector;

-- Dissertation chunks with embeddings
create table dissertation_chunks (
  id bigserial primary key,
  chapter text not null,          -- e.g. 'mimosa', 'spica', 'intro', 'discussion'
  section text,                   -- e.g. 'evaluation', 'system design', 'findings'
  content text not null,          -- the actual text chunk
  embedding vector(1536),         -- OpenAI text-embedding-3-small dimension
  created_at timestamptz default now()
);

-- Enable RLS
alter table dissertation_chunks enable row level security;
create policy "Allow read on chunks" on dissertation_chunks for select using (true);
create policy "Allow insert on chunks" on dissertation_chunks for insert with check (true);

-- Index for fast similarity search
create index idx_chunks_embedding on dissertation_chunks
  using ivfflat (embedding vector_cosine_ops) with (lists = 20);

-- Function to search similar chunks
create or replace function match_chunks(
  query_embedding vector(1536),
  match_count int default 8,
  match_threshold float default 0.3
)
returns table (
  id bigint,
  chapter text,
  section text,
  content text,
  similarity float
)
language plpgsql
as $$
begin
  return query
  select
    dc.id,
    dc.chapter,
    dc.section,
    dc.content,
    1 - (dc.embedding <=> query_embedding) as similarity
  from dissertation_chunks dc
  where 1 - (dc.embedding <=> query_embedding) > match_threshold
  order by dc.embedding <=> query_embedding
  limit match_count;
end;
$$;
