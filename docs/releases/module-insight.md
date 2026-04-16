# Module — Insight & Discovery

> Cartographie **interactive** de la plateforme : cycle de vie produit, flow BPMN/n8n navigable, exploration des modules avec panel détaillé.

## 🎯 Vision

Offrir une vision globale et navigable de la plateforme : comment les modules s'articulent, quel est le cycle de vie d'un client, quelles sont les couches logiques (data, UI, IA, sécurité).

## 🏛️ Jalons majeurs

### 2026-03 — Module Insight initial
- 6 sections initiales documentant la plateforme :
  - Vision produit.
  - Architecture.
  - Modules.
  - Personae.
  - Cycle de vie client.
  - Roadmap.

### 2026-03-30 — Section Discovery (BPMN/n8n)
Demande utilisateur : *« logique n8N, BPMN, interactif flow, hyper moderne et naviguable avec panel qui détaille »*.

Implémentation :
- `PlatformFlow.tsx` : visualisation type n8n/BPMN.
- Layout grid CSS pour positionnement nœuds.
- Overlay SVG pour connexions entre nœuds.
- `FlowNodeCard.tsx` : nœud cliquable avec icône + label + status.
- `FlowDetailSheet.tsx` : panel latéral détaillant le nœud sélectionné.
- `flowData.ts` : seed des nœuds (modules, edge functions, tables, intégrations).
- Couches logiques **filtrables** : Data, UI, AI, Security, Integration.

### 2026-03 — CycleTimeline
- `CycleTimeline.tsx` : timeline horizontale du cycle de vie client.
- Étapes : Discovery → Onboarding → Activation → Engagement → Retention → Expansion.
- `cycleData.ts` : seed étapes avec métriques cibles.

### 2026-03 — InsightSidebar & Content
- `InsightSidebar.tsx` : navigation 7 sections.
- `InsightContent.tsx` : router de contenu.
- Markdown enrichi pour chaque section.

### 2026-04 — Admin Insight
- `AdminInsight.tsx` : édition des sections Insight.
- Pages dédiées :
  - `AdminObservability.tsx`
  - `AdminObservabilityCatalogue.tsx` (catalogue cross-asset)
  - `AdminObservabilityMatrix.tsx` (matrice contributeurs × assets)

### 2026-04 — Portail Insight
- `PortalInsight.tsx` : version apprenant de la cartographie.

## 📦 État actuel

- ✅ 7 sections Insight documentées.
- ✅ Discovery flow navigable type n8n.
- ✅ Cycle timeline interactive.
- ✅ Couches filtrables.
- ✅ Versions admin + portail.

## 🧠 Références mémoire

Aucune mémoire spécifique — module documentaire, alimenté par seed data.
