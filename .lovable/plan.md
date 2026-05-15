# Audit du pipeline d'illustrations + branchement du preview

## 1. État actuel

### Ce qui marche
- Edge function `academy-generate` : timeout 45 s sur `renderImage`, retry interne (×2 sur 429/5xx), retry par carte (`MAX_IMAGE_ATTEMPTS=3`), heartbeat (`image_last_attempt_at`), chunking auto-resume (12 cartes / invocation), action `sweep-stale-card-illustrations`.
- Migration colonnes `image_attempts`, `image_last_attempt_at`, `image_error` + index partiel.
- Admin `AdminToolkitDetail` : bandeau progression strict (`ready` only), détecteur de stalle 75 s, bouton "Reprendre", chunk client BATCH 100.
- Compress safe : fallback PNG aligne `contentType` + extension.
- Realtime sur `cards` → progression live.

### Trous identifiés (l'audit révèle ce qui manque)

| # | Trou | Impact |
|---|------|--------|
| **T1** | **`CardThumb` n'est branché NULLE PART**. Plan A→D livré, sauf D. Donc le preview léger annoncé n'existe pas dans l'UI. | Pendant la génération l'admin voit toujours une colonne "Cartes" sans miniature, le portail (`PlaygroundCard`) montre un sparkles statique et un texte "Génération…" hors design system. |
| **T2** | `ToolkitCardsTab` (table d'admin) **n'affiche aucune image**, donc impossible de voir d'un coup d'œil quelles cartes sont prêtes / ratées. | Pas de feedback visuel par ligne, on doit aller sur le terrain de jeu pour vérifier. |
| **T3** | `selfInvokeResume` envoie `x-internal-key` mais **aucun `Authorization`**. Si `verify_jwt=true` un jour, le handoff casse en silence. À sécuriser maintenant. | Risque futur, et pas d'audit log sur les handoffs. |
| **T4** | Aucun log structuré côté client lors des gros lancements (50–200 cartes), pas d'`appendAuditLog` sur l'action bulk. | Pas de trace dans `audit_logs_immutable` pour les générations massives. |
| **T5** | `PlaygroundCard` (portail joueur) n'a pas de retour visuel `failed`/`queued`/`pending` distinct, et pas de skeleton shimmer durant `generating`. | UX dégradée pendant un job en cours côté joueur. |

## 2. Plan d'implémentation

### A. Brancher `CardThumb` (frontend uniquement)

1. **`PlaygroundCard.tsx`** — remplacer le bloc `card.image_url ? <img/> : <fallback/>` (lignes ~104–133) par `<CardThumb imageUrl imageStatus title={card.title} pillarColor={accent} />`. Conserver le badge phase et l'overlay gradient en superposition absolue.
2. **`ToolkitCardsTab.tsx`** — ajouter en mode `table` une colonne "Visuel" (60×60) avant le titre, et en mode `visual` une mini-thumb dans chaque cellule, alimentées par `CardThumb` avec `showAdminBadges` (compteur tentatives, retry au clic).
3. **`PlateauHand.tsx` / `PlateauBoard.tsx`** — repérer les rendus de carte miniature et substituer par `CardThumb` (sans casser les drag handlers existants : wrapper le composant, pas remplacer les props pointer).
4. **`PortalToolkitPlayground.tsx`** — vérifier que la grille de cartes utilise déjà `PlaygroundCard` (donc bénéficie automatiquement du fix A.1) ; sinon idem A.1.

Aucun changement de logique métier. CardThumb existe déjà, semantic tokens, lazy-loading, zéro charge réseau hors `ready`.

### B. Action retry one-click depuis l'admin (UI only)

Dans `ToolkitCardsTab`, si `image_status === "failed"` → le clic sur la mini-thumb appelle `supabase.functions.invoke("academy-generate", { body: { action: "generate-card-illustration", card_id }})`. Toast + invalidation. Compteur `n/3` visible.

### C. Sécuriser le handoff edge (`academy-generate/index.ts`)

1. Dans `selfInvokeResume`, ajouter `Authorization: Bearer ${serviceRoleKey}` en plus de `x-internal-key`. Inoffensif aujourd'hui, robuste si `verify_jwt` repasse à true.
2. Ajouter un log structuré JSON `action: "self-invoke-resume", remaining, status` au succès/échec pour traçabilité dans `function_edge_logs`.

### D. Audit log côté client

Dans `AdminToolkitDetail.launchGeneration`, après la boucle de chunks, appeler `appendAuditLog({ action: "toolkit.illustrations.bulk_generate", entityType: "toolkit", entityId: toolkit.id, payload: { scope, total: ids.length, queued } })`. Idem pour `resumeStuck` avec action `toolkit.illustrations.sweep`.

### E. Sweep auto au lancement (anti double-clic, anti-fantôme)

Dans `generateCardIllustrationsBatch` (edge), avant de lancer, exécuter en passant un mini sweep sur les cartes du toolkit dont `image_last_attempt_at < now() - 90s` ET `image_status in ('queued','generating')`. Évite de relancer un job qui est déjà en cours, et libère les zombies.

## 3. Détails techniques

```text
Fichiers touchés :
  src/components/playground/PlaygroundCard.tsx        (CardThumb)
  src/components/playground/PlateauHand.tsx           (CardThumb)
  src/components/playground/PlateauBoard.tsx          (CardThumb)
  src/components/admin/ToolkitCardsTab.tsx            (colonne visuel + retry)
  src/pages/admin/AdminToolkitDetail.tsx              (appendAuditLog)
  supabase/functions/academy-generate/index.ts        (Auth header handoff + sweep auto)
```

Aucune migration DB. Aucun nouveau secret. Pas de changement de schéma.

## 4. Hors scope
- Refonte du style guide image
- Réécriture de `compressToJpeg` (déjà safe)
- Génération vidéo, A/B prompt
