

## Sprint 6 — Améliorations UX & fonctionnalités avancées

### 1. Enrichissement logs avec display_name

**Probleme actuel** : La colonne "Utilisateur" affiche `user_id.slice(0,8)…` — illisible.

**Solution** : Jointure avec `profiles` dans `useAdminLogs.ts`. La table `activity_logs` a `user_id` mais pas de FK vers `profiles`. On fera une requete secondaire pour resoudre les user_ids en display_names.

- `useAdminLogs.ts` : apres fetch des logs, collecter les `user_id` uniques, batch-query `profiles` pour `user_id, display_name`, merge dans les resultats
- `AdminLogs.tsx` : afficher `display_name` au lieu du UUID tronque

### 2. Export CSV des logs

- Bouton "Exporter CSV" dans `AdminLogs.tsx`
- Requete sans pagination (tous les logs filtrés, limit 5000) + generation CSV cote client
- Colonnes : date, utilisateur, action, type, entité, organisation
- Declenchement via `Blob` + `URL.createObjectURL` + download

### 3. Dashboard billing avec graphiques

- Section graphique dans `AdminBilling.tsx` avec recharts
- **BarChart** : credits consommes par mois (6 derniers mois) — aggregation depuis `credit_transactions`
- **Stats cards** enrichies : nb plans actifs, nb abonnements actifs, revenu mensuel total
- Hook `useAdminBilling.ts` : ajouter query `monthlyCredits` pour aggregation temporelle

### 4. Gestion des credits par organisation

- Nouvel onglet/section dans `AdminBilling.tsx` : "Credits par organisation"
- Table : org name, credits distribues, credits depenses, solde
- Jointure `credit_transactions` → `profiles` → `organization_members` → `organizations`
- Action rapide : bouton "Ajuster credits" par org (credit/debit pour tous les membres ou un membre specifique)

### Fichiers

| Action | Fichier |
|--------|---------|
| Edit | `src/hooks/useAdminLogs.ts` — jointure profiles + export query |
| Edit | `src/pages/admin/AdminLogs.tsx` — display_name + bouton export CSV |
| Edit | `src/hooks/useAdminBilling.ts` — monthly stats + credits par org |
| Edit | `src/pages/admin/AdminBilling.tsx` — graphiques recharts + section credits/org |
| Edit | `.lovable/plan.md` — documenter Sprint 6 |

Aucune migration DB necessaire. Toutes les donnees sont deja accessibles via les tables existantes et les RLS en place.

