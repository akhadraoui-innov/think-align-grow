

# Audit de l'Academy actuelle & Plan de refonte "Best-of-Class"

## Diagnostic brutal

### Ce qui existe

| Couche | Verdict |
|--------|---------|
| **DB** | 14 tables correctes, bien structurées. Solide. |
| **Edge function** | 1 seule (`academy-generate`), 3 actions basiques, prompts plats, modèle flash (le moins cher), aucun streaming, aucun feedback progressif. |
| **Admin** | CRUD fonctionnel mais 100% formulaires/listes. Aucune preview, aucun workflow guidé, aucune intelligence. |
| **Learner UX** | Catalogue = liste de cards. Module = dump de markdown brut (avec `dangerouslySetInnerHTML` sans parser markdown). Pas de quiz interactif, pas d'exercice, pas de practice IA, pas de progression, pas d'inscription, pas de certificat. |
| **Tables inutilisées** | `academy_exercises`, `academy_practices`, `academy_progress`, `academy_enrollments`, `academy_certificates`, `academy_campaign_targets` — toutes vides de code front. |

### Ce qui manque fondamentalement

1. **L'IA comme compagnon** : Aujourd'hui l'IA est un générateur one-shot qu'on déclenche et qu'on oublie. Aucune interaction, aucun coaching, aucun feedback adaptatif.

2. **L'expérience apprenant** : C'est un lecteur de texte. Pas de progression visuelle, pas d'interaction, pas de gamification, pas de pratique.

3. **La qualité de génération** : Prompts basiques, modèle flash, pas de chaîne de raffinement. On est loin du "best-of-class".

4. **Le markdown n'est même pas rendu** : `dangerouslySetInnerHTML` sur du markdown brut sans conversion HTML = le markdown s'affiche en texte plat.

---

## Plan de refonte — "Academy 2.0"

### Phase A — Expérience Apprenant immersive (priorité absolue)

**1. Module Viewer interactif** (`AcademyModule.tsx` — refonte complète)
- Installer `react-markdown` + `remark-gfm` pour le rendu markdown correct
- Layout immersif : sidebar de progression (étapes du module) + zone contenu principale
- Navigation inter-sections avec transitions animées (framer-motion, déjà dans le projet)
- Barre de progression en haut qui avance au scroll/navigation
- Bouton "Marquer comme terminé" qui enregistre dans `academy_progress`
- Affichage adaptatif selon `module_type` : contenu pour lesson, quiz interactif pour quiz, consigne + soumission pour exercise, chat IA pour practice

**2. Quiz interactif** (nouveau composant `AcademyQuiz.tsx`)
- Fetch des questions depuis `academy_quizzes` + `academy_quiz_questions`
- Navigation question par question avec animation
- QCM avec sélection visuelle (cards cliquables, pas des radio buttons)
- Vrai/faux avec toggle stylisé
- Feedback immédiat après chaque réponse : explication + animation correct/incorrect
- Score final avec radar chart des compétences (composant `RadarChart` déjà existant)
- Enregistrement du score dans `academy_progress`

**3. Practice IA — Chat de coaching** (nouveau composant `AcademyPractice.tsx`)
- Chat streaming avec l'IA (pattern identique à `ChatInterface.tsx` existant)
- L'IA joue un rôle défini par `academy_practices.system_prompt` et `scenario`
- Compteur d'échanges (max_exchanges)
- À la fin de la session : l'IA évalue la performance selon `evaluation_rubric`
- Score et feedback enregistrés dans `academy_progress`
- Nouvelle edge function `academy-practice` avec streaming SSE

**4. Exercice avec évaluation IA** (nouveau composant `AcademyExercise.tsx`)
- Affichage de la consigne en markdown riche
- Zone de soumission (textarea ou upload selon `expected_output_type`)
- Bouton "Soumettre pour évaluation"
- L'IA évalue selon `evaluation_criteria` et retourne un feedback structuré
- Score + feedback stockés dans `academy_progress`
- Nouvelle action dans `academy-generate` : `evaluate-exercise`

**5. Parcours avec progression** (`AcademyPath.tsx` — refonte)
- Timeline verticale immersive au lieu d'une simple liste
- Chaque module affiche : icône type, statut (locked/available/in_progress/completed), score
- Progression globale en pourcentage avec barre animée
- Modules verrouillés tant que le précédent n'est pas terminé (progression séquentielle)
- Bouton "S'inscrire" qui crée un `academy_enrollment`
- Certificat de fin de parcours quand tous les modules sont complétés

**6. Catalogue enrichi** (`Academy.tsx` — refonte)
- Cards de parcours avec illustration gradient générée par les couleurs du parcours
- Filtres : difficulté, durée, tags
- Barre de recherche
- Section "En cours" avec progression en temps réel
- Section "Recommandés" basée sur le persona de l'utilisateur

### Phase B — IA Compagnon dans l'Admin

**7. Génération IA de niveau supérieur**
- Passer de `gemini-3-flash-preview` à `google/gemini-2.5-pro` pour la génération de contenu (raisonnement complexe)
- Chaîne de raffinement en 3 passes : Structure → Contenu → Relecture critique
- Streaming SSE pour montrer la progression en temps réel dans l'admin
- Génération de persona par IA : brief libre → persona structuré avec caractéristiques, scénarios, objectifs
- Génération d'exercices avec critères d'évaluation calibrés
- Génération de scénarios de practice avec rubrique de scoring

**8. Preview live dans l'admin**
- Onglet "Aperçu" dans `AdminAcademyPathDetail` qui rend le parcours tel que l'apprenant le verra
- Preview du contenu markdown en temps réel pendant l'édition
- Preview du quiz interactif pour tester avant publication

### Phase C — Edge Functions enrichies

**9. `academy-practice` (nouvelle)**
- Streaming SSE pour le chat de coaching
- System prompt dynamique depuis `academy_practices`
- Compteur d'échanges côté serveur
- Évaluation automatique en fin de session

**10. Actions supplémentaires dans `academy-generate`**
- `generate-persona` : brief → persona structuré
- `generate-exercise` : module → exercice avec critères
- `generate-practice` : module → scénario + rubrique
- `evaluate-exercise` : soumission → feedback structuré
- `evaluate-practice` : historique chat → score + feedback

### Fichiers impactés

**Nouveaux composants :**
- `src/components/academy/AcademyQuiz.tsx`
- `src/components/academy/AcademyPractice.tsx`
- `src/components/academy/AcademyExercise.tsx`
- `src/components/academy/AcademyProgress.tsx`
- `src/components/academy/ModuleViewer.tsx`

**Refontes :**
- `src/pages/Academy.tsx` — catalogue immersif
- `src/pages/AcademyPath.tsx` — timeline avec progression
- `src/pages/AcademyModule.tsx` — viewer multi-type
- `src/pages/admin/AdminAcademyPathDetail.tsx` — preview + génération enrichie

**Edge functions :**
- `supabase/functions/academy-generate/index.ts` — upgrade modèle + nouvelles actions
- `supabase/functions/academy-practice/index.ts` — nouveau, streaming

**Dépendances :**
- `react-markdown` + `remark-gfm` (rendu markdown)

### Ordre d'implémentation recommandé

1. Installer `react-markdown`, corriger le rendu markdown dans `AcademyModule`
2. Créer le quiz interactif (`AcademyQuiz`)
3. Créer le practice chat (`AcademyPractice` + edge function)
4. Créer l'exercice évalué (`AcademyExercise`)
5. Refondre `AcademyModule` en viewer multi-type
6. Refondre `AcademyPath` avec timeline + progression
7. Refondre `Academy` avec catalogue immersif
8. Upgrader la génération IA (modèle pro, chaîne de raffinement, streaming)
9. Ajouter les actions IA manquantes (persona, exercice, practice, évaluation)

