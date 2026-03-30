

# Plan révisé — Portail HEEP : Intégration Marketplace + Coexistence des interfaces

## Analyse du 2e mockup : Content Marketplace

Ce mockup ajoute une dimension majeure absente du 1er : un **marketplace de blueprints** communautaire avec import, ratings, trending topics, et activity feed. C'est un écosystème de contenus partagés entre organisations.

```text
┌──────────────────────────────────────────────────────────────┐
│  TOP NAV: HEEP | Admin | Management | Formations |           │
│           Experiences | Mes Agents | HEEP IA  [🔍 🔔 ⚙️]    │
├──────────┬───────────────────────────────────────────────────┤
│ LEFT     │  MAIN: Content Marketplace                        │
│ SIDEBAR  │  ┌─ Featured card (Most Adopted, 4.9★)          │
│          │  │  "Agile Leadership & Psych-Safety"             │
│ Workspace│  │  Tags + Import button                          │
│ AI Kits  │  ├─ Growth nudge (156 new blueprints)            │
│ Paths    │  ├─ Grid: 3 module cards (views, add)            │
│ Sessions │  ├─ Trending Topics (3 pills)                    │
│ Reports  │  └─ Recent Imports by Peers (activity feed)      │
│ Library  │                                                   │
│ +New     │  BOTTOM: Explore | My Blueprints | Share          │
└──────────┴───────────────────────────────────────────────────┘
```

### Fonctionnalités identifiées

| Élément | Description | Existant réutilisable |
|---------|------------|----------------------|
| Featured Blueprint | Card hero avec rating, tags, import | Pattern Academy catalog cards |
| Module Grid | Cards avec views count, auteur, add | Pattern Explore cards |
| Trending Topics | Pills avec icônes + stats | Pattern Universe badges (Simulator) |
| Peer Activity Feed | Timeline sociale (imports récents) | Nouveau |
| Filters + Popular | Toolbar filtrage | Pattern Simulator filters |
| Import to Path | Action d'import dans un parcours | Nouveau (lié à academy_paths) |
| Bottom tabs | Explore / My Blueprints / Share | Pattern BottomNav |

---

## Architecture de coexistence : Cabinet vs Portail

```text
┌─────────────────────────────────────────────────┐
│                    App.tsx                        │
│  BrowserRouter → OrgProvider → AnimatedRoutes    │
├─────────────────────────────────────────────────┤
│                                                  │
│  AppShell détecte la route :                     │
│                                                  │
│  /portal/*  → PortalShell (top nav + 3 cols)    │
│  /admin/*   → AdminShell (sidebar admin)         │
│  /*         → AppSidebar (sidebar actuelle)      │
│  /          → Pas de shell (landing)             │
│                                                  │
└─────────────────────────────────────────────────┘
```

### Principe : 3 shells, 1 backend

- **AppSidebar** (cabinet interne) : reste tel quel pour Explorer, Plans, Lab, AI, Workshop, Simulator — c'est l'interface "Growthinnov staff"
- **PortalShell** (portail apprenant) : nouvelle interface HEEP pour les utilisateurs finaux — top nav horizontale, left sidebar contextuelle, right sidebar guide
- **AdminShell** : inchangé
- Les 3 shells partagent le même backend, les mêmes hooks (`useAuth`, `useCredits`, `useActiveOrg`), les mêmes données
- Un user peut accéder au cabinet OU au portail selon son rôle/organisation

### Navigation entre les deux

- Sidebar cabinet : lien "Portail HEEP →" pour basculer
- Portal top nav : lien discret "Cabinet" (si rôle admin/staff)
- URL directe : `/portal` vs `/explore`

---

## Plan d'implémentation complet

### Phase 1 — PortalShell (structure)

**`src/components/portal/PortalShell.tsx`**
- Top nav horizontale : logo HEEP, onglets (Formations, Expériences, Mes Agents, HEEP IA)
- Réutilise les CSS variables existantes (`--primary`, `--pillar-*`)
- Font Inter (ajout dans index.css, le mockup l'utilise) + fallback sur Space Grotesk existant
- Icônes : Material Symbols via className ou mapping vers Lucide équivalents
- Responsive : collapse en hamburger mobile

**`src/components/portal/PortalSidebar.tsx`**
- Left sidebar "Training Hub" : Workspace, AI Toolkits, Learning Paths, Live Sessions, Reports, Resource Library
- Bouton "+ New Formation"
- Réutilise le pattern `SidebarProvider` / `Sidebar` de shadcn existant

**`src/components/portal/PortalBottomBar.tsx`**
- Barre contextuelle : Exit, Glossary, Module, Discuss, Save (mode exercice uniquement)
- En mode marketplace : Explore, My Blueprints, Share

### Phase 2 — Marketplace (page principale portail)

**`src/pages/portal/PortalMarketplace.tsx`**
- Featured blueprint card (hero) avec rating stars, tags, import CTA
- Données : nouvelle table `marketplace_blueprints` ou réutilise `academy_paths` avec flag `is_public`
- Grid de module cards avec views count et "Add" button
- Trending topics pills
- "Recent Imports by Peers" activity feed
- Réutilise les patterns de filtrage de `Simulator.tsx` (search + pills)

**`src/pages/portal/PortalWorkspace.tsx`**
- Dashboard personnel : parcours en cours, dernières activités, KPIs
- Réutilise les queries de `Academy.tsx` (enrollments, progress) et `SimulatorHistory.tsx`

### Phase 3 — Routes & AppShell

**`src/App.tsx`** — Ajout routes :
- `/portal` → PortalMarketplace
- `/portal/workspace` → PortalWorkspace
- `/portal/library` → PortalLibrary
- `/portal/analytics` → PortalAnalytics
- `/portal/training/:id` → Exercice immersif (réutilise SimulatorSession/AcademyModule)

**`src/components/layout/AppShell.tsx`** — Ajout détection :
```
const isPortal = location.pathname.startsWith("/portal");
if (isPortal) return <PortalShell>{children}</PortalShell>;
```

### Phase 4 — Training immersif (exercice en cours)

**`src/components/portal/ModuleGuide.tsx`**
- Right sidebar : progression %, objectifs check/uncheck, expert tips
- Données tirées du module/practice en cours

**`src/components/portal/HeepAIWidget.tsx`**
- Bulle flottante "Ask HEEP IA" → drawer chat
- Réutilise `ChatInterface` + edge function `ai-coach` avec contexte injecté

### Phase 5 — Fonctionnalités structurées existantes intégrées au portail

| Fonctionnalité existante | Intégration portail |
|-------------------------|-------------------|
| Simulator (7 modes UI) | `/portal/training/:id` avec PortalShell wrapping SimulatorEngine |
| Academy (parcours, modules) | `/portal/paths` réutilise les queries d'Academy.tsx |
| Challenges (Design Innovation) | `/portal/challenges` wrapping ChallengeView |
| Workshop (canvas collaboratif) | `/portal/sessions` wrapping WorkshopCanvas |
| Explorer (cards toolkit) | Intégré dans Marketplace comme "AI Toolkits" |
| Coach IA | Intégré comme HeepAIWidget flottant permanent |
| Credits & Quotas | Affiché dans PortalShell header |
| Org context | Réutilise OrgProvider identique |

### Phase 6 — Glossaire, Discussion, Library

**`src/components/portal/GlossarySheet.tsx`** — Sheet termes clés du module
**`src/components/portal/DiscussionPanel.tsx`** — Commentaires par étape
**`src/pages/portal/PortalLibrary.tsx`** — Resource Library (docs, templates, assets)

### Phase 7 — DB (si marketplace real)

Migration optionnelle :
- `ALTER TABLE academy_paths ADD COLUMN is_marketplace boolean DEFAULT false`
- `ALTER TABLE academy_paths ADD COLUMN rating numeric(2,1), views_count integer DEFAULT 0`
- Ou table dédiée `marketplace_blueprints` si séparation stricte

---

## Fichiers impactés

| Fichier | Action |
|---------|--------|
| `src/components/portal/PortalShell.tsx` | Créer |
| `src/components/portal/PortalSidebar.tsx` | Créer |
| `src/components/portal/PortalBottomBar.tsx` | Créer |
| `src/components/portal/ModuleGuide.tsx` | Créer |
| `src/components/portal/HeepAIWidget.tsx` | Créer |
| `src/components/portal/GlossarySheet.tsx` | Créer |
| `src/components/portal/DiscussionPanel.tsx` | Créer |
| `src/pages/portal/PortalMarketplace.tsx` | Créer |
| `src/pages/portal/PortalWorkspace.tsx` | Créer |
| `src/pages/portal/PortalLibrary.tsx` | Créer |
| `src/pages/portal/PortalAnalytics.tsx` | Créer |
| `src/App.tsx` | Modifier — routes `/portal/*` |
| `src/components/layout/AppShell.tsx` | Modifier — détection portal |
| `src/index.css` | Modifier — ajout font Inter |

## Ordre d'exécution

1. PortalShell + PortalSidebar (structure visuelle)
2. AppShell detection + App.tsx routes
3. PortalMarketplace (page hero)
4. PortalWorkspace (dashboard apprenant)
5. ModuleGuide + HeepAIWidget
6. Intégration Simulator/Academy dans portal routes
7. Library, Glossary, Discussion
8. Migration DB marketplace (optionnel)

---

## Question ouverte

Tu as mentionné avoir d'autres mockups prêts. Si tu les partages maintenant, je les intégrerai dans ce plan avant de commencer l'implémentation. Sinon je démarre avec ces 2 mockups comme base.

