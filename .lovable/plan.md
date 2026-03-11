

## Regressions identifiees dans Challenge

### 1. Sidebar de cartes manquante (critique)

Le `ChallengeView` n'inclut pas de `CardSidebar`. Le `WorkshopRoom` l'integre correctement mais `ChallengeRoom` ne l'a jamais eu ou l'a perdu. Sans sidebar, l'utilisateur ne peut pas parcourir les cartes du toolkit pour les glisser dans les slots ou la zone de tri.

**Correction** : Ajouter `CardSidebar` dans le layout de `ChallengeView`, avec le meme pattern que `WorkshopRoom` (sidebar a gauche, contenu a droite).

### 2. Couleurs cassees dans DropSlot, StagingZone, DraggableCard

Ces 3 composants utilisent encore `hsl(var(--pillar-${gradient}))` directement avec le retour de `getPillarGradient()`. Bien que `getPillarGradient()` a ete corrige pour ne plus retourner de hex, ces composants construisent manuellement la string CSS au lieu d'utiliser `getPillarCssColor()` et `getPillarCssColorAlpha()`. Cela fonctionne pour les tokens mais devrait etre harmonise.

### 3. Warning React : StagingZone ref

Le console log montre un warning "Function components cannot be given refs" dans `StagingZone` — cause : `motion.div` dans `AnimatePresence` wrapping un composant sans `forwardRef`.

---

### Plan de corrections

**Fichier `src/components/challenge/ChallengeView.tsx`** :
- Importer `CardSidebar` depuis `@/components/workshop/CardSidebar`
- Wrapper le layout en `flex flex-row` : sidebar a gauche + contenu existant a droite
- La sidebar appelle `handleStage` (ou `handleDrop` sur le slot courant) quand on clique sur une carte
- Gerer le mode mobile avec `isMobile` prop
- Griser les cartes deja placees via `placedCardIds` (deja calcule mais non utilise)

**Fichier `src/components/challenge/DropSlot.tsx`** :
- Remplacer `hsl(var(--pillar-${gradient}))` par `getPillarCssColor(slug, color)`
- Remplacer `hsl(var(--pillar-${gradient}) / 0.1)` par `getPillarCssColorAlpha(slug, color, 0.1)`

**Fichier `src/components/challenge/StagingZone.tsx`** :
- Meme remplacement couleurs
- Fix du warning ref en wrappant le composant dans un `div` au lieu de passer directement a `AnimatePresence`

**Fichier `src/components/challenge/DraggableCard.tsx`** :
- Meme remplacement couleurs

