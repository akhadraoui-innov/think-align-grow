-- Hotfix régression covers Academy : repasser academy-assets en lecture publique
-- Cause : migration Lot 7 (20260423103833) avait passé le bucket en privé,
-- cassant les URLs publiques stockées en DB (academy_paths.cover_image_url).

UPDATE storage.buckets SET public = true WHERE id = 'academy-assets';

-- Supprimer la policy de lecture restreinte aux authentifiés
DROP POLICY IF EXISTS "academy_assets_authenticated_read" ON storage.objects;
DROP POLICY IF EXISTS "academy_assets_public_read" ON storage.objects;

-- Recréer la policy de lecture publique (anon + authenticated)
CREATE POLICY "academy_assets_public_read"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'academy-assets');

-- Les policies INSERT/UPDATE/DELETE restent inchangées (SaaS team only)
-- définies par la migration 20260426114207