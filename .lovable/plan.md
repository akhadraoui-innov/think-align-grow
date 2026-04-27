# Plan post Lot 8 — Préparation Lot 9

## 1. Bilan Lot 8 — livré (brique E)

### Brique E — Rate limiting opérations sensibles ✅
- Table `public.rate_limits` (service_role only, RLS sans policy = lockdown).
- RPC `check_rate_limit(_user_id, _action_key, _max, _window)` SECURITY DEFINER, **REVOKE** total → service_role only.
- RPC `cleanup_rate_limits()` pour TTL 24h.
- `delete-user` → 5/h. `impersonate-user` → 10/h.
- Documentation `mem://security/rate-limiting.md`.

### Métriques
| Indicateur | Lot 7 | Lot 8 | Δ |
|---|---|---|---|
| Edge functions critiques rate-limitées | 0/2 | 2/2 | +100% |
| Findings | 51 | 51 (+1 INFO volontaire) | = |

### Briques A/B/C/D du plan initial Lot 8 — non livrées
- **A — Vault pgsodium** : reportée Lot 9 (refacto multi-EF, risque de régression élevé sans tests).
- **B — Tests filet sécurité** : reportée Lot 9.
- **C — Validation EF email pilote** : non bloquante, à faire avec un envoi réel.
- **D — Productivité 5 pages restantes + ⌘K** : ⌘K **déjà global** (livré E3, vérifié `src/components/layout/CommandPalette.tsx`). Les 5 pages restantes = chantier UI dédié.

---

## 2. Périmètre **Lot 9 — Vault, tests, finitions productivité**

### Brique A — Vault pgsodium (3 secrets)
1. Activer extension `pgsodium`.
2. Helper SQL `app_get_secret(_secret_id uuid)` SECURITY DEFINER avec audit log.
3. Migrer : `ai_configurations.api_key`, `email_provider_configs.credentials`, `email_webhook_secrets.secret`.
4. Patcher EFs consommatrices : `ai-coach`, `trigger-email`/`process-email-queue`.
5. Audit log à chaque déchiffrement.

### Brique B — Suite de tests Deno
- `supabase/functions/_shared/rate-limit_test.ts` (allowed/blocked/reset).
- `supabase/functions/delete-user/index_test.ts` (rejet non-admin, rate limit hit, archive RGPD).
- `supabase/functions/verify-certificate/index_test.ts` (valide / révoqué / inexistant).
- `src/hooks/usePermissions.test.tsx` (12 rôles × 5 actions).

### Brique C — adjust_credits
- Soit migrer en edge function avec rate limit.
- Soit trigger `BEFORE INSERT` sur `credit_transactions` qui appelle `check_rate_limit`.

### Brique D — Productivité 5 pages
Étendre `selectable`/`exportable`/URL filters/saved views à :
`AdminOrganizations`, `AdminAudit`, `AdminLogs`, `AdminBilling`, `AdminAcademyTracking`.

### Brique E — Pg_cron cleanup
- Cron quotidien `cleanup_rate_limits()`.
- Cron quotidien purge `rate_limits` et `audit_logs_immutable` archive S3.

---

## 3. Critères d'acceptation Lot 9

1. `psql -c "SELECT api_key FROM ai_configurations"` retourne `NULL` partout (Vault).
2. ≥ 4 nouveaux fichiers de test Deno au vert.
3. `adjust_credits` rate-limité (trigger ou EF).
4. 5 pages admin équipées de `DataTable selectable exportable` + URL filters.
5. Pg_cron `cleanup_rate_limits` actif.

---

## 4. Hors périmètre Lot 9 (Lot 10+)
- Refacto routes en `<Route>` imbriqués (DX).
- Cohorts / observability dashboards (business).
- Migration des 41 warnings SECURITY DEFINER vers SECURITY INVOKER (refacto majeur, ROI faible).
- Saved views partagées en équipe (table SQL + RLS).
