## Audit du pipeline actuel

### Constats
1. **Performance — timeout 504 récurrent**
   - `generate-card-illustrations-batch` est synchrone : pour N cartes il fait N × (2 appels LLM = `buildCardPrompt` puis `renderImage`).
   - Chaque carte = ~10–20s. Avec 5–10 cartes on flirte avec les 150s edge.
   - Le client (`AdminToolkitDetail`) boucle séquentiellement sur des batches de 5 → temps total perçu très long et fragile.
   - Aucune parallélisation côté serveur (`for...of`).

2. **Cohérence design — faible**
   - Chaque carte génère son propre prompt via un LLM (`buildCardPrompt`), sans connaissance des autres cartes du toolkit → drift visuel (palettes, niveau d'abstraction, profondeur isométrique variables d'une carte à l'autre).
   - Pas de "style guide" partagé au niveau du toolkit.
   - La couleur du pilier (`pillar.color`) est passée mais l'IA l'ignore souvent (texte libre).
   - Le style baseline (`CARD_STYLE`) est répété dans chaque appel mais pas verrouillé.

3. **Légèreté — fichiers trop lourds**
   - Upload PNG brut depuis Gemini (souvent 1–2 Mo par carte). Pour un toolkit de 30 cartes : ~50 Mo de storage + bande passante portail.
   - Aucun resize / compression / conversion WebP avant upload.

4. **Robustesse**
   - 3 retries sur tous codes ≥500 et 429 → multiplie potentiellement le temps par 3 sur un batch entier.
   - Pas de `image_status` "queued" exploitable côté UI temps réel (Realtime).
   - Pas d'idempotence : relancer le même batch en plein run peut écraser un statut "generating".

### Points à conserver
- Bucket public `academy-assets`, schéma `cards.image_url/image_status/image_prompt` OK.
- `EdgeRuntime.waitUntil` déjà utilisé pour `generate-all-card-illustrations` → modèle à généraliser.

---

## Plan de refonte

### 1. Backend — Edge function `academy-generate`

**a. Background processing systématique**
- `generate-card-illustrations-batch` devient **fire-and-forget** : marque les cartes en `queued`, lance le travail via `EdgeRuntime.waitUntil`, renvoie `{ queued: N }` immédiatement (< 1s).
- Suppression de la cap "5 max" introduite en hotfix : on accepte 50 cartes par appel, le backend tourne en background jusqu'à 25 min.
- Concurrence interne portée à **4 cartes en parallèle** (Promise.all par lot) au lieu du `for` séquentiel.

**b. Style guide unifié par toolkit (cohérence)**
- Nouvelle étape, **une seule fois par batch** : `buildToolkitStyleGuide(toolkit, pillars)` → un LLM produit un brief court (40 mots) qui fixe :
  - palette dominante (issue de `toolkit.primary_color` + couleurs piliers)
  - niveau d'abstraction (flat / iso / line)
  - éléments graphiques récurrents (formes, textures)
- Ce style guide est **injecté dans chaque prompt carte** et persisté dans `toolkits.illustration_style` (nouvelle colonne JSONB) pour réutilisation lors d'ajouts ultérieurs de cartes.
- `buildCardPrompt` devient **déterministe sans LLM** : template strict combinant `style_guide` + `pillar.color` (en hex explicite) + `card.title/subtitle` → 1 appel LLM en moins par carte (–50% temps + –50% coût texte).

**c. Compression d'image avant upload**
- Après `renderImage`, conversion PNG → **WebP qualité 82 + resize max 768px** via `@jsquash/webp` (npm:) ou `imagescript` (Deno).
- Cible : ~80–150 Ko par carte (vs 1–2 Mo). Storage / 10, chargement portail x10.
- `image_url` change d'extension `.webp` → MIME `image/webp`, le composant React s'en moque.

**d. Statuts enrichis & idempotence**
- Nouvel enum `image_status` : `idle | queued | generating | ready | failed`.
- `queued` posé en bulk au lancement, `generating` au début de chaque rendu, `ready` ou `failed` à la fin.
- Refus de re-traiter une carte déjà en `generating` (stale > 5 min sinon réinit).

**e. Robustesse**
- Retry réduit à 2 tentatives, uniquement sur 429 / 503.
- Court-circuit dur après 3 × 402 consécutifs (déjà présent, conservé).

### 2. Frontend — `AdminToolkitDetail.tsx`

**a. Modèle "fire-and-forget + Realtime"**
- Un seul appel à `generate-card-illustrations-batch` (au lieu de boucle BATCH=5).
- Souscription Supabase Realtime sur `cards` filtrée par `pillar_id IN (...)` → mise à jour live de la barre de progression et des miniatures.
- Bouton "Arrêter" remplacé par "Rafraîchir" (le job tourne en serveur).

**b. UX**
- La bannière affiche : `X queued · Y generating · Z ready · W failed` en temps réel.
- Toast initial : "Génération lancée en arrière-plan, vous pouvez fermer cette page."

### 3. Migration DB

```sql
-- Style guide partagé pour cohérence inter-cartes
alter table toolkits add column if not exists illustration_style jsonb;

-- Nouveau statut "queued"
-- (image_status est text libre aujourd'hui, pas d'enum à modifier)

-- Realtime
alter publication supabase_realtime add table cards;
```

### 4. Mesures attendues

| Métrique | Avant | Après |
|---|---|---|
| Temps perçu (30 cartes) | 5–8 min, timeouts | < 5s pour le retour, ~3 min en arrière-plan |
| Appels LLM par carte | 2 (texte + image) | 1 (image seule) |
| Poids image | 1–2 Mo PNG | 80–150 Ko WebP |
| Cohérence visuelle | Aléatoire | Style guide figé par toolkit |
| Risque de timeout edge | Élevé | Nul (waitUntil) |

---

## Fichiers touchés

- `supabase/functions/academy-generate/index.ts` — refactor `renderCardIllustration`, `buildCardPrompt`, `generateCardIllustrationsBatch`, ajout `buildToolkitStyleGuide`, ajout helper `compressToWebp`.
- `supabase/migrations/...` — ajout `toolkits.illustration_style`, publication realtime `cards`.
- `src/pages/admin/AdminToolkitDetail.tsx` — suppression boucle BATCH, ajout subscription Realtime, simplification UI bannière.
- `src/hooks/useAdminToolkits.ts` — invalidation déclenchée par events Realtime (optionnel).

## Hors scope (proposé pour plus tard)
- Génération vidéo / animation des cartes.
- Editor "regen with feedback" par carte (déjà possible single, pas prioritaire).
- Style guide éditable manuellement dans `ToolkitInfoTab`.