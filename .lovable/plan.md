

# Timeline enrichie + Design amélioré — Campagnes

## Changements

### 1. Timeline en Collapsible avec header interactif
- Wraper la Card Gantt dans un `Collapsible` (ouvert par défaut)
- Header cliquable avec chevron animé, titre + compteur de campagnes visibles

### 2. Filtres dédiés Timeline (indépendants de la liste)
- **Status pills** locales au Gantt (Tous/Brouillon/Actif/Suspendu/Terminé)
- **Filtre organisation** : mini-select dans le header
- **Zoom temporel** : toggle group (3 mois / 6 mois / 1 an / Tout) qui recalcule `minDate`/`maxDate`

### 3. Toggle de densité
3 niveaux via `ToggleGroup` dans le header timeline :
- **Compact** : barres 5px, pas de label, espacement minimal
- **Normal** : barres 8px avec nom tronqué (actuel)
- **Détaillé** : barres 12px avec nom + badge inscrits + mini progress inline

### 4. Barres filtrées
Le Gantt n'affiche que les campagnes matchant les filtres timeline locaux. Le `minDate`/`maxDate` est recalculé selon le zoom choisi.

### 5. Design amélioré global
- **Timeline** : today marker avec label, grille de fond subtile par mois, barres avec gradient selon statut
- **Rows de la liste** : ombres plus subtiles, hover state amélioré, icônes d'action avec labels au hover
- **Collapse enrichi** : séparateurs visuels entre sections, fond blanc pur au lieu de muted/20, coins plus arrondis
- **KPIs header** : style plus épuré, fond blanc, bordure fine, icône dans un cercle plus petit

### Nouveau state local timeline
```
tlStatus: "all" | "draft" | "active" | "paused" | "completed"
tlOrgId: "all" | string
tlZoom: "3m" | "6m" | "1y" | "all"
tlDensity: "compact" | "normal" | "detailed"
tlOpen: boolean (default true)
```

### Fichier concerné

| Fichier | Action |
|---------|--------|
| `src/pages/admin/AdminAcademyCampaigns.tsx` | Refactorer section Gantt (collapsible + filtres + densité + design) |

