
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

  -- Tables with 'title': quizzes, exercises, practices
  -- Tables with 'name': paths, personae, campaigns
  IF TG_TABLE_NAME IN ('academy_quizzes', 'academy_exercises', 'academy_practices') THEN
    _name := NEW.title;
  ELSE
    _name := NEW.name;
  END IF;
  _name := COALESCE(_name, '');

  _org_id := NEW.organization_id;

  -- Not all tables have a status column (quizzes, exercises, practices don't)
  IF TG_TABLE_NAME IN ('academy_quizzes', 'academy_exercises', 'academy_practices') THEN
    _status := 'active';
  ELSE
    _status := COALESCE(NEW.status, 'active');
  END IF;

  -- Not all tables have created_by (quizzes, exercises, practices don't)
  IF TG_TABLE_NAME IN ('academy_quizzes', 'academy_exercises', 'academy_practices') THEN
    _creator_id := auth.uid();
  ELSE
    _creator_id := COALESCE(NEW.created_by, auth.uid());
  END IF;

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

CREATE OR REPLACE FUNCTION public.capture_asset_version()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  _asset_type text;
  _next_version integer;
  _snapshot jsonb;
  _summary text;
BEGIN
  CASE TG_TABLE_NAME
    WHEN 'academy_quizzes' THEN _asset_type := 'quiz';
    WHEN 'academy_exercises' THEN _asset_type := 'exercise';
    WHEN 'academy_practices' THEN _asset_type := 'practice';
    WHEN 'academy_paths' THEN _asset_type := 'path';
    WHEN 'academy_personae' THEN _asset_type := 'persona';
    WHEN 'academy_campaigns' THEN _asset_type := 'campaign';
    ELSE _asset_type := TG_TABLE_NAME;
  END CASE;

  SELECT COALESCE(MAX(version_number), 0) + 1 INTO _next_version
  FROM academy_asset_versions
  WHERE asset_type = _asset_type AND asset_id = OLD.id;

  _snapshot := to_jsonb(OLD);
  _summary := '';

  -- Common fields — only check if the table has them
  IF TG_TABLE_NAME IN ('academy_paths', 'academy_personae', 'academy_campaigns') THEN
    IF OLD.name IS DISTINCT FROM NEW.name THEN _summary := _summary || 'name, '; END IF;
  END IF;

  IF TG_TABLE_NAME NOT IN ('academy_quizzes', 'academy_exercises', 'academy_practices') THEN
    IF OLD.description IS DISTINCT FROM NEW.description THEN _summary := _summary || 'description, '; END IF;
    IF OLD.status IS DISTINCT FROM NEW.status THEN _summary := _summary || 'status, '; END IF;
  END IF;

  -- Asset-specific fields
  IF TG_TABLE_NAME = 'academy_quizzes' THEN
    IF OLD.title IS DISTINCT FROM NEW.title THEN _summary := _summary || 'title, '; END IF;
    IF OLD.description IS DISTINCT FROM NEW.description THEN _summary := _summary || 'description, '; END IF;
    IF OLD.tags IS DISTINCT FROM NEW.tags THEN _summary := _summary || 'tags, '; END IF;
    IF OLD.passing_score IS DISTINCT FROM NEW.passing_score THEN _summary := _summary || 'passing_score, '; END IF;
  ELSIF TG_TABLE_NAME = 'academy_exercises' THEN
    IF OLD.title IS DISTINCT FROM NEW.title THEN _summary := _summary || 'title, '; END IF;
    IF OLD.tags IS DISTINCT FROM NEW.tags THEN _summary := _summary || 'tags, '; END IF;
    IF OLD.instructions IS DISTINCT FROM NEW.instructions THEN _summary := _summary || 'instructions, '; END IF;
  ELSIF TG_TABLE_NAME = 'academy_practices' THEN
    IF OLD.title IS DISTINCT FROM NEW.title THEN _summary := _summary || 'title, '; END IF;
    IF OLD.tags IS DISTINCT FROM NEW.tags THEN _summary := _summary || 'tags, '; END IF;
    IF OLD.scenario IS DISTINCT FROM NEW.scenario THEN _summary := _summary || 'scenario, '; END IF;
    IF OLD.system_prompt IS DISTINCT FROM NEW.system_prompt THEN _summary := _summary || 'system_prompt, '; END IF;
    IF OLD.difficulty IS DISTINCT FROM NEW.difficulty THEN _summary := _summary || 'difficulty, '; END IF;
  ELSIF TG_TABLE_NAME = 'academy_paths' THEN
    IF OLD.difficulty IS DISTINCT FROM NEW.difficulty THEN _summary := _summary || 'difficulty, '; END IF;
    IF OLD.estimated_hours IS DISTINCT FROM NEW.estimated_hours THEN _summary := _summary || 'estimated_hours, '; END IF;
    IF OLD.tags IS DISTINCT FROM NEW.tags THEN _summary := _summary || 'tags, '; END IF;
    IF OLD.persona_id IS DISTINCT FROM NEW.persona_id THEN _summary := _summary || 'persona_id, '; END IF;
    IF OLD.function_id IS DISTINCT FROM NEW.function_id THEN _summary := _summary || 'function_id, '; END IF;
    IF OLD.certificate_enabled IS DISTINCT FROM NEW.certificate_enabled THEN _summary := _summary || 'certificate_enabled, '; END IF;
    IF OLD.organization_id IS DISTINCT FROM NEW.organization_id THEN _summary := _summary || 'organization_id, '; END IF;
  ELSIF TG_TABLE_NAME = 'academy_personae' THEN
    IF OLD.characteristics IS DISTINCT FROM NEW.characteristics THEN _summary := _summary || 'characteristics, '; END IF;
    IF OLD.tags IS DISTINCT FROM NEW.tags THEN _summary := _summary || 'tags, '; END IF;
    IF OLD.organization_id IS DISTINCT FROM NEW.organization_id THEN _summary := _summary || 'organization_id, '; END IF;
    IF OLD.parent_persona_id IS DISTINCT FROM NEW.parent_persona_id THEN _summary := _summary || 'parent_persona_id, '; END IF;
    IF OLD.avatar_url IS DISTINCT FROM NEW.avatar_url THEN _summary := _summary || 'avatar_url, '; END IF;
  ELSIF TG_TABLE_NAME = 'academy_campaigns' THEN
    IF OLD.starts_at IS DISTINCT FROM NEW.starts_at THEN _summary := _summary || 'starts_at, '; END IF;
    IF OLD.ends_at IS DISTINCT FROM NEW.ends_at THEN _summary := _summary || 'ends_at, '; END IF;
    IF OLD.reminder_config IS DISTINCT FROM NEW.reminder_config THEN _summary := _summary || 'reminder_config, '; END IF;
    IF OLD.path_id IS DISTINCT FROM NEW.path_id THEN _summary := _summary || 'path_id, '; END IF;
    IF OLD.organization_id IS DISTINCT FROM NEW.organization_id THEN _summary := _summary || 'organization_id, '; END IF;
  END IF;

  _summary := rtrim(_summary, ', ');
  IF _summary = '' THEN _summary := 'minor changes'; END IF;

  INSERT INTO academy_asset_versions (asset_type, asset_id, version_number, snapshot, changed_by, change_summary)
  VALUES (_asset_type, OLD.id, _next_version, _snapshot, auth.uid(), _summary);

  RETURN NEW;
END;
$function$;
