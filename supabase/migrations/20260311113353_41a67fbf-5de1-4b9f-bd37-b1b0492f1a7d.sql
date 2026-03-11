
-- Add detailed fields to organizations
ALTER TABLE public.organizations
  ADD COLUMN IF NOT EXISTS sector text,
  ADD COLUMN IF NOT EXISTS group_name text,
  ADD COLUMN IF NOT EXISTS parent_organization_id uuid REFERENCES public.organizations(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS siret text,
  ADD COLUMN IF NOT EXISTS tva_number text,
  ADD COLUMN IF NOT EXISTS website text,
  ADD COLUMN IF NOT EXISTS email text,
  ADD COLUMN IF NOT EXISTS phone text,
  ADD COLUMN IF NOT EXISTS addresses jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS contacts jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS notes text;
