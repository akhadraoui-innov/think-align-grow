
-- ══════════════════════════════════════════════════════════
-- Permission registry tables (100% DB-driven)
-- ══════════════════════════════════════════════════════════

-- 1. permission_domains — functional groups
CREATE TABLE public.permission_domains (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text UNIQUE NOT NULL,
  label text NOT NULL,
  icon text NOT NULL DEFAULT 'Layers',
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.permission_domains ENABLE ROW LEVEL SECURITY;

CREATE POLICY "authenticated_read_domains" ON public.permission_domains
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "super_admin_manage_domains" ON public.permission_domains
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'super_admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'super_admin'::app_role));

-- 2. permission_definitions — individual permissions
CREATE TABLE public.permission_definitions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text UNIQUE NOT NULL,
  label text NOT NULL,
  description text NOT NULL DEFAULT '',
  domain_key text NOT NULL REFERENCES public.permission_domains(key) ON DELETE CASCADE,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.permission_definitions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "authenticated_read_definitions" ON public.permission_definitions
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "super_admin_manage_definitions" ON public.permission_definitions
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'super_admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'super_admin'::app_role));

-- ══════════════════════════════════════════════════════════
-- SEED: 16 domains
-- ══════════════════════════════════════════════════════════

INSERT INTO public.permission_domains (key, label, icon, sort_order) VALUES
  ('admin.dashboard',        'Dashboard Admin',        'LayoutDashboard', 1),
  ('admin.organizations',    'Organisations',          'Building2',       2),
  ('admin.users',            'Utilisateurs',           'Users',           3),
  ('admin.toolkits',         'Toolkits',               'Layers',          4),
  ('admin.workshops',        'Workshops',              'Presentation',    5),
  ('admin.design_innovation','Design Innovation',      'Lightbulb',       6),
  ('admin.billing',          'Crédits & Abonnements',  'CreditCard',      7),
  ('admin.logs',             'Logs d''activité',       'ScrollText',      8),
  ('admin.settings',         'Paramètres',             'Settings',        9),
  ('app.explore',            'Explorer',               'Compass',         10),
  ('app.plans',              'Plans de jeu',           'Map',             11),
  ('app.lab',                'Lab / Quiz',             'Gamepad2',        12),
  ('app.ai',                 'Assistant IA',           'Sparkles',        13),
  ('app.workshop',           'Workshop',               'Presentation',    14),
  ('app.challenge',          'Design Innovation',      'Lightbulb',       15),
  ('app.profile',            'Profil',                 'User',            16);

-- ══════════════════════════════════════════════════════════
-- SEED: 64 permission definitions
-- ══════════════════════════════════════════════════════════

INSERT INTO public.permission_definitions (key, label, description, domain_key, sort_order) VALUES
  -- admin.dashboard (3)
  ('admin.dashboard.view',   'Voir le dashboard',    'Accès à la vue d''ensemble de la plateforme',           'admin.dashboard', 1),
  ('admin.dashboard.kpis',   'Voir les KPIs',        'Métriques clés : utilisateurs, toolkits, workshops…',   'admin.dashboard', 2),
  ('admin.dashboard.alerts', 'Voir les alertes',     'Alertes expiration abonnements, crédits faibles…',      'admin.dashboard', 3),

  -- admin.organizations (8)
  ('admin.orgs.view',          'Voir les organisations',     'Lister et consulter toutes les organisations',                  'admin.organizations', 1),
  ('admin.orgs.create',        'Créer une organisation',     'Ajouter de nouvelles organisations à la plateforme',            'admin.organizations', 2),
  ('admin.orgs.edit',          'Modifier une organisation',  'Éditer les infos, logo, couleur, contacts',                     'admin.organizations', 3),
  ('admin.orgs.delete',        'Supprimer une organisation', 'Supprimer définitivement une organisation',                     'admin.organizations', 4),
  ('admin.orgs.members',       'Gérer les membres',          'Ajouter/retirer des membres, changer leurs rôles org',          'admin.organizations', 5),
  ('admin.orgs.teams',         'Gérer les équipes',          'Créer/modifier les équipes et affecter des membres',            'admin.organizations', 6),
  ('admin.orgs.toolkits',      'Gérer l''accès toolkits',    'Activer/désactiver des toolkits pour une organisation',         'admin.organizations', 7),
  ('admin.orgs.subscriptions', 'Gérer les abonnements',      'Créer et modifier les abonnements d''une organisation',         'admin.organizations', 8),

  -- admin.users (6)
  ('admin.users.view',     'Voir les utilisateurs',     'Lister et consulter tous les profils utilisateurs',   'admin.users', 1),
  ('admin.users.edit',     'Modifier un profil',        'Éditer les informations de profil d''un utilisateur', 'admin.users', 2),
  ('admin.users.roles',    'Gérer les rôles',           'Attribuer ou retirer des rôles plateforme',           'admin.users', 3),
  ('admin.users.credits',  'Gérer les crédits',         'Ajouter/retirer des crédits à un utilisateur',        'admin.users', 4),
  ('admin.users.activity', 'Voir l''activité',          'Consulter les logs d''activité d''un utilisateur',    'admin.users', 5),
  ('admin.users.orgs',     'Gérer les organisations',   'Ajouter/retirer un utilisateur d''organisations',     'admin.users', 6),

  -- admin.toolkits (12)
  ('admin.toolkits.view',        'Voir les toolkits',     'Lister et consulter tous les toolkits (drafts inclus)',             'admin.toolkits', 1),
  ('admin.toolkits.create',      'Créer un toolkit',      'Ajouter un nouveau toolkit à la plateforme',                        'admin.toolkits', 2),
  ('admin.toolkits.edit',        'Modifier un toolkit',   'Éditer les infos, tags, pricing, nomenclature',                     'admin.toolkits', 3),
  ('admin.toolkits.publish',     'Publier / Archiver',    'Changer le statut d''un toolkit (draft → published → archived)',    'admin.toolkits', 4),
  ('admin.toolkits.delete',      'Supprimer un toolkit',  'Supprimer définitivement un toolkit et ses données',                'admin.toolkits', 5),
  ('admin.toolkits.pillars',     'Gérer les piliers',     'Créer, modifier, réorganiser les piliers d''un toolkit',            'admin.toolkits', 6),
  ('admin.toolkits.cards',       'Gérer les cartes',      'Créer, éditer, supprimer les cartes de chaque pilier',              'admin.toolkits', 7),
  ('admin.toolkits.challenges',  'Gérer les challenges',  'Créer et configurer les templates de challenges',                   'admin.toolkits', 8),
  ('admin.toolkits.gameplans',   'Gérer les game plans',  'Configurer les parcours guidés et leurs étapes',                    'admin.toolkits', 9),
  ('admin.toolkits.quiz',        'Gérer les quiz',        'Créer et éditer les questions de diagnostic',                       'admin.toolkits', 10),
  ('admin.toolkits.import',      'Importer des cartes',   'Import en masse depuis un fichier CSV/JSON',                        'admin.toolkits', 11),
  ('admin.toolkits.ai_generate', 'Générer par IA',        'Utiliser l''IA pour générer/raffiner un toolkit',                   'admin.toolkits', 12),

  -- admin.workshops (4)
  ('admin.workshops.view',         'Voir les workshops',     'Lister tous les workshops de la plateforme',              'admin.workshops', 1),
  ('admin.workshops.manage',       'Gérer les workshops',    'Modifier, supprimer ou forcer le statut d''un workshop',  'admin.workshops', 2),
  ('admin.workshops.participants', 'Voir les participants',  'Consulter les participants de chaque workshop',           'admin.workshops', 3),
  ('admin.workshops.canvas',       'Voir les canvas',        'Consulter le contenu des canvas de workshop',             'admin.workshops', 4),

  -- admin.design_innovation (3)
  ('admin.challenges.view',    'Voir les challenges',       'Lister toutes les sessions de Design Innovation',     'admin.design_innovation', 1),
  ('admin.challenges.manage',  'Gérer les challenges',      'Modifier ou supprimer des sessions de challenge',     'admin.design_innovation', 2),
  ('admin.challenges.analyze', 'Déclencher une analyse',    'Lancer l''analyse IA d''une session de challenge',    'admin.design_innovation', 3),

  -- admin.billing (4)
  ('admin.billing.view',          'Voir la facturation',      'Consulter les plans, abonnements et transactions',                  'admin.billing', 1),
  ('admin.billing.plans',         'Gérer les plans',          'Créer et modifier les plans d''abonnement',                         'admin.billing', 2),
  ('admin.billing.subscriptions', 'Gérer les abonnements',    'Attribuer et modifier les abonnements des organisations',           'admin.billing', 3),
  ('admin.billing.credits',       'Gérer les crédits',        'Ajuster les balances de crédits globalement',                       'admin.billing', 4),

  -- admin.logs (2)
  ('admin.logs.view',   'Voir les logs',     'Consulter tous les logs d''activité de la plateforme', 'admin.logs', 1),
  ('admin.logs.export', 'Exporter les logs', 'Télécharger les logs en CSV/JSON',                    'admin.logs', 2),

  -- admin.settings (5)
  ('admin.settings.ai',       'Configuration IA',        'Configurer le fournisseur, modèles, température, tokens',  'admin.settings', 1),
  ('admin.settings.providers','Fournisseurs IA',         'Ajouter et configurer les fournisseurs d''IA',             'admin.settings', 2),
  ('admin.settings.prompts',  'Prompts par défaut',      'Consulter et surcharger les prompts système',              'admin.settings', 3),
  ('admin.settings.roles',    'Gestion des rôles',       'Voir la matrice rôles/permissions et les attributions',    'admin.settings', 4),
  ('admin.settings.platform', 'Paramètres plateforme',   'Configuration générale de la plateforme',                  'admin.settings', 5),

  -- app.explore (2)
  ('app.explore.view',     'Voir les toolkits',     'Accéder aux toolkits publiés et consulter les cartes', 'app.explore', 1),
  ('app.explore.bookmark', 'Marquer des favoris',   'Ajouter des cartes aux favoris',                      'app.explore', 2),

  -- app.plans (2)
  ('app.plans.view',     'Voir les plans',          'Accéder aux parcours guidés des toolkits',  'app.plans', 1),
  ('app.plans.progress', 'Suivre la progression',   'Marquer les étapes comme complétées',       'app.plans', 2),

  -- app.lab (2)
  ('app.lab.quiz',    'Passer un quiz',       'Réaliser un diagnostic de maturité',              'app.lab', 1),
  ('app.lab.results', 'Voir ses résultats',   'Consulter l''historique de ses diagnostics',      'app.lab', 2),

  -- app.ai (3)
  ('app.ai.coach',        'Coach IA',               'Discuter avec le coach stratégique IA',                    'app.ai', 1),
  ('app.ai.deliverables', 'Générer des livrables',  'Générer SWOT, BMC, Pitch Deck, Action Plan',               'app.ai', 2),
  ('app.ai.reflection',   'Réflexion IA',           'Utiliser l''outil de réflexion guidée IA',                 'app.ai', 3),

  -- app.workshop (4)
  ('app.workshop.create',       'Créer un workshop',        'Initier une session de workshop collaborative',                   'app.workshop', 1),
  ('app.workshop.join',         'Rejoindre un workshop',    'Participer à un workshop via code d''invitation',                 'app.workshop', 2),
  ('app.workshop.facilitate',   'Faciliter un workshop',    'Contrôler le déroulement (timer, étapes, cartes)',                'app.workshop', 3),
  ('app.workshop.deliverables', 'Générer les livrables',    'Lancer la génération IA des livrables du workshop',               'app.workshop', 4),

  -- app.challenge (2)
  ('app.challenge.participate', 'Participer',      'Jouer une session de Design Innovation',          'app.challenge', 1),
  ('app.challenge.analyze',     'Voir l''analyse', 'Consulter l''analyse IA d''une session',          'app.challenge', 2),

  -- app.profile (2)
  ('app.profile.edit', 'Modifier son profil',       'Éditer ses informations personnelles',               'app.profile', 1),
  ('app.profile.org',  'Gérer ses organisations',   'Voir et switcher entre ses organisations',            'app.profile', 2);
