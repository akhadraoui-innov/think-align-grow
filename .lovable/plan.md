

## Fix : la complétion bloque sur un pilier (timeout de la fonction)

### Le probleme

La fonction backend a un temps d'exécution maximum (~150 secondes). Quand on complète un toolkit avec 9-10 piliers vides, chaque pilier prend 30-60 secondes pour générer 20 cartes. Total : 5 à 10 minutes. La fonction est coupée avant la fin, et la complétion s'arrête en plein milieu.

Ce n'est pas un problème de tokens (les logs montrent que l'IA répond bien avec `tool_calls`), c'est le temps total qui dépasse la limite.

### La solution

Au lieu d'un seul appel qui traite tous les piliers d'un coup, le frontend va orchestrer la génération **pilier par pilier**. Chaque pilier = un appel distinct au backend. Comme chaque appel ne prend que 30-60s, on reste largement dans les limites.

Le suivi en temps réel reste identique : la timeline progresse pilier après pilier. Si un pilier échoue, les autres sont déjà sauvegardés. Vous pouvez relancer la complétion pour le reste.

### Changements

**Edge function `generate-toolkit`**
- Nouveau paramètre `pillar_ids` (optionnel) dans le mode `complete_missing` pour ne traiter que certains piliers
- Si `pillar_ids` est fourni, ne génère que pour ces piliers-là
- Chaque appel reste court (1 pilier = ~40s)

**`ToolkitCompletionBanner.tsx`**
- Au lieu d'un seul appel SSE, fait N appels séquentiels (1 par pilier vide + 1 pour le quiz)
- Chaque appel SSE met à jour la timeline normalement
- Si un appel échoue, affiche l'erreur mais garde les piliers déjà complétés
- Bouton "Relancer" pour les piliers restants

### Fichiers

| Fichier | Changement |
|---------|-----------|
| `supabase/functions/generate-toolkit/index.ts` | Ajouter paramètre `pillar_ids` au mode `complete_missing` |
| `src/components/admin/ToolkitCompletionBanner.tsx` | Orchestrer N appels séquentiels au lieu d'un seul |

