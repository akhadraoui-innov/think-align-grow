## Constat

Le pipeline de génération de couverture est **déjà entièrement fonctionnel** dans `supabase/functions/academy-generate/index.ts` :
- `action: "generate-cover"` (un parcours, ligne 1283)
- `action: "generate-all-covers"` (batch des `cover_image_url IS NULL`, ligne 1352)
- Style mémorisé respecté : "Professional e-learning course cover, gradient 2-3 couleurs, icônes flat, **NO text**, 16:9"
- Modèle utilisé : `google/gemini-3.1-flash-image-preview`
- Upload `academy-assets/covers/<id>.png`, `upsert: true`

Côté admin (`AdminAcademyPaths.tsx`) :
- Bouton header **"Générer les couvertures"** (batch, ligne 255)
- Bouton **par carte** sur survol (regen single, ligne 369)

**Manque** : déclenchement automatique à la création / validation d'un parcours, et génération des 10 covers manquantes encore en `NULL` après le hotfix v2.9.4.

## Étape 1 — Auto-trigger à la validation

Modifier `upsert.mutationFn` dans `src/pages/admin/AdminAcademyPaths.tsx` :

- Récupérer l'`id` après `insert(...).select("id").single()`
- À la création → toujours déclencher `generate-cover`
- À l'édition → vérifier `cover_image_url`, déclencher uniquement si vide
- Lancement **fire-and-forget** dans `onSuccess` avec toasts info / success / error
- Invalidate la query après succès pour rafraîchir l'image

Pas d'attente bloquante : l'admin voit immédiatement le parcours créé, la cover apparaît ensuite via toast + refresh.

Idem pour la mutation `generateAI` (`generate-path` IA) — l'EF côté serveur ne génère pas la cover automatiquement, on ajoute le même hook après succès.

## Étape 2 — Backfill des 10 parcours sans cover

Lancer le batch existant via le bouton **"Générer les couvertures"** déjà présent dans le header de `/admin/academy/paths`. C'est le moyen le plus propre car l'EF requiert un JWT utilisateur (vérifié `Unauthorized` depuis sandbox).

Si l'utilisateur préfère un backfill automatique sans clic, alternative : ajouter un useEffect au mount qui détecte `paths.filter(p => !p.cover_image_url).length > 0` et déclenche le batch (avec confirmation toast). À arbitrer — par défaut on garde le bouton manuel pour éviter une consommation crédits non voulue à chaque visite.

**Décision recommandée** : garder bouton manuel + ajouter une petite **bannière contextuelle** au-dessus de la liste qui apparaît si N parcours sans cover → "10 parcours sans couverture · [Générer maintenant]" — UX explicite, action volontaire.

## Étape 3 — Améliorer le bouton "Générer les couvertures"

Petit gain UX : pendant le batch (10 parcours × 2 appels IA = 30-60s), passer en disabled + spinner + toast persistant. Déjà partiellement présent (`genCoversLoading`), on ajoute juste un toast `loading` qui se ferme à la fin.

## Étape 4 — Documentation

- Patch note `docs/releases/v2.9.5-academy-cover-auto-trigger.md` :
  - Auto-trigger cover sur création/édition
  - Bannière "X parcours sans couverture"
  - Backfill via bouton existant

- MAJ `.lovable/memory/features/academy/path-visuals-ai.md` pour acter l'auto-trigger.

## Hors périmètre

- **Pas de modification de l'edge function** : pipeline déjà robuste
- **Pas de cron de régénération** automatique (consommation crédits IA non maîtrisée)
- **Pas de prévisualisation** de la cover avant validation (workflow asynchrone assumé)
- Portail apprenant (`PortalAcademiePaths.tsx`) déjà aligné, rien à modifier

## Fichiers impactés

- `src/pages/admin/AdminAcademyPaths.tsx` (upsert + bannière contextuelle + generateAI hook)
- `docs/releases/v2.9.5-academy-cover-auto-trigger.md` (nouveau)
- `docs/releases/README.md` (index)
- `.lovable/memory/features/academy/path-visuals-ai.md` (mise à jour)