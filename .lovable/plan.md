

# Plan — Portail HEEP : Refonte complète par expérience

## Architecture

Le portail HEEP utilise un thème bleu dédié (~`#4F6BED` → HSL `233 82% 62%`) appliqué via une classe CSS `.portal` sur le PortalShell, overriding `--primary` sans toucher au cabinet.

```text
┌────────────────────────────────────────────────────────┐
│ HEADER: HEEP [logo bleu] | Formations | Pratique |     │
│         Workshops | Challenges  [🔍 🔔 ⚙️ Cabinet→]   │
├────────┬───────────────────────────────────────────────┤
│ SIDEBAR│  Contenu contextuel selon l'onglet actif      │
│ (varie │  - Formations: Dashboard, Parcours, Certifs   │
│  par   │  - Pratique: Catalogue, Historique             │
│  exp.) │  - Workshops: Mes sessions, Rejoindre         │
│        │  - Challenges: Templates, Sessions actives     │
├────────┴───────────────────────────────────────────────┤
│  HeepAIWidget flottant                                 │
└────────────────────────────────────────────────────────┘
```

## Thème bleu portail

Dans `index.css`, ajouter un scope `.portal` :
```css
.portal {
  --primary: 233 82% 62%;
  --primary-foreground: 0 0% 100%;
  --ring: 233 82% 62%;
}
```
Le `PortalShell` wrapper aura `className="portal"`.

## Restructuration du header

Les 4 onglets deviennent : **Formations**, **Pratique**, **Workshops**, **Challenges**.
Marketplace et HEEP IA restent accessibles (sidebar ou widget flottant).

## Pages par expérience

### 1. Formations (= Academy/Parcours)
Duplication complète de 5 pages existantes :

| Route portail | Page source | Contenu |
|---|---|---|
| `/portal` | Academy.tsx | Catalogue parcours + inscriptions |
| `/portal/dashboard` | AcademyDashboard.tsx | KPIs, progression, streaks |
| `/portal/path/:id` | AcademyPath.tsx | Détail parcours, modules, inscription |
| `/portal/module/:id` | AcademyModule.tsx | Module immersif (layout plein écran dans PortalShell) |
| `/portal/certificates` | AcademyCertificates.tsx | Certificats obtenus |

Sidebar Formations : Dashboard, Mes Parcours, Certificats.

### 2. Pratique (= Simulateur)
Duplication complète de 4 pages :

| Route portail | Page source | Contenu |
|---|---|---|
| `/portal/pratique` | Simulator.tsx | Catalogue modes, univers, practices org |
| `/portal/pratique/session` | SimulatorSession.tsx | Session immersive |
| `/portal/pratique/history` | SimulatorHistory.tsx | Historique sessions + scores |
| `/portal/pratique/session/:id/report` | SimulatorReport.tsx | Rapport détaillé |

Sidebar Pratique : Catalogue, Historique, Mes rapports.

### 3. Workshops
Duplication de 2 pages :

| Route portail | Page source | Contenu |
|---|---|---|
| `/portal/workshops` | Workshop.tsx | Liste sessions, créer, rejoindre |
| `/portal/workshops/:id` | WorkshopRoom.tsx | Canvas collaboratif immersif |

Sidebar Workshops : Mes sessions, Rejoindre, Créer.

### 4. Challenges
Duplication de 2 pages :

| Route portail | Page source | Contenu |
|---|---|---|
| `/portal/challenges` | Challenge.tsx | Templates org, sessions actives |
| `/portal/challenges/:id` | ChallengeRoom.tsx | Board challenge immersif |

Sidebar Challenges : Templates, Sessions actives.

## Approche technique

Chaque page portail **importe et réutilise les mêmes hooks et queries** que la page cabinet (pas de copier-coller de logique). La différence est :
- Le layout (PortalShell vs AppSidebar)
- La navigation interne (liens `/portal/*` au lieu de `/*`)
- Le thème bleu via le scope CSS `.portal`

Pour les pages immersives (module, session simulator, workshop room, challenge room), le PortalShell masque la sidebar et affiche le contenu en plein écran avec une bottom bar contextuelle.

## Fichiers impactés

| Fichier | Action |
|---|---|
| `src/index.css` | Ajouter scope `.portal` avec variables bleu |
| `src/components/portal/PortalShell.tsx` | Refacto header (4 onglets), classe `.portal` |
| `src/components/portal/PortalSidebar.tsx` | Sidebar contextuelle par expérience |
| `src/pages/portal/PortalFormations.tsx` | Refacto → catalogue réel Academy |
| `src/pages/portal/PortalFormationsDashboard.tsx` | Créer — clone AcademyDashboard |
| `src/pages/portal/PortalFormationsPath.tsx` | Créer — clone AcademyPath |
| `src/pages/portal/PortalFormationsModule.tsx` | Créer — clone AcademyModule |
| `src/pages/portal/PortalFormationsCertificates.tsx` | Créer — clone AcademyCertificates |
| `src/pages/portal/PortalPratique.tsx` | Créer — clone Simulator |
| `src/pages/portal/PortalPratiqueSession.tsx` | Créer — clone SimulatorSession |
| `src/pages/portal/PortalPratiqueHistory.tsx` | Créer — clone SimulatorHistory |
| `src/pages/portal/PortalPratiqueReport.tsx` | Créer — clone SimulatorReport |
| `src/pages/portal/PortalWorkspace.tsx` | Refacto → clone Workshop |
| `src/pages/portal/PortalWorkshopRoom.tsx` | Créer — clone WorkshopRoom |
| `src/pages/portal/PortalChallenges.tsx` | Créer — clone Challenge |
| `src/pages/portal/PortalChallengeRoom.tsx` | Créer — clone ChallengeRoom |
| `src/App.tsx` | Ajouter ~14 nouvelles routes `/portal/*` |

## Ordre d'exécution

1. **Thème bleu** — CSS `.portal` scope + PortalShell refacto header
2. **Formations** — 5 pages (la plus volumineuse)
3. **Pratique** — 4 pages
4. **Workshops** — 2 pages
5. **Challenges** — 2 pages
6. **Sidebar contextuelle** — adapte les liens selon l'expérience active

On commence par quelle expérience ?

