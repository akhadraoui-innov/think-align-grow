

# Plan — AI Value Builder v2 : Refonte complète UI/UX

## Constat brutal

L'interface actuelle est un **stepper linéaire de 452 lignes dans un seul fichier** qui empile 6 écrans les uns après les autres dans des `TabsContent`. C'est un formulaire wizard, pas une application SaaS. La capture de référence montre un paradigme totalement différent :

```text
┌────────────────────────────────────────────────────────────┐
│  Header : Projets | Use Cases | + Nouveau projet          │
├──────────┬─────────────────────────────────────────────────┤
│ SIDEBAR  │  MAIN CONTENT                                  │
│          │                                                 │
│ Contexte │  [Badge: Stratégique] UC 1/3                   │
│ Périmètre│  Titre UC + description longue                 │
│ Use Cases│                                                 │
│          │  Tabs: Contexte | Process ✓ | Data ✓ | Archi   │
│ ─────── │       | Impact | Roadmap | Risques ✓            │
│ ANALYSE  │                                                 │
│ PAR UC   │  [Fiche décision ✓] [Analyse complète ✓]       │
│          │                                                 │
│ 1. UC A ●│  ── Contenu analyse markdown premium ──        │
│  ○ Ctxt  │  Tableaux, verdicts, mitigations...            │
│  ★ Proc  │                                                 │
│  ★ Data  │                                                 │
│  ★ Archi │                                                 │
│  ★ Impact│                                                 │
│  ○ Road  │                                                 │
│  ★ Risq  │                                                 │
│          │                                                 │
│ 2. UC B ●│                                                 │
│ 3. UC C ●│                                                 │
│          │                                                 │
│ ─────── │                                                 │
│ Synthèse │                                                 │
│ Consult. │                                                 │
└──────────┴─────────────────────────────────────────────────┘
```

## Changements architecturaux

### 1. Éclater `PortalUCMProject.tsx` (452 lignes → 5 fichiers)

**Nouveau layout** : `UCMProjectLayout.tsx` — sidebar gauche + contenu droite

- **Sidebar interne** (pas la sidebar portal) : arbre de navigation contextuel
  - Section "Projet" : liens Contexte, Périmètre, Use Cases
  - Section "Analyse par UC" : liste UC avec sous-items (sections d'analyse), indicateurs ● complété / ○ vide
  - Section "Synthèse" : Synthèse Globale, Consultant IA
  - Item actif = highlight bleu, sous-items avec étoiles (★ = analysé)

- **Contenu principal** : zone droite qui change selon la sélection sidebar

**5 composants de contenu** :
- `UCMContextStep.tsx` — Formulaire contexte + immersion (extrait du step 1 actuel)
- `UCMScopeStep.tsx` — Sélection secteur + fonctions métier (extrait du step 2)
- `UCMUseCasesList.tsx` — Grille UC avec sélection, génération, badges (extrait du step 3)
- `UCMAnalysisPage.tsx` — **Page dédiée par UC** : header UC (titre, description, badges), tabs horizontaux par section d'analyse (Process, Data, Archi, Impact, Roadmap, Risques), toggle Fiche décision / Analyse complète
- `UCMSynthesisPage.tsx` — 7 sections globales (extrait du step 5)

### 2. `UCMAnalysisPage.tsx` — Le cœur de l'expérience (nouveau)

Inspiré directement de la capture :

- **Header UC** : badge priorité coloré + "UC 1/3" + titre H1 + description complète (pas tronquée)
- **Tabs horizontaux** par section d'analyse : icône + nom + checkmark si analysé. Tab actif = underline bleu
- **Toggle mode** : deux boutons pills "⚡ Fiche décision ✓" / "💻 Analyse complète ✓" — visible si le mode existe
- **Contenu** : `EnrichedMarkdown` plein écran avec tableaux structurés, verdicts, callouts

C'est **1 page par UC** (pas un collapsible empilé). La sidebar permet de naviguer entre UC sans perdre le contexte.

### 3. Sidebar arbre navigable — `UCMProjectSidebar.tsx` (nouveau)

```text
← Projets

PROJET
  📋 Contexte          ← lien
  🎯 Périmètre         ← lien
  💡 Use Cases (3)     ← lien + compteur

ANALYSE PAR UC
  1  Cartographie dy… ● ← cliquable, ● = toutes sections faites
     ○ Contexte UC      ← sous-item cliquable
     ★ Processus        ← ★ = section analysée
     ★ Données
     ★ Architecture
     ○ Impact
     ○ Roadmap
     ★ Risques
  2  Forecast CA…     ●
  3  Optimisation…    ●

SYNTHÈSE
  📊 Synthèse Globale
  🤖 Consultant IA
```

- Largeur fixe `w-56`, scrollable indépendamment
- Items avec `hover:bg-muted/50`, actif = `bg-primary/10 text-primary font-semibold`
- Sous-items indentés de 24px avec ★/○ indicateurs

### 4. Page UC Analysis — Design premium

- **Header** : `bg-gradient-to-r from-primary/5 to-transparent`, badge catégorie (Stratégique/Opérationnel/Tactique) en couleur, compteur "UC 1/3"
- **Tabs sections** : `border-b` avec underline active, icônes emoji, checkmarks ✓ intégrés au label
- **Mode toggle** : deux boutons pill avec icône ⚡/💻, état complété avec ✓
- **Zone contenu** : `max-w-4xl` centré, `EnrichedMarkdown` avec prose styling
- **Bouton générer** : en haut à droite, `Sparkles` icon, disabled si déjà généré pour ce mode

### 5. Dashboard `PortalUCM.tsx` — Modernisation

- KPI cards avec `AnimatedCounter` et icônes dans cercles gradient
- Cards projet : hover lift, progress bar gradient, badge status avec dot animé
- Empty state : illustration + CTA centré

### 6. Routing

Nouvelles sous-routes pour navigation profonde :
- `/portal/ucm/:id` → layout avec sidebar, défaut = contexte
- `/portal/ucm/:id/scope` → périmètre
- `/portal/ucm/:id/usecases` → liste UC
- `/portal/ucm/:id/uc/:ucId` → page analyse UC dédiée (avec section tabs)
- `/portal/ucm/:id/uc/:ucId/:section` → section spécifique (optionnel, via state)
- `/portal/ucm/:id/synthesis` → synthèse globale
- `/portal/ucm/:id/chat` → consultant IA

Cela permet le deep linking, le back/forward navigateur, et le partage d'URLs.

## Fichiers impactés

| Fichier | Action |
|---------|--------|
| `src/pages/portal/PortalUCMProject.tsx` | **Réécrire** — devient layout avec sidebar + outlet |
| `src/components/ucm/UCMProjectSidebar.tsx` | **Créer** — arbre de navigation contextuel |
| `src/components/ucm/UCMContextStep.tsx` | **Créer** — extrait step 1 |
| `src/components/ucm/UCMScopeStep.tsx` | **Créer** — extrait step 2 |
| `src/components/ucm/UCMUseCasesList.tsx` | **Créer** — extrait step 3 |
| `src/components/ucm/UCMAnalysisPage.tsx` | **Créer** — page analyse UC avec tabs sections |
| `src/components/ucm/UCMSynthesisPage.tsx` | **Créer** — extrait step 5 |
| `src/components/ucm/UCMAnalysisView.tsx` | **Supprimer** — remplacé par UCMAnalysisPage |
| `src/pages/portal/PortalUCM.tsx` | **Modifier** — KPIs + cards premium |
| `src/App.tsx` | **Modifier** — nouvelles sous-routes UCM |
| `src/components/ucm/UCMChat.tsx` | **Modifier** — layout pleine page |

## Ordre d'exécution

1. Routes + Layout (`App.tsx` + `PortalUCMProject.tsx` restructuré)
2. `UCMProjectSidebar.tsx` (navigation arbre)
3. `UCMContextStep.tsx` + `UCMScopeStep.tsx` (extraction)
4. `UCMUseCasesList.tsx` (extraction)
5. `UCMAnalysisPage.tsx` (nouveau cœur)
6. `UCMSynthesisPage.tsx` + `UCMChat.tsx` (adaptation)
7. `PortalUCM.tsx` (dashboard premium)

