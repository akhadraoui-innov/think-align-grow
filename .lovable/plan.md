

# Plan v2.6.1 — World-Class Edition (verrouillé)

## Décisions verrouillées
- **Q1 = C** — Phasage : v2.6.1 (Lots A→E cœur world-class) puis v2.7 (Lots F+G : DX/API/SDK/observabilité avancée)
- **Q2 = B** — API publique REST + SDK reportés en v2.7
- **Q3 = A,B** — Multi-locale FR+EN minimum dès v2.6.1, extension ES+DE en v2.7
- **Q4 = B** — Status page sur sous-domaine dédié `status.growthinnov.com` (DNS séparé)
- **Q5 = A** — Audit log immuable hash-chain dès v2.6.1 (compliance Enterprise)

---

## v2.6.1 — Cœur world-class (cycle actuel)

### Lot A — Stabilisation Email (bloquants)
1. Migration SQL : helper `get_org_effective_features(org_id)` joignant `organization_subscriptions` actif + `subscription_plans.features` + `organizations.email_features_override`
2. Seed `subscription_plans.features` (Starter / Pro / Enterprise) avec flags `custom_email_domain`, `custom_email_provider`, `email_co_branding`, `email_tracking`
3. Seed `email_provider_configs` global Lovable + replanification cron `cron_dispatch_login_reminders` (9h quotidien via `pg_cron` + `pg_net`)
4. Refactor `dispatch_email_event` : `extensions.http_post` synchrone → `net.http_post` async + signature HMAC sortante
5. Patch `trigger-email/index.ts` : retire la jointure cassée `organizations.plan_id`, consomme le helper, vérifie HMAC entrante
6. Upload logo GROWTHINNOV SVG dans `brand-assets/growthinnov-logo.svg`

### Lot B — Sécurité (6 findings + extensions)
7. RLS `workshops` : `is_workshop_participant OR is_workshop_host OR is_saas_team` + RPC `get_workshop_by_code` SECURITY DEFINER
8. RLS `practice_variants` : SELECT scopé via parent ; `system_prompt` réservé aux auteurs / SaaS team
9. RLS `academy_practices` standalone : `created_by = auth.uid() OR is_saas_team`
10. Storage `ucm-exports` : path-based `(storage.foldername(name))[1] = organization_id::text`
11. Vue `v_academy_quiz_questions_public` masquant `correct_answer` ; refactor hooks client
12. RLS `realtime.messages` topic-scoped (`workshop:<id>` + check participant)
13. **+ SSRF guard** sur webhooks sortants (allowlist domains validée avant `net.http_post`)
14. **+ Audit log immuable** : table `audit_logs_immutable` append-only avec hash chain SHA-256 (`prev_hash` → `current_hash`), trigger d'insertion automatique, vue de vérification d'intégrité
15. **+ Content Security Policy emails** : sanitization HTML stricte, anti-phishing pattern detection (URLs masquées, scripts inline bloqués)

### Lot C — Email Studio Pro
16. **Branding** : upload `brand_logo_url` (SVG/PNG ≤200KB), toggles `email_features_override` plan-by-plan (super_admin), inputs `inactivity_reminder_days`, `email_tracking_enabled`, `email_sender_domain`, statut DNS SPF/DKIM/DMARC + **BIMI**
17. **Templates** : renderer JS partagé `src/lib/email-render.ts` (preview live = réel), bouton "Envoi de test", drawer **Versioning** consommant `email_template_versions` (diff Git-style + restore), **multi-locale FR/EN** (table `email_template_translations` + fallback intelligent)
18. **Providers** : test connexion par config, masquage `***` des secrets, regenerate, form dynamique depuis `config_schema`, **circuit breaker par provider** (auto-disable si taux échec > 20% sur 100 derniers envois)
19. **Logs** : drawer détail run (payload, HTML rendu, erreur, headers, response), filtres status/provider/event/org/date, bouton **Replay** via `enqueue_email`
20. **Suppressions list** : table `suppressed_emails` filtrable par type (bounce/complaint/unsubscribe), action "Réactiver" avec confirmation, lien depuis logs
21. **Inline AI** : boutons "✨ rewrite/shorten/translate" dans chaque champ markdown via `email-marketing-ai`
22. **A/B testing automation** : 2 subjects par template, mesure open rate, déclaration significance Bayesian (table `email_ab_tests`)

### Lot D — Naviguation multi-tenant (Q4=A initial)
23. `AdminSidebar` : groupe collapsible "EMAIL" (Templates / Automations / Providers / Logs / Branding / Suppressions / A/B Tests)
24. **Espace ADMIN portail client** : nouvel onglet `ADMIN` dans header `PortalShell` (à côté de FORMATIONS, PRATIQUE, etc.), visible si perm `email.compose | org.settings.manage | org.members.manage`
25. Routes : `/portal/admin/emails`, `/portal/admin/branding`, `/portal/admin/subscription`, `/portal/admin/members`, `/portal/admin/quotas`
26. Composants `EmailStudioScoped`, `BrandingPanelScoped`, `SubscriptionPanel`, `MembersPanel`, `QuotasPanel` (OrgSwitcher caché, scope auto-org forcé)
27. **Command Palette globale Cmd+K** Linear-style (actions Email + navigation + IA) dans portail et admin
28. `OrgSwitcher` déplacé dans header `AdminShell` global

### Lot E — Architecture systémique
29. **Webhook receiver `email-events`** : edge function publique avec signature verification, handlers `lovable` / `resend` / `sendgrid` ; mappe events → `suppressed_emails` (bounce/complaint) + update `email_automation_runs.opened_at/clicked_at`
30. **Quotas email** : table `email_quota_usage(org_id, period_start, sent_count, plan_limit)`, function `check_email_quota(org_id)` appelée au début de `trigger-email`, widget jauge mensuelle + **upgrade prompt contextuel** à 80%
31. **Page `/admin/health`** (System Health Dashboard) : status providers (ping), DB linter (count findings), cron jobs (last run), pgmq backlog, secrets manquants, brand assets présents, refresh 30s, badges colorés
32. **Notifications in-app realtime** : table `notifications(user_id, organization_id, type, title, body, link, read_at)` + RLS user-scoped, hook `useNotifications`, canal Supabase Realtime, dropdown réel dans header portail + admin (remplace pastille décorative), triggers DB pour welcome/suspended/quota warning/certificate earned/email failed
33. **Priority lanes pgmq** : queues `transactional` > `marketing` > `bulk` (drainées dans cet ordre par `process-email-queue`)
34. **Idempotency keys** sur `trigger-email` (header `X-Idempotency-Key`, table `email_idempotency_keys` 24h TTL)

### Documentation v2.6.1
35. `docs/audit/v2.6.1-world-class-resolution.md` (résolutions par finding)
36. `docs/releases/v2.6.1-world-class.md`
37. Mémoires : `architecture/effective-features-helper`, `features/in-app-notifications`, `architecture/system-health-dashboard`, `features/portal-admin-space`, `features/email-deliverability-engineering`, `architecture/circuit-breakers`, `compliance/audit-log-immutable`

---

## v2.7 — DX, API publique & observabilité avancée (cycle suivant, planifié)

### Lot F — Developer Experience
- API publique REST `/v1/emails/*` (envoi, list, search, replay) avec auth API key scopée par org
- Webhooks sortants signés HMAC configurables par client (events email)
- OpenAPI spec auto-générée + page `/docs/api` (Scalar)
- SDK TypeScript `@growthinnov/emails` publié npm avec typings auto-générés
- Sandbox mode (flag `is_sandbox` sur API keys, isole envois test)
- Edge function `observability-ingest` (traces structurées) + dashboard `/admin/observability/traces`
- DSAR self-service `/portal/admin/privacy` (export RGPD complet, suppression cascade)

### Lot G — Maturité plateforme
- Status page publique sur `status.growthinnov.com` (DNS séparé : uptime providers, last incidents, SLO 99.9%)
- Multi-locale ES + DE
- Schema migration UI variables templates (renommage safe propagé)
- Live collaboration sur templates (multi-curseur)
- Email designer visuel par blocs (shortcodes `{{block:hero|...}}`)
- DPA téléchargeable + RGPD article 30 register
- BYOK (Bring Your Own Key) Enterprise + rotation secrets automatique 90j
- Documentation : `docs/api/openapi.yaml`, `docs/sla.md`, `docs/security/dpa-template.pdf`

---

## Architecture cible v2.6.1

```text
┌─────────────────────────────────────────────────────────────────┐
│  ADMIN SAAS                  │  PORTAL CLIENT (nouveau ADMIN)   │
│  /admin/emails (full)        │  /portal/admin/emails (org)      │
│  /admin/health               │  /portal/admin/branding          │
│  OrgSwitcher dans header     │  /portal/admin/subscription      │
│  Cmd+K palette               │  /portal/admin/members           │
│                              │  /portal/admin/quotas            │
└──────────────┬───────────────┴──────────────┬──────────────────┘
               │                              │
               └────────── shared ────────────┘
                            ▼
            get_org_effective_features(org_id)
            check_email_quota(org_id)
            check_circuit_breaker(provider)
                            ▼
       ┌────────────────────┴────────────────────┐
       ▼                                         ▼
 trigger-email                            email-events
 (HMAC + idempotency + SSRF)              (webhook in signé)
       │                                         │
       ▼                                         ▼
 Priority lanes pgmq                    suppressed_emails
 (transactional > marketing > bulk)     opened_at / clicked_at
       │
       ▼
 Adapters + Circuit Breaker (4 providers)
       │
       ▼
 Audit log immuable (hash chain SHA-256)
 + Notifications realtime in-app
```

---

## Livrables v2.6.1

1. ✅ Emails opérationnels (logo, providers seedés, plans flagués, helper centralisé)
2. ✅ 6 findings sécurité + SSRF guard + audit immuable + CSP emails
3. ✅ Email Studio Pro (preview live, test, versioning, replay, suppressions, A/B, inline AI, multi-locale FR/EN)
4. ✅ Sidebar EMAIL admin + espace ADMIN portail client + Cmd+K
5. ✅ Webhooks bounces multi-providers (Lovable + Resend + SendGrid)
6. ✅ Quotas email + System Health Dashboard + circuit breakers + priority lanes
7. ✅ Notifications in-app realtime
8. ✅ Idempotency keys
9. ✅ Documentation + mémoire à jour

