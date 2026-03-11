
-- 2. Add columns to profiles
ALTER TABLE public.profiles 
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'active',
  ADD COLUMN IF NOT EXISTS last_seen_at timestamptz;

-- 3. Add columns to workshops
ALTER TABLE public.workshops
  ADD COLUMN IF NOT EXISTS description text,
  ADD COLUMN IF NOT EXISTS objectives jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS context text,
  ADD COLUMN IF NOT EXISTS scheduled_at timestamptz,
  ADD COLUMN IF NOT EXISTS max_participants integer,
  ADD COLUMN IF NOT EXISTS session_mode text DEFAULT 'remote',
  ADD COLUMN IF NOT EXISTS facilitator_id uuid,
  ADD COLUMN IF NOT EXISTS organization_id uuid REFERENCES public.organizations(id);

-- 4. Create teams table
CREATE TABLE public.teams (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  lead_user_id uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;

-- 5. Create team_members table
CREATE TABLE public.team_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id uuid NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(team_id, user_id)
);
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;

-- 6. Create subscription_plans table
CREATE TABLE public.subscription_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  price_monthly numeric(10,2) DEFAULT 0,
  price_yearly numeric(10,2) DEFAULT 0,
  quotas jsonb NOT NULL DEFAULT '{}'::jsonb,
  features jsonb NOT NULL DEFAULT '{}'::jsonb,
  is_active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;

-- 7. Create organization_subscriptions table
CREATE TABLE public.organization_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  plan_id uuid NOT NULL REFERENCES public.subscription_plans(id),
  status text NOT NULL DEFAULT 'trial',
  started_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.organization_subscriptions ENABLE ROW LEVEL SECURITY;

-- 8. Create workshop_invitations table
CREATE TABLE public.workshop_invitations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workshop_id uuid NOT NULL REFERENCES public.workshops(id) ON DELETE CASCADE,
  email text NOT NULL,
  token text NOT NULL DEFAULT encode(gen_random_bytes(16), 'hex'),
  status text NOT NULL DEFAULT 'pending',
  role text NOT NULL DEFAULT 'participant',
  invited_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.workshop_invitations ENABLE ROW LEVEL SECURITY;

-- 9. Create workshop_actions table
CREATE TABLE public.workshop_actions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workshop_id uuid NOT NULL REFERENCES public.workshops(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  assignee_id uuid,
  status text NOT NULL DEFAULT 'todo',
  due_date date,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.workshop_actions ENABLE ROW LEVEL SECURITY;

-- 10. Create workshop_snapshots table
CREATE TABLE public.workshop_snapshots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workshop_id uuid NOT NULL REFERENCES public.workshops(id) ON DELETE CASCADE,
  snapshot_data jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.workshop_snapshots ENABLE ROW LEVEL SECURITY;

-- 11. Create activity_logs table
CREATE TABLE public.activity_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  organization_id uuid REFERENCES public.organizations(id),
  action text NOT NULL,
  entity_type text,
  entity_id text,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_activity_logs_created_at ON public.activity_logs(created_at DESC);
CREATE INDEX idx_activity_logs_user_id ON public.activity_logs(user_id);

-- 12. Create is_saas_team function
CREATE OR REPLACE FUNCTION public.is_saas_team(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id
      AND role IN ('super_admin', 'customer_lead', 'innovation_lead', 'performance_lead', 'product_actor')
  )
$$;

-- 13. Create has_any_role function
CREATE OR REPLACE FUNCTION public.has_any_role(_user_id uuid, _roles app_role[])
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id
      AND role = ANY(_roles)
  )
$$;

-- 14. RLS policies for teams
CREATE POLICY "Org members can view teams" ON public.teams
  FOR SELECT TO authenticated
  USING (is_org_member(auth.uid(), organization_id));

CREATE POLICY "Org admins and saas team can manage teams" ON public.teams
  FOR ALL TO authenticated
  USING (is_org_admin(auth.uid(), organization_id) OR is_saas_team(auth.uid()))
  WITH CHECK (is_org_admin(auth.uid(), organization_id) OR is_saas_team(auth.uid()));

-- 15. RLS policies for team_members
CREATE POLICY "Org members can view team members" ON public.team_members
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.teams t
    WHERE t.id = team_members.team_id
      AND is_org_member(auth.uid(), t.organization_id)
  ));

CREATE POLICY "Org admins and saas team can manage team members" ON public.team_members
  FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.teams t
    WHERE t.id = team_members.team_id
      AND (is_org_admin(auth.uid(), t.organization_id) OR is_saas_team(auth.uid()))
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.teams t
    WHERE t.id = team_members.team_id
      AND (is_org_admin(auth.uid(), t.organization_id) OR is_saas_team(auth.uid()))
  ));

-- 16. RLS policies for subscription_plans (public read, saas write)
CREATE POLICY "Anyone can view active plans" ON public.subscription_plans
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Saas team can manage plans" ON public.subscription_plans
  FOR ALL TO authenticated
  USING (is_saas_team(auth.uid()))
  WITH CHECK (is_saas_team(auth.uid()));

-- 17. RLS policies for organization_subscriptions
CREATE POLICY "Org admins and saas team can view subscriptions" ON public.organization_subscriptions
  FOR SELECT TO authenticated
  USING (is_org_admin(auth.uid(), organization_id) OR is_saas_team(auth.uid()));

CREATE POLICY "Saas team can manage subscriptions" ON public.organization_subscriptions
  FOR ALL TO authenticated
  USING (is_saas_team(auth.uid()))
  WITH CHECK (is_saas_team(auth.uid()));

-- 18. RLS policies for workshop_invitations
CREATE POLICY "Workshop host and saas can manage invitations" ON public.workshop_invitations
  FOR ALL TO authenticated
  USING (is_workshop_host(workshop_id, auth.uid()) OR is_saas_team(auth.uid()))
  WITH CHECK (is_workshop_host(workshop_id, auth.uid()) OR is_saas_team(auth.uid()));

CREATE POLICY "Participants can view invitations" ON public.workshop_invitations
  FOR SELECT TO authenticated
  USING (is_workshop_participant(workshop_id, auth.uid()));

-- 19. RLS policies for workshop_actions
CREATE POLICY "Workshop host and saas can manage actions" ON public.workshop_actions
  FOR ALL TO authenticated
  USING (is_workshop_host(workshop_id, auth.uid()) OR is_saas_team(auth.uid()))
  WITH CHECK (is_workshop_host(workshop_id, auth.uid()) OR is_saas_team(auth.uid()));

CREATE POLICY "Participants can view actions" ON public.workshop_actions
  FOR SELECT TO authenticated
  USING (is_workshop_participant(workshop_id, auth.uid()));

-- 20. RLS policies for workshop_snapshots
CREATE POLICY "Workshop host and saas can manage snapshots" ON public.workshop_snapshots
  FOR ALL TO authenticated
  USING (is_workshop_host(workshop_id, auth.uid()) OR is_saas_team(auth.uid()))
  WITH CHECK (is_workshop_host(workshop_id, auth.uid()) OR is_saas_team(auth.uid()));

CREATE POLICY "Participants can view snapshots" ON public.workshop_snapshots
  FOR SELECT TO authenticated
  USING (is_workshop_participant(workshop_id, auth.uid()));

-- 21. RLS policies for activity_logs
CREATE POLICY "Authenticated can insert own logs" ON public.activity_logs
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Saas team and org admins can view logs" ON public.activity_logs
  FOR SELECT TO authenticated
  USING (
    is_saas_team(auth.uid()) 
    OR (organization_id IS NOT NULL AND is_org_admin(auth.uid(), organization_id))
  );

-- 22. Also allow saas team to view all organizations
CREATE POLICY "Saas team can view all orgs" ON public.organizations
  FOR SELECT TO authenticated
  USING (is_saas_team(auth.uid()));

-- 23. Allow saas team to manage all organizations
CREATE POLICY "Saas team can manage all orgs" ON public.organizations
  FOR ALL TO authenticated
  USING (is_saas_team(auth.uid()))
  WITH CHECK (is_saas_team(auth.uid()));

-- 24. Allow saas team to view all profiles
CREATE POLICY "Saas team can view all profiles" ON public.profiles
  FOR SELECT TO authenticated
  USING (is_saas_team(auth.uid()));

-- 25. Allow saas team to manage all org members
CREATE POLICY "Saas team can manage all org members" ON public.organization_members
  FOR ALL TO authenticated
  USING (is_saas_team(auth.uid()))
  WITH CHECK (is_saas_team(auth.uid()));

-- 26. Allow saas team to manage toolkits
CREATE POLICY "Saas team can manage toolkits" ON public.toolkits
  FOR ALL TO authenticated
  USING (is_saas_team(auth.uid()))
  WITH CHECK (is_saas_team(auth.uid()));

-- 27. Allow saas team to manage pillars
CREATE POLICY "Saas team can manage pillars" ON public.pillars
  FOR ALL TO authenticated
  USING (is_saas_team(auth.uid()))
  WITH CHECK (is_saas_team(auth.uid()));

-- 28. Allow saas team to manage cards
CREATE POLICY "Saas team can manage cards" ON public.cards
  FOR ALL TO authenticated
  USING (is_saas_team(auth.uid()))
  WITH CHECK (is_saas_team(auth.uid()));

-- 29. Allow saas team to view all user roles
CREATE POLICY "Saas team can view all roles" ON public.user_roles
  FOR SELECT TO authenticated
  USING (is_saas_team(auth.uid()));

-- 30. Allow saas team to manage user roles
CREATE POLICY "Saas team can manage roles" ON public.user_roles
  FOR ALL TO authenticated
  USING (is_saas_team(auth.uid()))
  WITH CHECK (is_saas_team(auth.uid()));
