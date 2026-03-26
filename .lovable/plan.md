


# Audit complet — Ce qui est fait vs ce qui reste

## FAIT (opérationnel)

| Composant | Statut |
|-----------|--------|
| **modeRegistry** — 50 modes, 12 univers, 7 familles | Done |
| **SimulatorShell** — header, progression, objectifs, persona-adapt | Done |
| **OnboardingOverlay** — briefing par mode | Done |
| **HelpDrawer** — tuteur IA contextuel | Done |
| **SuggestionChips** — chips cliquables IA | Done |
| **InputQualityIndicator** — feedback temps réel | Done |
| **ChatMode** — jauges, suggestions, scoring, persistance | Done |
| **CodeMode** — éditeur syntaxique, extraction code, persistance | Done |
| **DecisionMode** — KPIs, timeline, stakeholders, persistance | Done |
| **DocumentMode** — split-view éditeur markdown + feedback IA | Done |
| **AnalysisMode** — briefing, data room, investigation chat | Done |
| **DesignMode** — board interactif + chat latéral | Done |
| **AssessmentMode** — grille de conformité + justifications | Done |
| **Widgets** — TensionGauge, KPIDashboard, TimerBar, ScoreReveal (avec replay), ObjectivesPanel | Done |
| **SessionReplay** — dialogue de relecture des échanges étape par étape | Done |
| **useSimulatorSession** — hook de persistance automatique DB | Done |
| **Page catalogue `/simulator`** — grille filtrable par univers/famille | Done |
| **PracticeDesigner** — assistant IA admin + templates + preview | Done |
| **practiceTemplates** — 10 templates pré-remplis | Done |
| **promptTemplates** — injections comportementales par mode | Done |
| **typeConfigSchemas** — champs admin dynamiques par type | Done |
| **PracticeTestDialog** — test depuis admin (Assets, Catalogue, Module) | Done |
| **Edge function academy-practice** — suggestions, dimensions, recommendations | Done |
| **Table academy_practice_sessions** — persistance sessions avec RLS | Done |

---

## RESTE A FAIRE

### 1. Export PDF de session

- Rapport de session exportable (score + dimensions + feedback + messages)
- Bouton dans ScoreReveal pour télécharger

### 2. Next Steps connectés

- Recommandations de pratiques similaires basées sur les données réelles (modes du même univers, difficulté adaptée)
- Connecter ScoreReveal.nextPractices aux données modeRegistry

### 3. Mode composite / enchaînement (Phase 8)

- Chaîner plusieurs modes en séquence (ex: Requirements → User Story → Sprint Planning)
- Transfert de contexte entre modes

### 4. Historique des sessions utilisateur

- Page d'historique consultable par l'utilisateur avec ses sessions passées, scores, replay
- Dashboard de progression personnelle

---

## Ordre de priorité recommandé

| Priorité | Tâche | Impact |
|----------|-------|--------|
| **P1** | Next Steps connectés | Guidage intelligent post-session |
| **P2** | Historique sessions utilisateur | Suivi de progression |
| **P3** | Export PDF | Partage et archivage |
| **P4** | Mode composite | Parcours multi-étapes |
