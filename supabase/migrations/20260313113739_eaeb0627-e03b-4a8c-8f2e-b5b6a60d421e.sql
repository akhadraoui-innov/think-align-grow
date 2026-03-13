
-- Table to store editable role-permission mappings
CREATE TABLE public.role_permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  role public.app_role NOT NULL,
  permission_key text NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(role, permission_key)
);

ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "super_admin_manage" ON public.role_permissions
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'super_admin'))
  WITH CHECK (public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "authenticated_read" ON public.role_permissions
  FOR SELECT TO authenticated
  USING (true);

-- Seed: super_admin (all permissions)
INSERT INTO public.role_permissions (role, permission_key) VALUES
  ('super_admin','admin.dashboard.view'),('super_admin','admin.dashboard.kpis'),('super_admin','admin.dashboard.alerts'),
  ('super_admin','admin.orgs.view'),('super_admin','admin.orgs.create'),('super_admin','admin.orgs.edit'),('super_admin','admin.orgs.delete'),('super_admin','admin.orgs.members'),('super_admin','admin.orgs.teams'),('super_admin','admin.orgs.toolkits'),('super_admin','admin.orgs.subscriptions'),
  ('super_admin','admin.users.view'),('super_admin','admin.users.edit'),('super_admin','admin.users.roles'),('super_admin','admin.users.credits'),('super_admin','admin.users.activity'),('super_admin','admin.users.orgs'),
  ('super_admin','admin.toolkits.view'),('super_admin','admin.toolkits.create'),('super_admin','admin.toolkits.edit'),('super_admin','admin.toolkits.publish'),('super_admin','admin.toolkits.delete'),('super_admin','admin.toolkits.pillars'),('super_admin','admin.toolkits.cards'),('super_admin','admin.toolkits.challenges'),('super_admin','admin.toolkits.gameplans'),('super_admin','admin.toolkits.quiz'),('super_admin','admin.toolkits.import'),('super_admin','admin.toolkits.ai_generate'),
  ('super_admin','admin.workshops.view'),('super_admin','admin.workshops.manage'),('super_admin','admin.workshops.participants'),('super_admin','admin.workshops.canvas'),
  ('super_admin','admin.challenges.view'),('super_admin','admin.challenges.manage'),('super_admin','admin.challenges.analyze'),
  ('super_admin','admin.billing.view'),('super_admin','admin.billing.plans'),('super_admin','admin.billing.subscriptions'),('super_admin','admin.billing.credits'),
  ('super_admin','admin.logs.view'),('super_admin','admin.logs.export'),
  ('super_admin','admin.settings.ai'),('super_admin','admin.settings.providers'),('super_admin','admin.settings.prompts'),('super_admin','admin.settings.roles'),('super_admin','admin.settings.platform'),
  ('super_admin','app.explore.view'),('super_admin','app.explore.bookmark'),('super_admin','app.plans.view'),('super_admin','app.plans.progress'),('super_admin','app.lab.quiz'),('super_admin','app.lab.results'),('super_admin','app.ai.coach'),('super_admin','app.ai.deliverables'),('super_admin','app.ai.reflection'),('super_admin','app.workshop.create'),('super_admin','app.workshop.join'),('super_admin','app.workshop.facilitate'),('super_admin','app.workshop.deliverables'),('super_admin','app.challenge.participate'),('super_admin','app.challenge.analyze'),('super_admin','app.profile.edit'),('super_admin','app.profile.org');

-- Seed: customer_lead
INSERT INTO public.role_permissions (role, permission_key) VALUES
  ('customer_lead','admin.dashboard.view'),('customer_lead','admin.dashboard.kpis'),('customer_lead','admin.dashboard.alerts'),
  ('customer_lead','admin.orgs.view'),('customer_lead','admin.orgs.create'),('customer_lead','admin.orgs.edit'),('customer_lead','admin.orgs.delete'),('customer_lead','admin.orgs.members'),('customer_lead','admin.orgs.teams'),('customer_lead','admin.orgs.toolkits'),('customer_lead','admin.orgs.subscriptions'),
  ('customer_lead','admin.users.view'),('customer_lead','admin.users.edit'),('customer_lead','admin.users.roles'),('customer_lead','admin.users.credits'),('customer_lead','admin.users.activity'),('customer_lead','admin.users.orgs'),
  ('customer_lead','admin.workshops.view'),('customer_lead','admin.workshops.participants'),
  ('customer_lead','admin.billing.view'),('customer_lead','admin.billing.subscriptions'),
  ('customer_lead','app.explore.view'),('customer_lead','app.explore.bookmark'),('customer_lead','app.plans.view'),('customer_lead','app.plans.progress'),('customer_lead','app.lab.quiz'),('customer_lead','app.lab.results'),('customer_lead','app.ai.coach'),('customer_lead','app.ai.deliverables'),('customer_lead','app.ai.reflection'),('customer_lead','app.workshop.create'),('customer_lead','app.workshop.join'),('customer_lead','app.workshop.facilitate'),('customer_lead','app.workshop.deliverables'),('customer_lead','app.challenge.participate'),('customer_lead','app.challenge.analyze'),('customer_lead','app.profile.edit'),('customer_lead','app.profile.org');

-- Seed: innovation_lead
INSERT INTO public.role_permissions (role, permission_key) VALUES
  ('innovation_lead','admin.dashboard.view'),('innovation_lead','admin.dashboard.kpis'),
  ('innovation_lead','admin.orgs.view'),('innovation_lead','admin.orgs.toolkits'),
  ('innovation_lead','admin.toolkits.view'),('innovation_lead','admin.toolkits.create'),('innovation_lead','admin.toolkits.edit'),('innovation_lead','admin.toolkits.publish'),('innovation_lead','admin.toolkits.delete'),('innovation_lead','admin.toolkits.pillars'),('innovation_lead','admin.toolkits.cards'),('innovation_lead','admin.toolkits.challenges'),('innovation_lead','admin.toolkits.gameplans'),('innovation_lead','admin.toolkits.quiz'),('innovation_lead','admin.toolkits.import'),('innovation_lead','admin.toolkits.ai_generate'),
  ('innovation_lead','admin.workshops.view'),('innovation_lead','admin.workshops.canvas'),
  ('innovation_lead','admin.challenges.view'),('innovation_lead','admin.challenges.manage'),('innovation_lead','admin.challenges.analyze'),
  ('innovation_lead','admin.settings.ai'),('innovation_lead','admin.settings.providers'),('innovation_lead','admin.settings.prompts'),
  ('innovation_lead','app.explore.view'),('innovation_lead','app.explore.bookmark'),('innovation_lead','app.plans.view'),('innovation_lead','app.plans.progress'),('innovation_lead','app.lab.quiz'),('innovation_lead','app.lab.results'),('innovation_lead','app.ai.coach'),('innovation_lead','app.ai.deliverables'),('innovation_lead','app.ai.reflection'),('innovation_lead','app.workshop.create'),('innovation_lead','app.workshop.join'),('innovation_lead','app.workshop.facilitate'),('innovation_lead','app.workshop.deliverables'),('innovation_lead','app.challenge.participate'),('innovation_lead','app.challenge.analyze'),('innovation_lead','app.profile.edit'),('innovation_lead','app.profile.org');

-- Seed: performance_lead
INSERT INTO public.role_permissions (role, permission_key) VALUES
  ('performance_lead','admin.dashboard.view'),('performance_lead','admin.dashboard.kpis'),('performance_lead','admin.dashboard.alerts'),
  ('performance_lead','admin.orgs.view'),('performance_lead','admin.orgs.subscriptions'),
  ('performance_lead','admin.workshops.view'),('performance_lead','admin.workshops.participants'),
  ('performance_lead','admin.billing.view'),('performance_lead','admin.billing.plans'),('performance_lead','admin.billing.subscriptions'),('performance_lead','admin.billing.credits'),
  ('performance_lead','admin.logs.view'),
  ('performance_lead','app.explore.view'),('performance_lead','app.explore.bookmark'),('performance_lead','app.plans.view'),('performance_lead','app.plans.progress'),('performance_lead','app.lab.quiz'),('performance_lead','app.lab.results'),('performance_lead','app.ai.coach'),('performance_lead','app.ai.deliverables'),('performance_lead','app.ai.reflection'),('performance_lead','app.workshop.create'),('performance_lead','app.workshop.join'),('performance_lead','app.workshop.facilitate'),('performance_lead','app.workshop.deliverables'),('performance_lead','app.challenge.participate'),('performance_lead','app.challenge.analyze'),('performance_lead','app.profile.edit'),('performance_lead','app.profile.org');

-- Seed: product_actor
INSERT INTO public.role_permissions (role, permission_key) VALUES
  ('product_actor','admin.dashboard.view'),('product_actor','admin.dashboard.kpis'),
  ('product_actor','admin.orgs.view'),
  ('product_actor','admin.toolkits.view'),('product_actor','admin.toolkits.edit'),('product_actor','admin.toolkits.pillars'),('product_actor','admin.toolkits.cards'),('product_actor','admin.toolkits.quiz'),('product_actor','admin.toolkits.gameplans'),
  ('product_actor','admin.workshops.view'),('product_actor','admin.workshops.canvas'),
  ('product_actor','app.explore.view'),('product_actor','app.explore.bookmark'),('product_actor','app.plans.view'),('product_actor','app.plans.progress'),('product_actor','app.lab.quiz'),('product_actor','app.lab.results'),('product_actor','app.ai.coach'),('product_actor','app.ai.deliverables'),('product_actor','app.ai.reflection'),('product_actor','app.workshop.create'),('product_actor','app.workshop.join'),('product_actor','app.workshop.facilitate'),('product_actor','app.workshop.deliverables'),('product_actor','app.challenge.participate'),('product_actor','app.challenge.analyze'),('product_actor','app.profile.edit'),('product_actor','app.profile.org');

-- Seed: owner
INSERT INTO public.role_permissions (role, permission_key) VALUES
  ('owner','app.explore.view'),('owner','app.explore.bookmark'),('owner','app.plans.view'),('owner','app.plans.progress'),('owner','app.lab.quiz'),('owner','app.lab.results'),('owner','app.ai.coach'),('owner','app.ai.deliverables'),('owner','app.ai.reflection'),('owner','app.workshop.create'),('owner','app.workshop.join'),('owner','app.workshop.facilitate'),('owner','app.workshop.deliverables'),('owner','app.challenge.participate'),('owner','app.challenge.analyze'),('owner','app.profile.edit'),('owner','app.profile.org');

-- Seed: admin
INSERT INTO public.role_permissions (role, permission_key) VALUES
  ('admin','app.explore.view'),('admin','app.explore.bookmark'),('admin','app.plans.view'),('admin','app.plans.progress'),('admin','app.lab.quiz'),('admin','app.lab.results'),('admin','app.ai.coach'),('admin','app.ai.deliverables'),('admin','app.ai.reflection'),('admin','app.workshop.create'),('admin','app.workshop.join'),('admin','app.workshop.facilitate'),('admin','app.workshop.deliverables'),('admin','app.challenge.participate'),('admin','app.challenge.analyze'),('admin','app.profile.edit'),('admin','app.profile.org');

-- Seed: lead
INSERT INTO public.role_permissions (role, permission_key) VALUES
  ('lead','app.explore.view'),('lead','app.explore.bookmark'),('lead','app.plans.view'),('lead','app.plans.progress'),('lead','app.lab.quiz'),('lead','app.lab.results'),('lead','app.ai.coach'),('lead','app.ai.deliverables'),('lead','app.ai.reflection'),('lead','app.workshop.create'),('lead','app.workshop.join'),('lead','app.workshop.facilitate'),('lead','app.workshop.deliverables'),('lead','app.challenge.participate'),('lead','app.challenge.analyze'),('lead','app.profile.edit'),('lead','app.profile.org');

-- Seed: facilitator
INSERT INTO public.role_permissions (role, permission_key) VALUES
  ('facilitator','app.explore.view'),('facilitator','app.explore.bookmark'),('facilitator','app.plans.view'),('facilitator','app.plans.progress'),('facilitator','app.lab.quiz'),('facilitator','app.lab.results'),('facilitator','app.ai.coach'),('facilitator','app.ai.deliverables'),('facilitator','app.ai.reflection'),('facilitator','app.workshop.create'),('facilitator','app.workshop.join'),('facilitator','app.workshop.facilitate'),('facilitator','app.workshop.deliverables'),('facilitator','app.challenge.participate'),('facilitator','app.challenge.analyze'),('facilitator','app.profile.edit'),('facilitator','app.profile.org');

-- Seed: manager
INSERT INTO public.role_permissions (role, permission_key) VALUES
  ('manager','app.explore.view'),('manager','app.explore.bookmark'),('manager','app.plans.view'),('manager','app.plans.progress'),('manager','app.lab.quiz'),('manager','app.lab.results'),('manager','app.ai.coach'),('manager','app.workshop.create'),('manager','app.workshop.join'),('manager','app.challenge.participate'),('manager','app.challenge.analyze'),('manager','app.profile.edit'),('manager','app.profile.org');

-- Seed: member
INSERT INTO public.role_permissions (role, permission_key) VALUES
  ('member','app.explore.view'),('member','app.explore.bookmark'),('member','app.plans.view'),('member','app.plans.progress'),('member','app.lab.quiz'),('member','app.lab.results'),('member','app.ai.coach'),('member','app.workshop.join'),('member','app.challenge.participate'),('member','app.profile.edit'),('member','app.profile.org');

-- Seed: guest
INSERT INTO public.role_permissions (role, permission_key) VALUES
  ('guest','app.explore.view'),('guest','app.workshop.join'),('guest','app.challenge.participate'),('guest','app.profile.edit');
