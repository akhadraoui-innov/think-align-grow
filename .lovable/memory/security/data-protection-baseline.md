---
name: Data protection baseline (Lot 6)
description: Règles de sécurité données — tokens email via RPC, vue safe quizzes, accès Academy via enrollment, realtime broadcast verrouillé, vue certificate publique
type: constraint
---

## Règles obligatoires

**Tokens email** : ne JAMAIS lire `email_confirmation_tokens` ou `email_unsubscribe_tokens` directement côté client. Utiliser exclusivement les RPC `validate_confirmation_token(_token)` et `validate_unsubscribe_token(_token)` (SECURITY DEFINER).

**Quiz Academy** : côté client, lire les questions via la vue `academy_quiz_questions_safe` (sans `correct_answer` ni `explanation`). Le scoring se fait uniquement côté serveur (edge function ou RPC).

**Accès Academy** : `has_academy_access(_user, _module)` est basé sur `academy_enrollments` + `academy_path_modules` (PAS sur `academy_progress` — un user peut s'auto-insérer dedans uniquement s'il a un enrollment couvrant le module).

**Realtime broadcast/presence** : `realtime.messages` est verrouillée au `service_role`. Le code n'utilise QUE Postgres Changes (filtrés par les RLS des tables sources). Si on ajoute du Broadcast, créer une policy explicite scoped par topic.

**Certificats publics** : la vérification publique passe par la vue `academy_certificates_public` (pas de `user_id`, pas de `certificate_data` brut). La table source reste protégée.

**Storage academy-assets** : write réservé à la SaaS Team. Lecture publique OK.
**Storage ucm-exports** : DELETE permis aux org admins de l'org propriétaire (path = `{org_id}/...`).

## Hors-périmètre Lot 6 (Lot 7)
- Migration des secrets `ai_configurations.api_key`, `email_provider_configs.credentials`, `email_webhook_secrets.secret` vers `vault.secrets` (warnings restants, exposition limitée à SaaS team / org admin).
- Rate limiting `delete-user`, `adjust_credits`, `impersonate-user`.
- Fix des 3 edge functions email avec build errors pré-existantes (`email-events`, `process-email-queue`, `process-email-priority-queue`).
