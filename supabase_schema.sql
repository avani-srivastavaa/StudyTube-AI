-- ════════════════════════════════════════════════════════════════
--  StudyTube AI — Supabase Schema
--  Run this in: Supabase Dashboard → SQL Editor → New Query
-- ════════════════════════════════════════════════════════════════

-- Enable UUID extension (usually already enabled)
create extension if not exists "uuid-ossp";


-- ── Users ─────────────────────────────────────────────────────────────────────
-- Extends Supabase auth.users with app-specific profile data
create table if not exists public.users (
  id            uuid primary key references auth.users(id) on delete cascade,
  email         text not null,
  display_name  text,
  avatar_url    text,
  xp            integer not null default 0,
  level         integer not null default 1,
  streak        integer not null default 0,
  last_active   timestamptz not null default now(),
  created_at    timestamptz not null default now()
);

-- Auto-create user row on signup
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.users (id, email, display_name, avatar_url)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    new.raw_user_meta_data->>'avatar_url'
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();


-- ── Videos ───────────────────────────────────────────────────────────────────
create table if not exists public.videos (
  id            text primary key,              -- YouTube video ID
  user_id       uuid not null references public.users(id) on delete cascade,
  title         text,
  channel       text,
  duration      text,
  thumbnail     text,
  transcript    text,
  notes         jsonb,
  flashcards    jsonb,
  quiz          jsonb,
  mindmap       jsonb,
  analyzed_at   timestamptz not null default now()
);

create index if not exists videos_user_id_idx on public.videos(user_id);
create index if not exists videos_analyzed_at_idx on public.videos(analyzed_at desc);


-- ── Progress ──────────────────────────────────────────────────────────────────
create table if not exists public.progress (
  id                    uuid primary key default uuid_generate_v4(),
  user_id               uuid not null references public.users(id) on delete cascade,
  video_id              text not null references public.videos(id) on delete cascade,
  notes_read            boolean not null default false,
  flashcards_mastered   integer not null default 0,
  last_quiz_score       integer,
  updated_at            timestamptz not null default now(),
  unique(user_id, video_id)
);

create index if not exists progress_user_video_idx on public.progress(user_id, video_id);


-- ── Quiz Results ──────────────────────────────────────────────────────────────
create table if not exists public.quiz_results (
  id          uuid primary key default uuid_generate_v4(),
  user_id     uuid not null references public.users(id) on delete cascade,
  video_id    text not null references public.videos(id) on delete cascade,
  score       integer not null,
  total       integer not null,
  percentage  integer not null,
  taken_at    timestamptz not null default now()
);

create index if not exists quiz_results_user_idx on public.quiz_results(user_id);


-- ── Achievements ──────────────────────────────────────────────────────────────
create table if not exists public.achievements (
  id          uuid primary key default uuid_generate_v4(),
  user_id     uuid not null references public.users(id) on delete cascade,
  badge_id    text not null,
  label       text not null,
  earned_at   timestamptz not null default now(),
  unique(user_id, badge_id)
);

create index if not exists achievements_user_idx on public.achievements(user_id);


-- ── Chat History ──────────────────────────────────────────────────────────────
create table if not exists public.chat_history (
  id          uuid primary key default uuid_generate_v4(),
  user_id     uuid not null references public.users(id) on delete cascade,
  video_id    text not null references public.videos(id) on delete cascade,
  role        text not null check (role in ('user', 'assistant')),
  content     text not null,
  sent_at     timestamptz not null default now()
);

create index if not exists chat_history_user_video_idx on public.chat_history(user_id, video_id);
create index if not exists chat_history_sent_at_idx    on public.chat_history(sent_at);


-- ════════════════════════════════════════════════════════════════
--  Row-Level Security (RLS)
--  Users can only read/write their own data.
-- ════════════════════════════════════════════════════════════════

alter table public.users         enable row level security;
alter table public.videos        enable row level security;
alter table public.progress      enable row level security;
alter table public.quiz_results  enable row level security;
alter table public.achievements  enable row level security;
alter table public.chat_history  enable row level security;

-- users: own row only
create policy "Users: own row" on public.users
  for all using (auth.uid() = id);

-- videos: own videos only
create policy "Videos: own" on public.videos
  for all using (auth.uid() = user_id);

-- progress: own progress
create policy "Progress: own" on public.progress
  for all using (auth.uid() = user_id);

-- quiz_results: own results
create policy "Quiz: own" on public.quiz_results
  for all using (auth.uid() = user_id);

-- achievements: own badges
create policy "Achievements: own" on public.achievements
  for all using (auth.uid() = user_id);

-- chat_history: own messages
create policy "Chat: own" on public.chat_history
  for all using (auth.uid() = user_id);


-- ════════════════════════════════════════════════════════════════
--  Helper Views
-- ════════════════════════════════════════════════════════════════

-- Leaderboard (top 20 by XP — no PII exposed)
create or replace view public.leaderboard as
  select
    display_name,
    avatar_url,
    xp,
    level,
    streak
  from public.users
  order by xp desc
  limit 20;
