-- 1. Add phases and evaluation_dimensions columns to academy_practices
ALTER TABLE public.academy_practices 
  ADD COLUMN IF NOT EXISTS phases jsonb NOT NULL DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS evaluation_dimensions jsonb NOT NULL DEFAULT '[]';

-- 2. Create academy_practice_sessions table for chat persistence
CREATE TABLE public.academy_practice_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  practice_id uuid NOT NULL REFERENCES public.academy_practices(id) ON DELETE CASCADE,
  enrollment_id uuid REFERENCES public.academy_enrollments(id) ON DELETE SET NULL,
  messages jsonb NOT NULL DEFAULT '[]',
  evaluation jsonb DEFAULT NULL,
  score integer DEFAULT NULL,
  started_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz DEFAULT NULL
);

-- 3. Enable RLS
ALTER TABLE public.academy_practice_sessions ENABLE ROW LEVEL SECURITY;

-- 4. RLS: Users manage their own sessions
CREATE POLICY "users_manage_own_sessions" ON public.academy_practice_sessions
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 5. RLS: SaaS team can view all sessions
CREATE POLICY "saas_view_sessions" ON public.academy_practice_sessions
  FOR SELECT TO authenticated
  USING (is_saas_team(auth.uid()));

-- 6. Performance indexes
CREATE INDEX idx_practice_sessions_user ON public.academy_practice_sessions(user_id, practice_id);
CREATE INDEX idx_practice_sessions_enrollment ON public.academy_practice_sessions(enrollment_id);
CREATE INDEX idx_progress_enrollment_module ON public.academy_progress(enrollment_id, module_id);