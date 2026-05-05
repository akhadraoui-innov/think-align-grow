## Problème

Chaque page admin instancie `<AdminShell>` qui contient `<AdminGuard>` + `<Force2FAGuard>`. À chaque navigation, ces guards se démontent/remontent, refont des RPC (`is_saas_team`, `requires_2fa`) et affichent pendant ~200-500 ms un **spinner plein écran sur fond `bg-background`** → flash blanc visible entre chaque page.

## Correction

Cacher en mémoire (module-level `Map<userId, boolean>`) le résultat des RPC dans les trois guards. Au remount, si la valeur est connue, rendre les enfants **immédiatement** et revalider en arrière-plan silencieusement.

### Fichiers

**`src/hooks/useAdminRole.ts`** — Cache `adminCache: Map<string, boolean>`. État initial : `loading=false` si l'user est dans le cache.

**`src/components/auth/Force2FAGuard.tsx`** — Cache `twoFaCache: Map<string, boolean>`. État initial `checking=false` si connu.

**`src/components/auth/AuthGuard.tsx`** — Le hook `useAuth` initialise déjà `loading=true` puis appelle `getSession()`. On laisse le 1er montage tel quel, mais on supprime le wrapper `min-h-screen` du loader pour qu'un éventuel flash soit visuellement contenu (overlay discret centré au lieu d'un blanc plein).

### Bénéfices

- Aucune page blanche entre les navigations admin (1ère visite : spinner court ; suivantes : transition directe).
- L'`AnimatePresence` framer-motion d'`App.tsx` peut enfin jouer le fade entre routes.
- Sécurité inchangée : RLS reste source de vérité, le cache est un hint UI ; les RPC continuent à tourner pour invalider.

### Hors périmètre

- Pas de modification du `AppShell` ni des pages individuelles.
- Pas de migration ni d'edge function.
