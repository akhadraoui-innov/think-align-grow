
-- Add new canvas item types
ALTER TYPE public.canvas_item_type ADD VALUE IF NOT EXISTS 'icon';
ALTER TYPE public.canvas_item_type ADD VALUE IF NOT EXISTS 'text';
