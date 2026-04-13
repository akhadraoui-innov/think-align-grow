

# Plan — Réorganisation du module Business & Revenue en 4 sections + Guide

## Nouvelle architecture

Le module passe de 10 onglets plats à **5 sections principales** avec navigation verticale (sidebar interne ou onglets principaux), chacune contenant ses sous-onglets :

```text
┌─────────────────────────────────────────────────┐
│  Business & Revenue                             │
├──────────┬──────────────────────────────────────┤
│ 1. Vue   │  [Vue d'ensemble]  [Offre]          │
│ d'ensemble│                                     │
├──────────┤──────────────────────────────────────┤
│ 2. Business│  [Pricing]  [Channels]  [Marché]  │
│    Model  │                                     │
├──────────┤──────────────────────────────────────┤
│ 3. Simula-│  [Partenaires]  [Enterprise]        │
│    tions  │  [Simulateur]                       │
├──────────┤──────────────────────────────────────┤
│ 4. Devis  │  [Liste devis]  [Nouveau]           │
│           │  [Synthèse]                         │
├──────────┤──────────────────────────────────────┤
│ 5. Guide  │  (contenu direct, pas de sous-tabs) │
└──────────┴──────────────────────────────────────┘
```

## Navigation UX

- **Niveau 1** : 5 onglets principaux horizontaux (icône + label), style "pill" large
- **Niveau 2** : sous-onglets secondaires, plus discrets, en dessous
- Transition fluide : le contenu change sans rechargement de page

## Chantier Devis — Sous-onglet "Liste devis"

Nouveau composant dédié remplaçant la liste actuelle inline dans `BusinessQuoteTab` :
- **Groupement par prospect** : chaque prospect est un `Collapsible` avec son nom en header
- **Contenu collapsed** : tableau avec colonnes Date, Version, Statut (badge), Montant total
- **Actions par ligne** : Ouvrir, Dupliquer, Supprimer
- **Clic** : charge le devis dans le sous-onglet "Nouveau devis" (formulaire d'édition existant)

## Chantier Devis — Sous-onglet "Synthèse" amélioré

- **Filtres** : par prospect, par statut (draft/sent), par période (date picker), par fourchette de montant
- KPIs agrégés filtrés : Total MRR pipeline, Nombre de devis, Valeur moyenne

## Fichiers impactés

| Fichier | Action |
|---------|--------|
| `src/pages/admin/AdminBusiness.tsx` | **Réécrire** — Navigation 2 niveaux (sections + sous-onglets) |
| `src/components/admin/business/BusinessQuoteListTab.tsx` | **Créer** — Liste devis groupée par prospect avec collapsibles |
| `src/components/admin/business/BusinessQuoteSynthesisTab.tsx` | **Créer** — Synthèse avec filtres (prospect, statut, période, montant) |
| `src/components/admin/business/BusinessQuoteTab.tsx` | **Modifier** — Extraire la liste et la synthèse, ne garder que le formulaire de création/édition |
| `src/components/admin/business/BusinessGuideTab.tsx` | **Modifier** — Rafraîchir le contenu pour refléter la nouvelle organisation |
| `src/components/admin/AdminShell.tsx` | **Modifier** — Breadcrumb pour sous-routes business |

## Ordre d'exécution

1. Restructurer `AdminBusiness.tsx` avec la navigation 2 niveaux
2. Créer `BusinessQuoteListTab.tsx` (liste groupée par prospect)
3. Créer `BusinessQuoteSynthesisTab.tsx` (synthèse + filtres)
4. Refactorer `BusinessQuoteTab.tsx` en mode formulaire seul
5. Mettre à jour le Guide et les breadcrumbs

