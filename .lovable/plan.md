
# Audit expert — Challenge Enriched

État livré : 12 tables RAG-ready + bucket privé + 2 edge functions (`challenge-transcribe`, `challenge-agent`) + UI (briefing, sidebar post-its/vocal/questions, inspector). Audit révèle **5 trous critiques sécurité/données**, **10 trous fonctionnels** (RAG promis mais non câblé), **9 points qualité/UX**.

---

## P0 — CRITIQUE (sécurité & data corruption, à corriger en priorité)

### S1. RLS INSERT sans `WITH CHECK` sur 4 tables sensibles
`challenge_artifacts`, `challenge_artifact_links`, `challenge_events`, `challenge_ai_threads` ont une policy INSERT dont `WITH CHECK = NULL` ⇒ **tout utilisateur authentifié peut insérer n'importe quoi dans n'importe quelle session**, contourner workshop_id, usurper author_id.
**Fix** : ajouter `WITH CHECK ((author_id = auth.uid() OR created_by = auth.uid()) AND is_workshop_participant(...) OR is_workshop_host(...))` sur chaque table.

### S2. Storage policy upload cassée
Policy `Participants upload challenge media` compare `(storage.foldername(w.name))[1]` (nom textuel du workshop) avec `(storage.foldername(name))[1]` (id de session dans le path). Comparaison toujours fausse (sauf collision improbable) ⇒ **uploads bloqués pour tous, sauf si nom du workshop = sessionId**.
**Fix** : remplacer par jointure sur `challenge_sessions.id = (storage.foldername(name))[1]::uuid` et vérifier participant via `workshop_id` de la session.

### S3. Bucket `challenge-media` sans garde-fou
Aucun `file_size_limit`, aucun `allowed_mime_types` ⇒ risque DoS / upload de binaires arbitraires.
**Fix** : `file_size_limit = 25_000_000` (25 MB), `allowed_mime_types = {audio/webm, audio/mp4, audio/mpeg, audio/wav}`.

### S4. Edge functions sans validation d'identité
`challenge-transcribe` et `challenge-agent` utilisent la service role sans vérifier que le JWT appartient à un participant de la session ⇒ tout user authentifié peut déclencher transcription/IA sur n'importe quel artifact.
**Fix** : extraire JWT, créer client `supabase.auth.getUser(token)`, charger l'artifact, vérifier via RPC `is_workshop_participant`. Refuser sinon.

### S5. Realtime manquant sur 2 tables consommées par le client
`useChallengeSession` s'abonne à `challenge_session_context` (publication absente) et le briefing devrait propager les events. Idem `challenge_events`.
**Fix** : `ALTER PUBLICATION supabase_realtime ADD TABLE challenge_session_context, challenge_events`.

---

## P1 — FONCTIONNEL (promesses non tenues du plan initial)

### F1. Embeddings jamais générés (RAG inopérant)
Colonnes `embedding vector(1536)` + index HNSW créés sur `challenge_artifacts` et `challenge_session_context`, **aucun edge function ni trigger ne les peuple**. Le « contexte RAG » de `challenge-agent` se limite aux 12 derniers artifacts (slice texte), pas de retrieval sémantique.
**Fix** : edge function `challenge-embed` (text-embedding-3-small via Lovable AI Gateway) déclenchée par trigger DB AFTER INSERT/UPDATE sur les 2 tables, ou via `pg_net` HTTP call. Modifier `challenge-agent` pour faire un `match_artifacts(query_embedding, session_id, k=8)` (RPC SQL avec `<=>`).

### F2. `challenge_events` jamais écrit (event-sourcing absent)
Pas un seul INSERT depuis le code ⇒ pas de replay, pas d'audit, pas de timeline.
**Fix** : trigger DB générique `AFTER INSERT/UPDATE/DELETE` sur `challenge_artifacts` + `challenge_session_context` + `challenge_sessions.status` qui logue en JSONB dans `challenge_events`. Optionnel : fonction `log_challenge_event(session_id, type, payload)`.

### F3. Synthèse multi-agents non livrée
Phase `synthesis` affiche un placeholder « cette étape sera assurée par challenge-synthesize ». Edge function inexistante.
**Fix** : `challenge-synthesize` qui ingère tous les artifacts + briefing → produit JSON structuré (insights, risques, plan d'action, SWOT) → INSERT dans `challenge_syntheses`.

### F4. Tables livrées mais inutilisées
`challenge_reactions`, `challenge_votes`, `challenge_artifact_links`, `challenge_syntheses`, `challenge_ai_threads`, `challenge_presence_snapshots`, `challenge_analyses` n'ont aucun consommateur frontend. Schéma sur-dimensionné par rapport à la livraison.
**Fix** : soit câbler (réactions ⏤ une barre emoji sous chaque artifact, votes ⏤ thumbs/priorité), soit assumer et marquer `// reserved for L6+` dans une note d'archi.

### F5. Pas de filtre par sujet courant
Sidebar mélange tous les artifacts de la session. `challenge_sessions.current_subject_id` existe mais n'est jamais lu côté client. UX confus en multi-sujets.
**Fix** : filtrer la sidebar par `subject_id === session.current_subject_id` (avec onglet « Tous »), passer `defaultSubjectId` aux composers depuis ce champ.

### F6. UI manquante : anonymat & tags
Colonnes `is_anonymous` et `tags[]` existent + indexées, jamais éditables côté UI.
**Fix** : toggle « Publier anonymement » dans chaque composer, input chips pour les tags dans Inspector.

### F7. Fil de discussion sur artifact absent
`parent_artifact_id` permet le threading, jamais exploité. Inspector ne montre pas les enfants.
**Fix** : section « Discussion » dans Inspector (charger artifacts where `parent_artifact_id = current.id`) + composer de réponse.

### F8. Plateau / canvas libre non livré
Plan annoncait 3 modes (Slots / Plateau / Constellation). Seul Slots existe (via `ChallengeView` legacy). `position jsonb` + `z_index` provisionnés mais inertes.
**Fix** : composant `PlateauBoard` (CSS transform pan/zoom déjà éprouvé sur Workshop Canvas) qui rend les artifacts à leur `position`, drag → UPDATE.

### F9. Switcher de format de carte
`challenge_artifacts.format` provisionné, jamais modifié. Pas de variante visuelle.
**Fix** : composant `CardFormatSwitcher` (mini/normal/expanded/plateau/photo/citation) dans Inspector + rendu adaptatif dans `PostitCard`.

### F10. Bug `upsertContext`
`useChallengeSession.upsertContext` fait `{...context, ...patch}` sans purger `embedding` (vector) ni `embedding_input` ⇒ si jamais peuplés, le upsert peut échouer (cast vector via REST). Aussi : `attachments` jamais consommé/affiché.
**Fix** : whitelist explicite des champs envoyés (`scope, goals, hypotheses, constraints, stakeholders, context_data, attachments`).

---

## P2 — Qualité / UX / Robustesse

- **Q1.** `challenge-transcribe` : pas de retry, pas d'abort, charge l'audio entier en base64 (limite ~20 MB Gemini). Ajouter taille max côté client + fallback `openai/gpt-4o-mini-transcribe`.
- **Q2.** Pas de timeout/abort sur les invocations IA (UI peut rester en `pending_ai` indéfiniment). Worker watchdog ou TTL via trigger.
- **Q3.** Pas de pagination sur `useChallengeArtifacts.load` ⇒ pour une session longue, full scan.
- **Q4.** Pas de log `audit_logs_immutable` sur changement `session.status` / suppression d'artifact / suppression de mémo vocal.
- **Q5.** `config.toml` ne déclare pas de bloc pour `challenge-transcribe` / `challenge-agent` ⇒ `verify_jwt` au défaut Cloud (false). Cumulé avec S4, exposition large.
- **Q6.** Inspector édit `content` mais ne ré-évalue pas `embedding` (cohérent avec F1, à traiter ensemble).
- **Q7.** Briefing : pas d'upload de pièces jointes (colonne `attachments` mort).
- **Q8.** Voice recorder : aucune protection en cas de perte de connexion pendant l'enregistrement (blob jeté au refresh).
- **Q9.** Sidebar : compteurs incluent les artifacts `resolved` ; pas de toggle « inclure résolus ».

---

## Plan de remédiation — 4 lots

```text
LOT A — Sécurité (P0) ............................. 1 migration + 2 edge fn
  S1 RLS WITH CHECK strict (4 tables)
  S2 Storage upload policy : path = sessionId/userId/file
  S3 Bucket limits + mime allowlist
  S4 JWT validation + is_workshop_participant dans transcribe & agent
  S5 ALTER PUBLICATION (context + events)

LOT B — RAG opérant (F1, F2) ..................... 1 migration + 1 edge fn
  challenge-embed (text-embedding-3-small)
  trigger AFTER INSERT/UPDATE → pg_net.http_post → embed
  RPC match_artifacts(query_embedding, session_id, k)
  challenge-agent : retrieval sémantique + 12 derniers (hybride)
  trigger log_challenge_event sur artifacts + sessions

LOT C — Boucle session complète (F3, F5, F6, F7, F10, Q4)
  challenge-synthesize edge fn → INSERT challenge_syntheses
  Sidebar filtre par current_subject_id (+ tab Tous)
  Composers : toggle anonyme + tags
  Inspector : threading parent_artifact_id + chips tags
  upsertContext : whitelist champs
  Briefing : upload attachments → bucket + jsonb
  Audit logs : status changes + suppressions

LOT D — Plateau & enrichissements (F4, F8, F9, Q1-3, Q8-9)
  PlateauBoard (drag, zoom, position persist)
  CardFormatSwitcher + variantes visuelles
  Réactions emoji + Votes thumbs (challenge_reactions, challenge_votes)
  Pagination artifacts + résolus toggle
  Voice : taille max, fallback transcripteur, persistance localStorage
  IA : timeout + watchdog
```

---

## Détails techniques (référence)

**Migration S1 (extrait)**
```sql
DROP POLICY "Participants insert artifacts" ON challenge_artifacts;
CREATE POLICY "Participants insert artifacts" ON challenge_artifacts FOR INSERT
TO authenticated
WITH CHECK (
  author_id = auth.uid()
  AND (is_workshop_participant(workshop_id, auth.uid())
    OR is_workshop_host(workshop_id, auth.uid()))
  AND EXISTS (SELECT 1 FROM challenge_sessions s
              WHERE s.id = session_id AND s.workshop_id = challenge_artifacts.workshop_id)
);
-- idem pour challenge_events / challenge_artifact_links / challenge_ai_threads
```

**Migration S2**
```sql
DROP POLICY "Participants upload challenge media" ON storage.objects;
CREATE POLICY "Participants upload challenge media" ON storage.objects FOR INSERT
TO authenticated WITH CHECK (
  bucket_id = 'challenge-media'
  AND (storage.foldername(name))[2] = auth.uid()::text
  AND EXISTS (
    SELECT 1 FROM challenge_sessions s
    WHERE s.id::text = (storage.foldername(name))[1]
      AND (is_workshop_participant(s.workshop_id, auth.uid())
        OR is_workshop_host(s.workshop_id, auth.uid()))
  )
);
```

**Validation JWT (S4) — pattern à intégrer dans les 2 edge fn**
```ts
const userClient = createClient(SUPABASE_URL, ANON_KEY, { global: { headers: { Authorization: req.headers.get("Authorization")! } } });
const { data: { user } } = await userClient.auth.getUser();
if (!user) return new Response("unauthorized", { status: 401, headers: corsHeaders });
const { data: ok } = await admin.rpc("is_workshop_participant", { _workshop_id: artifact.workshop_id, _user_id: user.id });
if (!ok) return new Response("forbidden", { status: 403, headers: corsHeaders });
```

**RPC `match_artifacts` (F1)**
```sql
CREATE FUNCTION match_artifacts(query vector(1536), _session uuid, k int DEFAULT 8)
RETURNS TABLE(id uuid, content text, kind challenge_artifact_kind, similarity float)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT id, content, kind, 1 - (embedding <=> query) AS similarity
  FROM challenge_artifacts
  WHERE session_id = _session AND embedding IS NOT NULL AND status = 'active'
  ORDER BY embedding <=> query LIMIT k;
$$;
```

---

## Hors scope de cet audit

- L'expérience **classique** (`ChallengeView`, `ChallengeBoard`) reste intacte (memory `challenge-classic-untouched`).
- Performance pgvector au-delà de ~50k artifacts/session (pas le profil cible).
- Migration des sessions en cours (aucune donnée existante : `count(challenge_artifacts) = 0`).
