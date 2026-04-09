// Centralized config — all defaults for the Business & Revenue module

export interface PlanConfig {
  id: string;
  name: string;
  price: number;
  billing: "monthly" | "yearly" | "custom";
  features: string[];
  highlighted?: boolean;
  cta: string;
}

export interface CreditAction {
  id: string;
  action: string;
  cost: number;
  avgUsagePerUser: number;
}

export interface ModuleConfig {
  id: string;
  name: string;
  description: string;
  delivery: string;
  priceRange: string;
  active: boolean;
  segments: Record<string, number>;
}

export interface ChannelConfig {
  id: string;
  name: string;
  share: number;
  conversionRate: number;
  cac: number;
  color: string;
}

export interface SegmentConfig {
  id: string;
  name: string;
  weight: number;
  size: string;
  potential: number;
}

export interface GeoRegion {
  id: string;
  name: string;
  active: boolean;
  tamMultiplier: number;
}

export interface PartnerTier {
  id: string;
  name: string;
  commission: number;
  minRevenue: number;
  benefits: string[];
}

export interface SalesStage {
  id: string;
  name: string;
  durationWeeks: number;
  conversionRate: number;
}

export interface ScenarioPreset {
  id: string;
  name: string;
  color: string;
  starterClients: number;
  proClients: number;
  enterpriseClients: number;
  conversionRate: number;
  churnRate: number;
  growthRate: number;
  fixedCosts: number;
  variableCostPerClient: number;
}

export interface BMCBlock {
  id: string;
  title: string;
  items: string[];
}

export interface SWOTItem {
  id: string;
  text: string;
  priority: "high" | "medium" | "low";
}

export interface SWOTData {
  strengths: SWOTItem[];
  weaknesses: SWOTItem[];
  opportunities: SWOTItem[];
  threats: SWOTItem[];
}

// ──── NEW TYPES ────

export interface SetupFee {
  id: string;
  name: string;
  minPrice: number;
  maxPrice: number;
  description: string;
}

export interface ServiceConfig {
  id: string;
  name: string;
  type: "consulting" | "training" | "marketplace";
  priceModel: string;
  priceRange: string;
  margin: number;
  description: string;
}

export interface RevenueMix {
  saas: number;
  credits: number;
  services: number;
  partnership: number;
}

export interface PricingModelComparison {
  model: "seat" | "usage" | "hybrid" | "caas";
  label: string;
  description: string;
  pros: string[];
  cons: string[];
  bestFor: string[];
}

export interface EnterpriseTier {
  id: string;
  tier: string;
  pricePerSeat: number;
  minAnnual: number;
  discount: number;
}

export interface EnterpriseOption {
  id: string;
  name: string;
  price: number;
  unit: string;
  description: string;
}

export interface AcademyGroupTier {
  id: string;
  learners: string;
  pricePerLearner: number;
  engagement: string;
}

export interface TokenCost {
  id: string;
  action: string;
  avgInputTokens: number;
  avgOutputTokens: number;
  costPer1MInput: number;   // $/1M tokens
  costPer1MOutput: number;
}

export interface Competitor {
  id: string;
  name: string;
  price: number;         // €/mois
  features: number;      // score 1-10
  category: string;
  isUs?: boolean;
}

export interface BusinessRisk {
  id: string;
  name: string;
  category: "tech" | "market" | "regulatory" | "financial" | "hr";
  probability: number;  // 0-100
  impact: number;        // 0-100
  mitigation: string;
}

export interface MEDDICScore {
  id: string;
  prospectName: string;
  metrics: number;
  economicBuyer: number;
  decisionCriteria: number;
  decisionProcess: number;
  identifyPain: number;
  champion: number;
}

export interface CohortRow {
  cohort: string;
  m0: number;
  m1: number;
  m2: number;
  m3: number;
  m6: number;
  m12: number;
}

export interface PersonaConfig {
  id: string;
  role: string;
  painPoint: string;
  budget: string;
  decisionTime: string;
}

export interface TrendConfig {
  id: string;
  name: string;
  cagr: string;
  impact: "Très fort" | "Fort" | "Moyen" | "Faible";
}

export interface RoadmapPhase {
  id: string;
  phase: string;
  title: string;
  items: string[];
  color: string;
}

export interface EntUseCaseConfig {
  id: string;
  sector: string;
  opportunity: number;
  modules: string[];
  deal: string;
}

// ──── DEFAULTS ────

export const DEFAULT_PLANS: PlanConfig[] = [
  {
    id: "starter",
    name: "Starter",
    price: 0,
    billing: "monthly",
    features: ["3 parcours Academy", "Simulateur (5 sessions/mois)", "1 toolkit lecture seule", "Community access"],
    cta: "Commencer gratuitement",
  },
  {
    id: "pro",
    name: "Pro",
    price: 149,
    billing: "monthly",
    features: ["Parcours illimités", "Simulateur illimité", "Workshops & Challenges", "AI Value Builder (UCM)", "50 crédits IA/mois", "Support prioritaire"],
    highlighted: true,
    cta: "Essai 14 jours gratuit",
  },
  {
    id: "enterprise",
    name: "Enterprise",
    price: 0,
    billing: "custom",
    features: ["Multi-tenant & SSO", "API & Webhooks", "Custom branding", "Onboarding dédié", "SLA garanti", "Volume crédits négocié", "Formations sur mesure"],
    cta: "Contacter les ventes",
  },
];

export const DEFAULT_CREDITS: CreditAction[] = [
  { id: "coach", action: "Coach IA (chat)", cost: 1, avgUsagePerUser: 15 },
  { id: "reflection", action: "Réflexion IA", cost: 2, avgUsagePerUser: 8 },
  { id: "deliverable", action: "Livrable (SWOT, BMC…)", cost: 5, avgUsagePerUser: 3 },
  { id: "simulator", action: "Session Simulateur", cost: 3, avgUsagePerUser: 6 },
  { id: "cover", action: "Génération image couverture", cost: 2, avgUsagePerUser: 1 },
  { id: "analysis", action: "Analyse Challenge IA", cost: 10, avgUsagePerUser: 2 },
];

export const DEFAULT_MODULES: ModuleConfig[] = [
  { id: "academy", name: "Academy", description: "Parcours de formation IA adaptatifs avec quiz, exercices et certification", delivery: "SaaS", priceRange: "Inclus Pro", active: true, segments: { cabinet: 3, eti: 3, grand_compte: 2, of: 3, pme: 2 } },
  { id: "simulator", name: "Simulateur Pro", description: "7 modes de simulation IA (Chat, Analyse, Décision, Design, Code, Document, Assessment)", delivery: "SaaS", priceRange: "3 crédits/session", active: true, segments: { cabinet: 2, eti: 3, grand_compte: 3, of: 2, pme: 1 } },
  { id: "workshop", name: "Workshop Canvas", description: "Canvas collaboratif avec cartes stratégiques, sticky notes et IA embarquée", delivery: "SaaS + CaaS", priceRange: "Inclus Pro", active: true, segments: { cabinet: 3, eti: 2, grand_compte: 3, of: 1, pme: 2 } },
  { id: "challenge", name: "Challenge", description: "Jeux stratégiques gamifiés avec drag & drop et analyse IA", delivery: "SaaS", priceRange: "Inclus Pro", active: true, segments: { cabinet: 2, eti: 2, grand_compte: 2, of: 3, pme: 3 } },
  { id: "ucm", name: "AI Value Builder", description: "Générateur de cas d'usage IA par secteur avec analyse et synthèse", delivery: "SaaS + CaaS", priceRange: "Plan Pro requis", active: true, segments: { cabinet: 3, eti: 3, grand_compte: 3, of: 1, pme: 1 } },
  { id: "toolkits", name: "Toolkits", description: "Bibliothèque de frameworks stratégiques (400+ cartes) avec quiz intégré", delivery: "SaaS", priceRange: "1 gratuit", active: true, segments: { cabinet: 3, eti: 2, grand_compte: 2, of: 3, pme: 3 } },
];

export const DEFAULT_CHANNELS: ChannelConfig[] = [
  { id: "direct", name: "Vente directe", share: 40, conversionRate: 15, cac: 300, color: "hsl(var(--primary))" },
  { id: "partners", name: "Partenaires", share: 30, conversionRate: 25, cac: 150, color: "hsl(142 76% 36%)" },
  { id: "inbound", name: "Inbound / Content", share: 20, conversionRate: 8, cac: 80, color: "hsl(262 83% 58%)" },
  { id: "events", name: "Événementiel", share: 10, conversionRate: 12, cac: 500, color: "hsl(25 95% 53%)" },
];

export const DEFAULT_SEGMENTS: SegmentConfig[] = [
  { id: "cabinet", name: "Cabinets de conseil", weight: 30, size: "15 000", potential: 80 },
  { id: "eti", name: "ETI (250-5000 sal.)", weight: 25, size: "5 800", potential: 70 },
  { id: "grand_compte", name: "Grands groupes", weight: 15, size: "280", potential: 95 },
  { id: "of", name: "Organismes de formation", weight: 20, size: "45 000", potential: 60 },
  { id: "pme", name: "PME innovantes", weight: 10, size: "180 000", potential: 40 },
];

export const DEFAULT_GEO_REGIONS: GeoRegion[] = [
  { id: "france", name: "France", active: true, tamMultiplier: 1 },
  { id: "afrique", name: "Afrique francophone", active: true, tamMultiplier: 0.3 },
  { id: "belgique", name: "Belgique & Suisse", active: false, tamMultiplier: 0.15 },
  { id: "canada", name: "Canada francophone", active: false, tamMultiplier: 0.1 },
  { id: "europe", name: "Europe (EN)", active: false, tamMultiplier: 0.4 },
];

export const DEFAULT_PARTNER_TIERS: PartnerTier[] = [
  { id: "silver", name: "Silver", commission: 15, minRevenue: 0, benefits: ["Accès plateforme démo", "Support email", "Co-branding basic"] },
  { id: "gold", name: "Gold", commission: 25, minRevenue: 50000, benefits: ["Formation certifiante", "Leads qualifiés", "Dashboard partenaire", "Support dédié"] },
  { id: "platinum", name: "Platinum", commission: 35, minRevenue: 200000, benefits: ["White-label possible", "API custom", "Account manager", "Co-développement", "Événements exclusifs"] },
];

export const DEFAULT_SALES_STAGES: SalesStage[] = [
  { id: "discovery", name: "Découverte", durationWeeks: 2, conversionRate: 60 },
  { id: "qualification", name: "Qualification", durationWeeks: 3, conversionRate: 50 },
  { id: "demo", name: "Démo & POC", durationWeeks: 4, conversionRate: 40 },
  { id: "proposal", name: "Proposition", durationWeeks: 3, conversionRate: 70 },
  { id: "closing", name: "Closing", durationWeeks: 2, conversionRate: 80 },
];

export const DEFAULT_SCENARIOS: ScenarioPreset[] = [
  { id: "conservative", name: "Conservateur", color: "hsl(142 76% 36%)", starterClients: 200, proClients: 30, enterpriseClients: 2, conversionRate: 5, churnRate: 8, growthRate: 5, fixedCosts: 15000, variableCostPerClient: 5 },
  { id: "realistic", name: "Réaliste", color: "hsl(var(--primary))", starterClients: 500, proClients: 80, enterpriseClients: 5, conversionRate: 10, churnRate: 5, growthRate: 10, fixedCosts: 25000, variableCostPerClient: 5 },
  { id: "ambitious", name: "Ambitieux", color: "hsl(262 83% 58%)", starterClients: 1000, proClients: 200, enterpriseClients: 15, conversionRate: 15, churnRate: 3, growthRate: 20, fixedCosts: 40000, variableCostPerClient: 4 },
  { id: "custom", name: "Custom", color: "hsl(25 95% 53%)", starterClients: 300, proClients: 50, enterpriseClients: 3, conversionRate: 8, churnRate: 6, growthRate: 8, fixedCosts: 20000, variableCostPerClient: 5 },
];

export const DEFAULT_BMC: BMCBlock[] = [
  { id: "partners", title: "Partenaires clés", items: ["Supabase (infra)", "OpenAI / Google (IA)", "Cabinets de conseil", "Organismes de formation", "Universités & écoles"] },
  { id: "activities", title: "Activités clés", items: ["Développement plateforme", "Création de contenu pédagogique", "R&D IA appliquée", "Customer success", "Vente & marketing B2B"] },
  { id: "resources", title: "Ressources clés", items: ["Équipe tech full-stack", "Modèles IA fine-tunés", "Base de 400+ cartes stratégiques", "Expertise conseil/formation", "Propriété intellectuelle"] },
  { id: "value", title: "Proposition de valeur", items: ["IA appliquée au conseil stratégique", "Formation adaptive personnalisée", "Plateforme tout-en-un (SaaS + CaaS)", "ROI mesurable pour les clients", "35 secteurs couverts"] },
  { id: "relations", title: "Relations clients", items: ["Self-service (Starter)", "Support prioritaire (Pro)", "Account manager (Enterprise)", "Community & événements", "Onboarding personnalisé"] },
  { id: "channels", title: "Canaux", items: ["Site web & SEO", "Vente directe B2B", "Réseau partenaires", "Content marketing", "Événements & webinaires"] },
  { id: "segments", title: "Segments clients", items: ["Cabinets de conseil", "ETI en transformation", "Grands groupes (Innovation/DRH)", "Organismes de formation", "PME innovantes"] },
  { id: "costs", title: "Structure de coûts", items: ["Infrastructure cloud (30%)", "Équipe R&D (40%)", "Sales & Marketing (20%)", "Support & Ops (10%)"] },
  { id: "revenue", title: "Flux de revenus", items: ["Abonnements SaaS (MRR)", "Crédits IA (pay-per-use)", "Licences Enterprise", "CaaS (Consulting-as-a-Service)", "Formation certifiante"] },
];

export const DEFAULT_SWOT: SWOTData = {
  strengths: [
    { id: "s1", text: "Plateforme tout-en-un unique (6 modules)", priority: "high" },
    { id: "s2", text: "IA intégrée nativement dans chaque module", priority: "high" },
    { id: "s3", text: "400+ cartes stratégiques propriétaires", priority: "medium" },
    { id: "s4", text: "35 secteurs UCM couverts", priority: "medium" },
    { id: "s5", text: "UX premium et moderne", priority: "low" },
  ],
  weaknesses: [
    { id: "w1", text: "Notoriété de marque encore faible", priority: "high" },
    { id: "w2", text: "Équipe commerciale réduite", priority: "high" },
    { id: "w3", text: "Dépendance aux APIs IA tierces", priority: "medium" },
    { id: "w4", text: "Pas de mobile app native", priority: "low" },
  ],
  opportunities: [
    { id: "o1", text: "Marché IA formation en croissance 25%/an", priority: "high" },
    { id: "o2", text: "Afrique francophone sous-équipée", priority: "high" },
    { id: "o3", text: "Réglementation IA (AI Act) favorise la formation", priority: "medium" },
    { id: "o4", text: "Partenariats cabinets Big4", priority: "medium" },
  ],
  threats: [
    { id: "t1", text: "LMS établis ajoutent de l'IA", priority: "high" },
    { id: "t2", text: "Compression des prix par les pure players", priority: "medium" },
    { id: "t3", text: "Évolution rapide des modèles IA", priority: "medium" },
    { id: "t4", text: "Cycle de vente long en Enterprise", priority: "low" },
  ],
};

export const SEGMENT_LABELS: Record<string, string> = {
  cabinet: "Cabinets",
  eti: "ETI",
  grand_compte: "Grands comptes",
  of: "OF",
  pme: "PME",
};

export const DEFAULT_TAM = 50000;
export const DEFAULT_SAM = 5000;
export const DEFAULT_SOM = 50;

// ──── NEW DEFAULTS ────

export const DEFAULT_TOKEN_COSTS: TokenCost[] = [
  { id: "coach", action: "Coach IA (chat)", avgInputTokens: 2000, avgOutputTokens: 800, costPer1MInput: 2.5, costPer1MOutput: 10 },
  { id: "reflection", action: "Réflexion IA", avgInputTokens: 3000, avgOutputTokens: 1500, costPer1MInput: 2.5, costPer1MOutput: 10 },
  { id: "deliverable", action: "Livrable (SWOT, BMC…)", avgInputTokens: 5000, avgOutputTokens: 3000, costPer1MInput: 2.5, costPer1MOutput: 10 },
  { id: "simulator", action: "Session Simulateur (×5 turns)", avgInputTokens: 15000, avgOutputTokens: 5000, costPer1MInput: 2.5, costPer1MOutput: 10 },
  { id: "cover", action: "Image couverture", avgInputTokens: 500, avgOutputTokens: 0, costPer1MInput: 40, costPer1MOutput: 0 },
  { id: "analysis", action: "Analyse Challenge", avgInputTokens: 8000, avgOutputTokens: 4000, costPer1MInput: 2.5, costPer1MOutput: 10 },
];

export const DEFAULT_COMPETITORS: Competitor[] = [
  { id: "c1", name: "360Learning", price: 8, features: 6, category: "LMS collaboratif" },
  { id: "c2", name: "Docebo", price: 15, features: 7, category: "LMS Enterprise" },
  { id: "c3", name: "Coursera for Business", price: 30, features: 5, category: "Content marketplace" },
  { id: "c4", name: "McKinsey Solve", price: 0, features: 4, category: "Assessment" },
  { id: "c5", name: "Klaxoon", price: 10, features: 5, category: "Workshop" },
  { id: "c6", name: "GROWTHINNOV", price: 149, features: 9, category: "IA + Formation + Conseil", isUs: true },
];

export const DEFAULT_RISKS: BusinessRisk[] = [
  { id: "r1", name: "Hausse brutale coût tokens LLM (+200%)", category: "tech", probability: 30, impact: 80, mitigation: "Multi-provider (OpenAI + Gemini + open-source), cache sémantique, négociation volume" },
  { id: "r2", name: "LMS établis intègrent IA générative", category: "market", probability: 70, impact: 60, mitigation: "Différenciation par les 6 modules intégrés, vélocité produit, niche conseil+formation" },
  { id: "r3", name: "AI Act impose certification des outils IA formation", category: "regulatory", probability: 50, impact: 50, mitigation: "Veille réglementaire, documentation conformité, partenariat juridique" },
  { id: "r4", name: "Cash runway < 6 mois sans levée", category: "financial", probability: 40, impact: 90, mitigation: "Revenue-based growth, bridge financing, accélération pipeline Enterprise" },
  { id: "r5", name: "Commoditisation des agents IA (build vs buy)", category: "market", probability: 60, impact: 70, mitigation: "Valeur dans le contenu propriétaire (400+ cartes, 35 secteurs UCM), pas juste la techno" },
  { id: "r6", name: "Départ d'un membre clé de l'équipe tech", category: "hr", probability: 25, impact: 70, mitigation: "Documentation exhaustive, pair programming, equity vesting" },
];

export const DEFAULT_MEDDIC: MEDDICScore[] = [
  { id: "m1", prospectName: "BNP Paribas — DRH", metrics: 8, economicBuyer: 7, decisionCriteria: 6, decisionProcess: 5, identifyPain: 9, champion: 7 },
  { id: "m2", prospectName: "Capgemini — Innovation", metrics: 7, economicBuyer: 6, decisionCriteria: 8, decisionProcess: 7, identifyPain: 8, champion: 8 },
  { id: "m3", prospectName: "EDF — Académie interne", metrics: 6, economicBuyer: 5, decisionCriteria: 7, decisionProcess: 4, identifyPain: 7, champion: 5 },
];

export const DEFAULT_COHORTS: CohortRow[] = [
  { cohort: "Jan", m0: 100, m1: 85, m2: 78, m3: 72, m6: 60, m12: 48 },
  { cohort: "Fév", m0: 100, m1: 88, m2: 80, m3: 75, m6: 63, m12: 50 },
  { cohort: "Mar", m0: 100, m1: 82, m2: 75, m3: 70, m6: 58, m12: 45 },
  { cohort: "Avr", m0: 100, m1: 90, m2: 84, m3: 78, m6: 65, m12: 52 },
];

export const DEFAULT_PERSONAS: PersonaConfig[] = [
  { id: "p1", role: "DG / CEO", painPoint: "ROI de la transformation IA", budget: "Élevé", decisionTime: "3-6 mois" },
  { id: "p2", role: "DRH", painPoint: "Montée en compétences IA des équipes", budget: "Moyen", decisionTime: "2-4 mois" },
  { id: "p3", role: "DSI / CTO", painPoint: "Intégration IA dans les process", budget: "Élevé", decisionTime: "4-6 mois" },
  { id: "p4", role: "CDO", painPoint: "Stratégie data & IA", budget: "Moyen-Élevé", decisionTime: "2-3 mois" },
  { id: "p5", role: "Dir. Innovation", painPoint: "Identifier les cas d'usage IA à valeur", budget: "Moyen", decisionTime: "1-3 mois" },
  { id: "p6", role: "Dir. Formation", painPoint: "Moderniser l'offre formation avec l'IA", budget: "Faible-Moyen", decisionTime: "1-2 mois" },
];

export const DEFAULT_TRENDS: TrendConfig[] = [
  { id: "t1", name: "IA générative en entreprise", cagr: "35%", impact: "Très fort" },
  { id: "t2", name: "Formation professionnelle digitale", cagr: "18%", impact: "Fort" },
  { id: "t3", name: "Consulting-as-a-Service", cagr: "22%", impact: "Fort" },
  { id: "t4", name: "Low-code / No-code", cagr: "25%", impact: "Moyen" },
  { id: "t5", name: "Sustainability & ESG", cagr: "15%", impact: "Moyen" },
];

export const DEFAULT_ROADMAP: RoadmapPhase[] = [
  { id: "rm1", phase: "M1-M3", title: "Fondations", items: ["Site web & SEO", "Contenu thought leadership", "Premiers partenaires", "Early adopters"], color: "bg-primary/10 border-primary/30" },
  { id: "rm2", phase: "M4-M6", title: "Accélération", items: ["Campagnes inbound", "Programme partenaires", "Événements sectoriels", "Case studies"], color: "bg-emerald-500/10 border-emerald-500/30" },
  { id: "rm3", phase: "M7-M12", title: "Scale", items: ["Expansion géographique", "Enterprise ABM", "Marketplace", "Affiliation"], color: "bg-purple-500/10 border-purple-500/30" },
];

export const DEFAULT_ENT_USE_CASES: EntUseCaseConfig[] = [
  { id: "uc1", sector: "Banque & Assurance", opportunity: 95, modules: ["UCM", "Simulator", "Academy"], deal: "80-200K€" },
  { id: "uc2", sector: "Industrie 4.0", opportunity: 80, modules: ["Workshop", "Challenge", "Academy"], deal: "50-150K€" },
  { id: "uc3", sector: "Conseil & Audit", opportunity: 90, modules: ["Toolkits", "Workshop", "UCM"], deal: "30-100K€" },
  { id: "uc4", sector: "Secteur public", opportunity: 60, modules: ["Academy", "Simulator"], deal: "40-120K€" },
  { id: "uc5", sector: "Retail & Distribution", opportunity: 70, modules: ["UCM", "Academy", "Challenge"], deal: "40-100K€" },
];

export const RISK_CATEGORY_LABELS: Record<string, string> = {
  tech: "Technologique",
  market: "Marché",
  regulatory: "Réglementaire",
  financial: "Financier",
  hr: "RH",
};

export const RISK_CATEGORY_COLORS: Record<string, string> = {
  tech: "bg-blue-500/10 text-blue-600 border-blue-500/20",
  market: "bg-orange-500/10 text-orange-600 border-orange-500/20",
  regulatory: "bg-purple-500/10 text-purple-600 border-purple-500/20",
  financial: "bg-destructive/10 text-destructive border-destructive/20",
  hr: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
};
