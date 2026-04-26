
# Lot 5 — Productivité Admin

## Audit préalable (état réel constaté)

| Existant ✅ | Manquant ❌ |
|---|---|
| `useInvitations` complet (send/revoke/resend) **déjà intégré** dans `OrgMembersTab` | Bulk actions sur listes (suspendre/changer rôle en masse) |
| `toggleStatus`, `addRole`, `removeRole` mutations atomiques | Filtres + recherche persistés en URL (deep-link, partage, retour navigateur) |
| `AdminAudit.tsx` lit `audit_logs_immutable` | Export CSV des vues admin filtrées |
| Filtres role/status/org dans `AdminUsers` (mais state local volatile) | Command palette globale (⌘K) — navigation, actions, recherche user |
| `DataTable` réutilisable | Saved views (« mes admins suspendus », « orgs sans owner »…) |
| Hooks `useAdminUsers`, `useOrganizations` typés | — |

**Conclusion** : la « visibilité des invitations en attente » initialement listée pour Lot 5 est **déjà livrée**. On la retire et on monte le niveau d'ambition vers les standards Linear / Stripe / Vercel.

---

## Pourquoi ce lot maintenant (vue PO)

Les Lots 1-4 ont fait de la plateforme un système **sûr, conforme et auditable**. Le Lot 5 le rend **opérable à l'échelle** : un admin qui gère 500 utilisateurs ne peut plus cliquer ligne par ligne. Sans bulk actions, sans deep-link, sans export, on perd 30 minutes par opération récurrente. C'est la marche entre « outil interne » et « console SaaS pro ».

**Bénéfice direct** : un support qui traite 10 demandes RGPD le matin le fait en 2 min au lieu de 20.

---

## Brique 1 — Multi-sélection + bulk actions (DataTable)

### Le problème
Suspendre 50 comptes inactifs = 50 clics + 50 confirmations. Aujourd'hui impossible sans script SQL.

### Ce qu'on met en place
- Patch `DataTable.tsx` : prop optionnelle `selectable?: boolean` + `getRowId?: (row) => string` + `onSelectionChange?: (ids: string[]) => void`.
- Colonne checkbox à gauche (header = select-all sur la **vue filtrée**, pas tout le dataset).
- État `selectedIds` interne + bus de notification au parent.
- Barre flottante en bas (sticky) quand `selectedIds.length > 0` : « N sélectionné(s) » + slot `bulkActions` rendu par le parent.
- Reset auto sur changement de filtre / refetch.

### Bulk actions livrées (sur `AdminUsers`)
| Action | Garde-fou | Audit |
|---|---|---|
| Suspendre / Réactiver | Refus si la sélection contient l'admin courant ou un super_admin | `bulk.status_changed` |
| Ajouter un rôle | Réutilise `addRole` en boucle, refus si > 100 | `bulk.role_added` |
| Retirer un rôle | Confirmation si retrait `customer_lead`/`super_admin`. Réutilise garde-fou Lot 2 (`count_users_by_role`) | `bulk.role_removed` |
| Exporter sélection en CSV | — | `bulk.export` |

Toutes les actions appellent **les mutations existantes** (`toggleStatus`, `addRole`, `removeRole`) — aucun nouveau RPC, atomicité préservée par `Promise.allSettled` + reporting d'erreurs partielles dans un toast récap (« 48 ok, 2 erreurs : voir détails »).

### Réutilise
`DataTable`, `useAdminUsers`, `Checkbox` shadcn, `audit_logs_immutable` (via `append_audit_log` côté client wrapper).

---

## Brique 2 — Filtres + recherche persistés en URL

### Le problème
Un admin filtre `role=customer_lead status=suspended`, partage l'URL → le destinataire arrive sur une vue vide. Refresh = filtres perdus. Impossible de bookmarker « comptes suspendus ».

### Ce qu'on met en place
- Hook `useUrlFilters<T>(defaults, schema)` : wrapper `useSearchParams` + Zod parsing.
- Synchronisation **bi-directionnelle** : changement de Select → push URL ; navigation back → restaure les filtres.
- Pas de re-render en boucle (debounce + dirty-check).
- Appliqué à : `AdminUsers`, `AdminOrganizations`, `AdminAudit`, `AdminLogs`.
- `DataTable` accepte aussi `defaultSearch` qu'il lit depuis l'URL via le hook parent.

### Saved views (mini)
- Bouton « ⭐ Sauvegarder cette vue » → écrit `{name, search_params}` dans `localStorage` (clé `admin.savedViews.{page}`).
- Dropdown "Vues" en haut à droite de chaque page.
- Vues par défaut pré-fournies : « Suspendus », « Sans organisation », « Inactifs > 30j », « Super admins », « Orgs sans owner ».

### Réutilise
`react-router-dom` (déjà là), `zod` (déjà là), `localStorage` pattern utilisé par `OrgSwitcher`.

---

## Brique 3 — Export CSV des vues admin

### Le problème
Le seul export existant est dans `AdminAcademyTracking`. Aucune autre liste admin n'est exportable. Demande récurrente du métier (compta, support, RGPD : « donne-moi la liste des users actifs au 1er du mois »).

### Ce qu'on met en place
- Utilitaire `src/lib/exportCsv.ts` : `exportRowsToCsv(rows, columns, filename)` avec :
  - Échappement RFC 4180 (virgules, guillemets, retours ligne).
  - BOM UTF-8 (Excel friendly).
  - Sérialisation propre des champs nested (rôles → `"role1;role2"`).
- Bouton "⬇ Exporter" en haut de chaque `DataTable` (prop `exportable?: boolean` + `exportFilename?: string`).
- Exporte la **vue filtrée + triée**, pas le dataset brut.
- Audit : `append_audit_log('admin.export', resource, count, {filters, filename})`.

### Réutilise
Pattern existant dans `AdminAcademyTracking`, `DataTable`, `audit_logs_immutable`.

---

## Brique 4 — Command palette globale (⌘K)

### Le problème
Naviguer depuis n'importe quelle page admin vers la fiche d'un user précis = 4 clics. Standard du marché : `Cmd+K` ouvre une palette qui fait tout.

### Ce qu'on met en place
- Composant `CommandPalette.tsx` basé sur `cmdk` (déjà installé via `Command` shadcn — vérifié dans `components/ui`).
- Raccourci `⌘/Ctrl+K` global, monté dans `AdminShell`.
- Sections :
  1. **Navigation** : tous les liens du sidebar admin (statique).
  2. **Utilisateurs** : recherche live (nom/email) sur `useAdminUsers().users` (déjà en cache react-query).
  3. **Organisations** : recherche live sur `useOrganizations()`.
  4. **Actions rapides** : « Créer une org », « Voir l'audit », « Mes vues sauvegardées », « Lancer un scan sécurité ».
- Sélection user → navigate `/admin/users/:id`. Sélection action → exécute.
- Aucun appel réseau supplémentaire (réutilise les caches existants).

### Réutilise
`cmdk` (composant `Command` shadcn déjà présent), caches react-query existants, navigation `react-router-dom`.

---

## Architecture — cohérence avec l'existant

| Brique | S'appuie sur | Duplication évitée |
|---|---|---|
| Bulk actions | `DataTable`, mutations existantes (`toggleStatus`, `addRole`, `removeRole`), garde-fou Lot 2 | ✅ |
| URL filters | `react-router-dom`, `zod`, pattern de `AdminPracticeStudio` | ✅ |
| Saved views | `localStorage` (pattern `OrgSwitcher`) | ✅ |
| Export CSV | Pattern de `AdminAcademyTracking`, audit log Lot 2 | ✅ |
| ⌘K palette | `Command` shadcn déjà installé, caches react-query existants | ✅ |

**Aucune nouvelle dépendance npm. Aucun nouveau RPC. Aucun nouveau bucket.**

---

## Livrables détaillés (suivi PO)

### Composants nouveaux
- `src/components/admin/BulkActionBar.tsx` (barre flottante sticky).
- `src/components/admin/SavedViewsMenu.tsx` (dropdown vues + sauvegarde).
- `src/components/admin/CommandPalette.tsx` (⌘K).

### Hooks nouveaux
- `src/hooks/useUrlFilters.ts` (sync URL ↔ state, Zod).
- `src/hooks/useSavedViews.ts` (CRUD localStorage par page).
- `src/hooks/useBulkSelection.ts` (set d'IDs, helpers select-all/clear).

### Utilitaires nouveaux
- `src/lib/exportCsv.ts` (RFC 4180 + BOM UTF-8).
- `src/lib/auditClient.ts` (wrapper `append_audit_log` côté client pour bulk/export).

### Patches
- `src/components/admin/DataTable.tsx` : props `selectable`, `getRowId`, `onSelectionChange`, `exportable`, `exportFilename`, `bulkActions` slot.
- `src/components/admin/AdminShell.tsx` : monte `<CommandPalette />`.
- `src/pages/admin/AdminUsers.tsx` : sélection + bulk actions + URL filters + export + saved views.
- `src/pages/admin/AdminOrganizations.tsx` : URL filters + export + saved views.
- `src/pages/admin/AdminAudit.tsx` : URL filters + export.
- `src/pages/admin/AdminLogs.tsx` : URL filters + export.

### Tests
- `src/lib/exportCsv.test.ts` : RFC 4180 (virgules, guillemets, newlines, unicode).
- `src/hooks/useUrlFilters.test.ts` : sync, restauration back-button, defaults.
- `src/hooks/useBulkSelection.test.ts` : select-all sur vue filtrée, reset sur refetch.
- `src/components/admin/CommandPalette.test.tsx` : raccourci ⌘K, recherche fuzzy, navigation.

### Mémoire
- `mem://admin/productivity-patterns.md` : règles bulk (jamais sur super_admin, recap toast erreurs partielles), URL filters obligatoires sur listes, export CSV systématique, ⌘K standard.
- Mise à jour `mem://index.md`.

---

## Critères d'acceptation (validation PO)

1. Sur `/admin/users`, sélectionner 20 users → barre flottante visible → « Suspendre » → toast « 20 ok » → tous les badges passent rouge → entrée `bulk.status_changed` dans `/admin/audit`.
2. Tenter bulk-suspendre une sélection contenant `akhadraoui@asmos-consulting.com` → refus avec message clair, aucune action effectuée.
3. Filtrer `role=customer_lead status=active` → URL devient `?role=customer_lead&status=active` → copier-coller dans un nouvel onglet → même vue.
4. Sauvegarder la vue « Customer leads actifs » → apparaît dans dropdown → un clic restaure filtres + URL.
5. Cliquer « Exporter » sur une vue de 47 utilisateurs → CSV téléchargé, ouvrable propre dans Excel/Numbers, accents OK, rôles séparés par `;`.
6. ⌘K depuis n'importe quelle page admin → palette ouvre → taper « ammar » → résultat user → Enter → fiche utilisateur.
7. `bun test` : 4 nouvelles suites vertes.
8. `supabase--linter` : 0 nouveau finding.
9. Aucune régression sur les pages déjà livrées (Lots 1-4).

---

## Hors périmètre Lot 5 (reporté)

- **Saved views partagées en équipe** (table `admin_saved_views`) → Lot 6 (observabilité), nécessite UI de partage + RLS dédiée.
- **Bulk actions sur organisations** (suspendre toute une org) → Lot 6, impact métier large.
- **Import CSV** (créer 100 users d'un coup) → Lot 7 onboarding entreprise, nécessite validation + dédup + email d'invitation atomique.
- **Filtres avancés type query-builder** (AND/OR imbriqués) → seulement si demande utilisateur réelle, sinon over-engineering.

---

## Estimation effort

| Brique | Complexité | Risque |
|---|---|---|
| Bulk actions + DataTable patch | Moyenne | Faible (réutilise mutations existantes) |
| URL filters + saved views | Faible | Faible |
| Export CSV | Faible | Très faible |
| ⌘K palette | Moyenne | Faible (`cmdk` déjà installé) |

**Livrable d'un bloc, sans régression.** Les pages admin existantes gagnent les fonctionnalités de manière progressive — un admin qui ne connaît pas ⌘K continue à cliquer normalement.

---

## Ordre d'exécution

1. `useUrlFilters` + `useSavedViews` + `useBulkSelection` (foundations).
2. Patch `DataTable` (selectable, exportable, bulkActions slot).
3. `exportCsv.ts` + `auditClient.ts` + `BulkActionBar` + `SavedViewsMenu`.
4. `CommandPalette` + montage dans `AdminShell`.
5. Refacto `AdminUsers` (toutes briques) — page pilote.
6. Roll-out `AdminOrganizations`, `AdminAudit`, `AdminLogs`.
7. Tests + mémoire + linter.

Prêt à lancer dès ton OK.
