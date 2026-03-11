# PRD Complet — Hack & Show : Plateforme SaaS de Workshops Stratégiques

## Sprint 1 — COMPLÉTÉ ✅

### Migration SQL
- ✅ Enum `app_role` étendu : +9 valeurs (super_admin, customer_lead, innovation_lead, performance_lead, product_actor, lead, facilitator, manager, guest)
- ✅ Colonnes ajoutées sur `profiles` (status, last_seen_at) et `workshops` (description, objectives, context, scheduled_at, max_participants, session_mode, facilitator_id, organization_id)
- ✅ 8 nouvelles tables : teams, team_members, subscription_plans, organization_subscriptions, workshop_invitations, workshop_actions, workshop_snapshots, activity_logs
- ✅ Fonctions SECURITY DEFINER : `is_saas_team()`, `has_any_role()`
- ✅ RLS complètes sur toutes les nouvelles tables + policies SaaS team sur tables existantes

### Frontend Admin
- ✅ `useAdminRole` hook (RPC is_saas_team)
- ✅ `AdminGuard` — protection par rôle
- ✅ `AdminSidebar` — navigation dédiée (9 entrées)
- ✅ `AdminShell` — layout avec sidebar + breadcrumb
- ✅ Dashboard admin (placeholder avec 4 StatsCards)
- ✅ 8 pages placeholder : Organizations, Users, Toolkits, Workshops, Design Innovation, Billing, Logs, Settings
- ✅ Routes `/admin/*` dans App.tsx
- ✅ Lien "Administration" conditionnel dans AppSidebar (visible si is_saas_team)
- ✅ AppShell bypass pour les routes `/admin`

## Sprint 2 — À FAIRE
- Dashboard avec données réelles (counts, graphiques recharts)
- AdminOrganizations : DataTable, CRUD, fiche avec 6 onglets
- OrganizationMembers : invitation, changement rôle
