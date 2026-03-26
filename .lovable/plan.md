

# Lancer le Practice Studio depuis Actifs Pédagogiques et Catalogue

## Objectif
Ajouter un bouton "Tester" (icone Play) sur chaque Practice dans deux pages admin : **Actifs Pédagogiques** (`AdminAcademyAssets.tsx`) et **Catalogue des Assets** (`AdminObservabilityCatalogue.tsx`), ouvrant le Practice Studio en mode `previewMode` dans un Dialog fullscreen.

## Plan

### 1. Actifs Pédagogiques — `AdminAcademyAssets.tsx`

Dans le composant `PracticesTab` (ligne 618) :
- Ajouter un state `testModuleId: string | null`
- Ajouter un bouton Play dans la colonne Actions de chaque practice (à côté de Copy et Pencil), qui set `testModuleId = pr.module_id`
- Ajouter un Dialog fullscreen identique à celui de `AdminAcademyModuleDetail` : `<AcademyPractice moduleId={testModuleId} previewMode />`
- Bandeau jaune "Mode test — Les échanges ne sont pas enregistrés"

### 2. Catalogue des Assets — `AdminObservabilityCatalogue.tsx`

Le catalogue affiche des `CatalogueAsset` avec `asset_type` et `asset_id`. Pour les assets de type `practice`, il faut résoudre le `module_id` :
- Option : requêter `academy_practices` par `asset_id` pour obtenir le `module_id`
- Ajouter un bouton Play conditionnel (`asset_type === "practice"`) dans les vues Table, Grid et Kanban
- Même Dialog fullscreen avec `previewMode`

### 3. Composant partagé — `PracticeTestDialog`

Pour éviter la duplication du Dialog dans 3 fichiers, extraire un composant réutilisable :

```
src/components/admin/PracticeTestDialog.tsx
Props: { moduleId: string | null; open: boolean; onOpenChange: (open: boolean) => void }
```

Contient le Dialog fullscreen, le bandeau jaune, et le `<AcademyPractice previewMode />`. Utilisé dans `AdminAcademyModuleDetail`, `AdminAcademyAssets` et `AdminObservabilityCatalogue`.

### Fichiers concernés

| Fichier | Action |
|---------|--------|
| `src/components/admin/PracticeTestDialog.tsx` | Nouveau — Dialog réutilisable |
| `src/pages/admin/AdminAcademyAssets.tsx` | Bouton Play + state dans PracticesTab |
| `src/pages/admin/AdminObservabilityCatalogue.tsx` | Bouton Play conditionnel pour practices |
| `src/pages/admin/AdminAcademyModuleDetail.tsx` | Refactorer pour utiliser le Dialog partagé |

