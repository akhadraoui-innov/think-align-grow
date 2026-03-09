
-- =====================================================
-- 1. FIX RLS: Drop RESTRICTIVE policies and recreate as PERMISSIVE (default)
-- =====================================================

ALTER TABLE public.toolkits DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.toolkits ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Published toolkits are viewable" ON public.toolkits;
CREATE POLICY "Published toolkits are viewable" ON public.toolkits
  FOR SELECT USING (status = 'published'::toolkit_status);

ALTER TABLE public.pillars DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.pillars ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Pillars are viewable" ON public.pillars;
CREATE POLICY "Pillars are viewable" ON public.pillars
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.toolkits WHERE toolkits.id = pillars.toolkit_id AND toolkits.status = 'published'::toolkit_status)
  );

ALTER TABLE public.cards DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.cards ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Cards are viewable" ON public.cards;
CREATE POLICY "Cards are viewable" ON public.cards
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.pillars p
      JOIN public.toolkits t ON t.id = p.toolkit_id
      WHERE p.id = cards.pillar_id AND t.status = 'published'::toolkit_status
    )
  );

ALTER TABLE public.quiz_questions DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_questions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Quiz questions are viewable" ON public.quiz_questions;
CREATE POLICY "Quiz questions are viewable" ON public.quiz_questions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.pillars p
      JOIN public.toolkits t ON t.id = p.toolkit_id
      WHERE p.id = quiz_questions.pillar_id AND t.status = 'published'::toolkit_status
    )
  );

ALTER TABLE public.game_plans DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.game_plans ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Game plans are viewable" ON public.game_plans;
CREATE POLICY "Game plans are viewable" ON public.game_plans
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.toolkits WHERE toolkits.id = game_plans.toolkit_id AND toolkits.status = 'published'::toolkit_status)
  );

ALTER TABLE public.game_plan_steps DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.game_plan_steps ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Steps are viewable" ON public.game_plan_steps;
CREATE POLICY "Steps are viewable" ON public.game_plan_steps
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.game_plans gp
      JOIN public.toolkits t ON t.id = gp.toolkit_id
      WHERE gp.id = game_plan_steps.game_plan_id AND t.status = 'published'::toolkit_status
    )
  );

-- =====================================================
-- 2. CREDITS SYSTEM
-- =====================================================

CREATE TABLE IF NOT EXISTS public.user_credits (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  balance INTEGER NOT NULL DEFAULT 0,
  lifetime_earned INTEGER NOT NULL DEFAULT 0,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.user_credits ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage own credits" ON public.user_credits;
CREATE POLICY "Users manage own credits" ON public.user_credits
  FOR ALL USING (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS public.credit_transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  amount INTEGER NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('earned', 'spent', 'purchased')),
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.credit_transactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users view own transactions" ON public.credit_transactions;
CREATE POLICY "Users view own transactions" ON public.credit_transactions
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "System inserts transactions" ON public.credit_transactions;
CREATE POLICY "System inserts transactions" ON public.credit_transactions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- =====================================================
-- 3. UPDATED handle_new_user with credits trigger
-- =====================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, display_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)))
  ON CONFLICT DO NOTHING;

  INSERT INTO public.user_credits (user_id, balance, lifetime_earned)
  VALUES (NEW.id, 10, 10)
  ON CONFLICT (user_id) DO NOTHING;

  INSERT INTO public.credit_transactions (user_id, amount, type, description)
  VALUES (NEW.id, 10, 'earned', 'Crédits de bienvenue');

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
