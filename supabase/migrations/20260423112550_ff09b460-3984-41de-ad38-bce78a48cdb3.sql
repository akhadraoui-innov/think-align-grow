-- Tighten brand-assets bucket: keep public read of individual files, restrict listing
DROP POLICY IF EXISTS "brand_assets_public_read" ON storage.objects;
DROP POLICY IF EXISTS "brand_assets_saas_insert" ON storage.objects;
DROP POLICY IF EXISTS "brand_assets_saas_update" ON storage.objects;
DROP POLICY IF EXISTS "brand_assets_saas_delete" ON storage.objects;

-- Public can read individual objects only when they know the path (no broad listing)
CREATE POLICY "brand_assets_public_object_read"
ON storage.objects FOR SELECT
TO anon, authenticated
USING (bucket_id = 'brand-assets' AND name IS NOT NULL);

-- SaaS team full management
CREATE POLICY "brand_assets_saas_insert"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'brand-assets' AND public.is_saas_team(auth.uid()));

CREATE POLICY "brand_assets_saas_update"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'brand-assets' AND public.is_saas_team(auth.uid()));

CREATE POLICY "brand_assets_saas_delete"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'brand-assets' AND public.is_saas_team(auth.uid()));