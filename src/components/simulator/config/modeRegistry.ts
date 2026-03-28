// Professional Simulator — Mode Registry
// Maps each practice_type to its UI family, universe, metadata, and evaluation dimensions.

export type ModeFamily = "chat" | "code" | "document" | "analysis" | "decision" | "design" | "assessment";

export type ModeUniverse =
  | "engineering"
  | "vibe_coding"
  | "product"
  | "infra"
  | "business_analysis"
  | "transformation"
  | "ma_finance"
  | "leadership"
  | "legal"
  | "strategy"
  | "prompting"
  | "sales_hr"
  | "personal_development"
  | "therapy";

export interface ModeDefinition {
  family: ModeFamily;
  universe: ModeUniverse;
  label: string;
  description: string;
  icon: string;
  defaultConfig: Record<string, unknown>;
  evaluationDimensions: string[];
}

export const UNIVERSE_LABELS: Record<ModeUniverse, string> = {
  engineering: "Code & Engineering",
  vibe_coding: "Vibe Coding & No-Code",
  product: "Product & Design",
  infra: "Infra, Cloud & DevOps",
  business_analysis: "Business Analysis & Data",
  transformation: "Transformation IA & Change",
  ma_finance: "M&A, Restructuring & Finance",
  leadership: "Leadership & Communication",
  legal: "Juridique & Conformité",
  strategy: "Stratégie & Consulting",
  prompting: "Prompting & IA Literacy",
  sales_hr: "Vente, RH & Opérations",
  personal_development: "Développement Personnel",
  therapy: "Thérapie & Bien-être",
};

export const MODE_REGISTRY: Record<string, ModeDefinition> = {
  // ── Univers 1: Code & Engineering ──
  conversation: {
    family: "chat",
    universe: "leadership",
    label: "Conversation coaching",
    description: "Chat libre avec un coach IA. Jeu de rôle, simulation, mentorat.",
    icon: "MessageSquare",
    defaultConfig: {},
    evaluationDimensions: ["pertinence", "profondeur", "communication"],
  },
  code_review: {
    family: "code",
    universe: "engineering",
    label: "Code Review",
    description: "L'IA soumet du code avec bugs/smells, le user review et propose des corrections.",
    icon: "Code",
    defaultConfig: { language: "typescript", difficulty: "intermediate" },
    evaluationDimensions: ["bug_detection", "code_quality", "suggestions"],
  },
  debug: {
    family: "code",
    universe: "engineering",
    label: "Debug Challenge",
    description: "Un bug est décrit avec stack trace + contexte, le user diagnostique et propose un fix.",
    icon: "Bug",
    defaultConfig: { language: "typescript", difficulty: "intermediate" },
    evaluationDimensions: ["diagnostic", "solution_quality", "reasoning"],
  },
  system_design: {
    family: "chat",
    universe: "engineering",
    label: "System Design",
    description: "Concevez l'architecture d'un système — scalabilité, résilience, coûts.",
    icon: "Network",
    defaultConfig: { scale: "medium", domain: "web" },
    evaluationDimensions: ["scalability", "resilience", "trade_offs", "communication"],
  },
  pair_programming: {
    family: "code",
    universe: "engineering",
    label: "Pair Programming",
    description: "Co-écriture de code tour à tour, l'IA complète ou challenge les choix.",
    icon: "Users",
    defaultConfig: { language: "typescript", max_rounds: 8 },
    evaluationDimensions: ["code_quality", "collaboration", "problem_solving"],
  },
  refactoring: {
    family: "code",
    universe: "engineering",
    label: "Refactoring Dojo",
    description: "Code legacy fourni, le user propose un plan de refactoring, l'IA évalue.",
    icon: "RefreshCw",
    defaultConfig: { language: "typescript", complexity: "medium" },
    evaluationDimensions: ["readability", "performance", "maintainability"],
  },
  tdd_kata: {
    family: "code",
    universe: "engineering",
    label: "TDD Kata",
    description: "L'IA donne un test, le user écrit l'implémentation, boucle red/green/refactor.",
    icon: "TestTube",
    defaultConfig: { language: "typescript", difficulty: "intermediate" },
    evaluationDimensions: ["test_adherence", "code_quality", "iterations"],
  },

  // ── Univers 2: Vibe Coding & No-Code ──
  vibe_coding: {
    family: "code",
    universe: "vibe_coding",
    label: "Vibe Coding",
    description: "Objectif fonctionnel donné, décrivez ce que vous voulez en langage naturel. Score de promptabilité.",
    icon: "Wand2",
    defaultConfig: { target_feature: "", tech_stack: "React + Supabase" },
    evaluationDimensions: ["clarity", "completeness", "edge_cases", "ux_thinking"],
  },
  spec_writing: {
    family: "document",
    universe: "vibe_coding",
    label: "Spec Writing",
    description: "Rédigez des specs fonctionnelles complètes à partir d'un besoin vague.",
    icon: "FileText",
    defaultConfig: { format: "PRD" },
    evaluationDimensions: ["completeness", "clarity", "acceptance_criteria"],
  },
  prompt_to_app: {
    family: "code",
    universe: "vibe_coding",
    label: "Prompt-to-App",
    description: "Écrivez un prompt pour générer une app, l'IA évalue complétude, edge cases, UX.",
    icon: "Sparkles",
    defaultConfig: { complexity: "medium" },
    evaluationDimensions: ["prompt_quality", "edge_cases", "ux_specification"],
  },
  nocode_architect: {
    family: "document",
    universe: "vibe_coding",
    label: "No-Code Architect",
    description: "Concevez un workflow/automatisation sans code, l'IA évalue faisabilité et maintenabilité.",
    icon: "Workflow",
    defaultConfig: { platform: "generic" },
    evaluationDimensions: ["feasibility", "maintainability", "scalability"],
  },

  // ── Univers 3: Product & Design ──
  user_story: {
    family: "document",
    universe: "product",
    label: "User Story Craft",
    description: "L'IA donne un besoin métier, rédigez les user stories, évaluation INVEST.",
    icon: "BookOpen",
    defaultConfig: {},
    evaluationDimensions: ["invest_compliance", "acceptance_criteria", "granularity"],
  },
  backlog_prio: {
    family: "design",
    universe: "product",
    label: "Backlog Prioritization",
    description: "Backlog de 20 items, priorisez avec justification (RICE, MoSCoW).",
    icon: "ListOrdered",
    defaultConfig: { method: "RICE", items_count: 20 },
    evaluationDimensions: ["methodology", "justification", "strategic_alignment"],
  },
  sprint_planning: {
    family: "decision",
    universe: "product",
    label: "Sprint Planning",
    description: "Équipe simulée avec vélocité, planifiez un sprint, l'IA joue le Scrum Master.",
    icon: "Calendar",
    defaultConfig: { team_size: 5, velocity: 40 },
    evaluationDimensions: ["capacity_management", "scope_negotiation", "risk_mitigation"],
  },
  user_interview: {
    family: "chat",
    universe: "product",
    label: "User Interview",
    description: "L'IA joue un utilisateur, menez l'interview, extraction d'insights automatique.",
    icon: "Mic",
    defaultConfig: { persona_type: "end_user" },
    evaluationDimensions: ["question_quality", "active_listening", "insight_extraction"],
  },
  prototype_review: {
    family: "chat",
    universe: "product",
    label: "Prototype Review",
    description: "L'IA teste un prototype (décrit textuellement), feedback utilisateur réaliste.",
    icon: "MonitorSmartphone",
    defaultConfig: {},
    evaluationDimensions: ["usability_detection", "feedback_quality", "ux_improvements"],
  },

  // ── Univers 4: Infra, Cloud & DevOps ──
  incident_response: {
    family: "decision",
    universe: "infra",
    label: "Incident Response",
    description: "Alerte Prod : diagnostiquez, communiquez, résolvez. Timer + escalation.",
    icon: "AlertTriangle",
    defaultConfig: { severity: "P1", time_limit_minutes: 15 },
    evaluationDimensions: ["speed", "communication", "resolution", "post_mortem"],
  },
  adr: {
    family: "document",
    universe: "infra",
    label: "Architecture Decision Record",
    description: "Choix d'archi à documenter (ADR), l'IA challenge les alternatives et conséquences.",
    icon: "GitBranch",
    defaultConfig: {},
    evaluationDimensions: ["alternatives_analysis", "trade_offs", "documentation_quality"],
  },
  capacity_planning: {
    family: "design",
    universe: "infra",
    label: "Capacity Planning",
    description: "Données de trafic + croissance, dimensionnez l'infra, l'IA challenge coûts/perf.",
    icon: "BarChart3",
    defaultConfig: { growth_rate: "2x", timeframe: "12_months" },
    evaluationDimensions: ["cost_optimization", "performance", "scalability"],
  },
  security_audit: {
    family: "assessment",
    universe: "infra",
    label: "Security Audit",
    description: "Config/code fourni, identifiez les vulnérabilités, l'IA révèle les failles.",
    icon: "Shield",
    defaultConfig: { scope: "application" },
    evaluationDimensions: ["vulnerability_detection", "risk_assessment", "remediation"],
  },

  // ── Univers 5: Business Analysis & Data ──
  requirements: {
    family: "analysis",
    universe: "business_analysis",
    label: "Requirements Elicitation",
    description: "L'IA joue un stakeholder vague, extrayez les vrais besoins.",
    icon: "Search",
    defaultConfig: {},
    evaluationDimensions: ["question_technique", "completeness", "disambiguation"],
  },
  process_mapping: {
    family: "design",
    universe: "business_analysis",
    label: "Process Mapping",
    description: "Décrivez un processus métier, identifiez les goulots, proposez des optimisations.",
    icon: "Workflow",
    defaultConfig: {},
    evaluationDimensions: ["process_understanding", "bottleneck_identification", "optimization"],
  },
  data_storytelling: {
    family: "document",
    universe: "business_analysis",
    label: "Data Storytelling",
    description: "Jeu de données fourni, construisez un récit convaincant pour le COMEX.",
    icon: "PieChart",
    defaultConfig: { audience: "executive" },
    evaluationDimensions: ["narrative_quality", "data_accuracy", "actionability"],
  },
  kpi_design: {
    family: "analysis",
    universe: "business_analysis",
    label: "KPI Design",
    description: "Objectif stratégique donné, définissez les KPIs, l'IA challenge pertinence/mesurabilité.",
    icon: "Target",
    defaultConfig: {},
    evaluationDimensions: ["relevance", "measurability", "alignment"],
  },

  // ── Univers 6: Transformation IA & Change ──
  ai_usecase: {
    family: "analysis",
    universe: "transformation",
    label: "AI Use Case Design",
    description: "Problème métier donné, proposez la solution IA, évaluation faisabilité/ROI/éthique.",
    icon: "Brain",
    defaultConfig: {},
    evaluationDimensions: ["feasibility", "roi_estimation", "ethics", "implementation_plan"],
  },
  change_management: {
    family: "decision",
    universe: "transformation",
    label: "Change Management",
    description: "Pilotez une transformation : résistances, sponsors, quick wins, communication.",
    icon: "TrendingUp",
    defaultConfig: { org_size: 500, change_type: "digital_transformation", resistance_level: "high" },
    evaluationDimensions: ["stakeholder_management", "communication", "adoption_strategy"],
  },
  ai_impact: {
    family: "assessment",
    universe: "transformation",
    label: "AI Impact Assessment",
    description: "Évaluez l'impact d'un projet IA sur les emplois, process, éthique, réglementation.",
    icon: "Scale",
    defaultConfig: {},
    evaluationDimensions: ["impact_analysis", "risk_identification", "mitigation_plan"],
  },
  adoption_strategy: {
    family: "chat",
    universe: "transformation",
    label: "Adoption Strategy",
    description: "Déployez un outil/process : créez une stratégie d'adoption, l'IA joue les résistants.",
    icon: "Rocket",
    defaultConfig: {},
    evaluationDimensions: ["strategy_quality", "objection_handling", "measurable_outcomes"],
  },
  digital_maturity: {
    family: "assessment",
    universe: "transformation",
    label: "Digital Maturity Audit",
    description: "L'IA présente une organisation, diagnostiquez sa maturité numérique et proposez un plan.",
    icon: "Gauge",
    defaultConfig: {},
    evaluationDimensions: ["diagnostic_accuracy", "roadmap_quality", "prioritization"],
  },

  // ── Univers 7: M&A, Restructuring & Finance ──
  due_diligence: {
    family: "analysis",
    universe: "ma_finance",
    label: "Due Diligence",
    description: "Dossier d'acquisition avec data room simulée, identifiez les red flags.",
    icon: "FolderSearch",
    defaultConfig: { deal_size: "medium", sector: "tech" },
    evaluationDimensions: ["red_flag_detection", "financial_analysis", "risk_assessment"],
  },
  integration_planning: {
    family: "design",
    universe: "ma_finance",
    label: "Integration Planning",
    description: "Post-acquisition : planifiez l'intégration (systèmes, équipes, culture).",
    icon: "Merge",
    defaultConfig: {},
    evaluationDimensions: ["synergy_identification", "timeline", "cultural_integration"],
  },
  restructuring: {
    family: "decision",
    universe: "ma_finance",
    label: "Restructuring Scenario",
    description: "Organisation en difficulté, proposez un plan de restructuration, l'IA challenge.",
    icon: "Construction",
    defaultConfig: {},
    evaluationDimensions: ["diagnostic", "plan_viability", "stakeholder_impact"],
  },
  valuation: {
    family: "analysis",
    universe: "ma_finance",
    label: "Valuation Challenge",
    description: "Données financières fournies, argumentez une valorisation, l'IA joue le contradicteur.",
    icon: "Calculator",
    defaultConfig: {},
    evaluationDimensions: ["methodology", "argumentation", "market_awareness"],
  },

  // ── Univers 8: Leadership & Communication ──
  negotiation: {
    family: "chat",
    universe: "leadership",
    label: "Négociation",
    description: "Simulation de négociation avec objectifs cachés et tension dynamique.",
    icon: "Handshake",
    defaultConfig: { ai_objectives: [], tension_start: 5 },
    evaluationDimensions: ["persuasion", "active_listening", "compromise", "outcome"],
  },
  pitch: {
    family: "chat",
    universe: "leadership",
    label: "Pitch Elevator",
    description: "Convaincre en temps limité, l'IA joue l'investisseur sceptique.",
    icon: "Timer",
    defaultConfig: { time_limit_seconds: 120, max_message_length: 300 },
    evaluationDimensions: ["clarity", "impact", "structure", "persuasion"],
  },
  crisis: {
    family: "decision",
    universe: "leadership",
    label: "Crisis Management",
    description: "Événements temps réel, priorisation sous pression.",
    icon: "Siren",
    defaultConfig: { event_interval_seconds: 45, total_duration_minutes: 10 },
    evaluationDimensions: ["speed", "prioritization", "communication", "resolution"],
  },
  feedback_360: {
    family: "chat",
    universe: "leadership",
    label: "Feedback 360",
    description: "L'IA joue manager, pair, subordonné tour à tour. Pratique donner et recevoir du feedback.",
    icon: "Users",
    defaultConfig: { personas: ["manager", "peer", "report"] },
    evaluationDimensions: ["empathy", "clarity", "actionability"],
  },
  storytelling: {
    family: "chat",
    universe: "leadership",
    label: "Storytelling",
    description: "Construisez un récit captivant (marque, produit, vision).",
    icon: "BookOpen",
    defaultConfig: { format: "brand_story", audience: "investors" },
    evaluationDimensions: ["narrative_arc", "emotional_engagement", "memorability"],
  },
  crisis_comms: {
    family: "chat",
    universe: "leadership",
    label: "Communication de crise",
    description: "Rédigez communiqués, répondez à la presse, gérez les réseaux.",
    icon: "Megaphone",
    defaultConfig: {},
    evaluationDimensions: ["consistency", "tone", "transparency", "speed"],
  },
  presentation: {
    family: "document",
    universe: "leadership",
    label: "Présentation orale",
    description: "Structurez et délivrez une présentation percutante.",
    icon: "Presentation",
    defaultConfig: {},
    evaluationDimensions: ["structure", "clarity", "impact", "rhythm"],
  },

  // ── Univers 9: Juridique & Conformité ──
  legal_analysis: {
    family: "assessment",
    universe: "legal",
    label: "Analyse juridique",
    description: "Cas juridique, identifiez risques et recommandations.",
    icon: "Gavel",
    defaultConfig: { jurisdiction: "FR", domain: "general" },
    evaluationDimensions: ["legal_accuracy", "risk_identification", "recommendations"],
  },
  contract_negotiation: {
    family: "chat",
    universe: "legal",
    label: "Contract Negotiation",
    description: "Clauses à négocier, l'IA joue la partie adverse.",
    icon: "FileCheck",
    defaultConfig: {},
    evaluationDimensions: ["clause_understanding", "negotiation_skill", "compromise"],
  },
  compliance: {
    family: "assessment",
    universe: "legal",
    label: "Compliance Scenario",
    description: "Dilemme éthique/réglementaire, décidez et justifiez.",
    icon: "ShieldCheck",
    defaultConfig: {},
    evaluationDimensions: ["ethical_reasoning", "regulatory_knowledge", "justification"],
  },
  gdpr_pia: {
    family: "assessment",
    universe: "legal",
    label: "GDPR Impact Assessment",
    description: "Projet de traitement de données, réalisez une PIA.",
    icon: "Lock",
    defaultConfig: {},
    evaluationDimensions: ["data_mapping", "risk_analysis", "mitigation_measures"],
  },

  // ── Univers 10: Stratégie & Consulting ──
  case_study: {
    family: "analysis",
    universe: "strategy",
    label: "Case Study",
    description: "Analyse de cas business, recommandations, debrief.",
    icon: "Briefcase",
    defaultConfig: { case_data: {} },
    evaluationDimensions: ["analysis_depth", "recommendations", "strategic_thinking"],
  },
  socratic: {
    family: "chat",
    universe: "strategy",
    label: "Socratic Debate",
    description: "L'IA défend la position opposée, construisez un argumentaire solide.",
    icon: "Scale",
    defaultConfig: {},
    evaluationDimensions: ["logic", "evidence", "nuance", "counter_arguments"],
  },
  bm_design: {
    family: "design",
    universe: "strategy",
    label: "Business Model Design",
    description: "Co-construisez un business model, l'IA challenge chaque bloc.",
    icon: "LayoutGrid",
    defaultConfig: {},
    evaluationDimensions: ["coherence", "innovation", "viability"],
  },
  audit: {
    family: "analysis",
    universe: "strategy",
    label: "Audit & Diagnostic",
    description: "Données brutes à analyser, identifiez problèmes et priorités.",
    icon: "ClipboardCheck",
    defaultConfig: {},
    evaluationDimensions: ["exhaustivity", "prioritization", "actionability"],
  },

  // ── Univers 11: Prompting & IA Literacy ──
  prompt_challenge: {
    family: "chat",
    universe: "prompting",
    label: "Prompt Challenge",
    description: "L'IA donne un défi, vous promptez, l'IA score et conseille. Itératif.",
    icon: "Zap",
    defaultConfig: { max_retries: 5 },
    evaluationDimensions: ["prompt_quality", "iteration", "result_improvement"],
  },
  prompt_lab: {
    family: "code",
    universe: "prompting",
    label: "Prompt Engineering Lab",
    description: "Techniques avancées (chain-of-thought, few-shot, system prompt). Éditeur multi-sections.",
    icon: "Beaker",
    defaultConfig: { technique: "chain_of_thought" },
    evaluationDimensions: ["technique_mastery", "prompt_structure", "output_quality"],
  },
  teach_back: {
    family: "chat",
    universe: "prompting",
    label: "Teach Back",
    description: "Inversion pédagogique : expliquez un concept à un débutant IA.",
    icon: "GraduationCap",
    defaultConfig: { concept_to_teach: "", difficulty_level: "beginner" },
    evaluationDimensions: ["clarity", "metaphors", "verification", "pedagogy"],
  },

  // ── Univers 12: Vente, RH & Opérations ──
  sales: {
    family: "chat",
    universe: "sales_hr",
    label: "Sales Closing",
    description: "L'IA joue un prospect avec objections, budget, timeline. Funnel de vente.",
    icon: "DollarSign",
    defaultConfig: { prospect_profile: "", objections: [] },
    evaluationDimensions: ["discovery", "objection_handling", "closing", "relationship"],
  },
  interview: {
    family: "chat",
    universe: "sales_hr",
    label: "Interview Prep",
    description: "Simulation d'entretien d'embauche ou de recrutement adapté au poste.",
    icon: "UserCheck",
    defaultConfig: { position: "", competencies: [] },
    evaluationDimensions: ["content", "structure_star", "communication", "authenticity"],
  },
  mediation: {
    family: "chat",
    universe: "sales_hr",
    label: "Médiation",
    description: "Deux parties en conflit (jouées par l'IA), le user médie.",
    icon: "HeartHandshake",
    defaultConfig: {},
    evaluationDimensions: ["neutrality", "empathy", "resolution_quality"],
  },
  onboarding_buddy: {
    family: "chat",
    universe: "sales_hr",
    label: "Onboarding Buddy",
    description: "Simulation des 30 premiers jours, l'IA joue collègues et managers.",
    icon: "UserPlus",
    defaultConfig: {},
    evaluationDimensions: ["integration", "initiative", "communication"],
  },
  culture_quiz: {
    family: "chat",
    universe: "sales_hr",
    label: "Culture Quiz Challenge",
    description: "Quiz conversationnel sur la culture, valeurs et process de l'entreprise.",
    icon: "Building",
    defaultConfig: { company_values: [] },
    evaluationDimensions: ["alignment", "understanding", "application"],
  },
  // ── Univers 13: Développement Personnel ──
  stress_resilience: {
    family: "chat",
    universe: "personal_development",
    label: "Gestion du Stress & Résilience",
    description: "Coaching en psychologie positive, modèle PERMA, techniques de coping et pleine conscience.",
    icon: "Heart",
    defaultConfig: {},
    evaluationDimensions: ["conscience_de_soi", "plan_action", "techniques", "engagement"],
  },
  emotional_intelligence: {
    family: "chat",
    universe: "personal_development",
    label: "Intelligence Émotionnelle",
    description: "Conversation difficile, CNV, gestion des émotions et résolution constructive.",
    icon: "Brain",
    defaultConfig: {},
    evaluationDimensions: ["expression_emotionnelle", "ecoute_active", "cnv", "resolution"],
  },
  confidence_building: {
    family: "chat",
    universe: "personal_development",
    label: "Confiance en Soi",
    description: "Préparation mentale, recadrage cognitif, visualisation positive et ancrage PNL.",
    icon: "Star",
    defaultConfig: {},
    evaluationDimensions: ["identification_blocages", "recadrage", "preparation_mentale", "visualisation"],
  },

  // ── Univers 14: Thérapie & Bien-être ──
  theta_healing_practitioner: {
    family: "chat",
    universe: "therapy",
    label: "Theta Healing — Thérapeute",
    description: "Entraînement à conduire une séance complète : état thêta, croyances aux 4 niveaux, téléchargement de sentiments.",
    icon: "Sparkles",
    defaultConfig: {},
    evaluationDimensions: ["posture_therapeutique", "protocole", "croyances", "telechargement", "ethique"],
  },
  theta_healing_self: {
    family: "chat",
    universe: "therapy",
    label: "Theta Healing — Auto-guérison",
    description: "Travail guidé sur soi avec aide contextuelle maximale, glossaire intégré et exercices d'ancrage.",
    icon: "Leaf",
    defaultConfig: { mode: "guided", help_bubbles: true, glossary: true },
    evaluationDimensions: ["introspection", "engagement_emotionnel", "schemas", "intentions", "autonomie"],
  },
};

// ── Helpers ──

export function getModesByUniverse(universe: ModeUniverse): [string, ModeDefinition][] {
  return Object.entries(MODE_REGISTRY).filter(([, def]) => def.universe === universe);
}

export function getModesByFamily(family: ModeFamily): [string, ModeDefinition][] {
  return Object.entries(MODE_REGISTRY).filter(([, def]) => def.family === family);
}

export function getModeDefinition(practiceType: string): ModeDefinition | undefined {
  return MODE_REGISTRY[practiceType];
}

export function getAllUniverses(): { value: ModeUniverse; label: string; modes: [string, ModeDefinition][] }[] {
  return (Object.keys(UNIVERSE_LABELS) as ModeUniverse[]).map((u) => ({
    value: u,
    label: UNIVERSE_LABELS[u],
    modes: getModesByUniverse(u),
  }));
}
