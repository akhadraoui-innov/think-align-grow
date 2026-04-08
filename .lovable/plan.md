
# Plan — Module Administration "Business & Revenue"

## Vision

Un module stratégique interne dans `/admin/business` qui centralise l'étude go-to-market, le business model, le pricing, les channels, et le positionnement de GROWTHINNOV. Chaque section = un onglet avec contenu riche, interactif, et évolutif.

## Architecture : 8 onglets

```text
┌──────────────────────────────────────────────────────────┐
│  Business & Revenue                                       │
├──────────────────────────────────────────────────────────┤
│ Vue d'ensemble │ Offre │ Pricing │ Channels │ Marché │   │
│ Partenaires │ Grands Comptes │ Simulateur              │
└──────────────────────────────────────────────────────────┘
```

### Onglet 1 — Vue d'ensemble (Executive Summary)
- Hero gradient avec KPIs plateforme (modules actifs, parcours, toolkits, simulateurs)
- Carte de positionnement : "SaaS B2B — IA appliquée au conseil stratégique & formation"
- Canvas BMC interactif (Business Model Canvas) avec les 9 blocs remplis
- Proposition de valeur unique
- Synthèse SWOT en 4 quadrants visuels

### Onglet 2 — Catalogue & Offre produit
- Inventaire de tous les modules vendables (Academy, Simulator, Workshop, Challenge, UCM/AI Value Builder, Toolkits)
- Pour chaque module : description, valeur client, mode de livraison (SaaS/CaaS/Formation)
- Matrice Produit × Segment (PME, ETI, Grand Compte, Cabinet conseil)
- Différenciation vs concurrents (LMS classiques, McKinsey, BCG)

### Onglet 3 — Pricing & Revenue Model
- Grille tarifaire détaillée par plan (Starter / Pro / Enterprise / Custom)
- Modes de facturation : abonnement, crédits, licence, pay-per-use
- Simulateur de revenus intégré (sliders : nb clients × plan × ARPU)
- Unit economics : CAC, LTV, LTV/CAC, churn estimé
- Comparaison pricing concurrentiel

### Onglet 4 — Channels & Go-to-Market
- Cartographie des canaux : Vente directe, Partenaires, Marketplace, Inbound
- Funnel de conversion par canal (Awareness → Trial → Conversion → Expansion)
- Stratégie content marketing / thought leadership
- Timeline de lancement par phase (M1-M3, M4-M6, M7-M12)
- Budget marketing estimé par canal

### Onglet 5 — Marché & Segments
- TAM/SAM/SOM avec visualisation concentrique
- Segmentation par secteur (35 secteurs UCM réutilisés)
- Segmentation par taille (TPE, PME, ETI, GE)
- Segmentation géographique (France, Afrique francophone, Europe)
- Personas décideurs (DG, DRH, DSI, CDO, Directeur Innovation)
- Tendances marché IA/Formation/Conseil

### Onglet 6 — Partenaires & Écosystème
- Modèles de partenariat : Revendeur, Intégrateur, Co-créateur, White-label
- Programme partenaire détaillé (tiers, commissions, enablement)
- Pipeline partenaire (tableau interactif)
- Revenue share par modèle
- Kit d'onboarding partenaire (checklist)

### Onglet 7 — Grands Comptes & Enterprise
- Approche ABM (Account-Based Marketing)
- Cycle de vente enterprise (6-12 mois)
- Critères de qualification (BANT/MEDDIC)
- Architecture multi-tenant pour grands comptes
- Use cases sectoriels (Banque, Industrie, Conseil, Public)
- ROI calculé par profil client

### Onglet 8 — Simulateur Business
- Simulateur interactif avec sliders et graphiques temps réel
- Variables : nb clients par plan, taux de conversion, churn, ARPU
- Projections MRR/ARR sur 12-36 mois (LineChart)
- Scénarios : Conservateur / Réaliste / Ambitieux
- Break-even point calculé dynamiquement

## Composants réutilisés
- `AdminShell` pour le layout
- Recharts pour tous les graphiques (BarChart, LineChart, PieChart, AreaChart)
- `Tabs` / `TabsList` / `TabsTrigger` / `TabsContent` existants
- Cards, Badges, Collapsible du design system
- Pattern `SectionTabs` (Vue Essentielle / Vue Détaillée) repris d'InsightContent

## Style
- Même charte premium que le module Insight (gradients, BigStat, BeforeAfter, cards avec bordures subtiles)
- Chaque onglet commence par un mini-hero avec icône + titre + description
- Contenu riche avec introductions et synthèses
- Interactivité via sliders, collapsibles, tooltips sur les graphiques

## Fichiers à créer

| Fichier | Description |
|---------|-------------|
| `src/pages/admin/AdminBusiness.tsx` | Page principale avec 8 onglets |
| `src/components/admin/business/BusinessOverviewTab.tsx` | Executive Summary + BMC + SWOT |
| `src/components/admin/business/BusinessOfferTab.tsx` | Catalogue produit + matrice |
| `src/components/admin/business/BusinessPricingTab.tsx` | Grille + simulateur revenus |
| `src/components/admin/business/BusinessChannelsTab.tsx` | GTM + funnel + timeline |
| `src/components/admin/business/BusinessMarketTab.tsx` | TAM/SAM/SOM + segments |
| `src/components/admin/business/BusinessPartnersTab.tsx` | Programme partenaire |
| `src/components/admin/business/BusinessEnterpriseTab.tsx` | Grands comptes + ABM |
| `src/components/admin/business/BusinessSimulatorTab.tsx` | Simulateur MRR/ARR interactif |

## Fichiers à modifier

| Fichier | Action |
|---------|--------|
| `src/App.tsx` | Ajouter route `/admin/business` |
| `src/components/admin/AdminSidebar.tsx` | Ajouter entrée "Business & Revenue" avec icône `DollarSign` |
| `src/components/admin/AdminShell.tsx` | Ajouter breadcrumb `/admin/business` |

## Pas de DB nécessaire
Tout le contenu est statique/calculé côté client. Les données plateforme sont lues via les hooks existants (`useAdminStats`). Le simulateur utilise des `useState` + sliders. Évolutif par la suite vers du stockage DB si besoin de persister des scénarios.

## Ordre d'exécution
1. Route + Sidebar + Breadcrumb
2. Page principale (`AdminBusiness.tsx`) avec structure 8 onglets
3. Onglets 1-4 (Vue d'ensemble, Offre, Pricing, Channels)
4. Onglets 5-8 (Marché, Partenaires, Grands Comptes, Simulateur)
