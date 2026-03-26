
# Audit complet — Ce qui est fait vs ce qui reste

## FAIT (opérationnel)

| Composant | Statut |
|-----------|--------|
| **modeRegistry** — 50 modes, 12 univers, 7 familles | Done |
| **SimulatorShell** — header, progression, objectifs, persona-adapt, ai_assistance_level | Done |
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
| **Page catalogue `/simulator`** — grille filtrable + bouton Lancer + Dialog fullscreen | Done |
| **Page historique `/simulator/history`** — sessions passées, scores, replay | Done |
| **Next Steps connectés** — recommandations dynamiques depuis modeRegistry | Done |
| **PracticeDesigner** — assistant IA admin + templates + preview | Done |
| **practiceTemplates** — 10 templates pré-remplis | Done |
| **promptTemplates** — injections comportementales par mode | Done |
| **typeConfigSchemas** — champs admin dynamiques par type | Done |
| **PracticeTestDialog** — test depuis admin (Assets, Catalogue, Module) | Done |
| **Edge function academy-practice** — suggestions, dimensions, recommendations, ai_assistance_level | Done |
| **Edge function academy-generate** — practice_type intelligent avec 30+ modes | Done |
| **Table academy_practice_sessions** — persistance sessions avec RLS | Done |
| **DB migration** — module_id nullable + ai_assistance_level | Done |
| **Admin Simulateur** — Dashboard `/admin/simulator` avec stats et sessions | Done |
| **Admin Templates** — Bibliothèque `/admin/simulator/templates` standalone | Done |
| **Admin Sidebar** — Section Simulateur avec sous-items | Done |
| **OrgSimulatorTab** — Onglet simulateur dans fiche organisation | Done |
| **AcademyPracticesTab** — Sélecteur ai_assistance_level | Done |
| **SimulatorEngine** — Passage aiAssistanceLevel au Shell | Done |
| **Practices standalone** — module_id nullable, RLS view_standalone_practices | Done |

---

## RESTE A FAIRE

### 1. Export PDF de session

- Rapport de session exportable (score + dimensions + feedback + messages)
- Bouton dans ScoreReveal pour télécharger

### 2. Mode composite / enchaînement (Phase 8)

- Chaîner plusieurs modes en séquence (ex: Requirements → User Story → Sprint Planning)
- Transfert de contexte entre modes

---

## Ordre de priorité recommandé

| Priorité | Tâche | Impact |
|----------|-------|--------|
| **P1** | Export PDF | Partage et archivage |
| **P2** | Mode composite | Parcours multi-étapes |
