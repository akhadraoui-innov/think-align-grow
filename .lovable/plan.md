

# Plan — Créer 5 simulations Process Mining complètes

## Contexte

Le parcours "Process Mining IA Augmented" couvre : introduction PM+IA, extraction/préparation de données (event logs), découverte/conformité augmentée par IA, prédiction/optimisation, et cas pratiques industriels. Le toolkit "Process Minding Augmented" est également disponible.

Les 5 simulations couvriront des aspects complémentaires du process mining, chacune avec un `practice_type` adapté du `modeRegistry`, un scénario réaliste, un system prompt détaillé, des rubriques d'évaluation pondérées, et 15 échanges max.

## Les 5 simulations

| # | Titre | practice_type | family | Scénario résumé |
|---|---|---|---|---|
| 1 | **Diagnostic Process Mining d'une Supply Chain** | `case_study` | analysis | L'apprenant reçoit des event logs d'une chaîne logistique avec des anomalies. Il doit analyser, identifier les bottlenecks et proposer des optimisations augmentées par IA. |
| 2 | **Pitcher le Process Mining Augmenté au COMEX** | `pitch` | chat | L'IA joue un CFO sceptique. L'apprenant doit convaincre d'investir dans un projet PM+IA avec ROI chiffré, cas d'usage concrets et réponse aux objections. |
| 3 | **Conformance Checking : Détecter les déviations** | `process_mapping` | design | Processus Purchase-to-Pay présenté, l'apprenant doit mapper le processus attendu vs réel, identifier les déviations et proposer des contrôles IA. |
| 4 | **Data Storytelling : Présenter un diagnostic PM au COMEX** | `data_storytelling` | document | Jeu de données PM fourni (KPIs, bottlenecks, variantes). L'apprenant construit un récit décisionnel convaincant enrichi par l'IA. |
| 5 | **Négocier le périmètre d'un projet Process Mining** | `negotiation` | chat | L'IA joue un directeur ops qui veut tout analyser vs budget limité. L'apprenant négocie le périmètre, les priorités et le planning. |

## Exécution technique

Une seule migration SQL insérant 5 lignes dans `academy_practices` avec :
- `organization_id` : `c20a26a5-9e57-4abb-a5c4-77652c1d3e00` (GrowthInnov)
- `module_id` : NULL (simulations standalone)
- `max_exchanges` : 15
- `difficulty` : intermediate à advanced
- `ai_assistance_level` : guided
- `practice_type` : mappé au modeRegistry
- `type_config` : paramètres spécifiques au mode
- `system_prompt` : prompt détaillé (~300 mots chacun, rôle IA, comportement, objectifs cachés)
- `scenario` : contexte apprenant (~150 mots)
- `evaluation_rubric` : 4 critères pondérés par simulation
- `evaluation_dimensions` : dimensions alignées au mode

## Fichiers impactés

| Fichier | Action |
|---|---|
| Migration SQL | INSERT 5 practices dans `academy_practices` |

Aucun changement de code front — les simulations apparaîtront automatiquement dans le catalogue Pratique via les queries existantes.

