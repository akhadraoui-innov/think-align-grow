

# Plan — Corrections Guide, Évaluation globale, et mise en page Premium

## Problèmes identifiés

1. **Guide invisible après génération** : le contenu est replié par défaut (`expanded = false`) et ne s'ouvre pas après la génération. De plus, le rendu utilise `ReactMarkdown` basique au lieu de `EnrichedMarkdown`.

2. **Évaluation globale invisible** : le backend supporte le mode `evaluation` (vérifié dans `academy-tutor`), mais le composant `AIExecutiveCard` retourne `null` quand `content` est null et `loading` est false — si l'auto-fetch échoue silencieusement, rien ne s'affiche. Il faut ajouter un état d'erreur et un bouton de retry.

3. **Rendu Markdown basique** : les 3 cartes IA (`AIExecutiveCard`) utilisent `ReactMarkdown` brut au lieu de `EnrichedMarkdown` (qui gère callouts 💡/📜/⚠️, tableaux enrichis, code blocks, typographie premium).

## Corrections

### 1. `GuideSection.tsx` — Auto-expand + EnrichedMarkdown

- Après `setGuide(resp.data.document)`, ajouter `setExpanded(true)` pour ouvrir automatiquement le guide
- Si `guideDocument` est passé en prop (guide déjà existant), initialiser `expanded = true`
- Remplacer `<ReactMarkdown>` par `<EnrichedMarkdown content={guide.content} />` pour la mise en page premium (callouts, tableaux, typographie corporate)
- Retirer l'import `ReactMarkdown`, ajouter l'import `EnrichedMarkdown`

### 2. `ModuleReviewView.tsx` — AIExecutiveCard avec EnrichedMarkdown + retry

- Dans `AIExecutiveCard` : remplacer `<ReactMarkdown>{content}</ReactMarkdown>` (ligne 68) par `<EnrichedMarkdown content={content} />`
- Ajouter un état d'erreur : si `!loading && !content`, afficher un message avec un bouton "Réessayer" au lieu de retourner `null`
- Passer une prop `onRetry` à `AIExecutiveCard` pour relancer `fetchAI`
- Retirer l'import `ReactMarkdown` (déjà remplacé par `EnrichedMarkdown`)

### 3. `ModuleReviewView.tsx` — Robustesse auto-fetch

- Dans `fetchAI`, ajouter un `catch` qui log l'erreur et set un état `error` pour que l'utilisateur puisse voir que la génération a échoué et retenter
- S'assurer que les 3 `useEffect` ne se déclenchent pas en doublon (le `autoFetchedRef` est déjà en place — OK)

## Fichiers impactés

| Fichier | Modification |
|---------|-------------|
| `src/components/academy/GuideSection.tsx` | Auto-expand après génération + `EnrichedMarkdown` |
| `src/components/academy/ModuleReviewView.tsx` | `EnrichedMarkdown` dans AIExecutiveCard + retry + état d'erreur |

## Résultat attendu

- Le guide s'affiche automatiquement après génération avec une mise en page premium (callouts, tableaux, typography corporate)
- L'évaluation globale s'affiche avec le même rendu premium, ou un bouton "Réessayer" si la génération a échoué
- Les 3 onglets IA (Évaluation, Analyse, Knowledge) affichent un contenu avec callouts mis en valeur, sections structurées et typographie professionnelle

