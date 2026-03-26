// Type config field definitions per practice_type for admin forms

export interface ConfigField {
  key: string;
  label: string;
  type: "text" | "number" | "select" | "textarea" | "json" | "tags";
  placeholder?: string;
  options?: { value: string; label: string }[];
  defaultValue?: unknown;
  min?: number;
  max?: number;
}

const LANGUAGE_OPTIONS = [
  { value: "typescript", label: "TypeScript" },
  { value: "javascript", label: "JavaScript" },
  { value: "python", label: "Python" },
  { value: "java", label: "Java" },
  { value: "go", label: "Go" },
  { value: "rust", label: "Rust" },
  { value: "sql", label: "SQL" },
];

const DIFFICULTY_OPTIONS = [
  { value: "beginner", label: "Débutant" },
  { value: "intermediate", label: "Intermédiaire" },
  { value: "advanced", label: "Avancé" },
  { value: "expert", label: "Expert" },
];

export const TYPE_CONFIG_SCHEMAS: Record<string, ConfigField[]> = {
  conversation: [],

  prompt_challenge: [
    { key: "max_retries", label: "Tentatives max", type: "number", defaultValue: 5, min: 2, max: 15 },
  ],

  negotiation: [
    { key: "tension_start", label: "Tension initiale (1-10)", type: "number", defaultValue: 5, min: 1, max: 10 },
    { key: "ai_objectives", label: "Objectifs cachés de l'IA (JSON)", type: "textarea", placeholder: '["Obtenir 20% de remise", "Refuser les délais > 30j"]' },
  ],

  pitch: [
    { key: "time_limit_seconds", label: "Temps limite (secondes)", type: "number", defaultValue: 120, min: 30, max: 600 },
    { key: "max_message_length", label: "Longueur max par message", type: "number", defaultValue: 300, min: 100, max: 1000 },
  ],

  code_review: [
    { key: "language", label: "Langage", type: "select", options: LANGUAGE_OPTIONS, defaultValue: "typescript" },
    { key: "difficulty", label: "Difficulté", type: "select", options: DIFFICULTY_OPTIONS, defaultValue: "intermediate" },
  ],

  debug: [
    { key: "language", label: "Langage", type: "select", options: LANGUAGE_OPTIONS, defaultValue: "typescript" },
    { key: "difficulty", label: "Difficulté", type: "select", options: DIFFICULTY_OPTIONS, defaultValue: "intermediate" },
  ],

  system_design: [
    { key: "scale", label: "Échelle", type: "select", options: [{ value: "small", label: "Petit" }, { value: "medium", label: "Moyen" }, { value: "large", label: "Grand" }], defaultValue: "medium" },
    { key: "domain", label: "Domaine", type: "text", placeholder: "e-commerce, fintech, social..." },
  ],

  pair_programming: [
    { key: "language", label: "Langage", type: "select", options: LANGUAGE_OPTIONS, defaultValue: "typescript" },
    { key: "max_rounds", label: "Tours max", type: "number", defaultValue: 8, min: 4, max: 20 },
  ],

  refactoring: [
    { key: "language", label: "Langage", type: "select", options: LANGUAGE_OPTIONS, defaultValue: "typescript" },
    { key: "complexity", label: "Complexité", type: "select", options: DIFFICULTY_OPTIONS, defaultValue: "intermediate" },
  ],

  tdd_kata: [
    { key: "language", label: "Langage", type: "select", options: LANGUAGE_OPTIONS, defaultValue: "typescript" },
    { key: "difficulty", label: "Difficulté", type: "select", options: DIFFICULTY_OPTIONS, defaultValue: "intermediate" },
  ],

  vibe_coding: [
    { key: "target_feature", label: "Feature cible", type: "textarea", placeholder: "Dashboard analytics avec graphiques temps réel..." },
    { key: "tech_stack", label: "Stack technique", type: "text", defaultValue: "React + Supabase" },
  ],

  spec_writing: [
    { key: "format", label: "Format de spec", type: "select", options: [{ value: "PRD", label: "PRD" }, { value: "RFC", label: "RFC" }, { value: "BRD", label: "BRD" }], defaultValue: "PRD" },
  ],

  prompt_to_app: [
    { key: "complexity", label: "Complexité de l'app", type: "select", options: DIFFICULTY_OPTIONS, defaultValue: "intermediate" },
  ],

  case_study: [
    { key: "case_data", label: "Données du cas (JSON)", type: "textarea", placeholder: '{"company": "...", "revenue": "...", "market_share": "..."}' },
  ],

  decision_game: [
    { key: "initial_budget", label: "Budget initial", type: "number", defaultValue: 100000, min: 0 },
    { key: "initial_morale", label: "Moral initial (0-100)", type: "number", defaultValue: 80, min: 0, max: 100 },
  ],

  crisis: [
    { key: "event_interval_seconds", label: "Intervalle événements (sec)", type: "number", defaultValue: 45, min: 15, max: 120 },
    { key: "total_duration_minutes", label: "Durée totale (min)", type: "number", defaultValue: 10, min: 5, max: 30 },
  ],

  incident_response: [
    { key: "severity", label: "Sévérité", type: "select", options: [{ value: "P1", label: "P1 - Critique" }, { value: "P2", label: "P2 - Majeur" }, { value: "P3", label: "P3 - Mineur" }], defaultValue: "P1" },
    { key: "time_limit_minutes", label: "Temps limite (min)", type: "number", defaultValue: 15, min: 5, max: 60 },
  ],

  change_management: [
    { key: "org_size", label: "Taille organisation", type: "number", defaultValue: 500 },
    { key: "change_type", label: "Type de changement", type: "text", placeholder: "digital_transformation, restructuring, merger..." },
    { key: "resistance_level", label: "Niveau de résistance", type: "select", options: [{ value: "low", label: "Faible" }, { value: "medium", label: "Moyen" }, { value: "high", label: "Élevé" }], defaultValue: "medium" },
  ],

  due_diligence: [
    { key: "deal_size", label: "Taille du deal", type: "select", options: [{ value: "small", label: "Petit (<5M€)" }, { value: "medium", label: "Moyen (5-50M€)" }, { value: "large", label: "Grand (>50M€)" }], defaultValue: "medium" },
    { key: "sector", label: "Secteur", type: "text", placeholder: "tech, santé, industrie..." },
  ],

  legal_analysis: [
    { key: "jurisdiction", label: "Juridiction", type: "select", options: [{ value: "FR", label: "France" }, { value: "EU", label: "Union Européenne" }, { value: "US", label: "États-Unis" }, { value: "INT", label: "International" }], defaultValue: "FR" },
    { key: "domain", label: "Domaine juridique", type: "text", placeholder: "RGPD, droit du travail, IP..." },
  ],

  sales: [
    { key: "prospect_profile", label: "Profil prospect", type: "textarea", placeholder: "PME industrielle, 200 employés, budget serré..." },
    { key: "objections", label: "Objections principales (JSON)", type: "textarea", placeholder: '["prix trop élevé", "timing pas bon", "solution concurrente en place"]' },
  ],

  interview: [
    { key: "position", label: "Poste visé", type: "text", placeholder: "Product Manager, Développeur Senior..." },
    { key: "competencies", label: "Compétences clés (JSON)", type: "textarea", placeholder: '["leadership", "problem_solving", "communication"]' },
  ],

  teach_back: [
    { key: "concept_to_teach", label: "Concept à enseigner", type: "textarea", placeholder: "Le machine learning supervisé, les design patterns..." },
    { key: "difficulty_level", label: "Niveau de l'apprenant simulé", type: "select", options: DIFFICULTY_OPTIONS, defaultValue: "beginner" },
  ],

  ai_usecase: [],
  ai_impact: [],
  digital_maturity: [],
  adoption_strategy: [],
  compliance: [],
  gdpr_pia: [],
  socratic: [],
  feedback_360: [],
  storytelling: [],
  crisis_comms: [],
  presentation: [],
  contract_negotiation: [],
  mediation: [],
  onboarding_buddy: [],
  culture_quiz: [],
  user_story: [],
  backlog_prio: [],
  sprint_planning: [],
  user_interview: [],
  prototype_review: [],
  adr: [],
  capacity_planning: [],
  security_audit: [],
  requirements: [],
  process_mapping: [],
  data_storytelling: [],
  kpi_design: [],
  integration_planning: [],
  restructuring: [],
  valuation: [],
  nocode_architect: [],
  bm_design: [],
  audit: [],
  prompt_lab: [],
};

export function getConfigFields(practiceType: string): ConfigField[] {
  return TYPE_CONFIG_SCHEMAS[practiceType] || [];
}
