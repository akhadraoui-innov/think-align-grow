

# PRD Sprint 10 — Rôles & Permissions, Dashboards Métier, Paramètres Plateforme

---

## 1. Contexte et Problèmes

### 1.1 Gestion des rôles : aucune vue dédiée
- Les rôles se gèrent uniquement dans la fiche d'un utilisateur individuel (onglet Rôles)
- **Aucune vue globale** pour voir tous les rôles, les utilisateurs associés, et la matrice de permissions
- Quand on attribue un rôle (ex: `innovation_lead`), **on ne voit pas** quelles permissions ça déverrouille
- La légende des rôles dans `UserRolesTab` est statique et déconnectée de la logique réelle de `usePermissions`

### 1.2 Dashboards non pertinents
- **Admin Dashboard** : 4 KPIs génériques (orgs, users, workshops, crédits), graphique "sessions par semaine" avec 0 data (les `weeklyWorkshops` sont calculés mais jamais remplis depuis la DB), top users par XP seul
- **Aucune métrique métier** : pas de toolkits publiés, pas de cartes totales, pas de taux d'engagement, pas de challenges, pas de répartition des rôles
- **User Dashboard** : stats basiques, pas de barre de progression XP, pas de recommandations, pas d'activité org

### 1.3 Paramètres trop limités
- La page `/admin/settings` ne gère que la config IA (3 onglets : IA, Fournisseurs, Prompts par défaut)
- Pas de paramètres généraux, pas de gestion visuelle des rôles/permissions

---

## 2. Fonctionnalités à développer

### A. Page "Rôles & Permissions" dans AdminSettings

**Nouvel onglet** dans `/admin/settings` + nouveau composant `RolesPermissionsTab`.

**Contenu :**

1. **Matrice rôles × permissions** — Tableau visuel :
   - Lignes : les 12 rôles de l'enum `app_role`
   - Colonnes : les 10 permissions de `usePermissions` (canManageOrgs, canManageUsers, canManageToolkits, canManageWorkshops, canViewBilling, canViewLogs, canManageSettings, canManageDesignInnovation, canEditPlatformOwner, isSaasTeam)
   - Cellules : checkmark vert si le rôle donne cette permission, vide sinon
   - Calculé **en live** depuis la logique de `usePermissions` (pas de données DB supplémentaires)
   - Séparation visuelle : rôles SaaS (super_admin, customer_lead, innovation_lead, performance_lead, product_actor) vs rôles client (owner, admin, member, lead, facilitator, manager, guest)

2. **Compteurs par rôle** — Pour chaque rôle, nombre d'utilisateurs assignés (requête `user_roles` groupée)

3. **Liste des utilisateurs par rôle** — Clic sur un rôle pour voir ses membres (mini-liste avec lien vers fiche user)

**Source de données :** `usePermissions` (logique) + requête `user_roles` avec `group by role` pour les compteurs + requête détail avec jointure `profiles` pour les listes.

**Fichiers :**
- `src/components/admin/RolesPermissionsTab.tsx` — **Nouveau**
- `src/pages/admin/AdminSettings.tsx` — Ajouter onglet "Rôles & Permissions" avec icône `ShieldAlert`
- `src/components/admin/AdminSidebar.tsx` — Pas de changement (Settings déjà visible pour canManageSettings)

### B. Permissions visibles dans UserRolesTab

Quand un utilisateur a des rôles, afficher **sous chaque badge de rôle** les permissions qu'il déverrouille.

**Détail :**
- Pour chaque rôle attribué, calculer les permissions qu'il apporte en utilisant la même logique que `usePermissions`
- Afficher en dessous du badge : petits chips "Gestion Orgs", "Gestion Toolkits", etc. en `text-[10px]`
- Quand on sélectionne un rôle dans le dropdown "Ajouter", prévisualiser les permissions que ça ajouterait (en italique ou opacité réduite)

**Implémentation :**
- Extraire la logique de mapping `role → permissions[]` depuis `usePermissions` dans un helper exporté `getPermissionsForRole(role: string): string[]`
- L'utiliser dans `UserRolesTab` et dans `RolesPermissionsTab`

**Fichiers :**
- `src/hooks/usePermissions.ts` — Exporter `ROLE_PERMISSION_MAP` et `getPermissionsForRole()`
- `src/components/admin/UserRolesTab.tsx` — Afficher permissions par rôle + preview

### C. Dashboard Admin enrichi — Métriques métier

Refonte complète du dashboard pour refléter l'activité réelle de la plateforme Hack & Show.

**KPIs (8 cards, 2 lignes de 4) :**

| KPI | Source |
|-----|--------|
| Organisations actives | `organizations` count |
| Utilisateurs | `profiles` count |
| Toolkits publiés | `toolkits` count where status = 'published' |
| Cartes totales | `toolkit_cards` count |
| Workshops ce mois | `workshops` count this month |
| Challenges complétés | `challenge_sessions` count where status = 'completed' |
| Crédits consommés | `credit_transactions` sum where type = 'spent' |
| Quiz réalisés | `quiz_results` count |

**Graphiques (2 lignes) :**

1. **Workshops par semaine** (12 semaines) — BarChart avec données réelles depuis `workshops.created_at`
2. **Croissance utilisateurs** — LineChart cumulative (déjà en place, garder)
3. **Répartition des rôles** — PieChart/donut depuis `user_roles` group by role

**Tableaux (3 colonnes) :**

1. **Top 5 organisations** par activité (workshops count) — requête `workshops` group by `organization_id` avec jointure `organizations`
2. **Alertes** — Abonnements expirant + orgs sans toolkit + utilisateurs à 0 crédits
3. **Activité récente** — Garder tel quel

**Fichiers :**
- `src/hooks/useAdminStats.ts` — Ajouter queries : toolkits publiés, cartes totales, challenges complétés, quiz count, workshops par semaine réels, rôles distribution, top orgs
- `src/pages/admin/AdminDashboard.tsx` — Refonte layout avec 8 KPIs, 3 graphiques, 3 tableaux

### D. Dashboard Utilisateur enrichi

Améliorer le dashboard user avec progression et contexte organisationnel.

**Ajouts :**

1. **Barre de progression XP** — Niveau actuel + % vers le niveau suivant (niveau = xp / 100 + 1, progression = xp % 100)
2. **Organisation active** — Card avec nom de l'org, rôle, lien vers les workshops de l'org
3. **Recommandation toolkit** — Si l'org a un toolkit assigné, afficher "Continuer votre toolkit" avec progression (cartes vues / cartes totales)
4. **Badges favoris** — Compteur de cartes bookmarkées avec lien vers `/explore`

**Fichier :**
- `src/pages/Index.tsx` — Enrichir `UserDashboard` avec barre XP, card org, recommandation

---

## 3. Architecture technique

### Nouveau helper de permissions

```text
src/hooks/usePermissions.ts
├── ROLE_PERMISSION_MAP: Record<string, string[]>
│   Exemple: { super_admin: ["all"], customer_lead: ["canManageOrgs", "canManageUsers", ...] }
├── getPermissionsForRole(role): string[]
│   Retourne les permissions déverrouillées par un rôle spécifique
├── PERMISSION_LABELS: Record<string, string>
│   Mapping technique → français: { canManageOrgs: "Gestion Organisations", ... }
└── usePermissions() — existant, inchangé
```

### Requêtes ajoutées dans useAdminStats

```text
Promise.all([
  ...existantes...,
  supabase.from("toolkits").select("id", { count: "exact", head: true }).eq("status", "published"),
  supabase.from("toolkit_cards").select("id", { count: "exact", head: true }),
  supabase.from("challenge_sessions").select("id", { count: "exact", head: true }),
  supabase.from("quiz_results").select("id", { count: "exact", head: true }),
  supabase.from("user_roles").select("role"),
  supabase.from("workshops").select("created_at, organization_id, organizations(name)"),
])
```

Les workshops par semaine seront calculés côté client en filtrant `workshops.created_at` sur les 12 dernières semaines.

### Nouveau composant RolesPermissionsTab

```text
RolesPermissionsTab
├── useQuery["admin-role-counts"] → user_roles group by role + profiles join
├── Matrice calculée depuis ROLE_PERMISSION_MAP (pas de requête)
├── État local: selectedRole (pour la liste détaillée)
└── Mini DataTable pour les utilisateurs du rôle sélectionné
```

---

## 4. Fichiers impactés

| Fichier | Action | Description |
|---------|--------|-------------|
| `src/hooks/usePermissions.ts` | Modifier | Exporter `ROLE_PERMISSION_MAP`, `getPermissionsForRole()`, `PERMISSION_LABELS` |
| `src/components/admin/RolesPermissionsTab.tsx` | **Créer** | Matrice rôles/permissions + compteurs + liste users par rôle |
| `src/pages/admin/AdminSettings.tsx` | Modifier | Ajouter onglet "Rôles & Permissions" |
| `src/components/admin/UserRolesTab.tsx` | Modifier | Afficher permissions par rôle + preview à l'ajout |
| `src/hooks/useAdminStats.ts` | Modifier | Ajouter 6 requêtes métier + calcul workshops réels par semaine + distribution rôles |
| `src/pages/admin/AdminDashboard.tsx` | Modifier | Refonte : 8 KPIs, 3 graphiques (bar, line, pie), 3 tableaux |
| `src/pages/Index.tsx` | Modifier | Barre XP, card org active, recommandation toolkit |

**Aucune migration DB nécessaire** — toutes les tables existent déjà.

---

## 5. Critères d'acceptation

- [ ] Page Settings > onglet "Rôles & Permissions" affiche la matrice complète des 12 rôles × 10 permissions
- [ ] Clic sur un rôle dans la matrice affiche la liste des utilisateurs avec ce rôle
- [ ] Dans la fiche user (UserRolesTab), chaque rôle attribué montre ses permissions en chips
- [ ] Le dropdown "Ajouter un rôle" prévisualise les permissions avant ajout
- [ ] Dashboard admin affiche 8 KPIs dont toolkits publiés, cartes totales, challenges, quiz
- [ ] Le graphique "Workshops par semaine" affiche des données réelles (pas des zéros)
- [ ] Le PieChart montre la répartition des rôles de la plateforme
- [ ] Le tableau "Top organisations" classe les orgs par nombre de workshops
- [ ] Dashboard user affiche une barre de progression XP avec niveau
- [ ] Dashboard user affiche l'organisation active et son rôle

