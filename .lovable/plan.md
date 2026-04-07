

# Plan — Fix authentification + reset de mot de passe

## Diagnostic

1. **Bug dans ResetPassword.tsx** : Après `updateUser({ password })`, le code fait `navigate("/auth")` sans `signOut()`. La page Auth détecte la session active et redirige vers `/explore`. L'utilisateur ne vérifie jamais son nouveau mot de passe.

2. **Mot de passe actuel** : Les logs auth montrent 6 tentatives consécutives avec "Invalid login credentials". Le mot de passe actuel est inconnu.

## Actions (2 étapes)

### Étape 1 — Forcer le reset du mot de passe (immédiat)

Créer une edge function temporaire `admin-reset-password` qui utilise le `SUPABASE_SERVICE_ROLE_KEY` pour appeler `supabase.auth.admin.updateUserById()` :

```typescript
const supabaseAdmin = createClient(url, serviceRoleKey, { auth: { autoRefreshToken: false } });
await supabaseAdmin.auth.admin.updateUserById(userId, { password: newPassword });
```

- Appeler la fonction avec le user ID `315af24d-afe3-4162-9b78-45274c0fe5dc` et un mot de passe temporaire connu
- Valider que la connexion fonctionne
- Supprimer la fonction après usage

### Étape 2 — Fix du flow ResetPassword.tsx

Corriger `handleSubmit` pour :
1. Appeler `supabase.auth.updateUser({ password })`
2. Appeler `supabase.auth.signOut()` **après** la mise à jour réussie
3. Afficher le message de succès
4. Rediriger vers `/auth` après 2 secondes

Cela force l'utilisateur à se reconnecter avec son nouveau mot de passe, confirmant qu'il fonctionne.

## Fichiers impactés

| Fichier | Action |
|---------|--------|
| `supabase/functions/admin-reset-password/index.ts` | Créer temporairement → supprimer après usage |
| `src/pages/ResetPassword.tsx` | Ajouter `signOut()` après `updateUser` |

