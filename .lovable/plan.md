# Audit de cohérence (post-Lot 1.1 → 1.3)

État vérifié en base et dans le code :

| Élément | Statut |
|---|---|
| Tables `challenge_rag_metrics`, `challenge_interactions`, `challenge_syntheses` (scope/scope_id) | OK |
| Colonnes HUD `challenge_subjects.timer_*` + `challenge_sessions.spotlight_*` / `anonymous_mode` | OK |
| 6 triggers `trg_log_*_interaction` (artifacts ins/upd/del, votes, réactions, locks) | OK |
| Edge `challenge-embed-backfill` | déployée |
| Edge `challenge-agent` modes `synthesize_slot`, `synthesize_subject`, `devils_advocate`, `coach` | OK |
| UI : `ReindexButton`, `ScopedSynthesisPanel`, chips Inspector | OK |
| RAG : type `interaction` ajouté hook + panel | OK |

Trous restants vs plan v3 : **Lot 1.4 (Export PDF)**, **Lot 2 entier (HUD + Boussole + Constellation)**, **Lot 3 entier**. C'est ce qui suit.

---

# Lot 1.4 — Export PDF de session

- Edge `challenge-export-pdf` (Deno, `pdf-lib` via `npm:pdf-lib`). Input : `session_id`. 
  - Charge briefing, sujets, slots, artifacts (incl. cards placées), threads, syntheses (`scope` global + par sujet).
  - Page de garde brandée GROWTHINNOV (logo, titre, date, animateur, participants).
  - 1 page par sujet : titre + slots en colonnes + artifacts en tuiles compactes.
  - Section finale "Synthèse IA globale" (récupère la dernière `challenge_syntheses` `scope='global'`, sinon appelle `challenge-synthesize`).
  - Retour : `application/pdf` binaire + header `Content-Disposition`.
- UI : `ExportPdfButton.tsx` dans header de `EnrichedChallengeRoom` (host only, visible si `status in ['synthesis','closed','archived']`). Téléchargement via `URL.createObjectURL`.

# Lot 2.1 — Animateur HUD

- Hook `useSubjectTimer(subjectId)` : lit `timer_duration_seconds` + `timer_started_at` + `timer_paused_at`, abonnement Realtime sur `challenge_subjects`. Actions host : `start(seconds)`, `pause`, `resume`, `add(seconds)`, `reset`.
- Composant `SubjectTimer.tsx` : compteur mm:ss, anneau de progression, pulse rouge < 30 s, beep WebAudio à 0. Placé en haut de `ChallengeView` quand un sujet courant est sélectionné.
- Hook `useSpotlight(sessionId)` + composant `SpotlightOverlay.tsx` : si `spotlight_artifact_id`/`spotlight_subject_id` non null pour non-host → overlay zen + bannière "L'animateur attire votre attention". Boutons 👁 dans header de slot et carte artifact (host only) qui togglent.
- Composant `AnonymousToggle.tsx` (host only, header room) : flip `anonymous_mode`. Côté UI, `PresenceBar`, signatures d'artifact et avatars sidebar masquent `created_by` pour non-host quand actif (silhouette + "Participant").

# Lot 2.2 — Mode Boussole

- 3e bouton view-mode `🧭 Boussole` dans `EnrichedChallengeRoom`.
- `CompassBoard.tsx` : 2 axes (préset Impact/Effort, Court/Long terme, custom). Drag des artifacts du sujet courant sur plan 2D normalisé [0..1]. Persisté dans `position_x`/`position_y` + `ai_meta.compass_axes` (libellés). Quadrants colorés Quick wins / Big bets / Fill-ins / Pass avec compteurs. Snapshot PNG (réutilise pattern `SubjectSnapshot`).
- Hook `useCompassPositions(subjectId)`.

# Lot 2.3 — Mode Constellation

- 4e bouton view-mode `✨ Constellation`.
- Dépendance `umap-js`.
- Hook `useConstellationProjection(subjectId)` : charge embeddings depuis `challenge_embeddings` filtrés artifacts du sujet, projette en 2D (cache mémoire par subject_id), k-means simple `k = min(6, ⌈√n⌉)` couleur par cluster.
- `ConstellationBoard.tsx` : SVG zoomable, hover → preview compacte, double-clic → ouvre Inspector. Bouton "Labeller les clusters" → nouveau mode `cluster_label` dans `challenge-agent` (input : array d'items, output : 1 label court par cluster). Stocké éphémère côté client.

# Lot 3 — Cleanup & qualité

- **3.1** Migration : déplacer données résiduelles `challenge_ai_threads` → `challenge_copilot_threads` (mapping colonnes), DROP la première après vérif que types.ts/code n'y réfèrent plus.
- **3.2** `RemoteCursors.tsx` sur `PlateauBoard` uniquement, source `useChallengePresence` (`cursor`). Throttle 100 ms, animation CSS smooth. Policy `challenge_artifacts_delete` mise à jour : seul `created_by` ou host peut supprimer un sticker (`kind = 'sticker'`).
- **3.3** 3 fichiers `*_test.ts` : `challenge-rag`, `challenge-embed`, `challenge-agent` (cas heureux + session inconnue + mode invalide). Logging metrics : à chaque appel `challenge-rag`, insertion dans `challenge_rag_metrics` (query, kinds, hit_count, top_score, latency_ms). Composant `RagMetricsPanel.tsx` (host only, panneau dépliable ⚙ dans header) avec `useRagMetrics`.
- **3.4** `SemanticSearchPanel.onJump` étendu : `subject` → setCurrentSubject + scroll, `slot` → ouvre `FocusSubjectMode` sur le slot, `card` → ouvre `CardExplorer` filtré.

---

## Détails techniques

### Migration DB
```text
- ALTER TABLE challenge_artifacts : pas de changement (utilise ai_meta.compass_axes existant)
- UPDATE policy challenge_artifacts_delete (sticker → owner+host only)
- DROP TABLE challenge_ai_threads (après migration)
```

### Edge functions
```text
- challenge-export-pdf (NEW)
- challenge-agent (EXTEND : mode cluster_label)
- challenge-rag (EXTEND : insert challenge_rag_metrics à la fin)
- 3 fichiers *_test.ts
```

### Composants frontend
```text
ExportPdfButton, SubjectTimer, SpotlightOverlay, AnonymousToggle,
CompassBoard, ConstellationBoard, ViewModeSwitcher (étendu 4 modes),
RemoteCursors, RagMetricsPanel
```

### Hooks
```text
useSubjectTimer, useSpotlight, useCompassPositions,
useConstellationProjection, useRagMetrics
```

### Dépendances
- `umap-js` (front)
- `pdf-lib` via `npm:` (Deno)

---

## Ordre de livraison

1. Lot 1.4 (Export PDF) — clôt la boucle livrable.
2. Lot 2.1 (HUD) — gros différenciant immédiat.
3. Lot 2.2 + 2.3 (Boussole + Constellation) — wow factor.
4. Lot 3.3 (metrics + tests) puis 3.1 / 3.2 / 3.4 en finition.

Validation après chaque sous-lot : build + linter Supabase + check preview sur `/challenge/10e37abe-...`, puis nouvel audit DB/code/types comme demandé.
