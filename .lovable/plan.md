

## Complétion IA des toolkits partiels + Visualisation interactive des cartes

### Ce qui change pour vous

**Problème actuel** : Un toolkit généré partiellement (ex: RH avec piliers mais sans cartes) est "bloqué". Pas de bouton pour relancer la génération manquante. Et dans l'onglet Cartes, vous ne voyez qu'un tableau technique — pas de moyen de les parcourir visuellement comme un vrai deck de cartes.

**Après cette évolution** :

1. **Compléter un toolkit partiel** — Sur la page détail d'un toolkit, un bandeau intelligent détecte ce qui manque (piliers sans cartes, pas de quiz) et propose un bouton "✨ Compléter avec l'IA". Clic → même expérience de génération SSE avec timeline, mais uniquement sur les données manquantes.

2. **Dialogue IA post-génération** — Un bouton "💬 Améliorer avec l'IA" ouvre un chat contextuel pour demander des corrections : "rends les KPIs plus mesurables", "ajoute un angle RSE au pilier Gouvernance", "reformule les actions du pilier Finance". L'IA modifie les cartes existantes en base.

3. **Visualisation interactive des cartes** — Un nouvel onglet "Cartes (visuel)" ou un toggle dans l'onglet existant permet de basculer entre vue tableau et vue cartes. La vue cartes propose :
   - **Mise en page** : Toutes les cartes, Par pilier (famille), Par phase, Par nombre (grille 4/6/8 colonnes)
   - **Format de carte** : FlipCard (compact), GameCard (mode jeu), Section (coloré), Full (détails complets)
   - Navigation fluide avec filtres et compteurs

### Architecture technique

**Nouveau composant `ToolkitCardsBrowser.tsx`**
- Props : `cards`, `pillars`, `toolkitId`
- Toolbar : sélecteur de vue (tableau/cartes), sélecteur de layout (toutes/pilier/phase), sélecteur de format (flip/game/section/full), slider colonnes
- Grille responsive avec les composants FlipCard et GameCard existants
- Filtres par pilier, phase, difficulté

**Nouveau composant `ToolkitCompletionBanner.tsx`**
- Analyse l'état du toolkit : piliers sans cartes, absence de quiz
- Affiche un bandeau avec le détail de ce qui manque + CTA "Compléter"
- Déclenche un appel SSE au même endpoint `generate-toolkit` avec un nouveau mode `complete_missing`

**Nouveau composant `ToolkitAIChatDialog.tsx`**
- Dialog avec un mini-chat pour corriger/améliorer le contenu
- Envoie les instructions à une edge function `refine-toolkit` qui modifie les cartes en base
- Scope : par pilier ou tout le toolkit

**Edge function `generate-toolkit` — mode complétion**
- Nouveau paramètre `mode: "full" | "complete_missing"`
- Si `complete_missing` : reçoit `toolkit_id`, détecte les piliers sans cartes, génère uniquement le manquant
- Même streaming SSE

**Edge function `refine-toolkit` (nouvelle)**
- Reçoit `toolkit_id`, `scope` (pilier ou all), `instruction` (texte libre)
- Charge les cartes existantes, les envoie à l'IA avec l'instruction
- Met à jour les cartes modifiées en base
- Retourne un résumé des modifications

### Fichiers

| Fichier | Action |
|---------|--------|
| `src/components/admin/ToolkitCardsBrowser.tsx` | Créer — vue interactive cartes avec layouts et formats |
| `src/components/admin/ToolkitCompletionBanner.tsx` | Créer — bandeau de complétion IA |
| `src/components/admin/ToolkitAIChatDialog.tsx` | Créer — dialog d'amélioration IA |
| `src/components/admin/ToolkitCardsTab.tsx` | Modifier — toggle tableau/visuel, intégrer le browser |
| `src/pages/admin/AdminToolkitDetail.tsx` | Modifier — ajouter le banner de complétion |
| `supabase/functions/generate-toolkit/index.ts` | Modifier — mode `complete_missing` |
| `supabase/functions/refine-toolkit/index.ts` | Créer — edge function d'amélioration IA |

