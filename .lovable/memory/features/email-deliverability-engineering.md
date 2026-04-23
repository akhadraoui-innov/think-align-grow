---
name: Email deliverability engineering — priority lanes & inbound webhooks
description: GROWTHINNOV utilise 3 queues pgmq prioritaires (gi_email_transactional/marketing/bulk) drainées en ordre strict. Webhooks entrants Resend/SendGrid sécurisés par HMAC via email_webhook_secrets.
type: feature
---

## Priority lanes (Lot E2)

3 queues pgmq dédiées : `gi_email_transactional`, `gi_email_marketing`, `gi_email_bulk`.

- RPC `enqueue_email_priority(payload jsonb, priority text)` route vers la bonne queue.
- RPC `read_priority_email_batch(priority, batch_size, vt)` — service_role only.
- RPC `delete_priority_email(priority, msg_id)` — service_role only.
- RPC `get_priority_lane_metrics()` retourne `{priority, queue_length, total_messages}` × 3 (UI Reliability).
- Edge function `process-email-priority-queue` draine les 3 lanes en ordre strict (transactional → marketing → bulk), batch sizes 20/50/100, VT 60s, max retries 5.
- `trigger-email` calcule `priorityLane` via `categoryForTemplate` (extension future async).

## Webhooks entrants (bounces / engagement)

- Table `email_webhook_secrets(provider_code, organization_id, secret, is_active, last_rotated_at)` — RLS `is_saas_team`.
- RPC `rotate_email_webhook_secret(provider_code, organization_id)` génère un secret 32 bytes hex, super_admin/saas team only.
- RPC `get_email_webhook_secret(provider_code, organization_id)` — service_role.
- Edge function publique `email-events?provider={resend|sendgrid|smtp}` :
  - Resend : Svix (svix-id, svix-timestamp, svix-signature v1,base64).
  - SendGrid : HMAC-SHA256(timestamp + body) en base64 dans `x-twilio-email-event-webhook-signature`.
  - Generic : HMAC-SHA256 hex dans `x-signature`.
- Mapping events :
  - `email.bounced` (hard) / `complained` / `unsubscribe` → upsert `suppressed_emails(email, organization_id, source, bounced_at)`.
  - `delivered` / `opened` / `clicked` / `bounce` → UPDATE `email_automation_runs.{delivered_at|opened_at|clicked_at|bounced_at}` via `provider_message_id`.
- Colonnes ajoutées à `email_automation_runs` : `delivered_at`, `bounced_at`, `complained_at`, `unsubscribed_at`, `provider_message_id`.

## UI Admin

- `EmailWebhookReceiverPanel` (dans EmailProvidersTab) : URL pré-remplie par provider, génération/rotation secret HMAC, masquage/copie, instructions copier-coller.
- `EmailPriorityLanesPanel` (dans EmailReliabilityTab) : 3 jauges live (refresh 15s) avec backlog vs total, badge destructive si > 80% capacité.
