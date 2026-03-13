

## Corrections : chargement des cartes, formats visuels, et visibilité des fonctionnalités IA

### Problème 1 — Cartes à 0 au premier chargement

Dans le hook `useAdminToolkitDetail`, la requête des cartes dépend des piliers (elle a besoin de leurs IDs) mais elle se lance **avant** que les piliers soient chargés. Résultat : elle reçoit une liste vide et affiche 0 cartes. Il faut fermer/rouvrir pour que le cache se mette à jour.

**Correction** : Ajouter `enabled: !!(pillars.data?.length)` à la requête cards, et inclure les pillar IDs dans la `queryKey` pour que React Query relance automatiquement quand les piliers arrivent.

### Problème 2 — Le bandeau de complétion ne s'affiche que si des données manquent

Le bandeau est conçu pour disparaître quand tout est complet — c'est normal. Mais le bouton "Améliorer avec l'IA" (le dialog de chat) devrait toujours être visible et accessible, même sur un toolkit complet. Il l'est techniquement (dans le header), mais il n'est peut-être pas assez visible.

**Correction** : Rendre le bouton IA plus visible (badge coloré, toujours présent) et ajouter un état "tout est complet" dans le bandeau qui propose quand même l'amélioration IA au lieu de simplement disparaître.

### Problème 3 — Les cartes visuelles ne respectent pas le format Workshop

Le `ToolkitCardsBrowser` utilise ses propres rendus simplifiés pour les modes "section", "full", etc. Ils ne correspondent pas aux cartes du Workshop Canvas qui sont la référence (CanvasCard avec ses 4 modes : section, preview, full, gamified).

**Correction** : Refactorer le browser pour réutiliser la même logique de rendu que `CanvasCard` (mêmes couleurs, mêmes proportions, mêmes sections Action/KPI/Maturité) en mode lecture seule, sans les interactions canvas (drag, delete, sheet).

### Fichiers modifiés

| Fichier | Changement |
|---------|-----------|
| `src/hooks/useAdminToolkits.ts` | Fix race condition : `enabled` + queryKey dépendant des pillar IDs |
| `src/components/admin/ToolkitCompletionBanner.tsx` | Afficher un état "complet" avec accès à l'amélioration IA |
| `src/components/admin/ToolkitCardsBrowser.tsx` | Aligner les 4 formats sur le rendu CanvasCard du Workshop |
| `src/pages/admin/AdminToolkitDetail.tsx` | Rendre le bouton IA chat plus visible |

