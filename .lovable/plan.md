

# Plan — Refonte Pricing : sous-onglets stratégiques + contenu expert + UI corporate

## Diagnostic

Le Pricing actuel est un **onglet plat** avec tout empilé : modèle, plans, Enterprise, COGS, crédits, unit economics, benchmark — en scroll vertical. Problèmes :

1. **Contenu insuffisant** : pas de setup fees, pas de modèle partnership/revshare, pas d'Academy Groupe (licence bulk), pas de CaaS (Consulting-as-a-Service), pas de modèle marketplace
2. **Le choix du modèle de pricing n'impacte rien** : toggle seat/usage/hybrid est cosmétique — il ne change pas les plans affichés ni les projections
3. **Seulement 3 plans** : manque Team, Academy (groupe), Partner, et un vrai plan Enterprise structuré
4. **UI pas corporate** : cards simples, pas de hiérarchie visuelle, pas de navigation structurée pour un sujet aussi profond

## Architecture cible

Transformer l'onglet Pricing en **6 sous-onglets** via un `Tabs` interne :

```text
┌─────────────────────────────────────────────────────────────────┐
│  PRICING & REVENUE MODELS                                       │
├─────────────────────────────────────────────────────────────────┤
│ [Stratégie] [Plans] [Enterprise] [Crédits & IA] [Services]     │
│ [Économie]                                                      │
└─────────────────────────────────────────────────────────────────┘
```

### Sous-onglet 1 — Stratégie de pricing
- **Choix du modèle** (seat / usage / hybrid / CaaS) — le choix **impacte les plans affichés** et les projections du simulateur
- **Matrice valeur/prix** par module : quel prix pour quelle valeur perçue
- **Positionnement tarifaire** : low-touch (self-serve) vs high-touch (accompagné)
- **Comparaison modèles** : tableau avantages/inconvénients de chaque modèle selon le segment

### Sous-onglet 2 — Plans & Offres
- **6 plans éditables** (au lieu de 3) :
  - **Free** : exploration limitée (3 parcours, 5 sessions simulateur)
  - **Solo** : indépendant / freelance (29€/mois, accès complet individuel)
  - **Team** : 5-50 users (89€/user/mois, dashboard manager, analytics équipe)
  - **Pro** : organisation (149€/user/mois, branding, API, SSO)
  - **Academy** : licence groupe (prix/apprenant dégressif, parcours illimités, certification)
  - **Enterprise** : sur mesure (minimum annuel, SLA, custom)
- Pour chaque plan : features CRUD, toggle recommandé, billing mensuel/annuel (-20%)
- **Setup fees configurables** par plan (onboarding, personnalisation, intégration SSO)

### Sous-onglet 3 — Enterprise & Grands Comptes
- **Grille tarifaire par tranche** (éditable) avec remises volume
- **Setup fees Enterprise** : onboarding dédié (5-15K€), intégration SSO (3-8K€), custom branding (2-5K€), formation admins (3-6K€)
- **Modèle Academy Groupe** : prix/apprenant dégressif (50-500-1000+), engagement annuel, parcours sur mesure
- **Options à la carte** : API premium, SLA renforcé, support dédié, analytics avancés — chaque option avec prix éditable

### Sous-onglet 4 — Crédits & Coûts IA
- Table des crédits existante (conservée)
- **COGS tokens** existant (conservé)
- **Calcul de marge par action** : prix vendu en crédits vs coût réel en tokens — marge brute par action
- **Scenario token price shock** : slider ×2, ×3, ×5 — impact sur la marge globale

### Sous-onglet 5 — Services & CaaS
- **Catalogue de services** éditables :
  - Consulting-as-a-Service : workshops animés (1500-5000€/jour), audits stratégiques IA (5-15K€), accompagnement transformation (forfait mensuel)
  - Formation certifiante : programmes sur mesure (500-2000€/participant)
  - Marketplace : commission sur contenu tiers (15-30%)
- **Modèle Partnership** : revenue share configurable, co-branding, white-label (marge et commission éditables)
- **Revenue mix cible** : sliders SaaS vs Crédits vs Services vs Partnership avec objectif %

### Sous-onglet 6 — Unit Economics
- Contenu existant conservé (CAC, LTV, churn, NRR, Magic Number, Rule of 40, benchmarks)
- **Impact du modèle de pricing** : les KPIs se recalculent selon le modèle choisi en sous-onglet 1
- **Projection de revenus** intégrée (conservée du code actuel)

## Interconnexions clés

Le choix du modèle de pricing (sous-onglet 1) **propage** vers :
- Les plans affichés (sous-onglet 2) : en mode usage-based, pas de prix fixe mais un prix de base + crédits
- Le simulateur principal (onglet 8) : les formules de calcul MRR changent selon seat vs usage
- Les Unit Economics : ARPU se calcule différemment

## UI Corporate

- Cards avec bordures nettes `border-border`, fond propre `bg-card`, pas de glassmorphism excessif
- Typographie structurée : titres en `text-lg font-semibold`, sous-titres en `text-sm text-muted-foreground`
- Tables avec headers clairs `bg-muted/50`, lignes alternées
- Badges discrets pour les statuts (Recommandé, Nouveau, Premium)
- Navigation sous-onglets avec `TabsList` compact en haut

## Types à ajouter dans businessConfig.ts

```typescript
export interface SetupFee {
  id: string; name: string; minPrice: number; maxPrice: number; description: string;
}
export interface ServiceConfig {
  id: string; name: string; type: "consulting" | "training" | "marketplace";
  priceModel: string; priceRange: string; margin: number; description: string;
}
export interface RevenueMix {
  saas: number; credits: number; services: number; partnership: number;
}
```

## Plans par défaut enrichis (6 au lieu de 3)

- Free (0€), Solo (29€), Team (89€/user), Pro (149€/user), Academy (sur devis, prix/apprenant), Enterprise (sur devis, minimum annuel)

## Fichiers impactés

| Fichier | Action |
|---------|--------|
| `businessConfig.ts` | Ajouter types `SetupFee`, `ServiceConfig`, `RevenueMix` + defaults pour 6 plans, setup fees, services CaaS |
| `BusinessPricingTab.tsx` | Refonte complète : 6 sous-onglets avec `Tabs` interne, UI corporate, interconnexions |

## Ordre : 1. Config (types + defaults) → 2. Refonte PricingTab (6 sous-onglets)

