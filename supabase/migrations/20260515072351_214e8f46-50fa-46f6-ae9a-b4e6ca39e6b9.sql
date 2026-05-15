
ALTER TABLE public.cards
  ADD COLUMN IF NOT EXISTS image_attempts INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS image_last_attempt_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS image_error TEXT;

CREATE INDEX IF NOT EXISTS idx_cards_image_inflight
  ON public.cards (image_last_attempt_at)
  WHERE image_status IN ('queued','generating');
