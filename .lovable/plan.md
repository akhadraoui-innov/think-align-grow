
# Audit complet plateforme — état post Lots 1-5

## Note méthodologique
Audit réalisé en lecture seule : linter Supabase, scan sécurité, inventaire pages/routes/edge functions/migrations/tests, vérif adoption Lots 1-5. Tous les chiffres ci-dessous sont **constatés**, pas estimés.

---

## 1. Vue chiffrée

| Domaine | Métrique |
|---|---|
| Pages admin | **40** |
| Edge functions | **32** |
| Migrations SQL | **87** |
| Routes définies | **80+** (`src/App.tsx`) |
| Tests fichiers | **5** (`example`, `exportCsv`, `ImpersonationBanner`, `delete-user_test`, `impersonate-user_test`) |
| Linter Supabase | **0 finding** ✅ |
| Scan sécurité | **17 findings** (6 errors, 11 warnings) ⚠️ |
| `audit_logs_immutable` | 2 entrées (système quasi neuf en prod) |
| Données réelles | 1 user, 1 org, 1 profile (tenant pilote) |

---

## 2. Fonctionnel — ce qui est livré et opérationnel

### ✅ Solide
- **Lot 1 (admin unifié)** : `useAdminUsers`, `DataTable`, typage strict `AppRole`.
- **Lot 2 (RGPD + garde-fous)** : `delete-user` Edge Function avec archive JSON + anonymisation, `count_users_by_role` pour bloquer les retraits massifs.
- **Lot 3 (status)** : suspend/reactivate atomique, audité.
- **Lot 4 (sécurité op)** : `requires_2fa` SQL, `Force2FAGuard`, page `/account/security`, edge function `impersonate-user`, `ImpersonationBanner`, override `usePermissions` en read-only, audit immuable.
- **Lot 5 (productivité)** : `useUrlFilters`/`useSavedViews`/`useBulkSelection`, `exportCsv` RFC 4180 + tests verts, `DataTable` patché (`selectable`/`exportable`/`bulkActions`), pilote complet sur `AdminUsers`.

### ⚠️ Adoption partielle Lot 5 (constaté)
- **6 pages utilisent `DataTable`** mais **seul `AdminUsers` exploite `selectable`/`exportable`/URL filters/saved views**.
- Pages restantes à roller-out : `AdminOrganizations`, `AdminAudit`, `AdminLogs`, `AdminBilling`, `AdminAcademyTracking` (qui a son propre export legacy à harmoniser).

### ❌ Manquant fonctionnel
- **Pas de Command Palette ⌘K** alors qu'elle figurait dans le plan Lot 5 ; le composant `cmdk` shadcn est présent mais non instancié.
- **Pas de saved views partagées** (localStorage uniquement → perdues au changement de navigateur).
- **Bulk actions absentes** sur Organizations (suspend toute une org).

---

## 3. Sécurité — 6 errors + 11 warnings (scan plateforme)

### 🔴 ERRORS (6) — exploitables, à fermer en priorité

| # | Surface | Risque concret |
|---|---|---|
| **S1** | `realtime.messages` sans RLS | N'importe quel user authentifié peut s'abonner à n'importe quel topic (workshops, notifications d'autrui, challenge_responses…). **Faille la plus critique du système**. |
| **S2** | `email_confirmation_tokens` policy SELECT `USING (true)` rôle `public` | Tokens de confirmation et emails lisibles **sans authentification**. |
| **S3** | `email_unsubscribe_tokens` policy SELECT `USING (true)` rôle `public` | Même problème : énumération de tous les emails + désabonnement non consenti possible. |
| **S4** | `ai_configurations.api_key` en clair | Toute la SaaS Team peut lire les clés API IA. Une compromission d'un saas_analyst = exfiltration totale. |
| **S5** | `email_provider_configs.credentials` JSONB en clair | Org admins peuvent lire les credentials SMTP/Resend. |
| **S6** | `email_webhook_secrets` en clair lisible par toute la SaaS Team | Permet de forger des webhooks signés. |

### 🟠 WARNINGS (11) résumés
- Academy : `academy_practices`, `academy_contents`, `academy_exercises`, `academy_quizzes`, `academy_quiz_questions` lisibles par **n'importe quel user authentifié si le module existe** → exposition `system_prompt`, `correct_answer`, `evaluation_rubric`.
- `email_categories` : SELECT `USING (true)` rôle `public`.
- `email_automations_read_global` / `email_templates_read_global` : tout user authentifié lit les templates et automations globaux.
- `academy-assets` storage : tout user authentifié peut écraser n'importe quel fichier (pas de check ownership).
- `ucm-exports` storage : pas de DELETE pour membres org + INSERT non vérifié côté serveur.
- `profiles` : risque latent (pas d'erreur immédiate).

### Constat positif
- `supabase--linter` retourne **0 finding** : aucune table sans RLS, search_path correctement configuré sur les SECURITY DEFINER vérifiés (résultat vide = conforme).

---

## 4. Technique / DB

### ✅ Bon
- 87 migrations versionnées, ordre temporel cohérent.
- `audit_logs_immutable` en place et utilisé par les Lots 2-4.
- `usePermissions` overridé pour bloquer impersonation read-only.
- `types.ts` régénéré (5715 lignes).

### ⚠️ Points de vigilance
- **Tests** : 5 fichiers seulement, dont 2 nouveaux Lot 4. Pas de test unitaire `usePermissions` (le cœur du contrôle d'accès), ni `useUrlFilters`, ni `useBulkSelection`.
- **Edge functions** : 3 fonctions email (`send-test-email`, `test-email-provider`, `email-marketing-ai`) n'ont pas été corrigées (mentionnées en fin Lot 4).
- **Pas de `check_rate_limit`** : retiré du Lot 4. Reste un trou : un attaquant avec JWT admin peut spammer `delete-user`.

---

## 5. Edge functions (32) — état

- **Sensibles auditées** : `delete-user` ✅, `impersonate-user` ✅, `verify-certificate` (public OK), `trigger-email`.
- **Sans tests** : 30 sur 32. Notamment `business-quote`, `ucm-*` (5 fonctions), `academy-generate` (au cœur du business simulator).
- **Risque moyen** : `process-email-priority-queue` + `process-email-queue` cohabitent — vérifier doublon ou priorité voulue (à confirmer avec PO).

---

## 6. UI / Navigation

### ✅ Bon
- Multi-shell architecture stable (`AppShell` / `PortalShell` / `WorkspaceShell`).
- `ImpersonationBanner` global dans `AppShell`.
- Routes admin lisibles, profondeur cohérente (`/admin/<scope>/<resource>/:id`).

### ⚠️ À renforcer
- **Pas d'OrgSwitcher visible côté Admin** dans cet audit (à vérifier — sinon impossible de naviguer entre tenants).
- Pas de breadcrumbs sur les pages admin profondes (`/admin/academy/paths/:id` etc.).
- 80+ routes déclarées en flat dans `App.tsx` — devient ingérable. Refacto en `<Route>` imbriqués envisageable (Lot 7+).

---

## 7. Plan de remédiation : **Lot 6 — Hardening sécurité plateforme**

### Pourquoi maintenant (vue PO)
Les Lots 1-5 ont solidifié l'**administration**. Le scan révèle que la couche **données / temps réel / secrets** reste fragile — c'est la zone qui peut faire perdre un client en une heure (fuite emails, clés API exfiltrées, écoute realtime). Avant d'ajouter des features (observabilité, onboarding entreprise), on ferme ces trous.

### Brique 1 — Realtime sécurisé (S1) [PRIORITÉ ABSOLUE]
- Ajouter RLS sur `realtime.messages` scopée par `auth.uid()` + topic.
- Pattern recommandé : helper `is_realtime_authorized(_user_id, _topic)` SECURITY DEFINER, basé sur `is_workshop_participant` / `notification_owner` déjà existants.
- Tests : un user A ne peut pas s'abonner aux notifications de B.

### Brique 2 — Tokens email & catégories (S2, S3, warnings email)
- `email_confirmation_tokens` : DROP de la policy SELECT publique → service_role only. Validation token via fonction RPC `validate_confirmation_token(_token)`.
- Idem `email_unsubscribe_tokens` → RPC `validate_unsubscribe_token`.
- `email_categories` : restreindre à `authenticated` minimum.
- `email_templates_read_global` / `email_automations_read_global` : restreindre à SaaS team.

### Brique 3 — Chiffrement des secrets (S4, S5, S6)
- Activer **Vault Supabase** (pgsodium déjà disponible).
- Migrer 3 colonnes :
  - `ai_configurations.api_key` → `vault.secrets`, ne stocker que `secret_id`.
  - `email_provider_configs.credentials` → idem.
  - `email_webhook_secrets.secret` → idem.
- Helper SQL `get_decrypted_secret(_secret_id)` SECURITY DEFINER avec garde rôle.
- Patcher les 3-4 edge functions concernées (`trigger-email`, `test-email-provider`, `ai-coach`…) pour récupérer via RPC.
- Audit log à chaque déchiffrement (`secret.accessed`).

### Brique 4 — Academy access control (warnings)
- Ajouter helper `has_academy_access(_user_id, _module_id)` qui check enrollment via `academy_progress` ou `academy_path_assignments`.
- Remplacer `view_practices`/`view_contents`/`view_exercises`/`view_quizzes`/`view_quiz_q` par cette vérification.
- Cas particulier `quiz_q.correct_answer` : retourner `null` côté SELECT tant que la réponse n'est pas soumise (vue dédiée ou colonne masquée).

### Brique 5 — Storage hardening
- `academy-assets` : INSERT/UPDATE limité à SaaS team (cohérent avec design : assets pédagogiques curés).
- `ucm-exports` : ajouter DELETE pour `org_admin`, vérifier path `^{org_id}/` côté policy avec `storage.foldername()[1] = org_id::text`.

### Brique 6 — Tests E2E sécurité (filet)
Suites Vitest + Deno :
- `realtime-isolation_test.ts` : user A ne reçoit pas les events de B.
- `email-tokens_test.ts` : 401 sur SELECT public sans token valide.
- `secrets-vault_test.ts` : un saas_analyst ne peut pas appeler `get_decrypted_secret` sans rôle approprié.
- `academy-access_test.ts` : non-enrolled = 0 ligne sur 5 tables academy.
- Ajouter test unitaire `usePermissions.test.tsx` (cœur du système).

---

## 8. Hors périmètre Lot 6 (vrais Lot 7+)

| Sujet | Pourquoi reporter |
|---|---|
| Rate limiting `delete-user`/`adjust_credits` | Indépendant du hardening DB ; tracked pour Lot 7. |
| Roll-out complet Lot 5 sur 5 pages restantes | Productivité, pas sécurité. Peut s'enchaîner après Lot 6. |
| Command Palette ⌘K | Productivité, low risk. |
| Cohorts / observability dashboards | Lot business (Lot 8). |
| Refacto routes en `<Route>` imbriqués | Pure DX, sans gain immédiat utilisateur. |

---

## 9. Critères d'acceptation Lot 6

1. `security--run_security_scan` passe de **17 → ≤ 4 warnings** (les 4 résiduels documentés et acceptés).
2. **0 error** restant.
3. `supabase--linter` toujours à 0 finding.
4. Aucun token email lisible sans authentification (test `curl` direct).
5. Un user authentifié ne reçoit aucun event Realtime concernant un workshop dont il n'est pas participant.
6. Un saas_analyst tentant `SELECT api_key FROM ai_configurations` → policy refuse OU récupère uniquement un `secret_id` opaque.
7. Suites de tests sécurité (5 nouvelles) au vert.

---

## 10. Effort & risque

| Brique | Complexité | Risque migration |
|---|---|---|
| Realtime RLS | Moyenne | Moyen (peut casser des subscribes existants → tester chaque feature realtime) |
| Tokens email | Faible | Faible (impacte seulement auth-email-hook + unsubscribe) |
| Vault secrets | Élevée | Moyen (3 EF à patcher, rollback testé) |
| Academy access | Moyenne | Moyen (enrollment doit exister sur tous les chemins légitimes) |
| Storage | Faible | Faible |
| Tests | Moyenne | Très faible |

**Livraison estimée** : 1 bloc, livrable sans interruption utilisateur final si on respecte l'ordre Brique 2 → 5 → 4 → 3 → 1 → 6.

---

## 11. Ordre d'exécution proposé

1. **Brique 2** (tokens email) — quick win, faible risque, ferme 2 errors publics.
2. **Brique 5** (storage) — quick win, indépendant.
3. **Brique 4** (academy) — moyen, borné.
4. **Brique 3** (vault secrets) — gros morceau, on déroule avec tests à chaque étape.
5. **Brique 1** (realtime) — sensible, en dernier pour pouvoir rollback proprement.
6. **Brique 6** (tests) — au fil de l'eau + suite finale.

Mémoire à mettre à jour : `mem://security/data-protection-baseline.md` + `mem://index.md`.

Prêt à lancer dès ton OK.
