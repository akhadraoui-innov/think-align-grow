
-- HACK & SHOW - SaaS Multi-Tenant Architecture

-- 1. ENUMS
CREATE TYPE public.app_role AS ENUM ('owner', 'admin', 'member');
CREATE TYPE public.toolkit_status AS ENUM ('draft', 'published', 'archived');
CREATE TYPE public.card_phase AS ENUM ('foundations', 'model', 'growth', 'execution');

-- 2. ORGANIZATIONS
CREATE TABLE public.organizations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  logo_url TEXT,
  primary_color TEXT DEFAULT '#E8552D',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. PROFILES
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  avatar_url TEXT,
  xp INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. ORGANIZATION MEMBERS
CREATE TABLE public.organization_members (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL DEFAULT 'member',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(organization_id, user_id)
);

-- 5. USER ROLES
CREATE TABLE public.user_roles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL,
  UNIQUE(user_id, role)
);

-- 6. TOOLKITS
CREATE TABLE public.toolkits (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  icon_emoji TEXT DEFAULT '🚀',
  status toolkit_status NOT NULL DEFAULT 'draft',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 7. ORGANIZATION TOOLKITS
CREATE TABLE public.organization_toolkits (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  toolkit_id UUID NOT NULL REFERENCES public.toolkits(id) ON DELETE CASCADE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  max_members INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(organization_id, toolkit_id)
);

-- 8. PILLARS
CREATE TABLE public.pillars (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  toolkit_id UUID NOT NULL REFERENCES public.toolkits(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  description TEXT,
  icon_name TEXT,
  color TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  UNIQUE(toolkit_id, slug)
);

-- 9. CARDS
CREATE TABLE public.cards (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  pillar_id UUID NOT NULL REFERENCES public.pillars(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  subtitle TEXT,
  definition TEXT,
  action TEXT,
  kpi TEXT,
  phase card_phase NOT NULL DEFAULT 'foundations',
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 10. GAME PLANS
CREATE TABLE public.game_plans (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  toolkit_id UUID NOT NULL REFERENCES public.toolkits(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  difficulty TEXT DEFAULT 'intermediate',
  estimated_minutes INTEGER DEFAULT 30,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 11. GAME PLAN STEPS
CREATE TABLE public.game_plan_steps (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  game_plan_id UUID NOT NULL REFERENCES public.game_plans(id) ON DELETE CASCADE,
  card_id UUID REFERENCES public.cards(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  instruction TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0
);

-- 12. QUIZ QUESTIONS
CREATE TABLE public.quiz_questions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  pillar_id UUID NOT NULL REFERENCES public.pillars(id) ON DELETE CASCADE,
  question TEXT NOT NULL,
  options JSONB NOT NULL DEFAULT '[]',
  sort_order INTEGER NOT NULL DEFAULT 0
);

-- 13. USER CARD PROGRESS
CREATE TABLE public.user_card_progress (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  card_id UUID NOT NULL REFERENCES public.cards(id) ON DELETE CASCADE,
  is_bookmarked BOOLEAN NOT NULL DEFAULT false,
  is_viewed BOOLEAN NOT NULL DEFAULT false,
  viewed_at TIMESTAMPTZ,
  UNIQUE(user_id, card_id)
);

-- 14. USER PLAN PROGRESS
CREATE TABLE public.user_plan_progress (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  game_plan_id UUID NOT NULL REFERENCES public.game_plans(id) ON DELETE CASCADE,
  current_step INTEGER NOT NULL DEFAULT 0,
  is_completed BOOLEAN NOT NULL DEFAULT false,
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ,
  UNIQUE(user_id, game_plan_id)
);

-- 15. QUIZ RESULTS
CREATE TABLE public.quiz_results (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  toolkit_id UUID NOT NULL REFERENCES public.toolkits(id) ON DELETE CASCADE,
  scores JSONB NOT NULL DEFAULT '{}',
  total_score INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- FUNCTIONS
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, display_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$ SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role) $$;

CREATE OR REPLACE FUNCTION public.is_org_member(_user_id UUID, _org_id UUID)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$ SELECT EXISTS (SELECT 1 FROM public.organization_members WHERE user_id = _user_id AND organization_id = _org_id) $$;

CREATE OR REPLACE FUNCTION public.is_org_admin(_user_id UUID, _org_id UUID)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$ SELECT EXISTS (SELECT 1 FROM public.organization_members WHERE user_id = _user_id AND organization_id = _org_id AND role IN ('owner', 'admin')) $$;

-- TRIGGERS
CREATE TRIGGER update_organizations_updated_at BEFORE UPDATE ON public.organizations FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_toolkits_updated_at BEFORE UPDATE ON public.toolkits FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- RLS
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.toolkits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_toolkits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pillars ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.game_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.game_plan_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_card_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_plan_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_results ENABLE ROW LEVEL SECURITY;

-- POLICIES
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "System creates profiles" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Org members can view org" ON public.organizations FOR SELECT USING (public.is_org_member(auth.uid(), id));
CREATE POLICY "Authenticated users can create orgs" ON public.organizations FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Org admins can update org" ON public.organizations FOR UPDATE USING (public.is_org_admin(auth.uid(), id));

CREATE POLICY "Members can view org members" ON public.organization_members FOR SELECT USING (public.is_org_member(auth.uid(), organization_id));
CREATE POLICY "Org admins can manage members" ON public.organization_members FOR INSERT WITH CHECK (public.is_org_admin(auth.uid(), organization_id));
CREATE POLICY "Org admins can update members" ON public.organization_members FOR UPDATE USING (public.is_org_admin(auth.uid(), organization_id));
CREATE POLICY "Org admins can remove members" ON public.organization_members FOR DELETE USING (public.is_org_admin(auth.uid(), organization_id));

CREATE POLICY "Users can view own roles" ON public.user_roles FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Published toolkits are viewable" ON public.toolkits FOR SELECT USING (status = 'published');
CREATE POLICY "Org members see toolkit access" ON public.organization_toolkits FOR SELECT USING (public.is_org_member(auth.uid(), organization_id));

CREATE POLICY "Pillars are viewable" ON public.pillars FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.toolkits WHERE id = pillars.toolkit_id AND status = 'published')
);
CREATE POLICY "Cards are viewable" ON public.cards FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.pillars p JOIN public.toolkits t ON t.id = p.toolkit_id WHERE p.id = cards.pillar_id AND t.status = 'published')
);
CREATE POLICY "Game plans are viewable" ON public.game_plans FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.toolkits WHERE id = game_plans.toolkit_id AND status = 'published')
);
CREATE POLICY "Steps are viewable" ON public.game_plan_steps FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.game_plans gp JOIN public.toolkits t ON t.id = gp.toolkit_id WHERE gp.id = game_plan_steps.game_plan_id AND t.status = 'published')
);
CREATE POLICY "Quiz questions are viewable" ON public.quiz_questions FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.pillars p JOIN public.toolkits t ON t.id = p.toolkit_id WHERE p.id = quiz_questions.pillar_id AND t.status = 'published')
);

CREATE POLICY "Users manage own card progress" ON public.user_card_progress FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users manage own plan progress" ON public.user_plan_progress FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users manage own quiz results" ON public.quiz_results FOR ALL USING (auth.uid() = user_id);
