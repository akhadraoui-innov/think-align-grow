

# Plan v2.5 — Gouvernance, Traçabilité & Gestion utilisateurs

## Décisions verrouillées
1. **Q1 = C** — Traçabilité **complète niveau base de données via triggers** (audit exhaustif, conformité SOC2/ISO)
2. **Q2 = B** — Système d'invitations **robuste** : table `organization_invitations` avec token, expiration 7j, page d'acceptation
3. **Q3 = B** — Présence `last_seen_at` mise à jour **à chaque changement de page** (faible coût)

---

## Phase 1 — Traçabilité complète via triggers DB

**Objectif :** chaque action sensible laisse une trace automatique, sans dépendre du code client.

**Migration SQL :**
- Créer fonction `log_activity()` générique (insère dans `activity_logs` avec `actor_id`, `action`, `entity_type`, `entity_id`, `metadata`, `organization_id`)
- Triggers `AFTER INSERT/UPDATE/DELETE` sur :
  - `organizations` → `org.created/updated/deleted`
  - `organization_members` → `org.member.added/role_changed/removed`
  - `user_roles` → `user.role.granted/revoked`
  - `teams` & `team_members` → `team.*`
  - `user_credits` & `credit_transactions` → `credits.adjusted/spent/earned`
  - `role_permissions` → `permission.toggled`
  - `profiles` (status change) → `user.suspended/reactivated`
- Index sur `(organization_id, created_at DESC)` et `(actor_id, created_at DESC)` pour lecture rapide
- Hook client `useActivityLog` pour les events non-DB (login/logout/page_view critiques) appelant un edge function `log-activity`

**Affichage :**
- Refonte `/admin/logs` : filtres (organisation, acteur, type d'action, plage de dates), pagination, export CSV
- Onglet "Activité" enrichi dans détail org et détail user

---

## Phase 2 — Invitations email complètes

**Migration SQL :**
- Table `organization_invitations` : `id`, `organization_id`, `email`, `role`, `token (uuid unique)`, `invited_by`, `expires_at (default now()+7d)`, `accepted_at`, `created_at`
- RLS : org admins peuvent créer/voir invitations de leur org ; SaaS team voit tout ; invité (non-authentifié) accède via token
- Fonction `accept_invitation(_token uuid)` SECURITY DEFINER : vérifie validité, crée `organization_members`, marque `accepted_at`

**Edge Function `send-invitation` :**
- Reçoit `{ email, organization_id, role }`
- Génère token, insert en DB, envoie email branded via infra email Lovable existante
- Lien : `https://heeplab.com/invitation/:token`

**UI :**
- Activer bouton "Inviter" dans `OrgMembersTab` → modal (email + select rôle)
- Section "Invitations en attente" dans `OrgMembersTab` (renvoyer / révoquer)
- Nouvelle page `/invitation/:token` :
  - Si non connecté → propose signup/login (email pré-rempli)
  - Si connecté → bouton "Rejoindre l'organisation" qui appelle `accept_invitation`

*(Email infra : si pas encore configurée, dialog domaine email proposé en amont)*

---

## Phase 3 — Sécurité owner & cohérence profils

**Migration SQL :**
- Trigger `BEFORE DELETE/UPDATE` sur `organization_members` : empêche retrait/dégradation si `role='owner'` ET dernier owner de l'org (raise exception)
- Mise à jour `handle_new_user` : copie `NEW.email` dans `profiles.email`
- Backfill : `UPDATE profiles SET email = (SELECT email FROM auth.users WHERE id = profiles.user_id) WHERE email IS NULL`

**UI :**
- `OrgMembersTab` : compléter le menu déroulant avec **owner** et **guest**
- Message d'erreur clair si tentative de retrait du dernier owner

---

## Phase 4 — Présence (`last_seen_at` à chaque navigation)

- Hook `useLastSeenTracker` dans `AppShell` et `PortalShell` : sur chaque changement de `location.pathname`, appel debounced (max 1×/30s) à `UPDATE profiles SET last_seen_at = now() WHERE user_id = auth.uid()`
- Indicateur visuel "En ligne" si `last_seen_at < 5min` dans `OrgMembersTab` et `AdminUsers`

---

## Phase 5 — Refonte gestion équipes (`team_members` actif)

- Nouvelle modal "Gérer les membres" dans `OrgTeamsTab` :
  - Liste des membres de l'organisation avec checkboxes
  - Sélection du `lead_user_id`
  - Bulk insert/delete dans `team_members`
- Affichage avatars empilés (max 5 + compteur) dans la liste des équipes
- Filtre "Membre de l'équipe" dans détail équipe

---

## Phase 6 — UX admin utilisateurs enrichie

**`AdminUsers.tsx` :**
- Colonne **Email** visible (lecture depuis `profiles.email`)
- Filtre déroulant par **rôle** (multi-select)
- Filtre par **organisation**
- Filtre par **statut** (actif / suspendu)
- Compteur dynamique en haut

**`UserInfoTab.tsx` :**
- Toggle **"Suspendre / Réactiver"** (update `profiles.status` entre `active` et `suspended`)
- Affichage statut avec badge coloré
- Section "Dernière activité" avec 5 derniers événements de `activity_logs`

---

## Phase 7 — Hardening sécurité

- Activer **Leaked Password Protection** (HIBP check) via configuration auth
- Restreindre policies SELECT publiques sur buckets `avatars` et `academy-assets` aux fichiers du user/org propriétaire
- Lancer le linter Supabase final pour valider

---

## Hors scope (à traiter ultérieurement)

- Suppression définitive d'un compte (RGPD) — Edge Function dédiée service-role
- SSO entreprise / 2FA
- Séparation enum `app_role` vs `org_role` (refacto v2.6)
- Webhook `auth.user.deleted` (dépend du plan Supabase)

---

## Fichiers impactés

**SQL (1 migration majeure)** : triggers `log_activity`, table `organization_invitations`, fonction `accept_invitation`, triggers owner-protection, `handle_new_user` mise à jour, backfill emails, policies bucket.

**Edge Functions** : `send-invitation` (nouveau), `log-activity` (nouveau, optionnel pour events non-DB).

**Hooks (nouveaux)** : `useActivityLog`, `useLastSeenTracker`, `useInvitations`.

**Composants modifiés** :
- `src/components/admin/OrgMembersTab.tsx` (invitations, owner protection, rôles complets)
- `src/components/admin/OrgTeamsTab.tsx` (gestion membres équipe)
- `src/components/admin/UserInfoTab.tsx` (suspension, activité récente)
- `src/components/layout/AppShell.tsx` + `PortalShell.tsx` (heartbeat last_seen)
- `src/pages/admin/AdminUsers.tsx` (filtres, email)
- `src/pages/admin/AdminLogs.tsx` (refonte filtres + export CSV)

**Pages nouvelles** :
- `src/pages/Invitation.tsx` (acceptation invitation via token)

**Documentation** : `docs/releases/v2.5-governance.md` créée en clôture.

---

## Livrables attendus

1. ✅ Toute action sensible **automatiquement tracée** en base, visible dans `/admin/logs` avec filtres puissants
2. ✅ Bouton **"Inviter"** fonctionnel : envoi email branded, page d'acceptation, expiration 7j
3. ✅ **Impossible** de laisser une organisation sans propriétaire
4. ✅ **Email** des utilisateurs visible et synchronisé partout
5. ✅ Indicateur **"En ligne"** réel basé sur dernière navigation
6. ✅ **Équipes** réellement utilisables (gestion membres + lead)
7. ✅ Écran **Utilisateurs** filtrable par rôle/org/statut, suspension en 1 clic
8. ✅ **Mots de passe compromis** bloqués au signup/changement
9. ✅ **Buckets** sécurisés au niveau fichier

