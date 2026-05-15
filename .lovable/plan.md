## Audit de l'existant (capture utilisateur)

Observations sur la vue `/challenge/...` actuelle :

1. **Sidebar 5 onglets** — labels coupés ("POST-ITS" sur 2 lignes), compteur collé au libellé, picto trop petit, l'onglet actif (Images orange) écrase visuellement → manque de hiérarchie corporate.
2. **Chips slot uniformes** — un post-it, une question et une image sont rendus comme une simple pastille texte (`SlotArtifactChip`). On ne voit ni la miniature de l'image, ni la couleur de criticité du post-it, ni le pictogramme audio. Le slot ne reflète pas la nature de l'élément.
3. **Headers slot** — typographie OK mais badges "1 CARTE / ORDRE" peu lisibles, hint italique invisible quand le slot est rempli, pas de couleur de famille slot (challenge / question / contexte).
4. **Layout** — l'`InspectorPanel` (400 px) reste un pousseur fixe à droite : quand il s'ouvre, le centre tombe sous 50 %. Promesse "slots à 60 %" non tenue.
5. **DnD** — ghost natif du navigateur (capture du tile complet), pas de feedback ciblé "image vers slot Identification" ni d'effet sur le slot survolé autre que le ring.
6. **Vue cartes vs sujet** — couleurs `bg-accent/10`, `bg-destructive/10` pour les badges type sujet : ne correspondent pas à la palette serious-game orange/noir, ça flashe rouge sans raison sémantique.
7. **Header room** — toggle Cartes/Plateau et bouton Analyser corrects, mais le badge `running` / `vous seul` se mélange avec le titre.

## Plan

### 1. Chip slot enrichie par kind (`SlotArtifactChip.tsx`)

```text
┌─ image ────────┐  ┌─ postit (criticité high) ┐  ┌─ vocal 0:14 ▶ ┐  ┌─ ? Question ┐
│ [thumb 36x36]  │  │ ● Idée à creuser…        │  │ ▮▮▮▮▮▯▯ texte │  │ ❓ comment…   │
└─ alt court ────┘  └──────────────────────────┘  └────────────────┘  └─────────────┘
```

- `image` : `<img>` miniature 36×36 arrondie + alt court en dessous, ring rose.
- `postit` : pastille de couleur de criticité (`CRITICALITY_META.dot`) à gauche, contenu tronqué, fond ambre.
- `voice` : barre d'onde stylisée (5 barres CSS), durée `mm:ss`, click → ouvre inspector et lance lecture.
- `question` : icône `?` orange + texte, badge `IA` si `ai_meta.status === "answered"`.
- Hover : bouton détacher `X`, halo couleur kind, élévation `shadow-sm → shadow-md`.
- Tailles harmonisées : hauteur 32 px sauf image (chip plus grande 56 px) → grille `flex-wrap gap-2`.

### 2. Sidebar pro et lisible (`EnrichedSidebar.tsx`)

- Onglets : libellé sur **une seule ligne** (`whitespace-nowrap text-[11px]`), icône au-dessus, pastille compteur en `Badge` discret à droite du libellé.
- Onglet actif : barre orange en bas (style underline), pas de fond plein → moins agressif, plus corporate.
- Largeur sidebar : `w-[280px]`. La tuile image en sidebar utilise déjà `ImageTile compact`, OK.
- Composer (post-it / vocal / question / image) toujours en haut, cadré dans une carte `bg-card border` pour structurer.

### 3. Inspector en drawer overlay (`EnrichedChallengeRoom.tsx` + `InspectorPanel.tsx`)

- L'`InspectorPanel` devient `fixed right-0 top-[header] bottom-0 w-[400px] z-30` avec slide-in (`translate-x` Motion).
- Backdrop subtil `bg-background/40 backdrop-blur-[2px]` sur md− uniquement (sur lg+, pas de backdrop, juste l'overlay).
- Le contenu central garde sa largeur (sidebar 280 + main flex-1) → quand l'inspector s'ouvre, on couvre une partie du main, on ne le reflow pas. Promesse 60 % tenue.
- Bouton fermer en haut à droite, raccourci `Esc`.

### 4. DnD pro

- Sur `onDragStart` de chaque tuile sidebar : `e.dataTransfer.setDragImage(node, x, y)` — pour `image`, on passe la miniature ; pour `postit`, on génère un mini-noeud teinté.
- Sur `DropSlot` survolé : afficher un placeholder typé `"Déposer · Image"` avec icône kind dynamique (déjà partiellement fait, ajouter l'icône).
- Slots du sujet courant pulsent doucement (`animate-pulse` 2 s) au début d'un drag pour indiquer les cibles.
- Source tuile pendant drag : `opacity-40` (déjà actif quand `slot_id`, on étend pendant le drag courant).

### 5. Harmonisation visuelle corporate (`SubjectCanvas.tsx`)

- Remplace `TYPE_COLORS` :
  - `question` → `bg-primary/10 text-primary` (orange, c'est notre couleur d'interrogation)
  - `challenge` → `bg-foreground/10 text-foreground` (noir, sérieux)
  - `context` → `bg-muted text-muted-foreground` (gris)
- Header sujet : mention `1/2 emplacements remplis` en `tabular-nums`, séparateur `·` cohérent.
- Headers slot : typographie `font-display`, ajouter pastille couleur **par type de slot** (badge `CHALLENGE` orange, `ORDRE` violet, `MULTI` slate) à la place du tag gris actuel, plus lisible.

### 6. Header room (`EnrichedChallengeRoom.tsx`)

- Réorganise : `[icône Sparkles] CHALLENGE ENRICHI` puis sous-ligne `Badge running · presence` ; toggle Cartes/Plateau plus contrasté ; le bouton orange `Clôturer →` reste à droite.

### 7. Reste à faire (séquencé après ce polissage)

a. **Lock distant propagé au DnD** — `useArtifactLock` en lecture seule sur toutes les tuiles ; si lock par autre user → `draggable={false}`, opacity, tooltip "Verrouillé par {name}".
b. **Plateau (`PlateauBoard`)** : accepter aussi le drop d'un artifact existant (réassigner `position` libre + sortir d'un slot).
c. **Copilote scopé sujet/slot** — `CopilotBubble` reçoit `currentSubjectId` (déjà), ajouter le `currentSlotId` (focalisé) ; la requête RAG filtre les artifacts du slot pour réponse contextuelle.
d. **Curseurs presence sur slot** — `PresenceBar` étendu : pastille avatar dans le header de slot quand `peer.viewing_subject_id === subject.id && peer.editing_artifact_id ∈ slot`.
e. **Bibliothèque d'images partagée** (réutilisation entre sessions) — onglet "Bibliothèque" dans `ImageLibrary` listant les images déjà uploadées de l'org.

### Détails techniques

Fichiers modifiés :
- `src/components/challenge/enriched/SlotArtifactChip.tsx` — refonte par kind, miniature image, onde vocal, criticité postit
- `src/components/challenge/enriched/EnrichedSidebar.tsx` — onglets sur une ligne, underline actif
- `src/components/challenge/enriched/EnrichedChallengeRoom.tsx` — inspector en drawer overlay (positionnement)
- `src/components/challenge/enriched/InspectorPanel.tsx` — passe en `fixed` + animation slide
- `src/components/challenge/SubjectCanvas.tsx` — palette type sujet corporate
- `src/components/challenge/DropSlot.tsx` — header slot (badge type coloré), placeholder drag avec icône kind, pulse cibles

Aucune migration BDD, aucune edge function touchée. Aucune dépendance ajoutée.

Hors scope de cette itération : multi-sélection, réordonnancement des artifacts dans un slot (rank), scopes & filtres avancés.

