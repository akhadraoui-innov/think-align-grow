# Challenge enrichi v3 — Plan d'achèvement (3 lots)

Tout reste sous `src/components/challenge/enriched/*` ; `ChallengeBoard.tsx` legacy intact.

---

## Lot 1 — Indispensables produit

**Objectif :** combler les trous fonctionnels critiques qui rendent le RAG aveugle, l'IA incomplète, et la session non livrable.

### 1.1 Backfill embeddings + cron cleanup
- Edge function `challenge-embed-backfill` : pour un `session_id` donné, ré-embed tous les `artifacts`, `threads`, `briefing`, `subjects`, `slots`, `cards placés`, `syntheses` qui n'ont pas encore d'enregistrement dans `challenge_embeddings`.
- Bouton admin "Réindexer la session" dans le header animateur (visible host only).
- `pg_cron` : tous les jours à 3h, supprimer les `challenge_artifact_locks` dont `expires_at < now()` (RPC déjà existante, juste pas planifiée).

### 1.2 Modes IA manquants dans `challenge-agent`
Ajout de 4 modes (mêmes patterns que `postit_action` / `voice_summary`) :
- **`synthesize_slot`** — input : `slot_id`. Charge briefing + tous artifacts (tous kinds) du slot. Output : synthèse markdown structurée (ce qui est dit, angles morts, risques, prochaine action). Persisté dans `challenge_syntheses` avec `scope:"slot"`.
- **`synthesize_subject`** — input : `subject_id`. Idem au niveau sujet, agrège slots + threads.
- **`devils_advocate`** — input : `artifact_id`. Sortie courte (3-5 puces) qui contredit/challenge l'artefact. Persisté dans `ai_meta.devils_advocate`.
- **`coach`** — input : `artifact_id` ou `subject_id`. Posture coach : 3 questions ouvertes, miroir, reformulation. Persisté dans `ai_meta.coach`.
- UI : 2 nouveaux boutons "Synthèse IA" dans le header de chaque slot et chaque sujet (panneau collapsible avec EnrichedMarkdown). 2 nouveaux chips dans `InspectorPanel` à côté de "Reformuler/Challenger/Approfondir" : `🔥 Avocat du diable`, `🧭 Coach`.

### 1.3 Wiring `challenge_interactions` (journal RAG)
- Triggers SQL automatiques :
  - `AFTER INSERT/UPDATE/DELETE ON challenge_artifacts` → log `kind:"edit"|"create"|"move"|"delete"` avec payload diff.
  - `AFTER INSERT ON challenge_reactions` → log `kind:"react"`.
  - `AFTER INSERT ON challenge_votes` → log `kind:"vote"`.
  - `AFTER INSERT ON challenge_artifact_locks` → log `kind:"lock"`.
- Étendre `challenge-embed` pour mirror les interactions importantes (edits + ai_ask) dans `challenge_embeddings` avec `source_type:"interaction"`.
- Ajout de `interaction` dans le type `RagSourceType` (hook `useChallengeRAG` + EF `challenge-rag` + filtres `SemanticSearchPanel`).

### 1.4 Export PDF de session
- Edge function `challenge-export-pdf` : assemble briefing + sujets + slots + threads + syntheses + snapshots images, génère PDF via `pdf-lib` (compatible Deno).
- Page de garde brandée GROWTHINNOV (logo, titre session, date, animateur, participants).
- Une page par sujet, slots en colonnes, artifacts rendus en tuiles compactes.
- Section finale "Synthèse IA globale" (réutilise `challenge-synthesize`).
- Bouton "Exporter PDF" dans le header animateur quand `status === "synthesis"` ou `"closed"`. Téléchargement direct côté client.

---

## Lot 2 — Différenciation concurrentielle (vs Miro/Klaxoon)

**Objectif :** ajouter les 3 features qui transforment l'outil en "serious game" différenciant.

### 2.1 Animateur HUD
- **Timer par sujet** : champ `timer_seconds` + `timer_started_at` sur `challenge_subjects`. Composant `SubjectTimer` synchronisé Realtime, pulse rouge < 30s, son discret à 0. Boutons host : Start/Pause/+30s/Reset.
- **Spotlight Realtime** : champ `spotlight_artifact_id` + `spotlight_subject_id` sur `challenge_sessions`. Quand host active "Spotlight", tous les participants voient le focus forcé (overlay zen sur l'élément, banner "L'animateur attire votre attention"). Bouton 👁 dans le header de chaque slot/artifact (host only).
- **Mode anonyme** : toggle `anonymous_mode` (boolean) sur `challenge_sessions`. Quand actif : `created_by` masqué côté UI (avatar = silhouette neutre, nom = "Participant"). Auteur reste visible pour le host uniquement.

### 2.2 Mode Boussole (positionnement 2D)
- Nouveau view-mode dans `EnrichedChallengeRoom` (3e bouton à côté de Cartes/Plateau) : **🧭 Boussole**.
- Composant `CompassBoard.tsx` : 2 axes paramétrables par le host (ex. Impact ↔ Effort, Court terme ↔ Long terme, etc.) — préset + custom.
- Drag des artifacts du sujet courant sur le plan 2D. Position stockée dans `position_x`/`position_y` (déjà existants, scopés par `compass_axes` dans `ai_meta`).
- Quadrants colorés (Quick wins / Big bets / Fill-ins / Pass) avec compteurs.
- Snapshot PNG dispo (réutilise `SubjectSnapshot`).

### 2.3 Mode Constellation (clustering sémantique)
- 4e view-mode : **✨ Constellation**.
- Composant `ConstellationBoard.tsx` : récupère les embeddings de tous les artifacts du sujet via `challenge_embeddings`, projette en 2D avec `umap-js` (déjà compatible navigateur, ~30Ko).
- Clusters auto via k-means simple (`k = √n` plafonné à 6), couleur par cluster, label IA optionnel par cluster (mode `cluster_label` dans `challenge-agent`).
- Hover artifact → preview compacte. Double-clic → focus dans Inspector.
- Léger, cache des projections par sujet.

---

## Lot 3 — Cleanup & qualité

**Objectif :** dette technique, observabilité, finitions.

### 3.1 Fusion threads IA
- Migration : déplacer toute donnée résiduelle de `challenge_ai_threads` vers `challenge_copilot_threads` (les deux ont le même rôle).
- DROP `challenge_ai_threads` (vérifier qu'aucun code/types ne s'en sert).

### 3.2 RemoteCursors + permissions stickers
- `RemoteCursors.tsx` : sur `PlateauBoard` uniquement (plus pertinent qu'en mode slots). Source = `useChallengePresence` (déjà tracke `cursor`). Throttle 100ms côté lecture, animation CSS smooth.
- Stickers : RLS update — seul `created_by` ou `host` peut delete un sticker. Mise à jour de la policy `challenge_artifacts_delete`.

### 3.3 Tests Deno + observabilité RAG
- 3 fichiers `*_test.ts` dans `supabase/functions/challenge-rag/`, `challenge-embed/`, `challenge-agent/` couvrant les cas heureux + erreurs (session inconnue, embedding indispo, mode invalide).
- Ajout d'une table `challenge_rag_metrics` (session_id, query, kinds, hit_count, top_score, latency_ms, created_at). Logguée à chaque appel `challenge-rag`. Petit panneau admin `RagMetricsPanel` (host only) dans `EnrichedChallengeRoom` (toggle ⚙).

### 3.4 Jump enrichi dans `SemanticSearchPanel`
- `onJump` étendu : `subject` → switch sujet courant + scroll. `slot` → ouvre Focus Mode sur le slot. `card` → ouvre `CardExplorer` filtré sur la carte. Aujourd'hui : artifact/thread seulement.

---

## Détails techniques

### Migrations DB nouvelles
```text
- ALTER TABLE challenge_subjects ADD COLUMN timer_seconds int, timer_started_at timestamptz
- ALTER TABLE challenge_sessions ADD COLUMN spotlight_artifact_id uuid, spotlight_subject_id uuid, anonymous_mode boolean DEFAULT false
- CREATE TABLE challenge_rag_metrics (...)
- 4 triggers AFTER INSERT/UPDATE/DELETE → challenge_interactions
- pg_cron schedule cleanup locks
- DROP TABLE challenge_ai_threads (après migration de données)
- UPDATE policy stickers (delete restreint)
```

### Edge functions nouvelles / étendues
```text
- challenge-embed-backfill (NEW)
- challenge-export-pdf (NEW)
- challenge-agent (EXTEND : +4 modes : synthesize_slot, synthesize_subject, devils_advocate, coach, cluster_label)
- challenge-embed (EXTEND : source_type "interaction")
- challenge-rag (EXTEND : kind "interaction" + log metrics)
```

### Composants frontend nouveaux
```text
Lot 1 : SyntheseSlotPanel, SyntheseSubjectPanel, DevilsAdvocateChip, CoachChip, ExportPdfButton, ReindexButton
Lot 2 : SubjectTimer, SpotlightOverlay, AnonymousToggle, CompassBoard, ConstellationBoard, ViewModeSwitcher (étendu 4 modes)
Lot 3 : RemoteCursors, RagMetricsPanel
```

### Hooks
```text
- useSubjectTimer (Realtime sync)
- useSpotlight (Realtime sync)
- useCompassPositions
- useConstellationProjection (UMAP cache)
- useRagMetrics (host only)
```

### Dépendances ajoutées
- `umap-js` (Lot 2.3)
- `pdf-lib` côté EF Deno (Lot 1.4) — déjà compatible

---

## Ordre de livraison recommandé

1. **Lot 1.1 + 1.3** (DB triggers + backfill) — débloquent tout le reste du RAG.
2. **Lot 1.2** (4 modes IA) — gros gain UX immédiat.
3. **Lot 1.4** (Export PDF) — clôt la boucle "session livrable".
4. **Lot 2.1** (Animateur HUD) — différenciation immédiate.
5. **Lot 2.2 + 2.3** (Boussole + Constellation) — wow factor.
6. **Lot 3** en continu / en finition.

Validation : après chaque lot, vérifier build + linter Supabase + test rapide preview sur la session courante (`/challenge/10e37abe-...`).