
-- Sécuriser academy-assets : lecture par utilisateurs authentifiés, écriture SaaS team
UPDATE storage.buckets SET public = false WHERE id = 'academy-assets';

DROP POLICY IF EXISTS "Anyone can view academy assets" ON storage.objects;
DROP POLICY IF EXISTS "Public can view academy assets" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated can view academy assets" ON storage.objects;
DROP POLICY IF EXISTS "SaaS team can manage academy assets" ON storage.objects;

CREATE POLICY "Authenticated can view academy assets"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'academy-assets' AND auth.uid() IS NOT NULL);

CREATE POLICY "SaaS team can manage academy assets"
  ON storage.objects FOR ALL
  USING (bucket_id = 'academy-assets' AND public.is_saas_team(auth.uid()))
  WITH CHECK (bucket_id = 'academy-assets' AND public.is_saas_team(auth.uid()));
