---
name: Operational security hardening (Lot 4)
description: 2FA TOTP obligatoire pour la SaaS Team, impersonation auditée read-only, tests E2E des flux destructifs
type: feature
---

## 2FA obligatoire (SaaS Team)

- Fonction SQL `requires_2fa(user_id) → boolean` : `is_saas_team(user) AND no verified TOTP factor`.
- Hook `use2FA` : `enroll`, `verify`, `unenroll`, `factors`, `hasVerifiedTotp` (Supabase Auth `mfa.*` natif).
- Page `/account/security` : QR code + saisie 6 chiffres + secret manuel, bouton désactivation (sauf si requires_2fa true).
- `Force2FAGuard` : monté à l'intérieur de `AdminGuard`, redirige toute SaaS Team sans TOTP vérifié vers `/account/security?setup=1`.
- Logs immuables via `append_audit_log` à brancher si besoin (déjà loggé par les triggers d'auth Supabase).

## Impersonation auditée

- Edge Function `impersonate-user` (super_admin only) : génère un magic link via `auth.admin.generateLink` redirigé vers `/impersonating?path=…`.
- Refus : self, target=super_admin, UUID invalide.
- TTL effectif : 30 min côté UI (badge sticky avec compte à rebours).
- Trace immuable : `append_audit_log('impersonation.started', …, {executed_by, executed_by_email, target_email, expires_at, reason})`.
- Notification email RGPD : `dispatch_email_event('user.impersonated', …)` (à câbler dans email-platform si pas déjà présent).
- État dans `sessionStorage["heeplab.impersonation"]` : `{active, targetEmail, startedAt, expiresAt}`.
- `usePermissions` lit ce state et **filtre les permissions à `*.view`/`*.read` uniquement** + force `isSuperAdmin = false`. Aucune mutation possible pendant l'impersonation, même si la cible est admin.
- `ImpersonationBanner` (sticky rouge, monté dans toutes les branches d'AppShell) avec bouton "Quitter" → `signOut` + `setImpersonationState({active:false})`.
- Bouton `ImpersonateButton` (super_admin only) dans la Danger Zone de `UserInfoTab`, à côté du bouton de suppression RGPD.

## Tests

- `supabase/functions/impersonate-user/index_test.ts` : auth, validation UUID, CORS.
- `supabase/functions/delete-user/index_test.ts` : auth, validation, CORS (non-régression Lot 2).
- `src/components/layout/ImpersonationBanner.test.tsx` : visibilité conditionnelle.

## Hors périmètre Lot 4

- Rate limiting : retiré, en attente des primitives plateforme natives.
- WebAuthn / passkeys, SSO entreprise : Lots ultérieurs.
