

# Plan — Création de contenu NGLA : Formations, Pratiques, Toolkits & Challenges

## Contexte

Analyse du site **NextGen Legal Advisory (NGLA)** — cabinet spécialisé dans la transformation des directions juridiques. Domaines clés :
- **IA appliquée aux métiers du droit** (prompting, Copilot, gouvernance IA)
- **Leadership & positionnement stratégique** (raison d'être, Legal Design, KPIs)
- **Operating model juridique** (Legal Ops, gouvernance, pilotage, conduite du changement)

## Contenu à créer

### 3 Formations complètes (academy_paths + modules)

| # | Formation | Modules | Heures |
|---|-----------|---------|--------|
| 1 | **IA pour les juristes : des fondamentaux à l'impact** | 6 modules (Comprendre l'IA, Prompting juridique, Analyse contractuelle IA, Copilot Word/Outlook, Gouvernance IA, Feuille de route) | 12h |
| 2 | **Leadership & influence de la direction juridique** | 5 modules (Raison d'être, Legal Design, KPIs & OKR, Éloquence, Valoriser ses succès) | 10h |
| 3 | **Operating Model juridique : structurer sa transformation** | 5 modules (Diagnostic, Legal Ops, Gouvernance, Pilotage par les données, Conduite du changement) | 10h |

### 10 Pratiques (simulator) — Catégorie "Droit & Transformation juridique"

Pratiques insérées dans `practiceTemplates.ts` sous une nouvelle catégorie `legal_transformation` :

1. Négociation de clause contractuelle avec un opérationnel
2. Présentation de la feuille de route IA au COMEX
3. Rédaction d'un prompt pour analyse de contrat
4. Atelier Legal Design — simplifier une clause
5. Défendre le budget de la direction juridique
6. Gérer un conflit interne Legal/Compliance
7. Pitcher la valeur de la DJ au CEO
8. Cadrer un projet d'automatisation contractuelle
9. Mener un entretien de feedback avec un juriste junior
10. Animer un comité de pilotage juridique trimestriel

### 3 Toolkits (toolkits + pillars + cards)

| # | Toolkit | Piliers | Cartes/pilier |
|---|---------|---------|---------------|
| 1 | **Transformation juridique par l'IA** (⚖️) | 4 : Acculturation, Cas d'usage, Gouvernance, Déploiement | 5 |
| 2 | **Leadership juridique stratégique** (🎯) | 4 : Positionnement, Communication, Pilotage, Influence | 5 |
| 3 | **Legal Operations Excellence** (⚙️) | 4 : Process, Outils, Données, Organisation | 5 |

### 3 Challenges (challenge_templates + subjects + slots)

| # | Challenge | Toolkit associé | Sujets |
|---|-----------|----------------|--------|
| 1 | **Construire sa feuille de route IA juridique** | Transformation juridique par l'IA | 4 sujets (Diagnostic maturité, Priorisation cas d'usage, Gouvernance, Plan d'action) |
| 2 | **Repositionner la DJ comme business partner** | Leadership juridique stratégique | 3 sujets (Analyse positionnement, Proposition de valeur, Plan de communication) |
| 3 | **Optimiser les Legal Ops** | Legal Operations Excellence | 3 sujets (Cartographie process, Sélection outils, KPIs opérationnels) |

## Approche technique

1. **Générer le contenu via l'AI Gateway** — Utiliser le script `lovable_ai.py` pour générer les descriptions riches, objectifs, contenus de modules, scénarios de pratiques
2. **Insérer en base** via l'outil d'insertion Supabase (toolkits, pillars, cards, challenge_templates, subjects, slots)
3. **Créer les paths et modules** via insertion directe (academy_paths, academy_modules, academy_path_modules)
4. **Ajouter les pratiques** dans `practiceTemplates.ts` (fichier de config statique)

## Fichiers impactés

| Fichier | Action |
|---------|--------|
| Base de données | **Insert** — toolkits, pillars, cards, challenge_templates, challenge_subjects, challenge_slots, academy_paths, academy_modules, academy_path_modules |
| `src/components/simulator/config/practiceTemplates.ts` | **Modifier** — Ajouter catégorie `legal_transformation` avec 10 pratiques |

## Ordre d'exécution

1. Générer tout le contenu textuel via AI (descriptions, objectifs, scénarios)
2. Insérer les 3 toolkits + piliers + cartes
3. Insérer les 3 challenges + sujets + slots (liés aux toolkits)
4. Insérer les 3 formations + modules
5. Ajouter les 10 pratiques dans practiceTemplates.ts

