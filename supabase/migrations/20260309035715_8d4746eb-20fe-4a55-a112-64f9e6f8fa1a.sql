
-- Create enum for canvas item types
CREATE TYPE public.canvas_item_type AS ENUM ('card', 'sticky', 'group', 'arrow');

-- Create workshop_canvas_items table
CREATE TABLE public.workshop_canvas_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  workshop_id UUID NOT NULL REFERENCES public.workshops(id) ON DELETE CASCADE,
  type canvas_item_type NOT NULL,
  card_id UUID REFERENCES public.cards(id) ON DELETE SET NULL,
  x DOUBLE PRECISION NOT NULL DEFAULT 0,
  y DOUBLE PRECISION NOT NULL DEFAULT 0,
  width DOUBLE PRECISION,
  height DOUBLE PRECISION,
  content JSONB NOT NULL DEFAULT '{}'::jsonb,
  color TEXT,
  created_by UUID NOT NULL,
  from_item_id UUID REFERENCES public.workshop_canvas_items(id) ON DELETE CASCADE,
  to_item_id UUID REFERENCES public.workshop_canvas_items(id) ON DELETE CASCADE,
  parent_group_id UUID REFERENCES public.workshop_canvas_items(id) ON DELETE SET NULL,
  z_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create indexes
CREATE INDEX idx_canvas_items_workshop ON public.workshop_canvas_items(workshop_id);
CREATE INDEX idx_canvas_items_type ON public.workshop_canvas_items(workshop_id, type);
CREATE INDEX idx_canvas_items_parent ON public.workshop_canvas_items(parent_group_id);

-- Enable RLS
ALTER TABLE public.workshop_canvas_items ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Participants can view canvas items"
  ON public.workshop_canvas_items FOR SELECT
  USING (public.is_workshop_participant(workshop_id, auth.uid()));

CREATE POLICY "Participants can create canvas items"
  ON public.workshop_canvas_items FOR INSERT
  WITH CHECK (public.is_workshop_participant(workshop_id, auth.uid()) AND auth.uid() = created_by);

CREATE POLICY "Participants can update canvas items"
  ON public.workshop_canvas_items FOR UPDATE
  USING (public.is_workshop_participant(workshop_id, auth.uid()));

CREATE POLICY "Host can delete canvas items"
  ON public.workshop_canvas_items FOR DELETE
  USING (public.is_workshop_host(workshop_id, auth.uid()) OR auth.uid() = created_by);

-- Trigger for updated_at
CREATE TRIGGER update_canvas_items_updated_at
  BEFORE UPDATE ON public.workshop_canvas_items
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.workshop_canvas_items;

-- Create workshop_comments table
CREATE TABLE public.workshop_comments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  workshop_id UUID NOT NULL REFERENCES public.workshops(id) ON DELETE CASCADE,
  canvas_item_id UUID NOT NULL REFERENCES public.workshop_canvas_items(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_comments_item ON public.workshop_comments(canvas_item_id);
CREATE INDEX idx_comments_workshop ON public.workshop_comments(workshop_id);

ALTER TABLE public.workshop_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Participants can view comments"
  ON public.workshop_comments FOR SELECT
  USING (public.is_workshop_participant(workshop_id, auth.uid()));

CREATE POLICY "Participants can create comments"
  ON public.workshop_comments FOR INSERT
  WITH CHECK (public.is_workshop_participant(workshop_id, auth.uid()) AND auth.uid() = user_id);

CREATE POLICY "Users can delete own comments"
  ON public.workshop_comments FOR DELETE
  USING (auth.uid() = user_id);

ALTER PUBLICATION supabase_realtime ADD TABLE public.workshop_comments;
