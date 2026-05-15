
alter table public.challenge_artifacts
  add column if not exists scope text not null default 'session'
    check (scope in ('private','subject','session','workshop')),
  add column if not exists visibility_subject_id uuid,
  add column if not exists is_custom_card boolean not null default false,
  add column if not exists card_payload jsonb;

create index if not exists idx_artifacts_scope_subject
  on public.challenge_artifacts(session_id, scope, visibility_subject_id);

alter table public.challenge_artifacts
  add column if not exists thread_order int not null default 0,
  add column if not exists thread_root_id uuid;

create index if not exists idx_artifacts_thread_root
  on public.challenge_artifacts(thread_root_id, thread_order);

create or replace function public.challenge_artifacts_propagate_thread()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  parent_row public.challenge_artifacts%rowtype;
  next_order int;
begin
  if new.parent_artifact_id is not null then
    select * into parent_row from public.challenge_artifacts where id = new.parent_artifact_id;
    if found then
      new.thread_root_id := coalesce(parent_row.thread_root_id, parent_row.id);
      if new.subject_id is null then new.subject_id := parent_row.subject_id; end if;
      if new.slot_id is null then new.slot_id := parent_row.slot_id; end if;
      if new.scope = 'session' and parent_row.scope <> 'session' then
        new.scope := parent_row.scope;
        new.visibility_subject_id := parent_row.visibility_subject_id;
      end if;
      select coalesce(max(thread_order),-1)+1 into next_order
        from public.challenge_artifacts
        where thread_root_id = new.thread_root_id;
      new.thread_order := next_order;
    end if;
  else
    new.thread_root_id := new.id;
    new.thread_order := 0;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_artifacts_thread on public.challenge_artifacts;
create trigger trg_artifacts_thread
  before insert on public.challenge_artifacts
  for each row execute function public.challenge_artifacts_propagate_thread();

update public.challenge_artifacts set thread_root_id = id
  where thread_root_id is null and parent_artifact_id is null;

create extension if not exists vector;

create table if not exists public.challenge_embeddings (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.challenge_sessions(id) on delete cascade,
  workshop_id uuid not null,
  source_type text not null check (source_type in
    ('artifact','card','subject','slot','briefing','thread','synthesis')),
  source_id uuid not null,
  content text not null,
  metadata jsonb not null default '{}'::jsonb,
  embedding vector(1536),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(session_id, source_type, source_id)
);

create index if not exists idx_chemb_session_type on public.challenge_embeddings(session_id, source_type);
create index if not exists idx_chemb_hnsw on public.challenge_embeddings using hnsw (embedding vector_cosine_ops);

alter table public.challenge_embeddings enable row level security;

drop policy if exists "embeddings participant read" on public.challenge_embeddings;
create policy "embeddings participant read" on public.challenge_embeddings
  for select using (public.is_workshop_participant(workshop_id, auth.uid()));

drop policy if exists "embeddings service all" on public.challenge_embeddings;
create policy "embeddings service all" on public.challenge_embeddings
  for all using (public.is_workshop_participant(workshop_id, auth.uid()))
  with check (public.is_workshop_participant(workshop_id, auth.uid()));

create or replace function public.match_challenge_context(
  p_session_id uuid,
  p_query_embedding vector(1536),
  p_source_types text[] default null,
  p_match_count int default 8
) returns table (
  id uuid,
  source_type text,
  source_id uuid,
  content text,
  metadata jsonb,
  similarity float
)
language sql
stable
security definer
set search_path = public
as $$
  select
    e.id, e.source_type, e.source_id, e.content, e.metadata,
    1 - (e.embedding <=> p_query_embedding) as similarity
  from public.challenge_embeddings e
  where e.session_id = p_session_id
    and (p_source_types is null or e.source_type = any(p_source_types))
    and e.embedding is not null
  order by e.embedding <=> p_query_embedding
  limit greatest(1, least(p_match_count, 50));
$$;

alter table public.challenge_sessions
  add column if not exists slug text,
  add column if not exists invite_code text;

create unique index if not exists idx_sessions_slug on public.challenge_sessions(slug) where slug is not null;
create unique index if not exists idx_sessions_invite on public.challenge_sessions(invite_code) where invite_code is not null;

create or replace function public.challenge_session_set_codes()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.slug is null then
    new.slug := lower(substring(replace(new.id::text,'-','') from 1 for 8));
  end if;
  if new.invite_code is null then
    new.invite_code := upper(substring(md5(random()::text || new.id::text) from 1 for 6));
  end if;
  return new;
end;
$$;

drop trigger if exists trg_session_codes on public.challenge_sessions;
create trigger trg_session_codes
  before insert on public.challenge_sessions
  for each row execute function public.challenge_session_set_codes();

update public.challenge_sessions
  set slug = lower(substring(replace(id::text,'-','') from 1 for 8))
  where slug is null;
update public.challenge_sessions
  set invite_code = upper(substring(md5(random()::text || id::text) from 1 for 6))
  where invite_code is null;

create index if not exists idx_artifacts_session_subject_kind
  on public.challenge_artifacts(session_id, subject_id, kind) where status = 'active';
create index if not exists idx_artifacts_session_slot
  on public.challenge_artifacts(session_id, slot_id) where status = 'active';
create index if not exists idx_artifacts_parent
  on public.challenge_artifacts(parent_artifact_id);
