

# Plan — Refonte stratégique du module Business & Revenue

## Diagnostic expert (Revenue Management / CFO / Product Owner)

### Problèmes critiques de contenu et de méthode

**1. Pricing naïf et dangereux en marché IA incertain**
- Prix Pro fixe à 149€/mois sans justification par la valeur (value-based pricing absent)
- Aucune modélisation du coût réel des tokens IA (GPT-4, Gemini) qui représentent 30-60% du COGS variable
- Pas de scénario "token price shock" (+300% comme GPT-4 → GPT-4o pricing shifts)
- Enterprise "sur devis" sans grille indicative — impossible de piloter un forecast
- Pas de pricing par siège vs par usage vs hybrid — le marché SaaS évolue vers usage-based
- Crédits IA à coût fixe (1, 2, 5) sans lien avec le coût réel des appels LLM

**2. Simulateur incomplet pour un CFO**
- Pas de modélisation des coûts IA (tokens consommés × prix par token)
- Pas de runway (cash disponible ÷ burn rate mensuel)
- Pas de cohort analysis (rétention par cohorte mensuelle)
- Pas de scenario "worst case" avec effondrement marché ou hausse des coûts IA
- Pas de sensibilité : quel paramètre a le plus d'impact sur le break-even ?
- P&L trop simplifié : pas de distinction COGS / OPEX / marge brute / marge nette

**3. Marché : analyse superficielle pour un marché en rupture**
- TAM/SAM/SOM statiques sans justification méthodologique
- Aucune analyse concurrentielle (qui sont les vrais concurrents ? 360Learning, Docebo+IA, Coursera for Business, McKinsey Solve)
- Pas de matrice de positionnement (prix × richesse fonctionnelle)
- Trends figées en `const` — non éditables et non sourcées
- Pas de section "Disruptions IA" : agents autonomes, AI-native learning, commoditisation des LLM
- Pas d'analyse build vs buy pour les prospects

**4. Partners : modèle économique incomplet**
- Revenue share calculé sur 149€/mois uniquement — ignore Enterprise et crédits
- `tiers` non éditables (`const [tiers] = useState` sans `setTiers`)
- Pipeline Kanban statique — pas d'ajout/suppression de partenaires
- Pas de modèle d'incentive (MDF, co-marketing budget, deal registration)

**5. Risques non modélisés**
- AUCUNE section risques avec probabilité × impact
- Pas de contingency plan si un fournisseur IA change ses prix ou API
- Pas de dépendance technologique cartographiée (OpenAI, Supabase, Lovable)
- Pas de risque réglementaire (AI Act, RGPD, certifications QUALIOPI)

**6. Bugs et lacunes techniques persistants**
- `newItem` toujours partagé entre BMC et SWOT (bug #1 du plan précédent — non corrigé)
- `MetricTooltip.tsx` référencé dans le plan mais n'existe pas
- KPIs Overview toujours hardcodés (pas `useAdminStats`)
- Roadmap Channels toujours en `const` statique
- Use cases Enterprise toujours en `const` statique

---

## Plan de refonte — 42 actions

### Phase 1 — Modèle économique réaliste (Pricing + Coûts IA)

**1. Pricing : passer au value-based pricing**
- Ajouter dans `businessConfig.ts` : `tokenCostPerAction` (coût réel IA en €), `marginTarget` (marge cible %), `pricingModel` (seat/usage/hybrid)
- Pricing tab : section "Cost of AI" avec sliders par action (coût token input/output, nb tokens moyen par action)
- Calcul automatique : COGS IA par user/mois, marge brute par plan, seuil de rentabilité par plan
- Toggle pricing model : "Par siège" vs "Usage-based" vs "Hybrid" avec simulation comparative

**2. Pricing : grille Enterprise structurée**
- Remplacer "Sur devis" par une grille paramétrable : prix par siège (tranches 100/500/1000+), minimum annuel, remises volume

**3. Pricing : ajout/suppression de plans + features éditables**
- Boutons "Ajouter un plan" / "Supprimer" sur chaque plan
- Features en liste éditable (ajouter/retirer/réordonner)
- `avgUsagePerUser` éditable dans la table crédits

### Phase 2 — Simulateur CFO-grade

**4. Coûts IA dynamiques dans le simulateur**
- Nouveau slider : "Coût moyen token ($/1M tokens)" avec presets (GPT-4o: $5, Gemini Flash: $0.15, etc.)
- Calcul : tokens/user/mois × coût token = COGS IA variable
- Scenario "token price shock" : +100%, +200%, +500%

**5. P&L structuré**
- Séparer : Revenus (MRR SaaS + Crédits + Enterprise) / COGS (infra + IA tokens) / Marge brute / OPEX (salaires, marketing, support) / EBITDA / Marge nette
- Table P&L mensuelle sur 36 mois, pas juste un BarChart

**6. Runway et trésorerie**
- Input : trésorerie initiale (slider)
- Output : runway en mois = trésorerie ÷ burn rate
- Alerte visuelle si runway < 6 mois

**7. Analyse de sensibilité**
- Tornado chart : quel paramètre (churn, ARPU, growth, token cost) impacte le plus le break-even ?
- Variation ±20% de chaque paramètre

**8. Cohort retention**
- Heatmap : rétention par cohorte mensuelle (M0-M12)
- Input : courbe de rétention paramétrable (mois 1: X%, mois 3: Y%, mois 12: Z%)

### Phase 3 — Marché et concurrence

**9. Matrice concurrentielle interactive**
- Axes : Prix (Y) × Fonctionnalités (X)
- Positionnement de 6-8 concurrents (éditables) + GROWTHINNOV
- ScatterChart Recharts interactif

**10. Section "Disruptions & Risques IA"**
- Cards éditables : Agent autonomes, commoditisation LLM, shift usage-based, AI Act
- Pour chaque : probabilité (slider), impact (slider), mitigation (texte éditable)
- Score de risque global calculé

**11. Analyse Build vs Buy**
- Comparateur pour prospects : coût de développer en interne vs acheter la plateforme
- Inputs : nb développeurs, salaire moyen, durée projet, maintenance annuelle
- Output : TCO 3 ans build vs buy

**12. Trends éditables**
- Déplacer `trends` et `personas` dans `useState` avec édition inline

### Phase 4 — Partners et Enterprise

**13. Partners : `setTiers` + édition commissions**
- Rendre les tiers éditables (sliders commission, benefits ajoutables)

**14. Partners : Pipeline interactif**
- Ajout/suppression de partenaires dans le Kanban
- Input texte + bouton par colonne

**15. Partners : Revenue share multi-produit**
- Calcul basé sur mix Pro + Enterprise + Crédits (pas juste 149€)

**16. Enterprise : Use cases éditables + scoring**
- Déplacer `useCases` dans `useState`, scoring éditable via slider

**17. Enterprise : MEDDIC qualification framework**
- 6 critères MEDDIC avec scoring par prospect (Metrics, Economic Buyer, Decision Criteria, Decision Process, Identify Pain, Champion)

### Phase 5 — Overview et transversal

**18. Fix bug `newItem` partagé**
- Séparer en `newBmcItem` + `newSwotItem`

**19. KPIs depuis `useAdminStats`**
- Remplacer les valeurs hardcodées par des requêtes DB

**20. Créer `MetricTooltip.tsx`**
- Tooltip avec explication business sur chaque métrique clé

**21. Channels : roadmap dans `useState`**
- Phases éditables (titre, items ajoutables/supprimables)

**22. Channels : ajout/retrait de canaux**
- Bouton "Ajouter un canal" avec rééquilibrage auto à 100%

### Phase 6 — Nouvelles sections stratégiques

**23. Onglet "Risques" (nouveau)**
- Matrice probabilité × impact
- Catégories : Technologique, Marché, Réglementaire, Financier, RH
- Plan de mitigation éditable par risque
- Score de risque global avec jauge visuelle

**24. Section "Unit Economics avancés" dans Pricing**
- Net Revenue Retention (NRR)
- Gross Margin par plan
- Magic Number (sales efficiency)
- Rule of 40 (growth + margin)

---

## Fichiers impactés

| Fichier | Actions clés |
|---------|-------------|
| `businessConfig.ts` | Ajouter types : `TokenCost`, `Competitor`, `Risk`, `MEDDICScore`, `CohortData`. Ajouter defaults concurrents, risques, coûts tokens |
| `BusinessOverviewTab.tsx` | Fix `newItem` (#18), KPIs depuis `useAdminStats` (#19), MetricTooltip (#20) |
| `BusinessPricingTab.tsx` | Cost of AI section (#1), Enterprise grille (#2), CRUD plans (#3), Unit Economics avancés (#24) |
| `BusinessSimulatorTab.tsx` | Token costs (#4), P&L structuré (#5), Runway (#6), Sensibilité tornado (#7), Cohorts (#8) |
| `BusinessMarketTab.tsx` | Matrice concurrentielle (#9), Disruptions (#10), Build vs Buy (#11), Trends éditables (#12) |
| `BusinessPartnersTab.tsx` | `setTiers` (#13), Pipeline interactif (#14), Revenue multi-produit (#15) |
| `BusinessEnterpriseTab.tsx` | Use cases éditables (#16), MEDDIC (#17) |
| `BusinessChannelsTab.tsx` | Roadmap `useState` (#21), Ajout canaux (#22) |
| Nouveau : `MetricTooltip.tsx` | Composant tooltip contextuel (#20) |

## Ordre d'exécution
1. `businessConfig.ts` (types + defaults étendus)
2. Pricing (cost of AI + plans CRUD + unit economics)
3. Simulator (P&L structuré + runway + sensibilité + cohorts)
4. Market (concurrence + risques + build vs buy)
5. Partners + Enterprise (édition + MEDDIC)
6. Overview + Channels (bugs + dynamisation)
7. MetricTooltip (transversal)

