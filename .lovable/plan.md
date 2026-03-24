

# Academy — Module de Formation intégré

## Vision

Un LMS (Learning Management System) complet, intégré au front existant (sidebar user + admin) mais avec un **schéma DB isolé** (tables préfixées `academy_`) et des **edge functions dédiées** pour faciliter la réutilisation sur d'autres projets.

## Architecture données (tables `academy_*`)

```text
academy_personae              → Profils cibles (persona marketing/pédagogique)
academy_paths                 → Parcours de formation (séquence de modules)
academy_path_modules          → Junction parcours ↔ modules (ordre)
academy_modules               → Unité pédagogique (titre, objectifs, durée)
academy_contents              → Contenu d'un module (texte, vidéo, slide, markdown)
academy_quizzes               → Quiz rattaché à un module
academy_quiz_questions        → Questions d'un quiz (QCM, vrai/faux, libre)
academy_exercises             → Exercices pratiques (consigne, critères)
academy_practices             → Sessions de pratique IA (prompt, scénario, config)
academy_campaigns             → Campagnes de formation (dates, cibles, parcours)
academy_campaign_targets      → Junction campagne ↔ personae/orgs/users
academy_enrollments           → Inscription d'un user à un parcours
academy_progress              → Progression par module (statut, score, timestamps)
academy_certificates          → Certificats générés à la fin d'un parcours
```

### Relations clés

```text
Persona ←── Campaign Targets ──→ Campaign ──→ Path
                                                │
                                          Path Modules (ordered)
                                                │
                                              Module
                                           ┌────┼────┐
                                        Content Quiz Exercise/Practice

User ──→ Enrollment ──→ Path
User ──→ Progress ──→ Module (score, completed_at)
User ──→ Certificate ──→ Path
```

## Schéma DB détaillé

### `academy_personae`
| Colonne | Type |
|---------|------|
| id | uuid PK |
| name | text |
| description | text |
| avatar_url | text |
| characteristics | jsonb (seniority, department, goals, pain_points) |
| organization_id | uuid nullable (scope org ou global) |
| created_by | uuid |
| generation_mode | text ('manual' / 'ai') |
| status | text ('draft' / 'published') |

### `academy_paths`
| Colonne | Type |
|---------|------|
| id | uuid PK |
| name | text |
| description | text |
| difficulty | text |
| estimated_hours | numeric |
| tags | jsonb |
| persona_id | uuid nullable FK |
| organization_id | uuid nullable |
| status | text ('draft' / 'published' / 'archived') |
| generation_mode | text |
| certificate_enabled | boolean |

### `academy_modules`
| Colonne | Type |
|---------|------|
| id | uuid PK |
| title | text |
| description | text |
| objectives | jsonb (array of strings) |
| estimated_minutes | int |
| sort_order | int |
| module_type | text ('lesson' / 'quiz' / 'exercise' / 'practice') |
| status | text |
| generation_mode | text |

### `academy_contents`
| Colonne | Type |
|---------|------|
| id | uuid PK |
| module_id | uuid FK |
| content_type | text ('markdown' / 'video' / 'slides' / 'embed') |
| body | text (markdown/HTML) |
| media_url | text nullable |
| sort_order | int |
| generation_mode | text |

### `academy_quizzes` + `academy_quiz_questions`
Structure similaire aux `quiz_questions` existants mais scopée Academy, avec support de types variés : QCM, vrai/faux, texte libre, association, ordonnancement.

### `academy_exercises`
| Colonne | Type |
|---------|------|
| id | uuid PK |
| module_id | uuid FK |
| title | text |
| instructions | text (markdown) |
| evaluation_criteria | jsonb |
| expected_output_type | text ('text' / 'file' / 'url') |
| ai_evaluation_enabled | boolean |

### `academy_practices`
| Colonne | Type |
|---------|------|
| id | uuid PK |
| module_id | uuid FK |
| title | text |
| scenario | text (contexte métier) |
| system_prompt | text (personnalité de l'IA coach) |
| evaluation_rubric | jsonb (critères de scoring) |
| max_exchanges | int |
| difficulty | text |

### `academy_campaigns`
| Colonne | Type |
|---------|------|
| id | uuid PK |
| name | text |
| description | text |
| path_id | uuid FK |
| organization_id | uuid FK |
| starts_at | timestamptz |
| ends_at | timestamptz nullable |
| status | text ('draft' / 'active' / 'completed') |
| reminder_config | jsonb |

### `academy_enrollments` + `academy_progress`
Tracking individuel : inscription, avancement module par module, scores, temps passé.

## Edge Functions dédiées

| Fonction | Rôle |
|----------|------|
| `academy-generate-persona` | Génère un persona à partir d'un brief (poste, secteur, enjeux) |
| `academy-generate-path` | Crée un parcours complet (modules, contenus, quiz) à partir d'un persona + objectifs |
| `academy-generate-content` | Génère le contenu d'un module (leçon markdown, slides) |
| `academy-generate-quiz` | Crée un quiz avec questions variées à partir du contenu d'un module |
| `academy-generate-exercise` | Génère un exercice pratique avec critères d'évaluation |
| `academy-evaluate-exercise` | Évalue une soumission d'exercice par IA |
| `academy-practice-chat` | Chat IA pour les sessions de pratique (prompt coaching) |
| `academy-evaluate-practice` | Scoring d'une session de pratique terminée |

Chaque fonction utilise le Lovable AI Gateway avec des prompts système spécialisés et du structured output (tool calling) pour garantir la rigueur.

## Permissions (domaine dédié)

Nouveau domaine `academy` dans `permission_domains` + `permission_definitions` :

```text
academy.paths.view       — Voir les parcours
academy.paths.create     — Créer un parcours
academy.paths.edit       — Modifier un parcours
academy.modules.manage   — Gérer les modules
academy.campaigns.view   — Voir les campagnes
academy.campaigns.manage — Gérer les campagnes
academy.content.create   — Créer du contenu
academy.content.ai       — Utiliser la génération IA
academy.analytics.view   — Voir les statistiques
academy.certificates.manage — Gérer les certificats
```

+ Insertion dans `role_permissions` pour les rôles existants.

## Intégration Front

### Sidebar User (AppSidebar)
Nouvelle section "Academy" :
- `/academy` — Mes formations (enrollments + progression)
- `/academy/catalog` — Catalogue des parcours disponibles

### Sidebar Admin (AdminSidebar)
Nouvelle section "Academy" :
- `/admin/academy` — Dashboard Academy
- `/admin/academy/personae` — Gestion des personae
- `/admin/academy/paths` — Parcours de formation
- `/admin/academy/campaigns` — Campagnes
- `/admin/academy/content` — Bibliothèque de contenu

### Pages à créer

**User :**
- `src/pages/Academy.tsx` — Liste des parcours inscrits + catalogue
- `src/pages/AcademyPath.tsx` — Vue d'un parcours (modules, progression)
- `src/pages/AcademyModule.tsx` — Consommation d'un module (contenu + quiz/exercice/practice)

**Admin :**
- `src/pages/admin/AdminAcademy.tsx` — Dashboard + liste
- `src/pages/admin/AdminAcademyPathDetail.tsx` — Détail/édition d'un parcours
- `src/pages/admin/AdminAcademyPersonae.tsx` — Gestion des personae
- `src/pages/admin/AdminAcademyCampaigns.tsx` — Campagnes

## Plan d'implémentation (phases)

### Phase 1 — Fondations (DB + navigation)
- Migration SQL : 14 tables academy_* avec RLS
- Permissions : domaine + définitions + assignation rôles
- Routes + sidebar user/admin
- Pages squelettes

### Phase 2 — Gestion manuelle (admin)
- CRUD Personae, Parcours, Modules, Contenus
- CRUD Quiz + Questions
- CRUD Exercices + Practices
- CRUD Campagnes

### Phase 3 — Génération IA
- Edge functions de génération (persona, parcours, contenu, quiz, exercice)
- UI "Générer par IA" dans chaque section admin
- Streaming pour la génération de parcours complets

### Phase 4 — Expérience apprenant
- Inscription à un parcours
- Navigation module par module
- Quiz interactif
- Soumission d'exercices + évaluation IA
- Practice chat (session de prompt coaching)
- Progression + certificats

### Phase 5 — Campagnes + Analytics
- Lancement de campagnes ciblées
- Tableaux de bord de progression
- Rappels et relances

## Démarrage recommandé

Commencer par la **Phase 1** : migration SQL des 14 tables + permissions + routes. C'est le socle sans lequel rien ne fonctionne. Cela représente ~1 migration SQL conséquente + modifications de 4-5 fichiers front (App.tsx, AppSidebar, AdminSidebar, pages squelettes).

