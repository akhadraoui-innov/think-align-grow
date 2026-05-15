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

### Phase E — Innovations ✅
- ✅ #1 `FocusSubjectMode` (double-clic header → fullscreen zen + bouton "Focus")
- ✅ #2 `ActivityHeatmap` (badge coloré par slot, intensité dynamique)
- ✅ #3 `SuggestCardsButton` (compact si rempli + refresh)
- ✅ #4 `VotePill` (memoizé)
- ✅ #5 `SessionTimeline` branché en header (toggle Timeline → filtre temporel sur Sidebar/Cartes/Plateau)
- ✅ #6 `PresentationMode` (réutilisable depuis playground)
- ✅ #7 `StickerLayer` : palette emoji + collage 1-clic sur le plateau (artifact `sticker` avec position monde)
- ✅ #8 `SubjectSnapshot` (PNG par sujet)
- ✅ #9 `SemanticSearchPanel` (sheet header → `useChallengeRAG`, filtres par type, jump vers artifact)

### Phase D — PlateauBoard pro ✅
- ✅ `PlateauMiniMap` (overview + viewport rect + clic pour téléporter)
- ✅ Drag RAF-batched (60fps), persistance directe via `onUpdate`
- ✅ StickerLayer intégré (palette + drop ciblé)
- ✅ Memo `PlateauBoard`

### Phase F — Perf transverse ✅
- ✅ React.memo sur `SlotArtifactChip`, `VotePill`, `PlateauBoard`
- ✅ RAF batch sur drag plateau

## Notes
- Tout sous `src/components/challenge/enriched/*` ; `ChallengeBoard.tsx` legacy intact
- Cartes custom **privées par sujet**
- RAG isolé par session via `challenge_embeddings.session_id` + HNSW
- Filtre temporel : `visibleArtifacts` calculé dans `EnrichedChallengeRoom` et propagé aux 3 vues
