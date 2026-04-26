# Lot 4 — Sécurité opérationnelle (vue Product Owner)

## Pourquoi ce lot maintenant

Lots 1-3 ont fermé les **failles fonctionnelles** (crédits atomiques, suppression RGPD, garde-fou permissions). Lot 4 protège contre les **attaques réelles** : compte admin compromis, support qui dérape, régression silencieuse en prod.

C'est le palier qui sépare un SaaS "propre" d'un SaaS **vendable à un grand compte** (due diligence sécurité, RGPD article 32).

## Note importante sur le rate limiting

Le plan précédent prévoyait un rate limiting maison (table `rate_limits` + fonction). Après vérification, **la plateforme ne dispose pas encore des primitives natives** pour le faire proprement. Toute implémentation maison serait ad-hoc et créerait de la dette technique. **Décision : on retire cette brique du Lot 4.** Elle reviendra quand l'infra le supportera nativement.

Reste donc 3 briques solides, livrables sans dette.

---

## Brique 1 — 2FA obligatoire pour la SaaS Team

### Le problème métier
Aujourd'hui, le mot de passe d'`akhadraoui@asmos-consulting.com` est le **seul rempart** vers la suppression de comptes, l'ajustement de crédits, la bascule de permissions. Un mot de passe deviné = jeu terminé.

### Ce qu'on met en place

- Activation TOTP via Supabase Auth natif (Google Authenticator / 1Password). **Aucune dépendance externe.**
- Page `/account/security` dans le shell Portal : QR code, vérification 6 chiffres, codes de récupération à imprimer.
- **Garde global** `Force2FAGuard` : si un user porte un rôle SaaS Team (5 rôles : `super_admin`, `customer_lead`, `innovation_lead`, `performance_lead`, `product_actor`) **et** n'a pas de facteur MFA actif → redirigé sur `/account/security/setup` au prochain login. Pas de bypass possible.
- **Logs immuables** : chaque enrollment / désactivation / échec → `append_audit_log('mfa.enrolled' | 'mfa.disabled' | 'mfa.failed', …)` (chaîne SHA-256 déjà déployée Lot 2).

### Réutilise
`has_role`, `app_role`, `audit_logs_immutable`, `AuthGuard`, `useAuth`, design system Studio, `is_saas_team`.

### Critère d'acceptation
Un super_admin sans 2FA tente d'aller sur `/admin/users` → redirection forcée sur le setup. Impossible d'accéder à un écran admin sans avoir validé un TOTP.

---

## Brique 2 — Impersonation auditée

### Le problème métier
Un client se plaint « je ne vois pas mon parcours » → aujourd'hui, le support n'a aucun moyen propre. Il demande le mot de passe (illégal RGPD) ou tâtonne. L'impersonation auditée est le **standard du marché** (Stripe, Linear, Notion).

### Ce qu'on met en place

- Edge Function `impersonate-user` :
  - Super_admin uniquement, vérifié via `has_role`.
  - Génère un **magic link signé** TTL 30 min via `supabaseAdmin.auth.admin.generateLink({ type: 'magiclink' })`.
  - Refus si la cible est super_admin (pas d'impersonation entre admins).
- **Ouverture dans une fenêtre dédiée** : route `/impersonating/:token` qui consume le link et active un mode spécial.
- **Bandeau rouge sticky permanent** en haut de chaque page : « 🛡️ Mode support — Vous êtes connecté en tant que `<email>`. [Quitter] ».
- **Override `usePermissions`** : pendant la session impersonée, retour `read-only` forcé sur tout le scope (aucune mutation possible, même si l'utilisateur impersonné est admin).
- **Auto-déconnexion après 30 min** + bouton "Quitter" qui déclenche `signOut`.
- **Trace immuable** :
  - `append_audit_log('impersonation.started', 'user', target_id, …, {executed_by, expires_at})`
  - `append_audit_log('impersonation.ended', …, {duration_seconds})` à la fin.
- **Notification email au client impersonné** via `dispatch_email_event('user.impersonated', …)` : « Un membre du support a accédé à votre compte le … pendant X minutes ». Transparence RGPD.

### Réutilise
`audit_logs_immutable`, `usePermissions`, edge function pattern Lot 2 (`delete-user`), `dispatch_email_event` (email-platform en place), `has_role`.

### Critère d'acceptation
Depuis `UserInfoTab`, bouton "Voir comme cet utilisateur" (super_admin only). Click → nouvelle session, bandeau rouge visible, tentative de modification → bloquée. Entrée `impersonation.started` visible dans `/admin/audit`. Email reçu par l'utilisateur cible.

---

## Brique 3 — Tests E2E des flux destructifs

### Le problème métier
Aujourd'hui, une régression dans `delete-user`, `adjust_credits` ou `spend_credits` peut passer en prod sans alerte. Pour un système qui touche au RGPD et à l'argent, c'est inacceptable. Une seule suite test (`example.test.ts`) existe — c'est un placeholder.

### Ce qu'on met en place

Suite Deno dans `supabase/functions/__tests__/` :

| Fichier | Couvre |
|---|---|
| `delete-user_test.ts` | super_admin OK ; non-admin → 403 ; auto-suppression → 403 ; cible super_admin → 403 ; archive contient les bonnes clés ; profil bien anonymisé |
| `spend-credits_test.ts` | concurrence (2 appels parallèles → solde correct, pas de double dépense) ; refus si solde insuffisant |
| `count-users-by-role_test.ts` | retourne le bon compte ; exécutable par `authenticated` ; refusé pour anonymous |
| `impersonate-user_test.ts` | super_admin génère un lien valide ; non-admin → 403 ; cible super_admin → 403 ; log immuable créé |
| `permission-toggle_test.ts` | retrait d'une permission > 5 users → log `permission.revoked` créé ; chaîne hash toujours valide après opération |

Lancement via `supabase--test_edge_functions` à chaque livraison.

### Réutilise
Convention `*_test.ts` Deno déjà en place, `example.test.ts` repéré, dotenv loader pour `VITE_SUPABASE_URL` / `VITE_SUPABASE_PUBLISHABLE_KEY`.

### Critère d'acceptation
`supabase--test_edge_functions` → 5 suites vertes, 0 flaky, en moins de 60s.

---

## Architecture — cohérence avec l'existant

| Brique | S'appuie sur | Duplication évitée |
|---|---|---|
| 2FA | `app_role`, `has_role`, `is_saas_team`, `auth.mfa_factors` natif, `AuthGuard`, Studio | ✅ |
| Impersonation | `audit_logs_immutable`, `append_audit_log`, `usePermissions`, `dispatch_email_event`, magic link natif | ✅ |
| Tests E2E | Vitest/Deno déjà configurés, `supabase--test_edge_functions` | ✅ |

**Aucune nouvelle dépendance npm. Aucun service externe. Tout dans Supabase/Lovable Cloud.**

---

## Livrables détaillés (suivi PO)

### Migrations SQL
- Fonction `requires_2fa(_user_id uuid) RETURNS boolean` (SECURITY DEFINER) → vérifie si l'utilisateur a un rôle SaaS Team **et** aucun facteur MFA actif dans `auth.mfa_factors`.

### Edge Functions
- **Nouveau** `supabase/functions/impersonate-user/index.ts`.

### Hooks & UI
- `src/hooks/use2FA.ts` : `enroll()`, `verify()`, `disable()`, `factors`, `loading`.
- `src/pages/account/Security.tsx` : QR code, codes de secours, gestion du facteur.
- `src/components/auth/Force2FAGuard.tsx` : redirige SaaS Team sans MFA actif vers le setup.
- Intégration `Force2FAGuard` dans `AdminGuard` (toutes les routes `/admin/*`).
- `src/hooks/useImpersonation.ts` : détection mode + override `usePermissions` en read-only forcé.
- `src/components/admin/ImpersonateButton.tsx` : bouton dans `UserInfoTab` (super_admin only).
- `src/components/layout/ImpersonationBanner.tsx` : bandeau rouge sticky global, monté dans `AppShell`.
- `src/pages/Impersonating.tsx` : route `/impersonating/:token` qui consomme le magic link.

### Tests
5 fichiers `*_test.ts` listés en Brique 3.

### Mémoire
- `mem://security/operational-hardening.md` : règles 2FA SaaS Team obligatoire, impersonation auditée read-only, tests E2E couverture.
- Mise à jour `mem://index.md`.

---

## Hors périmètre Lot 4 (reporté explicitement)

- **Rate limiting** → en attente des primitives plateforme natives.
- **WebAuthn / passkeys** → Lot 5 (UX premium, après stabilisation TOTP).
- **SSO entreprise (SAML/OIDC)** → Lot 7 quand premier deal Enterprise concret.
- **Dashboard sécurité dédié** (`/admin/security` avec MFA adoption rate, impersonations en cours, anomalies) → Lot 6 (observabilité).
- **Rotation automatique des codes de secours** → Lot 5.

---

## Critères d'acceptation globaux

1. SaaS Team sans 2FA → blocage `/admin/*`, redirection setup. Validation TOTP requise.
2. Bouton "Voir comme cet utilisateur" sur fiche user (super_admin only) → impersonation read-only, bandeau rouge, log audit, email au client.
3. `supabase--test_edge_functions` → 5 suites vertes.
4. `supabase--linter` → 0 nouveau finding.
5. `security--run_security_scan` → 0 régression.
6. Vérification chaîne audit via `verify_audit_chain_integrity()` → toujours valide après opérations Lot 4.

---

## Estimation effort

| Brique | Complexité | Risque |
|---|---|---|
| 2FA | Moyenne (UI + guard + intégration AdminGuard) | Faible (API Supabase native) |
| Impersonation | Moyenne (read-only override fin) | Moyen (à bien tester) |
| Tests E2E | Moyenne (5 suites) | Faible |

**Livrable d'un bloc, sans régression utilisateur final.** Seule la SaaS Team voit le changement (2FA forcé). Les clients ne voient rien — sauf email RGPD lors d'une impersonation les concernant.

---

## Ordre d'exécution

1. Migration SQL (`requires_2fa`).
2. UI 2FA + `Force2FAGuard` + intégration `AdminGuard`.
3. Edge function `impersonate-user` + `useImpersonation` + bouton + bandeau + route `/impersonating/:token`.
4. Suite de tests E2E (5 fichiers).
5. Mise à jour mémoire + linter + scan sécurité + vérification chaîne audit.

Prêt à lancer dès ton OK.