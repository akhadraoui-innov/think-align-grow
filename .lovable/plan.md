

# P3b : Extension du versioning aux Parcours, Personae et Campagnes

## Contexte

Le moteur de versioning (`academy_asset_versions` + trigger `capture_asset_version`) fonctionne actuellement pour les actifs pedagogiques (quiz, exercises, practices). L'objectif est d'etendre ce meme systeme aux 3 entites structurantes de l'Academy, avec une dimension multi-org native.

## 1. Migration DB — Etendre le trigger existant

Modifier la fonction `capture_asset_version()` pour supporter 3 nouvelles tables via le `CASE TG_TABLE_NAME` :

| Table | asset_type | Colonnes trackees |
|-------|-----------|-------------------|
| `academy_paths` | `path` | name, description, difficulty, status, estimated_hours, tags, persona_id, function_id, certificate_enabled, organization_id |
| `academy_personae` | `persona` | name, description, characteristics, status, tags, organization_id, parent_persona_id, avatar_url |
| `academy_campaigns` | `campaign` | name, description, status, starts_at, ends_at, reminder_config, path_id, organization_id |

Creer 3 triggers `BEFORE UPDATE` sur ces tables, identiques au pattern existant.

```text
capture_asset_version()
  ├── academy_quizzes    → 'quiz'       (existant)
  ├── academy_exercises  → 'exercise'   (existant)
  ├── academy_practices  → 'practice'   (existant)
  ├── academy_paths      → 'path'       (nouveau)
  ├── academy_personae   → 'persona'    (nouveau)
  └── academy_campaigns  → 'campaign'   (nouveau)
```

## 2. UI — Composant `VersionHistory` reutilisable

Extraire le composant `VersionHistory` actuellement inline dans `AdminAcademyAssets.tsx` en un composant partage (`src/components/admin/VersionHistory.tsx`) avec l'interface :

```typescript
interface VersionHistoryProps {
  assetType: string;  // 'path' | 'persona' | 'campaign' | ...
  assetId: string;
}
```

## 3. Integration dans les pages existantes

| Page | Emplacement |
|------|-------------|
| `AdminAcademyPathDetail.tsx` | Nouvelle section collapsible "Historique des versions" dans le panneau d'infos |
| `AdminAcademyPersonae.tsx` | Section dans le detail/card expandable de chaque persona |
| `AdminAcademyCampaigns.tsx` | Section dans le detail expandable de chaque campagne |

Chaque integration affiche l'organisation associee dans la timeline quand `organization_id` est present dans le snapshot, permettant de tracer les modifications cross-org.

## 4. Fichiers modifies

| Fichier | Modification |
|---------|-------------|
| Migration SQL | `CREATE OR REPLACE FUNCTION capture_asset_version()` + 3 triggers |
| `src/components/admin/VersionHistory.tsx` | Nouveau composant extrait |
| `src/pages/admin/AdminAcademyAssets.tsx` | Remplacer inline par import du composant |
| `src/pages/admin/AdminAcademyPathDetail.tsx` | Ajouter section VersionHistory |
| `src/pages/admin/AdminAcademyPersonae.tsx` | Ajouter section VersionHistory |
| `src/pages/admin/AdminAcademyCampaigns.tsx` | Ajouter section VersionHistory |

