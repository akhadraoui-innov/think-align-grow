ALTER TABLE public.toolkits ADD COLUMN IF NOT EXISTS illustration_style jsonb;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'cards'
  ) THEN
    EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE public.cards';
  END IF;
END$$;

ALTER TABLE public.cards REPLICA IDENTITY FULL;