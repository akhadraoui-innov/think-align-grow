
REVOKE EXECUTE ON FUNCTION public.try_acquire_artifact_lock(uuid) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.release_artifact_lock(uuid) FROM anon, public;
GRANT EXECUTE ON FUNCTION public.try_acquire_artifact_lock(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.release_artifact_lock(uuid) TO authenticated;

-- Replace overly permissive SELECT with one that does not allow listing
DROP POLICY IF EXISTS "Public read challenge-images" ON storage.objects;
CREATE POLICY "Public read challenge-images files"
ON storage.objects FOR SELECT TO anon, authenticated
USING (bucket_id = 'challenge-images' AND name IS NOT NULL);
