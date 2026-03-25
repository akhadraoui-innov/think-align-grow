
-- Extend capture_asset_version() to support paths, personae, campaigns
CREATE OR REPLACE FUNCTION public.capture_asset_version()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _asset_type text;
  _next_version integer;
  _snapshot jsonb;
  _summary text;
BEGIN
  -- Determine asset type from TG_TABLE_NAME
  CASE TG_TABLE_NAME
    WHEN 'academy_quizzes' THEN _asset_type := 'quiz';
    WHEN 'academy_exercises' THEN _asset_type := 'exercise';
    WHEN 'academy_practices' THEN _asset_type := 'practice';
    WHEN 'academy_paths' THEN _asset_type := 'path';
    WHEN 'academy_personae' THEN _asset_type := 'persona';
    WHEN 'academy_campaigns' THEN _asset_type := 'campaign';
    ELSE _asset_type := TG_TABLE_NAME;
  END CASE;

  -- Get next version number
  SELECT COALESCE(MAX(version_number), 0) + 1 INTO _next_version
  FROM academy_asset_versions
  WHERE asset_type = _asset_type AND asset_id = OLD.id;

  -- Store OLD row as snapshot
  _snapshot := to_jsonb(OLD);

  -- Build change summary from changed columns
  _summary := '';

  -- Common fields
  IF OLD.name IS DISTINCT FROM NEW.name THEN _summary := _summary || 'name, '; END IF;
  IF OLD.description IS DISTINCT FROM NEW.description THEN _summary := _summary || 'description, '; END IF;
  IF OLD.status IS DISTINCT FROM NEW.status THEN _summary := _summary || 'status, '; END IF;

  -- Asset-specific fields
  IF TG_TABLE_NAME = 'academy_quizzes' THEN
    IF OLD.title IS DISTINCT FROM NEW.title THEN _summary := _summary || 'title, '; END IF;
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
$$;

-- Create triggers for new tables
CREATE TRIGGER trg_version_path
  BEFORE UPDATE ON public.academy_paths
  FOR EACH ROW EXECUTE FUNCTION capture_asset_version();

CREATE TRIGGER trg_version_persona
  BEFORE UPDATE ON public.academy_personae
  FOR EACH ROW EXECUTE FUNCTION capture_asset_version();

CREATE TRIGGER trg_version_campaign
  BEFORE UPDATE ON public.academy_campaigns
  FOR EACH ROW EXECUTE FUNCTION capture_asset_version();
