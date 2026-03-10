

## Améliorations du Challenge Canvas

### Résumé des 4 demandes

1. **Zone de tri libre** — Pouvoir déposer des cartes hors des blocs pour les pré-sélectionner et changer leur format d'affichage
2. **Plusieurs cartes par bloc** — Chaque bloc accepte N cartes, avec un format sélectionnable (compact/normal/étendu) indiquant l'importance
3. **Niveau de maturité par carte** — Sélecteur 1-5 sur chaque carte placée dans un bloc
4. **Classement intra-bloc** — Réordonner les cartes par drag au sein d'un bloc (position = importance)

### Changements base de données

Ajouter 3 colonnes à `challenge_responses` :

```sql
ALTER TABLE challenge_responses 
  ADD COLUMN format text NOT NULL DEFAULT 'normal',      -- 'compact' | 'normal' | 'expanded'
  ADD COLUMN maturity integer NOT NULL DEFAULT 0,         -- 0=non évalué, 1-5
  ADD COLUMN rank integer NOT NULL DEFAULT 0;             -- ordre dans le slot
```

Nouvelle table `challenge_staging` pour les cartes posées hors des blocs :

```sql
CREATE TABLE challenge_staging (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workshop_id uuid NOT NULL,
  subject_id uuid NOT NULL,
  card_id uuid NOT NULL,
  user_id uuid NOT NULL,
  format text NOT NULL DEFAULT 'normal',
  created_at timestamptz NOT NULL DEFAULT now()
);
-- RLS : même logique que challenge_responses (participant peut CRUD ses propres lignes)
-- Realtime activé
```

### Changements UI

#### `SubjectCanvas.tsx` — Zone de tri + grille de slots
- Diviser le layout en 2 zones : **zone de tri** (haut/côté, scrollable) + **grille de slots** (bas)
- La zone de tri accepte le drop de cartes depuis la sidebar, affiche les cartes pré-sélectionnées
- Les cartes de la zone de tri sont re-draggables vers les slots
- Bouton format (compact/normal/étendu) sur chaque carte de la zone de tri

#### `DropSlot.tsx` — Multi-cartes enrichies
- Accepter toujours plusieurs cartes (supprimer la limite "single")
- Chaque carte dans un slot affiche :
  - **Sélecteur de format** (3 tailles visuelles : barre de couleur fine, carte résumée, carte étendue avec description)
  - **Sélecteur de maturité** (5 étoiles ou 5 cercles cliquables)
  - **Handle de drag** pour réordonner (mise à jour du champ `rank`)
- Le reorder met à jour le `rank` de chaque response

#### `DraggableCard.tsx` — Formats visuels
- Format **compact** : juste le nom + barre couleur pilier
- Format **normal** : nom + sous-titre + pilier (actuel)
- Format **expanded** : nom + sous-titre + objectif/définition + pilier

#### `StagingZone.tsx` (nouveau)
- Zone drop pour cartes hors-slots
- Grille flex-wrap de cartes avec bouton format
- Re-draggable vers les slots

### Changements hook `useChallengeData.ts`

- `placeCard` accepte `format`, `maturity`, `rank` optionnels
- Nouveau `updateResponse(responseId, { format?, maturity?, rank? })`
- Nouvelles fonctions `stageCard` / `unstageCard` pour la zone de tri
- `useChallengeStaging(workshopId)` — fetch + realtime sur `challenge_staging`

### Fichiers impactés

| Fichier | Action |
|---|---|
| Migration SQL | ALTER challenge_responses + CREATE challenge_staging |
| `src/components/challenge/SubjectCanvas.tsx` | Layout 2 zones |
| `src/components/challenge/DropSlot.tsx` | Multi-cartes, format, maturité, reorder |
| `src/components/challenge/DraggableCard.tsx` | 3 formats visuels |
| `src/components/challenge/StagingZone.tsx` | Nouveau |
| `src/components/challenge/MaturitySelector.tsx` | Nouveau — 5 niveaux cliquables |
| `src/components/challenge/FormatSelector.tsx` | Nouveau — toggle compact/normal/expanded |
| `src/hooks/useChallengeData.ts` | updateResponse, staging hooks |
| `src/components/challenge/ChallengeView.tsx` | Passer staging props |

