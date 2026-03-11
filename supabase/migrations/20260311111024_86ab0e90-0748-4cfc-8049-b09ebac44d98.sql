
-- 1. Extend app_role enum with 9 new values
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'super_admin';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'customer_lead';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'innovation_lead';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'performance_lead';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'product_actor';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'lead';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'facilitator';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'manager';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'guest';
