
ALTER TABLE academy_certificates ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'active';
ALTER TABLE academy_certificates ADD COLUMN IF NOT EXISTS revoked_at timestamptz;
ALTER TABLE academy_certificates ADD COLUMN IF NOT EXISTS revoked_reason text;
ALTER TABLE academy_certificates ADD COLUMN IF NOT EXISTS public_share_enabled boolean NOT NULL DEFAULT true;

CREATE TABLE IF NOT EXISTS academy_certificate_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  path_id uuid NOT NULL UNIQUE REFERENCES academy_paths(id) ON DELETE CASCADE,
  min_score integer NOT NULL DEFAULT 70,
  template_key text NOT NULL DEFAULT 'premium_gold',
  custom_title text,
  custom_signature text,
  webhook_url text,
  api_key_hash text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE academy_certificate_config ENABLE ROW LEVEL SECURITY;
CREATE POLICY "saas_manage_cert_config" ON academy_certificate_config FOR ALL TO authenticated USING (is_saas_team(auth.uid())) WITH CHECK (is_saas_team(auth.uid()));

CREATE POLICY "public_verify_cert" ON academy_certificates FOR SELECT TO anon USING (public_share_enabled = true);
