

# Practice Studio v2 — Module Autonome "Professional Simulator"

## Vision

Construire un module autonome de simulation professionnelle qui couvre TOUS les metiers du numerique et de la transformation, puis l'integrer au LMS existant. Ce module devient le coeur differentiant de la plateforme : un simulateur universel que personne ne propose.

---

## Catalogue exhaustif : 50 modes en 12 univers

### Univers 1 — Code & Engineering (6 modes)

| Mode | `practice_type` | Mecanique |
|------|-----------------|-----------|
| **Code Review** | `code_review` | L'IA soumet du code avec bugs/smells, le user review et propose des corrections |
| **Debug Challenge** | `debug` | Un bug est decrit avec stack trace + contexte, le user diagnostique et propose un fix |
| **System Design** | `system_design` | "Concevez l'architecture de X" — l'IA challenge scalabilite, resilience, couts |
| **Pair Programming** | `pair_programming` | Co-ecriture de code tour a tour, l'IA complete ou challenge les choix |
| **Refactoring Dojo** | `refactoring` | Code legacy fourni, le user propose un plan de refactoring, l'IA evalue |
| **TDD Kata** | `tdd_kata` | L'IA donne un test, le user ecrit l'implementation, boucle red/green/refactor |

### Univers 2 — Vibe Coding & No-Code (4 modes)

| Mode | `practice_type` | Mecanique |
|------|-----------------|-----------|
| **Vibe Coding** | `vibe_coding` | Objectif fonctionnel donne, le user decrit ce qu'il veut en langage naturel, score de "promptabilite" |
| **Spec Writing** | `spec_writing` | Rediger des specs fonctionnelles completes a partir d'un besoin vague |
| **Prompt-to-App** | `prompt_to_app` | Le user ecrit un prompt pour generer une app, l'IA evalue completude, edge cases, UX |
| **No-Code Architect** | `nocode_architect` | Concevoir un workflow/automatisation sans code, l'IA evalue faisabilite et maintenabilite |

### Univers 3 — Product & Design (5 modes)

| Mode | `practice_type` | Mecanique |
|------|-----------------|-----------|
| **User Story Craft** | `user_story` | L'IA donne un besoin metier, le user ecrit les user stories, l'IA evalue INVEST |
| **Backlog Prioritization** | `backlog_prio` | Backlog de 20 items, le user priorise avec justification (RICE, MoSCoW) |
| **Sprint Planning** | `sprint_planning` | Equipe simulee avec velocite, le user planifie un sprint, l'IA joue le Scrum Master |
| **User Interview** | `user_interview` | L'IA joue un utilisateur, le user mene l'interview, extraction d'insights |
| **Prototype Review** | `prototype_review` | L'IA teste un prototype (decrit textuellement), feedback utilisateur realiste |

### Univers 4 — Infra, Cloud & DevOps (4 modes)

| Mode | `practice_type` | Mecanique |
|------|-----------------|-----------|
| **Incident Response** | `incident_response` | Alerte Prod : le user diagnostique, communique, resout. Timer + escalation |
| **Architecture Decision Record** | `adr` | Choix d'archi a documenter (ADR), l'IA challenge les alternatives et consequences |
| **Capacity Planning** | `capacity_planning` | Donnees de trafic + croissance, le user dimensionne l'infra, l'IA challenge couts/perf |
| **Security Audit** | `security_audit` | Config/code fourni, le user identifie les vulnerabilites, l'IA revele les failles |

### Univers 5 — Business Analysis & Data (4 modes)

| Mode | `practice_type` | Mecanique |
|------|-----------------|-----------|
| **Requirements Elicitation** | `requirements` | L'IA joue un stakeholder vague, le user doit extraire les vrais besoins |
| **Process Mapping** | `process_mapping` | Decrire un processus metier, identifier les goulots, proposer des optimisations |
| **Data Storytelling** | `data_storytelling` | Jeu de donnees fourni, le user construit un recit convaincant pour le COMEX |
| **KPI Design** | `kpi_design` | Objectif strategique donne, le user definit les KPIs, l'IA challenge pertinence/mesurabilite |

### Univers 6 — Transformation IA & Change (5 modes)

| Mode | `practice_type` | Mecanique |
|------|-----------------|-----------|
| **AI Use Case Design** | `ai_usecase` | Probleme metier donne, le user propose la solution IA, l'IA evalue faisabilite/ROI/ethique |
| **Change Management** | `change_management` | Piloter une transformation : resistances, sponsors, quick wins, plan de communication |
| **AI Impact Assessment** | `ai_impact` | Evaluer l'impact d'un projet IA sur les emplois, les process, l'ethique, la reglementation |
| **Adoption Strategy** | `adoption_strategy` | Deployer un outil/process : le user cree une strategie d'adoption, l'IA joue les resistants |
| **Digital Maturity Audit** | `digital_maturity` | L'IA presente une organisation, le user diagnostique sa maturite numerique et propose un plan |

### Univers 7 — M&A, Restructuring & Finance (4 modes)

| Mode | `practice_type` | Mecanique |
|------|-----------------|-----------|
| **Due Diligence** | `due_diligence` | Dossier d'acquisition avec data room simulee, le user identifie les red flags |
| **Integration Planning** | `integration_planning` | Post-acquisition : le user planifie l'integration (systemes, equipes, culture) |
| **Restructuring Scenario** | `restructuring` | Organisation en difficulte, le user propose un plan de restructuration, l'IA challenge |
| **Valuation Challenge** | `valuation` | Donnees financieres fournies, le user argumente une valorisation, l'IA joue le contradicteur |

### Univers 8 — Leadership & Communication (existant, enrichi)

| Mode | `practice_type` | Mecanique |
|------|-----------------|-----------|
| **Conversation coaching** | `conversation` | Existant — chat libre coaching |
| **Negotiation** | `negotiation` | Simulation adverse avec objectifs caches |
| **Pitch Elevator** | `pitch` | Convaincre en temps limite |
| **Crisis Management** | `crisis` | Evenements temps reel, priorisation sous pression |
| **Feedback 360** | `feedback_360` | Rotation de personas (manager, pair, subordonne) |

### Univers 9 — Juridique & Conformite (4 modes)

| Mode | `practice_type` | Mecanique |
|------|-----------------|-----------|
| **Legal Analysis** | `legal_analysis` | Cas juridique, identifier risques et recommandations |
| **Contract Negotiation** | `contract_negotiation` | Clauses a negocier, l'IA joue la partie adverse |
| **Compliance Scenario** | `compliance` | Dilemme ethique/reglementaire, decider et justifier |
| **GDPR Impact Assessment** | `gdpr_pia` | Projet de traitement de donnees, le user realise une PIA |

### Univers 10 — Strategie & Consulting (existant, enrichi)

| Mode | `practice_type` | Mecanique |
|------|-----------------|-----------|
| **Case Study** | `case_study` | Analyse de cas avec recommandations |
| **Socratic Debate** | `socratic` | L'IA defend la position opposee |
| **Business Model Design** | `bm_design` | Co-construction BMC avec challenge par bloc |
| **Audit & Diagnostic** | `audit` | Donnees brutes a analyser, identifier les problemes |

### Univers 11 — Prompting & IA Literacy (existant, enrichi)

| Mode | `practice_type` | Mecanique |
|------|-----------------|-----------|
| **Prompt Challenge** | `prompt_challenge` | Defi iteratif avec scoring |
| **Prompt Lab** | `prompt_lab` | Techniques avancees (CoT, few-shot) |
| **Teach Back** | `teach_back` | Expliquer un concept a un debutant IA |

### Univers 12 — Vente, RH & Operations (4 modes)

| Mode | `practice_type` | Mecanique |
|------|-----------------|-----------|
| **Sales Closing** | `sales` | Prospect avec objections, funnel de vente |
| **Interview Prep** | `interview` | Simulation entretien par poste |
| **Mediation** | `mediation` | Deux parties en conflit, le user medie |
| **Onboarding Buddy** | `onboarding_buddy` | Simulation des 30 premiers jours |

---

## Architecture du module autonome

### Principe : separation nette

Le module Professional Simulator est un systeme autonome avec sa propre structure, integrable dans n'importe quel contexte (Academy, standalone, embed).

```text
src/components/simulator/
├── SimulatorEngine.tsx          -- Moteur principal (remplace AcademyPractice pour les modes avances)
├── SimulatorShell.tsx           -- Shell plein ecran avec header contextuel
├── SimulatorSidebar.tsx         -- Sidebar optionnelle (objectifs, KPIs, timeline)
├── modes/                      -- Un composant par famille de mode
│   ├── ChatMode.tsx            -- Base : conversation, coaching, negotiation, pitch, feedback...
│   ├── CodeMode.tsx            -- Editeur de code integre : code_review, debug, refactoring, tdd, pair
│   ├── DocumentMode.tsx        -- Editeur de documents : spec_writing, user_story, adr, co_writing
│   ├── AnalysisMode.tsx        -- Dashboard + briefing : case_study, audit, due_diligence, valuation
│   ├── DecisionMode.tsx        -- KPIs dynamiques + choix : decision_game, crisis, incident, restructuring
│   ├── DesignMode.tsx          -- Canvas/board : bm_design, process_mapping, backlog_prio
│   └── AssessmentMode.tsx      -- Grilles + scoring : compliance, gdpr_pia, digital_maturity, ai_impact
├── widgets/                    -- Composants partages entre modes
│   ├── TimerBar.tsx
│   ├── TensionGauge.tsx
│   ├── KPIDashboard.tsx
│   ├── StakeholderMap.tsx
│   ├── ScoreReveal.tsx
│   ├── CodeEditor.tsx          -- Monaco-style readonly/editable
│   ├── DocumentEditor.tsx      -- Rich text split view
│   ├── DataBriefing.tsx        -- Tableaux, chiffres, contexte
│   ├── DecisionTimeline.tsx
│   └── ObjectivesPanel.tsx
└── config/
    ├── modeRegistry.ts         -- Registre de tous les modes avec metadata
    ├── promptTemplates.ts      -- Templates system prompts par mode
    └── typeConfigSchemas.ts    -- Schemas de validation type_config par mode
```

### Base de donnees

```sql
-- Migration unique
ALTER TABLE academy_practices 
  ADD COLUMN IF NOT EXISTS practice_type text NOT NULL DEFAULT 'conversation',
  ADD COLUMN IF NOT EXISTS type_config jsonb DEFAULT '{}';
```

Pas de nouvelles tables. Le champ `type_config` est un sac flexible par mode. Le `practice_type` determine quel sous-composant rendre et quel template de prompt injecter.

### Edge function

Un seul `academy-practice` avec un mapping de "behavior injections" par `practice_type`. Chaque mode ajoute des instructions structurantes au system prompt :
- Format de reponse attendu (JSON pour scores, jauges, code blocks)
- Regles comportementales (adversarial, bienveillant, socratique)
- Criteres d'evaluation specifiques

### 7 familles de rendu UI

Au lieu de 50 composants, les modes sont groupes en **7 familles d'interface** :

| Famille | Modes couverts | UI distincte |
|---------|---------------|-------------|
| **ChatMode** | conversation, negotiation, pitch, feedback_360, sales, interview, mediation, teach_back, onboarding, adoption_strategy | Chat + widgets contextuels (timer, jauge, personas) |
| **CodeMode** | code_review, debug, refactoring, tdd_kata, pair_programming, vibe_coding, prompt_to_app | Editeur de code + chat lateral |
| **DocumentMode** | spec_writing, user_story, adr, co_writing, nocode_architect, data_storytelling | Editeur split + feedback IA |
| **AnalysisMode** | case_study, audit, due_diligence, valuation, kpi_design, requirements | Briefing riche + phases + recommandations |
| **DecisionMode** | decision_game, crisis, incident_response, restructuring, change_management, sprint_planning | KPIs dynamiques + flux d'evenements + timeline |
| **DesignMode** | bm_design, process_mapping, backlog_prio, capacity_planning, integration_planning | Canvas/board interactif + chat |
| **AssessmentMode** | compliance, gdpr_pia, digital_maturity, ai_impact, security_audit, legal_analysis, contract_negotiation | Grille structuree + scoring + recommandations |

### Integration avec l'existant

L'`AcademyPractice.tsx` actuel reste le point d'entree. Il lit `practice.practice_type` et :
- Si `conversation` (defaut) : comportement actuel inchange
- Sinon : rend `<SimulatorEngine practiceType={type} config={typeConfig} ... />`

Le `PracticeTestDialog` admin fonctionne identiquement pour tous les modes.

### Admin — Configuration

Le formulaire `AcademyPracticesTab` ajoute :
- Select "Univers" (filtre les types disponibles)
- Select "Type de pratique" (les modes de cet univers)
- Champs dynamiques `type_config` specifiques au mode choisi
- Template de system prompt pre-rempli modifiable
- Bouton "Tester" (Practice Studio en previewMode)

### Mode Registry (`modeRegistry.ts`)

```text
{
  code_review: {
    family: "code",
    universe: "engineering",
    label: "Code Review",
    description: "Revue de code avec identification de bugs et smells",
    icon: "Code",
    defaultConfig: { language: "typescript", difficulty: "intermediate" },
    promptTemplate: "code_review_template",
    evaluationDimensions: ["bug_detection", "code_quality", "suggestions"]
  },
  ...
}
```

Ce registre alimente dynamiquement l'admin (Select des types), le moteur (choix du composant), et l'edge function (injection de prompts).

---

## Strategie d'implementation

| Phase | Contenu | Effort |
|-------|---------|--------|
| **Phase 1 — Fondation** | Migration DB (practice_type + type_config), modeRegistry, SimulatorEngine shell, ChatMode generique, Prompt Challenge | 1 session |
| **Phase 2 — Code** | CodeMode (code_review + debug + vibe_coding), widget CodeEditor | 1 session |
| **Phase 3 — Decision** | DecisionMode (crisis + decision_game + incident_response), widgets KPI + timer | 1 session |
| **Phase 4 — Document** | DocumentMode (spec_writing + user_story + adr), widget DocumentEditor | 1 session |
| **Phase 5 — Analysis** | AnalysisMode (case_study + due_diligence + valuation), widget DataBriefing | 1 session |
| **Phase 6 — Assessment** | AssessmentMode (compliance + gdpr_pia + ai_impact + digital_maturity) | 1 session |
| **Phase 7 — Design** | DesignMode (bm_design + process_mapping + backlog_prio) | 1 session |
| **Phase 8 — Polish** | Admin config dynamique, templates prompts, mode composite (enchainement) | 1 session |

## Positionnement

Aucune plateforme existante ne propose un simulateur de 50 modes couvrant engineering, product, M&A, juridique, transformation IA, vibe coding, infra et leadership dans un moteur unifie avec evaluation IA et persistance. C'est un **simulateur de competences professionnelles universel**.

