
-- 1. Create observatory_assets table
CREATE TABLE public.observatory_assets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_id uuid NOT NULL,
  asset_type text NOT NULL,
  name text NOT NULL DEFAULT '',
  organization_id uuid REFERENCES public.organizations(id),
  status text DEFAULT 'draft',
  version_count integer NOT NULL DEFAULT 0,
  contributor_count integer NOT NULL DEFAULT 0,
  contributor_ids uuid[] NOT NULL DEFAULT '{}',
  last_modified_at timestamptz NOT NULL DEFAULT now(),
  last_modified_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  snapshot jsonb NOT NULL DEFAULT '{}',
  UNIQUE(asset_type, asset_id)
);

ALTER TABLE public.observatory_assets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "saas_manage_observatory" ON public.observatory_assets
  FOR ALL TO authenticated
  USING (is_saas_team(auth.uid()))
  WITH CHECK (is_saas_team(auth.uid()));

-- 2. Sync function
CREATE OR REPLACE FUNCTION public.sync_observatory_asset()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $$
DECLARE
  _asset_type text;
  _name text;
  _org_id uuid;
  _status text;
BEGIN
  CASE TG_TABLE_NAME
    WHEN 'academy_paths' THEN _asset_type := 'path';
    WHEN 'academy_quizzes' THEN _asset_type := 'quiz';
    WHEN 'academy_exercises' THEN _asset_type := 'exercise';
    WHEN 'academy_practices' THEN _asset_type := 'practice';
    WHEN 'academy_personae' THEN _asset_type := 'persona';
    WHEN 'academy_campaigns' THEN _asset_type := 'campaign';
    ELSE _asset_type := TG_TABLE_NAME;
  END CASE;

  _name := COALESCE(NEW.name, NEW.title, '');
  _org_id := NEW.organization_id;
  _status := COALESCE(NEW.status, 'active');

  INSERT INTO observatory_assets (asset_id, asset_type, name, organization_id, status, version_count, last_modified_at, last_modified_by, created_at, snapshot)
  VALUES (NEW.id, _asset_type, _name, _org_id, _status,
    CASE WHEN TG_OP = 'INSERT' THEN 0 ELSE 1 END,
    now(), auth.uid(),
    CASE WHEN TG_OP = 'INSERT' THEN NEW.created_at ELSE now() END,
    to_jsonb(NEW))
  ON CONFLICT (asset_type, asset_id) DO UPDATE SET
    name = EXCLUDED.name,
    organization_id = EXCLUDED.organization_id,
    status = EXCLUDED.status,
    version_count = observatory_assets.version_count + 1,
    contributor_ids = CASE
      WHEN auth.uid() = ANY(observatory_assets.contributor_ids) THEN observatory_assets.contributor_ids
      WHEN auth.uid() IS NULL THEN observatory_assets.contributor_ids
      ELSE observatory_assets.contributor_ids || auth.uid()
    END,
    contributor_count = CASE
      WHEN auth.uid() = ANY(observatory_assets.contributor_ids) OR auth.uid() IS NULL THEN observatory_assets.contributor_count
      ELSE observatory_assets.contributor_count + 1
    END,
    last_modified_at = now(),
    last_modified_by = auth.uid(),
    snapshot = to_jsonb(NEW);

  RETURN NEW;
END;
$$;

-- 3. Observatory sync triggers (AFTER INSERT OR UPDATE)
CREATE TRIGGER trg_obs_paths AFTER INSERT OR UPDATE ON academy_paths
  FOR EACH ROW EXECUTE FUNCTION sync_observatory_asset();
CREATE TRIGGER trg_obs_quizzes AFTER INSERT OR UPDATE ON academy_quizzes
  FOR EACH ROW EXECUTE FUNCTION sync_observatory_asset();
CREATE TRIGGER trg_obs_exercises AFTER INSERT OR UPDATE ON academy_exercises
  FOR EACH ROW EXECUTE FUNCTION sync_observatory_asset();
CREATE TRIGGER trg_obs_practices AFTER INSERT OR UPDATE ON academy_practices
  FOR EACH ROW EXECUTE FUNCTION sync_observatory_asset();
CREATE TRIGGER trg_obs_personae AFTER INSERT OR UPDATE ON academy_personae
  FOR EACH ROW EXECUTE FUNCTION sync_observatory_asset();
CREATE TRIGGER trg_obs_campaigns AFTER INSERT OR UPDATE ON academy_campaigns
  FOR EACH ROW EXECUTE FUNCTION sync_observatory_asset();

-- 4. Versioning triggers (BEFORE UPDATE) - attach existing function
CREATE TRIGGER trg_version_paths BEFORE UPDATE ON academy_paths
  FOR EACH ROW EXECUTE FUNCTION capture_asset_version();
CREATE TRIGGER trg_version_quizzes BEFORE UPDATE ON academy_quizzes
  FOR EACH ROW EXECUTE FUNCTION capture_asset_version();
CREATE TRIGGER trg_version_exercises BEFORE UPDATE ON academy_exercises
  FOR EACH ROW EXECUTE FUNCTION capture_asset_version();
CREATE TRIGGER trg_version_practices BEFORE UPDATE ON academy_practices
  FOR EACH ROW EXECUTE FUNCTION capture_asset_version();
CREATE TRIGGER trg_version_personae BEFORE UPDATE ON academy_personae
  FOR EACH ROW EXECUTE FUNCTION capture_asset_version();
CREATE TRIGGER trg_version_campaigns BEFORE UPDATE ON academy_campaigns
  FOR EACH ROW EXECUTE FUNCTION capture_asset_version();

-- 5. Seed existing assets
INSERT INTO observatory_assets (asset_id, asset_type, name, organization_id, status, version_count, created_at, snapshot)
SELECT id, 'path', name, organization_id, status, 0, created_at, to_jsonb(p) FROM academy_paths p
UNION ALL
SELECT id, 'quiz', title, organization_id, 'active', 0, created_at, to_jsonb(q) FROM academy_quizzes q
UNION ALL
SELECT id, 'exercise', title, organization_id, 'active', 0, created_at, to_jsonb(e) FROM academy_exercises e
UNION ALL
SELECT id, 'practice', title, organization_id, 'active', 0, created_at, to_jsonb(pr) FROM academy_practices pr
UNION ALL
SELECT id, 'persona', name, organization_id, status, 0, created_at, to_jsonb(pe) FROM academy_personae pe
UNION ALL
SELECT id, 'campaign', name, organization_id, status, 0, created_at, to_jsonb(c) FROM academy_campaigns c
ON CONFLICT DO NOTHING;
