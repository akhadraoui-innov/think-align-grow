
CREATE OR REPLACE FUNCTION public.sync_observatory_asset()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  _asset_type text;
  _name text;
  _org_id uuid;
  _status text;
  _creator_id uuid;
  _mod_at timestamptz;
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
  
  -- Resolve creator: use created_by if available, fallback to auth.uid()
  _creator_id := COALESCE(NEW.created_by, auth.uid());
  
  -- Use real timestamps from source, not now()
  _mod_at := COALESCE(NEW.updated_at, NEW.created_at, now());

  INSERT INTO observatory_assets (asset_id, asset_type, name, organization_id, status, version_count, last_modified_at, last_modified_by, contributor_ids, contributor_count, created_at, snapshot)
  VALUES (NEW.id, _asset_type, _name, _org_id, _status,
    CASE WHEN TG_OP = 'INSERT' THEN 0 ELSE 1 END,
    _mod_at, _creator_id,
    CASE WHEN _creator_id IS NOT NULL THEN ARRAY[_creator_id] ELSE '{}'::uuid[] END,
    CASE WHEN _creator_id IS NOT NULL THEN 1 ELSE 0 END,
    COALESCE(NEW.created_at, now()),
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
    last_modified_at = COALESCE(NEW.updated_at, NEW.created_at, now()),
    last_modified_by = COALESCE(auth.uid(), observatory_assets.last_modified_by),
    snapshot = to_jsonb(NEW);

  RETURN NEW;
END;
$function$;
