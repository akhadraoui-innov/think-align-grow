

# Audit & Plan — Admin ne voit pas le rendu premium

## Diagnostic

| Element | Backend (Edge Function) | Learner Frontend | Admin Frontend |
|---------|------------------------|-----------------|----------------|
| **Contenu enrichi** (💡📜⚠️, tables, ASCII) | Prompts pro avec instructions complètes ✅ | `EnrichedMarkdown` avec blockquotes stylisés, tables zebra, code blocks ✅ | `ReactMarkdown` brut sans aucun style enrichi ❌ |
| **Quiz 6 types** | Génération mcq/true_false/ordering/matching/fill_blank/scenario ✅ | Sous-composants dédiés par type, hints, recap ✅ | Affiche uniquement le texte de la question, pas de type, pas d'options ❌ |
| **Preview contenu** | — | Rendu complet avec EnrichedMarkdown ✅ | Tronqué à 1000 caractères, pas de callouts ❌ |
| **Preview quiz** | — | Interactif avec animations ✅ | Liste plate de textes bruts ❌ |
| **Mode preview learner** | — | — | N'existe pas ❌ |

**Conclusion** : le back et le front learner sont alignés, mais l'admin ne bénéficie d'aucun des rendus premium. L'admin voit du texte brut alors que le contenu généré est riche.

## Plan

### 1. Content preview enrichi dans PathDetail

Remplacer `ReactMarkdown` (ligne 612) par `EnrichedMarkdown` dans le collapsible de chaque module. Supprimer la troncature à 1000 caractères et utiliser un `max-h-96 overflow-y-auto` avec un bouton "Voir tout" qui retire la limite de hauteur.

### 2. Quiz preview enrichi dans PathDetail

Remplacer la liste plate de questions par un rendu riche :
- Badge type avec icone et couleur (🎯 QCM, ⚖️ Vrai/Faux, 📋 Ordonner, 🔗 Associer, ✏️ Compléter, 🎭 Scénario)
- Afficher les options de chaque question (avec la bonne réponse surlignée en vert)
- Afficher l'explication et le hint
- Collapsible par question pour ne pas surcharger

Nécessite de fetcher `academy_quiz_questions` avec toutes les colonnes (pas juste `id`).

### 3. Bouton "Prévisualiser comme apprenant"

Ajouter un bouton dans le header de chaque module qui ouvre un Dialog plein écran (ou Sheet large) avec le rendu exact du learner :
- `EnrichedMarkdown` pour le contenu
- `AcademyQuiz` interactif pour le quiz
- Même mise en page que `AcademyModule.tsx`

### 4. Corriger la query quiz pour inclure les données complètes

Actuellement : `.select("*, academy_quiz_questions(id)")` — ne récupère que les IDs.
Changer en : `.select("*, academy_quiz_questions(*)")` pour avoir question, type, options, correct_answer, explanation, points.

### Fichiers impactés

- `src/pages/admin/AdminAcademyPathDetail.tsx` :
  - Import `EnrichedMarkdown` au lieu de `ReactMarkdown`
  - Query quiz : `academy_quiz_questions(*)` au lieu de `(id)`
  - Content preview : `EnrichedMarkdown` + suppression troncature
  - Quiz preview : badges type, options, explanation, collapsible par question
  - Bouton preview learner avec Dialog

### Ordre

1. Fix query quiz (données complètes)
2. Remplacer ReactMarkdown par EnrichedMarkdown dans le content preview
3. Quiz preview enrichi avec types et options
4. Bouton preview learner

