---
name: Audit log immutable hash chain
description: Architecture du journal d'audit append-only avec chaîne SHA-256 non répudiable et vérification d'intégrité
type: feature
---

Le journal d'audit `audit_logs_immutable` est append-only avec une chaîne de hash SHA-256 :
- Trigger `BEFORE INSERT` calcule `current_hash = sha256(prev_hash || payload)` automatiquement
- `prev_hash` provient de la dernière ligne ou `'GENESIS'` pour l'entrée initiale
- Aucun UPDATE/DELETE possible (RLS + revoke)
- RPC `verify_audit_chain_integrity()` retourne `{valid, broken_at, checked}`
- RPC `log_audit_event(action, entity_type, entity_id, payload)` pour journaliser depuis l'application
- UI : `/admin/audit` (page paginée, filtres acteur/action/entité, badge intégrité, export CSV)

**Quand l'utiliser** : tout changement sensible (rôles, organisations, templates email, paramètres IA, providers, webhooks).
