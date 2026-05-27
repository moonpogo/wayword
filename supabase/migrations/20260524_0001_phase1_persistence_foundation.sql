-- Phase 1 Track 2 foundation schema
-- Scope: users, runs, observatory_summaries, prompt_state, subscription_state
-- Notes:
-- 1) RLS policies intentionally deferred to Track 3.
-- 2) user_id ownership fields included on all user-owned tables.

create extension if not exists pgcrypto;

create table if not exists public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  profile_status text not null default 'active',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.runs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  writing_text text not null,
  prompt_id text,
  prompt_family text,
  started_at timestamptz,
  ended_at timestamptz,
  saved_at timestamptz not null default timezone('utc', now()),
  save_source text not null default 'authenticated',
  continuity_state text not null default 'active',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists runs_user_id_saved_at_idx on public.runs(user_id, saved_at desc);
create index if not exists runs_user_id_created_at_idx on public.runs(user_id, created_at desc);

create table if not exists public.observatory_summaries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  run_id uuid references public.runs(id) on delete set null,
  instrument_key text not null,
  summary_payload jsonb not null default '{}'::jsonb,
  generated_at timestamptz not null default timezone('utc', now()),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists observatory_summaries_user_id_generated_at_idx
  on public.observatory_summaries(user_id, generated_at desc);

create table if not exists public.prompt_state (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  current_prompt_id text,
  current_prompt_family text,
  strata_state jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default timezone('utc', now()),
  created_at timestamptz not null default timezone('utc', now()),
  unique(user_id)
);

create table if not exists public.subscription_state (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  provider text not null default 'stripe',
  status text not null default 'inactive',
  customer_id text,
  subscription_id text,
  current_period_end timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique(user_id)
);

create or replace function public.wayword_touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

drop trigger if exists users_touch_updated_at on public.users;
create trigger users_touch_updated_at before update on public.users
for each row execute procedure public.wayword_touch_updated_at();

drop trigger if exists runs_touch_updated_at on public.runs;
create trigger runs_touch_updated_at before update on public.runs
for each row execute procedure public.wayword_touch_updated_at();

drop trigger if exists observatory_summaries_touch_updated_at on public.observatory_summaries;
create trigger observatory_summaries_touch_updated_at before update on public.observatory_summaries
for each row execute procedure public.wayword_touch_updated_at();

drop trigger if exists prompt_state_touch_updated_at on public.prompt_state;
create trigger prompt_state_touch_updated_at before update on public.prompt_state
for each row execute procedure public.wayword_touch_updated_at();

drop trigger if exists subscription_state_touch_updated_at on public.subscription_state;
create trigger subscription_state_touch_updated_at before update on public.subscription_state
for each row execute procedure public.wayword_touch_updated_at();
