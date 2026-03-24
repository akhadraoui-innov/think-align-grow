

# Plan : Parcours de test complet avec generation E2E

## Constat

Le systeme actuel genere contenu et quiz **module par module** (boutons individuels dans PathDetail). Pour tester de bout en bout, il faut :
1. Creer le parcours (via IA ou manuellement)
2. Cliquer "Generer contenu" sur chaque module (5+ clics)
3. Cliquer "Generer quiz" sur chaque module (5+ clics)

Il n'y a aucun bouton "Tout generer" ni action batch. De plus, les illustrations sont absentes (aucune image generee, seulement du texte markdown et ASCII).

## Plan

### 1. Bouton "Generer tout le contenu" dans PathDetail

Ajouter dans le header du tab Modules un bouton "Generer tout" qui :
- Boucle sur tous les modules du parcours
- Pour chaque module de type `lesson` : appelle `generate-content`
- Pour chaque module : appelle `generate-quiz`
- Affiche une progress bar / toast par etape
- Invalide les queries a la fin

**Fichier** : `src/pages/admin/AdminAcademyPathDetail.tsx`

### 2. Enrichir les prompts pour inclure des illustrations

Modifier `academy-generate` pour ajouter des instructions d'illustration dans le content :
- Demander au LLM d'inclure des images descriptives via la syntaxe markdown `![description](url)`
- Utiliser des URLs d'images Unsplash/Pexels embed (ex: `https://images.unsplash.com/photo-xxx?w=800`) comme placeholders thematiques
- Alternative plus robuste : apres generation du texte, appeler le modele image (`google/gemini-3.1-flash-image-preview`) pour generer 1-2 illustrations par module, les upload dans le storage bucket, et inserer les URLs dans le contenu

Approche retenue : **images generees par IA** via le modele image, stockees dans un bucket `academy-assets`, et injectees dans le markdown.

### 3. Ajouter un bucket storage `academy-assets`

Migration SQL pour creer le bucket si inexistant. Utilisé pour stocker les illustrations generees.

### 4. Action `generate-illustrations` dans l'edge function

Nouvelle action qui :
- Lit le contenu d'un module
- Extrait 2-3 concepts cles
- Genere des illustrations via `google/gemini-3.1-flash-image-preview`
- Upload dans le bucket `academy-assets`
- Injecte les URLs dans le body markdown du contenu

### 5. Bouton "Generer illustrations" par module + dans le batch

Ajouter dans le collapsible de chaque module un bouton "Generer illustrations" et l'inclure dans le flow batch "Generer tout".

### 6. Seed d'un parcours de test

Creer via l'admin un parcours complet "Maitriser l'IA Generative en Entreprise" avec :
- 5 modules (3 lessons, 1 quiz-only, 1 exercise)
- Difficulte : intermediate
- Lancer la generation complete (contenu + quiz + illustrations) pour valider le pipeline E2E

## Fichiers impactes

- `supabase/functions/academy-generate/index.ts` : nouvelle action `generate-illustrations`, enrichissement prompts contenu
- `src/pages/admin/AdminAcademyPathDetail.tsx` : bouton "Generer tout", bouton "Generer illustrations"
- Migration SQL : bucket `academy-assets`

## Ordre

1. Bucket storage (migration)
2. Action `generate-illustrations` dans l'edge function
3. Enrichir le prompt content pour mieux structurer les emplacements d'images
4. Bouton batch "Generer tout" dans PathDetail
5. Bouton illustrations par module
6. Creer le parcours de test et lancer la generation

