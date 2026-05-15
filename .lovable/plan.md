## Audit critique du plan v1

**Failles identifiées** :
1. **RAG faible** : `challenge_artifacts.embedding` existe mais aucune indexation des **cartes du deck**, **sujets**, **slots**, **briefings** ni **threads IA passés** → le chat deck/copilot n'a pas accès au contexte unifié.
2. **Pas d'isolement par session** : créations custom "privées par question" (= par sujet) — schéma actuel n'a aucun champ `visibility`/`scope`. Risque que tout le monde voie les cartes draft d'un autre.
3. **Threads post-it** : `parent_artifact_id` existe mais aucun ordering, pas de UI thread, pas de propagation du `slot_id`/`subject_id` aux enfants.
4. **Performance** : `PlateauBoard` re-render via `setTick`, pas de virtualisation. Sidebar charge tous artifacts. Pas d'index DB sur `(session_id, subject_id, kind, status)`.
5. **Ergonomie DnD** : pas d'indicateur source visible, pas d'auto-scroll en bord de viewport pendant drag, pas de clavier (a11y).
6. **Pas de telemetry** : aucune trace des actions pour heatmap / timeline. `challenge_events` existe-t-elle vraiment et est-elle alimentée ?

---

## Plan v2 — Challenge enrichi de niveau pro

### A. Base de données — compléter le socle

**Migration unique** (`20260515_challenge_v2_complete.sql`) :

1. **Cartes custom isolées par sujet/session** :
   ```sql
   alter table challenge_artifacts
     add column if not exists scope text not null default 'session'
       check (scope in ('private','subject','session','workshop')),
     add column if not exists visibility_subject_id uuid,  -- si scope='subject'
     add column if not exists is_custom_card boolean not null default false,
     add column if not exists card_payload jsonb;          -- snapshot title/subtitle/action/kpi/pillar pour cartes custom (kind='card', card_id=null)
   ```
   RLS : un participant voit `scope='session'` OU (`scope='subject'` AND il consulte ce sujet) OU (`scope='private'` AND `author_id=auth.uid()`).

2. **Threads post-it (artifacts enfants)** :
   ```sql
   alter table challenge_artifacts
     add column if not exists thread_order int not null default 0,
     add column if not exists thread_root_id uuid;         -- = id du root, pour requête plate
   create index if not exists idx_artifacts_thread_root on challenge_artifacts(thread_root_id, thread_order);
   ```
   Trigger : à l'INSERT avec `parent_artifact_id`, propage `slot_id`, `subject_id`, `thread_root_id` (root le plus haut).

3. **Indexation RAG complète** — nouvelle table unifiée :
   ```sql
   create table challenge_embeddings (
     id uuid primary key default gen_random_uuid(),
     session_id uuid not null,                       -- isolation stricte par session
     workshop_id uuid not null,
     source_type text not null check (source_type in
       ('artifact','card','subject','slot','briefing','thread','synthesis')),
     source_id uuid not null,
     content text not null,
     metadata jsonb not null default '{}',
     embedding vector(1536),
     created_at timestamptz default now(),
     updated_at timestamptz default now(),
     unique(session_id, source_type, source_id)
   );
   create index on challenge_embeddings using hnsw (embedding vector_cosine_ops);
   create index on challenge_embeddings(session_id, source_type);
   ```
   RLS : `is_workshop_participant(workshop_id)`.

4. **Telemetry événementielle** (heatmap/timeline) :
   ```sql
   create table if not exists challenge_events (
     id bigserial primary key,
     session_id uuid not null,
     subject_id uuid, slot_id uuid, artifact_id uuid,
     actor_id uuid not null,
     event_type text not null,  -- 'create','move','attach','detach','vote','react','focus','suggest_apply'
     payload jsonb default '{}',
     created_at timestamptz default now()
   );
   create index on challenge_events(session_id, created_at desc);
   create index on challenge_events(session_id, slot_id, created_at desc);
   ```
   Trigger sur `challenge_artifacts` (INSERT/UPDATE position/slot_id) → log auto.

5. **Index perf manquants** :
   ```sql
   create index on challenge_artifacts(session_id, subject_id, kind) where status='active';
   create index on challenge_artifacts(session_id, slot_id) where status='active';
   create index on challenge_artifacts(parent_artifact_id);
   ```

6. **Function RAG** — `match_challenge_context(session_id, query_embedding, kinds[], limit)` (SECURITY DEFINER, scope strict à la session).

### B. RAG puissant

**Edge function `challenge-embed`** (existe déjà → à étendre) :
- À la création/MAJ d'un artifact, post-it (root + enfants concaténés), question, voice (transcription), image (alt+description IA) → upsert dans `challenge_embeddings` avec `source_type='artifact'`.
- Au démarrage d'une session : indexer **toutes les cartes du deck du toolkit** (`source_type='card'`, contenu = title + subtitle + objective + action + kpi + pillar.name + phase) **scopées à la session** pour permettre `match_challenge_context` cohérent.
- Indexer **briefing** (`scope, goals, audience, constraints`), **subjects** (title + description + hint des slots).
- Re-indexer thread post-it complet quand un enfant est ajouté (root porte le contenu agrégé).

**Nouvelle EF `challenge-rag`** (ou mode dans `challenge-agent`) :
- POST `{ session_id, query, kinds?, top_k? }` → embed query + `match_challenge_context` → renvoie chunks rangés.
- Utilisée par : CardChatDrawer, CopilotBubble, "AI Suggest dans slot vide", recherche dans CardExplorer.

### C. Identification individuelle des sessions

- `challenge_sessions` (existe) : ajouter `slug` court généré + `code_invite` (6 chars) si manquant pour partage rapide.
- Tous les artifacts/embeddings/events **portent obligatoirement `session_id`** (NOT NULL + check FK).
- RLS : toutes les tables filtrent via `is_workshop_participant(workshop_id)` + scope additionnel session si besoin.
- `useChallengeSession` expose `sessionMeta` (slug, code, participants count) — affiché dans header `EnrichedChallengeRoom`.
- Les fonctions RAG **ne mélangent jamais 2 sessions** (paramètre `session_id` obligatoire).

### D. UX/UI — interactions puissantes & ergonomiques

**Phase 1 — Artifacts riches dans slots** (inchangé v1 + ajouts) :
- Post-it papier, vocal player+scroll transcription, image redimensionnable S/M/L + lightbox.
- **Bouton "+ continuer"** ouvre Inspector mode "Thread" → crée un artifact enfant (`parent_artifact_id`, `thread_root_id` propagé). Affichage thread visuel : root puis enfants en cascade indentée avec auteur/timestamp, type marqueur (réponse, précision, contre-argument).

**Phase 2 — Slots adaptatifs** : grid dynamique 1→7+ slots, tailles fluides, header sujet+directive toujours visible.

**Phase 3 — Cartes plein écran + chat + custom** :
- `CardExplorer.tsx` (Dialog plein écran) : recherche, filtres (pilier/phase/audience), grille 320×420, multi-sélection.
- Onglet **"Créer ma carte"** : enregistre `kind='card', is_custom_card=true, scope='subject', visibility_subject_id=<sujet courant>, card_payload={...}, author_id=me`. Carte visible uniquement par auteur sur ce sujet (scope private/subject sélectionnable).
- `CardChatDrawer.tsx` : `useChat` AI SDK → POST `/challenge-agent` mode `deck_assistant` avec `session_id`. Affiche citations RAG (cartes/post-its référencés), bouton "✨ Générer une carte" qui invoque tool `generate_card` → preview → user valide → insert custom card.

**Phase 4 — PlateauBoard pro** :
- Drop d'artifacts depuis sidebar (artifact-id) → setPosition au curseur.
- Lasso sélection multi, snap-to-grid toggle, **mini-map**, **bandeau sujets collapsible** (clic = focus zoom/pan).
- Virtualisation : ne rendre que les artifacts dans le viewport ± 200px (cull simple par bounding box).
- `requestAnimationFrame` pour drag (pas setState par move), persistance debounce 400ms.

**Phase 5 — Innovations (toutes implémentées)** :
1. **Mode focus sujet** (double-clic header → fullscreen zen)
2. **Heatmap activité** (overlay slots via `challenge_events` agrégés, pulse sur hot)
3. **AI Suggest slot vide** (RAG sur briefing+slot.hint → top 3 cartes + bouton "Appliquer")
4. **Vote rapide en place** (👍/👎 hover sur chip)
5. **Timeline session** (slider bas, scrub events, replay positions)
6. **Mode présentation host** (raccourci `P`)
7. **Stickers réactions visuels** (drag emoji sur chip → artifact `kind='sticker'` enfant)
8. **Snapshot PNG sujet** (html-to-image → download)

**Performance & Ergonomie transverses** :
- DnD : custom drag preview (`setDragImage`), auto-scroll viewport edges, indicateur source ("origine: sidebar / slot X / sujet Y"), feedback drop kind-aware (déjà partiel).
- A11y clavier : focus + flèches sur slots, `Enter` ouvre, `Space` sélectionne, drag clavier (ARIA).
- Memo : `React.memo` sur `SlotArtifactChip`, `SlotCard`, `PlateauCard`. `useMemo` sur filtres sidebar.
- Realtime payload : déjà filtré par `session_id=eq.${sessionId}`.

### E. Frontend — fichiers

**Modifiés** : `SlotArtifactChip.tsx`, `DropSlot.tsx`, `SubjectCanvas.tsx`, `PlateauBoard.tsx`, `EnrichedSidebar.tsx`, `EnrichedChallengeRoom.tsx`, `GameCard.tsx`, `InspectorPanel.tsx`, `useChallengeArtifacts.ts` (filtre scope), `useChallengeSession.ts` (slug/code).

**Créés** :
- Slot variants : `SlotPostit.tsx`, `SlotVoice.tsx`, `SlotImage.tsx`, `SlotSubjectHeader.tsx`
- Cartes : `CardExplorer.tsx`, `CardChatDrawer.tsx`, `CustomCardForm.tsx`, `CardShowcase.tsx` (variant gamifié)
- Plateau : `PlateauMiniMap.tsx`, `PlateauSubjectsRail.tsx`, `LassoSelect.tsx`
- Innovations : `FocusSubjectMode.tsx`, `ActivityHeatmap.tsx`, `SuggestCardsButton.tsx`, `QuickVote.tsx`, `SessionTimeline.tsx`, `PresentationMode.tsx`, `StickerLayer.tsx`, `SubjectSnapshot.tsx`
- Thread : `PostitThread.tsx`, `ThreadComposer.tsx`
- RAG : `useChallengeRAG.ts`, `useChallengeEvents.ts`
- Image : `ImageLightbox.tsx`

### F. Backend — edge functions

- **Modifiée** `challenge-embed` : prendre en charge sources `card`, `subject`, `slot`, `briefing`, `synthesis` + ré-indexation thread.
- **Modifiée** `challenge-agent` : modes `deck_assistant` (chat cartes), `slot_suggest` (top-k cartes pour slot vide), tool `generate_card` (Output.object Zod → preview).
- **Nouvelle** `challenge-rag` : endpoint utilitaire `match_challenge_context`.
- **Nouvelle** `challenge-snapshot` (optionnel) : si snapshot serveur (sinon html-to-image client suffit).

### G. Ordre d'exécution

1. **Migration DB** (scope, threads, embeddings unifiés, events, indexes, RLS, function `match_challenge_context`).
2. **EF** `challenge-embed` étendue + `challenge-rag` + extension `challenge-agent`.
3. **Hooks** `useChallengeRAG`, `useChallengeEvents`, refactor `useChallengeArtifacts` (scope/threads).
4. **UI core** : SlotArtifactChip variants riches, DropSlot header sujet/directive, SubjectCanvas grid adaptative, PostitThread + Inspector mode thread.
5. **Cartes** : CardExplorer + CardChatDrawer + CustomCardForm + GameCard variants.
6. **PlateauBoard pro** : drop artifacts, mini-map, rail, lasso, virtualisation, snap.
7. **Innovations** : focus, heatmap, suggest, quick-vote, timeline, présentation, stickers, snapshot.
8. **Perf pass** : memo, RAF drag, debounce, telemetry actif.

### H. Validations

- 2 sessions distinctes : créer cartes custom dans l'une, vérifier invisibilité dans l'autre (RLS).
- Chat deck cite des cartes du toolkit + post-its de la session courante uniquement.
- Threads post-it : ajouter 3 enfants → propagation slot_id/subject_id automatique.
- PlateauBoard 200+ artifacts → drag fluide (>50fps mesure simple).
- Slot vide → bouton suggest renvoie 3 cartes pertinentes + apply fonctionne.

---

**Tout le travail est isolé sous `src/components/challenge/enriched/*`** ; `ChallengeBoard.tsx` legacy reste intact (mémoire `challenge-classic-untouched`).