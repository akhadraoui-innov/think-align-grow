

# Refonte Persona vs Fonction — Architecture séparée

## Votre analyse est juste

Vous avez raison sur le fond : ce qui est aujourd'hui stocké dans `academy_personae` (seniority, department, industry, company_size) décrit des **fonctions organisationnelles**, pas des personas comportementaux.

**Fonction** = ce que fait la personne (poste, département, séniorité, industrie, outils utilisés, KPIs)  
**Persona** = comment elle apprend et réagit (maturité digitale, appétence au changement, niveau d'initiative, style d'apprentissage, appréhensions face à l'IA)

Deux DRH peuvent être un "Explorateur audacieux" ou un "Prudent méthodique" — même fonction, personas radicalement différents.

**Ma nuance** : le contexte organisationnel (secteur, taille, enjeux) devrait être pré-configuré par l'admin au niveau de l'organisation ou de la fonction, pas entièrement délégué à l'utilisateur. L'onboarding IA enrichit et personnalise, mais ne part pas de zéro.

---

## Plan d'implémentation

### 1. Nouvelle table `academy_functions`

Contient les données organisationnelles actuellement mal placées dans personae :

| Colonne | Type | Description |
|---------|------|-------------|
| id | uuid | PK |
| name | text | Ex: "Directeur des Opérations" |
| description | text | Résumé du rôle |
| department | text | Département |
| seniority | text | Niveau hiérarchique |
| industry | text | Secteur d'activité |
| company_size | text | Taille entreprise |
| responsibilities | jsonb | Liste des responsabilités clés |
| tools_used | jsonb | Outils/technologies utilisés |
| kpis | jsonb | Indicateurs de performance |
| ai_use_cases | jsonb | Cas d'usage IA pertinents pour cette fonction |
| organization_id | uuid? | Scope org optionnel |
| status | text | draft/published |
| generation_mode | text | manual/ai |
| created_by | uuid | |

### 2. Refondre `academy_personae` en profil comportemental pur

Vider `characteristics` de tout ce qui est fonction et le remplacer par :

| Attribut dans characteristics | Description |
|-------------------------------|-------------|
| digital_maturity | 1-5 : niveau de maturité numérique |
| ai_apprehension | 1-5 : niveau d'appréhension face à l'IA |
| experimentation_level | 1-5 : propension à expérimenter |
| initiative_level | 1-5 : autonomie dans l'apprentissage |
| change_appetite | 1-5 : appétence au changement |
| learning_style | visual / reading / doing / discussing |
| time_availability | micro (15min) / short (30min) / medium (1h) / intensive (2h+) |
| motivation_drivers | string[] : reconnaissance, montée en compétences, curiosité, obligation... |
| resistance_patterns | string[] : "manque de temps", "ça ne marche pas dans mon métier"... |
| preferred_format | autonome / guidé / coaching / groupe |

### 3. Table de liaison `academy_function_users`

| Colonne | Type |
|---------|------|
| user_id | uuid |
| function_id | uuid |
| custom_context | jsonb | Contexte enrichi par l'utilisateur via onboarding IA |
| assigned_at | timestamp |

### 4. Admin : deux sections séparées

- **Fonctions** (`/admin/academy/functions`) : CRUD + génération IA des fonctions avec les 3 modes (guidé, corporate, chat) — récupère tout le code actuel des personae qui concerne seniority/department/industry
- **Personae** (`/admin/academy/personae`) : refonte vers des profils comportementaux. Cards avec radar chart (maturity, apprehension, experimentation, initiative, change). Génération IA basée sur des archétypes comportementaux, pas des fiches de poste.

### 5. Parcours liés à Fonction + Persona

- `academy_paths.persona_id` reste (profil comportemental ciblé)
- Ajouter `academy_paths.function_id` (fonction ciblée)
- Un parcours peut cibler "DRH" (fonction) + "Prudent méthodique" (persona) = contenu adapté au métier ET au style d'apprentissage

### 6. Onboarding apprenant (futur)

- L'utilisateur est affecté à une fonction par l'admin
- Lors du premier accès Academy, quiz comportemental IA (5-7 questions) pour déterminer son persona
- L'IA enrichit le contexte utilisateur dans `academy_function_users.custom_context`

### Fichiers impactés

- **Migration SQL** : `academy_functions`, `academy_function_users`, alter `academy_paths` (add `function_id`)
- **Nouveau** : `src/pages/admin/AdminAcademyFunctions.tsx`
- **Refonte** : `src/pages/admin/AdminAcademyPersonae.tsx` (comportemental pur)
- **Mise à jour** : `src/pages/admin/AdminAcademyPaths.tsx` (double ciblage)
- **Mise à jour** : `src/pages/admin/AdminAcademy.tsx` (compteur fonctions)
- **Route** : `src/App.tsx` (nouvelle route admin)
- **Sidebar** : `src/components/admin/AdminSidebar.tsx` (lien Fonctions)
- **Edge function** : `academy-generate` (action `generate-function`)

### Ordre

1. Migration SQL (table + RLS)
2. Admin Fonctions (CRUD + IA, 3 modes)
3. Refonte Admin Personae (radar comportemental)
4. Mise à jour Parcours (double ciblage)
5. Onboarding apprenant (phase ultérieure)

