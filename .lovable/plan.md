

# Permissions 100% DB — Domaines et définitions en base de données

## Problème

`PERMISSION_DOMAINS` est un tableau hardcodé de ~200 lignes dans `usePermissions.ts`. Pour ajouter une permission (ex: nouveau module), il faut modifier le code et redéployer. Pas agile.

## Solution

Deux nouvelles tables DB qui remplacent le hardcode :

### Tables

**`permission_domains`** — les groupes fonctionnels
| Colonne | Type | Description |
|---------|------|-------------|
| id | uuid PK | |
| key | text UNIQUE | ex: "admin.toolkits" |
| label | text | ex: "Toolkits" |
| icon | text | nom icône lucide |
| sort_order | int | ordre d'affichage |

**`permission_definitions`** — chaque permission unitaire
| Colonne | Type | Description |
|---------|------|-------------|
| id | uuid PK | |
| key | text UNIQUE | ex: "admin.toolkits.cards" |
| label | text | ex: "Gérer les cartes" |
| description | text | |
| domain_key | text FK→permission_domains.key | rattachement au domaine |
| sort_order | int | |

### Migration SQL

1. Créer les 2 tables avec RLS (lecture pour tous les authenticated, écriture super_admin uniquement)
2. Seed avec les 16 domaines et 64 permissions actuels depuis `PERMISSION_DOMAINS`

### Code

**`src/hooks/usePermissions.ts`** :
- Supprimer le tableau hardcodé `PERMISSION_DOMAINS` (~170 lignes)
- Supprimer `PERMISSION_REGISTRY`, `ALL_PERMISSION_KEYS`, `PERMISSION_LABELS` (dérivés du hardcode)
- Nouveau hook `usePermissionRegistry()` qui charge `permission_domains` + `permission_definitions` depuis la DB
- Reconstruire `PermissionDomain[]` à partir des données DB (même interface TypeScript)
- Les helpers `getDomainCoverage` utilisent les données DB

**`src/components/admin/RolesPermissionsTab.tsx`** :
- Remplacer l'import de `PERMISSION_DOMAINS` par `usePermissionRegistry()`
- Le reste de la logique (switches, comparaison) reste identique

**`src/components/admin/UserRolesTab.tsx`** :
- Même adaptation : utiliser le registry DB

### Ce qui reste dans le code (légitime)

- Les **interfaces TypeScript** (`PermissionDef`, `PermissionDomain`) — ce sont des types, pas des données
- Le hook `usePermissions()` — logique de résolution des permissions utilisateur
- Les helpers (`has`, `hasAny`, `getPermsFromMap`)

### Résultat

- Ajouter une permission = 2 INSERT en DB (domaine si nouveau + définition)
- Modifier un label/description = 1 UPDATE
- Zero redéploiement pour faire évoluer le référentiel
- La table `role_permissions` (existante) lie les rôles aux permission keys
- Les 3 tables forment un système complet : **définitions** → **assignations** → **résolution**

## Fichiers impactés

| Fichier | Action |
|---------|--------|
| Migration SQL | Créer tables + seed 16 domaines + 64 permissions |
| `src/hooks/usePermissions.ts` | Supprimer hardcode, ajouter `usePermissionRegistry()` |
| `src/components/admin/RolesPermissionsTab.tsx` | Utiliser registry DB |
| `src/components/admin/UserRolesTab.tsx` | Utiliser registry DB |

