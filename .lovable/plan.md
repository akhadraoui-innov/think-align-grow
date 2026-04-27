# Audit complet — État de la plateforme (post Lot 9 — clôturé)

## ✅ Santé globale : EXCELLENTE

| Indicateur | Valeur (post Lot 9.3) |
|---|---|
| Tables / RLS activées / Policies | 107 / 107 / 267 |
| Edge functions | 32 (toutes déployées) |
| Cron jobs actifs | 5 (purge tokens fixé, cleanup_rate_limits actif) |
| Cron 24h | 17 214 succès / 1 échec (pré-fix Lot 9.1, prochain run vert attendu) |
| Erreurs HTTP edge (1h) | 0 |
| Secrets en clair (Vault tables) | **0 / 0 / 0** (ai_keys / email_creds / webhook_secrets) |
| Findings critiques | 0 |
| Findings warn | 48 (42 baseline Lot 7 + 6 nouveaux RPCs Vault, tous service_role only) |
| Tests Vitest | 16/16 ✅ (usePermissions, useDeleteUser, exportCsv) |
| Tests Deno | 16 tests (email-security, vault_helpers, verify-certificate, delete-user, impersonate-user) |
| Release notes | v2.4 → **v2.9.3** + 11 modules ✅ |

---

## 📦 Lot 9 — Périmètre livré (3 sous-lots)

### Lot 9.1 — Fix cron + Productivité + Cleanup
- ✅ Brique A : Fix `purge_expired_email_tokens_daily` (régression Lot 6 corrigée)
- ✅ Brique B : URL filters + Saved Views sur AdminLogs, AdminAudit
- ✅ Brique F : Cron `cleanup_rate_limits_daily` programmé (04:00 UTC)

### Lot 9.2 — Tests Vitest critiques
- ✅ Brique E (frontend) : 16/16 tests
  - `usePermissions.test.tsx` (5)
  - `useDeleteUser.test.tsx` (3)
  - `exportCsv.test.ts` (5 ajouts)

### Lot 9.3 — Vault pgsodium + Tests Deno
- ✅ Brique D : Extension Vault, 5 RPCs SECURITY DEFINER, 3 colonnes `*_secret_id`, 3 triggers auto-chiffrement
- ✅ Brique D bis : 8 EFs patchées (ai-coach, ai-deliverables, ai-reflection, analyze-challenge, generate-toolkit, refine-toolkit, trigger-email, process-email-priority-queue)
- ✅ Brique E (Deno) : 16 tests (email-security, vault_helpers, verify-certificate)

### ❌ Hors livraison (décision validée)
- **Brique C — Rate limiting étendu** : annulé (politique plateforme : pas de nouvelles primitives backend)
- **Tests Vitest auth/systemHealth/orgProvider** : reportés (couverture critique déjà assurée par 9.2)

---

## 🟢 Aucune régression détectée
- 110 routes mappées (cabinet + portal)
- 0 TODO/FIXME/@ts-ignore dans `src/`
- AuthGuard, OrgProvider, multi-shell, Realtime : opérationnels
- ⌘K Command Palette : actif
- 8 EFs IA + email redéployées et testées

## 🟡 Backlog Lot 10+ (à arbitrer)
1. **DataTable rollout finition** — 6 pages admin restantes (`AdminBilling`, `AdminAcademyPaths`, `AdminAcademyCertificates`, `AdminAcademyAssets`, `AdminUCM`, `AdminOrganizations` exportable)
2. **Tests Vitest étendus** — `useAuth`, `useSystemHealth`, `OrgProvider` (≥ 12 tests cibles)
3. **Tests Deno étendus** — `trigger-email`, `_shared/rate-limit` (RPC), `_shared/email-render`
4. **Migration SECURITY DEFINER → INVOKER** des 41 fonctions baseline (refacto majeur, ROI à arbitrer)
5. **Saved views partagées en équipe** (table + RLS)
6. **Dashboards business observability** (cohorts, funnels)
7. **Vault rotation** — UI admin pour rotation programmée des secrets

## 📚 Documentation produite (Lot 9)
- `docs/releases/v2.9.1-lot-9-fix-productivity.md`
- `docs/releases/v2.9.2-lot-9-tests.md`
- `docs/releases/v2.9.3-lot-9-vault-deno.md`
- `docs/releases/README.md` (index à jour)
- `.lovable/memory/security/rate-limiting.md`
- `.lovable/memory/technical/secrets-vault-architecture.md`

## 🔐 Architecture Vault (référence rapide)
**Tables protégées** : `ai_configurations`, `email_provider_configs`, `email_webhook_secrets`
**Pattern d'écriture** : trigger BEFORE INSERT/UPDATE → secret chiffré, colonne legacy vidée
**Pattern de lecture EF** : `cfg.api_key` → `cfg.api_key_secret_id` via RPC `get_ai_api_key` → fallback `LOVABLE_API_KEY`
**Audit** : chaque appel `app_get_secret` log dans `audit_logs` avec contexte
