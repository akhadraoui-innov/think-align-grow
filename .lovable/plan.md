
## Plan en 2 actions ciblées

### Action 1 — Hotfix CSS Mermaid (PRIORITAIRE, sans régénération)

**Problème identifié** : Mes `themeVariables` v2.9.8 ont du texte blanc sur fond blanc (cf. capture 1). Cause = `primaryTextColor: --primary-foreground` (blanc) appliqué à des nœuds dont le fond résolu est blanc/clair.

**Correctif dans `src/components/academy/MermaidDiagram.tsx`** (fonction `getThemeVars`) :

```ts
return {
  // Nœuds : fond CLAIR avec bordure primary, texte FONCÉ
  primaryColor: hsl("--background") || "#FFFFFF",      // fond du nœud (blanc)
  primaryTextColor: hsl("--foreground") || "#111827",  // texte du nœud (foncé)
  primaryBorderColor: hsl("--primary") || "#F97316",   // bordure orange
  
  // Nœuds secondaires (decisions, etc.)
  secondaryColor: hsl("--muted") || "#F3F4F6",
  secondaryTextColor: hsl("--foreground") || "#111827",
  secondaryBorderColor: hsl("--primary") || "#F97316",
  
  tertiaryColor: hsl("--accent") || "#FEF3C7",
  tertiaryTextColor: hsl("--foreground") || "#111827",
  tertiaryBorderColor: hsl("--primary") || "#F97316",
  
  // Liens
  lineColor: hsl("--muted-foreground") || "#6B7280",   // arêtes plus visibles
  
  // Labels d'arêtes : fond opaque du background pour masquer la ligne dessous
  edgeLabelBackground: hsl("--background") || "#FFFFFF",
  
  // Texte général
  textColor: hsl("--foreground") || "#111827",
  titleColor: hsl("--foreground") || "#111827",
  
  // Backgrounds globaux
  background: "transparent",
  mainBkg: hsl("--background") || "#FFFFFF",
  
  // Cluster (sub-graph)
  clusterBkg: hsl("--muted") || "#F3F4F6",
  clusterBorder: hsl("--border") || "#E5E7EB",
  
  // Notes (sequence diagrams)
  noteBkgColor: hsl("--accent") || "#FEF3C7",
  noteTextColor: hsl("--foreground") || "#111827",
  noteBorderColor: hsl("--primary") || "#F97316",
  
  fontFamily: "inherit",
};
```

Bonus : ajouter dans le wrapper SVG un CSS `[&_.edgeLabel]:!bg-background [&_.edgeLabel_p]:!bg-background` pour forcer l'opacité des labels d'arêtes (mermaid les laisse parfois transparents).

**Effet immédiat** : tous les Mermaid existants en base s'affichent correctement, sans régénérer un seul contenu.

### Action 2 — Améliorer le prompt IA (préventif pour les futurs contenus)

**Problème** : L'IA produit parfois de l'ASCII-art (capture 2) au lieu de Mermaid → diagrammes inutilisables visuellement.

**Patch dans `supabase/functions/academy-generate/index.ts`** : ajouter une consigne stricte dans la directive système des prompts qui génèrent du contenu pédagogique markdown :

```
DIAGRAMMES — RÈGLE STRICTE :
Pour TOUT schéma, organigramme, flux de processus, architecture ou diagramme
de relations, tu DOIS utiliser un bloc ```mermaid valide.
INTERDIT : ASCII-art (pipes, slashes, dashes pour dessiner).
INTERDIT : décrire visuellement avec du texte.
Types autorisés : flowchart TD/LR, sequenceDiagram, erDiagram,
classDiagram, stateDiagram-v2, gantt, mindmap, timeline.
Mermaid valide = pas d'accents dans les IDs (utilise des labels entre crochets/guillemets).
```

**Effet** : les nouveaux contenus générés (et les régénérations futures) auront systématiquement de vrais diagrammes interactifs.

### Pas de régénération massive

- Les contenus actuels redeviennent corrects via Action 1 (CSS fix)
- Les contenus avec ASCII-art existants restent en ASCII (toléré pédagogiquement) sauf régénération volontaire pilotée par l'utilisateur sur les modules concernés

## Documentation

- Patch dans la release v2.9.8 existante (note "hotfix CSS theming + prompt IA")
- Pas de nouvelle release dédiée

## Hors scope

- Pas de migration automatique ASCII → Mermaid (trop risqué sans curation humaine)
- Pas de bouton "régénérer ce module avec diagrammes Mermaid" (à envisager comme feature séparée si besoin récurrent)
