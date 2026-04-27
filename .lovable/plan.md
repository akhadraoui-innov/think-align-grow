# Plan post Lot 7 — Préparation Lot 8

## 1. Bilan Lot 7 — livré

### Métriques sécurité
| Indicateur | Avant Lot 7 | Après Lot 7 | Δ |
|---|---|---|---|
| Findings scan | 165 | 42 | **−75%** |
| Errors | 4 | 0 | **−100%** |
| Warnings linter Supabase | 155 | 41 | **−74%** |

### Brique livrée — Hardening EXECUTE permissions
- **Migration de hardening** : `REVOKE EXECUTE FROM PUBLIC, anon, authenticated` sur toutes les 77 fonctions SECURITY DEFINER du schéma `public`.
- **Liste blanche `anon`** (5 fonctions publiques légitimes) : tokens email + invitations + workshop par code.
- **Liste blanche `authenticated`** (~36 fonctions) : helpers RLS, notifications, quotas, RGPD, métriques admin avec garde interne `is_saas_team`.
- **Triggers internes et helpers service_role** : aucun GRANT — exécutables uniquement par owner/service_role bypass.

### Findings résiduels acceptés (documentés)
Les 41 warnings restants sont **par design** et inévitables sans casser la fonctionnalité :
- Le scanner Supabase signale TOUTE fonction SECURITY DEFINER appelable par anon/authenticated, sans distinguer les usages légitimes.
- Pour ces 41 fonctions, la garde de sécurité est **interne** (vérif `is_saas_team`, `auth.uid()`, paramètres validés).
- Le warning `REALTIME_CHANNEL_UNAUTHORIZED_SUBSCRIPTION` est mitigé par la règle "Postgres Changes only" documentée dans `data-protection-baseline.md`.

### Documentation mise à jour
- `mem://security/data-protection-baseline.md` augmentée avec section "EXECUTE permissions sur SECURITY DEFINER" + règle pour toute nouvelle fonction.

---

## 2. Périmètre **Lot 8 — Vault, productivité, tests**

### Brique A — Vault pgsodium (3 secrets restants)
Les errors Vault d'origine sont passées en `warn` après hardening RLS, mais restent des dettes :
- `ai_configurations.api_key` (saas team only via RLS)
- `email_provider_configs.credentials` (org admin only, déjà chiffré applicatif via `encrypt_email_credentials`)
- `email_webhook_secrets.secret` (saas team only)
- `academy_certificate_config.api_key_hash` (saas team only)

**Approche** :
1. Activer extension `pgsodium`.
2. Helper SQL `app_get_secret(_secret_id uuid)` SECURITY DEFINER avec garde rôle.
3. Migrer chaque secret : ajouter colonne `*_secret_id uuid`, copier dans Vault, NULL la colonne plaintext.
4. Patcher 3 edge functions consommatrices : `ai-coach`, `trigger-email`/`process-email-queue`, `verify-certificate`.
5. Audit log à chaque déchiffrement.

### Brique B — Tests filet sécurité
- `src/hooks/usePermissions.test.tsx` : 12 rôles × 5 actions principales.
- `src/hooks/useUrlFilters.test.ts`, `src/hooks/useBulkSelection.test.ts`.
- `supabase/functions/_shared/realtime-isolation_test.ts` (Deno).
- `supabase/functions/trigger-email/index_test.ts` (happy path + secret manquant).
- `supabase/functions/verify-certificate/index_test.ts` (valide / révoqué / inexistant).

### Brique C — Validation edge functions email
Déployer + tester end-to-end `email-events`, `process-email-queue`, `process-email-priority-queue` (typage corrigé Lot 6 mais jamais exécuté en pilote).

### Brique D — Productivité (rollout Lot 5)
Étendre `selectable`/`exportable`/URL filters/saved views aux 5 pages restantes :
- `AdminOrganizations`, `AdminAudit`, `AdminLogs`, `AdminBilling`, `AdminAcademyTracking`.
- Ajouter **Command Palette ⌘K** globale.

### Brique E — Rate limiting opérations sensibles
- `delete-user`, `adjust_credits`, `impersonate-user` (table `rate_limits` + check côté edge).

---

## 3. Critères d'acceptation Lot 8

1. `psql -c "SELECT api_key FROM ai_configurations"` retourne `NULL` partout.
2. ≥ 5 nouveaux fichiers de test au vert.
3. Un envoi pilote validé sur les 3 edge functions email post-fix.
4. Command Palette ⌘K opérationnelle, 5 pages admin équipées des features Lot 5.
5. Rate limiting actif sur 3 ops sensibles (HTTP 429 reproduit en test).

---

## 4. Hors périmètre Lot 8 (Lot 9+)
- Refacto routes en `<Route>` imbriqués (DX).
- Cohorts / observability dashboards (business).
- Migration des 41 warnings SECURITY DEFINER vers SECURITY INVOKER (refacto majeur, ROI faible).
