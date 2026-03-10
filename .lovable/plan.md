

## Améliorations du Challenge Canvas + Vue Gamifiée

### 1. Amélioration de la vue actuelle (DropSlot)

**Problème** : Les cartes dans les blocs n'affichent pas le pilier (famille), la phase (sous-famille), et le sélecteur de maturité est trop discret (petits cercles).

**Changements dans `DropSlot.tsx`** :
- Afficher un **badge pilier** (nom + couleur) et un **badge phase** (Fondations/Modèle/Croissance/Exécution) sur chaque carte placée
- Remplacer le sélecteur de maturité par un **slider visuel 1-5** avec labels textuels (Débutant → Expert) et couleur progressive
- Améliorer le drag-reorder avec un numéro de rang visible et un handle plus explicite

**Changements dans `MaturitySelector.tsx`** :
- Passer de 5 petits cercles à un vrai **sélecteur segmenté** avec labels : Novice (1), Débutant (2), Intermédiaire (3), Avancé (4), Expert (5)
- Couleur progressive de rouge à vert
- Plus grand et plus cliquable

**Changements dans `SubjectCanvas.tsx`** :
- Grouper visuellement les cartes dans chaque slot par pilier (séparateur ou sous-groupe coloré)

### 2. Nouvelle vue gamifiée : `ChallengeBoard.tsx`

Un canvas libre où l'utilisateur positionne de **vraies cartes visuelles** (style cartes physiques) par drag libre sur un plateau.

**Concept** :
- Le plateau affiche les slots comme des **zones nommées** (rectangles avec titre et bordure en pointillés)
- Les cartes sont rendues en **format carte complète** : fond coloré pilier, titre, sous-titre, icône, badge phase — comme de vraies cartes à jouer
- L'utilisateur drag les cartes librement sur le plateau (position x/y libre au sein d'une zone)
- Les cartes qui chevauchent une zone sont automatiquement assignées à ce slot
- Les cartes hors zone restent visibles mais non comptées (staging visuel)

**Composants** :

| Fichier | Rôle |
|---|---|
| `src/components/challenge/ChallengeBoard.tsx` | Canvas gamifié avec zones et cartes positionnables |
| `src/components/challenge/GameCard.tsx` | Carte visuelle complète style "carte à jouer" avec pilier, phase, maturité |
| `src/components/challenge/BoardZone.tsx` | Zone de drop nommée sur le plateau |

**Architecture `ChallengeBoard`** :
- Container scrollable avec grille de `BoardZone` (disposition spatiale des slots)
- Les cartes draggées depuis la sidebar apparaissent comme des `GameCard` positionnées
- Chaque `GameCard` affiche : couleur pilier en fond, titre en gras, sous-titre, phase badge, sélecteur maturité intégré
- Clic sur une carte = flip pour voir définition/action/KPI (réutilise le concept FlipCard existant)
- Un toggle dans `ChallengeView.tsx` permet de basculer entre vue "Liste" (actuelle) et vue "Plateau" (gamifiée)

**Toggle dans `ChallengeView.tsx`** :
- Deux boutons dans le header : `List` (icône liste) / `Board` (icône grille)
- Même données, même hooks, juste le rendu qui change

### Fichiers impactés

| Fichier | Action |
|---|---|
| `src/components/challenge/DropSlot.tsx` | Ajouter badges pilier/phase, améliorer le reorder visuel |
| `src/components/challenge/MaturitySelector.tsx` | Refaire en sélecteur segmenté avec labels |
| `src/components/challenge/ChallengeBoard.tsx` | Nouveau — vue gamifiée plateau |
| `src/components/challenge/GameCard.tsx` | Nouveau — carte visuelle complète |
| `src/components/challenge/BoardZone.tsx` | Nouveau — zone drop sur le plateau |
| `src/components/challenge/ChallengeView.tsx` | Ajouter toggle Liste/Plateau |
| `src/components/challenge/SubjectCanvas.tsx` | Pas de changement structurel |

Aucun changement base de données requis — les mêmes tables `challenge_responses` et `challenge_staging` sont utilisées.

