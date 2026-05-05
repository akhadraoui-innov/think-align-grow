
create table if not exists public.playground_sessions (
  id uuid primary key default gen_random_uuid(),
  toolkit_id uuid not null references public.toolkits(id) on delete cascade,
  user_id uuid not null,
  org_id uuid,
  name text not null default 'Partie sans nom',
  layout text not null default 'plateau',
  card_scale_global numeric not null default 1,
  placements jsonb not null default '[]'::jsonb,
  category jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.playground_sessions enable row level security;

create policy "owner can select own sessions"
  on public.playground_sessions for select
  using (user_id = auth.uid());

create policy "owner can insert own sessions"
  on public.playground_sessions for insert
  with check (user_id = auth.uid());

create policy "owner can update own sessions"
  on public.playground_sessions for update
  using (user_id = auth.uid());

create policy "owner can delete own sessions"
  on public.playground_sessions for delete
  using (user_id = auth.uid());

create index if not exists playground_sessions_toolkit_user_idx
  on public.playground_sessions (toolkit_id, user_id, updated_at desc);

create trigger trg_playground_sessions_updated_at
  before update on public.playground_sessions
  for each row execute function public.update_updated_at_column();
