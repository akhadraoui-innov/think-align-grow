## Vision

Construire **Challenge Enriched** : une expérience d'atelier stratégique qui combine
- la **toile collaborative libre** de Miro/Mural,
- la **gamification temps-réel** de Kahoot/Klaxoon,
- une **couche de contexte structurée** indexable pour RAG/IA spécialisées.

Chaque session est une **arène de pensée** : tout artefact (carte, post-it, vocal, question, vote, réaction, lien sémantique) est typé, daté, attribué, vectorisable et exportable.

Le mode classique actuel reste intact — `experience_mode = 'classic' | 'enriched'` route vers deux composants frères.

---

## 1. Modèle de données (rigueur RAG-first)

### Principes d'architecture

1. **Une seule table polymorphe `challenge_artifacts`** pour tout ce qui est posable sur le board (carte, post-it, vocal, question, sticker, lien). Évite N tables jumelles, simplifie RLS/Realtime, prêt pour embeddings.
2. **Séparation contexte vs contenu** : `challenge_session_context` capture l'environnement (objectif, hypothèses, contraintes, parties prenantes) ; les artefacts capturent la production.
3. **Audit complet** via `challenge_events` (event-sourcing léger) — rejouable, sert à l'IA pour comprendre l'évolution de la pensée.
4. **Embeddings dès le départ** (`pgvector`) sur artefacts + contexte + transcriptions, indexés HNSW. Prêts pour RAG.
5. **Liens sémantiques explicites** (`challenge_artifact_links`) : "cause", "renforce", "contredit", "dépend de" — base pour graph IA.

### Migrations

```sql
-- 0. Extensions
CREATE EXTENSION IF NOT EXISTS vector;

-- 1. Toggle mode + config sur le template
ALTER TABLE challenge_templates
  ADD COLUMN experience_mode text NOT NULL DEFAULT 'classic'
    CHECK (experience_mode IN ('classic','enriched')),
  ADD COLUMN enriched_config jsonb NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN context_schema jsonb NOT NULL DEFAULT '{}'::jsonb;
-- enriched_config: {postits, voice, questions, reactions, votes:{points}, timer,
--                   formats:[...], ai_assist:{rag,suggest,synthesize}, anonymous_mode}
-- context_schema:  champs custom à remplir au lancement (questions ouvertes, JSONSchema léger)

-- 2. Session enrichie (1:1 avec workshop_id)
CREATE TABLE challenge_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workshop_id uuid NOT NULL UNIQUE REFERENCES workshops(id) ON DELETE CASCADE,
  template_id uuid NOT NULL REFERENCES challenge_templates(id) ON DELETE CASCADE,
  organization_id uuid REFERENCES organizations(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft','briefing','running','synthesis','closed','archived')),
  current_subject_id uuid REFERENCES challenge_subjects(id) ON DELETE SET NULL,
  config jsonb NOT NULL DEFAULT '{}'::jsonb,            -- override de enriched_config
  facilitator_notes text,
  started_at timestamptz, ended_at timestamptz,
  created_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 3. Contexte riche du brief (rempli avant ou pendant le briefing)
CREATE TABLE challenge_session_context (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES challenge_sessions(id) ON DELETE CASCADE,
  scope text,                       -- ex: "Lancement produit X EMEA"
  goals text,                       -- objectifs SMART
  hypotheses text,                  -- hypothèses de départ
  constraints text,                 -- budget, délai, techno
  stakeholders jsonb,               -- [{role, name, weight}]
  context_data jsonb DEFAULT '{}',  -- réponses au context_schema
  attachments jsonb DEFAULT '[]',   -- [{kind,url,name}]
  embedding vector(1536),           -- résumé vectorisé
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(session_id)
);

-- 4. Artefacts polymorphes (cœur du modèle)
CREATE TYPE challenge_artifact_kind AS ENUM
  ('card','postit','voice','question','sticker','link_note','vote_summary');

CREATE TABLE challenge_artifacts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES challenge_sessions(id) ON DELETE CASCADE,
  workshop_id uuid NOT NULL,        -- denormalisé pour RLS rapide
  subject_id uuid REFERENCES challenge_subjects(id) ON DELETE SET NULL,
  slot_id uuid REFERENCES challenge_slots(id) ON DELETE SET NULL,
  card_id uuid REFERENCES cards(id) ON DELETE SET NULL,   -- si kind='card'
  parent_artifact_id uuid REFERENCES challenge_artifacts(id) ON DELETE CASCADE,
  kind challenge_artifact_kind NOT NULL,
  author_id uuid NOT NULL,
  is_anonymous boolean NOT NULL DEFAULT false,
  -- Contenu typé
  content text,                     -- texte (postit, question, link_note)
  content_rich jsonb,               -- {markdown, blocks, mentions, attachments}
  transcription text,               -- vocal → texte
  audio_url text, audio_duration_ms int,
  -- Sémantique
  emoji text,                       -- 💡 🚨 ⚠️ ✅ 🎯 ❓ 🔥 📌 🧭 ⏱️
  criticality text CHECK (criticality IN ('low','medium','high','critical')),
  category text,                    -- libre, indexé
  tags text[] DEFAULT '{}',
  ai_meta jsonb DEFAULT '{}',       -- {sentiment, themes:[], summary, language}
  -- Présentation
  format text DEFAULT 'normal',     -- mini/normal/detailed/plateau/photo/quote
  position jsonb,                   -- {x,y,z,w,h,rotation} pour board libre
  z_index int NOT NULL DEFAULT 0,
  color text,                       -- override visuel
  -- Vectorisation
  embedding vector(1536),
  embedding_input text,             -- texte source de l'embedding (audit)
  -- Cycle de vie
  status text NOT NULL DEFAULT 'active'
    CHECK (status IN ('draft','active','resolved','archived')),
  resolved_by uuid, resolved_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_artifacts_session ON challenge_artifacts(session_id);
CREATE INDEX idx_artifacts_subject ON challenge_artifacts(subject_id);
CREATE INDEX idx_artifacts_kind ON challenge_artifacts(kind);
CREATE INDEX idx_artifacts_tags ON challenge_artifacts USING GIN(tags);
CREATE INDEX idx_artifacts_embedding ON challenge_artifacts
  USING hnsw (embedding vector_cosine_ops);

-- 5. Liens sémantiques (graph)
CREATE TYPE challenge_link_kind AS ENUM
  ('supports','contradicts','depends_on','derived_from','answers','references');
CREATE TABLE challenge_artifact_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL,
  from_id uuid NOT NULL REFERENCES challenge_artifacts(id) ON DELETE CASCADE,
  to_id uuid NOT NULL REFERENCES challenge_artifacts(id) ON DELETE CASCADE,
  kind challenge_link_kind NOT NULL,
  weight numeric DEFAULT 1.0,
  rationale text,
  created_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(from_id, to_id, kind)
);

-- 6. Réactions (granulaire, agrégeables)
CREATE TABLE challenge_reactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  artifact_id uuid NOT NULL REFERENCES challenge_artifacts(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  emoji text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(artifact_id, user_id, emoji)
);

-- 7. Votes pondérés (priorisation)
CREATE TABLE challenge_votes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES challenge_sessions(id) ON DELETE CASCADE,
  artifact_id uuid NOT NULL REFERENCES challenge_artifacts(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  weight int NOT NULL DEFAULT 1 CHECK (weight BETWEEN 1 AND 10),
  vote_round text NOT NULL DEFAULT 'default',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(session_id, artifact_id, user_id, vote_round)
);

-- 8. Q&A IA (cartes-questions ↔ réponses agent)
CREATE TABLE challenge_ai_threads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES challenge_sessions(id) ON DELETE CASCADE,
  artifact_id uuid REFERENCES challenge_artifacts(id) ON DELETE CASCADE,
  agent text NOT NULL,              -- 'qa','synthesizer','devil_advocate','coach','expert:<domain>'
  user_id uuid,
  prompt text NOT NULL,
  response text,
  rag_context jsonb,                -- {chunks:[{artifact_id,score}], sources}
  tokens_in int, tokens_out int, model text,
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending','streaming','done','error')),
  error text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 9. Présence + curseurs temps réel (éphémère via Realtime presence; persistance light)
CREATE TABLE challenge_presence_snapshots (
  session_id uuid PRIMARY KEY REFERENCES challenge_sessions(id) ON DELETE CASCADE,
  snapshot jsonb NOT NULL,          -- {users:[{id,name,cursor,subject_id,last_seen}]}
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 10. Event-sourcing (audit + IA narrative)
CREATE TYPE challenge_event_kind AS ENUM
  ('session.start','session.phase','session.end',
   'artifact.created','artifact.updated','artifact.moved','artifact.resolved','artifact.deleted',
   'link.created','link.deleted',
   'reaction.added','reaction.removed',
   'vote.cast','vote.round.opened','vote.round.closed',
   'ai.requested','ai.responded',
   'timer.started','timer.stopped',
   'focus.changed');
CREATE TABLE challenge_events (
  id bigserial PRIMARY KEY,
  session_id uuid NOT NULL REFERENCES challenge_sessions(id) ON DELETE CASCADE,
  actor_id uuid,
  kind challenge_event_kind NOT NULL,
  target_id uuid,
  payload jsonb NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_events_session_time ON challenge_events(session_id, created_at DESC);

-- 11. Synthèses IA (multi-agents, versionnées)
CREATE TABLE challenge_syntheses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES challenge_sessions(id) ON DELETE CASCADE,
  agent text NOT NULL,              -- 'maturity','swot','risks','actions','narrative'
  version int NOT NULL DEFAULT 1,
  content jsonb NOT NULL,
  scores jsonb,                     -- {maturity:0-100, alignment, novelty, ...}
  rag_sources jsonb,
  embedding vector(1536),
  generated_at timestamptz NOT NULL DEFAULT now(),
  generated_by uuid,
  UNIQUE(session_id, agent, version)
);

-- 12. Storage bucket (privé, scoped par workshop)
INSERT INTO storage.buckets (id, name, public)
  VALUES ('challenge-media','challenge-media', false)
  ON CONFLICT DO NOTHING;
```

### RLS (toutes tables)
- `is_workshop_participant(workshop_id, auth.uid())` pour SELECT/INSERT.
- UPDATE/DELETE limité à `author_id = auth.uid()` OR `is_workshop_host(workshop_id, auth.uid())`.
- `challenge_events` : INSERT par participants, SELECT par participants, **aucun UPDATE/DELETE** (append-only).
- `challenge_syntheses` : INSERT/UPDATE par host ou via service role (edge functions).

### Realtime
`ALTER PUBLICATION supabase_realtime ADD TABLE` :
challenge_sessions, challenge_artifacts, challenge_artifact_links, challenge_reactions, challenge_votes, challenge_ai_threads, challenge_presence_snapshots, challenge_syntheses.

### RPCs critiques (transactions atomiques)
- `cast_vote(session_id, artifact_id, weight, round)` — vérifie quota points/user.
- `resolve_artifact(artifact_id)` + log event.
- `move_artifact(artifact_id, slot_id|position, z_index)` + log event.
- `open_vote_round / close_vote_round(session_id, round)` — calcule classement et insère `vote_summary` artifact.

---

## 2. Pipeline IA / RAG-ready

### Edge functions (5 nouvelles + extension)

| Function | Rôle |
|---|---|
| `challenge-transcribe` | Reçoit audio (chunks ou fichier), Lovable AI Gateway (`google/gemini-2.5-flash` audio in), retourne transcription + résumé + langue + sentiment, met à jour artifact. |
| `challenge-embed` | Trigger après INSERT/UPDATE d'artifact ou contexte : génère embedding via `text-embedding-3-small` (ou Gemini equivalent côté gateway), persiste. Batché toutes les 5s par session. |
| `challenge-rag` | Endpoint utilitaire : `query` → recherche vectorielle scoped session (`embedding <=> $query`), renvoie top-k chunks (artifacts + contexte + syntheses). Réutilisé par tous les agents. |
| `challenge-agent` | Routeur d'agents (`qa`, `devil_advocate`, `synthesizer`, `coach`, `expert`). Stream SSE. Prompt système par agent + RAG context + event timeline. Persiste dans `challenge_ai_threads`. |
| `challenge-synthesize` | (refonte de `analyze-challenge`) Multi-agent : génère `maturity`, `swot`, `risks`, `actions`, `narrative` en parallèle, stocke dans `challenge_syntheses`. |
| `analyze-challenge` (existant) | Conservé pour mode classic. |

### Garanties
- **Idempotence embeddings** : hash `embedding_input` ; skip si inchangé.
- **Quotas** : `check_rate_limit(user, 'challenge_ai_<agent>', 30, 60)`.
- **Coût visible** : tokens stockés sur `challenge_ai_threads`.
- **Sources traçables** : chaque réponse IA cite `rag_sources` (artifact_id + score).

---

## 3. UX — au-delà de Miro/Mural/Kahoot/Klaxoon

### Surfaces principales
1. **Briefing** (avant la session) : remplit `challenge_session_context` (formulaire dynamique sur `context_schema`). L'IA `coach` propose objectifs/hypothèses pré-remplies.
2. **Board hybride** : 3 modes commutables sans rechargement
   - **Slots** (vue actuelle structurée) — pour cadrer.
   - **Plateau libre** (canvas infini, pan/zoom, snap-to-grid) — pour explorer.
   - **Constellation** (auto-layout par embeddings clustering t-SNE côté client via `umap-js`) — pour découvrir des patterns.
3. **Inspector panel** droit unifié : onglets *Détails / Liens / Réactions+Votes / IA / Historique* pour chaque artefact.
4. **Animator HUD** (sticky bottom) : phase, timer, focus participant, mode "spotlight" (projection plein écran d'un artefact à tous), kill-switch IA, ouverture/fermeture des rounds de vote.
5. **Participant rail** gauche : présence temps réel (avatars + curseurs colorés sur le board), main levée, signal "j'ai une question".

### Innovations différenciantes
- **Mode anonyme par round** (révélation à la fin) — réduit le biais de hiérarchie (mieux que Klaxoon).
- **Heatmap sémantique** : surimpression du board montrant densité d'idées par thème (clustering embeddings).
- **Devil's Advocate IA** déclenchable par l'animateur sur un cluster — challenge automatique.
- **Replay narratif** : l'IA `narrative` rejoue les events en récit éditorial (timeline scroll).
- **Mode "Boussole"** : 4 axes paramétrables (impact/effort, court/long terme…), drag des artifacts pour positionner, persistance dans `position`.
- **Capsules vocales** transcrites + résumées + transformables en post-it d'un clic.
- **Cartes-questions dirigées** : choix destinataire (animateur, groupe, IA, expert externe email). Réponse IA = artifact `question` enfant lié (`answers`).
- **Export riche** : PDF "dossier de session" (contexte + board snapshot SVG + synthèses + verbatim transcrits + graph des liens) — généré en edge.

### Design system
- Tokens existants (orange/noir GROWTHINNOV ; portal bleu).
- Nouveaux tokens criticité : `--criticality-low/medium/high/critical` (HSL).
- Animations Motion : `layoutId` pour transitions entre modes board.
- Mobile : Inspector devient bottom-sheet ; Animator HUD se replie.
- Accessibilité : focus ring, ARIA live region pour annonces IA, raccourcis clavier (`?` pour cheatsheet).

---

## 4. Architecture frontend

```
src/components/challenge/enriched/
  EnrichedChallengeRoom.tsx          // routeur (slots|plateau|constellation)
  briefing/
    BriefingForm.tsx                 // remplit context, JSONSchema-driven
    ContextSummary.tsx
  board/
    SlotsBoard.tsx                   // wrap actuel, lecture seule de l'API enriched
    PlateauBoard.tsx                 // canvas infini (Konva ou DOM transforms)
    ConstellationBoard.tsx           // umap-js clustering
    ArtifactNode.tsx                 // render polymorphe selon kind
    ArtifactGhost.tsx                // drag preview
  panels/
    InspectorPanel.tsx               // Sheet/Drawer
    AIThreadPanel.tsx
    LinksGraphPanel.tsx              // mini-graph (vis-network ou react-force-graph)
  artifacts/
    PostitEditor.tsx
    VoiceRecorder.tsx (MediaRecorder)
    VoicePlayer.tsx (waveform via wavesurfer)
    QuestionCard.tsx
    CardFormatSwitcher.tsx
    StickerPicker.tsx
  collab/
    PresenceLayer.tsx                // curseurs Realtime presence
    ReactionsBar.tsx
    VotePanel.tsx
  facilitator/
    AnimatorHUD.tsx
    PhaseStepper.tsx
    Timer.tsx
    SpotlightOverlay.tsx
    ModeOverrideMenu.tsx             // override config session
  ai/
    DevilAdvocateButton.tsx
    SynthesisDashboard.tsx           // affiche challenge_syntheses
    NarrativeReplay.tsx
src/hooks/
  useChallengeSession.ts             // CRUD session + realtime
  useChallengeArtifacts.ts           // CRUD + optimistic + realtime
  useChallengeLinks.ts
  useChallengePresence.ts
  useChallengeReactions.ts
  useChallengeVotes.ts
  useChallengeAI.ts                  // streaming SSE
  useVoiceRecorder.ts
  useArtifactEmbeddings.ts           // déclenchement debounced
src/lib/challenge/
  artifactSchema.ts                  // zod
  positionMath.ts
  clustering.ts                      // umap wrapper
```

`ChallengeView.tsx` :
```ts
return template.experience_mode === 'enriched'
  ? <EnrichedChallengeRoom ... />
  : <ChallengeBoard ... />;  // existant intact
```

---

## 5. Sécurité & gouvernance
- RLS scoped workshop (jamais cross-org).
- Quotas IA par user/session via `check_rate_limit`.
- Audit `challenge_events` append-only (RLS no UPDATE/DELETE) + miroir vers `audit_logs_immutable` pour actions sensibles (suppression artifact, fermeture session).
- Storage bucket `challenge-media` privé, signed URLs 1h, path `{workshop_id}/{user_id}/{uuid}.webm`.
- Embeddings : pas de PII brute envoyée au gateway → masquage emails/téléphones côté `challenge-embed`.

---

## 6. Performance & Realtime
- **Optimistic UI** sur création/move artifact, rollback sur erreur.
- **Debounce** position drag (50ms) + flush sur `pointerup`.
- **Realtime presence** pour curseurs (pas de DB), snapshot DB seulement à l'idle (1/min).
- **Batch embeddings** côté EF (queue Postgres `pg_net` ou simple `pg_cron` toutes les 30s).
- **Pagination artifacts** par subject ; lazy-load des artefacts archivés.

---

## 7. Plan de livraison (phasé)

| Lot | Contenu | Bloquant pour |
|---|---|---|
| **L0** | Migrations 1→12 + RLS + Realtime + bucket | Tout |
| **L1** | `EnrichedChallengeRoom` squelette + routing + `BriefingForm` + `challenge_session_context` | UX shell |
| **L2** | Artefacts polymorphes : SlotsBoard enrichi, PostitEditor, InspectorPanel | Core collab |
| **L3** | PlateauBoard (canvas infini) + position/drag + PresenceLayer | Mode libre |
| **L4** | VoiceRecorder + `challenge-transcribe` EF | Vocal |
| **L5** | QuestionCard + `challenge-agent` (qa) streaming | IA Q&A |
| **L6** | Embeddings (`challenge-embed`) + `challenge-rag` + ConstellationBoard | RAG visible |
| **L7** | Reactions + Votes + AnimatorHUD (timer, spotlight, rounds) | Animation |
| **L8** | Liens sémantiques + LinksGraphPanel | Graph |
| **L9** | Multi-agent `challenge-synthesize` + SynthesisDashboard + NarrativeReplay | Restitution |
| **L10** | Export PDF dossier session | Livrable |
| **L11** | QA visuelle multi-viewport, multi-utilisateur, charge (50 artefacts) | Release |

---

## 8. Hors scope (V2)
- CRDT collaboratif sur même artefact (verrou `updated_at` optimiste suffit V1).
- Connecteurs externes (Notion, Slack).
- Voix temps réel multi-pistes (room audio).
- Marketplace d'agents experts custom par org.

---

## 9. Mémoires à créer
- `mem://features/challenge-enriched-architecture` — modèle artefacts polymorphes + RAG-ready.
- `mem://features/challenge-enriched-ux` — board 3-modes, animator HUD, anonymat.
- `mem://constraints/challenge-classic-untouched` — ne jamais modifier `ChallengeBoard.tsx` legacy.

---

**Validation requise** : ce plan ajoute 12 tables + 5 EFs + ~25 composants. C'est volumineux mais chaque lot est livrable et testable indépendamment. Confirme pour démarrer L0 (migrations).