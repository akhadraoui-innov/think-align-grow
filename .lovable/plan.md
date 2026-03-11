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

## Sprint 3 — COMPLÉTÉ ✅

### Gestion des utilisateurs (AdminUsers)
- ✅ Liste complète avec DataTable : display_name, email, rôle(s), organisation(s), statut, XP, crédits, dernière connexion
- ✅ Fiche utilisateur détaillée avec 8 onglets : Infos, Rôles, Organisations, Crédits, Workshops, Challenges, Cartes, Activité
- ✅ UserInfoTab riche : identité professionnelle, poste, département, service, pôle, niveau hiérarchique, manager (dropdown/saisie libre), coordonnées, intérêts (tags JSONB), objectifs (tags JSONB), bio, LinkedIn, localisation
- ✅ UserOrgsTab : ajout/retrait d'organisations avec dialog, sélection de rôle, navigation vers fiche org
- ✅ UserRolesTab : attribution de rôles plateforme avec légende complète
- ✅ UserCreditsTab : solde, lifetime, historique des transactions
- ✅ UserWorkshopsTab : workshops hébergés et participations
- ✅ UserChallengesTab : performances quiz et challenges
- ✅ UserCardsTab : suivi des vues et favoris
- ✅ UserActivityTab : journal d'audit utilisateur

### Hook usePermissions
- ✅ Permissions granulaires par rôle avec booléens (canManageOrgs, canManageUsers, canManageToolkits, canViewBilling, canManageWorkshops, etc.)

### Hook useAdminUserDetail
- ✅ 9 requêtes parallèles + 6 mutations (updateProfile, addRole, removeRole, adjustCredits, addToOrganization, removeFromOrganization)

### Migration SQL Sprint 3
- ✅ Profils enrichis : job_title, department, service, pole, hierarchy_level, manager_user_id, manager_name, bio, interests, objectives, linkedin_url, location, email, phone

## Sprint 4 — COMPLÉTÉ ✅

### Gestion des Toolkits
- ✅ useAdminToolkits hook : liste + counts (piliers/cartes par toolkit) + mutations CRUD
- ✅ useAdminToolkitDetail hook : toolkit + piliers + cartes + challenges + game plans + quiz + org accès
- ✅ Page AdminToolkits : DataTable (nom, slug, statut, nb piliers, nb cartes, date), création via dialog
- ✅ Fiche AdminToolkitDetail avec 7 onglets :
  - Infos : nom, slug, emoji, description, statut, métadonnées
  - Piliers : liste avec CRUD inline (nom, slug, couleur, icône, ordre)
  - Cartes : groupées par pilier, affichage titre/phase/objectif/KPI + bouton import edge function
  - Challenges : templates avec sujets et slots imbriqués
  - Game Plans : plans avec étapes ordonnées
  - Quiz : questions par pilier avec compteur d'options
  - Organisations : ajout/retrait d'accès toolkit pour les orgs
- ✅ Route /admin/toolkits/:id

### Gestion des Workshops (vue admin)
- ✅ useAdminWorkshops hook : liste avec jointures profiles (host) + organizations + participant counts
- ✅ Page AdminWorkshops : DataTable (nom, code, statut, animateur, organisation, participants, date)

## Sprint 4.2 — COMPLÉTÉ ✅

### Nettoyage & dynamisation toolkit
- ✅ Suppression du slug hardcodé `TOOLKIT_SLUG` — `useToolkit()` récupère désormais le premier toolkit publié dynamiquement
- ✅ Suppression des fichiers mock inutilisés (`mockCards.ts`, `mockQuiz.ts`)
- ✅ Dynamisation des helpers visuels : `getPillarGradient()` et `getPillarIconName()` acceptent les valeurs DB (`color`, `icon_name`) avec fallback sur les maps legacy
- ✅ Aucune migration DB nécessaire

## Sprint 5 — COMPLÉTÉ ✅

### Facturation & Abonnements (AdminBilling)
- ✅ `useAdminBilling` hook : plans CRUD, subscriptions list with joins, credit stats
- ✅ Page AdminBilling avec 3 sections : stats crédits, plans d'abonnement (CRUD), abonnements actifs
- ✅ Dialog création/édition plan : nom, prix, quotas (JSONB), features (toggles), statut, ordre
- ✅ Dialog création/édition abonnement : select org, select plan, statut, dates
- ✅ Suppression plan avec confirmation AlertDialog
- ✅ RLS ajoutée : saas team SELECT + INSERT sur `credit_transactions`

### Logs d'audit (AdminLogs)
- ✅ `useAdminLogs` hook : filtres dynamiques, pagination server-side, jointure organizations
- ✅ Page AdminLogs avec filtres : action, type entité, organisation, dates, recherche texte
- ✅ Pagination server-side (25/page) avec compteur total
- ✅ Détail metadata : dialog avec JSON formaté
- ✅ Styles cohérents avec le design system existant

## Sprint 6 — À FAIRE

### Améliorations UX & fonctionnalités avancées
- Enrichissement logs avec display_name (nécessite FK ou vue)
- Export CSV des logs
- Dashboard billing avec graphiques de consommation
- Gestion des crédits par organisation
