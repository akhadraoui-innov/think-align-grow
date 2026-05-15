## Audit

### BDD / Cloud / API
- `challenge_artifacts` possède déjà `slot_id`, `subject_id`, `position`, `kind` (card/postit/voice/question/image). RLS via `is_workshop_participant/host` OK.
- `challenge_responses` (legacy) gère uniquement les **cartes toolkit** placées dans des slots — table parallèle à `challenge_artifacts`. Aujourd'hui les deux coexistent et **ne se croisent pas** : un slot affiche des `responses` (cartes), pas des `artifacts`.
- Locks (`challenge_artifact_locks`), presence (Realtime channel), copilot, embeddings : opérationnels.
- Edge functions `challenge-agent / -embed / -image / -transcribe / -synthesize` : OK.
- **Manque** : aucune route API ne permet d'attacher un postit/vocal/question/image à un slot via drag&drop ; pas d'agrégation côté slot mélangeant les deux sources.

### UX / UI / Ergonomie actuelles
- `EnrichedChallengeRoom` : header propre, toggle Cartes/Plateau OK, mais `PresenceBar` masquée en md-, double sidebar possible (CardSidebar de ChallengeView + EnrichedSidebar) → **deux barres latérales empilées**, le slot central est étranglé (~50% de largeur seulement).
- `EnrichedSidebar` : 340px fixe, 4 onglets (postit/vocal/question/image). Cartes toolkit absentes → l'utilisateur doit ouvrir la `CardSidebar` séparée.
- `DropSlot` : drop natif HTML5 `card-id` only ; ne lit pas `artifact-id`. Aucune zone visuelle pour des postits dans le slot.
- Headers slots peu lisibles (`text-muted-foreground` faible contraste, `slot.hint` minuscule).
- Drag postit/vocal/etc. : aucun `draggable` posé sur les tuiles sidebar.
- Plateau libre : drag pointer events OK, mais pas de retour visuel sur lock distant pendant le drag.

### Conclusions
1. Fusionner `CardSidebar` dans `EnrichedSidebar` → 5 onglets.
2. Rendre **toutes les tuiles sidebar draggable** (HTML5 dataTransfer unifié).
3. Étendre `DropSlot` pour accepter aussi les artifacts (postit/vocal/question/image) → update `artifact.slot_id` + `subject_id`.
4. Afficher les artifacts attachés **dans le slot**, mixés avec les cartes, badge par kind.
5. Cap sidebar à **~25% large mais slots à 60%** : layout 3-cols `[sidebar 22%][slots 60%][inspector 18%]` ou inspector overlay.
6. Plusieurs **modes de vue toolkit** dans l'onglet "Cartes" sidebar : Liste compacte / Grille piliers / Phases / Kanban — switch en haut d'onglet.
7. Améliorer headers slot (typographie display, badge type, compteur live mixed).

---

## Plan d'implémentation

### 1. Sidebar unifiée 5 onglets (`EnrichedSidebar.tsx`)
- Nouvel onglet `card` (icône `Layers`) en première position.
- Pour chaque tuile sidebar (postit / voice / question / image / card) : ajouter `draggable`, `onDragStart` posant :
  - `dataTransfer.setData("artifact-id", a.id)` + `setData("artifact-kind", a.kind)` pour artifacts existants
  - `dataTransfer.setData("card-id", card.id)` pour cartes toolkit non encore placées
- Onglet "Cartes" : sous-toggle 3 modes de vue → `compact` (liste 1 ligne), `pillars` (groupé pliable couleur pilier — port de `CardSidebar`), `phases` (groupé phases). Search inline + filtre placée/dispo.
- Largeur sidebar : `w-[22%] min-w-[280px] max-w-[360px]`.

### 2. DropSlot étendu (`src/components/challenge/DropSlot.tsx`)
- `handleDrop` lit aussi `artifact-id` + `artifact-kind` ; si présent, appelle nouveau callback `onAttachArtifact(slotId, artifactId)`.
- Affiche, sous les `SlotCard`, une grille compacte de mini-tuiles artifacts (`SlotArtifactChip`) — couleur par kind, click → ouvre InspectorPanel.
- Nouveau compteur header : `X cartes · Y notes/vocaux/questions/images`.
- Headers slot : `font-display font-bold text-sm text-foreground`, badge type slot coloré, hint en `text-xs italic` mais visible.

### 3. Wiring artifact ↔ slot
- `useChallengeArtifacts.update(id, { slot_id, subject_id })` déjà fonctionnel.
- Dans `ChallengeView`, recevoir `artifacts` + `onAttachArtifact` props depuis `EnrichedChallengeRoom`.
- `SubjectCanvas` → passe `artifacts.filter(a => a.slot_id === slot.id)` à chaque `DropSlot`.
- Suppression d'attache : bouton `X` sur chip → `update(id, { slot_id: null })` (artifact reste en sidebar).

### 4. Refonte layout `EnrichedChallengeRoom`
- Supprime double sidebar : `ChallengeView` ne rend plus `CardSidebar` (prop `hideSidebar`).
- Container : `flex` → `[EnrichedSidebar ~22%][main flex-1][InspectorPanel slide-over fixed right-0 w-[380px]]`.
- Inspector devient overlay (drawer non-modal) → libère le centre, slots ≈ 60%.
- Header : PresenceBar visible dès `sm`, toggle Cartes/Plateau plus contrasté.

### 5. Polish header & feedback
- Slot en drag-over : ring `primary`, badge "Déposer ici · {kind détecté}".
- Tuile sidebar : cursor `grab`, ombre au hover, opacity réduite si déjà attachée à un slot.
- Lock : si `artifact.id` est lock par autre user → `draggable={false}` + tooltip "Verrouillé par {name}".

### 6. Modes vue toolkit (dans onglet Cartes sidebar)
```text
[Compact] [Piliers] [Phases]
─────────────────────────────
Compact : • titre · pilier-dot
Piliers : ▸ Pilier (n)
            └ cartes
Phases  : ▸ Phase
            └ cartes par pilier
```

### 7. Hors-scope
- Drag&drop multi-sélection.
- Réordonnancement artifacts dans slot (rank).
- Modification structure DB (aucune migration nécessaire).

---

## Fichiers touchés
- `src/components/challenge/enriched/EnrichedSidebar.tsx` — refonte 5 onglets + drag
- `src/components/challenge/enriched/EnrichedChallengeRoom.tsx` — nouveau layout, suppression doublon
- `src/components/challenge/ChallengeView.tsx` — prop `hideSidebar`, accepte `artifacts` + `onAttachArtifact`
- `src/components/challenge/SubjectCanvas.tsx` — passe artifacts par slot
- `src/components/challenge/DropSlot.tsx` — accepte `artifact-id`, rendu mixte
- Nouveau `src/components/challenge/enriched/SlotArtifactChip.tsx`
- Nouveau `src/components/challenge/enriched/sidebar/CardsTab.tsx` (3 modes vue)
- `src/components/challenge/enriched/InspectorPanel.tsx` — version drawer overlay

Aucune migration BDD. Aucun changement edge function.
