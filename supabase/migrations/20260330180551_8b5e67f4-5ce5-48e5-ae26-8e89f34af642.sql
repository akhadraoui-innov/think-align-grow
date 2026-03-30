-- Allow users to insert their own certificates
CREATE POLICY "users_insert_own_certs" ON public.academy_certificates
FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);
