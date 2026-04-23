

# Plan v2.6 — Email Platform GROWTHINNOV (verrouillé)

## Décisions verrouillées
- **Q1 = C** : Markdown + composants prédéfinis
- **Q2 = D** : Inactivité configurable par org (défaut 30j)
- **Q3 = B** : Sender domain custom = plan **Enterprise**
- **Q4 = B** : Tracking opt-in par org (RGPD)
- **Q5 = B** : Co-branding (logo client + GROWTHINNOV) = plan **Enterprise**
- **Q6 = C avec exception** : Fournisseur email custom = **Enterprise par défaut**, mais **paramétrable par client** (override possible plan-by-plan via `subscription_plans.features.custom_email_provider = true` activable manuellement par SaaS team sur n'importe quelle org)
- **Q7 = C** : IA Marketing Saas accessible à **tous les rôles disposant de la permission `email.compose`** (DB-driven, cohérent v2.5)

---

## Architecture cible

```text
┌───────────────────────────────────────────────────────────────┐
│  EMAIL STUDIO (/admin/emails)                                 │
│  ┌──────────┬───────────┬──────────┬─────────┬─────────────┐ │
│  │Templates │Automations│ Logs/    │Domaines │ Fournisseurs│ │
│  │ + IA     │ + IA      │ Stats    │ + Logos │  Email      │ │
│  └──────────┴───────────┴──────────┴─────────┴─────────────┘ │
└───────────────────────┬───────────────────────────────────────┘
                        ▼
   ┌────────────────────┴─────────────────────┐
   ▼                    ▼                     ▼
 templates           automations          providers
 (global+org)        (events+conds)     (lovable/resend/
                                         sendgrid/smtp)
                        ▼
            ┌───────────────────────┐
            │ trigger-email (EF)    │
            │ - resolve template    │
            │ - resolve provider    │
            │ - resolve branding    │
            │   (logo client+GI)    │
            │ - render + enqueue    │
            └───────────┬───────────┘
                        ▼
        ┌──────────────────────────┐
        │ providers adapters       │
        │ - lovable_email (queue)  │
        │ - resend                 │
        │ - sendgrid               │
        │ - smtp                   │
        └──────────────────────────┘
```

---

## Phase 1 — Design system email co-brandé

- Composant React Email partagé `GrowthinnovLayout` : header adaptatif (1 ou 2 logos selon `org.brand_logo_url` + plan), hero couleur #2563EB, footer mentions
- Constantes brand + logo SVG hébergé dans bucket public **`brand-assets`** (nouveau)
- Bucket `brand-assets` : SELECT public, INSERT/UPDATE réservé SaaS team

## Phase 2 — Schéma DB Email Studio + providers + branding

Migration unique :
- Tables : `email_providers`, `email_provider_configs` (credentials chiffrés pgcrypto), `email_templates`, `email_template_versions`, `email_automations`, `email_automation_runs`
- Vue `v_email_stats` (agrégats sent/failed/opened par template/org/jour)
- Colonnes ajoutées : `organizations.brand_logo_url`, `organizations.email_sender_domain`, `organizations.email_tracking_enabled`, `organizations.inactivity_reminder_days`
- `subscription_plans.features` jsonb enrichi : `custom_email_domain`, `custom_email_provider`, `email_co_branding` (chaque flag overridable manuellement par org)
- RLS multi-tenant cohérente v2.5 + triggers d'audit `log_activity`
- Seed : 4 templates par défaut markdown (welcome, account_suspended, login_reminder, invitation)
- Permission `email.compose` ajoutée au référentiel

## Phase 3 — Edge Function `trigger-email` (cœur)

Reçoit `{ event, organization_id?, recipient_email, payload }` :
1. Résout automation active (org > global) matchant `event`
2. Résout template (org > global)
3. Résout provider (org > global) + déchiffre credentials
4. Résout branding co-brandé selon flags effectifs de l'org
5. Render markdown → HTML composants email + injection variables
6. Si tracking activé : pixel + réécriture liens
7. Délègue à l'adapter du provider (lovable = enqueue pgmq, sinon API directe)
8. Insert `email_automation_runs` pour traçabilité
9. Idempotence : `event + entity_id + template_code`

## Phase 4 — Templates métier

1. **welcome** (`user.created`) — "Bienvenue {{firstName}}", 10 crédits offerts, CTA "Découvrir"
2. **account_suspended** (`user.status.suspended`) — ton sobre, raison optionnelle, contact support
3. **login_reminder** (`user.inactive_Nd`) — "Ça fait N jours", 3 nouveautés, CTA reconnexion
4. **invitation** (refonte v2.5) — branding complet

Déclencheurs :
- Welcome & Suspended : triggers DB `pg_net` POST → `trigger-email`
- Login Reminder : cron quotidien SQL (scan `profiles` selon `inactivity_reminder_days` org)
- Invitation : EF v2.5 réorientée vers `trigger-email`

## Phase 5 — IA Marketing Saas

Edge Function `email-marketing-ai` (Lovable AI, `google/gemini-3-flash-preview`, streaming SSE) :
- Mode `compose` : génère subject + markdown + variables suggérées depuis un brief
- Mode `refine` : améliore un template existant (ton, CTA, mobile)
- Mode `automation_design` : tool calling → propose `trigger_event`, `conditions`, `delay_minutes` en JSON structuré
- System prompt expert email marketing SaaS B2B, RGPD, mobile-first
- Contexte injecté : nom org, plan, persona cible, événements disponibles

UI :
- Panneau latéral chat dans éditeur Templates (bouton **✨ Assistant IA**)
- Bouton **✨ Suggérer un déclencheur** dans éditeur Automations
- Modal **✨ Générer depuis un brief** sur liste Templates

Accès gardé par permission `email.compose` (vérification via hook `usePermissions`)

## Phase 6 — UI Email Studio (`/admin/emails`)

5 onglets :
1. **Templates** — liste filtrée (global/org), éditeur split markdown + preview live, versioning, assistant IA
2. **Automations** — table déclencheur → template, builder visuel "Quand X → Si Y → Envoyer Z après N min", assistant IA
3. **Logs & Stats** — graphique 30j (sent/failed/opened/clicked), filtres org/template/event/provider, export CSV
4. **Domaines & Branding** — par org : statut DNS, upload `brand_logo_url`, toggle tracking, période inactivité
5. **Fournisseurs Email** — liste providers actifs (global + par org), formulaire dynamique selon `config_schema`, test d'envoi, **toggle "Activer fournisseur custom" par org** (override SaaS team)

## Phase 7 — Adapters multi-fournisseurs

`supabase/functions/_shared/email-adapters/` :
- `lovable.ts` — enqueue pgmq (existant)
- `resend.ts` — POST `https://api.resend.com/emails` via gateway connector
- `sendgrid.ts` — POST `https://api.sendgrid.com/v3/mail/send`
- `smtp.ts` — Deno SMTP (host/port/user/pass)

Interface commune `send({ to, from, subject, html, text, headers })` → `{ success, message_id, error }`.
Credentials chiffrés au repos (pgcrypto), déchiffrés uniquement dans l'EF.

## Phase 8 — Hooks, page admin & sidebar

- Hooks : `useEmailTemplates`, `useEmailAutomations`, `useEmailProviders`, `useEmailStats`, `useEmailMarketingAI`
- Page : `src/pages/admin/AdminEmails.tsx` + entrée sidebar admin
- Composants : `EmailTemplateEditor`, `EmailAutomationBuilder`, `EmailMarketingAIChat`, `EmailProviderForm`, `EmailLogsTable`, `EmailDomainBrandingPanel`

## Phase 9 — Documentation & mémoire

- `docs/releases/v2.6-email-platform.md`
- Mémoire `mem://features/email-platform`

---

## Livrables

1. ✅ Tous emails co-brandés (logo client + GROWTHINNOV) si plan/override le permet
2. ✅ 4 templates fonctionnels (welcome, suspended, reminder, invitation refondue)
3. ✅ Email Studio admin : 5 onglets opérationnels
4. ✅ Surcharge templates/automations/providers par organisation
5. ✅ Multi-fournisseurs : Lovable / Resend / SendGrid / SMTP, **activable par org en exception**
6. ✅ IA Marketing Saas (rédaction + paramétrage déclencheurs) gardée par permission `email.compose`
7. ✅ Logs, stats, tracking opt-in RGPD, export CSV
8. ✅ Continuité totale avec v2.5 (audit, RLS, multi-tenant, queue pgmq)

