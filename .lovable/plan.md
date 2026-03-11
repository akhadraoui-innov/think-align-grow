

## Plan : Afficher les prompts par défaut dans un onglet dédié

### Problème
Les prompts par défaut sont hardcodés dans les Edge Functions mais invisibles pour l'admin. Il doit pouvoir les consulter pour savoir ce qui sera utilisé s'il ne surcharge pas un prompt.

### Solution
Ajouter un 3e onglet **"Prompts par défaut"** dans la page Admin Settings, affichant en lecture seule les prompts système par défaut de chaque outil IA (Coach, Réflexion, SWOT, BMC, Pitch Deck, Plan d'action).

### Implémentation

**Fichier modifié** : `src/pages/admin/AdminSettings.tsx`

1. Ajouter une constante `DEFAULT_PROMPTS` contenant les prompts par défaut extraits des Edge Functions :
   - `coach` : prompt du coach stratégique
   - `reflection` : prompt du consultant stratégique
   - `deliverables_swot` : prompt SWOT
   - `deliverables_bmc` : prompt BMC
   - `deliverables_pitch_deck` : prompt Pitch Deck
   - `deliverables_action_plan` : prompt Plan d'action

2. Ajouter un 3e onglet dans le `TabsList` : icône `FileText` + "Prompts par défaut"

3. Le `TabsContent` affiche chaque prompt dans un bloc `<pre>` ou `Textarea` en **readOnly** avec un style distinctif (fond légèrement différent, badge "Par défaut" visible)

4. Ajouter un texte d'information en haut expliquant que ces prompts sont utilisés quand aucune surcharge n'est configurée

**Même traitement** dans `OrgAIConfigTab.tsx` : ajouter sous chaque textarea de prompt un lien/bouton "Voir le prompt par défaut" qui expand/collapse le prompt par défaut correspondant, pour que l'admin puisse le consulter comme référence.

