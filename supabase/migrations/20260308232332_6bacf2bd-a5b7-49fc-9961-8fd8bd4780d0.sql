
-- Drop all restrictive policies and recreate as permissive

-- toolkits
DROP POLICY IF EXISTS "Published toolkits are viewable" ON public.toolkits;
CREATE POLICY "Published toolkits are viewable" ON public.toolkits FOR SELECT USING (status = 'published'::toolkit_status);

-- pillars
DROP POLICY IF EXISTS "Pillars are viewable" ON public.pillars;
CREATE POLICY "Pillars are viewable" ON public.pillars FOR SELECT USING (
  EXISTS (SELECT 1 FROM toolkits WHERE toolkits.id = pillars.toolkit_id AND toolkits.status = 'published'::toolkit_status)
);

-- cards
DROP POLICY IF EXISTS "Cards are viewable" ON public.cards;
CREATE POLICY "Cards are viewable" ON public.cards FOR SELECT USING (
  EXISTS (SELECT 1 FROM pillars p JOIN toolkits t ON t.id = p.toolkit_id WHERE p.id = cards.pillar_id AND t.status = 'published'::toolkit_status)
);

-- quiz_questions
DROP POLICY IF EXISTS "Quiz questions are viewable" ON public.quiz_questions;
CREATE POLICY "Quiz questions are viewable" ON public.quiz_questions FOR SELECT USING (
  EXISTS (SELECT 1 FROM pillars p JOIN toolkits t ON t.id = p.toolkit_id WHERE p.id = quiz_questions.pillar_id AND t.status = 'published'::toolkit_status)
);

-- game_plans
DROP POLICY IF EXISTS "Game plans are viewable" ON public.game_plans;
CREATE POLICY "Game plans are viewable" ON public.game_plans FOR SELECT USING (
  EXISTS (SELECT 1 FROM toolkits WHERE toolkits.id = game_plans.toolkit_id AND toolkits.status = 'published'::toolkit_status)
);

-- game_plan_steps
DROP POLICY IF EXISTS "Steps are viewable" ON public.game_plan_steps;
CREATE POLICY "Steps are viewable" ON public.game_plan_steps FOR SELECT USING (
  EXISTS (SELECT 1 FROM game_plans gp JOIN toolkits t ON t.id = gp.toolkit_id WHERE gp.id = game_plan_steps.game_plan_id AND t.status = 'published'::toolkit_status)
);
