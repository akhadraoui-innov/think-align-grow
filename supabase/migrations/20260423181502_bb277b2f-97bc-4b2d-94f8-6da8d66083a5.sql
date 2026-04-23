-- Dette tech: dédupliquer les triggers de versioning email_templates.
-- snapshot_email_template_version() est plus complet (incrémente version + ON CONFLICT DO NOTHING).
-- capture_email_template_version() faisait double emploi avec un snapshot moins fidèle.
DROP TRIGGER IF EXISTS trg_email_templates_version ON public.email_templates;
DROP FUNCTION IF EXISTS public.capture_email_template_version();