

# Refonte du Workspace Apprenant Academy

## Constat

L'experience apprenant actuelle souffre de plusieurs problemes majeurs :

1. **Contenu de cours** : rendu Markdown basique dans une colonne etroite, pas d'experience de lecture immersive (pas de sidebar de navigation persistante, pas de breadcrumb contextuel)
2. **Quiz** : deja gamifie mais isole dans un onglet, pas integre dans le flux
3. **Exercice** : textarea brut + evaluation IA, pas de guidage progressif
4. **Pratique IA (critique)** : chat dans une boite de 650px fixe, aucune ressemblance avec les environnements ChatGPT/Claude/Gemini — pas de plein ecran, pas de sidebar conversations, pas d'experience native
5. **Navigation** : pas de workspace unifie, chaque page est isolee, pas de sentiment de progression continue

## Approche : 3 vagues

Vu l'ampleur, je propose de decouper en **3 vagues** successives. Chaque vague est deployable independamment.

---

### VAGUE 1 — Workspace Layout + Pratique IA (priorite critique)

**Objectif** : Transformer le module en workspace avec sidebar + refondre la Pratique IA en experience ChatGPT-like plein ecran.

#### 1A. Layout Workspace (`AcademyModule.tsx`)

Remplacer le layout actuel (colonne centree + onglets) par un **workspace a 2 panneaux** :

```text
┌──────────────┬────────────────────────────────────┐
│  SIDEBAR     │  MAIN CONTENT                      │
│  - Parcours  │                                    │
│  - Modules   │  [Contenu / Quiz / Exercice /      │
│    ✓ Mod 1   │   Pratique selon le type]           │
│    ● Mod 2   │                                    │
│    ○ Mod 3   │                                    │
│    🔒 Mod 4  │                                    │
│              │                                    │
│  ─────────   │                                    │
│  Progression │                                    │
│  [====70%==] │                                    │
└──────────────┴────────────────────────────────────┘
```

- Sidebar gauche collapsible (icone toggle) avec : nom du parcours, liste des modules (icone type + statut ✓/●/🔒), progression globale, bouton "Retour au parcours"
- Sur mobile : sidebar en Sheet/Drawer
- Le contenu principal prend toute la largeur restante
- Plus d'onglets TabsList : le type de module determine le rendu directement (lesson → contenu, quiz → quiz engine, exercise → exercice, practice → chat IA)

#### 1B. Pratique IA — Experience ChatGPT-like (`AcademyPractice.tsx`)

Refonte complete pour ressembler aux interfaces de chat IA modernes :

- **Plein ecran** : le chat prend tout l'espace principal du workspace (pas de boite 650px)
- **Sidebar conversations** (optionnel, dans le panneau gauche du workspace) : historique des sessions
- **Zone de saisie premium** : textarea extensible en bas, avec bouton envoyer, compteur de caracteres, raccourcis clavier
- **Messages** : bulles avec avatar Bot anime, rendu Markdown riche (code highlight, tables, callouts), timestamps
- **Header contextuel** : titre de la pratique, difficulte, compteur d'echanges en badge, bouton reset
- **Zone d'accueil** (quand 0 messages) : illustration, description du scenario, 4-6 suggestions de demarrage contextuelles (pas generiques)
- **Streaming visible** : curseur clignotant pendant la generation, animation fluide token par token
- **Evaluation** : resultat en overlay/modal elegant avec score radial anime, feedback detaille, bouton recommencer
- **Responsive** : sur mobile, le chat prend tout l'ecran

#### Fichiers concernes Vague 1

| Fichier | Action |
|---------|--------|
| `src/pages/AcademyModule.tsx` | Refonte layout workspace 2 panneaux, suppression des onglets |
| `src/components/academy/AcademyPractice.tsx` | Refonte complete ChatGPT-like plein ecran |

---

### VAGUE 2 — Contenu de cours premium + Exercice enrichi

#### 2A. Lecteur de cours immersif

- **Colonne de lecture** : max-w-3xl centree, `leading-relaxed`, `space-y-12` entre sections
- **H2 avec accent** : barre primaire a gauche style magazine
- **Barre de lecture segmentee** : un segment par section/heading, highlight de la section active au scroll
- **Sommaire sticky** : affiché dans la sidebar workspace (pas un toggle separe), highlight dynamique au scroll
- **Estimations** : temps de lecture restant en haut a droite
- **Bouton "Marquer termine"** : sticky en bas, apparait quand readingProgress > 80%

#### 2B. Exercice enrichi

- **Instructions structurees** : rendu Markdown riche des instructions (pas juste du texte brut)
- **Editeur ameliore** : textarea avec compteur de mots, indication de longueur attendue
- **Feedback IA** : rendu en sections colorees (Forces en vert, Ameliorations en orange) avec icones
- **Historique des tentatives** : timeline visuelle des soumissions precedentes avec scores

#### Fichiers concernes Vague 2

| Fichier | Action |
|---------|--------|
| `src/pages/AcademyModule.tsx` | ImmersiveContent refonte + sommaire sidebar |
| `src/components/academy/AcademyExercise.tsx` | UX enrichie |
| `src/components/academy/EnrichedMarkdown.tsx` | Ajouts typographiques (H2 accent, espacement) |

---

### VAGUE 3 — Quiz ameliore + Dashboard enrichi

- Quiz : transitions entre questions plus fluides, mode revision post-quiz, animations de score
- Dashboard : graphiques de progression dans le temps, recommandations IA de prochains parcours

---

## Proposition

Je recommande de commencer par la **Vague 1** (Workspace layout + Pratique IA) car c'est le changement le plus impactant et le plus critique selon votre retour. Cela transformera fondamentalement l'experience.

Souhaitez-vous approuver la Vague 1 pour implementation immediate ?

