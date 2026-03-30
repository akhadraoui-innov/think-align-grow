

# Plan — Refonte Discovery : 3 onglets interactifs (Architecture, Workflow Business, Métier)

## Problème actuel

La section Discovery ne contient qu'un seul flow technique (PlatformFlow). L'utilisateur veut une section riche avec **3 onglets distincts** offrant des perspectives différentes : architecture technique (BPM), workflows business, et présentation métier.

## Solution

Transformer la `DiscoverySection` en une page à onglets avec `Tabs` (shadcn), chacun avec du contenu riche et interactif :

### Onglet 1 — Architecture plateforme (flow interactif existant)
- Conserver le `PlatformFlow` existant (grille n8n avec couches filtrables)
- Ajouter un court intro contextualisé

### Onglet 2 — Workflows Business
Présentation des flux métier clés sous forme de workflow BPMN visuels (composants JSX) :
- **Flux Onboarding apprenant** : Inscription → Profil → Parcours suggéré → Premier module → Certification
- **Flux Création de contenu** : Brief métier → IA Génération → Review admin → Publication → Analytics
- **Flux Évaluation** : Quiz → Exercice → Pratique IA → Score compétence → Certificat → Livret PDF
- **Flux Workshop** : Toolkit sélection → Participants → Canevas live → Scores → Synthèse IA

Chaque workflow = une série de steps horizontaux connectés par des flèches, avec des badges de couche (Apprenant/IA/Admin) et un panneau de détail au clic sur chaque step.

### Onglet 3 — Présentation Métier
Contenu orienté cas d'usage concrets, organisé par domaine :
- **RH & Formation** : Upskilling IA, certification, cartographie compétences
- **Consulting & Stratégie** : Diagnostic, maturité, challenges autonomes
- **Innovation & Produit** : Design thinking, workshops gamifiés, ideation
- **Management** : Ateliers d'équipe, feedback, prise de décision

Chaque domaine = une card expandable avec pain points, solutions, KPIs et workflow simplifié.

## Fichiers impactés

| Fichier | Action |
|---------|--------|
| `src/components/insight/InsightContent.tsx` | Refonte `DiscoverySection` avec `Tabs` 3 onglets |
| `src/components/insight/PlatformFlow.tsx` | Inchangé (réutilisé dans onglet 1) |

## Détail technique

La `DiscoverySection` devient :
```
Tabs (defaultValue="architecture")
├── TabsList
│   ├── "Architecture" (icône Layers)
│   ├── "Workflows Business" (icône ArrowRight)
│   └── "Cas Métier" (icône Briefcase)
├── TabsContent "architecture"
│   └── PlatformFlow (existant)
├── TabsContent "workflows"
│   └── 4 BusinessWorkflow cards avec steps horizontaux cliquables
└── TabsContent "metier"
    └── 4 DomainCards expandables avec contenu riche
```

### Composants internes (dans InsightContent.tsx)

**BusinessWorkflow** : card avec titre + steps horizontaux. Chaque step = cercle numéroté + label + badge couche + flèche SVG. Au clic : expand avec description, acteurs, outils, IA impliquée.

**DomainCard** : card avec icône gradient, titre, 3 pain points, solution, KPIs. Expand/collapse avec chevron.

## Résultat attendu

- 3 onglets riches et distincts dans Discovery
- Onglet Architecture = le flow interactif existant
- Onglet Workflows = 4 flux business animés avec détails au clic
- Onglet Métier = 4 domaines d'application avec contenu business concret
- Tout reste statique (pas de DB), coloré, premium, professionnel

