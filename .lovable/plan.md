

# Plan — Audit des routes portail + Renommage GROWTHINNOV

## 1. Routes portail pointant vers le cabinet (à corriger)

| Fichier | Ligne problématique | Correction |
|---------|---------------------|------------|
| `PortalShell.tsx` | `to="/explore"` (lien "Cabinet") | Supprimer ce lien ou le pointer vers `/portal` |
| `PortalWorkshops.tsx` | `navigate("/auth")` | Changer en `navigate("/portal/auth")` ou garder `/auth` (page partagée — acceptable) |
| `PortalChallenges.tsx` | `navigate("/auth")` | Idem — `/auth` est la page de login commune, pas du cabinet |

**Verdict** : Le seul vrai problème est le lien "Cabinet" dans le header (`to="/explore"`). Les redirections vers `/auth` sont légitimes car c'est la page d'authentification partagée.

## 2. Renommage HEEP → GROWTHINNOV

Tous les fichiers à modifier :

| Fichier | Ce qui change |
|---------|---------------|
| `PortalShell.tsx` | Logo text "HEEP" → "GROWTHINNOV" |
| `HeepAIWidget.tsx` | "Ask HEEP IA" → "Ask GROWTHINNOV IA", "mentor HEEP IA" → "mentor GROWTHINNOV IA" |
| `AppSidebar.tsx` | "Portail HEEP" → "Portail GROWTHINNOV" |
| `index.html` | `<title>` "Heeplab" → "GROWTHINNOV", meta descriptions |
| `Logo.tsx` | "Hack & Show" → "GROWTHINNOV" |
| `AuthPage.tsx` | "Hack & Show" → "GROWTHINNOV" |
| `AppShell.tsx` | Breadcrumb "Hack & Show" → "GROWTHINNOV" |
| `AppSidebar.tsx` | "Hack & Show" → "GROWTHINNOV" |
| `AdminSidebar.tsx` | "Hack & Show" → "GROWTHINNOV" |
| `AdminDashboard.tsx` | "Hack & Show" → "GROWTHINNOV" |
| `OrgInfoTab.tsx` | "Hack & Show" → "GROWTHINNOV" |
| `Index.tsx` | "Hack & Show" → "GROWTHINNOV" |
| `defaultPrompts.ts` | "Hack & Show" → "GROWTHINNOV" |

## 3. Exécution

1. Supprimer le lien "Cabinet" du header portail (`PortalShell.tsx`)
2. Renommer toutes les occurrences HEEP/Heep/heep → GROWTHINNOV dans les fichiers portail
3. Renommer toutes les occurrences "Hack & Show" / "Heeplab" → GROWTHINNOV dans tout le projet
4. Mettre à jour `index.html` (title + meta)

