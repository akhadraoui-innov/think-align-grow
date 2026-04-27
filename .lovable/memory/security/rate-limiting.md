---
name: Rate limiting ops sensibles (Lot 8)
description: Table rate_limits service_role only + RPC check_rate_limit. Appliqué sur delete-user et impersonate-user
type: feature
---

## Architecture

Table `public.rate_limits` (service_role only — RLS activée, AUCUNE policy).
Colonnes : `user_id`, `action_key`, `window_start`, `count`.
Index unique `(user_id, action_key, window_start)` pour upsert atomique.

## RPC

`public.check_rate_limit(_user_id, _action_key, _max_calls=5, _window_minutes=60) → jsonb`
- SECURITY DEFINER, **REVOKE EXECUTE** de PUBLIC/anon/authenticated → appelable uniquement par service_role.
- Bucket de fenêtre aligné sur `_window_minutes` minutes pour rendre l'upsert idempotent.
- Retourne `{ allowed: bool, count, limit, remaining|reset_at }`.

`public.cleanup_rate_limits()` : DELETE des lignes > 24h. À cron-er si volumétrie problématique.

## Edge functions équipées

| Fonction | Limite | Justification |
|---|---|---|
| `delete-user` | 5 / 60 min | Action destructive irréversible (anonymisation + auth.admin.deleteUser) |
| `impersonate-user` | 10 / 60 min | Génère un magic link valide 1h pour un autre utilisateur |

## Pattern à reproduire

```ts
const { data: rl } = await admin.rpc("check_rate_limit", {
  _user_id: caller.id,
  _action_key: "<unique-action-key>",
  _max_calls: N,
  _window_minutes: M,
} as any);
if (rl && (rl as any).allowed === false) {
  return json({ error: "rate_limit_exceeded", detail: rl }, 429);
}
```

Toujours **après** la garde de rôle (sinon on rate-limite des appels non autorisés au profit d'un attaquant).

## Hors-périmètre Lot 8

- `adjust_credits` est une RPC SQL appelée directement côté client → ne peut pas être rate-limitée par edge function. Soit la déplacer en edge function, soit ajouter un trigger SQL `BEFORE INSERT` sur `credit_transactions` qui appelle `check_rate_limit`. À traiter au Lot 9.
- Cron de cleanup `cleanup_rate_limits()` à programmer via pg_cron si volumétrie > 100k lignes/jour.
