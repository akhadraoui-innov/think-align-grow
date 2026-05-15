## Vision consolidée

Une salle Challenge enrichie **collaborative pro** : plusieurs personnes en même temps, présence visible, verrouillage doux, persistance exhaustive RAG-ready. Cinq formats de contribution de première classe — **carte, post-it, vocal, question, image** — mixables dans les slots de réponse ET sur le plateau libre infini. Couche IA contextuelle à 4 niveaux (post-it, vocal, slot/sujet, co-pilote flottant).

Décisions tranchées :
- Vocal **inchangé** (l'expérience actuelle est conservée telle quelle, juste accessible depuis plus d'endroits).
- Slot mixte ET plateau libre mixte : on fait **les deux**.
- Création slot : **mini-toolbar inline + drag depuis sidebar**.
- Co-présence : **Realtime Presence** (pas de Yjs, pas de WebRTC).
- Locks : **soft lock 90 s avec heartbeat** (pas de CRDT).
- Sidebar conservée + refonte UI best-in-class.

---

## 1. Cinq citoyens de première classe : carte · post-it · vocal · question · **image**

### Nouveau kind `image`
- Bibliothèque interne : `EnrichedImageLibrary` (sheet/dialog) avec 3 onglets :
  1. **Upload** : drag-drop ou picker → bucket Storage `challenge-images` (public), insert dans `challenge_artifacts {kind:"image", content:url, ai_meta:{alt}}`.
  2. **Stickers/Emojis grand format** : palette curatée (200+ pictos serious-game) servie depuis `public/stickers/*.svg`.
  3. **Génération IA** : prompt → `imagegen` via edge function `challenge-image` (gateway Lovable AI, modèle `google/gemini-3.1-flash-image-preview`), upload auto au bucket, alt-text auto.
- Vignette : aperçu image + caption éditable + emoji + criticité optionnelle.
- Mêmes mécaniques que les autres : drag, drop dans slot OU plateau, sélection inspector, réactions, votes, threads, IA "Décrire/Reformuler/Critiquer cette image".

### Vocal — **conservé tel quel**
Composant `VoiceRecorder` + `VoicePlayer` + transcription par `challenge-transcribe` inchangés. On ajoute juste le bouton `+ Vocal` dans la mini-toolbar des slots et la toolbar du plateau.

### Slots mixtes (vue Cartes)
`EnrichedSubjectCanvas` remplace `ChallengeView` pendant la session enrichie :
- Header sujet : titre · objectifs · questions guides · progression · ✨ Synthèse IA.
- Chaque slot : titre + intent + mini-toolbar `+ Carte / + Postit / + Vocal / + Question / + Image`.
- Drop zone unifiée : accepte `text/card-id` ET `text/artifact-id`.
- Compteur complétion = ≥1 contribution (peu importe le kind).

### Plateau libre mixte
`PlateauBoard` étendu : drop cartes du `CardSidebar` (crée artefact `kind:"card"` avec `card_id` + `position`), toolbar flottante 5 boutons, rendu compact image/carte/postit/vocal/question.

---

## 2. Co-présence pro temps réel

### Presence
Hook `useChallengePresence(sessionId)` via `supabase.channel(...).track()` :
- Track : `user_id, display_name, avatar_url, color, cursor{x,y}, viewing_subject_id, editing_artifact_id, last_active`.
- `PresenceBar` haut-droit : avatars empilés, point coloré actif, tooltip "édite Postit X".
- `RemoteCursors` sur plateau libre + halo coloré sur la vignette en cours d'édition.
- Throttle cursor 100 ms.

### Lock coopératif (soft lock)
Nouvelle table `challenge_artifact_locks (artifact_id pk, locked_by, locked_at, expires_at)` + RPC `try_acquire_lock(artifact_id)` SECURITY DEFINER :
- INSERT si libre OU si `expires_at < now()`,
- sinon UPDATE (refresh 90 s) si `locked_by = auth.uid()`,
- renvoie `{acquired, locked_by, expires_at}`.

UX :
- Au clic "Éditer" → tentative de lock. Si ko → vignette estompée + badge `🔒 Marie édite…` + bouton "Demander la main".
- Heartbeat 30 s tant que l'inspector est ouvert; release explicite à la fermeture.
- Realtime sur la table → badges instantanés.
- Lecture, réactions, votes, IA toujours possibles (pas de lock).
- Mini-lock optimiste 200 ms sur drag/position pour éviter conflits.

---

## 3. Sidebar best-in-class (refonte)

`EnrichedSidebar` v2 (largeur 360 px, esthétique Linear/Arc, conservée) :
- **Header sticky** : titre court + badge `● 3 en ligne`.
- **Tabs segmentées 5** : Post-its · Vocaux · Questions · **Images** · Cartes — compteurs animés + dot pulse pour nouveautés.
- **Search inline** (`Cmd+K`) : fulltext content + transcription + tags + alt image.
- **Filtres chips** : Sujet courant · Tous · Critique · Non résolus · Avec réponse IA · Mes contributions.
- **Group by** : Sujet (défaut, collapsible), Auteur, Statut, Récent.
- **Items** : icône kind · emoji · preview · auteur avatar mini · relative time · barre criticité · footer (❤️ · 🗳 · 💬 · 🤖) · drag handle.
- **Empty state** illustré + CTA contextuel par tab.
- **Footer sticky `QuickComposer`** : toggle 5 modes en une barre, raccourci `N`.
- a11y : aria + nav clavier + focus rings.
- Mobile : sheet bottom-up.

---

## 4. Persistance exhaustive RAG-ready

### Schéma
- `challenge_artifacts` : déjà OK (subject_id, slot_id, card_id, position, ai_meta, content, transcription, parent_artifact_id). Le kind enum accepte déjà `image` (sinon ajouté via migration).
- `challenge_events` : append-only via triggers (déjà en place).
- **NEW** `challenge_artifact_locks` (cf §2).
- **NEW** `challenge_interactions` (journal fin RAG) :
  ```text
  id, session_id, artifact_id?, slot_id?, subject_id?,
  actor_id, kind  -- 'edit'|'move'|'react'|'vote'|'comment'|'ai_ask'|'ai_answer'|'lock'|'unlock'|'view'|'image_upload'
  payload jsonb, created_at
  ```
  Triggers depuis `challenge_artifacts`, `challenge_reactions`, `challenge_votes`. RLS participant_or_host.
- **NEW** `challenge_copilot_threads (session_id, user_id, messages jsonb)`.
- **NEW** Bucket Storage `challenge-images` (public read, insert authentifié + RLS sur `name LIKE session_id || '/%'`).

### Embeddings
À chaque INSERT/UPDATE artifact textuel → `challenge-embed` (déjà en place). On étend pour : alt-text image, transcription vocal (déjà), synthèses, réponses IA. RAG hybride : sémantique (`match_challenge_artifacts`) + récents.

### Position
`position` JSONB : `{x,y}` plateau libre OU `{slot_id, order}` slot. Throttle 300 ms.

---

## 5. IA contextuelle — 4 niveaux

Tout via `challenge-agent` étendu (modes `postit_action`, `voice_summary`, `image_describe`, `synthesize_slot`, `synthesize_subject`, `copilot`).

### a) Post-it : ✨ + chips `Reformuler / Challenger / Approfondir` → `ai_meta.response`.
### b) Vocal : ✨ → résumé + bullets + actions (basé sur transcription) → `ai_meta.summary`.
### c) Image : ✨ → description + critique constructive (vision via Gemini multimodal) → `ai_meta.description`.
### d) Slot/Sujet : ✨ "Synthèse IA" — contexte serveur = briefing + sujet (objectifs/questions) + slot (intent) + **tous** les artefacts du slot (carte/postit/vocal/question/image) avec leurs ai_meta + threads + réactions + Top-K voisins. Sortie persistée `challenge_syntheses`, panneau pliable + embed.
### e) Co-pilote flottant `CopilotBubble` : mini-chat AI Elements (`Conversation`+`PromptInput`+`MessageResponse`), streaming `streamText`+`toUIMessageStreamResponse`, contexte dynamique (sujet/slot/artefact focus + Top-K + dernière synthèse), thread persisté `challenge_copilot_threads`, fermable, badge Beta.

---

## 6. Architecture fichiers

```text
src/components/challenge/enriched/
  EnrichedChallengeRoom.tsx            (orchestre + PresenceBar + CopilotBubble)
  EnrichedSubjectCanvas.tsx            NEW
  EnrichedSlot.tsx                     NEW
  EnrichedArtifactTile.tsx             NEW (5 kinds)
  PlateauBoard.tsx                     ETENDU (drop cartes/images, toolbar 5)
  presence/
    PresenceBar.tsx                    NEW
    RemoteCursors.tsx                  NEW
  locks/
    LockBadge.tsx                      NEW
  sidebar/
    EnrichedSidebar.tsx                REFONTE (5 tabs)
    SidebarSearch.tsx                  NEW
    SidebarFilters.tsx                 NEW
    SidebarItem.tsx                    NEW
    QuickComposer.tsx                  NEW
  images/
    ImageLibrary.tsx                   NEW (3 tabs: Upload/Stickers/IA)
    ImageComposer.tsx                  NEW
    ImageTile.tsx                      NEW
  inspector/
    PostitAiPanel.tsx                  NEW
    VoiceAiPanel.tsx                   NEW
    ImageAiPanel.tsx                   NEW
  synthesis/
    SlotSynthesisPanel.tsx             NEW
    SubjectSynthesisPanel.tsx          NEW
  copilot/
    CopilotBubble.tsx                  NEW
    CopilotChat.tsx                    NEW
src/hooks/
  useChallengePresence.ts              NEW
  useArtifactLock.ts                   NEW
  useChallengeInteractions.ts          NEW
  useCopilotChat.ts                    NEW
  useChallengeImages.ts                NEW (upload + IA gen)
supabase/migrations/
  20260515_locks_interactions_copilot_images.sql
    - challenge_artifact_locks + RLS + try_acquire_lock RPC + cleanup cron
    - challenge_interactions + RLS + triggers
    - challenge_copilot_threads + RLS
    - bucket challenge-images + policies
    - kind enum: ajouter 'image' si manquant
supabase/functions/
  challenge-agent/index.ts             ETENDU (5 nouveaux modes + streaming co-pilote)
  challenge-image/index.ts             NEW (génération + upload bucket)
```

---

## 7. Sécurité

- RLS sur toutes les nouvelles tables via `is_workshop_participant` / `is_workshop_host`.
- RPC `try_acquire_lock` SECURITY DEFINER + check participant.
- Bucket `challenge-images` : SELECT public (preview), INSERT authentifié restreint au préfixe `session_id/`.
- `challenge-image` valide la taille (≤ 10 Mo) et le mime (png/jpg/webp).
- AI Gateway côté serveur uniquement.

---

## 8. Décisions par défaut & non-objectifs

**Pris :**
- Co-présence + locks soft (pas de co-édition CRDT du même textarea).
- Image : upload + stickers + génération IA, pas d'édition image avancée.
- Co-pilote : 1 thread par user/session (pas de multi-threads).
- Sidebar conservée et modernisée (pas de remplacement par command palette).

**Hors scope (futur) :**
- Co-édition concurrente fine (Yjs).
- Voice/video huddle.
- Replay temporel scrubber sur `challenge_events`.
- Export PDF synthèse.
- Édition image (crop, annotate).

---

## Plan d'exécution

1. Migration SQL (locks + interactions + copilot threads + bucket + enum image).
2. Hooks (`useChallengePresence`, `useArtifactLock`, `useChallengeInteractions`, `useChallengeImages`, `useCopilotChat`).
3. Refonte `EnrichedSidebar` (5 tabs + search + filters + group + QuickComposer).
4. `EnrichedSubjectCanvas` + `EnrichedSlot` + `EnrichedArtifactTile` (mixité slots).
5. `PlateauBoard` étendu (drop cartes/images + toolbar 5 + curseurs distants).
6. Bibliothèque images (`ImageLibrary` + edge `challenge-image`).
7. Inspector AI panels (post-it / vocal / image).
8. Synthèse IA slot/sujet.
9. Co-pilote flottant.
10. PresenceBar + LockBadge + RemoteCursors câblés partout.
11. QA collaborative à 2 onglets : presence, lock, drag, IA, persistance reload.
