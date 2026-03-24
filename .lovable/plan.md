

# Audit complet Academy — Constats et Plan d'evolution

## Ce qui fonctionne

| Composant | Statut |
|-----------|--------|
| DB (14 tables) | OK, bien structurées, RLS en place |
| Admin CRUD (Personae, Paths, Modules, Campaigns) | OK, fonctionnel |
| AI Generation (path, content, quiz, evaluate-exercise) | OK, edge functions déployées |
| Learner: Catalogue + filtres + recherche | OK |
| Learner: Parcours timeline + enrollment + progression | OK |
| Learner: Module viewer multi-type (tabs content/quiz/exercise/practice) | OK |
| Learner: Quiz interactif (animated, feedback, score) | OK |
| Learner: Practice IA streaming SSE | OK |
| Learner: Exercise avec evaluation IA | OK |
| Markdown rendering (react-markdown + remark-gfm) | OK, corrigé |

## Bugs et problemes identifiés

### Bug 1 — Progress jamais enregistré
Le quiz, l'exercice et la pratique appellent `onComplete` mais **aucun ne persiste dans `academy_progress`**. Le composant parent (`AcademyModule.tsx`) ne fait qu'afficher un toast. L'enrollment, les scores, le statut "completed" ne sont jamais écrits en base.

**Impact** : la progression affichée dans `AcademyPath` reste a 0% meme apres avoir tout fait. Le certificat ne peut jamais se déclencher.

### Bug 2 — Pas de lien enrollment → module dans AcademyModule
`AcademyModule.tsx` ne reçoit pas et ne récupère pas l'`enrollmentId` du parcours. Les composants enfants (`AcademyQuiz`, `AcademyExercise`, `AcademyPractice`) ont bien un prop `enrollmentId` optionnel mais il n'est jamais passé.

### Bug 3 — Practice: evaluation JSON jamais parsée
Dans `AcademyPractice.tsx`, le code cherche `parsed.evaluation` dans le stream SSE, mais la edge function `academy-practice` ne renvoie jamais un objet `evaluation` — elle renvoie le flux SSE brut de l'IA. L'évaluation est censée etre dans le dernier message sous forme de bloc markdown `\`\`\`evaluation {...}\`\`\``, mais le front ne le parse pas. Donc l'évaluation de fin de session ne fonctionne pas.

### Bug 4 — Campagnes: Select vide possible
`AdminAcademyCampaigns.tsx` lignes 233/246 : si `form.path_id` ou `form.organization_id` est vide string, le Select n'a pas de valeur par défaut, ce qui peut causer le meme bug Radix qu'on a corrigé ailleurs.

### Bug 5 — Pas de gestion d'erreur dans AcademyExercise
Si la edge function `evaluate-exercise` renvoie une erreur structurée (rate limited, credits exhausted), le front ne la traite pas specifiquement — toast générique "Erreur lors de l'évaluation".

### Bug 6 — Modules orphelins en suppression
`AdminAcademyPathDetail` supprime le lien `academy_path_modules` mais pas le module lui-meme. Les modules restent orphelins en base.

## Ce qui manque fonctionnellement

### Learner
1. **Pas de sauvegarde de progression** — rien n'est persisté
2. **Pas de "Marquer comme terminé"** pour les leçons (contenu pur)
3. **Pas de certificat** — la table existe mais aucun code
4. **Navigation entre modules** — depuis un module, pas de bouton "Module suivant"
5. **Pas de temps passé** tracké (`time_spent_seconds` dans progress)

### Admin
6. **Pas de génération IA pour exercices ni practices** — les boutons n'existent pas dans `AdminAcademyPathDetail`
7. **Pas de gestion du contenu des modules** — on génère du contenu par IA mais on ne peut pas le voir/éditer dans l'admin
8. **Pas de preview** — l'admin ne peut pas voir ce que l'apprenant verra
9. **Pas de génération IA de persona** — CRUD manuel seulement
10. **Pas de statistiques** — le dashboard admin montre des compteurs mais aucune analytics (taux de complétion, scores moyens, temps passé)
11. **Pas de drag-and-drop** pour réordonner les modules

## Plan d'implémentation — Corrections + Evolutions

### Phase 1 — Corrections critiques (faire fonctionner le circuit)

**1.1 Persister la progression**
- Dans `AcademyModule.tsx` : récupérer l'enrollment via le path_id du module
- Après completion d'un quiz/exercise/practice : upsert dans `academy_progress` avec score, status "completed", completed_at
- Ajouter un bouton "Marquer comme terminé" pour les leçons
- Invalider les queries de progression

**1.2 Fixer le parsing de l'évaluation Practice**
- Dans `AcademyPractice.tsx` : après la fin du stream, parser le dernier message assistant pour extraire le bloc ```evaluation {...}```
- Ou mieux : modifier `academy-practice` edge function pour envoyer un event SSE custom `data: {"evaluation": {...}}` après avoir parsé la réponse de l'IA

**1.3 Navigation inter-modules**
- Ajouter un bouton "Module suivant" en bas de `AcademyModule`
- Nécessite de passer le path_id et la liste des modules en contexte

**1.4 Fixes Select vides dans Campaigns**
- Appliquer le pattern `value="none"` comme déjà fait dans Paths

### Phase 2 — Enrichissement Admin

**2.1 Gestion du contenu dans les modules**
- Ajouter un onglet "Contenu" dans le détail d'un module admin
- CRUD des sections de contenu (markdown editor avec preview live)
- CRUD des questions de quiz
- CRUD des exercices avec critères

**2.2 Boutons IA manquants**
- Générer exercice IA par module
- Générer practice IA par module
- Générer persona par IA (brief → persona structuré)
- Nouvelles actions dans `academy-generate` : `generate-exercise`, `generate-practice`, `generate-persona`

**2.3 Analytics Dashboard**
- Taux d'inscription par parcours
- Taux de complétion
- Scores moyens par module
- Temps passé moyen

### Phase 3 — UX & UI Evolutions

**3.1 Certificats**
- Détecter quand tous les modules d'un parcours sont complétés
- Générer et stocker un certificat dans `academy_certificates`
- Page de visualisation du certificat (partageable)

**3.2 Module content editor riche dans l'admin**
- Markdown editor avec toolbar (gras, italique, titres, listes, code)
- Split view : édition à gauche, preview à droite
- Support upload d'images/vidéos

**3.3 Réordonnement drag-and-drop des modules**
- Utiliser le pattern existant dans le projet (le Workshop a déjà du drag)

**3.4 Amélioration du catalogue user**
- Tags cliquables pour filtrer
- Indicateur de popularité (nombre d'inscrits)
- Tri par durée / difficulté / récence

### Fichiers impactés

**Corrections :**
- `src/pages/AcademyModule.tsx` — progression + navigation
- `src/components/academy/AcademyPractice.tsx` — parsing évaluation
- `supabase/functions/academy-practice/index.ts` — event évaluation
- `src/pages/admin/AdminAcademyCampaigns.tsx` — fix Select

**Enrichissements :**
- `src/pages/admin/AdminAcademyPathDetail.tsx` — content management + boutons IA
- `supabase/functions/academy-generate/index.ts` — nouvelles actions
- `src/pages/admin/AdminAcademy.tsx` — analytics
- `src/pages/admin/AdminAcademyPersonae.tsx` — génération IA

**Nouveaux :**
- `src/pages/AcademyCertificate.tsx` — vue certificat

### Ordre recommandé

1. Phase 1 (corrections) — indispensable pour que le circuit fonctionne
2. Phase 2.1 + 2.2 (admin content + IA) — rend l'admin productif
3. Phase 3.1 (certificats) — boucle la valeur apprenant
4. Phase 2.3 + 3.2-3.4 (analytics + polish)

