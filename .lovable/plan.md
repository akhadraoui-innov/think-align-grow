

# Refonte Rôles & Permissions — UX lisible, fonctionnelle et éditable

## Problèmes identifiés

1. **Colonnes cryptiques** : "SA", "CL", "IL", "PL", "PA" — personne ne comprend ces abréviations
2. **Aucune édition possible** : la matrice est en lecture seule, les permissions sont hardcodées dans le code
3. **Pas de vue par rôle** : quand on sélectionne un rôle, on voit les utilisateurs mais pas un résumé clair de ses droits avec possibilité de les modifier
4. **Matrice trop dense** : 12 rôles × 60+ permissions dans un tableau = illisible

## Solution proposée — 2 vues complémentaires

### Vue 1 : "Détail d'un rôle" (défaut)

Sélection d'un rôle → panneau dédié affichant :
- **En-tête** : nom du rôle, description, nombre d'utilisateurs, couverture globale
- **Par domaine** (accordéon) : chaque permission avec un **Switch on/off** pour activer/désactiver
- **Liste des utilisateurs** ayant ce rôle (existant, conservé)

### Vue 2 : "Comparaison" (toggle)

Matrice simplifiée avec **noms complets des rôles** (pas d'abréviations), limité aux rôles sélectionnés (2-4 max via checkboxes), pour comparer côte à côte.

### Édition : stockage DB

Actuellement les permissions sont hardcodées dans `ROLE_PERMISSION_MAP`. Pour les rendre éditables :

1. **Nouvelle table `role_permissions`** :
   - `role` (app_role enum)
   - `permission_key` (text, ex: "admin.toolkits.cards")
   - Unique constraint sur (role, permission_key)

2. **Seed initial** : migration SQL qui insère toutes les entrées de `ROLE_PERMISSION_MAP` actuel

3. **`usePermissions` modifié** : le hook charge les permissions depuis la DB (avec fallback sur le hardcodé si vide)

4. **Toggle dans l'UI** : un Switch appelle `insert` ou `delete` sur `role_permissions`

## Architecture technique

### Migration SQL

```sql
CREATE TABLE public.role_permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  role app_role NOT NULL,
  permission_key text NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(role, permission_key)
);

-- RLS: only super_admin can manage
ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "super_admin_manage" ON public.role_permissions
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'super_admin'))
  WITH CHECK (public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "authenticated_read" ON public.role_permissions
  FOR SELECT TO authenticated USING (true);

-- Seed from current hardcoded map (all 60+ entries × 12 roles)
INSERT INTO public.role_permissions (role, permission_key) VALUES
  ('super_admin', 'admin.dashboard.view'),
  ('super_admin', 'admin.dashboard.kpis'),
  ... -- all entries from ROLE_PERMISSION_MAP
;
```

### Fichiers impactés

| Fichier | Action | Description |
|---------|--------|-------------|
| Migration SQL | Créer | Table `role_permissions` + seed + RLS |
| `src/hooks/usePermissions.ts` | Modifier | Charger permissions depuis DB au lieu du hardcodé, garder le registre/domaines comme référentiel de structure |
| `src/components/admin/RolesPermissionsTab.tsx` | Réécrire | 2 vues (détail rôle + comparaison), switches éditables, noms complets |
| `src/components/admin/UserRolesTab.tsx` | Léger ajustement | Utiliser les permissions DB (déjà via `usePermissions`) |

### UX du composant RolesPermissionsTab refondu

```text
┌─────────────────────────────────────────────────────┐
│  [Vue Détail ●]  [Vue Comparaison ○]                │
├─────────────────────────────────────────────────────┤
│                                                     │
│  Rôles : [super_admin] [customer_lead] [innov...]   │
│          (cards cliquables, le sélectionné = actif) │
│                                                     │
│  ┌─ super admin ──────────────────────────────────┐ │
│  │  Accès total · 64 permissions · 1 utilisateur  │ │
│  │  ████████████████████████████████████████ 100%  │ │
│  ├────────────────────────────────────────────────┤ │
│  │  ▼ Dashboard Admin (3/3)                       │ │
│  │    [■] Voir le dashboard                       │ │
│  │    [■] Voir les KPIs                           │ │
│  │    [■] Voir les alertes                        │ │
│  │                                                │ │
│  │  ▼ Organisations (8/8)                         │ │
│  │    [■] Voir les organisations                  │ │
│  │    [■] Créer une organisation                  │ │
│  │    [■] Modifier une organisation               │ │
│  │    ...                                         │ │
│  │                                                │ │
│  │  ▼ Utilisateurs — product_actor                │ │
│  │    [user1] [user2]                             │ │
│  └────────────────────────────────────────────────┘ │
│                                                     │
│  Vue Comparaison :                                  │
│  Sélectionner 2-4 rôles à comparer                  │
│  ┌──────────────────┬──────────────┬──────────────┐ │
│  │ Permission       │ Super Admin  │ Innov. Lead  │ │
│  ├──────────────────┼──────────────┼──────────────┤ │
│  │ Voir dashboard   │     ✓        │      ✓       │ │
│  │ Gérer toolkits   │     ✓        │      ✓       │ │
│  │ Gérer billing    │     ✓        │      ✗       │ │
│  └──────────────────┴──────────────┴──────────────┘ │
└─────────────────────────────────────────────────────┘
```

### Critères d'acceptation

- [ ] Table `role_permissions` créée avec seed des permissions actuelles
- [ ] Vue "Détail" : sélectionner un rôle affiche toutes ses permissions par domaine avec des Switches
- [ ] Les Switches modifient la DB en temps réel (insert/delete sur `role_permissions`)
- [ ] Seul un super_admin peut modifier les permissions (RLS + UI)
- [ ] Vue "Comparaison" : sélectionner 2-4 rôles affiche une matrice avec noms complets
- [ ] `usePermissions` charge depuis la DB (fallback hardcodé)
- [ ] Les colonnes de la matrice affichent les noms complets des rôles, pas des abréviations

