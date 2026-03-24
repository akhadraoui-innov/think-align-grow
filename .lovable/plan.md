

# Refonte Parcours de Formation — Critique et plan révisé

## Auto-critique du plan précédent

Le plan précédent reste dans une logique CRUD améliorée : ajouter des filtres, des badges, des tabs. C'est insuffisant. Voici les vrais problèmes :

1. **Le contenu est invisible** — On ne voit JAMAIS le body des leçons, les questions des quiz, les exercices. On voit des titres de modules dans des cards plates. Pour un outil de formation, c'est un échec fondamental.

2. **Pas de parcours visuel** — Un parcours de formation a une narration, une progression. L'UI actuelle est une liste numérotée. On ne comprend pas le flow pédagogique, les pré-requis, les embranchements.

3. **Le module est une boîte noire** — Cliquer sur un module ne fait rien. Pas de page module, pas d'expansion, pas de preview. On peut juste "générer du contenu" sans voir ce qui a été généré.

4. **Zéro intelligence métier** — Pas de taux de complétion par module, pas de score moyen, pas de temps passé. Pas de lien visible vers la fonction et le persona ciblés. Pas de contexte pédagogique.

5. **Les dialogs sont étriquées** — max-w-lg pour créer un parcours ou un module. C'est petit et cheap comparé aux dialogs 3 modes de Functions/Personae.

## Principes de la refonte

- **Content-first** : chaque module doit pouvoir s'expanser inline pour montrer son contenu (leçon markdown, questions quiz, brief exercice)
- **Flow pédagogique visible** : timeline verticale avec connecteurs, types de modules iconisés, preview du contenu
- **Module = entité riche** : clic sur un module → expansion collapsible inline avec le contenu complet, pas une nouvelle page
- **Création IA 3 modes** : comme Functions et Personae, le parcours doit avoir les 3 modes (guidé, corporate, chat)
- **Stats métier intégrées** : dans le header du path detail, dans chaque module (si contenu généré, si quiz généré, nb questions, nb inscrits ayant complété ce module)

## Plan d'implémentation

### 1. Page détail `AdminAcademyPathDetail.tsx` — Refonte complète

**Hero header premium** :
- Gradient bg par difficulté (vert débutant, bleu intermédiaire, violet avancé)
- Titre, description, badges (statut, difficulté, certificat)
- Liens cliquables vers Fonction cible et Persona cible (naviguer vers leur page détail)
- Stats bar : modules count, contenu généré %, quiz générés %, durée totale, inscrits (count `academy_enrollments`)

**Tabs** (4 onglets) :
- **Modules** (défaut) — La pièce maîtresse
- **Informations** — Formulaire inline éditable
- **Inscriptions** — Liste des enrollments
- **Statistiques** — Agrégats de progression

**Tab Modules — Timeline avec content preview** :

Chaque module = un bloc dans une timeline verticale connectée (ligne verticale + dots numérotés). Chaque bloc affiche :
- Icone type (BookOpen leçon, HelpCircle quiz, Dumbbell exercice, Bot pratique IA)
- Titre + description courte
- Badges : statut, durée, type
- Indicateurs de contenu : "✓ Contenu généré (3 sections)" ou "⚠ Pas de contenu", "✓ Quiz (5 questions)" ou "—"
- **Collapsible** : clic sur le module pour l'expanser et voir :
  - Le body markdown de `academy_contents` (rendu avec ReactMarkdown)
  - Les questions du quiz de `academy_quizzes` + `academy_quiz_questions`
  - Actions inline : régénérer contenu, régénérer quiz, éditer module, supprimer
- Requêtes : fetch `academy_contents` et `academy_quizzes` + `academy_quiz_questions` pour tous les module_ids du path

**Tab Informations** :
- Formulaire inline (pas de dialog) : nom, description, difficulté, heures, statut, certificat
- Sélecteurs Fonction et Persona avec preview du nom sélectionné
- Tags éditables
- Bouton Save sticky en bas

**Tab Inscriptions** :
- Count des enrollments, table simple (user, date, statut, progression)

**Tab Statistiques** :
- Taux complétion global, par module
- Score moyen quiz
- Temps moyen passé

### 2. Page liste `AdminAcademyPaths.tsx` — Enrichissement

**Header** : stats inline (total, publiés, brouillons, heures cumulées)

**Toggle vue grille/tableau** :
- **Grille** : cards enrichies avec gradient par difficulté, progress bar modules, badges Fonction + Persona, indicateurs de contenu (modules avec contenu vs sans)
- **Tableau** : DataTable premium

**Création IA 3 modes** : remplacer le dialog basique par le pattern 3 modes (guidé, corporate, chat) comme Functions et Personae. Dialog large (max-w-4xl).
- Mode guidé : étapes visuelles (objectif → public → difficulté → nb modules → preview)
- Mode corporate : coller un brief pédagogique, l'IA structure
- Mode chat : conversation libre

**Searchbar + filtres** : par difficulté, statut, fonction, persona

### 3. Requêtes enrichies

Dans PathDetail, fetch en parallèle :
- `academy_contents` WHERE module_id IN (module_ids) — pour preview contenu
- `academy_quizzes` WHERE module_id IN (module_ids) — pour savoir si quiz existe
- `academy_quiz_questions` count par quiz — pour le badge "5 questions"
- `academy_enrollments` count WHERE path_id — pour stats header
- `academy_functions` pour le nom de la fonction liée
- `academy_personae` pour le nom du persona lié

### Fichiers impactés

**Refonte majeure** :
- `src/pages/admin/AdminAcademyPathDetail.tsx` — hero, tabs, timeline avec collapsible content preview, stats
- `src/pages/admin/AdminAcademyPaths.tsx` — grille/table, creation IA 3 modes, filtres, search, stats header

### Ordre

1. PathDetail (valeur maximale — on voit enfin le contenu)
2. Paths liste (3 modes IA, filtres, vues)

