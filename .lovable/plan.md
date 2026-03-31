

# Plan — Cycle complet par défaut + Cycle global "Offre complète"

## Changements

### 1. Onglet "Cycle complet" par défaut
Dans `SectionTabs`, changer `defaultValue="essentiel"` → `defaultValue="cycle"` quand un cycle est fourni.

### 2. Nouveau cycle global dans Overview
Créer un `overviewCycle` dans `cycleData.ts` qui synthétise toute l'offre en 2 grandes phases :

**Phase 01 — Knowledge** (Formations + Pratiques)
- Steps reprenant les moments clés : création parcours (ai-gen), modules adaptatifs (ai-tutor), quiz/exercices (ai-eval), simulateur 7 modes (ai-skill), scoring & rapports (ai-eval), knowledge brief (ai-know)

**Phase 02 — Collective Intelligence** (Workshops + Challenges)  
- Steps : sélection toolkit & cartes (system), canevas collaboratif live (system), scoring gamifié (ai-eval), diagnostic stratégique (ai-gen), board & placement (system), analyse IA & maturité (ai-eval)

Metrics footer : KPIs globaux couvrant les 4 modules.

### 3. Intégrer dans OverviewSection
Passer le cycle à `SectionTabs` pour que l'Overview ait aussi les 3 onglets avec le cycle global par défaut.

## Fichiers impactés

| Fichier | Action |
|---------|--------|
| `src/components/insight/InsightContent.tsx` | `SectionTabs` : defaultValue conditionnel ; `OverviewSection` : ajouter cycle |
| `src/components/insight/cycleData.ts` | Ajouter `overviewCycle` (2 phases Knowledge + Collective Intelligence) |

## Ordre d'exécution
1. Ajouter `overviewCycle` dans `cycleData.ts`
2. Modifier `SectionTabs` defaultValue
3. Modifier `OverviewSection` pour passer le cycle

