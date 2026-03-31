

# Plan — Intégrer le format "Cycle de formation" dans chaque section INSIGHT

## Analyse du fichier uploadé

Le HTML présente un format **timeline phasée** extrêmement efficace :

```text
Légende (dots colorés par type d'IA)
│
Phase 01 — Titre (numéro rond coloré + sous-titre)
│  ├── Step cliquable (dot coloré, label, badge, description)
│  │   └── Détail expandable (tech, modèle, données, stockage)
│  ├── Step avec sub-grid (2 colonnes de sub-cards)
│  └── Step avec cascade tags
│
▼ (flèche transition)
│
Phase 02 — Titre
│  └── ...
│
▼
│
Phase 03 — Titre
│  └── ...
│
Footer Metrics (4 KPIs en grille)
Footer Cascade (edge functions, modèles)
```

**Points forts du format** : rail vertical avec dots colorés par acteur (IA Génération, IA Tuteur, IA Évaluation, Système), steps expandables, sub-grids intégrés, badges typés, métriques d'impact, cascade tags.

## Solution

### 1. Créer un composant réutilisable `CycleTimeline`

Un composant générique qui prend en entrée des données structurées et rend le format timeline/rail. Réutilisable pour chaque module (Formations, Pratique, Workshops, Challenges, Plateforme).

### 2. Structure de données (TypeScript, pas de DB)

```text
CycleData {
  title: string
  subtitle: string
  legend: LegendItem[]          // dots colorés
  phases: Phase[]               // 2-4 phases
  metrics: Metric[]             // footer KPIs
  footerNotes: FooterNote[]     // cascade tags + texte
}

Phase {
  number: string ("01", "02")
  title: string
  subtitle: string
  color: string                 // bg du numéro
  steps: Step[]
}

Step {
  label: string
  badges: Badge[]               // { text, variant }
  description: string
  actorType: "ai-gen" | "ai-tutor" | "ai-eval" | "ai-know" | "ai-skill" | "system"
  detail?: string | ReactNode   // contenu expandable
  subCards?: SubCard[]           // grille 2 colonnes optionnelle
}
```

### 3. Intégration dans InsightContent

Ajouter un **3ème onglet "Cycle complet"** dans chaque `SectionTabs` (en plus de "Essentiel" et "Détaillé"). Cet onglet affiche le `CycleTimeline` avec les données spécifiques au module.

```text
Tabs
├── "Vue Essentielle" (storytelling DRH)
├── "Vue Détaillée" (features techniques)
└── "Cycle complet" (timeline phasée — format uploadé)
```

### 4. Contenu par module

**Formations** — Le fichier uploadé tel quel (3 phases : Ingénierie → Parcours → Closing)

**Pratique** — 3 phases : Configuration (scénario, prompt, rubrique) → Session (7 modes, interaction IA, tension gauge) → Closing (score, radar, rapport, replay)

**Workshops** — 3 phases : Préparation (toolkit, cartes, config) → Session live (canevas, drag&drop, scoring) → Restitution (synthèse, stats, export)

**Challenges** — 3 phases : Setup (sujet, format, maturité) → Board (staging, placement, validation) → Analyse (IA, matrice, recommandations)

**Plateforme** — 3 phases : Admin (orgs, rôles, permissions) → Portail (UX immersive, navigation) → Observabilité (catalogue, matrice, logs)

### 5. Pas de base de données

Tout le contenu est statique en TypeScript (constantes). Pas de migration DB. C'est du contenu de présentation, pas des données utilisateur.

## Sous-composants à créer

| Composant | Rôle |
|-----------|------|
| `CycleTimeline` | Orchestrateur : légende + phases + footer |
| `PhaseBlock` | Numéro rond + titre + rail vertical |
| `StepCard` | Card expandable avec dot coloré, badges, détail |
| `SubCardGrid` | Grille 2 colonnes dans un step |
| `MetricsFooter` | 4 KPIs en grille |
| `CascadeTags` | Tags inline avec highlight |
| `PhaseArrow` | Flèche ▼ entre phases |

## Fichiers impactés

| Fichier | Action |
|---------|--------|
| `src/components/insight/CycleTimeline.tsx` | **Créer** — Composant réutilisable + sous-composants |
| `src/components/insight/cycleData.ts` | **Créer** — Données des 5 cycles (Formations, Pratique, Workshops, Challenges, Plateforme) |
| `src/components/insight/InsightContent.tsx` | **Modifier** — `SectionTabs` passe de 2 à 3 onglets, chaque section reçoit son cycle |

## Ordre d'exécution

1. Créer `CycleTimeline.tsx` avec tous les sous-composants (PhaseBlock, StepCard, SubCardGrid, MetricsFooter, CascadeTags)
2. Créer `cycleData.ts` avec les 5 jeux de données
3. Modifier `SectionTabs` pour supporter 3 onglets
4. Intégrer le cycle dans chaque section

