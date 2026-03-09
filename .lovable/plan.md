

## Analyse du besoin

L'utilisateur veut transformer les cartes du workshop canvas en éléments ultra-interactifs avec plusieurs niveaux de richesse et d'engagement. Focus sur la data comme élément central.

## Investigation technique nécessaire

Avant de concevoir l'architecture, je dois comprendre :

1. **Les niveaux de maturité** - Quels sont les 3 niveaux disponibles dans la base ?
2. **Structure des données** - Quelles informations riches sont disponibles sur chaque carte ?
3. **Architecture actuelle** - Comment CanvasCard est implémentée aujourd'hui ?

## Architecture cible proposée

### 1. Modes d'affichage des cartes (3 niveaux)

**Mode Light** (compact, ~200px)
- Titre + couleur pilier seulement
- Icône de maturité mini
- Avatar créateur

**Mode Preview** (standard actuel, ~280px)  
- Titre, définition (tronquée), action
- Barre de maturité interactive
- KPI visible
- Phase + pilier

**Mode Full** (large, ~400px)
- Tout le contenu étendu
- Définition complète
- Action détaillée avec contexte
- KPI avec explications
- Métriques de progression
- Bouton "Fiche contexte"

### 2. Système de maturité interactive

**3 niveaux à identifier** (depuis la DB)
- Chaque niveau = mini carte rectangulaire en bas
- Cliquable pour définir le niveau actuel
- Animation de progression
- Persistance dans `workshop_canvas_items.content.maturity_level`

### 3. Fiche de contexte (modal/panel)

**Contenu enrichi**
- Vue complète de la carte avec toutes ses données
- Zone de discussion dédiée à cette carte
- Historique des interactions
- Métriques d'engagement des participants
- Actions collaboratives (votes, annotations)

### 4. Redimensionnement dynamique

**3 tailles prédéfinies**
- Small (mode light) : 200px width
- Medium (mode preview) : 280px width  
- Large (mode full) : 400px width
- Transition animée entre les modes
- Persistance de la taille choisie

## Plan d'implémentation

### Étape 1 : Investigation DB et données
- Explorer les niveaux de maturité disponibles
- Analyser la structure complète des cartes
- Identifier toutes les données exploitables

### Étape 2 : Refactoring CanvasCard  
- Créer les 3 modes d'affichage (Light/Preview/Full)
- Implémenter le système de redimensionnement
- Ajouter la barre de maturité interactive

### Étape 3 : Fiche contexte
- Créer CardContextSheet.tsx (modal riche)
- Intégrer discussions spécifiques à la carte
- Ajouter métriques et historique

### Étape 4 : Persistance et sync
- Étendre `workshop_canvas_items.content` pour :
  - `display_mode`: "light" | "preview" | "full"
  - `maturity_level`: number (1-3)
  - `custom_notes`: string
- Sync temps réel des changements

### Modifications techniques prévues

**Fichiers à créer :**
- `src/components/workshop/CardContextSheet.tsx` - Fiche contexte enrichie
- `src/components/workshop/MaturitySelector.tsx` - Sélecteur de maturité 
- `src/hooks/useCardMaturity.ts` - Logique maturité + data

**Fichiers à modifier :**
- `src/components/workshop/CanvasCard.tsx` - Modes d'affichage multiples
- `src/hooks/useCanvasItems.ts` - Support nouvelles propriétés
- `src/components/workshop/WorkshopCanvas.tsx` - Gestion des interactions

**Base de données :**
- Aucune migration nécessaire 
- Extension du JSONB `content` dans `workshop_canvas_items`

### Contraintes techniques

- Performance : Minimiser re-renders lors changement de mode
- Mobile : Adaptation des 3 modes pour petits écrans  
- Temps réel : Sync des changements de maturité entre participants
- Accessibilité : Navigation clavier entre modes

## Questions à clarifier

1. Les 3 niveaux de maturité sont-ils génériques ou spécifiques à chaque carte ?
2. La fiche contexte doit-elle être modale ou panel latéral ?
3. Le changement de mode doit-il être persistant par participant ou global ?

