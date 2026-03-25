

# Table dédiée `observatory_assets` + Sous-menu Sidebar

## Probleme actuel

Chaque ouverture de la page Observabilité recalcule tout (groupement par `asset_id`, comptages, résolution de noms) depuis `academy_asset_versions`. Avec le volume croissant, ce n'est pas viable. De plus, la table `academy_asset_versions` est vide car les triggers ne sont pas attachés.

## Solution

Créer une table matérialisée `observatory_assets` maintenue automatiquement par des triggers DB. Elle stocke pour chaque asset ses KPIs pré-calculés. Le front-end lit directement cette table sans agrégation.

## Plan

### 1. Migration SQL

**Table `observatory_assets`** : un enregistrement par asset unique, mis à jour automatiquement.

```sql
CREATE TABLE public.observatory_assets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_id uuid NOT NULL,
  asset_type text NOT NULL,
  name text NOT NULL DEFAULT '',
  organization_id uuid,
  status text DEFAULT 'draft',
  version_count integer NOT NULL DEFAULT 0,
  contributor_count integer NOT NULL DEFAULT 0,
  contributor_ids uuid[] NOT NULL DEFAULT '{}',
  last_modified_at timestamptz NOT NULL DEFAULT now(),
  last_modified_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  snapshot jsonb NOT NULL DEFAULT '{}',
  UNIQUE(asset_type, asset_id)
);

ALTER TABLE public.observatory_assets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "saas_manage_observatory" ON public.observatory_assets
  FOR ALL TO authenticated
  USING (is_saas_team(auth.uid()))
  WITH CHECK (is_saas_team(auth.uid()));

CREATE POLICY "saas_view_observatory" ON public.observatory_assets
  FOR SELECT TO authenticated
  USING (is_saas_team(auth.uid()));
```

**Fonction trigger `sync_observatory_asset()`** : s'exécute AFTER INSERT OR UPDATE sur les 6 tables d'assets. Elle fait un UPSERT dans `observatory_assets` avec le nom, org, status, et incrémente les compteurs.

```sql
CREATE OR REPLACE FUNCTION public.sync_observatory_asset()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $$
DECLARE
  _asset_type text;
  _name text;
  _org_id uuid;
  _status text;
BEGIN
  CASE TG_TABLE_NAME
    WHEN 'academy_paths' THEN _asset_type := 'path';
    WHEN 'academy_quizzes' THEN _asset_type := 'quiz';
    WHEN 'academy_exercises' THEN _asset_type := 'exercise';
    WHEN 'academy_practices' THEN _asset_type := 'practice';
    WHEN 'academy_personae' THEN _asset_type := 'persona';
    WHEN 'academy_campaigns' THEN _asset_type := 'campaign';
    ELSE _asset_type := TG_TABLE_NAME;
  END CASE;

  -- Extract name (title or name field)
  _name := COALESCE(NEW.name, NEW.title, '');
  _org_id := NEW.organization_id;
  _status := NEW.status;

  INSERT INTO observatory_assets (asset_id, asset_type, name, organization_id, status, version_count, last_modified_at, last_modified_by, created_at, snapshot)
  VALUES (NEW.id, _asset_type, _name, _org_id, _status, 
    CASE WHEN TG_OP = 'INSERT' THEN 0 ELSE 1 END,
    now(), auth.uid(), 
    CASE WHEN TG_OP = 'INSERT' THEN NEW.created_at ELSE now() END,
    to_jsonb(NEW))
  ON CONFLICT (asset_type, asset_id) DO UPDATE SET
    name = EXCLUDED.name,
    organization_id = EXCLUDED.organization_id,
    status = EXCLUDED.status,
    version_count = observatory_assets.version_count + 1,
    contributor_ids = CASE 
      WHEN auth.uid() = ANY(observatory_assets.contributor_ids) THEN observatory_assets.contributor_ids
      WHEN auth.uid() IS NULL THEN observatory_assets.contributor_ids
      ELSE observatory_assets.contributor_ids || auth.uid()
    END,
    contributor_count = CASE
      WHEN auth.uid() = ANY(observatory_assets.contributor_ids) OR auth.uid() IS NULL THEN observatory_assets.contributor_count
      ELSE observatory_assets.contributor_count + 1
    END,
    last_modified_at = now(),
    last_modified_by = auth.uid(),
    snapshot = to_jsonb(NEW);

  RETURN NEW;
END;
$$;
```

**Attacher les triggers** sur les 6 tables + les triggers de versioning existants :

```sql
-- Observatory sync triggers (AFTER INSERT OR UPDATE)
CREATE TRIGGER trg_obs_paths AFTER INSERT OR UPDATE ON academy_paths
  FOR EACH ROW EXECUTE FUNCTION sync_observatory_asset();
-- ... idem pour quizzes, exercises, practices, personae, campaigns

-- Versioning triggers (BEFORE UPDATE) - la fonction capture_asset_version existe déjà
CREATE TRIGGER trg_version_paths BEFORE UPDATE ON academy_paths
  FOR EACH ROW EXECUTE FUNCTION capture_asset_version();
-- ... idem pour les 5 autres tables
```

**Seed initial** : insérer tous les assets existants dans `observatory_assets` :

```sql
INSERT INTO observatory_assets (asset_id, asset_type, name, organization_id, status, created_at, snapshot)
SELECT id, 'path', name, organization_id, status, created_at, to_jsonb(p) FROM academy_paths p
UNION ALL
SELECT id, 'quiz', title, organization_id, COALESCE(NULL, 'active'), created_at, to_jsonb(q) FROM academy_quizzes q
-- ... idem pour exercises, practices, personae, campaigns
ON CONFLICT DO NOTHING;
```

### 2. Sidebar : sous-menu collapsible Observabilité

Transformer le lien simple en groupe collapsible (pattern Academy) :

```text
Systeme
  ├── Credits & Abonnements
  ├── Logs d'activité
  ├── Paramètres
  └── ▼ Observabilité
       ├── Vue d'ensemble      (/admin/observability)
       ├── Catalogue Assets    (/admin/observability/catalogue)
       └── Matrice Couverture  (/admin/observability/matrix)
```

Fichier : `AdminSidebar.tsx` -- ajouter un bloc `Collapsible` identique au pattern Academy.

### 3. Nouvelles pages

| Page | Route | Contenu |
|------|-------|---------|
| `AdminObservability.tsx` | `/admin/observability` | KPIs + graphique + timeline (épuré, sans catalogue) |
| `AdminObservabilityCatalogue.tsx` | `/admin/observability/catalogue` | Table lisant directement `observatory_assets` avec filtres type/org/recherche + collapse vers `academy_asset_versions` |
| `AdminObservabilityMatrix.tsx` | `/admin/observability/matrix` | Heatmap org x type depuis `observatory_assets` (agrégation simple GROUP BY) |

### 4. Hook simplifié

Le hook `useObservability` est allégé : le catalogue vient d'un simple `SELECT * FROM observatory_assets` avec filtres. La matrice se fait par un `GROUP BY organization_id, asset_type` sur la même table. Plus de `useMemo` lourd côté client.

### Fichiers modifiés

| Fichier | Action |
|---------|--------|
| Migration SQL | Créer table + triggers + seed |
| `src/hooks/useObservability.ts` | Simplifier : lire `observatory_assets` au lieu d'agréger |
| `src/pages/admin/AdminObservability.tsx` | Retirer le catalogue (déplacé) |
| `src/pages/admin/AdminObservabilityCatalogue.tsx` | Nouveau -- catalogue dédié |
| `src/pages/admin/AdminObservabilityMatrix.tsx` | Nouveau -- matrice dédiée |
| `src/components/admin/AdminSidebar.tsx` | Sous-menu collapsible |
| `src/App.tsx` | 3 sous-routes |

