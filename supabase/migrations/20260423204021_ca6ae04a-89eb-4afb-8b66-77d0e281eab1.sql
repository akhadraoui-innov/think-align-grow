-- Notifications table
CREATE TABLE IF NOT EXISTS public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  organization_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE,
  type text NOT NULL,
  title text NOT NULL,
  body text,
  link text,
  severity text NOT NULL DEFAULT 'info' CHECK (severity IN ('info','success','warning','error')),
  read_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_unread
  ON public.notifications (user_id, created_at DESC) WHERE read_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_notifications_user_recent
  ON public.notifications (user_id, created_at DESC);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "users read own notifications" ON public.notifications;
CREATE POLICY "users read own notifications"
  ON public.notifications FOR SELECT TO authenticated
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "users update own notifications" ON public.notifications;
CREATE POLICY "users update own notifications"
  ON public.notifications FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "saas team read all notifications" ON public.notifications;
CREATE POLICY "saas team read all notifications"
  ON public.notifications FOR SELECT TO authenticated
  USING (public.is_saas_team(auth.uid()));

ALTER TABLE public.notifications REPLICA IDENTITY FULL;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'notifications'
  ) THEN
    EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications';
  END IF;
END$$;

CREATE OR REPLACE FUNCTION public.notify_user(
  _user_id uuid,
  _type text,
  _title text,
  _body text DEFAULT NULL,
  _link text DEFAULT NULL,
  _severity text DEFAULT 'info',
  _organization_id uuid DEFAULT NULL
) RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE _id uuid;
BEGIN
  INSERT INTO public.notifications(user_id, organization_id, type, title, body, link, severity)
  VALUES (_user_id, _organization_id, _type, _title, _body, _link, _severity)
  RETURNING id INTO _id;
  RETURN _id;
END;
$$;

CREATE OR REPLACE FUNCTION public.mark_notifications_read(_ids uuid[])
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE _count integer;
BEGIN
  UPDATE public.notifications
     SET read_at = now()
   WHERE id = ANY(_ids)
     AND user_id = auth.uid()
     AND read_at IS NULL;
  GET DIAGNOSTICS _count = ROW_COUNT;
  RETURN _count;
END;
$$;

CREATE OR REPLACE FUNCTION public.mark_all_notifications_read()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE _c integer;
BEGIN
  UPDATE public.notifications SET read_at = now()
   WHERE user_id = auth.uid() AND read_at IS NULL;
  GET DIAGNOSTICS _c = ROW_COUNT;
  RETURN _c;
END;
$$;

-- Triggers
CREATE OR REPLACE FUNCTION public.trg_notify_welcome()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM public.notify_user(
    NEW.id, 'welcome', 'Bienvenue sur GROWTHINNOV',
    'Découvrez vos parcours et commencez votre première session.',
    '/portal', 'success', NULL
  );
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS notify_welcome ON public.profiles;
CREATE TRIGGER notify_welcome
  AFTER INSERT ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.trg_notify_welcome();

CREATE OR REPLACE FUNCTION public.trg_notify_org_status()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE _msg text; _sev text; _type text;
BEGIN
  IF NEW.status IS DISTINCT FROM OLD.status THEN
    IF NEW.status = 'suspended' THEN
      _type := 'org.suspended';
      _msg := 'Votre organisation a été suspendue. Contactez le support.';
      _sev := 'error';
    ELSIF OLD.status = 'suspended' AND NEW.status = 'active' THEN
      _type := 'org.reactivated';
      _msg := 'Votre organisation a été réactivée.';
      _sev := 'success';
    ELSE
      RETURN NEW;
    END IF;

    INSERT INTO public.notifications(user_id, organization_id, type, title, body, link, severity)
    SELECT om.user_id, NEW.id, _type, NEW.name, _msg, '/portal', _sev
      FROM public.organization_members om
     WHERE om.organization_id = NEW.id;
  END IF;
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS notify_org_status ON public.organizations;
CREATE TRIGGER notify_org_status
  AFTER UPDATE ON public.organizations
  FOR EACH ROW EXECUTE FUNCTION public.trg_notify_org_status();

CREATE OR REPLACE FUNCTION public.trg_notify_certificate()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE _path_name text;
BEGIN
  SELECT name INTO _path_name FROM public.academy_paths WHERE id = NEW.path_id;
  PERFORM public.notify_user(
    NEW.user_id, 'certificate.earned', 'Certificat obtenu 🎓',
    COALESCE('Félicitations pour la réussite du parcours ' || _path_name, 'Votre certificat est disponible.'),
    '/portal/certificates/' || NEW.id::text, 'success', NULL
  );
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS notify_certificate ON public.academy_certificates;
CREATE TRIGGER notify_certificate
  AFTER INSERT ON public.academy_certificates
  FOR EACH ROW EXECUTE FUNCTION public.trg_notify_certificate();