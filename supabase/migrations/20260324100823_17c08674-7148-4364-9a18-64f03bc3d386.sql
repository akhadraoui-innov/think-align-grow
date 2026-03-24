
CREATE TABLE public.academy_personae (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text NOT NULL DEFAULT '',
  avatar_url text,
  characteristics jsonb NOT NULL DEFAULT '{}'::jsonb,
  organization_id uuid REFERENCES public.organizations(id) ON DELETE SET NULL,
  created_by uuid NOT NULL,
  generation_mode text NOT NULL DEFAULT 'manual',
  status text NOT NULL DEFAULT 'draft',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.academy_personae ENABLE ROW LEVEL SECURITY;
CREATE POLICY "saas_manage_personae" ON public.academy_personae FOR ALL TO authenticated USING (is_saas_team(auth.uid())) WITH CHECK (is_saas_team(auth.uid()));
CREATE POLICY "org_members_view_personae" ON public.academy_personae FOR SELECT TO authenticated USING (organization_id IS NULL OR is_org_member(auth.uid(), organization_id));

CREATE TABLE public.academy_paths (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text NOT NULL DEFAULT '',
  difficulty text DEFAULT 'intermediate',
  estimated_hours numeric DEFAULT 0,
  tags jsonb NOT NULL DEFAULT '[]'::jsonb,
  persona_id uuid REFERENCES public.academy_personae(id) ON DELETE SET NULL,
  organization_id uuid REFERENCES public.organizations(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'draft',
  generation_mode text NOT NULL DEFAULT 'manual',
  certificate_enabled boolean NOT NULL DEFAULT false,
  created_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.academy_paths ENABLE ROW LEVEL SECURITY;
CREATE POLICY "saas_manage_paths" ON public.academy_paths FOR ALL TO authenticated USING (is_saas_team(auth.uid())) WITH CHECK (is_saas_team(auth.uid()));
CREATE POLICY "published_paths_viewable" ON public.academy_paths FOR SELECT TO authenticated USING (status = 'published');

CREATE TABLE public.academy_modules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text NOT NULL DEFAULT '',
  objectives jsonb NOT NULL DEFAULT '[]'::jsonb,
  estimated_minutes integer DEFAULT 30,
  module_type text NOT NULL DEFAULT 'lesson',
  status text NOT NULL DEFAULT 'draft',
  generation_mode text NOT NULL DEFAULT 'manual',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.academy_modules ENABLE ROW LEVEL SECURITY;
CREATE POLICY "saas_manage_modules" ON public.academy_modules FOR ALL TO authenticated USING (is_saas_team(auth.uid())) WITH CHECK (is_saas_team(auth.uid()));

CREATE TABLE public.academy_path_modules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  path_id uuid NOT NULL REFERENCES public.academy_paths(id) ON DELETE CASCADE,
  module_id uuid NOT NULL REFERENCES public.academy_modules(id) ON DELETE CASCADE,
  sort_order integer NOT NULL DEFAULT 0,
  UNIQUE(path_id, module_id)
);
ALTER TABLE public.academy_path_modules ENABLE ROW LEVEL SECURITY;
CREATE POLICY "saas_manage_path_modules" ON public.academy_path_modules FOR ALL TO authenticated USING (is_saas_team(auth.uid())) WITH CHECK (is_saas_team(auth.uid()));
CREATE POLICY "view_path_modules" ON public.academy_path_modules FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.academy_paths ap WHERE ap.id = path_id AND ap.status = 'published'));

CREATE POLICY "published_modules_viewable" ON public.academy_modules FOR SELECT TO authenticated USING (status = 'published' OR EXISTS (
  SELECT 1 FROM public.academy_path_modules apm JOIN public.academy_paths ap ON ap.id = apm.path_id WHERE apm.module_id = academy_modules.id AND ap.status = 'published'
));

CREATE TABLE public.academy_contents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  module_id uuid NOT NULL REFERENCES public.academy_modules(id) ON DELETE CASCADE,
  content_type text NOT NULL DEFAULT 'markdown',
  body text NOT NULL DEFAULT '',
  media_url text,
  sort_order integer NOT NULL DEFAULT 0,
  generation_mode text NOT NULL DEFAULT 'manual',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.academy_contents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "saas_manage_contents" ON public.academy_contents FOR ALL TO authenticated USING (is_saas_team(auth.uid())) WITH CHECK (is_saas_team(auth.uid()));
CREATE POLICY "view_contents" ON public.academy_contents FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.academy_modules m WHERE m.id = module_id));

CREATE TABLE public.academy_quizzes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  module_id uuid NOT NULL REFERENCES public.academy_modules(id) ON DELETE CASCADE,
  title text NOT NULL DEFAULT '',
  description text NOT NULL DEFAULT '',
  passing_score integer NOT NULL DEFAULT 70,
  generation_mode text NOT NULL DEFAULT 'manual',
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.academy_quizzes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "saas_manage_quizzes" ON public.academy_quizzes FOR ALL TO authenticated USING (is_saas_team(auth.uid())) WITH CHECK (is_saas_team(auth.uid()));
CREATE POLICY "view_quizzes" ON public.academy_quizzes FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.academy_modules m WHERE m.id = module_id));

CREATE TABLE public.academy_quiz_questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  quiz_id uuid NOT NULL REFERENCES public.academy_quizzes(id) ON DELETE CASCADE,
  question text NOT NULL,
  question_type text NOT NULL DEFAULT 'mcq',
  options jsonb NOT NULL DEFAULT '[]'::jsonb,
  correct_answer jsonb NOT NULL DEFAULT '""'::jsonb,
  explanation text,
  sort_order integer NOT NULL DEFAULT 0,
  points integer NOT NULL DEFAULT 1
);
ALTER TABLE public.academy_quiz_questions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "saas_manage_quiz_q" ON public.academy_quiz_questions FOR ALL TO authenticated USING (is_saas_team(auth.uid())) WITH CHECK (is_saas_team(auth.uid()));
CREATE POLICY "view_quiz_q" ON public.academy_quiz_questions FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.academy_quizzes q WHERE q.id = quiz_id));

CREATE TABLE public.academy_exercises (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  module_id uuid NOT NULL REFERENCES public.academy_modules(id) ON DELETE CASCADE,
  title text NOT NULL,
  instructions text NOT NULL DEFAULT '',
  evaluation_criteria jsonb NOT NULL DEFAULT '[]'::jsonb,
  expected_output_type text NOT NULL DEFAULT 'text',
  ai_evaluation_enabled boolean NOT NULL DEFAULT false,
  generation_mode text NOT NULL DEFAULT 'manual',
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.academy_exercises ENABLE ROW LEVEL SECURITY;
CREATE POLICY "saas_manage_exercises" ON public.academy_exercises FOR ALL TO authenticated USING (is_saas_team(auth.uid())) WITH CHECK (is_saas_team(auth.uid()));
CREATE POLICY "view_exercises" ON public.academy_exercises FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.academy_modules m WHERE m.id = module_id));

CREATE TABLE public.academy_practices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  module_id uuid NOT NULL REFERENCES public.academy_modules(id) ON DELETE CASCADE,
  title text NOT NULL,
  scenario text NOT NULL DEFAULT '',
  system_prompt text NOT NULL DEFAULT '',
  evaluation_rubric jsonb NOT NULL DEFAULT '[]'::jsonb,
  max_exchanges integer NOT NULL DEFAULT 10,
  difficulty text DEFAULT 'intermediate',
  generation_mode text NOT NULL DEFAULT 'manual',
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.academy_practices ENABLE ROW LEVEL SECURITY;
CREATE POLICY "saas_manage_practices" ON public.academy_practices FOR ALL TO authenticated USING (is_saas_team(auth.uid())) WITH CHECK (is_saas_team(auth.uid()));
CREATE POLICY "view_practices" ON public.academy_practices FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.academy_modules m WHERE m.id = module_id));

CREATE TABLE public.academy_campaigns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text NOT NULL DEFAULT '',
  path_id uuid NOT NULL REFERENCES public.academy_paths(id) ON DELETE CASCADE,
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  starts_at timestamptz NOT NULL DEFAULT now(),
  ends_at timestamptz,
  status text NOT NULL DEFAULT 'draft',
  reminder_config jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.academy_campaigns ENABLE ROW LEVEL SECURITY;
CREATE POLICY "saas_manage_campaigns" ON public.academy_campaigns FOR ALL TO authenticated USING (is_saas_team(auth.uid())) WITH CHECK (is_saas_team(auth.uid()));
CREATE POLICY "org_admins_manage_campaigns" ON public.academy_campaigns FOR ALL TO authenticated USING (is_org_admin(auth.uid(), organization_id)) WITH CHECK (is_org_admin(auth.uid(), organization_id));
CREATE POLICY "org_members_view_campaigns" ON public.academy_campaigns FOR SELECT TO authenticated USING (is_org_member(auth.uid(), organization_id) AND status = 'active');

CREATE TABLE public.academy_campaign_targets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id uuid NOT NULL REFERENCES public.academy_campaigns(id) ON DELETE CASCADE,
  target_type text NOT NULL DEFAULT 'persona',
  target_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.academy_campaign_targets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "saas_manage_targets" ON public.academy_campaign_targets FOR ALL TO authenticated USING (is_saas_team(auth.uid())) WITH CHECK (is_saas_team(auth.uid()));
CREATE POLICY "view_targets" ON public.academy_campaign_targets FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.academy_campaigns c WHERE c.id = campaign_id AND is_org_member(auth.uid(), c.organization_id)));

CREATE TABLE public.academy_enrollments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  path_id uuid NOT NULL REFERENCES public.academy_paths(id) ON DELETE CASCADE,
  campaign_id uuid REFERENCES public.academy_campaigns(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'active',
  enrolled_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz,
  UNIQUE(user_id, path_id)
);
ALTER TABLE public.academy_enrollments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users_manage_own_enrollments" ON public.academy_enrollments FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "saas_view_enrollments" ON public.academy_enrollments FOR SELECT TO authenticated USING (is_saas_team(auth.uid()));

CREATE TABLE public.academy_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  module_id uuid NOT NULL REFERENCES public.academy_modules(id) ON DELETE CASCADE,
  enrollment_id uuid NOT NULL REFERENCES public.academy_enrollments(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'not_started',
  score integer,
  time_spent_seconds integer NOT NULL DEFAULT 0,
  started_at timestamptz,
  completed_at timestamptz,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  UNIQUE(user_id, module_id, enrollment_id)
);
ALTER TABLE public.academy_progress ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users_manage_own_progress" ON public.academy_progress FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "saas_view_progress" ON public.academy_progress FOR SELECT TO authenticated USING (is_saas_team(auth.uid()));

CREATE TABLE public.academy_certificates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  path_id uuid NOT NULL REFERENCES public.academy_paths(id) ON DELETE CASCADE,
  enrollment_id uuid NOT NULL REFERENCES public.academy_enrollments(id) ON DELETE CASCADE,
  issued_at timestamptz NOT NULL DEFAULT now(),
  certificate_data jsonb NOT NULL DEFAULT '{}'::jsonb,
  UNIQUE(user_id, path_id)
);
ALTER TABLE public.academy_certificates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users_view_own_certs" ON public.academy_certificates FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "saas_manage_certs" ON public.academy_certificates FOR ALL TO authenticated USING (is_saas_team(auth.uid())) WITH CHECK (is_saas_team(auth.uid()));

CREATE TRIGGER academy_personae_updated_at BEFORE UPDATE ON public.academy_personae FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER academy_paths_updated_at BEFORE UPDATE ON public.academy_paths FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER academy_modules_updated_at BEFORE UPDATE ON public.academy_modules FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER academy_contents_updated_at BEFORE UPDATE ON public.academy_contents FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER academy_campaigns_updated_at BEFORE UPDATE ON public.academy_campaigns FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
