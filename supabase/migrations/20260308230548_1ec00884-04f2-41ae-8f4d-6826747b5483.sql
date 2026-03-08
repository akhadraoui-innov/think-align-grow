
-- Restrict org creation: only allow if user doesn't already own an org (for now)
DROP POLICY "Authenticated users can create orgs" ON public.organizations;
CREATE POLICY "Authenticated users can create orgs" ON public.organizations 
  FOR INSERT TO authenticated 
  WITH CHECK (
    NOT EXISTS (
      SELECT 1 FROM public.organization_members 
      WHERE user_id = auth.uid() AND role = 'owner'
    )
  );
