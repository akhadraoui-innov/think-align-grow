---
name: Email Preferences Center & Unsubscribe
description: Centre de préférences portail (catégories), désinscription one-click RFC 8058, double opt-in
type: feature
---
# D1 — Centre de préférences email

## Tables
- `email_categories` (référence: transactional/product/academy/marketing/digest)
- `email_subscriber_preferences` (par email + org + catégorie)
- `email_unsubscribe_tokens` (180j)
- `email_confirmation_tokens` (7j double opt-in)

## Fonctions SECURITY DEFINER
- `consume_unsubscribe_token(_token)` — atomique, applique opt-out + ajoute à suppression marketing
- `confirm_email_opt_in(_token)` — valide double opt-in

## Routes
- `/portal/preferences` — centre utilisateur (préférences + historique reçu dédupliqué par message_id)
- `/email/unsubscribe?token=...` — public, désinscription one-click
- `/email/confirm?token=...` — public, confirmation double opt-in

## trigger-email Edge Function
- Mappe `template_code → category` (préfixe: auth./transactional. = bypass)
- Bloque envoi si suppression OU `subscribed=false` (sauf transactional)
- Génère token + URL et injecte:
  - Header `List-Unsubscribe: <url>`
  - Header `List-Unsubscribe-Post: List-Unsubscribe=One-Click` (RFC 8058)
  - Variable `{{unsubscribe_url}}` dans templates
  - Footer `unsubscribeUrl` dans renderEmail

## Variables ENV
- `PUBLIC_APP_URL` (optionnel, défaut: heeplab.com)
