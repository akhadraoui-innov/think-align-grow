
-- ===== Extensions =====
CREATE EXTENSION IF NOT EXISTS vector;

-- ===== 1. Toggle mode + config sur le template =====
ALTER TABLE public.challenge_templates
  ADD COLUMN IF NOT EXISTS experience_mode text NOT NULL DEFAULT 'classic'
    CHECK (experience_mode IN ('classic','enriched')),
  ADD COLUMN IF NOT EXISTS enriched_config jsonb NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS context_schema jsonb NOT NULL DEFAULT '{}'::jsonb;

-- ===== 2. challenge_sessions =====
CREATE TABLE IF NOT EXISTS public.challenge_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workshop_id uuid NOT NULL UNIQUE REFERENCES public.workshops(id) ON DELETE CASCADE,
  template_id uuid NOT NULL REFERENCES public.challenge_templates(id) ON DELETE CASCADE,
  organization_id uuid,
  status text NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft','briefing','running','synthesis','closed','archived')),
  current_subject_id uuid REFERENCES public.challenge_subjects(id) ON DELETE SET NULL,
  config jsonb NOT NULL DEFAULT '{}'::jsonb,
  facilitator_notes text,
  started_at timestamptz,
  ended_at timestamptz,
  created_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_csess_workshop ON public.challenge_sessions(workshop_id);
CREATE INDEX IF NOT EXISTS idx_csess_template ON public.challenge_sessions(template_id);

ALTER TABLE public.challenge_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Participants read sessions"
  ON public.challenge_sessions FOR SELECT TO authenticated
  USING (public.is_workshop_participant(workshop_id, auth.uid()) OR public.is_workshop_host(workshop_id, auth.uid()));

CREATE POLICY "Host manages sessions"
  ON public.challenge_sessions FOR ALL TO authenticated
  USING (public.is_workshop_host(workshop_id, auth.uid()))
  WITH CHECK (public.is_workshop_host(workshop_id, auth.uid()));

CREATE TRIGGER trg_csess_updated
  BEFORE UPDATE ON public.challenge_sessions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ===== 3. challenge_session_context =====
CREATE TABLE IF NOT EXISTS public.challenge_session_context (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL UNIQUE REFERENCES public.challenge_sessions(id) ON DELETE CASCADE,
  scope text,
  goals text,
  hypotheses text,
  constraints text,
  stakeholders jsonb DEFAULT '[]'::jsonb,
  context_data jsonb NOT NULL DEFAULT '{}'::jsonb,
  attachments jsonb NOT NULL DEFAULT '[]'::jsonb,
  embedding vector(1536),
  embedding_input text,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.challenge_session_context ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Participants read context"
  ON public.challenge_session_context FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.challenge_sessions s
    WHERE s.id = session_id
      AND (public.is_workshop_participant(s.workshop_id, auth.uid())
        OR public.is_workshop_host(s.workshop_id, auth.uid()))));

CREATE POLICY "Host writes context"
  ON public.challenge_session_context FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.challenge_sessions s
    WHERE s.id = session_id AND public.is_workshop_host(s.workshop_id, auth.uid())))
  WITH CHECK (EXISTS (SELECT 1 FROM public.challenge_sessions s
    WHERE s.id = session_id AND public.is_workshop_host(s.workshop_id, auth.uid())));

CREATE TRIGGER trg_cctx_updated
  BEFORE UPDATE ON public.challenge_session_context
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ===== 4. challenge_artifacts =====
DO $$ BEGIN
  CREATE TYPE public.challenge_artifact_kind AS ENUM
    ('card','postit','voice','question','sticker','link_note','vote_summary');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS public.challenge_artifacts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES public.challenge_sessions(id) ON DELETE CASCADE,
  workshop_id uuid NOT NULL,
  subject_id uuid REFERENCES public.challenge_subjects(id) ON DELETE SET NULL,
  slot_id uuid REFERENCES public.challenge_slots(id) ON DELETE SET NULL,
  card_id uuid REFERENCES public.cards(id) ON DELETE SET NULL,
  parent_artifact_id uuid REFERENCES public.challenge_artifacts(id) ON DELETE CASCADE,
  kind public.challenge_artifact_kind NOT NULL,
  author_id uuid NOT NULL,
  is_anonymous boolean NOT NULL DEFAULT false,
  content text,
  content_rich jsonb,
  transcription text,
  audio_url text,
  audio_duration_ms int,
  emoji text,
  criticality text CHECK (criticality IN ('low','medium','high','critical')),
  category text,
  tags text[] NOT NULL DEFAULT '{}',
  ai_meta jsonb NOT NULL DEFAULT '{}'::jsonb,
  format text NOT NULL DEFAULT 'normal',
  position jsonb,
  z_index int NOT NULL DEFAULT 0,
  color text,
  embedding vector(1536),
  embedding_input text,
  status text NOT NULL DEFAULT 'active'
    CHECK (status IN ('draft','active','resolved','archived')),
  resolved_by uuid,
  resolved_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_cart_session ON public.challenge_artifacts(session_id);
CREATE INDEX IF NOT EXISTS idx_cart_workshop ON public.challenge_artifacts(workshop_id);
CREATE INDEX IF NOT EXISTS idx_cart_subject ON public.challenge_artifacts(subject_id);
CREATE INDEX IF NOT EXISTS idx_cart_kind ON public.challenge_artifacts(kind);
CREATE INDEX IF NOT EXISTS idx_cart_tags ON public.challenge_artifacts USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_cart_emb ON public.challenge_artifacts
  USING hnsw (embedding vector_cosine_ops);

ALTER TABLE public.challenge_artifacts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Participants read artifacts"
  ON public.challenge_artifacts FOR SELECT TO authenticated
  USING (public.is_workshop_participant(workshop_id, auth.uid())
      OR public.is_workshop_host(workshop_id, auth.uid()));

CREATE POLICY "Participants insert artifacts"
  ON public.challenge_artifacts FOR INSERT TO authenticated
  WITH CHECK (
    author_id = auth.uid()
    AND (public.is_workshop_participant(workshop_id, auth.uid())
      OR public.is_workshop_host(workshop_id, auth.uid()))
  );

CREATE POLICY "Author or host updates artifacts"
  ON public.challenge_artifacts FOR UPDATE TO authenticated
  USING (author_id = auth.uid() OR public.is_workshop_host(workshop_id, auth.uid()))
  WITH CHECK (author_id = auth.uid() OR public.is_workshop_host(workshop_id, auth.uid()));

CREATE POLICY "Author or host deletes artifacts"
  ON public.challenge_artifacts FOR DELETE TO authenticated
  USING (author_id = auth.uid() OR public.is_workshop_host(workshop_id, auth.uid()));

CREATE TRIGGER trg_cart_updated
  BEFORE UPDATE ON public.challenge_artifacts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ===== 5. challenge_artifact_links =====
DO $$ BEGIN
  CREATE TYPE public.challenge_link_kind AS ENUM
    ('supports','contradicts','depends_on','derived_from','answers','references');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS public.challenge_artifact_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES public.challenge_sessions(id) ON DELETE CASCADE,
  from_id uuid NOT NULL REFERENCES public.challenge_artifacts(id) ON DELETE CASCADE,
  to_id uuid NOT NULL REFERENCES public.challenge_artifacts(id) ON DELETE CASCADE,
  kind public.challenge_link_kind NOT NULL,
  weight numeric NOT NULL DEFAULT 1.0,
  rationale text,
  created_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(from_id, to_id, kind)
);
CREATE INDEX IF NOT EXISTS idx_clinks_session ON public.challenge_artifact_links(session_id);

ALTER TABLE public.challenge_artifact_links ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Participants read links"
  ON public.challenge_artifact_links FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.challenge_sessions s
    WHERE s.id = session_id
      AND (public.is_workshop_participant(s.workshop_id, auth.uid())
        OR public.is_workshop_host(s.workshop_id, auth.uid()))));

CREATE POLICY "Participants insert links"
  ON public.challenge_artifact_links FOR INSERT TO authenticated
  WITH CHECK (created_by = auth.uid()
    AND EXISTS (SELECT 1 FROM public.challenge_sessions s
      WHERE s.id = session_id
        AND (public.is_workshop_participant(s.workshop_id, auth.uid())
          OR public.is_workshop_host(s.workshop_id, auth.uid()))));

CREATE POLICY "Author or host deletes links"
  ON public.challenge_artifact_links FOR DELETE TO authenticated
  USING (created_by = auth.uid()
    OR EXISTS (SELECT 1 FROM public.challenge_sessions s
      WHERE s.id = session_id AND public.is_workshop_host(s.workshop_id, auth.uid())));

-- ===== 6. challenge_reactions =====
CREATE TABLE IF NOT EXISTS public.challenge_reactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  artifact_id uuid NOT NULL REFERENCES public.challenge_artifacts(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  emoji text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(artifact_id, user_id, emoji)
);
CREATE INDEX IF NOT EXISTS idx_creact_artifact ON public.challenge_reactions(artifact_id);

ALTER TABLE public.challenge_reactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Participants read reactions"
  ON public.challenge_reactions FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.challenge_artifacts a
    WHERE a.id = artifact_id
      AND (public.is_workshop_participant(a.workshop_id, auth.uid())
        OR public.is_workshop_host(a.workshop_id, auth.uid()))));

CREATE POLICY "Users manage own reactions"
  ON public.challenge_reactions FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid()
    AND EXISTS (SELECT 1 FROM public.challenge_artifacts a
      WHERE a.id = artifact_id
        AND (public.is_workshop_participant(a.workshop_id, auth.uid())
          OR public.is_workshop_host(a.workshop_id, auth.uid()))));

-- ===== 7. challenge_votes =====
CREATE TABLE IF NOT EXISTS public.challenge_votes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES public.challenge_sessions(id) ON DELETE CASCADE,
  artifact_id uuid NOT NULL REFERENCES public.challenge_artifacts(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  weight int NOT NULL DEFAULT 1 CHECK (weight BETWEEN 1 AND 10),
  vote_round text NOT NULL DEFAULT 'default',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(session_id, artifact_id, user_id, vote_round)
);
CREATE INDEX IF NOT EXISTS idx_cvote_artifact ON public.challenge_votes(artifact_id);

ALTER TABLE public.challenge_votes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Participants read votes"
  ON public.challenge_votes FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.challenge_sessions s
    WHERE s.id = session_id
      AND (public.is_workshop_participant(s.workshop_id, auth.uid())
        OR public.is_workshop_host(s.workshop_id, auth.uid()))));

CREATE POLICY "Users manage own votes"
  ON public.challenge_votes FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid()
    AND EXISTS (SELECT 1 FROM public.challenge_sessions s
      WHERE s.id = session_id
        AND (public.is_workshop_participant(s.workshop_id, auth.uid())
          OR public.is_workshop_host(s.workshop_id, auth.uid()))));

-- ===== 8. challenge_ai_threads =====
CREATE TABLE IF NOT EXISTS public.challenge_ai_threads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES public.challenge_sessions(id) ON DELETE CASCADE,
  artifact_id uuid REFERENCES public.challenge_artifacts(id) ON DELETE CASCADE,
  agent text NOT NULL,
  user_id uuid,
  prompt text NOT NULL,
  response text,
  rag_context jsonb,
  tokens_in int, tokens_out int, model text,
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending','streaming','done','error')),
  error text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_cai_session ON public.challenge_ai_threads(session_id);

ALTER TABLE public.challenge_ai_threads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Participants read AI threads"
  ON public.challenge_ai_threads FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.challenge_sessions s
    WHERE s.id = session_id
      AND (public.is_workshop_participant(s.workshop_id, auth.uid())
        OR public.is_workshop_host(s.workshop_id, auth.uid()))));

CREATE POLICY "Participants create AI threads"
  ON public.challenge_ai_threads FOR INSERT TO authenticated
  WITH CHECK ((user_id IS NULL OR user_id = auth.uid())
    AND EXISTS (SELECT 1 FROM public.challenge_sessions s
      WHERE s.id = session_id
        AND (public.is_workshop_participant(s.workshop_id, auth.uid())
          OR public.is_workshop_host(s.workshop_id, auth.uid()))));

CREATE TRIGGER trg_cai_updated
  BEFORE UPDATE ON public.challenge_ai_threads
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ===== 9. challenge_presence_snapshots =====
CREATE TABLE IF NOT EXISTS public.challenge_presence_snapshots (
  session_id uuid PRIMARY KEY REFERENCES public.challenge_sessions(id) ON DELETE CASCADE,
  snapshot jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.challenge_presence_snapshots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Participants read presence"
  ON public.challenge_presence_snapshots FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.challenge_sessions s
    WHERE s.id = session_id
      AND (public.is_workshop_participant(s.workshop_id, auth.uid())
        OR public.is_workshop_host(s.workshop_id, auth.uid()))));

CREATE POLICY "Participants write presence"
  ON public.challenge_presence_snapshots FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.challenge_sessions s
    WHERE s.id = session_id
      AND (public.is_workshop_participant(s.workshop_id, auth.uid())
        OR public.is_workshop_host(s.workshop_id, auth.uid()))))
  WITH CHECK (EXISTS (SELECT 1 FROM public.challenge_sessions s
    WHERE s.id = session_id
      AND (public.is_workshop_participant(s.workshop_id, auth.uid())
        OR public.is_workshop_host(s.workshop_id, auth.uid()))));

-- ===== 10. challenge_events (append-only) =====
DO $$ BEGIN
  CREATE TYPE public.challenge_event_kind AS ENUM (
    'session.start','session.phase','session.end',
    'artifact.created','artifact.updated','artifact.moved','artifact.resolved','artifact.deleted',
    'link.created','link.deleted',
    'reaction.added','reaction.removed',
    'vote.cast','vote.round.opened','vote.round.closed',
    'ai.requested','ai.responded',
    'timer.started','timer.stopped',
    'focus.changed'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS public.challenge_events (
  id bigserial PRIMARY KEY,
  session_id uuid NOT NULL REFERENCES public.challenge_sessions(id) ON DELETE CASCADE,
  actor_id uuid,
  kind public.challenge_event_kind NOT NULL,
  target_id uuid,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_cev_session_time ON public.challenge_events(session_id, created_at DESC);

ALTER TABLE public.challenge_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Participants read events"
  ON public.challenge_events FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.challenge_sessions s
    WHERE s.id = session_id
      AND (public.is_workshop_participant(s.workshop_id, auth.uid())
        OR public.is_workshop_host(s.workshop_id, auth.uid()))));

CREATE POLICY "Participants insert events"
  ON public.challenge_events FOR INSERT TO authenticated
  WITH CHECK ((actor_id IS NULL OR actor_id = auth.uid())
    AND EXISTS (SELECT 1 FROM public.challenge_sessions s
      WHERE s.id = session_id
        AND (public.is_workshop_participant(s.workshop_id, auth.uid())
          OR public.is_workshop_host(s.workshop_id, auth.uid()))));

-- Append-only: aucun UPDATE/DELETE policy → bloqué par défaut sous RLS.

-- ===== 11. challenge_syntheses =====
CREATE TABLE IF NOT EXISTS public.challenge_syntheses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES public.challenge_sessions(id) ON DELETE CASCADE,
  agent text NOT NULL,
  version int NOT NULL DEFAULT 1,
  content jsonb NOT NULL,
  scores jsonb,
  rag_sources jsonb,
  embedding vector(1536),
  generated_at timestamptz NOT NULL DEFAULT now(),
  generated_by uuid,
  UNIQUE(session_id, agent, version)
);
CREATE INDEX IF NOT EXISTS idx_csyn_session ON public.challenge_syntheses(session_id);

ALTER TABLE public.challenge_syntheses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Participants read syntheses"
  ON public.challenge_syntheses FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.challenge_sessions s
    WHERE s.id = session_id
      AND (public.is_workshop_participant(s.workshop_id, auth.uid())
        OR public.is_workshop_host(s.workshop_id, auth.uid()))));

CREATE POLICY "Host manages syntheses"
  ON public.challenge_syntheses FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.challenge_sessions s
    WHERE s.id = session_id AND public.is_workshop_host(s.workshop_id, auth.uid())))
  WITH CHECK (EXISTS (SELECT 1 FROM public.challenge_sessions s
    WHERE s.id = session_id AND public.is_workshop_host(s.workshop_id, auth.uid())));

-- ===== 12. Storage bucket challenge-media =====
INSERT INTO storage.buckets (id, name, public)
  VALUES ('challenge-media','challenge-media', false)
  ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Participants read challenge media"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'challenge-media'
    AND EXISTS (
      SELECT 1 FROM public.workshops w
      WHERE w.id::text = (storage.foldername(name))[1]
        AND (public.is_workshop_participant(w.id, auth.uid())
          OR public.is_workshop_host(w.id, auth.uid()))
    ));

CREATE POLICY "Participants upload challenge media"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'challenge-media'
    AND (storage.foldername(name))[2] = auth.uid()::text
    AND EXISTS (
      SELECT 1 FROM public.workshops w
      WHERE w.id::text = (storage.foldername(name))[1]
        AND (public.is_workshop_participant(w.id, auth.uid())
          OR public.is_workshop_host(w.id, auth.uid()))
    ));

CREATE POLICY "Owners delete challenge media"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'challenge-media'
    AND (storage.foldername(name))[2] = auth.uid()::text);

-- ===== Realtime =====
ALTER PUBLICATION supabase_realtime ADD TABLE public.challenge_sessions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.challenge_artifacts;
ALTER PUBLICATION supabase_realtime ADD TABLE public.challenge_artifact_links;
ALTER PUBLICATION supabase_realtime ADD TABLE public.challenge_reactions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.challenge_votes;
ALTER PUBLICATION supabase_realtime ADD TABLE public.challenge_ai_threads;
ALTER PUBLICATION supabase_realtime ADD TABLE public.challenge_presence_snapshots;
ALTER PUBLICATION supabase_realtime ADD TABLE public.challenge_syntheses;

ALTER TABLE public.challenge_sessions REPLICA IDENTITY FULL;
ALTER TABLE public.challenge_artifacts REPLICA IDENTITY FULL;
ALTER TABLE public.challenge_artifact_links REPLICA IDENTITY FULL;
ALTER TABLE public.challenge_reactions REPLICA IDENTITY FULL;
ALTER TABLE public.challenge_votes REPLICA IDENTITY FULL;
ALTER TABLE public.challenge_ai_threads REPLICA IDENTITY FULL;
ALTER TABLE public.challenge_presence_snapshots REPLICA IDENTITY FULL;
ALTER TABLE public.challenge_syntheses REPLICA IDENTITY FULL;
