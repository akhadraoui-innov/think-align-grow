---
name: Data protection baseline (Lot 6 + Lot 7)
description: Règles sécurité données — tokens email via RPC, vue safe quizzes, accès Academy via enrollment, realtime Postgres Changes only, EXECUTE verrouillé sur SECURITY DEFINER, certificate publique
type: constraint
---

## Règles obligatoires

**Tokens email** : ne JAMAIS lire `email_confirmation_tokens` ou `email_unsubscribe_tokens` directement côté client. Utiliser exclusivement les RPC `validate_confirmation_token(_token)` et `validate_unsubscribe_token(_token)` (SECURITY DEFINER, GRANT anon+authenticated).

**Quiz Academy** : côté client, lire les questions via la vue `academy_quiz_questions_safe` (sans `correct_answer` ni `explanation`). Le scoring se fait uniquement côté serveur (edge function ou RPC).

**Accès Academy** : `has_academy_access(_user, _module)` est basé sur `academy_enrollments` + `academy_path_modules`. INSERT sur `academy_progress` borné par cette même fonction.

**Realtime — Postgres Changes UNIQUEMENT** : `realtime.messages` est verrouillée au `service_role`. Le code n'utilise QUE Postgres Changes filtrés (protégés par RLS des tables sources : `workshops`, `notifications`, `challenge_responses`, etc.). **Interdiction stricte d'utiliser Broadcast ou Presence non scopés par topic.** Si Broadcast devient nécessaire, créer une edge function de signature côté serveur qui valide l'appartenance avant émission.

**Certificats publics** : la vérification publique passe par la vue `academy_certificates_public` (sans `user_id` ni `certificate_data` brut). La table source reste protégée.

**Storage academy-assets** : write réservé à la SaaS Team. Lecture publique OK.
**Storage ucm-exports** : DELETE permis aux org admins de l'org propriétaire (path = `{org_id}/...`).
**Storage avatars** : lecture authenticated uniquement (pas anon).

## EXECUTE permissions sur SECURITY DEFINER (Lot 7)

**Règle** : par défaut, REVOKE EXECUTE FROM PUBLIC, anon, authenticated sur toutes les fonctions SECURITY DEFINER. GRANT EXECUTE explicite uniquement sur les fonctions destinées à un appel client.

**Liste blanche `anon` (5 fonctions seulement)** :
- `validate_confirmation_token`, `validate_unsubscribe_token`, `consume_unsubscribe_token` (liens email)
- `get_invitation_by_token` (acceptation invitation pré-login)
- `find_workshop_by_code` (rejoindre workshop par code public)

**Liste blanche `authenticated`** : helpers RLS (`has_role`, `is_org_admin`, `is_saas_team`...), gestion notifications (`mark_*_read`), quotas (`check_*_quota`), RGPD (`export/erase_user_email_data`), métriques admin (avec garde `is_saas_team` interne), `accept_invitation`.

**Triggers internes et helpers service_role** : aucun GRANT — exécutables uniquement par le owner postgres ou via service_role bypass.

**Quand ajouter une nouvelle SECURITY DEFINER** :
1. Créer la fonction sans GRANT (les nouveaux warnings n'apparaîtront pas).
2. Si elle doit être appelable par le client, ajouter `GRANT EXECUTE ON FUNCTION public.xxx(args) TO authenticated;` (ou `anon` si vraiment publique).
3. Documenter la justification dans le commentaire de la fonction ET ici.

## Findings sécurité acceptés (documentés)

Les 41 warnings résiduels du scanner sont **par design** :
- 5 warnings `anon_security_definer_function_executable` = liste blanche ci-dessus.
- ~36 warnings `authenticated_security_definer_function_executable` = helpers nécessaires côté client connecté.
- 1 warning `REALTIME_CHANNEL_UNAUTHORIZED_SUBSCRIPTION` = `realtime.messages` non modifiable en hosted, mitigé par règle Postgres Changes only.

Ces warnings ne peuvent pas être supprimés sans casser la fonctionnalité. Le scanner Supabase ne distingue pas les SECURITY DEFINER légitimes des fuites.

## Hors-périmètre (Lot 8)

- Migration Vault (`pgsodium`) pour `ai_configurations.api_key`, `email_provider_configs.credentials`, `email_webhook_secrets.secret`, `academy_certificate_config.api_key_hash`. Aujourd'hui : RLS restrictive (SaaS team / org admin uniquement) + chiffrement applicatif via `encrypt_email_credentials`. Les findings sont passés de `error` à `warn` après audit du périmètre RLS.
- Rate limiting `delete-user`, `adjust_credits`, `impersonate-user`.
- Suite de tests Deno sécurité (realtime isolation, vault secrets, email tokens).
- Productivité Lot 5 sur 5 pages restantes (`AdminOrganizations`, `AdminAudit`, `AdminLogs`, `AdminBilling`, `AdminAcademyTracking`) + Command Palette ⌘K.
