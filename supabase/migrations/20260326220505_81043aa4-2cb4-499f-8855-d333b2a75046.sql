
-- Make module_id nullable for standalone practices
ALTER TABLE public.academy_practices ALTER COLUMN module_id DROP NOT NULL;

-- Add ai_assistance_level column
ALTER TABLE public.academy_practices ADD COLUMN ai_assistance_level text NOT NULL DEFAULT 'guided';

-- Update RLS: allow viewing standalone practices (module_id IS NULL) for authenticated users
CREATE POLICY "view_standalone_practices" ON public.academy_practices
  FOR SELECT TO authenticated
  USING (module_id IS NULL);
