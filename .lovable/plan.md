

# Optimisation UX complète du Practice Studio — Expérience, Navigation, Interactivité & Aide IA

## Diagnostic des lacunes actuelles

1. **Pas de shell/wrapper commun** : chaque mode (ChatMode, CodeMode, DecisionMode) est un composant plat sans header, breadcrumb, aide contextuelle ni navigation inter-session
2. **Aucune aide IA contextuelle** : l'utilisateur est seul face à l'interface sans tooltips, coach latéral ni suggestions dynamiques
3. **Pas d'onboarding par mode** : le simulateur démarre directement sans expliquer les règles, objectifs ou mécaniques
4. **Widgets sous-utilisés** : les jauges/KPIs apparaissent seulement si l'IA les génère — pas de placeholder ni d'état initial visuel
5. **Aucune aide à la rédaction** : pas de suggestions de réponses, pas de templates, pas de "hints" pour guider les débutants
6. **Score et progression pauvres** : ScoreReveal basique, pas de comparaison historique ni de recommandation post-session
7. **Admin sans moteur de conception** : le formulaire de création de practice est fonctionnel mais sans facilitation (pas de prévisualisation temps réel, pas d'assistant IA pour rédiger scenarios/prompts)
8. **Navigation coupée** : le PracticeTestDialog ne permet pas de naviguer entre les modes, pas de catalogue explorable

---

## Plan d'implémentation en 4 blocs

### Bloc 1 — SimulatorShell : wrapper universel avec UX structurante

Creer `src/components/simulator/SimulatorShell.tsx` — un wrapper commun pour tous les modes qui apporte :

**Header contextuel** : icone du mode + nom + badge univers + compteur d'echanges + bouton aide + bouton reset
**Panneau d'objectifs lateral repliable** : affiche les objectifs du mode, les regles, les criteres d'evaluation attendus — genere automatiquement a partir du `modeRegistry` (evaluationDimensions)
**Onboarding overlay** (premiere ouverture) : ecran de briefing avec icone animee, description du mode, regles de la mecanique, bouton "Commencer"
**Barre de progression enrichie** : phases + echanges + timer (selon le mode) dans un composant unifie
**Bouton "Aide IA"** : ouvre un petit chat overlay (drawer) connecte a `academy-practice` avec un system prompt special "Tu es un tuteur qui aide l'apprenant a comprendre les mecaniques de cette simulation, sans donner les reponses"

Le `SimulatorEngine` wrappera tous les modes dans ce shell au lieu de les rendre directement.

**Fichiers concernes** :
- Creer `src/components/simulator/SimulatorShell.tsx`
- Modifier `src/components/simulator/SimulatorEngine.tsx` pour wrapper les modes dans le shell
- Creer `src/components/simulator/widgets/OnboardingOverlay.tsx`
- Creer `src/components/simulator/widgets/HelpDrawer.tsx`

---

### Bloc 2 — Interactivite enrichie dans chaque mode

**ChatMode** : 
- Suggestions de reponses dynamiques (generes par l'IA a chaque tour via un champ `suggestions` dans la reponse JSON) affichees comme chips cliquables sous le chat
- Indicateur de "qualite de reponse" temps reel (longueur, mots-cles detectes) sous le textarea
- Tooltip sur les jauges/widgets avec explication de ce qu'elles mesurent
- Etat initial des jauges visibles des le debut (valeurs par defaut du `typeConfig`) au lieu d'attendre la premiere reponse IA

**CodeMode** :
- Bouton "Indice" qui demande a l'IA un indice sans reveler la solution
- Bouton "Soumettre pour review" distinct du chat (experience plus naturelle)
- Diff visuel entre les versions successives du code (highlight des lignes modifiees)

**DecisionMode** :
- Stakeholder Map visuel (badges colores avec satisfaction au lieu d'une simple liste)
- Alertes animees avec priorite (haute/moyenne/basse) codee par couleur
- Mini-timeline des decisions cliquable pour revoir le contexte de chaque decision passee

**Widgets enrichis** :
- `TensionGauge` : ajouter un tooltip expliquant chaque barre + animation pulse quand la valeur change
- `KPIDashboard` : ajouter des fleches de tendance (up/down) et un historique des 3 dernieres valeurs
- `ScoreReveal` : ajouter un onglet "Recommandations" avec des suggestions d'amelioration et un bouton "Recommencer avec ces conseils" qui pre-injecte les recommandations dans le contexte
- `TimerBar` : ajouter des alertes sonores (vibration navigateur) a 50%, 25% et 10% du temps

**Fichiers concernes** :
- Modifier `src/components/simulator/modes/ChatMode.tsx`
- Modifier `src/components/simulator/modes/CodeMode.tsx`
- Modifier `src/components/simulator/modes/DecisionMode.tsx`
- Modifier tous les widgets existants
- Creer `src/components/simulator/widgets/SuggestionChips.tsx`
- Creer `src/components/simulator/widgets/InputQualityIndicator.tsx`

---

### Bloc 3 — Moteur de conception admin avec facilitation IA

Transformer le formulaire `AcademyPracticesTab` en un veritable **Practice Designer** :

**Assistant IA de conception** : bouton "Generer avec l'IA" dans le formulaire qui :
- A partir du type de mode choisi + un brief en 2 lignes de l'admin, genere automatiquement : titre, scenario, system_prompt, type_config, grille d'evaluation
- Utilise une edge function dediee `academy-practice-designer` (ou une branche dans `academy-practice`)
- Affiche un apercu avant validation

**Preview temps reel** : panneau lateral dans le dialog qui montre un apercu du SimulatorShell avec les donnees du formulaire en cours d'edition (sans envoyer de message, juste l'onboarding overlay + les jauges initiales + le scenario)

**Templates par univers** : quand l'admin choisit un type, proposer 2-3 templates pre-remplis ("Negociation commerciale B2B", "Negociation salariale", "Negociation fournisseur") au lieu de partir de zero

**Validation intelligente** : warnings visuels si le scenario est trop court, si le system_prompt ne contient pas de format JSON attendu pour le mode, si les max_exchanges sont trop bas pour le type

**Fichiers concernes** :
- Modifier `src/components/admin/AcademyPracticesTab.tsx` (refactorer en sous-composants)
- Creer `src/components/admin/PracticeDesigner.tsx` (assistant IA + preview)
- Creer `src/components/simulator/config/practiceTemplates.ts` (templates pre-remplis par type)
- Modifier ou creer une branche dans `supabase/functions/academy-practice/index.ts` pour le mode "design"

---

### Bloc 4 — Navigation et personas optimisees

**Catalogue de simulations** : nouvelle page `/simulator` (ou section dans Academy) qui affiche tous les modes disponibles en grille filtrable par univers, avec :
- Carte par mode : icone, titre, description, difficulte, badge univers, nombre de sessions completees
- Filtres par univers, par famille, par difficulte
- Acces direct au Practice Studio

**Adaptation par persona** :
- Debutant : aide IA toujours visible, suggestions activees, onboarding obligatoire, indicateur de qualite actif
- Intermediaire : aide IA disponible mais cachee, suggestions optionnelles, onboarding skip possible
- Expert : interface epuree, pas de suggestions, pas d'onboarding, acces direct
- Le niveau est determine par le `difficulty` de la practice + le profil utilisateur

**Post-session enrichie** :
- Apres ScoreReveal : section "Prochaines etapes" avec 2-3 pratiques recommandees (meme univers, difficulte adjacente)
- Bouton "Revoir mes reponses" : replay de la conversation en mode lecture avec annotations IA sur chaque echange
- Export PDF du rapport de session (score + dimensions + feedback + recommandations)

**Fichiers concernes** :
- Modifier `src/components/simulator/widgets/ScoreReveal.tsx` (recommandations + next steps)
- Modifier `src/components/simulator/SimulatorShell.tsx` (adaptation persona)
- Ajouter route `/simulator` ou section dans Academy

---

## Ordre d'execution

| Etape | Contenu | Fichiers |
|-------|---------|----------|
| 1 | SimulatorShell + OnboardingOverlay | 3 fichiers crees, 1 modifie |
| 2 | HelpDrawer (aide IA contextuelle) | 1 fichier cree |
| 3 | SuggestionChips + InputQualityIndicator | 2 fichiers crees, ChatMode modifie |
| 4 | Widgets enrichis (tooltips, tendances, animations) | 5 fichiers modifies |
| 5 | CodeMode + DecisionMode enrichis | 2 fichiers modifies |
| 6 | Practice Designer admin (assistant IA + preview + templates) | 3 fichiers crees, 1 modifie |
| 7 | ScoreReveal enrichi (recommandations + next steps) | 1 fichier modifie |

