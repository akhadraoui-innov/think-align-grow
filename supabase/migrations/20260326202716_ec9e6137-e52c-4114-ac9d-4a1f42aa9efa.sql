
ALTER TABLE public.academy_practices 
  ADD COLUMN IF NOT EXISTS practice_type text NOT NULL DEFAULT 'conversation',
  ADD COLUMN IF NOT EXISTS type_config jsonb NOT NULL DEFAULT '{}';

COMMENT ON COLUMN public.academy_practices.practice_type IS 'Mode type: conversation, prompt_challenge, negotiation, pitch, code_review, etc.';
COMMENT ON COLUMN public.academy_practices.type_config IS 'Mode-specific configuration (JSON). Schema varies by practice_type.';
