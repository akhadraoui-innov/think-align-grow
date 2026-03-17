
-- Update challenge_templates RLS to also allow visibility via junction table
DROP POLICY IF EXISTS "Published toolkit templates are viewable" ON public.challenge_templates;
CREATE POLICY "Published toolkit templates are viewable" ON public.challenge_templates
  FOR SELECT TO authenticated USING (
    EXISTS (
      SELECT 1 FROM public.toolkits t WHERE t.id = challenge_templates.toolkit_id AND t.status = 'published'
    )
    OR EXISTS (
      SELECT 1 FROM public.challenge_template_toolkits ctt
      JOIN public.toolkits t ON t.id = ctt.toolkit_id
      WHERE ctt.template_id = challenge_templates.id AND t.status = 'published'
    )
  );

-- Update challenge_subjects RLS to also allow visibility via junction table
DROP POLICY IF EXISTS "Subjects viewable via template" ON public.challenge_subjects;
CREATE POLICY "Subjects viewable via template" ON public.challenge_subjects
  FOR SELECT TO authenticated USING (
    EXISTS (
      SELECT 1 FROM public.challenge_templates ct
      JOIN public.toolkits t ON t.id = ct.toolkit_id
      WHERE ct.id = challenge_subjects.template_id AND t.status = 'published'
    )
    OR EXISTS (
      SELECT 1 FROM public.challenge_templates ct
      JOIN public.challenge_template_toolkits ctt ON ctt.template_id = ct.id
      JOIN public.toolkits t ON t.id = ctt.toolkit_id
      WHERE ct.id = challenge_subjects.template_id AND t.status = 'published'
    )
  );

-- Update challenge_slots RLS to also allow visibility via junction table
DROP POLICY IF EXISTS "Slots viewable via subject" ON public.challenge_slots;
CREATE POLICY "Slots viewable via subject" ON public.challenge_slots
  FOR SELECT TO authenticated USING (
    EXISTS (
      SELECT 1 FROM public.challenge_subjects cs
      JOIN public.challenge_templates ct ON ct.id = cs.template_id
      JOIN public.toolkits t ON t.id = ct.toolkit_id
      WHERE cs.id = challenge_slots.subject_id AND t.status = 'published'
    )
    OR EXISTS (
      SELECT 1 FROM public.challenge_subjects cs
      JOIN public.challenge_templates ct ON ct.id = cs.template_id
      JOIN public.challenge_template_toolkits ctt ON ctt.template_id = ct.id
      JOIN public.toolkits t ON t.id = ctt.toolkit_id
      WHERE cs.id = challenge_slots.subject_id AND t.status = 'published'
    )
  );
