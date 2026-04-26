# Audit complet post Lot 6 — Préparation Lot 7

## 1. Vue chiffrée (constat 26 avril, post Lot 6)

| Domaine | Métrique |
|---|---|
| Pages admin | **40** |
| Edge functions | **32** |
| Migrations SQL | **91** (4 nouvelles Lot 6) |
| Tests fichiers | **5** (inchangé — dette persistante) |
| Linter Supabase | **112 warn** (1 seul type : `pg_graphql_anon_table_exposed`) |
| Scan sécurité | **122 findings** (4 errors restants, 6 warnings hors graphql) |
| Findings métier critiques | **4 errors** secrets/realtime (cf §3) |

---

## 2. Bilan Lot 6 — ce qui a réellement été livré

### ✅ Fermé
- **B2 tokens email** : `email_confirmation_tokens` et `email_unsubscribe_tokens` sortis du SELECT public, RPC `validate_*_token` opérationnelles.
- **B5 storage** : `academy-assets` write réservé SaaS Team, `ucm-exports` DELETE org-scoped, `avatars` retiré de `anon`.
- **B4 academy** : helper `has_academy_access`, vues `academy_quiz_questions_safe` et `academy_certificates_public`, INSERT sur `academy_progress` borné par enrollment.
- **B6 doc** : `mem://security/data-protection-baseline.md` créée.

### ⚠️ Partiel / régression
- **B1 Realtime** : la migration `20260426114415` a tenté un `DROP POLICY` puis `CREATE POLICY` sur `realtime.messages` avec un bloc `EXCEPTION WHEN insufficient_privilege` qui **avale silencieusement l'échec**. Le scan sécurité revient avec une `error` MISSING_RLS sur `realtime.messages` → **la policy n'a pas été créée**. À refaire via `realtime.broadcasts_authorized` (API officielle Supabase) ou via une fonction trigger côté application.
- **B3 Vault secrets** : reporté → 3 errors persistantes (`ai_configurations.api_key`, `email_provider_configs.credentials`, `email_webhook_secrets.secret`).

### ❌ Non traité
- **3 edge functions email** (`email-events`, `process-email-queue`, `process-email-priority-queue`) : build errors de typage corrigés, mais aucune validation fonctionnelle (déploiement non testé).
- **Aucun test E2E sécurité** (B6 du Lot 6).

---

## 3. Findings résiduels (122 → priorisés)

### 🔴 Errors (4) — bloquants
| # | Surface | Origine | Décision Lot 7 |
|---|---|---|---|
| E1 | `realtime.messages` sans RLS effective | Migration silencieusement avalée | **Refaire via API Realtime officielle** |
| E2 | `ai_configurations.api_key` plaintext | Pas migré | **Vault pgsodium** |
| E3 | `email_provider_configs.credentials` plaintext | Pas migré | **Vault pgsodium** |
| E4 | `email_webhook_secrets.secret` plaintext | Pas migré | **Vault pgsodium** |

### 🟠 Warnings métier (6 hors graphql)
- `academy_certificate_config.api_key_hash` plaintext → migrer Vault avec E2-E4.
- `profiles` / `email_automation_runs` / `email_send_log` / `observatory_assets` / `audit_logs_immutable` : informationnels, configuration restrictive volontaire — à documenter et `ignore` côté scan.

### 🟡 112 warnings `pg_graphql_anon_table_exposed`
- **Cause** : 112 tables/vues de `public` ont `GRANT SELECT` au rôle `anon` → pg_graphql expose leur schéma via `/graphql/v1` (pas les données, RLS protège).
- **Impact réel** : faible. Énumération des tables possible sans authentification, mais aucune donnée exposée.
- **Fix** : `REVOKE SELECT ON ALL TABLES IN SCHEMA public FROM anon` puis `GRANT` ciblé sur les rares tables qui doivent rester publiques (`academy_certificates_public`, `cards` publiques certificat). À faire en **un sweep** Lot 7.

---

## 4. Dette technique transverse

### Tests
- Toujours **5 fichiers** pour 32 edge functions + 80 routes. Pas de tests `usePermissions`, `useUrlFilters`, `useBulkSelection`, ni des helpers SECURITY DEFINER ajoutés aux Lots 4-6.
- **Lot 7 doit livrer** une suite minimale : `permissions.test.tsx`, `realtime-isolation_test.ts`, `vault-secrets_test.ts`, `email-tokens_test.ts`.

### Productivité (Lot 5 — adoption partielle)
- Seul `AdminUsers` exploite `selectable`/`exportable`/URL filters/saved views.
- 5 pages restantes : `AdminOrganizations`, `AdminAudit`, `AdminLogs`, `AdminBilling`, `AdminAcademyTracking`.
- **⌘K Command Palette** absente.
- À traiter en **Lot 8** (productivité), après hardening complet.

### Edge functions sans tests
- 30/32 sans test. Sensibles non couvertes : `business-quote`, `ucm-*` (5), `academy-generate`, `practice-copilot`, `verify-certificate`.

### Routes
- `App.tsx` : 80+ routes flat. Refacto en routes imbriqués → Lot 9 DX.

---

## 5. Plan **Lot 7 — Vault, Realtime fix, GraphQL exposure, tests**

### Brique A — Refonte Realtime (E1) [PRIORITÉ]
1. Vérifier l'API actuelle Supabase Realtime : `realtime.send` requiert un check applicatif (pas de RLS sur `messages` directement en mode hosted).
2. Approche recommandée : ne plus tenter de modifier `realtime.messages` directement. À la place :
   - Auditer chaque `useEffect` qui fait `supabase.channel('xxx').subscribe()` côté client.
   - Pour les canaux sensibles (workshops, notifications, challenge_responses), passer par **Postgres Changes filtrés** (déjà protégés par RLS des tables sources) au lieu de Broadcast/Presence libres.
   - Documenter dans `mem://security/data-protection-baseline.md` la règle : **pas de Broadcast/Presence non scopé**.
3. Marquer le finding E1 comme `ignore` avec justification une fois la migration code terminée et auditée.

### Brique B — Vault pgsodium (E2, E3, E4 + warning certificate_config)
1. Activer `pgsodium` (déjà disponible sur Supabase Hosted).
2. Créer table `app_secrets` (id, label, secret_id uuid → vault.secrets, owner_scope, created_at).
3. Migration des données existantes :
   - `ai_configurations.api_key` → ajouter colonne `api_key_secret_id uuid`, copier dans Vault, NULL la colonne plaintext, retirer du SELECT.
   - Idem `email_provider_configs.credentials` (JSONB → un secret par champ ou JSON chiffré global).
   - Idem `email_webhook_secrets.secret`.
   - Idem `academy_certificate_config.api_key_hash`.
4. Helper SQL `app_get_secret(_secret_id uuid)` SECURITY DEFINER, garde sur rôle (saas team uniquement pour ai_configurations, org_admin pour email_provider).
5. Patcher 4 edge functions : `ai-coach` (déjà multi-provider), `trigger-email`, `test-email-provider`, `verify-certificate`.
6. Audit log à chaque déchiffrement (`secret.decrypted`) avec `actor_id` + `purpose`.

### Brique C — pg_graphql exposure (112 warnings)
1. Audit : lister toutes les tables qui doivent vraiment être publiques (vues `_public`, certificats publics, ai_providers).
2. `REVOKE SELECT ON ALL TABLES IN SCHEMA public FROM anon;`
3. `GRANT SELECT` ciblé sur la liste blanche (≤ 5 objets attendus).
4. Vérifier que ça ne casse pas les flows publics (`/certificate/:id`, `/auth`).
5. Re-scan : 112 → ~3 warnings restants attendus, légitimes.

### Brique D — Tests filet sécurité (couverture cœur)
1. `src/hooks/usePermissions.test.tsx` : 12 rôles × 5 actions principales.
2. `src/hooks/useUrlFilters.test.ts` + `useBulkSelection.test.ts`.
3. `supabase/functions/_shared/realtime-isolation_test.ts` (Deno) : user A vs canal user B.
4. `supabase/functions/trigger-email/index_test.ts` : couverture happy path + secret manquant.
5. `supabase/functions/verify-certificate/index_test.ts` : certificat valide / révoqué / inexistant.

### Brique E — Validation edge functions email (post-Lot 6)
1. Déployer `email-events`, `process-email-queue`, `process-email-priority-queue` et tester un envoi end-to-end.
2. Vérifier que les corrections de typage (any cast) n'ont pas masqué un bug logique.

### Brique F — Documentation & memory
1. Mettre à jour `mem://security/data-protection-baseline.md` :
   - Règle Realtime renforcée (pas de Broadcast non scopé).
   - Règle Vault (tous les secrets via `app_get_secret`).
2. Créer `mem://technical/secrets-vault-architecture.md`.
3. Mettre à jour `mem://index.md`.

---

## 6. Critères d'acceptation Lot 7

1. `security--run_security_scan` passe de **122 → ≤ 5 warnings**, **0 error**.
2. `supabase--linter` : ≤ 5 warnings sur pg_graphql (au lieu de 112).
3. `psql -c "SELECT api_key FROM ai_configurations"` retourne `NULL` partout.
4. Realtime : un user A ne reçoit aucun event Broadcast d'un canal user B (test Deno).
5. Suite de tests cœur (≥ 5 nouveaux fichiers) au vert.
6. 3 edge functions email déployées et un envoi pilote validé.

---

## 7. Hors périmètre Lot 7 (Lot 8+)

| Sujet | Pourquoi reporter |
|---|---|
| Roll-out Lot 5 sur 5 pages | Productivité, post-hardening complet |
| Command Palette ⌘K | Productivité |
| Rate limiting `delete-user`/`adjust_credits` | Lot 8 ops |
| Refacto routes en `<Route>` imbriqués | DX, Lot 9 |
| Cohorts / observability dashboards | Lot 10 business |

---

## 8. Effort & risque

| Brique | Complexité | Risque migration |
|---|---|---|
| A Realtime | Moyenne | Moyen (audit code client requis) |
| B Vault | **Élevée** | **Élevé** (4 EF à patcher, rollback testé pré-prod obligatoire) |
| C GraphQL exposure | Faible | Faible |
| D Tests | Moyenne | Très faible |
| E Email EF | Faible | Moyen (pas de test fonctionnel post-fix) |
| F Doc | Faible | Nul |

**Ordre d'exécution recommandé** : C → D (filet) → E (validation EF) → A (realtime) → B (vault, gros morceau en dernier avec rollback prêt) → F (doc finale).

**Livraison estimée** : 1 lot, 2-3 itérations attendues sur la Brique B.
