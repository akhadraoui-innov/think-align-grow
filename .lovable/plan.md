# Audit & garde-fous — pipeline d'illustrations cartes

## 1. Audit de l'existant

### Ce qui marche
- `EdgeRuntime.waitUntil` → réponse immédiate côté UI
- Style guide unifié et caché (`toolkits.illustration_style`)
- Realtime sur `cards` → progression live dans l'admin
- Concurrence 4, conversion JPEG (compress)
- Statut multi-état (`queued / generating / ready / failed / pending`)

### Failles identifiées (le job ne va PAS toujours au bout)

| # | Problème | Conséquence |
|---|---|---|
| F1 | `waitUntil` n'a **pas** de garantie d'exécution illimitée. Avec 50 cartes × ~12 s / 4 = ~150 s, on est dans la zone à risque (CPU time / shutdown worker). | Cartes restent à `queued` ou `generating` indéfiniment. |
| F2 | Aucun **détecteur de stale** : une carte coincée en `generating` n'est jamais réveillée. | Bannière reste "X en cours" pour toujours. |
| F3 | Pas de **retry par carte** : un 503 transitoire = `failed` direct, jamais re-tenté. | Taux d'échec gonflé, l'utilisateur doit relancer manuellement. |
| F4 | `compressToJpeg` retourne les **bytes PNG** en fallback mais l'upload force `contentType: image/jpeg` et l'extension `.jpg`. | Fichier corrompu (PNG servi en JPEG) → image cassée dans le portail. |
| F5 | Pas de **reprise automatique** en cas d'interruption du worker. | Job mort = besoin d'un clic admin. |
| F6 | UI portail : pendant `queued/generating`, la carte affiche probablement un trou (pas d'image_url) → expérience cassée. | Aucun feedback visuel léger. |
| F7 | `cardsReady` côté UI compte aussi les cartes "qui ont une URL même si failed après regen" → métrique fausse pendant un retry. | Progression peu fiable. |
| F8 | Aucun **timeout** sur l'appel image Gemini → un appel pendu bloque un slot de concurrence. | Pipeline qui rame. |

---

## 2. Plan de durcissement

### A. DB — métadonnées de résilience
Ajouter à `cards` :
- `image_attempts INT NOT NULL DEFAULT 0`
- `image_last_attempt_at TIMESTAMPTZ`
- `image_error TEXT` (dernier message d'erreur tronqué)

Index partiel pour le watcher : `CREATE INDEX ON cards (image_last_attempt_at) WHERE image_status IN ('queued','generating');`

### B. Edge function `academy-generate` — garde-fous

1. **Timeout dur sur `renderImage`** (ex. 45 s via `AbortController`). Au-delà → `failed` + retry budgétisé.
2. **Retry par carte** : jusqu'à 2 ré-essais sur erreurs transitoires (503/réseau/timeout). Compteur stocké dans `image_attempts`. À la 3e tentative → `failed` définitif avec `image_error`.
3. **Compress safe** : si `compressToJpeg` retombe en fallback PNG → uploader avec `contentType: image/png` ET extension `.png`, ou abandonner la compression et garder le JPEG d'origine. Plus de mismatch contenu/extension.
4. **Chunking auto-resume** : `processCardsInBackground` traite max **N cartes par invocation** (ex. 12). À la fin du chunk, si `remaining > 0`, **se ré-invoque** elle-même via `fetch` avec une nouvelle action `resume-card-illustrations` (pass un `resume_token` = liste d'IDs restants). Permet des batchs de 100 sans toucher au plafond CPU.
5. **Heartbeat** : à chaque début de carte, set `image_last_attempt_at = now()` pour tracer la vivacité.
6. **Nouvelle action `sweep-stale-card-illustrations`** : remet en `queued` toute carte `generating` depuis > 90 s ou `queued` depuis > 5 min sans heartbeat, puis relance le pipeline. Appelée :
   - automatiquement au début de chaque batch (auto-réparation)
   - manuellement depuis l'UI ("Reprendre" si bloqué)

### C. UI admin (`AdminToolkitDetail.tsx`)

- **Détection de stalle côté client** : si `inFlight > 0` mais aucun changement realtime depuis 60 s → afficher CTA "Reprendre" qui appelle `sweep-stale-card-illustrations`.
- **Métrique `cardsReady` corrigée** : compter strictement `image_status === "ready"`.
- Affichage compteur "tentatives" pour les cartes en `failed` (badge `2/3` ex.).
- Bouton "Forcer reset des cartes bloquées" en action secondaire.

### D. Preview léger des cartes (portail + admin)

Composant partagé `CardThumb.tsx` qui, selon `image_status` :
- `ready` → `<img>` avec `loading="lazy"` + `decoding="async"`
- `generating` → skeleton **shimmer** + petit pulse + 1ère lettre du titre dans gradient pillar.color (jamais de trou blanc)
- `queued` → skeleton statique + icône horloge
- `failed` → fond muted + icône `AlertTriangle` + tooltip "Cliquer pour relancer" (admin uniquement)
- `pending` (sans url) → mini illustration vectorielle SVG à la couleur du pilier (placeholder cohérent design system)

Réutilisé dans : `ToolkitCardsTab`, `PlateauHand`, `PlateauBoard`, `PortalToolkitPlayground`. Zéro charge réseau pour les états non-`ready`.

---

## 3. Fichiers touchés

- **Migration** `supabase/migrations/...` — colonnes `image_attempts`, `image_last_attempt_at`, `image_error` + index partiel.
- `supabase/functions/academy-generate/index.ts` — timeout, retry, chunking + auto-resume, action `sweep-stale-card-illustrations`, fix compress/contentType, heartbeat.
- `src/pages/admin/AdminToolkitDetail.tsx` — détection stalle, CTA "Reprendre", compteur strict.
- `src/components/cards/CardThumb.tsx` — **nouveau** composant preview léger réutilisable.
- Remplacements ponctuels dans `ToolkitCardsTab`, `PlateauHand`, `PlateauBoard` pour utiliser `CardThumb`.

## 4. Mesures attendues

| Métrique | Avant | Après |
|---|---|---|
| Taux de cartes restant `queued/generating` après job | 5–20 % | < 1 % (auto-sweep + resume) |
| Visuel cassé en cours de génération | Trou blanc | Skeleton/placeholder cohérent |
| Reprise après crash worker | Manuelle | Automatique (chunking + sweeper) |
| Échec sur 503 isolé | `failed` direct | Retry × 2 transparent |
| Risque fichier image corrompu | Possible | Nul (contentType aligné) |

## Hors scope
- Génération vidéo des cartes
- Édition manuelle du style guide dans l'UI (déjà côté backend, à exposer plus tard)
