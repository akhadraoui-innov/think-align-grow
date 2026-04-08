

# Plan révisé — Business & Revenue : Module 100% dynamique et interactif

## Critique du plan précédent

Le plan actuel est **statique** : textes en dur, tableaux figés, pas de configuration possible. Pour un outil de pilotage stratégique, c'est insuffisant. Voici les faiblesses identifiées :

- Pricing hardcodé → doit être éditable avec ajout/suppression de plans
- BMC figé → les 9 blocs doivent être éditables inline
- SWOT figé → quadrants éditables, drag & drop d'éléments
- Simulateur basique → multi-scénarios comparables, sauvegardables, exportables
- Aucun toggle de scénarios → besoin de presets sélectionnables + customisation
- Pas de comparaison → les scénarios doivent se superposer sur les graphiques

## Nouvelle architecture : tout est état, rien n'est texte

```text
┌─────────────────────────────────────────────────────────────────┐
│  BUSINESS & REVENUE — Command Center                            │
├─────────────────────────────────────────────────────────────────┤
│ [Overview] [Offre] [Pricing] [Channels] [Marché]                │
│ [Partenaires] [Enterprise] [Simulateur]                         │
└─────────────────────────────────────────────────────────────────┘
         ↕ Chaque onglet = données éditables + visualisation live
```

### Principes clés

1. **Toutes les données dans des objets `useState`** — pas de texte JSX en dur
2. **Édition inline** partout — double-clic sur un champ = mode édition
3. **Scénarios sélectionnables** — presets (Conservateur/Réaliste/Ambitieux) + Custom
4. **Comparaison visuelle** — overlay de scénarios sur les mêmes graphiques
5. **Fichier de config centralisé** — `businessConfig.ts` avec toutes les valeurs par défaut

## Détail par onglet — ce qui change

### Onglet 1 — Vue d'ensemble
- **BMC interactif** : 9 blocs en grille, chaque bloc = liste éditable (ajouter/supprimer/réordonner des items)
- **SWOT dynamique** : 4 quadrants avec items ajoutables, badge de priorité (haute/moyenne/basse), compteur par quadrant
- **KPIs** : tirés de `useAdminStats` (données réelles DB) + indicateurs tendance

### Onglet 2 — Offre
- **Modules configurables** : toggle actif/inactif par module, prix éditable, segments cochables
- **Matrice interactive** : cliquer sur une cellule pour changer l'attractivité (●/●●/●●●), filtres par segment

### Onglet 3 — Pricing (le plus critique)
- **Plans dynamiques** : ajouter/supprimer des plans, éditer nom/prix/features inline
- **Table crédits** : coûts par action éditables avec recalcul live du revenu moyen
- **Unit Economics** : sliders pour CAC, LTV, churn — recalcul automatique LTV/CAC, payback period
- **Comparateur** : toggle pour afficher un benchmark concurrent à côté de chaque plan

### Onglet 4 — Channels
- **Canaux éditables** : ajouter/retirer des canaux, ajuster le % de répartition avec sliders (total = 100%)
- **Funnel interactif** : taux de conversion par étape modifiable, recalcul du coût d'acquisition par canal
- **Timeline drag** : phases déplaçables, milestones éditables

### Onglet 5 — Marché
- **TAM/SAM/SOM** : 3 sliders liés avec visualisation concentrique animée (cercles proportionnels)
- **Segments** : tableau avec pondération éditable, graphique treemap qui se met à jour live
- **Géographie** : carte interactive (toggle par région), impact sur le SAM recalculé

### Onglet 6 — Partenaires
- **Modèles configurables** : commission %, paliers éditables, simulation de revenu par modèle
- **Pipeline** : tableau Kanban mini (Prospect → Négociation → Actif) avec drag & drop
- **Revenue share calculator** : sliders commission × volume = projection

### Onglet 7 — Enterprise
- **Cycle de vente** : étapes éditables avec durée et taux de conversion par étape
- **ROI Calculator** : inputs client (nb employés, coût formation actuel) → ROI calculé live
- **Use cases** : cards avec scoring d'opportunité éditable

### Onglet 8 — Simulateur Business (le plus riche)
- **3 scénarios pré-remplis** + scénario custom libre
- **Toggle de comparaison** : superposer 2 ou 3 scénarios sur le même LineChart
- **Variables complètes** :
  - Clients par plan (3 sliders séparés)
  - Taux de conversion trial → paid
  - Churn mensuel
  - ARPU par plan
  - Coûts fixes et variables
  - Taux de croissance organique
- **Outputs** : MRR, ARR, break-even, runway, marge nette, P&L simplifié
- **Graphiques** : LineChart multi-séries (MRR par plan), AreaChart (revenus cumulés), BarChart (P&L mensuel)
- **Export** : bouton pour copier les données du scénario en JSON/CSV

## Fichier de config centralisé

```text
src/components/admin/business/businessConfig.ts
```

Contient TOUS les defaults : plans, modules, canaux, segments, scénarios presets. Chaque onglet lit ses defaults depuis ce fichier et les met dans du `useState`. L'utilisateur modifie → la vue se met à jour en temps réel.

## UX Premium

- **Glassmorphism** sur les cards KPI (backdrop-blur, bordures translucides)
- **Animations Framer Motion** sur les transitions de scénarios et les graphiques
- **Tooltips contextuels** sur chaque métrique avec explication business
- **Mode sombre** cohérent avec le reste de l'admin
- **Responsive** : layout 2 colonnes desktop, stack mobile
- **Color coding** : vert = positif, rouge = risque, bleu = neutre, orange = attention

## Fichiers à créer

| Fichier | Description |
|---------|-------------|
| `src/components/admin/business/businessConfig.ts` | Config centralisée (defaults, presets scénarios, plans, modules) |
| `src/pages/admin/AdminBusiness.tsx` | Page principale 8 onglets |
| `src/components/admin/business/BusinessOverviewTab.tsx` | BMC éditable + SWOT dynamique + KPIs live |
| `src/components/admin/business/BusinessOfferTab.tsx` | Modules configurables + matrice interactive |
| `src/components/admin/business/BusinessPricingTab.tsx` | Plans éditables + unit economics sliders + comparateur |
| `src/components/admin/business/BusinessChannelsTab.tsx` | Canaux % sliders + funnel interactif + timeline |
| `src/components/admin/business/BusinessMarketTab.tsx` | TAM/SAM/SOM sliders + segments pondérés + géo toggle |
| `src/components/admin/business/BusinessPartnersTab.tsx` | Commission sliders + pipeline kanban + revenue calc |
| `src/components/admin/business/BusinessEnterpriseTab.tsx` | Cycle vente éditable + ROI calculator + use cases |
| `src/components/admin/business/BusinessSimulatorTab.tsx` | Multi-scénarios comparables + P&L + export |

## Fichiers à modifier

| Fichier | Action |
|---------|--------|
| `src/App.tsx` | Route `/admin/business` |
| `src/components/admin/AdminSidebar.tsx` | Lien "Business & Revenue" icône `DollarSign` |

## Pas de DB pour V1
Tout en `useState` côté client. Évolutif vers DB pour persister les scénarios sauvegardés.

## Ordre : Config → Page → Onglets 1-4 → Onglets 5-8

