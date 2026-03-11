

## Sprint 5 — Facturation & Abonnements + Logs d'audit

### Partie A : AdminBilling — Gestion des plans et abonnements

**Page `/admin/billing`** avec 3 sections :

**1. CRUD Plans d'abonnement** (`subscription_plans` existe deja)
- DataTable des plans : nom, prix mensuel/annuel, statut actif/inactif, ordre
- Dialog creation/edition : nom, prix mensuel, prix annuel, quotas (JSONB editor simplifie avec champs cles : `max_workshops_per_month`, `max_toolkits`, `max_participants_per_workshop`, `ai_credits_per_month`), features (toggles : `custom_branding`, `api_access`, `priority_support`, `export_pdf`), is_active, sort_order
- Suppression avec confirmation

**2. Abonnements actifs** (`organization_subscriptions` existe deja)
- DataTable : organisation, plan, statut, date debut, expiration
- Dialog pour attribuer/modifier un abonnement : select organisation, select plan, statut, dates
- Jointure `organizations` + `subscription_plans` pour affichage

**3. Vue credits globale**
- Recap : total credits distribues, total depenses, solde global
- Top 10 organisations par consommation (via `credit_transactions` + `organization_members` + `profiles`)

**Hook : `useAdminBilling.ts`**
- Queries : plans list, subscriptions list with joins, credit stats
- Mutations : createPlan, updatePlan, deletePlan, createSubscription, updateSubscription

### Partie B : AdminLogs — Journal d'audit

**Page `/admin/logs`** avec filtres et recherche :

**1. DataTable des logs** (`activity_logs` existe deja)
- Colonnes : date, utilisateur (display_name via profiles), action, type entite, entite, organisation
- Tri par date (desc par defaut)
- Pagination 25 par page

**2. Filtres**
- Par action (dropdown : created, updated, deleted, login, etc.)
- Par entity_type (dropdown : workshop, organization, toolkit, user, etc.)
- Par organisation (select)
- Par plage de dates (date pickers)
- Recherche texte libre sur action + entity_id

**3. Detail metadata**
- Click sur une ligne ouvre un sheet/dialog avec le JSON metadata formatte

**Hook : `useAdminLogs.ts`**
- Query avec filtres dynamiques, pagination serveur-side, jointure profiles pour display_name

### Fichiers

| Action | Fichier |
|--------|---------|
| Create | `src/hooks/useAdminBilling.ts` |
| Create | `src/hooks/useAdminLogs.ts` |
| Rewrite | `src/pages/admin/AdminBilling.tsx` |
| Rewrite | `src/pages/admin/AdminLogs.tsx` |
| Update | `.lovable/plan.md` |

Aucune migration DB — les tables `subscription_plans`, `organization_subscriptions`, `activity_logs`, `credit_transactions` existent deja avec les bonnes RLS.

