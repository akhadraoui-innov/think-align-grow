---
name: system-health-dashboard
description: Dashboard santé système global (Health) basé sur la RPC get_system_health() agrégeant providers email, cron, pgmq, chaîne d'audit, secrets, actifs de marque et alertes quota — bandeau critique sticky sur AdminShell.
type: feature
---

## RPCs (SaaS team only)

### `get_system_health() -> jsonb`
Retourne `{ generated_at, providers[], cron_jobs[], pgmq_backlogs[], audit_chain, quota_alerts[], secrets_status, brand_assets_status, critical_count }`.

`critical_count` = chaîne audit rompue + nombre de circuits providers ouverts. Si > 0 → bandeau rouge sticky sur AdminShell.

### `get_edge_function_metrics(_hours int default 24)`
Agrège `email_send_log` par `metadata->>'edge_function'` :
- `invocations`, `errors`, `p50_ms`, `p95_ms`, `error_rate` (%).

Pour enrichir les métriques d'une nouvelle edge function, ajouter `latency_ms` et `edge_function` dans `metadata` lors de l'écriture du log.

## UI

- Page : `/admin/health` (`AdminHealth.tsx`), 6 cartes + alertes quota + tableau edge metrics. Refresh auto 30s.
- Bandeau : `HealthBanner` (sticky `top-0 z-50`) intégré dans `AdminShell` au-dessus du header.
- Sidebar : entrée "Health système" sous le groupe Système.

## Étendre

- Ajouter une carte = ajouter une clé dans `get_system_health()` puis brancher dans le tableau de cartes en haut.
- Ajouter une métrique critique = incrémenter `_critical_count` dans la RPC + lister la raison dans `HealthBanner`.
