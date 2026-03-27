

# Challenger le plan — Analyse critique pour un rendu Tier-One

## Problemes fondamentaux du plan actuel

### 1. Le Dialog fullscreen reste — c'est l'erreur architecturale centrale

Le plan propose de supprimer le header du Dialog et fusionner dans SimulatorShell. Mais le vrai probleme est que le **Dialog couvre 100% du viewport** (`h-[100dvh]`), supprimant tout contexte plateforme (sidebar, navigation). L'utilisateur perd ses repères.

**Challenge** : Remplacer le Dialog par une **route dédiée** `/simulator/session` qui s'affiche dans l'AppShell. L'AppShell (ligne 38) exclut déjà certaines routes du chrome — on ajoute le simulateur comme route normale (avec sidebar). Le header plateforme reste visible, la navigation aussi.

Impact : `Simulator.tsx` ne gère plus de Dialog. On crée `SimulatorSession.tsx` comme page. L'utilisateur navigue avec `navigate("/simulator/session", { state: simConfig })`.

### 2. Le briefing est tronqué à 160px — anti-pattern Atlassian

Le plan mentionne "supprimer max-h" mais ne définit pas la structure Atlassian. Un briefing Atlassian-grade doit être :

```text
┌────────────────────────────────────────────────┐
│  🎯  BRIEFING                          [▼ ▲]  │
├────────────────────────────────────────────────┤
│                                                │
│  CONTEXTE                                      │
│  ──────────────────────────────────             │
│  Paragraphe contexte...                        │
│                                                │
│  VOTRE MISSION                                 │
│  ──────────────────────────────────             │
│  Instructions...                               │
│                                                │
│  CRITÈRES D'ÉVALUATION                         │
│  ┌──────┐ ┌──────────┐ ┌────────┐              │
│  │ Strat │ │ Commun.  │ │ Impact │              │
│  └──────┘ └──────────┘ └────────┘              │
│                                                │
│  💡 Commencez par analyser le contexte...      │
│                                                │
└────────────────────────────────────────────────┘
```

- Pas de max-height — le briefing est le premier élément dans la scrollable area, pas un header fixe
- Sections avec titres uppercase, séparateurs, badges pour les critères
- Collapsible seulement APRÈS le premier message utilisateur
- Fond `bg-card` avec `border border-border/50 shadow-sm rounded-xl`, pas border-l-4

### 3. Le SimulatorShell a un double rôle : header + layout

Actuellement il fait header + objectives panel + help drawer + children. Si on passe à une route, le shell se simplifie : juste un toolbar compact + children. Le header plateforme (AppShell) fait le reste.

### 4. Les messages assistant manquent de personnalité

Le plan dit "bg-card border" mais ne pousse pas assez. Pour du tier-one :
- Avatar IA avec gradient (petit cercle coloré, pas d'icône)
- Timestamp discret sous chaque message
- Animation d'apparition par ligne (typewriter feel via le streaming déjà en place)
- Séparateur visuel entre les échanges (pas juste `space-y-4`)

### 5. L'input zone est générique

Pour un centre de formation premium, l'input doit communiquer la confiance :
- Placeholder contextuel selon le mode ("Proposez votre stratégie...", "Décrivez votre approche...")
- Compteur de caractères discret
- Micro-label au-dessus ("Votre réponse" avec le numéro d'échange "2/8")

---

## Plan révisé — Haut niveau de rendu

### Bloc 1 : Route dédiée (suppression du Dialog)

| Fichier | Action |
|---------|--------|
| `src/pages/SimulatorSession.tsx` | **Nouveau** — récupère state depuis `useLocation`, rend `SimulatorEngine` en pleine page |
| `src/App.tsx` | Ajout route `/simulator/session` |
| `src/pages/Simulator.tsx` | Supprimer Dialog, `navigate()` vers la route avec state |
| `src/components/layout/AppShell.tsx` | S'assurer que `/simulator/session` n'est PAS exclu du chrome (sidebar visible) |

### Bloc 2 : Briefing Atlassian dans tous les modes

Pattern commun extrait en composant `BriefingCard.tsx` :
- Parse le Markdown du scénario pour identifier les sections (Contexte, Mission, Critères)
- Rendu structuré avec `Separator`, icônes par section (Target, BookOpen, Award), badges critères
- Collapsible : ouvert au départ, se ferme après le premier `sendMessage`
- Placé DANS le scroll area comme premier élément (pas en header fixe)
- Fond blanc, `rounded-xl border shadow-sm`, padding `p-5`

| Fichier | Action |
|---------|--------|
| `src/components/simulator/widgets/BriefingCard.tsx` | **Nouveau** — composant réutilisable |
| `ChatMode.tsx`, `AnalysisMode.tsx`, `CodeMode.tsx` | Remplacer le Collapsible inline par `<BriefingCard>` |

### Bloc 3 : Messages premium + Input contextuel

- Messages assistant : avatar gradient circle (6px) + `bg-card border-border/40 shadow-sm rounded-xl`
- Messages user : `bg-primary rounded-xl` (déjà OK)
- Input : placeholder dynamique par practiceType, label "Réponse 2/8" au-dessus
- Compteur caractères discret (`text-muted-foreground text-[11px]`)

| Fichier | Action |
|---------|--------|
| `ChatMode.tsx` | Messages + input enrichis |
| `CodeMode.tsx` | Même pattern côté chat |

### Bloc 4 : SimulatorShell allégé

- Puisque le header plateforme est visible (route, pas Dialog), le shell devient une toolbar compacte :
  - Titre + badge univers + progress bar + boutons (Objectifs, Aide IA, Reset)
  - Hauteur : `h-12` max
  - Fond : `bg-card/80 backdrop-blur border-b`

| Fichier | Action |
|---------|--------|
| `SimulatorShell.tsx` | Simplification header, suppression doublon |

### Ordre d'exécution

1. Route + suppression Dialog (Bloc 1)
2. BriefingCard component (Bloc 2)
3. Messages + Input premium (Bloc 3)
4. Shell allégé (Bloc 4)

