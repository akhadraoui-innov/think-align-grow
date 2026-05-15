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

### Phase A — Cartes (le plus demandé)
- `CardExplorer.tsx` : Dialog plein écran avec recherche, filtres (pilier/phase/audience), grille gamifiée 320×420, multi-sélection
- Onglet "Créer ma carte" → `kind=card, is_custom_card=true, scope='subject'`, visible auteur uniquement sur le sujet courant
- `CardChatDrawer.tsx` : useChat AI SDK + mode `deck_assistant` dans `challenge-agent` (citations RAG, tool `generate_card`)
- `GameCard` variants : `gamified` (étoiles, dégradé, KPI mis en avant), `showcase` (320×420 pour Explorer)

### Phase B — Threads post-it
- `PostitThread.tsx` dans `InspectorPanel` (rendu cascade indentée auteur/timestamp)
- Bouton "+ Continuer" déjà en place sur les chips → ouvre Inspector mode thread (à brancher : `setSelected(a)` actuel ouvre l'inspector, il suffit d'auto-focus le composer)

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
