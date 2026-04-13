

# Plan — Historisation des devis avec gestion de statuts et versioning

## Contexte

Actuellement les devis sont éphémères (state local, perdus au refresh). Il faut :
- Persister chaque devis en base
- Statuts : `draft` → `sent` (verrouillé)
- Modifiable tant que `draft`
- Si `sent`, on peut créer une nouvelle version (duplication + incrémentation version)
- Liste des devis existants avec filtres

## Architecture

### 1. Table `business_quotes` (migration)

```sql
CREATE TABLE public.business_quotes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  prospect_name text NOT NULL,
  segment text NOT NULL,
  user_count integer NOT NULL DEFAULT 50,
  challenges text DEFAULT '',
  sale_model_id text NOT NULL,
  role_configs jsonb NOT NULL DEFAULT '[]',
  selected_setup_ids jsonb NOT NULL DEFAULT '[]',
  selected_service_ids jsonb NOT NULL DEFAULT '[]',
  engagement_months integer NOT NULL DEFAULT 12,
  totals jsonb NOT NULL DEFAULT '{}',
  quote_markdown text DEFAULT '',
  status text NOT NULL DEFAULT 'draft',  -- draft | sent
  version integer NOT NULL DEFAULT 1,
  parent_quote_id uuid REFERENCES public.business_quotes(id),
  created_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.business_quotes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "saas_manage_quotes" ON public.business_quotes
  FOR ALL TO authenticated
  USING (is_saas_team(auth.uid()))
  WITH CHECK (is_saas_team(auth.uid()));
```

### 2. Refonte `BusinessQuoteTab.tsx`

**Layout en 2 zones :**

**Zone gauche — Liste des devis** (sidebar étroite ou top section)
- Liste des devis sauvegardés (prospect, segment, statut, version, date)
- Badge statut : `draft` (jaune), `sent` (vert verrouillé)
- Boutons : Nouveau, Dupliquer (pour les `sent`)
- Clic → charge le devis dans le configurateur

**Zone droite — Configurateur** (existant, enrichi)
- Bouton "Sauvegarder" → upsert en base (insert si nouveau, update si draft existant)
- Bouton "Marquer comme envoyé" → passe status à `sent`, verrouille tous les champs
- Si devis `sent` : tous les inputs disabled, bouton "Nouvelle version" qui duplique avec version+1 et status=draft
- Le markdown généré par l'IA est stocké dans `quote_markdown`
- Affichage du markdown dans une zone premium (EnrichedMarkdown ou prose) avec toggle édition quand draft

**Logique de versioning :**
- `parent_quote_id` pointe vers le devis précédent
- `version` s'incrémente automatiquement
- On peut naviguer entre versions via la liste

### 3. Fichiers impactés

| Fichier | Action |
|---------|--------|
| Migration SQL | **Créer** table `business_quotes` + RLS |
| `BusinessQuoteTab.tsx` | **Refonte** — ajouter liste devis, CRUD, statuts, verrouillage, versioning |

### 4. Ordre d'exécution
1. Migration : créer la table `business_quotes`
2. Refonte `BusinessQuoteTab.tsx` : liste + CRUD + statuts + versioning + édition markdown

