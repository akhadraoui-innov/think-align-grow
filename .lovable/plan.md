

## Sprint 4.1 : Enrichissement Toolkit, Piliers & Cartes

### Constat actuel
- **ToolkitInfoTab** : seulement nom, slug, emoji, description, statut -- tres basique
- **Piliers** : liste plate non editable (seulement ajout/suppression)
- **Cartes** : tableau lecture seule, aucun clic pour editer

### 1. Migration DB -- Nouveaux champs

**Table `toolkits`** (13 nouvelles colonnes) :
- `target_audience` text -- a qui ca s'adresse
- `benefits` text -- ca apporte quoi  
- `usage_mode` text -- mode d'utilisation
- `content_description` text -- description du contenu
- `credit_cost_workshop` integer default 0 -- cout en credits par workshop
- `credit_cost_challenge` integer default 0 -- cout en credits par challenge
- `price_info` jsonb default '{}' -- tarification (grille libre)
- `terms` text -- conditions d'utilisation
- `nomenclature` text -- nomenclature / classification
- `tags` jsonb default '[]' -- tags/mots-cles
- `difficulty_level` text -- niveau de difficulte
- `estimated_duration` text -- duree estimee
- `version` text default '1.0' -- version du toolkit

**Table `pillars`** (5 nouvelles colonnes) :
- `subtitle` text
- `target_audience` text
- `learning_outcomes` jsonb default '[]'
- `weight` integer default 1 -- ponderation/valorisation
- `status` text default 'active'

**Table `cards`** (6 nouvelles colonnes) :
- `qualification` text -- niveau de qualification
- `valorization` integer default 0 -- points de valorisation
- `difficulty` text -- facile/moyen/avance/expert
- `duration_minutes` integer -- temps estime
- `tags` jsonb default '[]'
- `status` text default 'active'

### 2. ToolkitInfoTab -- 4 sections

**Section 1 : Identite** (existant enrichi)
- Nom, Slug, Emoji, Statut, Version, Niveau de difficulte, Duree estimee, Tags

**Section 2 : Description & Contenu**
- Description generale (textarea)
- A qui ca s'adresse (textarea)
- Ca apporte quoi / Benefices (textarea)
- Mode d'utilisation (textarea)
- Description du contenu (textarea)

**Section 3 : Credits, Tarifs & Conditions**
- Cout credits workshop, Cout credits challenge
- Tarification (champs structures JSON)
- Conditions d'utilisation (textarea)
- Nomenclature (textarea)

**Section 4 : Metadonnees** (existant)

### 3. Piliers -- Expandable avec edition inline

Chaque ligne du tableau de piliers devient cliquable (Collapsible). Au clic, un panneau s'ouvre avec :
- Nom, Slug, Description, Sous-titre, Couleur, Icone, Ordre
- Public cible, Acquis pedagogiques (tags), Ponderation, Statut
- Bouton Enregistrer par pilier

### 4. Cartes -- Dialog d'edition complet

Chaque ligne de carte dans le tableau devient cliquable. Au clic, un `Dialog` s'ouvre avec tous les champs :
- Titre, Sous-titre, Phase, Step name, Icone, Ordre
- Objectif, KPI, Action, Definition
- Qualification, Valorisation (points), Difficulte, Duree
- Tags, Statut
- Bouton Enregistrer + Supprimer

### Fichiers a creer/modifier

| Action | Fichier |
|--------|---------|
| Migration | `supabase/migrations/xxx_enrich_toolkit_pillars_cards.sql` |
| Rewrite | `src/components/admin/ToolkitInfoTab.tsx` |
| Rewrite | `src/components/admin/ToolkitPillarsTab.tsx` |
| Rewrite | `src/components/admin/ToolkitCardsTab.tsx` |

Pas de nouveau fichier de page ni de route. Les composants existants sont enrichis en place.

