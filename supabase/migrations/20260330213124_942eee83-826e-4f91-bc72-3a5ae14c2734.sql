
-- Table: academy_path_feedback — Retour d'expérience apprenant
CREATE TABLE IF NOT EXISTS public.academy_path_feedback (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  path_id uuid REFERENCES public.academy_paths(id) ON DELETE CASCADE NOT NULL,
  user_id uuid NOT NULL,
  enrollment_id uuid REFERENCES public.academy_enrollments(id) ON DELETE CASCADE NOT NULL,
  overall_rating integer,
  difficulty_rating integer,
  relevance_rating integer,
  strengths text[] DEFAULT '{}',
  improvements text[] DEFAULT '{}',
  testimonial text,
  would_recommend boolean DEFAULT true,
  ai_generated_insights jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  UNIQUE(enrollment_id)
);

ALTER TABLE public.academy_path_feedback ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own feedback" ON public.academy_path_feedback
  FOR SELECT TO authenticated USING (user_id = auth.uid());

CREATE POLICY "Users can insert own feedback" ON public.academy_path_feedback
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own feedback" ON public.academy_path_feedback
  FOR UPDATE TO authenticated USING (user_id = auth.uid());

CREATE POLICY "SaaS team can read all feedback" ON public.academy_path_feedback
  FOR SELECT TO authenticated USING (public.is_saas_team(auth.uid()));

-- Table: academy_skill_assessments — Évaluation par compétence
CREATE TABLE IF NOT EXISTS public.academy_skill_assessments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  enrollment_id uuid REFERENCES public.academy_enrollments(id) ON DELETE CASCADE NOT NULL,
  user_id uuid NOT NULL,
  skill_name text NOT NULL,
  initial_level integer DEFAULT 0,
  final_level integer DEFAULT 0,
  evidence jsonb DEFAULT '[]',
  assessed_at timestamptz DEFAULT now()
);

ALTER TABLE public.academy_skill_assessments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own assessments" ON public.academy_skill_assessments
  FOR SELECT TO authenticated USING (user_id = auth.uid());

CREATE POLICY "SaaS team can read all assessments" ON public.academy_skill_assessments
  FOR SELECT TO authenticated USING (public.is_saas_team(auth.uid()));

CREATE POLICY "SaaS team can manage assessments" ON public.academy_skill_assessments
  FOR ALL TO authenticated USING (public.is_saas_team(auth.uid()));
