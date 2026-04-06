
# Plan — Modernisation UI "AI Value Builder" (UCM)

## Diagnostic

L'expérience UCM souffre de 5 problèmes majeurs :

1. **Scroll non contraint** : le header et sidebar scrollent avec le contenu car `<main>` dans `PortalShell` utilise `overflow-auto` mais le parent n'est pas contraint en hauteur (`min-h-0` manque, `h-screen` absent)
2. **Navigation plate** : les 6 tabs sont une `TabsList` basique sans indication de progression, sans breadcrumb contextuel montrant le projet + UC actif
3. **Markdown basique** : `UCMAnalysisView` et `UCMChat` utilisent `ReactMarkdown` brut au lieu de `EnrichedMarkdown` (callouts, tables premium, code blocks)
4. **Pages liste/création** : `PortalUCM` (projets) et `PortalUCMExplorer` sont des grilles élémentaires sans KPIs, sans filtres avancés
5. **Dialogs basiques** : `UCMContextForm` est un formulaire brut sans sections visuelles ni progression

## Plan d'implémentation

### 1. Fix scroll — Header et sidebar sticky (PortalShell)

**Fichier** : `src/components/portal/PortalShell.tsx`

- Changer le conteneur racine de `min-h-screen flex flex-col` en `h-screen flex flex-col overflow-hidden`
- Le header reste `sticky top-0` (déjà ok)
- Le body `flex flex-1 min-h-0` (ajouter `min-h-0` + `overflow-hidden`)
- Le `<main>` garde `overflow-auto` — c'est le **seul** élément qui scroll

### 2. Workflow stepper + breadcrumb projet (PortalUCMProject)

**Fichier** : `src/pages/portal/PortalUCMProject.tsx`

Remplacer la `TabsList grid-cols-6` par un **stepper horizontal premium** :
- Chaque étape = cercle numéroté + label + connecteur trait entre les étapes
- Couleur : complétée = primary, active = primary ring, future = muted
- Détection de complétion automatique : étape 1 OK si `project.company` + `project.context`, étape 2 si `project.sector_id`, etc.
- **Breadcrumb sticky** au-dessus du stepper : `Projet > {project.company}` + badge status + quotas restants
- Quand on est dans l'onglet Analyse avec un UC sélectionné, afficher un sous-breadcrumb `UC > {ucName}`

Layout de la page :
- Header projet sticky (breadcrumb + stepper) : `sticky top-0 z-30 bg-background/95 backdrop-blur border-b`
- Contenu sous le stepper scrolle normalement dans le `<main>` du PortalShell

### 3. Markdown Premium +++ partout (UCMAnalysisView, UCMChat, Synthèse)

**Fichiers** : `UCMAnalysisView.tsx`, `UCMChat.tsx`, `PortalUCMProject.tsx` (synthèse)

- Remplacer tous les `<ReactMarkdown>{content}</ReactMarkdown>` par `<EnrichedMarkdown content={content} />`
- Cela active automatiquement : callouts 💡/📜/⚠️, tables premium, code blocks avec header langue, h2/h3 avec accents visuels, images figcaption
- Import de `EnrichedMarkdown` depuis `@/components/academy/EnrichedMarkdown`

### 4. Page projets premium (PortalUCM)

**Fichier** : `src/pages/portal/PortalUCM.tsx`

- **KPI bar** en haut : 3 mini stats (Projets total, UC générés, Analyses ce mois) avec icônes colorées
- **Project cards** enrichies : ajouter un mini progress bar (étapes complétées sur 6), compteur UC + analyses, avatar secteur emoji en grand
- **Dialog création** : ajouter sélection de secteur inline (chips emoji) + textarea immersion, sections avec `Label` + `Separator`

### 5. UC Explorer premium (PortalUCMExplorer)

**Fichier** : `src/pages/portal/PortalUCMExplorer.tsx`

- **Filtres** : ajout de `Select` pour filtrer par projet, priorité, complexité, impact
- **Cards UC** : ajouter bordure gauche colorée par priorité (high=red, medium=amber, low=green), afficher nombre d'analyses existantes par UC
- **Vue toggle** : grille vs liste compacte

### 6. Dialog contexte UC premium (UCMContextForm)

**Fichier** : `src/components/ucm/UCMContextForm.tsx`

- Regrouper les 7 champs en 3 sections visuelles avec `Separator` :
  - "Situation actuelle" (situation, tools, team)
  - "Volumétrie & enjeux" (volumes, pain_points)
  - "Objectifs & contraintes" (objectives, constraints)
- Chaque section : icône + titre + background subtil `bg-muted/20 rounded-lg p-4`
- Indicateur de complétion : `X/7 champs renseignés`

### 7. Analyse view premium (UCMAnalysisView)

**Fichier** : `src/components/ucm/UCMAnalysisView.tsx`

- **Bordure gauche colorée** par section (process=blue, data=emerald, tech=violet, impact=amber, roadmap=primary, risks=red)
- **Icône en cercle coloré** dans le header de chaque section
- **Expand/collapse** : sections fermées par défaut (sauf si contenu), clic pour ouvrir
- **Progress bar** par UC : X sections sur 6 analysées

## Fichiers impactés

| Fichier | Action |
|---------|--------|
| `src/components/portal/PortalShell.tsx` | Fix scroll — h-screen + overflow contraint |
| `src/pages/portal/PortalUCMProject.tsx` | Réécrire — stepper workflow + breadcrumb sticky + EnrichedMarkdown |
| `src/components/ucm/UCMAnalysisView.tsx` | Upgrade — couleurs, collapse, progress, EnrichedMarkdown |
| `src/components/ucm/UCMChat.tsx` | Upgrade — EnrichedMarkdown pour les réponses IA |
| `src/pages/portal/PortalUCM.tsx` | Upgrade — KPIs + cards enrichies + dialog premium |
| `src/pages/portal/PortalUCMExplorer.tsx` | Upgrade — filtres + cards colorées |
| `src/components/ucm/UCMContextForm.tsx` | Upgrade — sections groupées + indicateur complétion |

## Ordre d'exécution

1. **PortalShell scroll fix** (impacte toutes les pages portal)
2. **PortalUCMProject** (page principale — stepper + breadcrumb + EnrichedMarkdown)
3. **UCMAnalysisView** (composant critique — couleurs + collapse + markdown)
4. **UCMChat** (EnrichedMarkdown)
5. **PortalUCM** (page liste projets)
6. **PortalUCMExplorer** (page explorer)
7. **UCMContextForm** (dialog)
