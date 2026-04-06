

# Plan — Fix : Projet UCM introuvable (session auth expirée)

## Diagnostic

L'analyse des requêtes réseau révèle que le token `authorization` envoyé est la **clé anon** (pas un JWT utilisateur). Cela signifie que `auth.uid()` est `null` côté RLS, donc la requête retourne 0 lignes et la page affiche "Aucun projet".

**Cause racine** : les routes `/portal/*` n'ont **aucun AuthGuard**. Quand la session expire ou que l'utilisateur ouvre un nouvel onglet, il accède à la page sans être authentifié et rien ne s'affiche.

Votre projet "Renault" existe bien en base (vérifié : `c69180f8`, org `c20a26a5`, status `in_progress`).

## Solution

### 1. Ajouter AuthGuard sur PortalShell

Protéger toutes les routes `/portal/*` en intégrant `AuthGuard` dans `PortalShell.tsx`. Si l'utilisateur n'est pas connecté, il sera redirigé vers `/auth`.

**Fichier** : `src/components/portal/PortalShell.tsx`
- Importer `AuthGuard` depuis `@/components/auth/AuthGuard`
- Envelopper le contenu du return dans `<AuthGuard>...</AuthGuard>`

### 2. Vérification immédiate

Après le fix, l'utilisateur sera redirigé vers `/auth` s'il n'est pas connecté. Après connexion, il retrouvera son projet "Renault" sur `/portal/ucm`.

## Fichier impacté

| Fichier | Changement |
|---------|-----------|
| `src/components/portal/PortalShell.tsx` | Wrapper `AuthGuard` autour du contenu |

