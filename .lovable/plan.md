

## Bilan des tests (Sprint 3)

Les erreurs console sont toutes liées a une extension navigateur (`chrome-extension://hoklmmgfnpapgjgcpechhaamimifchmp`) et non a l'application. L'app fonctionne correctement.

**Ce qui est en place et fonctionnel :**
- Fiche utilisateur avec 8 onglets (Infos, Roles, Organisations, Credits, Workshops, Challenges, Cartes, Activite)
- UserInfoTab riche : identite, poste/organisation, hierarchie, manager, interets, objectifs, metadata
- UserOrgsTab : ajout/retrait d'organisations avec dialog, selection de role, navigation vers fiche org
- Hook useAdminUserDetail : 9 requetes paralleles + 6 mutations
- Hook usePermissions : flags granulaires par role SaaS
- RLS correctes sur toutes les tables

## Plan Sprint 4 : Gestion des Toolkits + Workshops Admin

### 1. Page AdminToolkits -- CRUD complet
- Liste des toolkits avec DataTable (nom, slug, statut, nb piliers, nb cartes, date)
- Creation/edition via Dialog (nom, slug, description, emoji, statut draft/published/archived)
- Hook `useAdminToolkits` : liste + detail + mutations (create, update, delete)

### 2. Fiche Toolkit detaillee (`/admin/toolkits/:id`)
Avec onglets suivant le meme modele que les fiches Organisation et Utilisateur :
- **Infos** : nom, slug, emoji, description, statut, metadata
- **Piliers** : liste CRUD des piliers (nom, slug, couleur, icone, ordre). Ajout/edition inline
- **Cartes** : liste des cartes groupees par pilier. CRUD (titre, sous-titre, phase, objectif, KPI, action, definition, icone, ordre)
- **Challenges** : templates de challenge lies au toolkit, sujets et slots
- **Game Plans** : plans de jeu lies au toolkit, etapes
- **Quiz** : questions de quiz par pilier
- **Organisations** : orgs ayant acces a ce toolkit (via organization_toolkits)

### 3. Import de cartes (existant)
- Reutiliser l'edge function `import-toolkit-cards` existante
- Ajouter un bouton "Importer des cartes" dans l'onglet Cartes de la fiche toolkit

### 4. Page AdminWorkshops -- Vue admin
- Liste des workshops avec DataTable (nom, code, statut, host, organisation, nb participants, date)
- Hook `useAdminWorkshops` : liste avec jointures profiles + organizations
- Clic vers fiche workshop avec stats et participants (vue lecture admin)

### 5. Mise a jour du PRD
Sprint 3 marque COMPLETE. Sprint 4 detaille. Sprint 5 (Billing/Logs) mis a jour.

### Fichiers a creer/modifier

| Action | Fichier |
|--------|---------|
| Creer | `src/hooks/useAdminToolkits.ts` |
| Creer | `src/hooks/useAdminWorkshops.ts` |
| Creer | `src/pages/admin/AdminToolkitDetail.tsx` |
| Modifier | `src/pages/admin/AdminToolkits.tsx` |
| Modifier | `src/pages/admin/AdminWorkshops.tsx` |
| Modifier | `src/App.tsx` (route `/admin/toolkits/:id`) |
| Modifier | `.lovable/plan.md` |

### Pas de migration SQL necessaire
Les tables `toolkits`, `pillars`, `cards`, `challenge_templates`, `challenge_subjects`, `challenge_slots`, `game_plans`, `game_plan_steps`, `quiz_questions`, `organization_toolkits`, `workshops` existent deja avec les RLS appropriees. L'equipe SaaS a deja les permissions ALL via `is_saas_team()`.

