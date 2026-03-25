
-- Table to store asset version snapshots
CREATE TABLE public.academy_asset_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_type text NOT NULL, -- 'quiz', 'exercise', 'practice'
  asset_id uuid NOT NULL,
  version_number integer NOT NULL DEFAULT 1,
  snapshot jsonb NOT NULL DEFAULT '{}',
  changed_by uuid,
  change_summary text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_asset_versions_lookup ON public.academy_asset_versions (asset_type, asset_id, created_at DESC);

ALTER TABLE public.academy_asset_versions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "saas_manage_versions" ON public.academy_asset_versions
  FOR ALL TO authenticated
  USING (is_saas_team(auth.uid()))
  WITH CHECK (is_saas_team(auth.uid()));

-- Trigger function to capture snapshots on update
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
  IF OLD.title IS DISTINCT FROM NEW.title THEN _summary := _summary || 'title, '; END IF;
  IF OLD.tags IS DISTINCT FROM NEW.tags THEN _summary := _summary || 'tags, '; END IF;
  IF TG_TABLE_NAME = 'academy_quizzes' THEN
    IF OLD.description IS DISTINCT FROM NEW.description THEN _summary := _summary || 'description, '; END IF;
    IF OLD.passing_score IS DISTINCT FROM NEW.passing_score THEN _summary := _summary || 'passing_score, '; END IF;
  ELSIF TG_TABLE_NAME = 'academy_exercises' THEN
    IF OLD.instructions IS DISTINCT FROM NEW.instructions THEN _summary := _summary || 'instructions, '; END IF;
  ELSIF TG_TABLE_NAME = 'academy_practices' THEN
    IF OLD.scenario IS DISTINCT FROM NEW.scenario THEN _summary := _summary || 'scenario, '; END IF;
    IF OLD.system_prompt IS DISTINCT FROM NEW.system_prompt THEN _summary := _summary || 'system_prompt, '; END IF;
    IF OLD.difficulty IS DISTINCT FROM NEW.difficulty THEN _summary := _summary || 'difficulty, '; END IF;
  END IF;
  _summary := rtrim(_summary, ', ');
  IF _summary = '' THEN _summary := 'minor changes'; END IF;

  INSERT INTO academy_asset_versions (asset_type, asset_id, version_number, snapshot, changed_by, change_summary)
  VALUES (_asset_type, OLD.id, _next_version, _snapshot, auth.uid(), _summary);

  RETURN NEW;
END;
$$;

-- Attach triggers
CREATE TRIGGER trg_version_quiz
  BEFORE UPDATE ON public.academy_quizzes
  FOR EACH ROW EXECUTE FUNCTION capture_asset_version();

CREATE TRIGGER trg_version_exercise
  BEFORE UPDATE ON public.academy_exercises
  FOR EACH ROW EXECUTE FUNCTION capture_asset_version();

CREATE TRIGGER trg_version_practice
  BEFORE UPDATE ON public.academy_practices
  FOR EACH ROW EXECUTE FUNCTION capture_asset_version();
