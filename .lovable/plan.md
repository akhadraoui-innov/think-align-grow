

# Plan — Section "Discovery" interactive avec flow BPMN/n8n navigable

## Vision

Ajouter une 7ème section **"Discovery"** dans le module Insight avec une visualisation interactive type n8n/BPMN : des nœuds connectés par des flux, organisés en couches logiques filtrables. Cliquer sur un nœud ouvre un panneau latéral de détail. Le tout est construit en pur React/CSS (pas de librairie externe).

## Architecture de la visualisation

### Couches logiques (filtrables via toggle buttons)

1. **Expérience apprenant** — Parcours, Modules, Quiz, Exercices, Pratique IA, Workshops, Challenges
2. **Intelligence artificielle** — IA Tutor, IA Coach, IA Évaluation, IA Génération, IA Analyse, Knowledge Brief
3. **Administration** — Paramétrage, Observabilité, Rôles, Crédits, Facturation
4. **Données & Persistance** — Progress tracking, Scores, Certificats, Documents, Sessions

### Nœuds du flow

Chaque nœud = une card cliquable avec :
- Icône + couleur par couche (bleu apprenant, violet IA, orange admin, vert données)
- Titre court
- Badge de couche
- Connexions visuelles (lignes SVG) vers les nœuds liés

### Panneau de détail (slide-in droit)

Au clic sur un nœud :
- Sheet/drawer qui s'ouvre à droite
- Titre, description détaillée, fonctionnalités clés
- Badges de technologie
- Liens vers les nœuds connectés (navigables)
- Indicateur de couche

## Structure des données (statique, dans le composant)

```typescript
interface FlowNode {
  id: string;
  label: string;
  description: string;       // résumé court
  detail: string;            // description longue pour le panneau
  layer: "learner" | "ai" | "admin" | "data";
  icon: LucideIcon;
  features: string[];        // liste de fonctionnalités
  techBadges: string[];      // badges tech
  connections: string[];     // ids des nœuds connectés
  position: { col: number; row: number }; // position dans la grille
}
```

~25 nœuds couvrant toute la plateforme, positionnés en grille 6 colonnes × 5 rangées.

## Rendu du flow

- **Grille CSS** (`grid-template-columns: repeat(6, 1fr)`) pour positionner les nœuds
- **SVG overlay** par-dessus la grille pour dessiner les connexions entre nœuds (lignes courbes ou orthogonales type BPMN)
- **Filtres de couche** : 4 toggle buttons en haut, chaque couche a sa couleur. Désactiver une couche grise les nœuds + connexions de cette couche
- **Zoom** : pas de zoom libre, mais 2 modes (vue compacte / vue étendue)
- **Animation** : transitions CSS sur les nœuds au hover et au filtre, pulse sur le nœud sélectionné

## Panneau de détail

Utiliser le composant `Sheet` (shadcn) côté droit :
- Header avec icône gradient + titre + badge couche
- Corps : description riche, liste de features avec check icons, badges tech
- Footer : "Nœuds connectés" avec boutons cliquables qui naviguent vers l'autre nœud (ferme le sheet, ouvre l'autre)

## Fichiers impactés

| Fichier | Action |
|---------|--------|
| `src/components/insight/InsightContent.tsx` | Ajouter `DiscoverySection` + l'enregistrer dans `SECTIONS` |
| `src/components/insight/InsightSidebar.tsx` | Ajouter entrée "Discovery" avec sous-items (Couche Apprenant, Couche IA, Couche Admin, Couche Data) |
| `src/components/insight/PlatformFlow.tsx` | **Créer** — composant principal du flow interactif (grille, SVG, filtres, nœuds) |
| `src/components/insight/FlowNodeCard.tsx` | **Créer** — composant d'un nœud individuel |
| `src/components/insight/FlowDetailSheet.tsx` | **Créer** — panneau Sheet de détail d'un nœud |
| `src/components/insight/flowData.ts` | **Créer** — données statiques des ~25 nœuds et connexions |

## Détail des ~25 nœuds par couche

### Couche Apprenant (bleu)
1. **Parcours** — Parcours adaptatifs par fonction/persona
2. **Leçons** — Contenu Markdown enrichi interactif
3. **Quiz** — QCM avec scoring et feedback IA
4. **Exercices** — Production libre évaluée par IA
5. **Pratique IA** — Simulateur 7 modes conversationnels
6. **Workshops** — Canevas collaboratif temps réel
7. **Challenges** — Diagnostic stratégique drag & drop

### Couche IA (violet)
8. **IA Tutor** — Accompagnement personnalisé par module
9. **IA Coach** — Guide contextuel workshops
10. **IA Évaluation** — Scoring et feedback automatique
11. **IA Génération** — Création de contenu pédagogique
12. **IA Analyse** — Diagnostic et recommandations
13. **Knowledge Brief** — Synthèse personnalisée pré-module
14. **IA Document** — Livret de cours PDF complet

### Couche Admin (orange)
15. **Paramétrage** — Fonctions, personae, compétences
16. **Observabilité** — Dashboard, métriques, couverture
17. **Rôles** — RBAC granulaire avec audit trail
18. **Crédits** — Système de consommation IA
19. **Organisations** — Multi-tenant, équipes, branding

### Couche Data (vert)
20. **Progress** — Suivi granulaire par module
21. **Scores** — Évaluation par compétence persistée
22. **Certificats** — Vérifiables, QR code, LinkedIn
23. **Sessions** — Historique simulateur complet
24. **Documents** — Livrets, analyses, rapports

## Connexions clés (exemples)

- Parcours → Leçons → Quiz → Exercices → Pratique IA (flux séquentiel)
- IA Tutor → Leçons, Quiz, Exercices (accompagnement)
- IA Évaluation → Scores → Certificats (flux évaluation)
- Paramétrage → IA Génération → Parcours (flux admin)
- Progress → IA Analyse → Knowledge Brief (flux data→IA)

## Ordre d'exécution

1. Créer `flowData.ts` (données des 25 nœuds + connexions)
2. Créer `FlowNodeCard.tsx` (nœud cliquable)
3. Créer `FlowDetailSheet.tsx` (panneau détail)
4. Créer `PlatformFlow.tsx` (orchestrateur : grille, SVG, filtres)
5. Ajouter `DiscoverySection` dans `InsightContent.tsx`
6. Ajouter entrée sidebar dans `InsightSidebar.tsx`

