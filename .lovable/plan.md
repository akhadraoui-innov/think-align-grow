
# Plan — Modernisation UI "AI Value Builder" (UCM)

## Diagnostic

L'expérience UCM souffre de 5 problèmes majeurs :

1. **Scroll non contraint** : header et sidebar scrollent avec le contenu — le conteneur racine de PortalShell utilise `min-h-screen` au lieu de `h-screen overflow-hidden`, et le body flex manque `min-h-0`
2. **Navigation plate** : 6 tabs basiques sans progression, sans breadcrumb projet/UC
3. **Markdown basique** : `UCMAnalysisView`, `UCMChat` et la synthèse utilisent `ReactMarkdown` brut au lieu de `EnrichedMarkdown`
4. **Pages liste élémentaires** : pas de KPIs, pas de filtres
5. **Dialogs bruts** : `UCMContextForm` sans sections visuelles

## Changements

### 1. Fix scroll — PortalShell.tsx

- Ligne 60 : `min-h-screen` → `h-screen overflow-hidden`
- Ligne 154 : ajouter `min-h-0 overflow-hidden` au flex body
- `<main>` garde `overflow-auto` — seul élément scrollable

### 2. PortalUCMProject.tsx — Stepper workflow + breadcrumb sticky

Réécrire la navigation :
- **Breadcrumb sticky** : `Projet > {company}` + badge status + quotas, `sticky top-0 z-30 bg-background/95 backdrop-blur border-b`
- **Stepper horizontal** : 6 cercles numérotés avec connecteurs, couleurs par complétion (complété=primary, actif=ring, futur=muted)
- Complétion automatique : étape 1 OK si company+context, étape 2 si sector_id, étape 3 si useCases.length>0, etc.
- Remplacer les 3 `<ReactMarkdown>` (synthèse, analyses) par `<EnrichedMarkdown>`

### 3. UCMAnalysisView.tsx — Premium

- Bordure gauche colorée par section (process=blue, data=emerald, tech=violet, impact=amber, roadmap=primary, risks=red)
- Icône en cercle coloré
- Collapsible par défaut (Collapsible shadcn)
- Progress bar : X/6 sections analysées par UC
- `ReactMarkdown` → `EnrichedMarkdown`

### 4. UCMChat.tsx — Markdown premium

- Réponses IA : `ReactMarkdown` → `EnrichedMarkdown`

### 5. PortalUCM.tsx — Page projets premium

- 3 KPI cards en haut (projets, UC total, analyses)
- Cards projet enrichies : progress bar étapes, emoji secteur, compteurs
- Dialog création premium avec `Label`, `Separator`, chips secteur

### 6. PortalUCMExplorer.tsx — Filtres + cards premium

- Select filtres : projet, priorité, complexité
- Cards avec bordure gauche colorée par priorité
- Compteur analyses par UC

### 7. UCMContextForm.tsx — Sections groupées

- 3 sections visuelles : "Situation actuelle", "Volumétrie", "Objectifs"
- Chaque section : icône + fond subtil `bg-muted/20 rounded-lg p-4`
- Indicateur `X/7 champs renseignés`

## Fichiers impactés

| Fichier | Action |
|---------|--------|
| `src/components/portal/PortalShell.tsx` | Fix scroll |
| `src/pages/portal/PortalUCMProject.tsx` | Réécrire — stepper + breadcrumb + EnrichedMarkdown |
| `src/components/ucm/UCMAnalysisView.tsx` | Upgrade — couleurs, collapse, EnrichedMarkdown |
| `src/components/ucm/UCMChat.tsx` | EnrichedMarkdown |
| `src/pages/portal/PortalUCM.tsx` | KPIs + cards enrichies |
| `src/pages/portal/PortalUCMExplorer.tsx` | Filtres + cards colorées |
| `src/components/ucm/UCMContextForm.tsx` | Sections groupées |

## Ordre : 1→2→3→4→5→6→7
