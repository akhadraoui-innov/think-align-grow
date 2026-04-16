# Module — Business & Revenue

> Module **interne** SaaS Management : pricing role-centric paramétrable, devis IA, simulateur P&L 36 mois, pilotage commercial.

## 🎯 Vision

Outiller l'équipe SaaS Team de GROWTHINNOV pour modéliser son offre commerciale, simuler la rentabilité, générer des devis personnalisés et suivre le pipeline.

## 🏛️ Jalons majeurs

### 2026 — Architecture centralisée
- État centralisé dans `AdminBusiness.tsx`.
- Configurations partagées entre onglets (modèles de vente, services, setup, rôles).
- Composants modulaires :
  - `BusinessOverviewTab.tsx`
  - `BusinessOfferTab.tsx`
  - `BusinessPricingTab.tsx`
  - `BusinessMarketTab.tsx`
  - `BusinessChannelsTab.tsx`
  - `BusinessPartnersTab.tsx`
  - `BusinessGuideTab.tsx`
  - `BusinessEnterpriseTab.tsx`
  - `BusinessSimulatorTab.tsx` (P&L 36 mois)
  - `BusinessQuoteTab.tsx` (devis IA)
  - `BusinessQuoteListTab.tsx` (historique)
  - `BusinessQuoteSynthesisTab.tsx` (synthèse pipeline)

### 2026 — Modèle de revenu Role-Centric
Modèle entièrement paramétrable :
- **Rôles** définis (Coach, Facilitator, Consultant Senior, Junior, etc.).
- Chaque rôle a un **tarif jour** + **% allocation** par modèle de vente.
- 3 modèles : Subscription / Project / Hybrid.
- Pricing configuré dans `BusinessPricingTab.tsx`.

### 2026 — Simulateur P&L 36 mois
Moteur de simulation complet :
- Modélise revenus (Subscription MRR, Project deals, Setup fees).
- Modélise coûts (allocation rôles × tarif jour).
- Calcule marge brute, EBITDA, cash flow par mois.
- Visualisation graphique évolutive.
- Hypothèses ajustables : croissance MoM, churn, panier moyen.

### 2026 — Devis IA v2 (BusinessQuoteTab)
Cycle de vie complet :
- **Draft** (mutable, IA-assisté).
- **Sent** (verrouillé, partagé client).
- **Won/Lost** (statut final).

Génération :
- Edge function `business-quote` : compose Markdown structuré (contexte client + offre + pricing + plan).
- Persisté dans `business_quotes` (challenges, segment, user_count, engagement_months, role_configs, selected_service_ids, selected_setup_ids, totals, version, parent_quote_id).

### 2026 — QuoteEditor (TipTap)
- Éditeur WYSIWYG basé sur **TipTap**.
- Import : Markdown → HTML via `marked`.
- Export : HTML → Markdown via `Turndown`.
- Insertion de widgets dynamiques (`quoteWidgets.ts`) : tableaux, KPIs, timelines.

### 2026 — Logique financière stricte
Règle métier verrouillée :
- **Setup fees** = one-shot (mois 0).
- **Subscription** = revenu récurrent mensuel.
- **Project** = revenu ponctuel sur durée engagement.
- **Allocation rôles** : pourcentages doivent sommer à 100%.

### 2026 — Historisation des devis
- Table `business_quotes` avec colonnes `version` et `parent_quote_id`.
- Une famille de devis = chaîne `v1 → v2 → v3` via `parent_quote_id`.
- `BusinessQuoteListTab.tsx` regroupe par famille.

### 2026 — Synthèse pipeline
- `BusinessQuoteSynthesisTab.tsx` : pipeline cumulé (montants par statut).
- Conversion rate, valeur moyenne, durée cycle vente.

### 2026 — Quote Preview public
- `AdminQuotePreview.tsx` : page client publique pour consulter un devis envoyé.

## 📊 Modèle de données

| Table | Rôle |
|---|---|
| `business_quotes` | Devis (draft → sent → won/lost) avec version + parent_quote_id |

Le reste des configurations (services, setups, rôles, modèles vente, pricing) est stocké dans des structures admin centralisées (state React + persistance future en DB).

## 📦 État actuel

- ✅ Pricing role-centric paramétrable.
- ✅ Simulateur P&L 36 mois avec graphiques.
- ✅ Devis IA avec TipTap + import/export Markdown.
- ✅ Historisation versionnée des devis.
- ✅ Synthèse pipeline.
- 🚧 Persistance DB des configurations (pricing, services, setups) en cours.

## 🧠 Références mémoire

- `mem://product/business-revenue-pricing-model` — Pricing role-centric
- `mem://product/business-revenue-financial-logic` — Simulateur P&L
- `mem://product/business-revenue-quote-logic` — Setup vs Subscription
- `mem://features/admin-business-quote-management` — Historisation
- `mem://features/admin-business-quote-tool-v2` — Cycle vie devis
- `mem://technical/business-revenue-state-sync` — État centralisé
- `mem://technical/business-revenue/quote-editor-engine` — TipTap + marked + Turndown
