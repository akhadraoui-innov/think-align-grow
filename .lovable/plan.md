

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
| **ChatMode** — jauges, suggestions, scoring | Done |
| **CodeMode** — éditeur syntaxique, extraction code | Done |
| **DecisionMode** — KPIs, timeline, stakeholders | Done |
| **Widgets** — TensionGauge (pulse), KPIDashboard (tendances), TimerBar (vibration), ScoreReveal (recommandations), ObjectivesPanel | Done |
| **PracticeDesigner** — assistant IA admin + templates + preview | Done |
| **practiceTemplates** — 10 templates pré-remplis | Done |
| **promptTemplates** — injections comportementales par mode | Done |
| **typeConfigSchemas** — champs admin dynamiques par type | Done |
| **PracticeTestDialog** — test depuis admin (Assets, Catalogue, Module) | Done |
| **Edge function academy-practice** — suggestions, dimensions, recommendations | Done |

---

## RESTE A FAIRE

### 1. Quatre familles UI manquantes (Phases 5-7 du plan original)

Actuellement `document`, `analysis`, `design`, `assessment` tombent tous sur `ChatMode` (fallback). Cela concerne 20+ modes qui n'ont pas d'interface spécialisée.

| Famille | Interface attendue | Modes concernés |
|---------|-------------------|-----------------|
| **DocumentMode** | Split-view : éditeur markdown à gauche + feedback IA à droite | spec_writing, user_story, adr, data_storytelling, nocode_architect, presentation |
| **AnalysisMode** | Briefing panel + data room simulée + chat d'investigation | requirements, due_diligence, kpi_design, ai_usecase, valuation, audit, case_study |
| **DesignMode** | Canevas/board interactif + chat latéral | backlog_prio, capacity_planning, process_mapping, integration_planning, bm_design |
| **AssessmentMode** | Grille de conformité cochable + justification + score | security_audit, ai_impact, legal_analysis, compliance, gdpr_pia, digital_maturity |

**Implémentation** : 4 nouveaux fichiers dans `src/components/simulator/modes/`, mise à jour du `SimulatorEngine.tsx` pour les router.

### 2. Page catalogue `/simulator` (Bloc 4 du plan UX)

Aucune page explorable pour les simulations. Il faut :
- Nouvelle page `src/pages/Simulator.tsx` avec grille filtrable par univers/famille/difficulté
- Cartes par mode avec icône, description, badge univers
- Route dans `App.tsx` + lien dans la sidebar `AppSidebar.tsx`

### 3. Post-session enrichie

- **Replay** : bouton "Revoir mes réponses" dans ScoreReveal pour relire la conversation en mode lecture
- **Export PDF** : rapport de session (score + dimensions + feedback)
- **Next Steps** : recommandations de pratiques similaires (partiellement fait dans ScoreReveal mais non connecté à de vraies données)

### 4. Persistance des sessions

Aucune table DB pour stocker les sessions de simulation. Il faut :
- Table `practice_sessions` (user_id, practice_id, messages JSON, score, dimensions, started_at, completed_at)
- Sauvegarde automatique à chaque échange et au score final
- Historique consultable par l'utilisateur

### 5. Mode composite / enchaînement (Phase 8 du plan original)

Possibilité de chaîner plusieurs modes en séquence (ex: Requirements → User Story → Sprint Planning). Non implémenté, prévu en Phase 8.

### 6. Edge function Practice Designer

Le PracticeDesigner appelle `academy-practice` avec un mode "design" mais la branche correspondante n'existe peut-être pas dans l'edge function. A vérifier et compléter.

---

## Ordre de priorité recommandé

| Priorité | Tâche | Impact |
|----------|-------|--------|
| **P1** | DocumentMode + AnalysisMode + DesignMode + AssessmentMode | 20 modes passent de "chat générique" à "interface spécialisée" |
| **P2** | Page catalogue `/simulator` + route + sidebar | Navigation et découverte des simulations |
| **P3** | Persistance DB (table `practice_sessions`) | Sessions sauvegardées, historique, analytics |
| **P4** | Post-session (replay, PDF, next steps connectés) | Rétention et progression |
| **P5** | Mode composite / enchaînement | Parcours multi-étapes |

