

# Plan — Connecter les onglets Business au Devis IA

## Probleme

Chaque onglet Business (Offre, Pricing, Channels, Marche) utilise un state local independant. Le Devis IA lit les constantes `DEFAULT_*` statiques et ignore toute modification faite dans les autres onglets.

## Solution : State partagé au niveau `AdminBusiness.tsx`

### Architecture

Remonter le state editable dans `AdminBusiness.tsx` et le passer en props aux onglets enfants. Ainsi toute modification dans un onglet est immediatement visible dans les autres, notamment le Devis.

```text
AdminBusiness.tsx (state central)
├── BusinessOfferTab     ← modules actifs, attractivite
├── BusinessPricingTab   ← roles, plans, quotas
├── BusinessChannelsTab  ← canaux, taux conversion
├── BusinessMarketTab    ← segments, geo
├── BusinessQuoteTab     ← lit tout le state ci-dessus
└── ...
```

### Ce qui change

**1. `AdminBusiness.tsx`** — Creer le state central :
- `modules: ModuleConfig[]` (init depuis `DEFAULT_MODULES`)
- `pricingRoles: PricingRole[]` (init depuis `DEFAULT_PRICING_ROLES`)
- `segments: SegmentConfig[]` (init depuis `DEFAULT_SEGMENTS`)
- `channels: ChannelConfig[]` (init depuis `DEFAULT_CHANNELS`)
- `saleModels: SaleModel[]` (init depuis `DEFAULT_SALE_MODELS`)

Passer en props a chaque onglet : `value` + `onChange`.

**2. `BusinessOfferTab`** — Recevoir `modules` et `onModulesChange` en props au lieu de `useState` interne.

**3. `BusinessPricingTab`** — Recevoir `pricingRoles` et `onPricingRolesChange` en props pour le sous-onglet Roles & Plans.

**4. `BusinessChannelsTab`** — Recevoir `channels` et `onChannelsChange`.

**5. `BusinessQuoteTab`** — Impact principal :
- Les roles/plans dans le configurateur de deal viennent du state `pricingRoles` (pas de `DEFAULT_PRICING_ROLES`)
- Les segments dans le select viennent du state `segments`
- Les modules actifs filtrent les acces dans le recapitulatif
- Le modele de vente vient du state `saleModels`
- Le prompt IA envoye a l'edge function inclut les infos reelles (modules actifs, canaux principaux)

### Alternative : persistence DB

Si on veut que les configs survivent au refresh (pas juste dans la session), on pourrait creer une table `business_config` (une seule ligne, JSONB). Mais c'est un second temps — le state partagé resout deja le probleme de coherence inter-onglets.

## Fichiers impactes

| Fichier | Action |
|---------|--------|
| `AdminBusiness.tsx` | State central + passage props |
| `BusinessOfferTab.tsx` | Props `modules` + `onModulesChange` |
| `BusinessPricingTab.tsx` | Props `pricingRoles` + `onPricingRolesChange` |
| `BusinessChannelsTab.tsx` | Props `channels` + `onChannelsChange` |
| `BusinessMarketTab.tsx` | Props `segments` + `onSegmentsChange` |
| `BusinessQuoteTab.tsx` | Lire les props au lieu des DEFAULT_* |

## Ordre
1. Refactor `AdminBusiness.tsx` — state + props
2. Adapter chaque onglet (Offre, Pricing, Channels, Market)
3. Connecter le Devis aux donnees live

