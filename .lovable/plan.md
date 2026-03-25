

# P3 : Versioning des actifs pédagogiques

## Statut : ✅ Terminé

### 1. Table `academy_asset_versions`
- `id`, `asset_type` (quiz/exercise/practice), `asset_id`, `version_number`, `snapshot` (jsonb), `changed_by`, `change_summary`, `created_at`
- RLS : saas_team uniquement
- Index sur `(asset_type, asset_id, created_at DESC)`

### 2. Trigger `capture_asset_version()`
- BEFORE UPDATE sur `academy_quizzes`, `academy_exercises`, `academy_practices`
- Capture automatique du snapshot OLD + détection des champs modifiés dans `change_summary`

### 3. UI — Historique dans DetailRow
- Composant `VersionHistory` avec toggle, timeline verticale, badges version
- Lazy-load des versions (requête uniquement quand ouvert)
- Intégré dans les 3 onglets (Quiz, Exercices, Pratiques)

# P3b : Extension du versioning aux Parcours, Personae et Campagnes

## Statut : ✅ Terminé

### 1. Migration DB — Trigger étendu
- `capture_asset_version()` supporte désormais 6 tables : quiz, exercise, practice, path, persona, campaign
- Triggers BEFORE UPDATE sur `academy_paths`, `academy_personae`, `academy_campaigns`
- Détection spécifique des champs modifiés par type (difficulty, persona_id, starts_at, characteristics, etc.)

### 2. Composant `VersionHistory` réutilisable
- Extrait dans `src/components/admin/VersionHistory.tsx`
- Props : `assetType` + `assetId`
- Lazy-load, timeline verticale, badges version

### 3. Intégration dans les pages admin
- `AdminAcademyPathDetail.tsx` : section dans l'onglet Informations
- `AdminAcademyPersonae.tsx` : section dans chaque card persona
- `AdminAcademyCampaigns.tsx` : section dans le détail expandable
- `AdminAcademyAssets.tsx` : refactoré pour utiliser le composant partagé

# P4 : Module Observabilité

## Statut : ✅ Terminé

### Architecture
- Agrège `academy_asset_versions` + `activity_logs` — aucune nouvelle table DB
- Hook centralisé `useObservability` avec filtres (org, type, user, période)
- Page `/admin/observability` dans la sidebar Système (permission `admin.logs.view`)

### 4 sections interactives
1. **KPI Cards** : versions totales, contributeurs actifs (30j), organisations actives (30j), modifications aujourd'hui
2. **Graphique AreaChart** : activité empilée par type d'asset sur 28 jours
3. **Fil d'activité** : timeline fusionnée versions + logs avec résolution profils/orgs
4. **Matrice de couverture** : heatmap Organisation × Type avec clic pour filtrer la timeline

### Filtres globaux
- Organisation, type d'asset, période (date range picker)
- Filtre contextuel par clic sur cellule de la matrice
- Export CSV de la vue filtrée
