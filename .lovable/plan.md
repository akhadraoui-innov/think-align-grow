

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
