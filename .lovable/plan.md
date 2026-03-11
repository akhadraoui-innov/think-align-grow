# PRD Complet — Hack & Show : Plateforme SaaS de Workshops Stratégiques

## Sprint 1 — COMPLÉTÉ ✅

### Migration SQL
- ✅ Enum `app_role` étendu : +9 valeurs
- ✅ 8 nouvelles tables, colonnes ajoutées, fonctions SECURITY DEFINER, RLS complètes

### Frontend Admin
- ✅ useAdminRole, AdminGuard, AdminSidebar, AdminShell
- ✅ 9 pages admin placeholder + routes + lien conditionnel sidebar

## Sprint 2 — COMPLÉTÉ ✅

### Dashboard avec données réelles
- ✅ useAdminStats hook : counts orgs/users/workshops/credits, activité récente, graphique hebdo
- ✅ Dashboard : 4 StatsCards live, BarChart recharts (sessions/semaine), liste activité récente

### Composant DataTable réutilisable
- ✅ Recherche, tri par colonne, pagination, row click, slot actions

### CRUD Organisations
- ✅ useOrganizations + useOrganizationDetail hooks
- ✅ Liste avec DataTable, recherche, tri, création via dialog
- ✅ Fiche détaillée avec 5 onglets : Infos, Membres, Toolkits, Abonnement, Usage
- ✅ Route /admin/organizations/:id

## Sprint 3 — À FAIRE
- AdminUsers : liste, fiche détaillée, changement de rôle, attribution crédits
- Hook usePermissions : booléens granulaires par rôle
