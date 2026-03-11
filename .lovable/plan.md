

## Refonte des Dialogs admin — UX par étapes avec identité visuelle

### Constat
Tous les dialogs de création admin (template, toolkit, organisation, équipe...) utilisent un formulaire plat basique dans un `DialogContent` standard. Pas de progression visuelle, pas d'étapes, pas d'intégration forte avec l'identité de la plateforme.

### Approche
Créer un composant `StepDialog` réutilisable qui structure les dialogs en étapes visuelles, avec une barre de progression, des transitions animées (framer-motion), et le style éditorial de la plateforme (orange brûlé, rounded-2xl, ombres profondes).

### Composant `StepDialog`

Nouveau fichier `src/components/admin/StepDialog.tsx` :

```text
┌─────────────────────────────────────────┐
│  [Icône]  Titre du dialog               │
│  Sous-titre contextuel                  │
│                                         │
│  ● ─── ○ ─── ○    Étape 1/3            │
│                                         │
│  ┌─────────────────────────────────┐    │
│  │  Contenu de l'étape courante    │    │
│  │  (rendu via children/render)    │    │
│  └─────────────────────────────────┘    │
│                                         │
│  [Précédent]              [Suivant →]   │
│           ou [Créer] à la dernière      │
└─────────────────────────────────────────┘
```

Props :
- `steps: { title: string; description?: string; icon?: LucideIcon; content: ReactNode }[]`
- `open / onOpenChange`
- `onComplete: () => void`
- `completing?: boolean`
- `title, icon`

Features :
- Barre de progression segmentée avec dots + lignes (couleur primary/orange)
- Animation `framer-motion` slide entre étapes (AnimatePresence + direction)
- Boutons Précédent / Suivant avec validation par étape (prop `canProceed` par step)
- Style : `rounded-2xl`, `shadow-elevated`, gradient subtil en header, icône avec `GradientIcon`

### Refonte des dialogs existants

**1. `AdminDesignInnovation.tsx` — Nouveau template (3 étapes)**
- Étape 1 — Identité : Nom + Description
- Étape 2 — Configuration : Toolkit (select) + Difficulté (select)  
- Étape 3 — Récapitulatif : preview de ce qui va être créé, bouton "Créer le template"

**2. `AdminToolkits.tsx` — Nouveau toolkit (3 étapes)**
- Étape 1 — Identité : Emoji + Nom + Slug
- Étape 2 — Détails : Description + Statut
- Étape 3 — Récapitulatif + Créer

**3. `AdminOrganizations.tsx` — Nouvelle organisation (2-3 étapes)**
- Pattern identique adapté aux champs existants

**4. `OrgTeamsTab.tsx`, `ToolkitOrgsTab.tsx`, `UserOrgsTab.tsx`**
- Dialogs plus simples (1-2 champs) : pas de multi-étapes, mais même style visuel amélioré (header avec icône gradient, rounded-2xl, shadow)

### Style visuel (intégré à l'identité)
- Header : fond `bg-gradient-to-r from-primary/5 to-accent/5`, icône en `GradientIcon`, titre en `font-display`
- Progress : dots orange reliés par lignes, step actif = filled, futurs = outline
- Contenu : padding généreux, labels en `text-xs uppercase tracking-wider text-muted-foreground`
- Footer : sticky, backdrop-blur, boutons avec variant primary (orange) pour l'action principale
- Transitions : `framer-motion` avec slide horizontal directionnel

### Fichiers

| Fichier | Action |
|---------|--------|
| `src/components/admin/StepDialog.tsx` | Créer — composant réutilisable multi-étapes |
| `src/pages/admin/AdminDesignInnovation.tsx` | Refonte dialog → 3 étapes via StepDialog |
| `src/pages/admin/AdminToolkits.tsx` | Refonte dialog → 3 étapes via StepDialog |
| `src/pages/admin/AdminOrganizations.tsx` | Refonte dialog → StepDialog |
| `src/components/admin/OrgTeamsTab.tsx` | Style amélioré (header gradient, rounded) |
| `src/components/admin/ToolkitOrgsTab.tsx` | Style amélioré |
| `src/components/admin/UserOrgsTab.tsx` | Style amélioré |

