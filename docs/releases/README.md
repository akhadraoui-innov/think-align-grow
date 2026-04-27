# Release Notes — GROWTHINNOV / Heeplab

Historique exhaustif du développement de la plateforme, organisé **par module fonctionnel**. Chaque fichier retrace les jalons majeurs depuis la genèse jusqu'à la version courante.

## 📚 Modules documentés

| Module | Description | Note |
|---|---|---|
| **Foundation** | Architecture multi-tenant, design system, auth, branding | [📄 Lire](./module-foundation.md) |
| **Toolkits & Cards** | Toolkits stratégiques, piliers, cartes, modes Section/Preview/Full | [📄 Lire](./module-toolkits.md) |
| **Workshop & Canvas** | Canvas collaboratif infini, sticky notes, flèches, groupes | [📄 Lire](./module-workshop.md) |
| **Design Innovation** | Challenges, templates, sujets, slots, analyse maturité IA | [📄 Lire](./module-design-innovation.md) |
| **Academy / Formations** | LMS multi-format : parcours, modules, quiz, exercices, certificats | [📄 Lire](./module-academy.md) |
| **Practice Studio & Simulator** | 50+ modes de simulation pro, autosave, A/B variants, blocks | [📄 Lire](./module-practice-studio.md) |
| **AI Value Builder (UCM)** | Micro-service multi-tenant pour use cases IA, secteurs, exports | [📄 Lire](./module-ucm.md) |
| **Business & Revenue** | Pricing role-centric, devis IA, simulateur P&L 36 mois | [📄 Lire](./module-business-revenue.md) |
| **Portail HEEP** | Portail apprenant bleu, multi-shell, marketplace, expériences | [📄 Lire](./module-portal.md) |
| **Insight & Discovery** | Cartographie BPMN, cycle de vie, exploration plateforme | [📄 Lire](./module-insight.md) |
| **Admin & Observability** | SaaS management, rôles, billing, logs, observability | [📄 Lire](./module-admin.md) |

## 🗓️ Historique par version livrée

| Version | Date | Périmètre principal | Note |
|---|---|---|---|
| **v2.4** | 16 avril 2026 | Practice Studio : scope blocs, autosave, alignement portail/cabinet | [📄 Lire](./v2.4-practice-studio.md) |
| **v2.5** | — | Gouvernance : rôles, permissions, audit immuable | [📄 Lire](./v2.5-governance.md) |
| **v2.6** | — | Email Platform : multi-provider, co-branding, IA marketing | [📄 Lire](./v2.6-email-platform.md) |
| **v2.6.1 — E1** | — | Email Studio — fondations | [📄 Lire](./v2.6.1-lot-E1.md) |
| **v2.6.1 — E2** | — | Email Studio — automations | [📄 Lire](./v2.6.1-lot-E2.md) |
| **v2.6.1 — E3** | — | Email Studio — productivité (DataTable, ⌘K, saved views) | [📄 Lire](./v2.6.1-lot-E3.md) |
| **v2.6.1 — E4** | — | Health Dashboard global & Observabilité | [📄 Lire](./v2.6.1-lot-E4.md) |
| **v2.7 — Lot 7** | 27 avril 2026 | Hardening EXECUTE permissions sur SECURITY DEFINER (165→51 findings) | [📄 Lire](./v2.7-lot-7-hardening.md) |
| **v2.8 — Lot 8** | 27 avril 2026 | Rate limiting opérations sensibles (delete-user, impersonate-user) | [📄 Lire](./v2.8-lot-8-rate-limiting.md) |
| **v2.9.1 — Lot 9.1** | 27 avril 2026 | Fix cron purge tokens + URL filters/Saved Views (AdminLogs, AdminAudit) + cleanup rate_limits | [📄 Lire](./v2.9.1-lot-9-fix-productivity.md) |
| **v2.9.2 — Lot 9.2** | 27 avril 2026 | Tests Vitest hooks critiques (usePermissions, useDeleteUser, exportCsv) — 16/16 passing | [📄 Lire](./v2.9.2-lot-9-tests.md) |

## 📐 Convention

- **Une note par module** : retrace l'évolution chronologique du périmètre.
- **Une note par version livrée** : changelog ciblé sur les modifications d'une release.
- Sections types : **Vision · Jalons · État actuel · Décisions verrouillées · Hors scope · Références mémoire**.
- Toutes les dates suivent le format ISO (YYYY-MM-DD).
