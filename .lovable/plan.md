# Audit complet — État de la plateforme (post Lot 8)

## ✅ Santé globale : EXCELLENTE

| Indicateur | Valeur |
|---|---|
| Tables / RLS activées / Policies | 107 / 107 / 267 |
| Edge functions | 32 (toutes déployées) |
| Cron jobs (24h) | 17 216 succès / **1 échec** |
| Erreurs HTTP edge (24h) | 0 |
| Secrets en clair | 0 |
| Findings sécurité critiques | 0 |
| Findings warn (Lot 7 by-design) | 41 |
| Routes (cabinet + portal) | ~110, toutes mappées |
| Release notes | v2.4 → v2.8 + 11 modules ✅ |

## 🐛 Régression confirmée (priorité haute)

**Cron `purge_expired_email_tokens_daily` cassé depuis 48 h** :
```
ERROR: column "expires_at" does not exist
QUERY: DELETE FROM public.email_unsubscribe_tokens
  WHERE ... OR (used_at IS NULL AND expires_at < now() - interval '7 days')
```
Cause : Lot 6 a renommé/supprimé `expires_at` lors du hardening des tokens.
Conséquence : tokens jamais purgés → table en croissance non bornée.

## 🟡 Trous fonctionnels identifiés

1. **DataTable rollout incomplet** — 8 pages admin encore en `<Table>` legacy : `AdminUCM`, `AdminLogs`, `AdminAudit`, `AdminBilling`, `AdminAcademyPaths`, `AdminAcademyCertificates`, `AdminAcademyAssets` (pas d'export CSV ni filtres URL).
2. **Tests frontend** — 3 fichiers seulement. 0 test sur `usePermissions`, `useAuth`, `useSystemHealth`, `OrgProvider`.
3. **Tests edge** — 2/32 fonctions testées. 30 EF sans filet (paths critiques : `ai-coach`, `academy-generate`, `verify-certificate`, `trigger-email`).
4. **Rate limiting partiel** — Seules 2/32 EF protégées. À étendre : `adjust_credits` (RPC), `send-invitation`, `send-test-email`, `email-marketing-ai`, `business-quote`.
5. **Vault pgsodium** — Reporté Lot 9 (refacto multi-EF).

## 🟢 Aucune régression UI/route détectée
- `App.tsx` : 110 routes, toutes pointent vers des composants existants.
- `0 TODO/FIXME/@ts-ignore` dans `src/`.
- Realtime, AuthGuard, OrgProvider, multi-shell : opérationnels.
- ⌘K Command Palette : actif et étendu (`AdminEmails`, `AdminHealth`).

---

# 📋 Lot 9 — Périmètre proposé

## Brique A — Fix cron purge tokens (CRITIQUE, < 5 min)
- Inspecter le schéma actuel de `email_unsubscribe_tokens` et `email_confirmation_tokens` (colonnes restantes après Lot 6).
- Réécrire la fonction `purge_expired_email_tokens()` avec les bons noms (probable : `created_at` + TTL applicatif, ou `revoked_at`).
- Vérifier que le cron repart vert au prochain run (3h00 UTC).

## Brique B — Productivité 8 pages admin
Migrer vers `DataTable` avec `selectable`, `exportable`, URL filters, saved views :
- `AdminAudit` (déjà partiellement)
- `AdminLogs`
- `AdminBilling`
- `AdminAcademyPaths`
- `AdminAcademyCertificates`
- `AdminAcademyAssets`
- `AdminUCM` (liste projets)
- Vérification `AdminOrganizations` (déjà DataTable, ajouter exportable si manquant)

## Brique C — Rate limiting étendu (5 cibles)
- `adjust_credits` — trigger `BEFORE INSERT` sur `credit_transactions` appelant `check_rate_limit('credits.adjust', 20, 3600)`.
- `send-invitation` — 30/h par utilisateur.
- `send-test-email` — 10/h par utilisateur.
- `email-marketing-ai` — 50/h par org (génération IA coûteuse).
- `business-quote` — 20/h par utilisateur.

## Brique D — Vault pgsodium (3 secrets)
1. Activer extension `pgsodium`.
2. Helper `app_get_secret(_secret_id uuid)` SECURITY DEFINER avec audit log.
3. Migrer : `ai_configurations.api_key`, `email_provider_configs.credentials`, `email_webhook_secrets.secret`.
4. Patcher EFs consommatrices : `ai-coach`, `ai-deliverables`, `ai-reflection`, `analyze-challenge`, `practice-copilot`, `process-email-queue`, `process-email-priority-queue`, `trigger-email`.
5. Audit log à chaque déchiffrement.

## Brique E — Suite de tests Deno + Vitest
**Edge (Deno)** :
- `verify-certificate/index_test.ts` (valide / révoqué / inexistant)
- `trigger-email/index_test.ts` (rate limit + tenant scoping)
- `_shared/rate-limit_test.ts` (allowed/blocked/reset window)
- `_shared/email-security_test.ts` (sanitize HTML XSS)

**Frontend (Vitest)** :
- `src/hooks/usePermissions.test.tsx` — 12 rôles × 8 actions critiques.
- `src/hooks/useAuth.test.tsx` — sign in/out/refresh profile.
- `src/lib/exportCsv.test.ts` (compléter cas multi-locale).

## Brique F — Cleanup pg_cron
- Cron quotidien `cleanup_rate_limits()` (déjà créé, vérifier programmation).
- Cron hebdo purge `audit_logs_immutable` > 90 jours.

---

## Critères d'acceptation Lot 9

1. ✅ `purge_expired_email_tokens` repasse au vert (cron 3h00).
2. ✅ 8 pages admin équipées de `DataTable selectable exportable` + URL filters.
3. ✅ 5 nouvelles cibles rate-limitées (3 EF + 1 RPC + 1 trigger).
4. ✅ `psql -c "SELECT api_key FROM ai_configurations LIMIT 1"` renvoie `NULL` (Vault).
5. ✅ ≥ 7 nouveaux fichiers de test (4 Deno + 3 Vitest), tous au vert.
6. ✅ Cron `cleanup_rate_limits` actif et `last_status='succeeded'`.
7. ✅ Linter : 0 nouvelle erreur (warnings stables ≤ 43).

## Hors périmètre (Lot 10+)
- Migration des 41 SECURITY DEFINER vers SECURITY INVOKER (refacto majeur, ROI faible).
- Saved views partagées en équipe (table + RLS).
- Refacto routes en `<Route>` imbriqués.
- Cohorts/observability dashboards business.

## Ordre d'exécution recommandé
**Brique A** (fix cron) → **B** (productivité, sans risque DB) → **C** (rate limiting, isolé) → **F** (cleanup cron) → **E** (tests) → **D** (Vault, le plus risqué, en dernier avec validation EF par EF).

## Documentation à produire
- `docs/releases/v2.9-lot-9-vault-productivity.md`
- Mise à jour `mem://security/rate-limiting.md` avec les 5 nouvelles cibles
- Création `mem://technical/secrets-vault-architecture.md`
- Mise à jour `docs/releases/README.md`
