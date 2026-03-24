
INSERT INTO storage.buckets (id, name, public)
VALUES ('academy-assets', 'academy-assets', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Anyone can view academy assets"
ON storage.objects FOR SELECT
USING (bucket_id = 'academy-assets');

CREATE POLICY "Authenticated users can upload academy assets"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'academy-assets');

CREATE POLICY "Authenticated users can update academy assets"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'academy-assets');
