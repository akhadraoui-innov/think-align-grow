

# Audit systémique du Simulateur — Diagnostic & Corrections

## Problèmes identifiés (analyse de la capture d'écran)

### P0 — Critique : Champ de saisie invisible
La chaîne flex est correcte en théorie (`flex-col h-full` → `flex-1 min-h-0`) mais le Dialog fullscreen (100dvh) **+ le header Dialog + le header SimulatorShell + les badges critères** consomment ~120px de hauteur. Le scénario Markdown dans AnalysisMode (beige card) remplit tout l'espace restant. L'input est en dessous mais **poussé hors viewport** car le `overflow-y-auto` sur le chat scroll ne contraint pas correctement quand le contenu initial est massif. Le problème est amplifié en AnalysisMode car le left panel (w-72) + le right panel doivent TOUS DEUX être en `h-full` avec overflow contraint.

**Correction** : Forcer `overflow: hidden` sur les conteneurs parents intermédiaires et s'assurer que chaque niveau de la chaîne flex a `min-h-0`.

### P1 — Headers dupliqués / hors plateforme
Le Dialog crée son propre header (ligne 413-425 de Simulator.tsx) ET SimulatorShell a son propre header (ligne 64-124). Résultat : **2 barres de header** + perte du header AppShell plateforme. L'utilisateur se retrouve dans un contexte déconnecté.

**Correction** : Supprimer le header du Dialog et fusionner les infos dans le header du SimulatorShell. Alternative : remplacer le Dialog fullscreen par une route dédiée `/simulator/session/:key` intégrée dans l'AppShell — mais c'est plus complexe. Pour l'instant, fusionner les headers et garder le Dialog mais avec un seul header propre.

### P2 — Design "non-premium"
- **Fond beige/crème** sur le scénario (bg-muted → `hsl(var(--muted))`) : donne un aspect "papier journal", pas tier-one
- **Polices trop petites** : text-[10px], text-[9px] partout — illisible et non-professionnel
- **Icônes génériques** : pas de couleurs différenciées pour les sections
- **Espacements serrés** : padding 2-3 trop compact pour un environnement de formation premium
- **Pas de hiérarchie visuelle** : le briefing, les findings et le chat ont le même poids visuel

**Correction** : 
- Fond blanc pur pour le chat, fond `bg-muted/5` subtil pour le left panel
- Taille minimum `text-xs` (12px) sauf badges
- Padding `p-4` minimum partout
- Sections avec titres plus grands et séparateurs
- Messages assistant avec fond blanc + border au lieu de bg-muted

### P3 — Bouton aide IA trop estompé
Le bouton HelpCircle dans SimulatorShell est `variant="ghost" size="icon" className="h-7 w-7"` — invisible, surtout en mode guidé/intensif où l'aide est le cœur de la proposition de valeur.

**Correction** : En mode `guided`/`intensive`, rendre le bouton plus visible : `variant="outline"` avec un badge "Aide IA" texte, une animation pulse subtile au premier affichage, et une couleur primary.

### P4 — OnboardingOverlay bypassed sans guidance
L'overlay se dismiss avec un seul clic "Commencer" et l'utilisateur tombe directement dans l'interface sans savoir quoi faire. Le scénario Markdown est affiché comme un message assistant brut, pas comme un briefing structuré.

**Correction** : Après l'onboarding, afficher le scénario dans un conteneur dédié "briefing card" au-dessus du chat (pas comme un message), avec un call-to-action clair "Commencez par écrire votre première réponse ci-dessous".

---

## Plan de corrections

### Fichiers modifiés

| Fichier | Corrections |
|---------|-------------|
| `src/pages/Simulator.tsx` | Supprimer le header dupliqué du Dialog, passer le titre/badges au SimulatorShell via props, forcer `overflow-hidden` sur le conteneur |
| `src/components/simulator/SimulatorShell.tsx` | Accepter props `title`, `universeBadge`, `onClose` pour fusionner les headers. Bouton aide IA visible (outline + texte). Forcer `min-h-0 overflow-hidden` sur le conteneur children |
| `src/components/simulator/modes/AnalysisMode.tsx` | Fix layout : `h-full overflow-hidden` sur root, `min-h-0` sur chaque flex child. Design premium : fond blanc chat, left panel plus aéré, input toujours visible |
| `src/components/simulator/modes/ChatMode.tsx` | Même fix layout. Messages assistant : fond blanc + border. Scénario initial dans un "briefing card" dédié au lieu d'un message bulle |
| `src/components/simulator/widgets/OnboardingOverlay.tsx` | Polices plus grandes, espacement premium |
| `src/components/simulator/widgets/HelpDrawer.tsx` | Vérifier qu'il se superpose correctement |

### Corrections détaillées

**1. Fix input invisible (P0)**
```
// Simulator.tsx Dialog content
<div className="flex flex-col h-full overflow-hidden">
  {/* NO duplicate header — SimulatorShell handles it */}
  <div className="flex-1 min-h-0 overflow-hidden">
    <SimulatorEngine ... onClose={() => setActiveSim(null)} title={...} />
  </div>
</div>

// SimulatorShell
<div className="flex flex-col h-full overflow-hidden">
  <header /> {/* merged header with close button */}
  <div className="flex-1 min-h-0 overflow-hidden">
    {children}
  </div>
</div>

// AnalysisMode / ChatMode
<div className="flex h-full overflow-hidden">
  <aside className="w-72 flex flex-col overflow-hidden" />
  <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
    <div className="flex-1 min-h-0 overflow-y-auto" /> {/* messages */}
    <div className="shrink-0 p-4 border-t" /> {/* input — ALWAYS visible */}
  </main>
</div>
```

**2. Header fusionné (P1)**
- Supprimer le header dans le Dialog de Simulator.tsx (lignes 413-425)
- Ajouter props `onClose`, `sessionTitle`, `badges` au SimulatorShell
- Le SimulatorShell affiche : icon univers + titre + badges + bouton close (X)

**3. Design premium (P2)**
- Messages assistant : `bg-white border border-border/50 shadow-sm` au lieu de `bg-muted`
- Left panel AnalysisMode : `bg-card` avec border propre, titres en `text-sm font-semibold`
- Briefing dans une card dédiée au-dessus du chat : fond blanc, border-l-4 primary, typographie claire
- Minimum `text-xs` (jamais text-[9px] ou text-[10px] pour du contenu)

**4. Bouton aide visible (P3)**
- En mode guided/intensive : `variant="outline"` + texte "Aide IA" + `border-primary/30`
- Animation `animate-pulse` une seule fois au mount (puis static)
- Icône colorée en primary

### Ordre d'exécution

1. Fix layout overflow (SimulatorShell + AnalysisMode + ChatMode) — résout P0
2. Fusionner headers (Simulator.tsx + SimulatorShell) — résout P1
3. Design premium (tous les modes) — résout P2 + P3
4. Test visuel

