

## Plan : Simplifier la hiérarchie de headers du Challenge

### Problème actuel — 4 niveaux de headers empilés

```text
┌─ WorkshopToolbar ──────────────────────────────────────┐  ← niveau 1 (outils canvas, zoom, participants)
├─ Mode toggle (Canvas libre | Challenge) ───────────────┤  ← niveau 2
├─ ChallengeView stepper (onglets sujets + vue + analyser)┤ ← niveau 3  
├─ Subject header (type badge + titre + description) ────┤  ← niveau 4
│  Contenu (slots/grille)                                │
└────────────────────────────────────────────────────────┘
```

### Objectif — Un seul header rationalisé

```text
┌─ Header unique ────────────────────────────────────────┐
│ [←] Nom workshop | Onglets sujets [◀▶] | Vue | Analyser│
├────────────────────────────────────────────────────────┤
│ Type badge + Titre sujet + Description                 │
│ Slots / Grille (scrollable)                            │
└────────────────────────────────────────────────────────┘
```

### Modifications

**`WorkshopRoom.tsx`**
- Supprimer la barre de toggle "Canvas libre / Challenge" (lignes 322-352)
- Forcer `workshopMode = "challenge"` quand un template existe (pas de mode canvas)
- Remplacer le `<WorkshopToolbar>` complet par un header minimal : bouton retour, nom du workshop, badge statut, participants, contrôles host (démarrer/pause/terminer), et les contrôles edit/read-only pour les workshops terminés
- Supprimer les props liées au canvas (zoom, mode, snap, fit, icon, shapes) du header

**`ChallengeView.tsx`**
- Le stepper (onglets sujets, navigation, vue liste/board, bouton analyser) reste tel quel — c'est le coeur de la navigation
- Pas de changement

**`SubjectCanvas.tsx` / `ChallengeBoard.tsx`**
- Le header du sujet (type badge + titre + description) reste — c'est le contexte de la question
- Pas de changement

### Fichiers impactés

| Fichier | Modification |
|---|---|
| `WorkshopRoom.tsx` | Supprimer toggle canvas/challenge, remplacer WorkshopToolbar par header minimal |

