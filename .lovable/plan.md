

# Challenge C-Level : Cadrer et Piloter l'IA dans votre Métier

## Cible

Dirigeants métier (hors DG) : directeurs commerciaux, marketing, RH, finance, opérations, supply chain... Ceux qui doivent intégrer l'IA dans LEUR périmètre, pas piloter la stratégie globale de l'entreprise.

## Les 7 étapes

| # | Titre | Type | Description métier | Slots |
|---|-------|------|--------------------|-------|
| 1 | **Où en est votre direction face à l'IA ?** | context | Prenez du recul sur votre périmètre : quels processus tournent déjà, quels irritants reviennent, quel est le niveau de maturité de vos équipes ? Ce diagnostic honnête est le socle de tout le reste. | **Niveau de maturité actuel** (single) — "Choisissez la carte qui reflète le mieux où en sont vos équipes aujourd'hui." · **Atouts de votre direction** (multi) — "Quelles forces pouvez-vous déjà mobiliser ? Données existantes, équipes ouvertes, processus documentés..." · **Freins à lever en priorité** (ranked) — "Classez les obstacles par urgence : résistance au changement, données dispersées, manque de compétences..." |
| 2 | **Quelle place pour l'IA dans votre feuille de route métier ?** | challenge | L'IA n'est pas un projet IT qu'on vous impose. C'est un levier pour atteindre VOS objectifs métier. Quel est votre enjeu n°1 cette année ? Comment l'IA peut-elle y contribuer concrètement ? | **Objectif métier prioritaire que l'IA doit servir** (single) — "Pas un objectif IA, un objectif MÉTIER : réduire le churn, accélérer le closing, fiabiliser les prévisions..." · **Leviers d'alignement avec la stratégie groupe** (multi) — "Comment votre initiative IA s'inscrit-elle dans le plan stratégique global ?" · **Horizons de résultats visés** (ranked) — "Classez : quick win à 3 mois, impact visible à 6 mois, transformation à 18 mois." |
| 3 | **Quels processus métier transformer en priorité ?** | challenge | Cartographiez vos processus clés : relation client, production, reporting, décision... Où l'IA crée-t-elle le plus de valeur dans VOTRE quotidien opérationnel ? | **Premier processus à transformer** (single) — "Celui qui fait le plus mal aujourd'hui ou qui a le plus fort potentiel de gain." · **Cas d'usage à fort impact opérationnel** (multi) — "Sélectionnez les processus où l'IA peut changer la donne : automatisation, prédiction, personnalisation..." · **Top 3 des priorités d'investissement** (ranked) — "Si vous n'aviez que 3 projets à lancer, lesquels ?" · **Pari transformant à 2 ans** (single) — "Le projet ambitieux qui pourrait redéfinir votre façon de travailler." |
| 4 | **Comment chiffrer la valeur et convaincre en COMEX ?** | challenge | Votre DG et le CFO veulent des chiffres. Construisez un argumentaire solide : gains attendus, coûts réels, time-to-value. Pas de la tech, des euros et des ETP. | **Modèle de valorisation adapté à votre contexte** (single) — "Gain de productivité, revenus additionnels, réduction de risque, expérience client..." · **Postes de coûts à anticiper** (multi) — "Licences, intégration, formation, accompagnement au changement, maintenance..." · **Indicateurs de succès à présenter au COMEX** (ranked) — "Quels KPIs parleront à votre DG ? Classez-les par pouvoir de conviction." |
| 5 | **Comment organiser votre direction pour réussir ?** | challenge | Qui porte le sujet IA dans votre équipe ? Faut-il recruter, former, réorganiser ? Comment articuler avec la DSI et les autres directions ? | **Modèle d'organisation retenu** (single) — "Équipe dédiée, référents dans chaque service, binôme métier-tech, task force temporaire..." · **Compétences à développer dans vos équipes** (multi) — "Prompt engineering, lecture de données, cadrage de cas d'usage, gestion du changement..." · **Rôles clés à créer ou renforcer** (ranked) — "Data translator, product owner IA, champion du changement... Par quoi commencer ?" · **Sponsor et relais dans l'organisation** (single) — "Qui est votre allié au COMEX ? Qui est votre relais terrain ?" |
| 6 | **Quels risques anticiper et comment se protéger ?** | challenge | Les vraies inquiétudes d'un directeur métier : qualité des résultats, confidentialité des données clients, conformité réglementaire, résistance des équipes, dépendance fournisseur. | **Risque n°1 à traiter avant de lancer** (single) — "Celui qui pourrait faire échouer votre initiative ou nuire à votre crédibilité." · **Mesures de protection à mettre en place** (multi) — "Cadre d'usage, validation humaine, tests pilotes, clauses contractuelles, RGPD..." · **Sujets de conformité et d'éthique à traiter** (ranked) — "Classez par urgence réglementaire et impact réputationnel." |
| 7 | **Votre plan d'action à 12 mois** | question | Synthèse opérationnelle : quels sont vos jalons, vos quick wins, vos points de contrôle ? C'est le livrable que vous présentez à votre équipe lundi matin. | **Premier livrable visible à 90 jours** (single) — "Le résultat concret qui prouvera que ça marche et créera l'adhésion." · **Actions prioritaires du premier trimestre** (multi) — "Les chantiers à lancer immédiatement : pilote, formation, données, gouvernance..." · **Jalons Go/No-Go sur 12 mois** (ranked) — "À 3, 6, 9, 12 mois : quels critères pour continuer, pivoter ou arrêter ?" |

## Implémentation

Migration SQL unique via l'outil insert (données, pas schéma) :
- 1 `challenge_template` : toolkit_id `4dc04fa1-...`, difficulty "advanced", description riche
- 7 `challenge_subjects` avec descriptions détaillées orientées dirigeant métier
- 23 `challenge_slots` avec hints pédagogiques en langage business

Aucun changement de code requis — le moteur de challenge existant affiche tout automatiquement.

