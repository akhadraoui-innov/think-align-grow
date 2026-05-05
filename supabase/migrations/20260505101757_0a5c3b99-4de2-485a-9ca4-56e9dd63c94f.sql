ALTER TABLE public.toolkits ADD COLUMN IF NOT EXISTS cover_image_url text;
CREATE INDEX IF NOT EXISTS toolkits_status_idx ON public.toolkits(status);

CREATE OR REPLACE FUNCTION public.get_pillar_counts_per_toolkit()
RETURNS TABLE (toolkit_id uuid, count int)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT toolkit_id, count(*)::int FROM public.pillars GROUP BY toolkit_id
$$;