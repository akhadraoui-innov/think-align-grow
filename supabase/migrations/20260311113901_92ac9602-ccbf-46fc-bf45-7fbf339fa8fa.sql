
-- Add platform owner flag (only one org can be the SaaS platform owner)
ALTER TABLE public.organizations
  ADD COLUMN IF NOT EXISTS is_platform_owner boolean NOT NULL DEFAULT false;

-- Create a partial unique index so only ONE org can be platform owner
CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_platform_owner
  ON public.organizations (is_platform_owner) WHERE is_platform_owner = true;
