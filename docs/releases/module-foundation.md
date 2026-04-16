# Module — Foundation (Architecture, Design System, Auth)

> Socle technique et identitaire de la plateforme. Multi-tenant, sécurité RLS, design system, authentification.

## 🎯 Vision

Construire une plateforme SaaS **multi-tenant B2B** réutilisable, avec un design system cohérent (tokens HSL), une authentification standard (email + Google OAuth), et une séparation stricte des rôles SaaS Team / Cabinet Client / Apprenant.

## 🏛️ Jalons majeurs

### 2026-03-08 — Genèse "Hack & Show"
- Premier prompt utilisateur : *« app publique pour s'acculturer, challenger, structurer et orchestrer des réflexions stratégiques »*.
- Stack : Vite + React 18 + TypeScript + Tailwind v3 + shadcn-ui.
- Design inspiré Dribbble : couleurs vives par pilier, cards arrondies, typographie forte, gradients.

### 2026-03-08 — Architecture multi-tenant B2B
- Bascule vers Lovable Cloud (Supabase) avec **15 tables initiales**.
- Tables tenancy : `organizations`, `organization_members` (rôles : owner, admin, member).
- Tables produit : `toolkits`, `cards`, `pillars`, `progress`, `credits`.
- RLS activée sur toutes les tables sensibles.
- Décision : **un client = 1 organisation = 1 admin + N membres**.

### 2026-03-11 — PRD Admin & 12 rôles
Définition d'une hiérarchie de **12 rôles applicatifs** :
- **5 rôles SaaS Team** : Super Admin, Customer Lead, Innovation Lead, Performance Lead, Product Actor.
- **7 rôles Cabinet Client** : Owner, Admin, Coach, Facilitator, Manager, Member, Viewer.
- Création de la fonction SQL `has_role(_user_id, _role app_role)` SECURITY DEFINER.
- Création de `is_saas_team(_user_id)` pour gating admin.

### 2026-03-30 — Rebranding GROWTHINNOV / Heeplab
- Audit complet des routes : isolation stricte cabinet (`/admin/*`, `/explore`) vs portail (`/portal/*`).
- Suppression du lien "Cabinet" depuis le portail.
- Logo `Logo.tsx` (monogramme SVG) + composant `GradientIcon.tsx`.

### 2026-04-02 — Architecture cible MVP : 3 tenants logiques
Décision verrouillée pour le MVP :
- **SaaS Solution** : produit livré (Academy, Workshop, UCM, etc.).
- **SaaS Management** : acquisition, abonnements, facturation, droits.
- **SaaS Operations** : observabilité, logs, métriques.

### 2026-04 — Multi-Shell architecture
- `AppShell.tsx` route conditionnellement vers `PortalShell` (sur `/portal/*`) ou Cabinet shell.
- Thème `.portal` scope CSS qui override `--primary` en bleu HSL `233 82% 62%` (`#4F6BED`).
- Polices : SF Pro Display headings, Inter body, JetBrains Mono mono.

### 2026-04 — Auth & Reset Password
- `AuthGuard.tsx` protège toutes les routes `/portal/*` et `/admin/*`.
- Email + Password + Google OAuth (sans auto-confirm).
- `ResetPassword.tsx` : flow basé sur `PASSWORD_RECOVERY` Supabase Auth event.
- Profile auto-créé via trigger `handle_new_user()` qui seed également 10 crédits de bienvenue.

## 🔐 Sécurité

- **Roles dans table dédiée** (`user_roles`) — jamais sur `profiles` (anti-escalation).
- Policies RLS via fonctions SECURITY DEFINER (`has_role`, `is_org_member`, `is_org_admin`).
- Vue `profiles_public` pour exposer uniquement les champs non-sensibles.
- Service-role key utilisée uniquement dans les edge functions.

## 🎨 Design system

### Tokens (index.css)
- Light + Dark mode complets.
- Palette sémantique : `--background`, `--foreground`, `--primary`, `--secondary`, `--accent`, `--muted`, `--destructive`.
- Surfaces : `--card`, `--popover`, `--sidebar`.
- Gradients : `--gradient-primary`, `--gradient-hero`.
- Shadows : `--shadow-elegant`, `--shadow-glow`.

### Conventions
- **Aucune couleur Tailwind directe** dans les composants (`bg-white`, `text-black`…) — uniquement tokens sémantiques.
- HSL exclusivement.
- Composants shadcn personnalisés via variants `cva`.

## 📦 État actuel

- ✅ 12 rôles opérationnels avec gating granulaire.
- ✅ Multi-tenant via `OrgProvider` + `OrgSwitcher` (persistance localStorage).
- ✅ Auth complet (email + Google + reset password).
- ✅ Trois URLs publiées : preview, sandbox, custom domain (`heeplab.com`).
- ✅ Design tokens cohérents light/dark.

## 🧠 Références mémoire

- `mem://technical/architecture` — Architecture Supabase Realtime + RLS
- `mem://technical/permissions-architecture-roles` — 12 rôles détaillés
- `mem://product/role-hierarchy` — Hiérarchie SaaS Team
- `mem://auth/multi-tenant-context` — OrgProvider + OrgSwitcher
- `mem://auth/portal-security` — AuthGuard
- `mem://auth/password-reset-flow` — Reset password flow
- `mem://auth/super-admin-identity` — Identité super-admin
- `mem://architecture/saas-multi-tenant-domains` — 3 tenants logiques
- `mem://technical/multi-shell-architecture-layout` — Multi-shell
- `mem://style/portal-branding` — Bleu portail
- `mem://style/design-philosophy` — Philosophie design refusée 360Learning
