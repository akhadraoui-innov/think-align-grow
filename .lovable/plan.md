
# Audit critique — Module Business & Revenue vs Plan

## Grille de notation

| Critère | Score | Verdict |
|---------|-------|---------|
| **Architecture / Config** | 8/10 | OK — `businessConfig.ts` centralisé, types bien définis |
| **Routing / Intégration** | 9/10 | OK — Route, sidebar, breadcrumb en place |
| **Onglet 1 — Overview** | 6/10 | Défauts majeurs |
| **Onglet 2 — Offre** | 7/10 | Correct mais incomplet |
| **Onglet 3 — Pricing** | 7/10 | Bon mais manques |
| **Onglet 4 — Channels** | 6/10 | Roadmap statique, funnel basique |
| **Onglet 5 — Marché** | 7/10 | Personas/trends statiques |
| **Onglet 6 — Partenaires** | 5/10 | Pipeline non interactif |
| **Onglet 7 — Enterprise** | 7/10 | Use cases statiques |
| **Onglet 8 — Simulateur** | 8/10 | Le meilleur, quelques manques |
| **UX Premium** | 4/10 | Aucune animation Framer Motion |
| **TOTAL** | **58/100** | Passable — loin du plan |

---

## Défauts critiques par onglet

### Overview (6/10)
- **KPIs hardcodés** : `value: "6"`, `value: "11"` — le plan exigeait `useAdminStats` (données réelles DB)
- **Pas de glassmorphism** sur les KPI cards (juste `bg-background/60 backdrop-blur` sans bordures translucides premium)
- **BMC** : pas de réordonnancement des items (plan demandait drag & drop / réordonner)
- **Bug UX** : un seul `newItem` state partagé entre BMC et SWOT — si on édite un bloc BMC puis un quadrant SWOT, le texte se transfere
- **Pas d'introduction ni de synthèse** (plan demandait intro + synthèse par section)

### Offre (7/10)
- **Prix non éditable inline** : le `priceRange` est affiché en texte brut, pas de champ éditable
- **Pas de segments cochables** : le plan demandait des checkboxes par segment, on a juste la matrice
- **Pas de différenciation vs concurrence** (mentionné dans le plan)

### Pricing (7/10)
- **Ajout/suppression de plans** : ABSENT — le plan demandait `ajouter/supprimer des plans`
- **Features éditables inline** : ABSENT — les features sont en lecture seule
- **Comparateur benchmark** : ABSENT — plan demandait "toggle pour afficher un benchmark concurrent"
- **avgUsagePerUser non éditable** dans la table crédits

### Channels (6/10)
- **Roadmap 100% statique** : le plan demandait "phases déplaçables, milestones éditables" — c'est du JSX en dur
- **Funnel** : les stages sont éditables OK mais pas les noms de stages
- **Pas d'ajout/retrait de canaux** (plan le demandait)
- **Total share** : pas de mécanisme de rééquilibrage automatique à 100%

### Marché (7/10)
- **Personas figés** : const en dur, pas dans `useState`, non éditables (plan : "personas décideurs")
- **Trends figées** : même problème
- **Visualisation concentrique** : fonctionne mais les labels se chevauchent avec `position: absolute` + `marginTop` hack — fragile

### Partenaires (5/10) — Le plus faible
- **`tiers` non éditable** : `const [tiers] = useState` — pas de `setTiers`, les commissions et paliers des tiers ne sont pas modifiables
- **Pipeline Kanban non interactif** : pas de drag & drop, pas d'ajout de partenaire, données statiques hardcodées
- **Revenue share calculator** : calcul basé uniquement sur 149€/mois (Pro) — ne prend pas en compte Enterprise ni les tiers variables

### Enterprise (7/10)
- **Use cases statiques** : const en dur, scoring non éditable (plan demandait "scoring d'opportunité éditable")
- **Qualification MEDDIC** : ABSENTE du plan mais mentionnée comme attendue

### Simulateur (8/10) — Le meilleur
- **Multi-scénarios comparables** : OK, bien implémenté
- **Export CSV** : OK
- **P&L** : OK
- **Manque** : pas de scénario "Custom" libre (4ème slot)
- **Manque** : pas de calcul du runway
- **Manque** : pas de AreaChart "revenus cumulés" (seulement LineChart MRR et BarChart P&L)

---

## Défauts transversaux

### UX Premium — 4/10
1. **Framer Motion** : ZÉRO animation — le plan demandait "Animations Framer Motion sur les transitions de scénarios et les graphiques"
2. **Glassmorphism** : Quasi absent — juste `backdrop-blur` basique, pas de `backdrop-blur-xl`, pas de `bg-white/5 border-white/10`
3. **Tooltips contextuels** : AUCUN tooltip explicatif sur les métriques business (plan demandait "Tooltips contextuels sur chaque métrique avec explication business")
4. **Color coding** : Partiellement fait (vert pour positif, rouge pour risque) mais pas systématique
5. **Responsive** : Correct mais non testé en profondeur

### Bug fonctionnel
- **`newItem` partagé** : un seul `useState("")` pour `newItem` dans Overview, utilisé à la fois par BMC et SWOT. Si on tape dans un bloc BMC et switch vers un quadrant SWOT, le texte est conservé de façon non intentionnelle.

---

## Plan de correction — 28 actions prioritaires

### Phase 1 — Bugs + Architecture (5 actions)
1. Séparer `newItem` en `newBmcItem` / `newSwotItem` dans Overview
2. Rendre `tiers` éditable dans Partners (`setTiers` + sliders commission)
3. Ajouter `framer-motion` au projet (déjà dans les deps ?)
4. Créer un composant `<MetricTooltip>` réutilisable
5. Corriger la visualisation concentrique TAM/SAM/SOM (labels positionnés proprement)

### Phase 2 — Dynamisation des données statiques (8 actions)
6. Overview : KPIs depuis `useAdminStats` au lieu de valeurs hardcodées
7. Overview : intro + synthèse en texte éditable
8. Channels : roadmap dans `useState` avec édition inline
9. Channels : ajout/retrait de canaux
10. Market : personas dans `useState` + édition inline
11. Market : trends dans `useState`
12. Enterprise : use cases dans `useState` + scoring éditable
13. Partners : pipeline Kanban avec ajout de partenaires

### Phase 3 — Features manquantes du plan (8 actions)
14. Pricing : bouton ajout/suppression de plans
15. Pricing : features éditables inline par plan
16. Pricing : `avgUsagePerUser` éditable
17. Pricing : comparateur benchmark toggle
18. Offer : `priceRange` éditable inline
19. Simulator : ajouter scénario "Custom" libre
20. Simulator : calcul runway + AreaChart revenus cumulés
21. Enterprise : section MEDDIC

### Phase 4 — UX Premium (7 actions)
22. Wraper chaque section avec `motion.div` (fade + slide)
23. Glassmorphism premium sur KPI cards (blur-xl, border-white/10)
24. `<MetricTooltip>` sur toutes les métriques clés (LTV/CAC, MRR, ROI, break-even)
25. Transitions animées sur changement de scénario (Simulateur)
26. Hover effects premium sur les cards (scale, shadow, glow)
27. Empty states attractifs si une section est vide
28. Introduction et synthèse en haut/bas de chaque onglet

### Phase 5 — Polish
- Responsive audit mobile
- Dark mode vérification
- Accessibilité (aria-labels sur les sliders)

## Fichiers impactés

| Fichier | Actions |
|---------|---------|
| `BusinessOverviewTab.tsx` | #1, #6, #7, #22, #23, #24 |
| `BusinessOfferTab.tsx` | #18, #22 |
| `BusinessPricingTab.tsx` | #14, #15, #16, #17, #22, #24 |
| `BusinessChannelsTab.tsx` | #8, #9, #22 |
| `BusinessMarketTab.tsx` | #5, #10, #11, #22 |
| `BusinessPartnersTab.tsx` | #2, #13, #22 |
| `BusinessEnterpriseTab.tsx` | #12, #21, #22 |
| `BusinessSimulatorTab.tsx` | #19, #20, #22, #24, #25 |
| Nouveau : `MetricTooltip.tsx` | #4 |

## Priorité
Phase 1 (bugs) → Phase 2 (dynamisation) → Phase 3 (features) → Phase 4 (UX) → Phase 5 (polish)
