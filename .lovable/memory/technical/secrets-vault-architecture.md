---
name: secrets-vault-architecture
description: Architecture Vault pgsodium — chiffrement transparent des secrets sensibles avec rétro-compat
type: feature
---

# Vault pgsodium (Lot 9.3)

## Tables protégées
- `ai_configurations.api_key` → `api_key_secret_id`
- `email_provider_configs.credentials` → `credentials_secret_id`
- `email_webhook_secrets.secret` → `secret_secret_id`

## Helpers (service_role only — REVOKE'd from PUBLIC/anon/authenticated)
- `app_get_secret(uuid, text)` — déchiffre + audit dans `audit_logs`
- `app_store_secret(text, text, uuid)` — créé/met à jour
- `get_ai_api_key(uuid)`, `get_email_provider_credentials(uuid)`, `get_email_webhook_secret(text, uuid)`

## Triggers BEFORE INSERT/UPDATE
Toute valeur en clair fournie est immédiatement chiffrée → colonne legacy vidée.
Aucune migration de données existantes nécessaire (audit : 0 secret en clair à date).

## EFs patchées (pattern `hydrateKey`)
ai-coach, ai-deliverables, ai-reflection, analyze-challenge, generate-toolkit, refine-toolkit (lecture `api_key`)
trigger-email, process-email-priority-queue (lecture `credentials` JSONB)

Fallback toujours en place : valeur Vault → colonne legacy → `LOVABLE_API_KEY` env.
