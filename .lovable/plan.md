

# Diagnostic & Plan de correction — Structuration, Aide IA intégrée & Design Premium

## Problemes identifiés (captures analysées)

### 1. Briefing qui envahit tout l'espace droit
Le scénario riche généré par `generateRichScenario()` est injecté comme premier message assistant dans CodeMode. Il contient titre, compétences, critères, conseils — occupant 80% du panel droit. L'input est visible mais le contexte utile (réponses IA) sera noyé sous ce mur de texte. Le briefing doit etre une **card compacte et repliable** en haut du chat, pas un message plein écran.

### 2. HelpDrawer déconnecté du contexte
Le drawer se superpose en `position: absolute` sur le bord droit, couvrant le contenu au lieu de s'intégrer. Dans un layout split (CodeMode = editeur + chat), il devrait remplacer ou s'insérer dans le flux, pas flotter dessus.

### 3. Design non-premium
- Fond `bg-muted/20` grisatre sur le header code et le scoring — aspect terne
- Badge `text-[9px]` illisible pour "typescript"
- Icones basiques (Code, Copy) sans couleur ni poids visuel
- Espacement `px-3 py-2` trop serré pour le header code, mais trop généreux pour le briefing
- Messages assistant en `bg-muted` (gris) — pas tier-one

## Plan de corrections

### Fichier 1 — `CodeMode.tsx` : Briefing compact + design premium

**Briefing card repliable** : Le message `id === "scenario"` ne s'affiche plus comme un message chat. Il est rendu dans une card dédiée en haut du panel droit avec :
- Border-left primary (4px)
- Titre tronqué + bouton expand/collapse
- État replié par défaut après la première interaction
- Max-height 120px replié, scroll interne déplié

**Design premium** :
- Header code : fond blanc pur, separator subtil, badge language en `text-xs` (pas 9px)
- Messages assistant : `bg-card border border-border/40 shadow-sm` au lieu de `bg-muted`
- Input area : fond blanc, border plus visible, placeholder plus explicite

### Fichier 2 — `SimulatorShell.tsx` : HelpDrawer intégré dans le layout

Remplacer le positionnement `absolute` du HelpDrawer par un **panel intégré au flux** :
- Quand `showHelp = true`, le children (mode) perd de la largeur et le HelpDrawer prend `w-80` à droite dans un flex row
- Le shell devient `<div class="flex-1 flex min-h-0 overflow-hidden">` avec children + helpDrawer côte à côte
- Le HelpDrawer n'est plus `absolute` mais un élément flex normal
- Transition fluide via `AnimatePresence` avec animation de largeur

### Fichier 3 — `HelpDrawer.tsx` : Design intégré + enrichissement

- Supprimer `absolute inset-y-0 right-0` — devient un composant flex normal
- Augmenter la taille du header (fond blanc, titre plus grand)
- Messages avec fond `bg-card` + border au lieu de `bg-muted`
- Quick questions avec icones et meilleur padding
- Input height `h-9` au lieu de `h-8`

### Fichier 4 — `SimulatorInsightPanel.tsx` : Raffinement visuel

- Critères d'évaluation : barres avec dégradé primaire au lieu de dots plats
- Sections avec icones colorées (pas toutes `text-primary`)
- Conseils : numérotation avec pastilles colorées au lieu de chiffres bruts
- Fond de l'exemple : `bg-primary/5 border-primary/20` au lieu de `bg-muted/50`

### Fichier 5 — `OnboardingOverlay.tsx` : Resserrer le contenu

- Moins d'espace vide, plus de contenu utile dans le viewport visible
- Section "Comment ça marche" avec 3 étapes horizontales (pas verticales)

## Fichiers modifiés

| Fichier | Action |
|---------|--------|
| `src/components/simulator/modes/CodeMode.tsx` | Briefing card repliable + design premium chat |
| `src/components/simulator/SimulatorShell.tsx` | Layout flex intégré pour HelpDrawer |
| `src/components/simulator/widgets/HelpDrawer.tsx` | Position relative + design enrichi |
| `src/components/simulator/widgets/SimulatorInsightPanel.tsx` | Raffinement visuel premium |
| `src/components/simulator/modes/ChatMode.tsx` | Meme traitement briefing card |
| `src/components/simulator/modes/AnalysisMode.tsx` | Meme traitement briefing card |

## Ordre

1. SimulatorShell + HelpDrawer (intégration layout)
2. CodeMode (briefing card + design)
3. ChatMode + AnalysisMode (meme pattern)
4. SimulatorInsightPanel (polish)

