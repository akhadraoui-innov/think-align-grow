# Challenge enrichi v2 — État d'implémentation

## ✅ Livré (ce tour)

### Base de données
- Migration `challenge_v2_complete` appliquée :
  - `challenge_artifacts` : `scope`, `visibility_subject_id`, `is_custom_card`, `card_payload`, `thread_order`, `thread_root_id`
  - Trigger `challenge_artifacts_propagate_thread` (propage subject/slot/scope/root aux enfants)
  - Table `challenge_embeddings` (RAG unifié, isolée par session, HNSW)
  - Function `match_challenge_context(session_id, embedding, types[], k)`
  - `challenge_sessions.slug` + `invite_code` (auto-générés)
  - Index perf (session_id+subject+kind, session+slot, parent_artifact_id)
  - RLS embeddings : `is_workshop_participant`

### UI livré
- `SlotArtifactChip` refonte complète :
  - **Post-it papier** 124×124 avec rotation stable, criticité couleur, bouton "+ Continuer" (thread)
  - **Vocal** : player audio HTML5 + transcription scrollable interne
  - **Image** : 3 tailles S/M/L + bouton plein écran (lightbox)
  - **Question** : pastille élargie, badge IA si répondue, "+ Continuer"
- `ImageLightbox` : zoom molette/+/-, pan drag, raccourcis 0/Esc
- `DropSlot` : header avec **sujet + directive toujours visibles**, hauteur min adaptative
- `SubjectCanvas` : **grid adaptative** 1→7+ slots (1=pleine largeur 360px, 2=2col 300px, 4=2col 220px, etc.)

## ⏳ Reste à livrer (priorisé)

### Phase A — Cartes ✅ partiel
- ✅ `CardExplorer.tsx` plein écran : recherche + filtres pilier/phase + grille gamifiée 240×340 + multi-sélection + "Ajouter en zone d'attente"
- ✅ Onglet "Mes cartes" : formulaire création (kind=card, is_custom_card=true, scope=subject, visibility_subject_id=currentSubjectId), persistance via onCreate
- ✅ Bouton "Explorer plein écran" dans CardsTab (badge ⭐ avec compteur custom)
- ✅ Types ChallengeArtifact/CreateArtifactInput étendus (scope, visibility_subject_id, is_custom_card, card_payload, thread_root_id, thread_order)
- ⏳ `CardChatDrawer.tsx` (deck_assistant + tool generate_card via challenge-agent)

### Phase B — Threads post-it ✅
- ✅ `ThreadPanel` refonte cascade visuelle : papier coloré par criticité, rotation stable, indentation + ligne de connexion (`CornerDownRight`), tri via `thread_order`/`thread_root_id` (fallback BFS), composer riche (criticité + anonyme + ⌘+Entrée)

### Phase E1 — Innovation #3 livrée ✅
- ✅ `SuggestCardsButton` : top-3 cartes pertinentes (scoring tokens titre/définition vs sujet+directive), affichées dans l'état vide de chaque slot, ajout 1-clic via `onDrop`

### Phase C — RAG puissant
- Étendre `challenge-embed` : sources `card`, `subject`, `slot`, `briefing`, `synthesis`, ré-indexation thread
- Nouvelle EF `challenge-rag` (POST `{session_id, query, kinds?, k}`)
- Hooks `useChallengeRAG`, `useChallengeEvents`

### Phase D — PlateauBoard pro
- Drop artifacts depuis sidebar
- `PlateauMiniMap`, `PlateauSubjectsRail` (collapsible, focus zoom/pan), lasso multi-sélection
- Virtualisation viewport ± 200px, RAF drag, debounce persistance 400ms

### Phase E — 8 innovations
1. `FocusSubjectMode` (double-clic header → fullscreen zen)
2. `ActivityHeatmap` (overlay slots via challenge_events)
3. `SuggestCardsButton` (RAG sur briefing+slot.hint, top-3, apply)
4. `QuickVote` (👍/👎 hover sur chip)
5. `SessionTimeline` (slider scrub events)
6. `PresentationMode` (raccourci `P`)
7. `StickerLayer` (drag emoji → artifact `sticker` enfant)
8. `SubjectSnapshot` (html-to-image → PNG)

### Phase F — Perf transverse
- React.memo sur SlotArtifactChip / SlotCard / PlateauCard
- useMemo filtres sidebar
- Auto-scroll viewport edges pendant drag
- A11y clavier (focus + flèches sur slots, Enter/Space)

## Notes
- Tout sous `src/components/challenge/enriched/*` ; `ChallengeBoard.tsx` legacy intact
- Cartes custom **privées par sujet** (validé)
- Threads post-it = artifacts enfants visuels (validé)
- Toutes les innovations à implémenter (validé)
