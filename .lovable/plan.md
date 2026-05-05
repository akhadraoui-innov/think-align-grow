# Plan : Terrain de jeu admin + génération illustrations fiable

Contexte confirmé :
- Bouton "Terrain de jeu" absent dans `/admin/toolkits` (portail OK)
- Crédits IA rechargés → la génération peut reprendre
- 240 cartes en `image_status='failed'` à relancer

---

## 1. Bouton "Terrain de jeu" dans l'admin

**Fichier** : `src/pages/admin/AdminToolkits.tsx` (liste) + `src/pages/admin/AdminToolkitDetail.tsx` (détail)

- Liste : ajouter un bouton icône (Sparkles) sur chaque carte toolkit qui ouvre `/portal/workshops/toolkits/:id/playground` dans un nouvel onglet
- Détail : ajouter le même bouton dans la barre d'en-tête à côté du badge statut

Pas de duplication de route — on réutilise la route portail existante.

---

## 2. Edge function `academy-generate` — circuit breaker 402

**Fichier** : `supabase/functions/academy-generate/index.ts`

Dans la boucle `generate-all-card-illustrations` :
- Compteur d'échecs 402 consécutifs
- Si ≥ 3 erreurs `AI credits exhausted` d'affilée → `break` immédiat
- Marquer les cartes restantes en `pending` (pas `failed`) pour qu'elles puissent être relancées
- Retourner `{ aiCredits: 'exhausted', processed, skipped }` au client

Bénéfice : on ne grille plus 240 appels inutiles en cas d'épuisement, et on évite le `WORKER_RESOURCE_LIMIT`.

---

## 3. Batches client-side au lieu d'un mégabatch background

**Fichier** : `src/pages/admin/AdminToolkitDetail.tsx`

Remplacer l'appel unique par une boucle :
- Récupérer les IDs cartes sans image (ou toutes si `force`)
- Découper en batches de **15 cartes**
- Pour chaque batch, appel séquentiel à `academy-generate` avec `action: 'generate-card-illustrations-batch'` et `card_ids: [...]`
- Barre de progression réelle (X/Y cartes traitées)
- Si la réponse contient `aiCredits: 'exhausted'` → stop + toast clair "Solde IA épuisé. Rechargez dans Cloud & AI balance puis cliquez Relancer"
- Bouton "Pause" pour interrompre proprement

Nouvelle action edge function : `generate-card-illustrations-batch` (15 cartes max, séquentiel interne, retour synchrone — fini `EdgeRuntime.waitUntil`).

---

## 4. Granularité : générer par pilier

Dans le banner illustrations de `AdminToolkitDetail.tsx`, ajouter un menu déroulant :
- "Toutes les cartes manquantes" (par défaut)
- "Pilier X" (~30 cartes) — un item par pilier
- "Cartes échouées uniquement"

Évite de tout régénérer pour tester un seul pilier.

---

## 5. Reset des cartes `failed` avant relance

Avant chaque batch, repasser les cartes ciblées de `failed` → `pending` dans la DB (insert tool / update simple). Évite de devoir cocher "force" pour relancer ce qui a planté.

---

## Récap fichiers touchés

| Fichier | Changement |
|---|---|
| `src/pages/admin/AdminToolkits.tsx` | Bouton Terrain de jeu sur chaque card |
| `src/pages/admin/AdminToolkitDetail.tsx` | Bouton header + UI batch progressive + sélecteur pilier |
| `supabase/functions/academy-generate/index.ts` | Circuit breaker 402 + nouvelle action `generate-card-illustrations-batch` synchrone |

Aucune migration DB requise (les colonnes `image_*` existent déjà).

---

## Hors scope (à proposer plus tard si utile)

- Polling temps réel de l'avancement (batch synchrone suffit)
- Régénération sélective carte par carte depuis la table cards (déjà possible via l'éditeur de carte)
- Page playground dédiée admin (la route portail fait le job)

Confirme et je passe en build.
