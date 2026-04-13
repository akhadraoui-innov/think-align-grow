

# Plan — Éditeur WYSIWYG premium avec widgets et mise en page corporate intégrée

## Constat

L'éditeur actuel est un champ texte riche basique : on peut mettre en gras ou ajouter un titre, mais le résultat reste "du texte". Il n'y a pas de mise en page corporate pendant l'édition, pas de blocs prêts à l'emploi, et aucune interactivité avancée.

## Solution : un éditeur de document à blocs

Transformer `QuoteEditor` en un éditeur "block-based" inspiré de Notion, où chaque section du document est un bloc visuel interactif. L'utilisateur compose son devis en insérant et réarrangeant des widgets préétablis, sans jamais toucher de code ni de balises.

### Widgets préétablis (menu "+" flottant)

Un bouton "+" apparaît entre chaque bloc (ou via un slash-command `/`). Il ouvre un menu de blocs :

| Widget | Rendu |
|--------|-------|
| **Tableau investissement** | Table 4 colonnes préformatée (Poste, Détail, Fréquence, Montant HT) avec cellules éditables |
| **Encadré KPI** | Carte colorée avec icône, chiffre clé et label (ex: MRR, ARR, économie) |
| **Bloc remise** | Bandeau vert avec pourcentage et montant économisé |
| **Section signature** | 2 colonnes : Client / Prestataire avec champs Date, Nom, Signature |
| **Conditions générales** | Bloc accordéon pré-rempli, texte juridique éditable |
| **Séparateur décoratif** | HR avec filet primaire et motif corporate |
| **Citation / mise en avant** | Blockquote stylé avec bordure latérale colorée |

### Mise en page corporate EN MODE ÉDITION

L'éditeur est encadré par le même header et footer corporate que le mode aperçu :
- **En-tête** : Logo GROWTHINNOV, référence document, date (lecture seule, au-dessus de la zone éditable)
- **Pied** : Mention de confidentialité (lecture seule, en dessous)
- Transition édition ↔ aperçu invisible : seule la toolbar et les handles de blocs apparaissent/disparaissent

### Interactions avancées

- **Drag & drop** : Chaque bloc a un handle à gauche pour réordonner les sections par glisser-déposer
- **Menu contextuel** : Clic droit ou bouton "⋯" sur chaque bloc → Dupliquer, Supprimer, Déplacer haut/bas
- **Slash commands** : Taper `/` dans un paragraphe vide affiche le menu de blocs (comme Notion)
- **Gestion des tableaux** : Boutons inline pour ajouter/supprimer ligne ou colonne quand le curseur est dans un tableau

### Toolbar restructurée

```text
┌─────────────────────────────────────────────────────────┐
│  H2  H3  │  B  I  │  • ─  1. │  ≡Table │  [+ Bloc ▾] │
│           │        │          │ +row +col│              │
└─────────────────────────────────────────────────────────┘
```

Le bouton **[+ Bloc]** ouvre un dropdown avec les widgets illustrés par des icônes et descriptions courtes.

## Fichiers impactés

| Fichier | Action |
|---------|--------|
| `src/components/admin/business/QuoteEditor.tsx` | **Réécrire** — Toolbar enrichie, menu d'insertion de blocs, slash commands, drag handles, gestion tableau inline |
| `src/components/admin/business/quoteWidgets.ts` | **Créer** — Templates HTML des widgets (tableau investissement, KPI, signature, etc.) |
| `src/pages/admin/AdminQuotePreview.tsx` | **Modifier** — Afficher header/footer corporate autour de l'éditeur en mode édition, passer les props métier |
| `package.json` | **Modifier** — Ajouter `@tiptap/extension-placeholder` pour les slash commands |

## Détail technique

1. **`quoteWidgets.ts`** : Exporte un tableau `QUOTE_WIDGETS` avec pour chaque widget : `id`, `label`, `icon`, `description`, `html` (template HTML TipTap). Les templates utilisent les mêmes classes prose que le document.

2. **`QuoteEditor.tsx`** :
   - Ajouter `Placeholder` extension TipTap (affiche "Tapez / pour insérer un bloc...")
   - Bouton dropdown "Insérer un bloc" dans la toolbar qui appelle `editor.commands.insertContent(widget.html)`
   - Slash command listener : quand l'utilisateur tape `/`, filtrer et afficher les widgets dans un popover positionné au curseur
   - Boutons contextuels tableau : quand `editor.isActive("table")`, afficher +ligne, +colonne, supprimer tableau
   - Drag handles via TipTap DragHandle ou implémentation custom CSS

3. **`AdminQuotePreview.tsx`** :
   - En mode édition, wrapper l'éditeur dans le même letterhead + footer que le mode aperçu
   - Passer `prospectName`, `docRef`, `date` au composant pour affichage

## Ordre d'exécution
1. Créer `quoteWidgets.ts` avec les templates HTML
2. Installer `@tiptap/extension-placeholder`
3. Réécrire `QuoteEditor.tsx` avec widgets, slash commands, toolbar enrichie
4. Modifier `AdminQuotePreview.tsx` pour afficher le cadre corporate en mode édition

