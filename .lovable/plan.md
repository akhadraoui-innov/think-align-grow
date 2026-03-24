

# Plan consolidé : Enrichissement Personae + Seed Data complet

## Contexte

Les tables `academy_personae` et `academy_functions` sont vides (0 rows). La table `academy_personae` manque les colonnes `parent_persona_id` et `tags`. L'edge function `generate-persona` utilise encore l'ancien schema (seniority, department, goals) au lieu du schema comportemental. Les archétypes dans le front ont des noms trop familiers.

## Etape 1 — Migration SQL

Ajouter `parent_persona_id` (uuid FK self-referencing, nullable) et `tags` (jsonb, default `'[]'`) a `academy_personae`.

## Etape 2 — Refonte `generate-persona` dans `academy-generate`

Réécrire le prompt et le tool schema pour produire des personae **comportementaux** avec :
- 10 traits numériques (les 5 existants + `collaboration_preference`, `autonomy_level`, `risk_tolerance`, `data_literacy`, `feedback_receptivity`)
- Tags comportementaux : `habits`, `communication_style`, `decision_patterns`, `tech_relationship`, `objections_type`, `engagement_triggers`, `blockers`
- Champs textuels : `typical_day`, `ai_relationship_summary`, `ideal_learning_journey`, `coaching_approach`, `success_indicators`
- Noms corporate (pas de "Sceptique Résistant")

Ajouter action `derive-persona` pour décliner un persona générique vers une org.

## Etape 3 — Refonte `AdminAcademyPersonae.tsx`

- Renommer les archétypes en corporate : "Précurseur Digital", "Décideur Orienté Résultats", "Méthodique Structuré", "Profil en Observation", "Leader Transformationnel", "Professionnel sous Contrainte"
- Radar chart 10 axes
- Sections tags éditables (chips)
- Champs textuels enrichis dans l'éditeur
- Filtre Génériques / par Org
- Bouton "Décliner pour une organisation"

## Etape 4 — Seed 20 fonctions

Insertion directe via SQL des 20 fonctions organisationnelles avec payloads JSONB complets (responsibilities, tools_used, kpis, ai_use_cases). Couvrant : DG, COO, DRH, CMO, CFO, DSI, Responsable Innovation, Data/IA, Formation, Chef Projet Digital, Manager Commercial, Supply Chain, Juriste, Contrôleur de Gestion, Qualité, Relation Client, Communication Interne, Achats, Manager Proximité, Consultant Transformation. Tous status = published.

## Etape 5 — Seed 6 personae

Insertion des 6 archétypes comportementaux corporate avec les 10 traits, tous les tags, et tous les champs textuels :
1. Le Précurseur Digital
2. Le Décideur Orienté Résultats
3. Le Méthodique Structuré
4. Le Profil en Observation
5. Le Leader Transformationnel
6. Le Professionnel sous Contrainte

Tous status = published, organization_id = null (génériques).

## Etape 6 — Seed 4 parcours complets avec modules

4 parcours avec double ciblage (function_id + persona_id) et 4-6 modules chacun :
1. "Cadrer la Stratégie IA pour le COMEX" → DG + Leader Transformationnel
2. "Intégrer l'IA dans les Processus RH" → DRH + Décideur Orienté Résultats
3. "L'IA au Service du Manager de Terrain" → Manager Proximité + Professionnel sous Contrainte
4. "Premiers Pas avec l'IA Générative" → (all) + Méthodique Structuré

~20 modules au total avec types variés (lesson, quiz, exercise, practice).

## Etape 7 — Seed 3 campagnes

Liées aux parcours, à l'org Growthinnov, avec dates réalistes Q2-Q3 2026.

## Fichiers impactés

- **Migration SQL** : ALTER academy_personae (parent_persona_id, tags)
- **Edge function** : `supabase/functions/academy-generate/index.ts` (refonte generate-persona + derive-persona)
- **Front** : `src/pages/admin/AdminAcademyPersonae.tsx` (radar 10 axes, tags, corporate names, org filter, derive button)
- **Data seed** : ~7 INSERT statements via insert tool

## Ordre

1. Migration SQL
2. Edge function refonte
3. Front AdminAcademyPersonae
4. Seed 20 fonctions
5. Seed 6 personae
6. Seed 4 parcours + modules
7. Seed 3 campagnes

