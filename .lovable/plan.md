## Diagnostic

Le QR code affiché sur `/account/security` est correct : il encode une URI `otpauth://totp/...` standard (générée nativement par Supabase Auth, visible dans le secret `V6ZTCMAUG5UJ...` du screenshot). Le comportement décrit — "le QR code me renvoie un texte" — vient du fait qu'il est scanné avec **l'appareil photo natif du téléphone** (qui affiche l'URI brute) au lieu d'une **application TOTP** (Google Authenticator, Authy, 1Password, Microsoft Authenticator…).

Ce n'est donc pas un bug technique, mais un manque de clarté pédagogique dans l'UI. La page mentionne les apps mais ne les met pas en avant ni ne propose de raccourci direct.

## Plan d'amélioration UX (page Sécurité)

Patcher uniquement `src/pages/account/Security.tsx` — aucun changement backend, aucune migration.

### 1. Bloc "Avant de scanner" (au-dessus du QR code)

Lorsque `enrollment` est actif, insérer une alerte pédagogique :

```
⚠ Le QR code doit être scanné depuis une application d'authentification
  (pas l'appareil photo de votre téléphone).
  
  Apps recommandées : Google Authenticator · Microsoft Authenticator
  · Authy · 1Password · Bitwarden
```

Avec liens stores (iOS App Store + Google Play) en boutons discrets pour Google Authenticator et Microsoft Authenticator.

### 2. Bouton "Ouvrir dans mon app" (mobile)

Ajouter sous le QR code un bouton secondaire `<a href={enrollment.uri}>` avec l'icône `Smartphone`. Sur mobile, cliquer ouvre directement l'app TOTP installée via le scheme `otpauth://`. Sur desktop, le bouton reste affiché mais l'utilisateur est invité à scanner.

### 3. Affichage du label de compte

Décoder l'URI `otpauth://` pour afficher en clair :
- **Compte** : email de l'utilisateur
- **Émetteur** : Heeplab

Cela rassure l'utilisateur qui voit ce qui sera enregistré dans son app.

### 4. Étapes numérotées explicites

Remplacer l'agencement actuel par une liste 1-2-3 :
1. Installez une app d'authentification (liens fournis)
2. Scannez le QR depuis l'app (ou collez le secret manuellement)
3. Entrez le code à 6 chiffres généré

### 5. Gestion d'erreur "code invalide"

Si `verify` échoue, afficher un hint : "Vérifiez que l'heure de votre téléphone est synchronisée automatiquement (les codes TOTP dépendent de l'horloge)."

## Hors périmètre

- Aucune modification de `use2FA`, `Force2FAGuard`, ni des Edge Functions.
- Aucune régénération de secret nécessaire pour les utilisateurs déjà enrôlés.
- Pas de mise à jour de la mémoire projet (changement purement UX).

## Livrable

- `src/pages/account/Security.tsx` patché.
- Note brève dans `docs/releases/v2.9.7-portal-admin-parity-audit.md` (ou nouveau patch note `v2.9.9-2fa-ux-clarity.md`).
