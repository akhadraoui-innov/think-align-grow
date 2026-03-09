

# Plan : Importer les vraies données du toolkit depuis le fichier Excel

## Contexte

Le fichier Excel contient **10 familles (piliers) avec 20 cartes chacune = 200 cartes** au format CPAM complet (Définition, Pourquoi, Action, KPI). Les 200 cartes actuelles en base sont **générées par IA** et doivent etre remplacées par les données authentiques.

### Mapping Excel → Base de données

| Excel (fichier)       | DB actuelle (slug)  | Action                          |
|----------------------|--------------------|---------------------------------|
| THINKING             | thinking           | Renommer → "Thinking"          |
| INNOVATION           | innovation         | Garder                         |
| BUSINESS             | business           | Garder                         |
| BUILDING             | operations         | Renommer → "Building"          |
| PROFITABILITY        | growth             | Renommer → "Profitability"     |
| INDICATORS           | marketing          | Renommer → "Indicators"        |
| MANAGING             | team               | Renommer → "Managing"          |
| FINANCE              | finance            | Garder                         |
| GOUVERNANCE          | legal              | Renommer → "Gouvernance"       |
| FUNDRAISING          | impact             | Renommer → "Fundraising"       |

## Etapes

### 1. Mettre a jour les piliers
Renommer les 10 piliers existants (nom, slug, icon_name, description) pour correspondre au fichier Excel. Les IDs restent les memes pour eviter de casser les foreign keys.

### 2. Supprimer les 200 cartes IA existantes
Supprimer toutes les cartes actuelles, ainsi que les donnees de progression utilisateur liees.

### 3. Inserer les 200 vraies cartes
Pour chaque pilier, inserer les 20 cartes avec :
- **title** : Nom de la Carte (ex: "Curiosite", "Pensee Critique")
- **definition** : Colonne "Definition" du fichier
- **action** : Colonne "Action" du fichier  
- **kpi** : Colonne "Indicateurs de Maturite / KPI" du fichier
- **subtitle** : Colonne "Pourquoi c'est important" (quand disponible)
- **phase** : Repartition automatique (cartes 1-5 = foundations, 6-10 = model, 11-15 = growth, 16-20 = execution)
- **sort_order** : 0-19

### 4. Mettre a jour le code frontend
- Modifier `useToolkitData.ts` : mettre a jour les maps d'icones et de gradients pour les nouveaux slugs
- Modifier `Explore.tsx` : mettre a jour les phases labels si necessaire
- Verifier `FlipCard.tsx` pour l'affichage du nouveau champ subtitle/pourquoi

### 5. Edge function d'import
Creer une edge function temporaire `import-cards` qui contient toutes les donnees du fichier Excel en dur et les insere en base via le service role key. Cela evite de devoir faire 200+ appels individuels.

## Donnees extraites du fichier

Les 10 onglets identifies avec contenu complet :
- **Page 3** : INNOVATION (20 cartes)
- **Page 4** : THINKING (20 cartes)
- **Page 5** : BUSINESS (20 cartes)
- **Page 6** : BUILDING (20 cartes)
- **Page 7** : PROFITABILITY (20 cartes)
- **Page 8** : INDICATORS (20 cartes)
- **Page 9** : MANAGING (20 cartes)
- **Page 10** : FINANCE (20 cartes)
- **Page 11** : GOUVERNANCE (20 cartes)
- **Page 12** : FUNDRAISING (20 cartes)

## Impact
- Les donnees de progression utilisateur existantes (`user_card_progress`) seront invalidees car les card_ids changent
- Les quiz questions (10) restent inchangees pour l'instant
- Les game plans et steps peuvent necessiter une mise a jour ulterieure

