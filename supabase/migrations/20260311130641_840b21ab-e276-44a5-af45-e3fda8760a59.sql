
-- Allow SaaS team to fully manage organization_toolkits
CREATE POLICY "Saas team can manage org toolkits"
ON public.organization_toolkits
FOR ALL
TO authenticated
USING (is_saas_team(auth.uid()))
WITH CHECK (is_saas_team(auth.uid()));

-- Allow SaaS team to manage challenge_templates
CREATE POLICY "Saas team can manage challenge templates"
ON public.challenge_templates
FOR ALL
TO authenticated
USING (is_saas_team(auth.uid()))
WITH CHECK (is_saas_team(auth.uid()));

-- Allow SaaS team to manage challenge_subjects
CREATE POLICY "Saas team can manage challenge subjects"
ON public.challenge_subjects
FOR ALL
TO authenticated
USING (is_saas_team(auth.uid()))
WITH CHECK (is_saas_team(auth.uid()));

-- Allow SaaS team to manage challenge_slots
CREATE POLICY "Saas team can manage challenge slots"
ON public.challenge_slots
FOR ALL
TO authenticated
USING (is_saas_team(auth.uid()))
WITH CHECK (is_saas_team(auth.uid()));

-- Allow SaaS team to manage game_plans
CREATE POLICY "Saas team can manage game plans"
ON public.game_plans
FOR ALL
TO authenticated
USING (is_saas_team(auth.uid()))
WITH CHECK (is_saas_team(auth.uid()));

-- Allow SaaS team to manage game_plan_steps
CREATE POLICY "Saas team can manage game plan steps"
ON public.game_plan_steps
FOR ALL
TO authenticated
USING (is_saas_team(auth.uid()))
WITH CHECK (is_saas_team(auth.uid()));

-- Allow SaaS team to manage quiz_questions
CREATE POLICY "Saas team can manage quiz questions"
ON public.quiz_questions
FOR ALL
TO authenticated
USING (is_saas_team(auth.uid()))
WITH CHECK (is_saas_team(auth.uid()));

-- Allow SaaS team to view all workshops
CREATE POLICY "Saas team can view all workshops"
ON public.workshops
FOR SELECT
TO authenticated
USING (is_saas_team(auth.uid()));

-- Allow SaaS team to view all workshop participants
CREATE POLICY "Saas team can view all participants"
ON public.workshop_participants
FOR SELECT
TO authenticated
USING (is_saas_team(auth.uid()));
