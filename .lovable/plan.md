# PRD Complet — Hack & Show : Plateforme SaaS de Workshops Stratégiques

## Vision produit

Hack & Show est une plateforme SaaS B2B multi-tenant de workshops stratégiques.

### L'organisation comme entité centrale

L'**organisation** est le pilier du modèle de données. Chaque action (workshops, challenges, toolkits, abonnements, crédits) s'inscrit dans le contexte d'une organisation. Une organisation possède :

- **Identité & branding** : nom, slug, logo, couleur primaire
- **Informations légales** : SIRET, TVA intracommunautaire, secteur d'activité
- **Structure** : appartenance à un groupe, lien filiale/parent (self-referencing)
- **Coordonnées** : email, téléphone, site web
- **Adresses** : multi-adresses (siège, sites, bureaux)
- **Contacts & mapping décisionnel** : contacts avec niveau de décision (Décideur, Prescripteur, Influenceur, Utilisateur, Sponsor), poste, direction
- **Notes internes** : champ libre pour l'équipe SaaS
- **Membres** avec rôles (Owner, Admin, Member, Guest…)
- **Équipes** internes
- **Toolkits** assignés et activés
- **Abonnement** avec plan et quotas
- **Workshops** réalisés
- **Journal d'activité** (audit trail)

### Organisation plateforme : Growthinnov

**Growthinnov** est l'organisation spéciale marquée `is_platform_owner = true`. Elle est à la fois :
1. **L'éditeur SaaS** qui développe et exploite la plateforme Hack & Show
2. **Un client** qui utilise la plateforme pour ses propres workshops et challenges

Seuls les **super_admin** peuvent modifier le flag `is_platform_owner`. Une seule organisation peut porter ce flag à la fois.

Les membres de l'organisation plateforme ayant un rôle SaaS (`super_admin`, `customer_lead`, `innovation_lead`, `performance_lead`, `product_actor`) accèdent au back-office d'administration.

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
- ✅ Fiche détaillée avec 8 onglets : Infos, Membres, Équipes, Toolkits, Abonnement, Workshops, Usage, Activité
- ✅ Onglet Infos enrichi : stats, branding, légal, structure/groupe/filiale, coordonnées, adresses multi, contacts avec mapping décisionnel, notes internes, zone danger
- ✅ Route /admin/organizations/:id
- ✅ Flag `is_platform_owner` sur organisations (Growthinnov = éditeur SaaS)

## Sprint 3 — EN COURS 🚧

### Gestion des utilisateurs (AdminUsers)
- Liste complète avec DataTable : display_name, email, rôle(s), organisation(s), statut, XP, crédits, dernière connexion
- Fiche utilisateur détaillée : profil, rôles, organisations, historique d'activité, crédits
- Actions : changement de rôle, attribution/retrait de crédits, désactivation

### Hook usePermissions
- Permissions granulaires par rôle avec booléens (canManageOrgs, canManageUsers, canManageToolkits, canViewBilling, canManageWorkshops, etc.)
- Utilisé dans toute l'app pour conditionner les actions

## Sprint 4 — À FAIRE
- Gestion des Toolkits : CRUD complet, import de cartes, gestion des piliers
- Gestion des Workshops : vue admin, modération, export des résultats

## Sprint 5 — À FAIRE
- Facturation & abonnements : plans, quotas, suivi de consommation
- Logs & audit : historique complet, filtres, export
