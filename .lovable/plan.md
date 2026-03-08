

# Refonte : Propositions de Valeur & Architecture Multi-Toolkit

## Probleme identifie

L'approche actuelle est trop centree sur des personas caricaturaux (Fondateur, Coach...) qui figent l'identite de la plateforme. La realite : **Hack & Show est le premier toolkit d'une plateforme qui en accueillera d'autres**. Il faut donc une architecture et un storytelling axes sur les **propositions de valeur** de chaque toolkit, pas sur des profils d'utilisateurs.

## Nouvelle vision

La plateforme = un **ecosysteme de toolkits strategiques interactifs**. Chaque toolkit a :
- Un nom, une thematique, une proposition de valeur claire
- Ses propres cartes, piliers, phases, plans de jeu
- Ses propres generateurs IA

"Hack & Show - Bootstrap in Business" est le **premier toolkit** de cette plateforme.

## Changements concrets

### 1. Landing Page -- Axee Valeur, pas Personas

Remplacer la section personas par **3 propositions de valeur** du toolkit actuel :

- **S'acculturer** -- Explorez 200+ concepts strategiques structures en 10 piliers. Montez en competence a votre rythme.
- **Challenger** -- Testez votre maturite strategique via des quiz, des defis et un coaching IA qui confronte vos hypotheses.
- **Structurer & Orchestrer** -- Composez des plans de jeu, generez des livrables (SWOT, BMC, pitch deck) et pilotez vos reflexions.

Chaque proposition = une carte visuelle cliquable qui mene vers la fonctionnalite correspondante (Explorer, Lab, AI).

### 2. Architecture Multi-Toolkit

- Ajouter une notion de "Toolkit" dans le modele de donnees et le routing
- La landing globale presente la plateforme, puis le toolkit actif
- Preparer le terrain pour `/toolkits/:slug` dans le futur
- Le toolkit "Hack & Show" est le contenu par defaut pour l'instant

### 3. Sections Landing revisitees

```text
┌─────────────────────────────┐
│  Hero : "Structure the Chaos"│
│  Sous-titre emotionnel       │
│  CTA Explorer / S'inscrire   │
├─────────────────────────────┤
│  Toolkit actif : H&S         │
│  Badge "Bootstrap in Business"│
├─────────────────────────────┤
│  3 Value Props visuelles     │
│  S'acculturer | Challenger   │
│  Structurer & Orchestrer     │
├─────────────────────────────┤
│  Stats (200+ cartes, etc.)   │
├─────────────────────────────┤
│  Les 4 Phases (visuel)       │
├─────────────────────────────┤
│  Comment ca marche (3 etapes)│
│  1. Explorez  2. Jouez       │
│  3. Generez                  │
├─────────────────────────────┤
│  CTA final (diagnostic IA)   │
└─────────────────────────────┘
```

### 4. Fichiers modifies

| Fichier | Action |
|---|---|
| `src/pages/Index.tsx` | Refonte complete : value props, toolkit badge, section "comment ca marche" |
| `src/components/brand/Logo.tsx` | Creer logo SVG monogramme H&S |
| `src/components/ui/GradientIcon.tsx` | Icones dans cercles gradient pour les value props |
| `src/components/ui/AnimatedCounter.tsx` | Compteurs animes pour les stats |
| `src/components/ui/PatternBackground.tsx` | Mesh gradient decoratif pour le hero |
| `src/components/layout/BottomNav.tsx` | Ajout logo compact, micro-interactions ameliorees |
| `src/pages/Explore.tsx` | Refonte design premium (icones gradient, carte du jour, glow effects) |
| `src/pages/Plans.tsx` | Cartes mission redesignees |
| `src/pages/Lab.tsx` | Amelioration gamification visuelle |
| `src/pages/AI.tsx` | Interface futuriste avec glow |
| `src/pages/Profile.tsx` | Dashboard visuel ameliore |
| `src/index.css` | Nouvelles animations et utilities CSS |
| `tailwind.config.ts` | Animations supplementaires |

### 5. Preparation multi-toolkit

- Les donnees des cartes/piliers/phases seront liees a un `toolkit_id`
- Pour l'instant un seul toolkit actif, mais la structure est prete
- Le header affiche le toolkit courant avec possibilite de switcher plus tard

