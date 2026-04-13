

# Plan — Mode édition WYSIWYG pour le devis

## Problème

Le mode édition affiche le markdown brut avec balises (`##`, `**`, `|---|---|`), incompréhensible pour un utilisateur final non-technique.

## Solution

Remplacer le `Textarea` monospace par un éditeur WYSIWYG basé sur **TipTap** (extension de ProseMirror, déjà compatible React). L'utilisateur voit le document formaté et le modifie directement — titres, gras, tableaux, listes — sans voir de balises.

### Fonctionnement

- **Import/export markdown** : le contenu stocké reste du markdown (compatible avec l'IA et l'affichage preview). TipTap convertit markdown → HTML à l'ouverture et HTML → markdown à la sauvegarde.
- **Toolbar compacte** : Titres (H2/H3), Gras, Italique, Liste à puces, Liste numérotée, Tableau, Séparateur — positionnée en haut du document en mode édition.
- **Style cohérent** : L'éditeur utilise les mêmes classes `prose prose-lg` que le mode aperçu pour une transition visuelle fluide.

### Fichiers impactés

| Fichier | Action |
|---------|--------|
| `package.json` | **Ajouter** `@tiptap/react`, `@tiptap/starter-kit`, `@tiptap/extension-table`, `turndown`, `marked` |
| `src/components/admin/business/QuoteEditor.tsx` | **Créer** — Composant éditeur WYSIWYG avec toolbar et conversion markdown |
| `src/pages/admin/AdminQuotePreview.tsx` | **Modifier** — Remplacer le `Textarea` brut par `<QuoteEditor>` |

### Détail technique

1. **Nouveau composant `QuoteEditor`** :
   - `useEditor` TipTap avec StarterKit + Table extension
   - `marked(markdown)` pour initialiser le contenu HTML
   - `Turndown` pour reconvertir en markdown au `onChange`
   - Toolbar sticky avec boutons icônes (même style que la toolbar du document)
   - Classes prose identiques au mode aperçu

2. **Modification `AdminQuotePreview.tsx`** (lignes 276-281) :
   - Remplacer `<Textarea value={markdown} ...>` par `<QuoteEditor value={markdown} onChange={setMarkdown} />`
   - Supprimer l'import `Textarea` si plus utilisé

### Ordre d'exécution
1. Installer les dépendances TipTap
2. Créer `QuoteEditor.tsx`
3. Intégrer dans `AdminQuotePreview.tsx`

