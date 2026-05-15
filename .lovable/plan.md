# Challenge enrichi v2 — État d'implémentation

## ✅ Livré

### Base de données
- Migration `challenge_v2_complete` :
  - `challenge_artifacts` : `scope`, `visibility_subject_id`, `is_custom_card`, `card_payload`, `thread_order`, `thread_root_id`
  - Trigger `challenge_artifacts_propagate_thread`
  - Table `challenge_embeddings` (RAG unifié, isolée par session, HNSW)
  - Function `match_challenge_context(session_id, embedding, types[], k)`
  - `challenge_sessions.slug` + `invite_code`
  - Index perf + RLS embeddings

### Phase A — Cartes ✅
- `CardExplorer` plein écran (recherche + filtres + grille gamifiée + multi-sélection)
- Onglet "Mes cartes" (privées par sujet)
- Onglet "Copilote" (`DeckChat` → mode `deck_assistant` du EF challenge-agent, citations cliquables, brouillon → carte personnalisée)
- Suggestions IA dans les slots (compact si rempli) + bouton refresh

### Phase B — Threads post-it ✅
- `ThreadPanel` cascade visuelle papier coloré, indentation + ligne de connexion, `thread_order`/`thread_root_id`, composer riche

### Phase C — RAG puissant ✅
- `challenge-embed` étendu : sources `artifact`/`thread`/`briefing`/`subject`/`slot`/`card`/`synthesis` mirrorées vers `challenge_embeddings`
- Nouvelle EF `challenge-rag` (POST `{session_id, query, kinds?, k?}`) → retourne matches scorés
- Hook `useChallengeRAG` (search/matches/loading/error)

### Phase E — Innovations ✅ partiel
- ✅ #1 `FocusSubjectMode` (double-clic header → fullscreen zen + bouton "Focus")
- ✅ #2 `ActivityHeatmap` (badge coloré par slot, intensité dynamique)
- ✅ #3 `SuggestCardsButton` (Phase E1)
- ✅ #4 `VotePill` (déjà existant, branché)
- ✅ #5 `SessionTimeline` (slider scrub events)
- ✅ #6 `PresentationMode` (existant dans `playground/`, réutilisable)
- ✅ #8 `SubjectSnapshot` (html2canvas → PNG, bouton dédié dans header)

### Phase F — Perf transverse ⏳
- React.memo : à appliquer sur SlotArtifactChip, VotePill, SlotCard

## ⏳ Reste à livrer (best-effort)

### Phase D — PlateauBoard pro
- `PlateauMiniMap`, `PlateauSubjectsRail` collapsible, lasso multi-sélection
- Virtualisation viewport ± 200px, RAF drag, debounce persistance 400ms

### Innovations restantes
- #7 `StickerLayer` (drag emoji → artifact `sticker` enfant)
- Branchement `SessionTimeline` dans le header (filtre temporel des artifacts)

## Notes
- Tout sous `src/components/challenge/enriched/*` ; `ChallengeBoard.tsx` legacy intact
- Cartes custom **privées par sujet**
- RAG isolé par session via `challenge_embeddings.session_id` + HNSW
