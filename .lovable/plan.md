

# Intégration Complète du Simulateur — Diagnostic & Plan d'Action

## Diagnostic des lacunes identifiées

### 1. Côté utilisateur : impossible de lancer une simulation
La page `/simulator` affiche les 50 modes en lecture seule (cards sans bouton "Lancer"). Il n'y a aucun lien entre le catalogue de modes et les practices en base de données. Pour lancer une simulation, il faudrait soit :
- Créer une practice "standalone" (non liée à un parcours) directement depuis le catalogue
- Ou être inscrit à un parcours contenant un module de type practice

### 2. Côté admin : zéro section Simulateur
La sidebar admin (`AdminSidebar.tsx`) ne contient aucune entrée "Simulateur". Il n'y a ni page de gestion des simulations, ni bibliothèque admin de practices standalone, ni configuration par organisation.

### 3. Génération IA ne connaît pas les practice_type
La fonction `generate-practice` dans `academy-generate` crée toujours une practice de type `conversation` (pas de champ `practice_type` ni `type_config`). L'IA de création de parcours ne propose jamais de simulations spécialisées.

### 4. Pas de paramétrage du niveau d'aide IA
Aucun champ ne contrôle l'intensité de l'accompagnement IA (suggestions, indices, coaching proactif vs. autonomie totale).

---

## Plan d'implémentation

### Bloc 1 — Page catalogue utilisateur actionnable

**Fichier** : `src/pages/Simulator.tsx`

- Ajouter un bouton "Lancer" sur chaque carte de mode
- Au clic : créer une practice éphémère (en mémoire, pas en DB) avec les defaults du mode et ouvrir le `SimulatorEngine` dans un Dialog fullscreen
- Ajouter un onglet "Mes simulations" montrant les practices issues de parcours ET les sessions standalone depuis `academy_practice_sessions`
- Filtrer par organisation active (OrgContext)

### Bloc 2 — Section admin "Simulateur"

**Nouveaux fichiers** :
- `src/pages/admin/AdminSimulator.tsx` — Dashboard avec stats (sessions totales, score moyen, modes populaires) + tableau des practices par organisation
- `src/pages/admin/AdminSimulatorTemplates.tsx` — Bibliothèque de templates de simulation par mode, assignables aux organisations

**Fichiers modifiés** :
- `src/components/admin/AdminSidebar.tsx` — Ajouter section "Simulateur" avec sous-items
- `src/App.tsx` — Routes `/admin/simulator` et `/admin/simulator/templates`

Fonctionnalités admin :
- Voir toutes les sessions de simulation (par org, par user, par mode)
- Créer des practices standalone (non liées à un module) assignées à une organisation
- Dupliquer/personnaliser des templates par client
- Configurer le niveau d'aide IA par practice (nouveau champ)

### Bloc 3 — Paramétrage du niveau d'aide IA

**Migration DB** : Ajouter colonne `ai_assistance_level` sur `academy_practices` (enum : `autonomous`, `guided`, `intensive`)

Comportement par niveau :
- **autonomous** : Pas de suggestions, pas de chips, feedback minimal, évaluation en fin uniquement
- **guided** (défaut) : Suggestions après chaque réponse, indices sur demande via HelpDrawer
- **intensive** : Suggestions proactives, indicateur qualité temps réel, relances IA si inactivité, coaching méthodologique intégré

**Fichiers modifiés** :
- `src/components/simulator/SimulatorShell.tsx` — Passer le niveau et conditionner HelpDrawer/chips
- `src/components/simulator/modes/ChatMode.tsx` — Conditionner SuggestionChips et InputQualityIndicator
- `src/components/admin/AcademyPracticesTab.tsx` — Ajouter sélecteur de niveau
- `supabase/functions/academy-practice/index.ts` — Injecter instructions d'assistance dans le system prompt selon le niveau

### Bloc 4 — Intégration à la création de parcours

**Fichier** : `supabase/functions/academy-generate/index.ts`

Modifier `generatePractice` pour :
- Accepter un `practice_type` suggéré (ou le détecter automatiquement selon le contexte du module)
- Générer `type_config` adapté au mode choisi
- Générer `phases`, `evaluation_dimensions`, `ai_assistance_level`
- Utiliser le `modeRegistry` comme référence pour choisir le bon mode selon les objectifs du module

Modifier `generatePath` (si applicable) pour que lors de la génération d'un parcours complet, l'IA propose des modules de type "practice" avec des `practice_type` variés et pertinents au lieu de toujours créer des conversations.

### Bloc 5 — Gestion par organisation

**Fichier** : `src/components/admin/OrgSimulatorTab.tsx` (nouveau)

- Onglet dans la fiche organisation admin
- Liste des practices assignées à cette org
- Créer/dupliquer des practices spécifiques au contexte client
- Voir les stats de sessions par membre
- Configurer les modes autorisés et le niveau d'aide par défaut

**Fichier modifié** : `src/pages/admin/AdminOrganizationDetail.tsx` — Ajouter l'onglet

### Bloc 6 — Practices standalone (non liées à un module)

**Migration DB** : Rendre `module_id` nullable sur `academy_practices` (actuellement NOT NULL)

Cela permet de créer des practices indépendantes utilisables :
- Depuis le catalogue utilisateur `/simulator`
- Assignées à une organisation sans parcours
- Comme exercices libres

**Impact** : Mettre à jour les requêtes qui filtrent par `module_id` pour gérer le cas null.

---

## Résumé des fichiers

| Fichier | Action |
|---------|--------|
| `src/pages/Simulator.tsx` | Refonte — bouton Lancer, Dialog, onglets |
| `src/pages/admin/AdminSimulator.tsx` | Nouveau — dashboard admin simulateur |
| `src/pages/admin/AdminSimulatorTemplates.tsx` | Nouveau — bibliothèque templates |
| `src/components/admin/OrgSimulatorTab.tsx` | Nouveau — onglet org |
| `src/components/admin/AdminSidebar.tsx` | Modifié — entrée Simulateur |
| `src/App.tsx` | Modifié — routes admin |
| `src/pages/admin/AdminOrganizationDetail.tsx` | Modifié — onglet |
| `src/components/admin/AcademyPracticesTab.tsx` | Modifié — champ assistance |
| `src/components/simulator/SimulatorShell.tsx` | Modifié — conditionner aide |
| `src/components/simulator/modes/ChatMode.tsx` | Modifié — conditionner widgets |
| `supabase/functions/academy-practice/index.ts` | Modifié — injection assistance |
| `supabase/functions/academy-generate/index.ts` | Modifié — practice_type intelligent |
| Migration DB | `ai_assistance_level` + `module_id` nullable |

## Ordre d'exécution

1. **Migrations DB** (module_id nullable + ai_assistance_level)
2. **Bloc 6** — Practices standalone
3. **Bloc 1** — Catalogue utilisateur actionnable
4. **Bloc 3** — Paramétrage aide IA
5. **Bloc 2** — Admin Simulateur
6. **Bloc 5** — Onglet organisation
7. **Bloc 4** — Intégration génération parcours

