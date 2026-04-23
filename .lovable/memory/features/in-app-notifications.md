---
name: in-app-notifications
description: Système de notifications in-app realtime (Supabase Realtime + RLS user-scoped) avec triggers DB, dropdown header et intégration aux deux shells (Portal + Admin).
type: feature
---

## Architecture

- **Table** `public.notifications(user_id, organization_id, type, title, body, link, severity, read_at)` avec RLS stricte : chaque user lit/marque-lu uniquement ses propres notifs ; SaaS team peut lire toutes (audit).
- **Realtime** : publication `supabase_realtime` activée + `REPLICA IDENTITY FULL`. Filtre canal côté client : `notifications:user_id=eq.{uid}`.
- **RPCs** : `notify_user`, `mark_notifications_read(_ids[])`, `mark_all_notifications_read()`.

## Triggers métier déjà branchés

| Trigger | Source | Severity | Link |
|---|---|---|---|
| `welcome` | `AFTER INSERT profiles` | success | `/portal` |
| `org.suspended` / `org.reactivated` | `AFTER UPDATE organizations.status` | error / success | `/portal` |
| `certificate.earned` | `AFTER INSERT academy_certificates` | success | `/portal/certificates/{id}` |

Tous les triggers sont **fault-tolerant** (`EXCEPTION WHEN OTHERS THEN RETURN NEW`) — ils ne bloquent jamais l'opération principale.

## Frontend

- Hook `useNotifications(limit)` : query + canal realtime, expose `unreadCount`, `markRead`, `markAllRead`. Toast automatique sur INSERT.
- Composant `NotificationsDropdown` (variants `portal` / `admin`) intégré dans les headers `PortalShell` et `AdminShell`.
- Command palette globale `Cmd+K` / `Ctrl+K` montée dans les deux shells (et `AppShell` legacy) — étendue avec sections Portail, Administration (visible si `is_saas_team`), Exploration, Piliers, Cartes.

## Étendre

Pour ajouter un nouveau type, appeler `public.notify_user(...)` depuis un trigger ou une edge function (avec `service_role`).
