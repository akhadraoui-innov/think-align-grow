

# Refonte Contenu & Quiz — Prompts Pro + UX Premium Apprenant

## Diagnostic

1. **Prompts de génération basiques** : le prompt `generate-content` ne prend pas en compte la difficulté, le persona cible, la fonction cible. Il demande 300-800 mots par section sans instructions sur les illustrations markdown (schémas ASCII, encadrés, pastilles historiques, "A retenir").

2. **Prompt quiz trop simple** : seulement 2 types (mcq, true_false). Pas de types innovants (matching, ordering, fill-in-the-blank, scenario-based). Le schéma DB (`question_type: string`) le permet pourtant.

3. **Rendu apprenant (`AcademyQuiz.tsx`)** : une seule UX pour MCQ/true_false. Pas de mode rappel, pas de chat permanent, pas d'illustrations, mise en page basique.

4. **Rendu contenu (`AcademyModule.tsx` / `ContentView`)** : rendu markdown brut sans enrichissement visuel (pas d'encadrés stylisés pour tips/warnings/history, pas d'icones).

## Plan

### 1. Refonte prompts `generate-content` (edge function)

Enrichir le prompt pour produire du markdown riche niveau pro :
- Récupérer le path (difficulté, persona, fonction) en plus du module
- Instructions explicites dans le system prompt :
  - `> 💡 **À retenir** : ...` pour les points clés
  - `> 📜 **Le saviez-vous ?** : ...` pour les anecdotes historiques
  - `> ⚠️ **Attention** : ...` pour les mises en garde
  - Schémas en ASCII art dans des blocs code
  - Tableaux comparatifs markdown
  - Listes numérotées pour les processus
- Adapter la profondeur et le vocabulaire au niveau (beginner = vulgarisé, advanced = technique)
- Adapter les exemples à la fonction cible si disponible

### 2. Refonte prompts `generate-quiz` (edge function)

Enrichir pour 6 types de questions :
- `mcq` : QCM classique (4 options)
- `true_false` : Vrai/Faux avec justification
- `ordering` : Remettre dans l'ordre (drag & drop)
- `matching` : Associer des paires
- `fill_blank` : Texte à trous
- `scenario` : Mise en situation avec choix contextualisé

Le prompt doit exiger un mix de types, des questions progressives, et des explications détaillées. Chaque question doit avoir un `hint` optionnel (indice).

Ajouter `hint` au tool schema (le champ DB `options: Json` est flexible).

### 3. Refonte `AcademyQuiz.tsx` — UX interactive premium

Réécrire le composant quiz pour supporter les 6 types :
- **MCQ** : garder l'existant (déjà bien)
- **True/False** : 2 gros boutons stylisés Vrai/Faux
- **Ordering** : drag-and-drop ou boutons up/down pour ordonner des items
- **Matching** : deux colonnes, sélection par paires
- **Fill blank** : texte avec inputs inline
- **Scenario** : texte de mise en situation + choix contextuel avec image/illustration

Chaque type a son propre sous-composant de rendu.

Ajouts UX :
- Bouton "Indice" (affiche le hint avec animation)
- Badge type de question avec icone distincte par type
- Animations enrichies (confetti sur bonne réponse, shake sur mauvaise)

### 4. Refonte `ContentView` dans `AcademyModule.tsx` — Rendu enrichi

Remplacer le rendu markdown brut par des composants personnalisés via `react-markdown` components :
- Blockquotes avec icone et couleur selon le préfixe (💡/📜/⚠️)
- Tables stylisées avec zebra striping
- Code blocks avec header de titre
- Headers avec ancres et séparateurs
- Images et schémas centrés avec caption

### 5. Chat permanent apprenant (flottant)

Ajouter un bouton flottant sur la page `AcademyModule` qui ouvre un panel de chat (Sheet/Drawer) :
- Utilise l'edge function `academy-practice` avec `system_override` (déjà supporté)
- System prompt : "Tu es un tuteur pour le module [titre]. Réponds aux questions de l'apprenant sur le contenu."
- SSE streaming comme la pratique IA existante
- Persiste la conversation dans un state local (pas en DB)

### 6. Mode rappel (recap)

Dans la page résultats quiz, ajouter un onglet "Rappel" :
- Liste les concepts clés extraits des questions ratées
- Affiche l'explication de chaque mauvaise réponse avec le contexte du contenu
- Bouton "Revoir la leçon" qui navigue vers le contenu

### Fichiers impactés

**Edge function** :
- `supabase/functions/academy-generate/index.ts` : refonte `generateContent` et `generateQuiz`

**Composants apprenant** :
- `src/components/academy/AcademyQuiz.tsx` : refonte complète (6 types, hints, animations)
- `src/pages/AcademyModule.tsx` : ContentView enrichi + chat flottant

**Ordre** :
1. Prompts edge function (content + quiz)
2. AcademyQuiz refonte (6 types)
3. ContentView enrichi
4. Chat flottant apprenant

