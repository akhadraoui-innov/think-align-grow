---
name: Admin productivity patterns (Lot 5)
description: Conventions bulk actions, URL filters, saved views, export CSV, ⌘K palette pour les pages admin
type: preference
---

## Pages admin — conventions

**URL filters obligatoires** sur toute liste admin paginée. Utiliser `useUrlFilters(zodSchema)` (les valeurs par défaut sont retirées de l'URL pour rester propre).

**Saved views** via `useSavedViews(pageKey, builtins)` + composant `<SavedViewsMenu>`. Les vues built-in sont en code (suspendus, super_admins, etc.) et non supprimables. Les vues utilisateurs vivent en `localStorage` (clé `admin.savedViews.{pageKey}`).

**Bulk actions** : `<DataTable selectable getRowId={r => r.user_id} bulkActions={(ids, clear) => ...}>`.
Garde-fous **obligatoires** :
- Refus si self dans la sélection.
- Refus si `super_admin` dans la sélection (suspend/role).
- Limite à 100 lignes par batch.
- `Promise.allSettled` + toast récap (`X ok · Y erreurs`).
- Audit : `appendAuditLog({action: "bulk.*", ...})` après chaque batch.

**Export CSV** : `<DataTable exportable exportFilename="users_YYYY-MM-DD" onExport={count => appendAuditLog(...)}>`.
- Exporte la **vue filtrée triée**, pas le dataset brut.
- Colonnes peuvent fournir `exportValue` ou `exportHide`.
- Implémentation : `src/lib/exportCsv.ts` (RFC 4180 + BOM UTF-8 + arrays en `;`).

**⌘K palette** : déjà global (livraison E3). Ajouter de nouveaux groupes via patch de `src/components/layout/CommandPalette.tsx` — pas de palette dédiée par page.

**Audit** : tout client-side qui mute en bulk **doit** journaliser via `appendAuditLog` (`src/lib/auditClient.ts`). Les actions standardisées : `bulk.status_changed`, `bulk.role_added`, `bulk.role_removed`, `admin.export`.

## Hors-périmètre Lot 5
Saved views partagées en équipe (table SQL + RLS), bulk sur orgs, import CSV, filter query-builder.
