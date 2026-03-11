

## Amélioration UI : Tableaux, Dialogs & Composants Admin

### Problèmes identifiés
- **DataTable** : headers plats, pas de backdrop subtil, pagination basique, lignes monotones
- **ToolkitCardsTab** : utilise des `<table>` HTML brutes au lieu du composant `Table` unifié, pas de hover states élégants
- **Dialog d'édition carte** : fond plat, pas de sections visuelles, formulaire dense sans hiérarchie
- **ToolkitPillarsTab** : collapsibles basiques, pas de séparation visuelle entre sections du formulaire
- **ToolkitInfoTab** : sections avec titres simples, pas d'icônes de section, espacement perfectible

### Changements prévus

**1. DataTable.tsx — Design system upgrade**
- Header avec `backdrop-blur`, fond `bg-muted/40`, uppercase tracking-wide sur labels
- Lignes alternées subtiles (`even:bg-muted/10`)
- Pagination redesignée : pills avec numéro de page, compteur stylé
- Boutons de tri avec indicateur directionnel actif (chevron up/down au lieu d'icône générique)
- Search bar avec fond transparent, border plus fine, focus ring orange

**2. ToolkitCardsTab.tsx — Refonte tableau + dialog**
- Remplacer les `<table>` brutes par le composant `Table/TableHeader/TableRow/TableCell`
- Ajouter des indicateurs colorés par phase (dot coloré)
- Dialog refondu en sections visuelles avec séparateurs et icônes de section :
  - Section "Identité" avec grille propre
  - Section "Contenu" avec textareas espacés
  - Section "Paramètres" (qualification, valorisation, difficulté, durée)
  - Section "Tags & Statut"
  - Footer sticky avec actions

**3. ToolkitPillarsTab.tsx — Collapsibles premium**
- Trigger avec fond gradient subtil au hover
- Panneau d'édition avec sections groupées par thème (Identité, Apparence, Pédagogie)
- Séparateurs visuels entre groupes
- Badge de statut coloré dans le trigger

**4. ToolkitInfoTab.tsx — Sections avec icônes**
- Chaque section reçoit une icône dans le header (Settings, FileText, CreditCard, Database)
- Description sous le titre de section en muted
- Meilleur espacement entre les champs
- Bouton Save sticky en bas avec backdrop-blur

**5. Dialog global (dialog.tsx)**
- Overlay plus léger (`bg-black/60` + `backdrop-blur-sm`)
- Border radius cohérent `rounded-2xl`
- Shadow plus prononcée pour effet de profondeur

### Fichiers modifiés

| Fichier | Changement |
|---------|-----------|
| `src/components/ui/dialog.tsx` | Overlay blur, rounded-2xl, shadow élevée |
| `src/components/admin/DataTable.tsx` | Headers uppercase, lignes alternées, pagination pills |
| `src/components/admin/ToolkitCardsTab.tsx` | Composant Table unifié, dialog sectionné |
| `src/components/admin/ToolkitPillarsTab.tsx` | Collapsibles avec sections groupées |
| `src/components/admin/ToolkitInfoTab.tsx` | Icônes de section, descriptions, spacing |

Aucune migration DB. Aucun nouveau fichier. Purement visuel/CSS.

