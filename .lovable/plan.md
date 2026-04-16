

# Plan — Refonte complète des 4 toolkits NGLA + affectation Growthinnov

## Données existantes

- **Organisation Growthinnov** : `c20a26a5-9e57-4abb-a5c4-77652c1d3e00`
- **3 toolkits existants** (4 piliers × 5 cartes = 20 cartes chacun) :
  - `a318ac06` — Transformation juridique par l'IA
  - `3f394651` — Leadership juridique stratégique
  - `dd1353b8` — Legal Operations Excellence
- **3 challenges** liés à ces toolkits
- **3 academy paths** existants (published)
- **10 pratiques** dans `practiceTemplates.ts`
- **Aucune** entrée `organization_toolkits` pour ces toolkits

## Travail à réaliser

### 1. Supprimer les cartes et piliers existants des 3 toolkits

DELETE les ~60 cartes puis les 12 piliers des 3 toolkits NGLA.

### 2. Recréer les 3 toolkits enrichis (7 piliers × 12 cartes = 84 cartes chacun)

| Toolkit | 7 Piliers |
|---------|-----------|
| **Transformation IA** ⚖️ | Acculturation IA, Prompting juridique avancé, Analyse contractuelle augmentée, CLM & Automatisation, Microsoft Copilot juridique, Gouvernance & Éthique IA, Feuille de route IA DJ |
| **Leadership DJ** 👑 | Raison d'être de la DJ, Positionnement stratégique COMEX, Legal Design, KPIs & OKR juridiques, Éloquence & Prise de parole, Valoriser les succès DJ, Management d'équipe juridique |
| **Legal Ops Excellence** ⚙️ | Operating Model, Process & Workflows, Legal Tech Stack, Knowledge Management, Data & Reporting, Budget & Cost Control, Gouvernance & Organisation |

Chaque carte aura : `title`, `subtitle`, `definition`, `objective`, `action`, `kpi`, `qualification`, `step_name`, `difficulty`, `tags`, phases distribuées (foundations/model/growth/execution).

### 3. Créer le 4e toolkit : "Piloter un projet de transformation juridique" 🧭

Structure en 12 piliers multi-famille (~7 cartes chacun = ~84 cartes) :

| Famille | Piliers |
|---------|---------|
| **Questions** (2) | Diagnostic situationnel, Cadrage stratégique |
| **Insights réponse** (5) | Benchmark marché, Maturité digitale, Parties prenantes, Écosystème Legal Tech, Veille réglementaire |
| **Actions** (2) | Quick wins 90j, Transformation structurelle 12 mois |
| **Insights projet** (3) | Gouvernance programme, KPIs transformation, Conduite du changement |

### 4. Affecter les 4 toolkits à l'organisation Growthinnov

INSERT dans `organization_toolkits` pour les 4 toolkits × org `c20a26a5`.

### 5. Mettre à jour les challenges

Les 3 challenges existants restent liés aux mêmes toolkits. On enrichit les `challenge_subjects` et `challenge_slots` pour coller aux nouveaux piliers.

## Approche technique

1. Générer le contenu riche via AI Gateway (un appel par toolkit)
2. DELETE cards → DELETE pillars des 3 toolkits existants
3. INSERT 7 piliers + 84 cartes × 3 toolkits refaits
4. INSERT nouveau toolkit + 12 piliers + ~84 cartes
5. INSERT 4 entrées `organization_toolkits`
6. UPDATE challenge_subjects si nécessaire

## Fichiers impactés

| Cible | Action |
|-------|--------|
| Tables `cards`, `pillars` | DELETE + INSERT (~336 cartes, ~33 piliers) |
| Table `toolkits` | INSERT 1 nouveau toolkit |
| Table `organization_toolkits` | INSERT 4 entrées |
| Aucun fichier source modifié | — |

## Ordre d'exécution

1. Générer tout le contenu via AI (4 toolkits × ~84 cartes)
2. Supprimer cartes + piliers existants
3. Insérer les nouveaux piliers et cartes (3 refaits + 1 nouveau)
4. Insérer les `organization_toolkits`
5. Vérifier les challenges

