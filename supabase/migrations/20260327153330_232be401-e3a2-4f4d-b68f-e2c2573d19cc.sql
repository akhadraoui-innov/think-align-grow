ALTER TABLE public.academy_practice_sessions ALTER COLUMN practice_id DROP NOT NULL;
DROP INDEX IF EXISTS idx_practice_sessions_practice;
CREATE INDEX idx_practice_sessions_practice ON public.academy_practice_sessions (practice_id) WHERE practice_id IS NOT NULL;