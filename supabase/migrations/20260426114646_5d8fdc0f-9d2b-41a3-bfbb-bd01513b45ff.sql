
-- Avatars : retirer SELECT public anon
DROP POLICY IF EXISTS "Public can view avatars" ON storage.objects;

CREATE POLICY "avatars_authenticated_read"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'avatars');

-- ucm-exports : retirer la policy permissive d'upload
DROP POLICY IF EXISTS "Authenticated users can upload exports" ON storage.objects;
