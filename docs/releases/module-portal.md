# Module — Portail HEEP

> Portail **apprenant** dédié, isolé du Cabinet, avec thème bleu, multi-shell architecture, et 5 expériences principales (Formations, Pratique, Workshops, Challenges, Marketplace).

## 🎯 Vision

Offrir aux apprenants finaux une expérience **immersive et professionnelle**, distincte de l'interface Cabinet/Admin, avec un branding propre (bleu HEEP `#4F6BED`) et une architecture qui réutilise les fonctionnalités sans dupliquer la logique métier.

## 🏛️ Jalons majeurs

### 2026-03-30 — Genèse depuis mockups HTML
- Source 1 : mockup HEEP learner experience (3-column immersive layout).
- Source 2 : Content Marketplace (blueprints communautaires).
- Décision : **architecture multi-shell** pour faire coexister Portail et Cabinet sans duplication.

### 2026-03-30 — Multi-Shell architecture
- `AppShell.tsx` route conditionnellement :
  - `/portal/*` → `PortalShell.tsx`.
  - autres routes → Cabinet shell.
- `PortalShell.tsx` :
  - Header horizontal avec 4 onglets : Formations, Pratique, Workshops, Challenges.
  - Sidebar `PortalSidebar.tsx` contextuelle.
  - Bottom bar `PortalBottomBar.tsx` mobile.
  - Contrainte : `h-screen overflow-hidden` avec corps page flex.

### 2026-03-30 — Thème bleu scopé
- Classe CSS `.portal` dans `index.css`.
- Override `--primary` → HSL `233 82% 62%` (`#4F6BED`).
- Tokens dérivés : `--primary-foreground`, `--primary-glow`, `--ring`.
- Polices conservées (SF Pro Display + Inter).

### 2026-03-30 — Routes portail (5 workspaces)

#### 1. Formations (`/portal/formations/*`)
- `PortalFormations.tsx` : catalogue parcours.
- `PortalFormationsDashboard.tsx` : tableau de bord (KPIs, heatmap activité, streaks, parcours actifs/complétés, **pratiques assignées** v2.4).
- `PortalFormationsPath.tsx` : détail parcours.
- `PortalFormationsModule.tsx` : reader module.
- `PortalFormationsCertificates.tsx` : certificats.

#### 2. Pratique (`/portal/pratique/*`)
- `PortalPratique.tsx` : catalogue avec **badges scope** (Public/Org/Assignée) + deadlines J-3.
- `PortalPratiqueSession.tsx` : exécution session.
- `PortalPratiqueHistory.tsx` : historique.
- `PortalPratiqueReport.tsx` : rapport éditorial.

#### 3. Workshops (`/portal/workshops/*`)
- `PortalWorkshops.tsx` : liste workshops.
- `PortalWorkshopRoom.tsx` : canvas live.

#### 4. Challenges (`/portal/challenges/*`)
- `PortalChallenges.tsx` : catalogue challenges.
- `PortalChallengeRoom.tsx` : board collaboratif.

#### 5. Marketplace & Library
- `PortalMarketplace.tsx` : marketplace blueprints communautaires.
- `PortalLibrary.tsx` : bibliothèque ressources personnelles.
- `PortalGuideReader.tsx` : reader de guides.
- `PortalAnalytics.tsx` : analytics personnel.
- `PortalToolkits.tsx`, `PortalExperiences.tsx`, `PortalWorkspace.tsx` : exploration.
- `PortalCertificateDetail.tsx` : vue détaillée certificat.

### 2026-03-30 — Données réelles vs mocks
- Audit utilisateur : *« tu as créé des mocks, pas d'inventions, il faut uniquement des fonctionnalités et données réelles »*.
- Refactor complet : suppression de tous les mocks, branchement sur hooks Supabase réels.

### 2026-03-30 — Isolation des routes
- Audit : aucune route `/portal/*` ne doit rediriger vers Cabinet.
- Suppression du lien "Cabinet" depuis `PortalShell.tsx`.

### 2026-03-30 — Rebranding GROWTHINNOV
- Rebranding global de "Hack & Show" vers GROWTHINNOV.
- Le portail apprenant garde le nom HEEP.

### 2026-04 — Duplication Academy → Portal Académie
Routes dupliquées sous `/portal/academie/*` :
- `PortalAcademie.tsx`
- `PortalAcademieAssets.tsx`
- `PortalAcademieCampaigns.tsx`
- `PortalAcademieCertificates.tsx`
- `PortalAcademieFunctionDetail.tsx`
- `PortalAcademieFunctions.tsx`
- `PortalAcademieMap.tsx`
- `PortalAcademieModuleDetail.tsx`
- `PortalAcademiePathDetail.tsx`
- `PortalAcademiePaths.tsx`
- `PortalAcademiePersonae.tsx`
- `PortalAcademieTracking.tsx`

Pattern : duplication des routes en réutilisant les **mêmes composants métier** (hooks + UI shared), avec navigation portail uniquement.

### 2026-04 — Exercices interactifs avancés
- "Logical Nexus Task" : type d'exercice de raisonnement logique introduit dans le portail.

### 2026-04-16 — Practice Studio v2.4
- Badges scope réels (Public/Org/Assignée) sur `PortalPratique.tsx`.
- Section "Pratiques assignées" dans dashboard.
- Échéances avec alerte J-3 visuelle.

## 📐 Architecture technique

### Multi-Shell
```tsx
// AppShell.tsx
if (location.pathname.startsWith('/portal')) {
  return <PortalShell>{children}</PortalShell>;
}
return <CabinetShell>{children}</CabinetShell>;
```

### Réutilisation hooks
Les pages portail consomment **les mêmes hooks** que le cabinet :
- `useAcademyModule` (Formations).
- `useChallengeData` (Challenges).
- `useWorkshop` (Workshops).
- `useUCMProject` (UCM).

### Sécurité
- `AuthGuard` sur toutes les routes `/portal/*`.
- `OrgProvider` actif dans le shell portail.
- RLS appliquée côté Supabase.

## 📦 État actuel

- ✅ Multi-shell opérationnel.
- ✅ Thème bleu scopé.
- ✅ 5 workspaces principaux.
- ✅ Données réelles partout (zéro mock).
- ✅ Isolation stricte cabinet ↔ portail.
- ✅ Marketplace + Library + Analytics.
- ✅ Routes Académie dupliquées.

## 🧠 Références mémoire

- `mem://product/portal-workspaces` — 5 workspaces
- `mem://style/portal-branding` — Bleu `#4F6BED`
- `mem://ux/portal-shell-layout-constraints` — h-screen overflow-hidden
- `mem://technical/multi-shell-architecture-layout` — Multi-Shell
- `mem://technical/portal-architecture-duplication` — Duplication routes
- `mem://features/portal-interactive-exercises` — Logical Nexus Task
