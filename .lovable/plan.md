

# Plan — Module INSIGHT (Portail + Admin)

## Vision

Un espace de découverte interactif de la plateforme GROWTHINNOV, accessible à tous (prospects, clients, partenaires). Pas de base de données — contenu statique en Markdown enrichi, structuré en sections navigables avec menu latéral. Chaque module produit est présenté avec ses pain points, sa proposition de valeur, ses modalités et ses IA.

## Structure du contenu — 6 sections

1. **Vue d'ensemble** — Pitch global, workflow visuel des 4 piliers, proposition de valeur
2. **Formations** — Parcours adaptatifs, types de modules (leçon/quiz/exercice/pratique IA), IA tutor, évaluations, certificats, livret PDF
3. **Pratique** — Simulateur IA, 7 modes (analyse, design, code...), scoring, historique, rapports
4. **Workshops** — Intelligence collective, toolkits, canevas collaboratif, gamification, cartes stratégiques
5. **Challenges** — Design Innovation, diagnostic stratégique, maturité, analyse IA
6. **Plateforme** — Portail immersif, administration, observabilité, IA de paramétrage/génération, crédits

## Fichiers à créer

| Fichier | Rôle |
|---------|------|
| `src/pages/portal/PortalInsight.tsx` | Page principale avec sidebar menu + contenu par section |
| `src/pages/admin/AdminInsight.tsx` | Même contenu, wrappé dans AdminShell |
| `src/components/insight/InsightContent.tsx` | Composant partagé — tout le contenu structuré |
| `src/components/insight/InsightSidebar.tsx` | Menu latéral des sections/sous-sections |

## Fichiers à modifier

| Fichier | Modification |
|---------|-------------|
| `src/components/portal/PortalShell.tsx` | Ajouter onglet "INSIGHT" dans NAV_TABS |
| `src/components/portal/PortalSidebar.tsx` | Ajouter config sidebar `/portal/insight` |
| `src/components/admin/AdminSidebar.tsx` | Ajouter entrée "Insight" dans la section Gestion |
| `src/App.tsx` | Ajouter routes `/portal/insight`, `/portal/insight/:section`, `/admin/insight` |

## Design du contenu `InsightContent.tsx`

Composant unique réutilisé portail + admin. Contenu 100% statique en JSX avec `EnrichedMarkdown` pour les blocs texte.

Chaque section :
- **Hero** : titre + sous-titre + icône gradient + 1 phrase pain point
- **Pain points** : 3 cards avec icône, problème client, impact
- **Solution** : description avec callouts `💡 À retenir`, workflow ASCII ou diagramme Markdown
- **Fonctionnalités clés** : grille de features avec badges (IA, Gamification, Certification...)
- **Proposition de valeur** : card premium avec border-l-4 gradient
- **CTA** : bouton "Découvrir" ou "Demander une démo"

Navigation par `section` URL param → scroll-to ou conditional render.

## Sidebar Insight

Menu avec 6 entrées principales + sous-entrées :
- Vue d'ensemble
- Formations (Parcours adaptatifs, Modules pédagogiques, IA Tutor, Évaluations & Certificats)
- Pratique (Simulateur IA, Modes & Scénarios, Scoring & Rapports)
- Workshops (Toolkits & Cartes, Canevas collaboratif, Gamification)
- Challenges (Diagnostic stratégique, Analyse IA, Maturité)
- Plateforme (Portail immersif, Administration, IA de génération)

## Ordre d'exécution

1. Créer `InsightContent.tsx` avec tout le contenu structuré des 6 sections
2. Créer `InsightSidebar.tsx` (menu navigable)
3. Créer `PortalInsight.tsx` et `AdminInsight.tsx` (wrappers)
4. Ajouter routes dans `App.tsx`
5. Intégrer dans PortalShell, PortalSidebar, AdminSidebar

