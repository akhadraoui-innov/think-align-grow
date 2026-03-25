

# Génération de campagnes par IA — 3 modes

## Objectif

Ajouter un dialogue de génération IA à la page Campagnes (`AdminAcademyCampaigns.tsx`) avec les 3 modes existants (Guidé, Corporate, Chat), en enrichissant le contexte envoyé à l'IA avec les données de l'organisation, ses membres, les parcours disponibles, les fonctions et personae.

## Contexte enrichi pour l'IA

La campagne est l'entité la plus riche en contexte car elle croise :
- **Organisation** : nom, secteur, taille (nb membres), groupe
- **Parcours disponibles** : nom, difficulté, nb modules, fonction/persona ciblés
- **Membres de l'org** : nombre, fonctions assignées, progression existante
- **Fonctions & Personae** : pour recommander le bon parcours et le bon ciblage

L'IA pourra ainsi recommander le parcours optimal, les dates, la stratégie de déploiement et la description.

## Plan

### 1. Ajouter `generate-campaign` à l'edge function `academy-generate`

Nouvelle action dans `supabase/functions/academy-generate/index.ts` :

- Reçoit : `name`, `description`, `organization_id`, `difficulty_preference`, mode (guided/corporate/chat)
- Fetche le contexte enrichi (org info, membres, parcours publiés avec leur fonction/persona, fonctions de l'org)
- Prompt système : consultant en déploiement de formation, expert en change management
- L'IA retourne via tool call : `path_id` recommandé (ou création d'un nouveau parcours), `description`, `starts_at`, `ends_at`, `reminder_config`, `deployment_strategy`
- Insère la campagne en base, retourne l'ID

### 2. Ajouter le dialogue 3 modes dans `AdminAcademyCampaigns.tsx`

Reproduire le pattern exact de `AdminAcademyPaths.tsx` :

- State : `aiOpen`, `aiMode`, `aiForm`, `aiChat`
- `aiForm` : `name`, `description`, `organization_id`, `path_id` (optionnel, l'IA peut recommander), `duration_weeks`
- Bouton "Générer par IA" dans le header à côté de "Nouvelle campagne"

**Mode Guidé** :
- Nom de la campagne
- Organisation (select)
- Parcours cible (select, optionnel — l'IA peut recommander)
- Durée souhaitée (semaines)
- Objectifs de déploiement (textarea)

**Mode Corporate** :
- Nom
- Organisation (select)
- Brief complet (textarea large) : contexte business, objectifs RH, contraintes calendaires, population cible
- L'IA déduit tout le reste

**Mode Chat** :
- Nom
- Description libre (textarea)
- L'IA recommande organisation + parcours + planning

### 3. Queries additionnelles pour le contexte

Dans l'edge function, fetcher :
- `organizations` : nom, secteur, groupe
- `organization_members` count pour l'org sélectionnée
- `academy_paths` publiés avec leur fonction/persona
- `academy_function_users` pour savoir quelles fonctions sont assignées dans l'org
- `academy_enrollments` existants pour éviter les doublons

## Fichiers concernés

| Fichier | Action |
|---------|--------|
| `supabase/functions/academy-generate/index.ts` | Ajouter action `generate-campaign` avec contexte enrichi |
| `src/pages/admin/AdminAcademyCampaigns.tsx` | Ajouter dialogue IA 3 modes + bouton header + queries personae/functions |

