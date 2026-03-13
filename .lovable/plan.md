

## Audit complet — Complétion IA, Raffinement, Visualisation des cartes

### 1. BUGS ACTIFS

**BUG 1 — Console : "Function components cannot be given refs" dans ToolkitCompletionBanner**
- Ligne 272-273 : `Badge` est utilisé comme enfant direct de `motion.div` dans `AnimatePresence`. Framer Motion tente de passer une `ref` au `Badge`, qui est un composant fonction sans `forwardRef`.
- Impact : Warning React, potentiel crash d'animation.
- Fix : Envelopper les `Badge` dans des `<span>` ou utiliser un `<div>` au lieu de `Badge` dans le contexte `AnimatePresence`.

**BUG 2 — `refine-toolkit` non déclaré dans `config.toml`**
- Le fichier `supabase/config.toml` ne contient PAS d'entrée `[functions.refine-toolkit]`. Toutes les autres fonctions y sont listées avec `verify_jwt = false`.
- Impact : La fonction est déployée mais utilise la vérification JWT par défaut. Comme le frontend utilise `supabase.functions.invoke()` (qui passe le JWT), ça peut fonctionner, mais c'est incohérent avec les autres fonctions et peut causer des erreurs si le JWT expire.
- Fix : Ajouter `[functions.refine-toolkit] verify_jwt = false` dans config.toml.

**BUG 3 — `getClaims` potentiellement non supporté**
- Les deux edge functions (`generate-toolkit`, `refine-toolkit`) utilisent `anonClient.auth.getClaims()`. Cette méthode n'est pas standard dans le SDK Supabase JS v2. Le SDK utilise `getUser()` ou `getSession()`.
- Impact : Peut fonctionner avec certaines versions mais est fragile.
- Fix : Remplacer par `anonClient.auth.getUser(token)` pour valider le JWT côté edge function.

**BUG 4 — Gamified card : `position: absolute` sans `position: relative` sur le parent**
- `ToolkitCardsBrowser.tsx` ligne 110 : le pseudo-overlay utilise `absolute inset-0` mais le parent div (ligne 105-108) n'a pas `relative`.
- Impact : L'overlay est positionné par rapport au mauvais ancêtre, effet visuel cassé.
- Fix : Ajouter `relative` à la div parent.

**BUG 5 — `invalidateAll` n'invalide pas avec les bons pillarIds**
- `useAdminToolkits.ts` ligne 192 : `invalidateQueries({ queryKey: ["admin-toolkit-cards", id] })` ne match pas la queryKey réelle `["admin-toolkit-cards", id, pillarIds]` car `invalidateQueries` fait un match partiel par préfixe.
- Impact : En fait ça fonctionne car React Query fait un match par préfixe. Pas de bug réel ici.

### 2. RACE CONDITIONS / DATA

**La query cards dépend des pillarIds — CORRIGÉ**
- Le fix précédent (`enabled: !!id && pillarIds.length > 0` + pillarIds dans queryKey) est correct et en place.
- Cependant, les `quizQuestions` utilisent `enabled: !!pillars.data?.length` mais recalculent `pillarIds` en interne (ligne 171). C'est correct mais redondant — pourrait utiliser le même `pillarIds` de la ligne 135.

### 3. EDGE FUNCTIONS

**`generate-toolkit`** — Solide
- Auth correcte (JWT + is_saas_team RPC)
- Mode `complete_missing` avec `pillar_ids` bien implémenté
- SSE stream correct
- Retry intégré
- Seul problème : `getClaims` (voir bug 3)

**`refine-toolkit`** — Fonctionnel avec risques
- Auth correcte
- Pas de tool calling (JSON libre dans le content) — plus fragile que le tool calling utilisé dans generate-toolkit
- Le parsing JSON peut échouer si l'IA ajoute du texte autour malgré le prompt
- La validation des champs est bonne (`allowedFields` whitelist)
- Manque un rate limiting (un utilisateur pourrait spammer des appels coûteux)

### 4. UI/UX

**ToolkitCompletionBanner** — Bon
- Détection correcte des piliers vides
- État "complet" avec résumé
- Orchestration séquentielle par pilier (fix timeout)
- Retry des piliers en erreur
- Nit : Le dialog n'a pas de phase "idle" dans l'AnimatePresence — si on ouvre le dialog sans lancer de génération (impossible actuellement), rien ne s'affiche.

**ToolkitAIChatDialog** — Bon
- Scope par pilier ou tout le toolkit
- Messages d'erreur clairs
- Suggestions de prompts
- Auto-scroll
- Nit : Les messages ne sont pas persistés — si on ferme/rouvre le dialog, on perd l'historique. Ce n'est pas forcément un bug mais une limitation.

**ToolkitCardsBrowser** — Bon avec un problème de rendu
- 5 formats de cartes
- Filtres par pilier et phase
- Groupement par pilier/phase/tout
- Slider de colonnes
- Problème : Le `DynamicIcon` recrée un `lazy()` à chaque rendu (ligne 16) car il est dans le corps de la fonction. Cela cause un re-mount à chaque render. Le `lazy()` devrait être mémoïsé ou mis en cache.

**ToolkitCardsTab** — Bon
- Toggle tableau/visuel bien intégré
- L'édition des cartes reste dans la vue tableau (normal)

**AdminToolkitDetail** — Bon
- Banner de complétion visible
- Bouton IA chat visible dans le header
- Badge de comptage de cartes

### 5. SÉCURITÉ

- RLS correctement appliquée sur toutes les tables concernées
- Les edge functions vérifient `is_saas_team` côté serveur
- Le `refine-toolkit` valide les champs modifiables (whitelist)
- Pas d'injection SQL possible (utilisation du SDK typé)
- Les secrets sont correctement configurés

### 6. RÉSUMÉ DES ACTIONS

| Priorité | Issue | Fix |
|----------|-------|-----|
| Haute | `refine-toolkit` absent de `config.toml` | Ajouter l'entrée |
| Haute | `getClaims` non standard dans les 2 edge functions | Remplacer par `getUser()` |
| Moyenne | Warning ref sur Badge dans AnimatePresence | Wrapper dans `<span>` |
| Moyenne | Gamified card `absolute` sans `relative` parent | Ajouter `relative` |
| Faible | `DynamicIcon` recrée `lazy()` à chaque rendu | Mettre en cache avec Map |
| Faible | `refine-toolkit` utilise du JSON libre vs tool calling | Migrer vers tool calling pour fiabilité |

### Fichiers à modifier

| Fichier | Changement |
|---------|-----------|
| `supabase/config.toml` | Ne pas toucher (auto-géré) — mais signaler que `refine-toolkit` manque |
| `supabase/functions/generate-toolkit/index.ts` | Remplacer `getClaims` par `getUser` |
| `supabase/functions/refine-toolkit/index.ts` | Remplacer `getClaims` par `getUser` |
| `src/components/admin/ToolkitCompletionBanner.tsx` | Wrapper Badge dans span pour AnimatePresence |
| `src/components/admin/ToolkitCardsBrowser.tsx` | Ajouter `relative` au parent gamified + cache DynamicIcon |

