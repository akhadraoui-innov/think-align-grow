
## Diagnostic confirmé

`EnrichedMarkdown` ne traite pas ` ```mermaid ` → blocs affichés en code source brut. Lib non installée.

## Plan v2 (qualité premium + interactivité)

### Étape 1 — Dépendances
```bash
bun add mermaid svg-pan-zoom
```
- `mermaid` (~600kb, lazy-loadé)
- `svg-pan-zoom` (~14kb, pour pan/zoom natif)

### Étape 2 — Composant `MermaidDiagram.tsx` (nouveau)

**Localisation** : `src/components/academy/MermaidDiagram.tsx`

**Architecture** :
- **Lazy-load** : `import('mermaid')` dynamique au mount du premier diagramme (réduit le bundle initial)
- **Theme intégré au design system** :
  - `theme: 'base'` + `themeVariables` mappés sur les CSS vars (`--primary`, `--background`, `--border`, `--foreground`, `--muted`, `--accent`)
  - Police héritée (`fontFamily: 'inherit'`) → Inter en body, font-display sur titres
  - Re-render automatique sur changement light/dark via MutationObserver sur `<html class>`
- **Validation** : `mermaid.parse(chart)` avant `render()` pour catcher syntaxe invalide proprement
- **Cycle de vie** :
  - `useMemo(id)` stable
  - `useEffect` déclenché uniquement si `chart` change (hash) ou theme switch
  - Skeleton pendant render async
- **Accessibilité** : `role="img"` + `aria-label` dérivé du premier nœud du graphe, focus visible, raccourcis clavier

**Toolbar interactive (overlay top-right, visible au hover)** :
- Zoom + / - / Reset (icônes lucide `ZoomIn` `ZoomOut` `Maximize2`)
- Plein écran : ouvre `Dialog` shadcn fullscreen avec re-render dans grand canvas
- Télécharger SVG : `download="diagram.svg"` avec blob
- Voir le code : Collapsible révélant `<pre>` du source mermaid (utile en pédagogie + debug)

**Pan & Zoom** : 
- Wrapper `svg-pan-zoom` initialisé sur le SVG après render
- Molette = zoom, drag = pan, double-click = reset
- Désactivé si diagramme petit (auto-fit dans le container)

**Fallback erreur** :
- Card avec icône `AlertTriangle` + message "Diagramme indisponible (syntaxe invalide)"
- Source code repliable avec syntax highlighting basique
- `console.warn` pour debug

**Wrapper visuel** :
```tsx
<div className="my-6 rounded-xl border bg-muted/20 overflow-hidden group relative">
  <div className="flex justify-center p-6 min-h-[200px]">{/* SVG */}</div>
  <Toolbar /> {/* overlay */}
</div>
```

### Étape 3 — Patcher `EnrichedMarkdown.tsx`

Dans le handler `code`, AVANT la branche `isBlock`, intercepter mermaid :
```tsx
if (className === "language-mermaid") {
  return <MermaidDiagram chart={String(children).trim()} />;
}
```

### Étape 4 — Test visuel
- Créer un parcours de test avec 3 diagrammes : flowchart simple, sequence, gantt
- Vérifier rendu light + dark
- Vérifier pan/zoom + plein écran + download
- Vérifier fallback avec un mermaid volontairement cassé

### Étape 5 — Documentation
- Note release dédiée : `docs/releases/v2.9.8-mermaid-rendering.md`
- MAJ index `docs/releases/README.md`
- Nouvelle mémoire `mem://features/academy/mermaid-rendering` :
  > Tous les blocs ` ```mermaid ` dans EnrichedMarkdown sont rendus via MermaidDiagram (lazy-load, themed via CSS vars, pan/zoom svg-pan-zoom, plein écran, download SVG, fallback gracieux). Toolbar visible au hover.

## Hors scope

- Pas d'éditeur visuel mermaid (pas demandé)
- Pas de génération de diagramme via IA dans l'admin (la prompt IA produit déjà du mermaid valide pour 95% des cas)
- Pas de migration des fallbacks `<pre>` existants côté UCM/Simulator (ces composants utilisent leurs propres renderers)

## Détails techniques

| Aspect | Choix | Justification |
|---|---|---|
| Lib mermaid | v11 (latest) | Support flowchart/sequence/gantt/ER/state/mindmap/timeline/sankey/quadrant |
| Lazy-load | `await import('mermaid')` | -600kb du bundle initial |
| Theme | `base` + CSS vars | Cohérence design system, support light/dark auto |
| Pan/Zoom | `svg-pan-zoom` 14kb | Plus léger et stable que mermaid built-in zoom |
| Sécurité | `securityLevel: 'strict'` | Empêche injection HTML dans diagrammes IA-générés |
| Performance | useMemo + skeleton | Évite re-render inutiles, UX fluide |
