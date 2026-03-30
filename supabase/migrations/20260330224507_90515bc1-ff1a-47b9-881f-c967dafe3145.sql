ALTER TABLE academy_paths ADD COLUMN IF NOT EXISTS guide_document jsonb DEFAULT null;

CREATE TABLE IF NOT EXISTS academy_document_sends (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  path_id uuid NOT NULL REFERENCES academy_paths(id) ON DELETE CASCADE,
  document_version integer DEFAULT 1,
  sent_at timestamptz DEFAULT now(),
  email text
);
ALTER TABLE academy_document_sends ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users see own sends" ON academy_document_sends FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Users insert own sends" ON academy_document_sends FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());