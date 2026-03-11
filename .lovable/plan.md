

# PRD Complet -- Hack & Show : Plateforme SaaS de Workshops Strategiques

---

## 1. Vision produit

Hack & Show est une plateforme SaaS B2B multi-tenant qui permet aux entreprises d'animer des ateliers strategiques collaboratifs (Workshops) et des diagnostics structures (Design Innovation) en s'appuyant sur des Toolkits thematiques composes de cartes. Elle integre un backoffice d'administration complet, une gestion fine des roles et permissions, un systeme d'abonnements avec credits, et une intelligence collective enrichie par l'IA.

---

## 2. Etat actuel de la base de donnees

### Tables existantes
- `toolkits` (name, slug, emoji, status)
- `pillars` (name, slug, color, icon, toolkit_id)
- `cards` (title, subtitle, definition, objective, action, kpi, phase, pillar_id)
- `quiz_questions`, `quiz_results`
- `game_plans`, `game_plan_steps`
- `challenge_templates`, `challenge_subjects`, `challenge_slots`, `challenge_responses`, `challenge_staging`, `challenge_analyses`
- `workshops` (code, config, status, host_id, current_step, timer)
- `workshop_participants`, `workshop_canvas_items`, `workshop_comments`, `workshop_responses`, `workshop_deliverables`
- `organizations` (name, slug, logo, primary_color)
- `organization_members` (org_id, user_id, role)
- `organization_toolkits` (org_id, toolkit_id, is_active, max_members)
- `profiles` (user_id, display_name, avatar_url, xp)
- `user_roles` (user_id, role)
- `user_credits`, `credit_transactions`
- `user_card_progress`, `user_plan_progress`

### Enums existants
- `app_role`: owner, admin, member
- `workshop_status`: lobby, active, paused, completed
- `toolkit_status`: draft, published, archived
- `card_phase`: foundations, model, growth, execution
- `canvas_item_type`: card, sticky, group, arrow, icon, text
- `challenge_slot_type`: single, multi, ranked
- `challenge_subject_type`: question, challenge, context
- `deliverable_type`: swot, bmc, pitch_deck, action_plan

### Fonctions existantes
- `has_role`, `is_org_admin`, `is_org_member`, `is_workshop_host`, `is_workshop_participant`

### Pages existantes
- Landing, Auth, Explore, Plans, Lab, AI, Profile, Workshop (liste + room), Challenge (liste + room)

---

## 3. Hierarchie des roles

```text
SUPER ADMIN (proprietaire SaaS)
├── Customer Lead      Relation client, onboarding, abonnements, credits
├── Innovation Lead    Toolkits, cartes, Design Innovation, qualite pedagogique
├── Performance Lead   Analytics, dashboards, rapports, scoring, benchmarking
├── Product Actor      Experience produit, config workshops, UX, integration
│
└── ADMIN CLIENT (par organisation)
    ├── Lead             Responsable d'equipe, configure workshops/DI
    ├── Facilitateur     Anime les sessions live
    ├── Manager          Consulte resultats, suit progression equipes
    ├── Utilisateur      Participe aux sessions
    └── Invite           Acces temporaire via code, pas de compte persistant
```

### Matrice de permissions

| Domaine | Super Admin | Customer Lead | Innovation Lead | Performance Lead | Product Actor | Admin Client | Lead | Facilitateur | Manager | Utilisateur | Invite |
|---|---|---|---|---|---|---|---|---|---|---|---|
| Organisations | CRUD all | CRUD all | R | R | R | CRUD sienne | R | -- | -- | -- | -- |
| Membres/equipes | CRUD all | CRUD all | R | R | R | CRUD org | CRUD equipe | -- | R equipe | -- | -- |
| Abonnements/credits | CRUD | CRUD | -- | R | -- | R + consomme | R | -- | -- | -- | -- |
| Toolkits/cartes/quiz | CRUD | R | CRUD | R | R | R achetes | R assignes | R assignes | -- | -- | -- |
| Design Innovation templates | CRUD | -- | CRUD | R | R | CRUD org | CRUD assignes | R + animer | R | -- | -- |
| Config workshops | CRUD | R | R | R | CRUD | CRUD org | CRUD assignes | R + animer | R | R | session |
| Animation live | Oui | -- | -- | -- | Oui | Oui | Oui | Oui | -- | Participer | Participer |
| Resultats/livrables | Tous | Tous | R | Tous | Tous | Org | Equipe | Sessions | Equipe | Les siens | Session |
| Analytics/dashboards | Global | Global | R | CRUD | R | Org | Equipe | -- | Equipe | Perso | -- |
| Logs d'activite | CRUD | R | R | CRUD | R | R org | -- | -- | -- | -- | -- |
| IA Coach | Config | -- | Config | -- | Config | Consomme | Consomme | Consomme | -- | Consomme | -- |

---

## 4. Modules fonctionnels

### 4.1 Module Administration Plateforme (`/admin`)

**Accessible par : Super Admin + equipe SaaS (Customer/Innovation/Performance/Product)**

**Dashboard global**
- Compteurs : organisations actives, utilisateurs totaux, workshops ce mois, credits consommes, revenus
- Graphiques temporels : sessions/semaine sur 12 semaines, evolution utilisateurs, consommation credits
- 10 derniers evenements (depuis activity_logs)
- Alertes : organisations proches du quota, abonnements expirant sous 7 jours

**Journal d'activite**
- Tableau filtrable : utilisateur, action, entite, date
- Export CSV
- Retention configurable

### 4.2 Module Organisations (`/admin/organizations`)

**Accessible par : Super Admin, Customer Lead (CRUD) + autres SaaS (lecture)**

**Liste**
- Tableau pagine, triable (nom, slug, nb membres, plan, statut, date creation)
- Filtres : plan d'abonnement, statut (actif/suspendu/archive)
- Actions rapides : creer, suspendre, archiver

**Fiche organisation** (`/admin/organizations/:id`)
- Onglet Informations : nom, slug, logo (upload), couleur primaire
- Onglet Membres : liste avec role, date ajout, derniere connexion, statut. Invitation par email. Changement de role. Desactivation
- Onglet Equipes : creation d'equipes, assignation d'un Lead, ajout de membres. Un membre peut appartenir a plusieurs equipes
- Onglet Abonnement : plan actif, dates, quotas (workshops/mois, participants/session, toolkits, credits IA). Historique de facturation (placeholder)
- Onglet Toolkits : liste des toolkits assignes, dates d'expiration, toggle actif/inactif, max membres
- Onglet Usage : workshops crees vs quota, participants actifs, credits IA consommes (barres de progression)

### 4.3 Module Utilisateurs (`/admin/users`)

**Accessible par : Super Admin, Customer Lead (tous) + Admin Client (org)**

**Liste**
- Tableau : nom, email, organisation, role plateforme, role org, derniere connexion, statut, credits, XP
- Filtres : organisation, role, statut (actif/inactif/suspendu)
- Recherche full-text

**Fiche utilisateur** (`/admin/users/:id`)
- Informations : display_name, avatar, email, date inscription
- Roles : role plateforme (user_roles) + role par organisation (organization_members)
- Historique : workshops participes, Design Innovation completes, cartes vues, quiz passes
- Progression : XP, radar de maturite (scores quiz)
- Credits : solde actuel, historique transactions
- Actions : desactiver, changer role, attribuer credits, reinitialiser mot de passe

### 4.4 Module Toolkit Management (`/admin/toolkits`)

**Accessible par : Super Admin, Innovation Lead (CRUD) + autres (lecture)**

Un toolkit = un ensemble structure de cartes organisees en familles (piliers) pour adresser une ou plusieurs problematiques metier. Il existe actuellement un toolkit ; la plateforme en gerera plusieurs.

**Liste des toolkits**
- Tableau : nom, emoji, statut (draft/published/archived), nb piliers, nb cartes, date creation
- Actions : creer, dupliquer, archiver, publier

**Fiche toolkit** (`/admin/toolkits/:id`)
- Onglet General : nom, slug, description, emoji, statut
- Onglet Piliers : liste avec nom, slug, icone, couleur, description, ordre. CRUD avec drag-and-drop pour reordonner
- Onglet Cartes : tableau filtrable par pilier et phase. Colonnes : titre, sous-titre, phase, pilier, ordre. CRUD inline ou modal. Import/export CSV
- Onglet Quiz : questions rattachees aux piliers. CRUD tabulaire. Chaque question : libelle, options JSON (label + pillar_slug + points), pilier, ordre
- Onglet Plans de jeu : parcours guides. Nom, description, difficulte, duree estimee, etapes ordonnees (carte + instruction). CRUD avec drag-reorder
- Onglet Design Innovation : templates rattaches a ce toolkit (voir module 4.6)
- Onglet Statistiques : sessions utilisant ce toolkit, cartes les plus/moins utilisees, taux de completion quiz

### 4.5 Module Workshop Management (`/admin/workshops`)

**Accessible par : Super Admin, Product Actor (CRUD) + Admin Client, Lead (org)**

**Creation / Configuration**
- Nom, description (texte riche), objectifs (liste de bullet points)
- Contexte metier : description de la situation, enjeux, contraintes (texte riche)
- Toolkits a utiliser : selection multiple parmi ceux disponibles pour l'organisation
- Design Innovation a integrer : selection de templates parmi ceux du/des toolkit(s)
- Facilitateur assigne (selection parmi les membres de l'org avec role facilitateur ou superieur)
- Date/heure prevue, duree estimee
- Nombre max de participants
- Mode : presentiel, distanciel, hybride
- Code de session (6 caracteres, genere automatiquement, regenerable)
- Personnalisation : logo, couleurs (herites de l'organisation ou personnalises)

**Gestion des participants**
- Invitation par email (avec lien direct contenant le code)
- Liste de presence : invites vs connectes vs ayant participe vs absents
- Role dans la session : facilitateur, participant, observateur
- Statut connexion temps reel

**Pilotage live**
- Statut : lobby, en cours, pause, termine
- Timer configurable par etape
- Navigation dirigee : le facilitateur pilote l'etape en cours pour tous les participants
- Mode presentation : canvas en lecture seule projete

**Post-workshop**
- Consolidation des donnees : toutes les cartes posees, reponses, votes, sticky notes
- Livrables IA : SWOT, BMC, Pitch Deck, Plan d'action (consomment des credits)
- Export : PDF, CSV des resultats
- Espace de discussion post-session : commentaires par sujet/carte, thread avec mentions
- Suivi des actions decidees : to-do list (titre, description, assigne, statut, date limite)
- Historique des versions : snapshots du canvas a differents moments
- Evaluation de session : NPS rapide post-workshop

**Liste des workshops**
- Tableau : nom, organisation, facilitateur, statut, nb participants, date, toolkits utilises
- Filtres : organisation, statut, date, facilitateur

### 4.6 Module Design Innovation (`/admin/design-innovation`)

**Renommage de "Challenge" dans toute l'interface utilisateur et la navigation.**

**Templates** (`/admin/design-innovation/templates`)
- Liste : nom, toolkit, difficulte, nb sujets, nb slots, date creation
- Fiche template :
  - Metadonnees : nom, description, difficulte, toolkit associe, pilier optionnel
  - Sujets (etapes du diagnostic) : titre, description, type (question/challenge/contexte), ordre. CRUD avec drag-reorder
  - Slots par sujet (blocs du canvas) : libelle, indice (hint), type (single/multi/ranked), requis ou non, ordre. CRUD
  - Layout de disposition : nombre de blocs par etape, grille (1x2, 2x2, 1x3), liste, libre
  - Documentation : objectif pedagogique de chaque etape, consignes pour le facilitateur

**Sessions** (`/admin/design-innovation/sessions`)
- Liste par statut, organisation, facilitateur, date
- Resultats consolides : cartes posees par slot, maturite, classement
- Analyse IA avec scoring et recommandations (consomme des credits)

### 4.7 Module Credits et Abonnements (`/admin/billing`)

**Accessible par : Super Admin, Customer Lead (CRUD) + Admin Client (lecture org)**

**Plans d'abonnement** (geres par Super Admin / Customer Lead)
- Nom, prix mensuel, prix annuel, quotas (JSON) :
  - `max_workshops_per_month`
  - `max_participants_per_workshop`
  - `max_toolkits`
  - `ai_credits_per_month`
- Fonctionnalites incluses (JSON) : branding personnalise, export PDF, IA avancee, support prioritaire
- Statut : actif/inactif
- Ordre d'affichage

**Gestion des abonnements par organisation**
- Plan actif, dates debut/fin, statut (trial/active/past_due/cancelled)
- Attribution manuelle de credits bonus
- Historique de facturation (placeholder pour integration Stripe future)

**Suivi de consommation**
- Par organisation : credits IA, workshops, participants — vs quotas
- Par utilisateur : credits consommes, ventilation par type
- Alertes de seuil bas (configurable)
- Projection de consommation mensuelle

### 4.8 Module Parametres (`/admin/settings`)

- Configuration plateforme : nom, logo, couleurs par defaut
- Configuration IA : modeles autorises, cout en credits par appel
- Configuration emails : templates d'invitation, de bienvenue
- Securite : politique de mots de passe, duree de session

---

## 5. Navigation

```text
SIDEBAR UTILISATEUR (existante, mise a jour)
├── Accueil
├── Explorer (cartes du toolkit actif)
├── Plans de jeu
├── Lab (quiz/diagnostic)
├── Coach IA
├── Workshops
│   ├── Mes workshops
│   └── Nouveau
├── Design Innovation (ex-Challenges)
│   ├── Mes sessions
│   └── Nouveau
├── Profil
└── Administration (visible si role SaaS ou Admin Client)

SIDEBAR ADMIN (/admin, dediee)
├── Dashboard
├── Organisations
├── Utilisateurs
├── Toolkits
│   ├── Liste
│   ├── [Fiche toolkit avec onglets Piliers/Cartes/Quiz/Plans/DI/Stats]
├── Workshops
├── Design Innovation
│   ├── Templates
│   └── Sessions
├── Credits & Abonnements
│   ├── Plans
│   ├── Abonnements
│   └── Consommation
├── Logs d'activite
└── Parametres
```

---

## 6. Modifications de base de donnees

### 6.1 Extensions de l'enum `app_role`

Valeurs a ajouter : `super_admin`, `customer_lead`, `innovation_lead`, `performance_lead`, `product_actor`, `lead`, `facilitator`, `manager`, `guest`

Les valeurs existantes `owner`, `admin`, `member` restent pour retro-compatibilite.

### 6.2 Nouvelles tables

| Table | Colonnes cles | Objectif |
|---|---|---|
| `teams` | id, name, organization_id, lead_user_id, created_at | Equipes au sein d'une organisation |
| `team_members` | id, team_id, user_id, created_at | Liaison utilisateur-equipe |
| `subscription_plans` | id, name, price_monthly, price_yearly, quotas (JSONB), features (JSONB), is_active, sort_order, created_at | Definition des plans |
| `organization_subscriptions` | id, organization_id, plan_id, status (trial/active/past_due/cancelled), started_at, expires_at, created_at | Abonnement actif par org |
| `workshop_invitations` | id, workshop_id, email, token, status (pending/accepted/declined), role, invited_by, created_at | Invitations par email |
| `workshop_actions` | id, workshop_id, title, description, assignee_id, status (todo/in_progress/done), due_date, created_at | To-do post-workshop |
| `workshop_snapshots` | id, workshop_id, snapshot_data (JSONB), created_at, created_by | Historique canvas |
| `activity_logs` | id, user_id, organization_id, action (text), entity_type, entity_id, metadata (JSONB), created_at | Journal d'audit |

### 6.3 Colonnes ajoutees sur tables existantes

| Table | Colonnes ajoutees |
|---|---|
| `profiles` | `status` (text, default 'active'), `last_seen_at` (timestamptz) |
| `workshops` | `description` (text), `objectives` (JSONB), `context` (text), `scheduled_at` (timestamptz), `max_participants` (int), `session_mode` (text), `facilitator_id` (uuid), `organization_id` (uuid FK organizations) |

### 6.4 Nouvelles fonctions SECURITY DEFINER

- `is_saas_team(_user_id uuid)` : retourne true si le user a un role parmi super_admin, customer_lead, innovation_lead, performance_lead, product_actor
- `has_any_role(_user_id uuid, _roles app_role[])` : retourne true si le user a au moins un des roles passes

### 6.5 RLS

- `teams`, `team_members` : lecture par membres de l'org, ecriture par admin org + saas team
- `subscription_plans` : lecture publique (pour page pricing), ecriture par saas team
- `organization_subscriptions` : lecture par admin org + saas team, ecriture par saas team + customer_lead
- `activity_logs` : insert par authenticated, lecture par saas team + admin de l'org concernee
- `workshop_invitations`, `workshop_actions`, `workshop_snapshots` : par workshop host/facilitator + saas team
- Toutes les tables admin protegees par `is_saas_team(auth.uid())` ou `is_org_admin(auth.uid(), org_id)`

---

## 7. Architecture frontend

```text
src/
├── pages/admin/
│   ├── AdminDashboard.tsx
│   ├── AdminOrganizations.tsx
│   ├── AdminOrganizationDetail.tsx
│   ├── AdminUsers.tsx
│   ├── AdminUserDetail.tsx
│   ├── AdminToolkits.tsx
│   ├── AdminToolkitDetail.tsx
│   ├── AdminWorkshops.tsx
│   ├── AdminDesignInnovation.tsx
│   ├── AdminDesignInnovationTemplateDetail.tsx
│   ├── AdminBilling.tsx
│   ├── AdminLogs.tsx
│   └── AdminSettings.tsx
├── components/admin/
│   ├── AdminShell.tsx          (layout avec sidebar dediee)
│   ├── AdminGuard.tsx          (protection par role)
│   ├── AdminSidebar.tsx        (navigation admin)
│   ├── StatsCard.tsx           (carte metrique)
│   ├── DataTable.tsx           (tableau reutilisable : tri, filtre, pagination)
│   ├── OrganizationForm.tsx
│   ├── OrganizationMembers.tsx
│   ├── OrganizationTeams.tsx
│   ├── ToolkitPillarsTab.tsx
│   ├── ToolkitCardsTab.tsx
│   ├── ToolkitQuizTab.tsx
│   ├── ToolkitPlansTab.tsx
│   ├── WorkshopConfigForm.tsx
│   ├── WorkshopParticipants.tsx
│   ├── WorkshopActions.tsx
│   ├── DesignInnovationTemplateForm.tsx
│   ├── SubscriptionPlanForm.tsx
│   └── ActivityLogTable.tsx
├── hooks/
│   ├── useAdminRole.ts         (check is_saas_team via RPC)
│   ├── useOrganizations.ts     (CRUD organizations)
│   ├── useTeams.ts             (CRUD teams)
│   ├── useSubscriptionPlans.ts
│   ├── useActivityLogs.ts
│   └── useAdminStats.ts
```

Style : Atlassian-like. Fond blanc/gris clair. Sidebar sombre a gauche. Tableaux avec lignes alternees. Badges de statut colores. Breadcrumbs. Modales pour creation/edition. Toasts pour feedback.

---

## 8. Plan d'implementation par phases

### Phase 1 -- Fondations (Sprint 1-2)

**Sprint 1 : Base de donnees + Layout admin**
- Migration SQL : enum etendu, 8 nouvelles tables, colonnes ajoutees, fonctions, RLS
- AdminShell + AdminGuard + AdminSidebar
- Routes `/admin/*` dans App.tsx
- Lien "Administration" conditionnel dans AppSidebar

**Sprint 2 : Dashboard + Organisations**
- AdminDashboard : compteurs (count sur organizations, profiles, workshops), graphique sessions/semaine (recharts)
- AdminOrganizations : liste avec DataTable, creation, fiche avec 6 onglets
- OrganizationMembers : invitation, changement role, desactivation

### Phase 2 -- Utilisateurs et permissions (Sprint 3)

- AdminUsers : liste, fiche detaillee, changement de role, attribution credits
- Hook `usePermissions` : expose des booleens (`canManageToolkits`, `canManageBilling`, etc.) bases sur le role
- Protection granulaire des onglets/boutons selon le profil SaaS

### Phase 3 -- Toolkit Management (Sprint 4-5)

**Sprint 4 : CRUD Toolkits + Piliers + Cartes**
- AdminToolkits : liste, creation
- AdminToolkitDetail avec onglets : General, Piliers (drag-reorder), Cartes (DataTable filtrable, CRUD modal, import CSV)

**Sprint 5 : Quiz + Plans de jeu + Stats**
- Onglet Quiz : CRUD tabulaire
- Onglet Plans de jeu : CRUD avec etapes ordonnees
- Onglet Statistiques : metriques d'usage

### Phase 4 -- Workshop Management avance (Sprint 6-7)

**Sprint 6 : Configuration riche**
- WorkshopConfigForm : contexte, objectifs, multi-toolkit, multi-DI, invitation, mode session
- WorkshopParticipants : liste de presence, statut connexion

**Sprint 7 : Post-workshop**
- WorkshopActions : to-do post-session
- Export PDF/CSV des resultats
- Discussion post-session (commentaires par carte)
- Snapshots du canvas

### Phase 5 -- Design Innovation Management (Sprint 8)

- Renommage "Challenge" -> "Design Innovation" dans toute l'app (labels, routes, breadcrumbs)
- AdminDesignInnovation : liste templates, CRUD
- AdminDesignInnovationTemplateDetail : sujets, slots, layout, documentation
- Sessions : resultats consolides, analyse IA

### Phase 6 -- Credits et Abonnements (Sprint 9)

- AdminBilling : CRUD plans d'abonnement, gestion abonnements par org
- Suivi consommation : barres de progression, alertes seuil, projection
- Attribution manuelle de credits

### Phase 7 -- Logs, parametres, polish (Sprint 10)

- AdminLogs : tableau filtrable, export CSV
- AdminSettings : configuration plateforme, IA, emails
- Revue UX complete : animations, etats vides, messages d'erreur, responsive
- Tests de permission par role

---

## 9. Risques et mitigations

| Risque | Impact | Probabilite | Mitigation |
|---|---|---|---|
| Complexite des 11 roles -> bugs de permissions | Eleve | Moyenne | Fonctions SECURITY DEFINER centralisees, hook `usePermissions` unique, tests systematiques par role |
| Migration de l'enum `app_role` existant | Moyen | Faible | Migration additive (ALTER TYPE ADD VALUE), pas de suppression de valeurs existantes |
| Performance dashboards avec volume | Moyen | Faible | Pagination systematique, vues materialisees si necessaire, index sur created_at |
| Coherence roles plateforme vs roles org | Eleve | Moyenne | Un user a UN role plateforme (user_roles) et UN role par org (organization_members). Le plus permissif s'applique. Documente dans le code |
| UX backoffice trop complexe | Moyen | Moyenne | Style Atlassian : sidebar fixe, DataTable reutilisable, breadcrumbs, etats vides explicites, recherche globale |
| Multi-toolkit casse les pages existantes Explorer/Plans/Lab | Moyen | Moyenne | Ajouter un selecteur de toolkit actif dans la sidebar utilisateur ; les pages existantes filtrent par toolkit selectionne |

---

## 10. Opportunites et innovations

- **Mode presentation** : le facilitateur projette le canvas en lecture seule pour les participants en presentiel, avec laser pointer virtuel
- **Templates de workshop** : sauvegarder une configuration complete (toolkits + Design Innovation + structure) comme template reutilisable
- **Notifications temps reel** : alertes quand un participant rejoint, quand le facilitateur change d'etape, quand un livrable IA est pret
- **Scoring organisationnel** : agreger les resultats Design Innovation par equipe/organisation pour un radar de maturite global
- **Benchmarking anonymise** : comparer les scores d'une organisation avec la moyenne plateforme (opt-in)
- **Parcours d'onboarding guide** : premier workshop assiste pas a pas pour les nouveaux Admin Client
- **Integration calendrier** : lien direct Google Calendar / Outlook pour les workshops planifies
- **Livrables collaboratifs** : edition partagee des SWOT/BMC generes par l'IA avec commentaires inline
- **Widget de progression** : barre de completion dans le profil utilisateur montrant la maturite par pilier
- **Mode offline-first** : preparation de workshop sans connexion, synchronisation au retour en ligne
- **Webhooks** : notifier des systemes externes (Slack, Teams) lors d'evenements cles (workshop termine, nouveau livrable)

