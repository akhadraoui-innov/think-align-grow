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
    id: "free",
    name: "Free",
    price: 0,
    billing: "monthly",
    features: ["3 parcours Academy", "Simulateur (5 sessions/mois)", "1 toolkit lecture seule", "Community access"],
    cta: "Commencer gratuitement",
  },
  {
    id: "solo",
    name: "Solo",
    price: 29,
    billing: "monthly",
    features: ["Parcours illimités", "Simulateur (20 sessions/mois)", "3 toolkits", "Coach IA basic", "10 crédits IA/mois"],
    cta: "S'abonner",
  },
  {
    id: "team",
    name: "Team",
    price: 89,
    billing: "monthly",
    features: ["5-50 utilisateurs", "Dashboard manager", "Analytics équipe", "Workshops collaboratifs", "30 crédits IA/user/mois", "Support email"],
    cta: "Essai 14 jours",
  },
  {
    id: "pro",
    name: "Pro",
    price: 149,
    billing: "monthly",
    features: ["Tout Team +", "Branding personnalisé", "API & Webhooks", "SSO SAML", "50 crédits IA/user/mois", "AI Value Builder (UCM)", "Support prioritaire"],
    highlighted: true,
    cta: "Essai 14 jours gratuit",
  },
  {
    id: "academy",
    name: "Academy",
    price: 0,
    billing: "custom",
    features: ["Licence groupe (50+ apprenants)", "Parcours sur mesure", "Certification personnalisée", "Analytics avancés", "Crédits IA volume", "Account manager", "Intégration LMS"],
    cta: "Demander un devis",
  },
  {
    id: "enterprise",
    name: "Enterprise",
    price: 0,
    billing: "custom",
    features: ["Multi-tenant & SSO", "API complète & Webhooks", "Custom branding avancé", "Onboarding dédié", "SLA garanti 99.9%", "Volume crédits négocié", "Formations sur mesure", "Data residency"],
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

// ──── PRICING STRATEGY DEFAULTS ────

export const DEFAULT_PRICING_MODELS: PricingModelComparison[] = [
  {
    model: "seat",
    label: "Par siège",
    description: "Facturation mensuelle fixe par utilisateur actif",
    pros: ["Revenus prévisibles", "Simple à comprendre", "Facile à budgéter pour le client"],
    cons: ["Risque de shelfware", "Pas aligné sur la valeur", "Frein à l'adoption large"],
    bestFor: ["PME", "Équipes fixes", "Budgets prévisibles"],
  },
  {
    model: "usage",
    label: "Usage-based",
    description: "Pay-per-use basé sur les crédits IA consommés",
    pros: ["Aligné sur la valeur", "Barrière d'entrée basse", "Scalable naturellement"],
    cons: ["Revenus imprévisibles", "Difficile à budgéter", "Risque de sticker shock"],
    bestFor: ["Startups", "POC / Pilotes", "Usage variable"],
  },
  {
    model: "hybrid",
    label: "Hybride (siège + crédits)",
    description: "Abonnement de base + crédits IA à l'usage au-delà du quota",
    pros: ["MRR prévisible + upside usage", "Meilleur compromis", "Encourage l'adoption"],
    cons: ["Plus complexe à expliquer", "Nécessite un bon quota de base"],
    bestFor: ["ETI", "Grands comptes", "Scale-up"],
  },
  {
    model: "caas",
    label: "CaaS (Consulting-as-a-Service)",
    description: "Plateforme + services d'accompagnement intégrés",
    pros: ["Ticket moyen élevé", "Relation client forte", "Différenciation"],
    cons: ["Moins scalable", "Dépendant des consultants", "Marge variable"],
    bestFor: ["Cabinets de conseil", "Transformation", "Grands projets"],
  },
];

export const DEFAULT_SETUP_FEES: SetupFee[] = [
  { id: "sf1", name: "Onboarding standard", minPrice: 0, maxPrice: 0, description: "Self-service avec tutoriels et documentation" },
  { id: "sf2", name: "Onboarding accompagné", minPrice: 2000, maxPrice: 5000, description: "3 sessions de formation + configuration assistée" },
  { id: "sf3", name: "Intégration SSO/SAML", minPrice: 3000, maxPrice: 8000, description: "Configuration SSO, provisioning utilisateurs, tests" },
  { id: "sf4", name: "Custom branding", minPrice: 2000, maxPrice: 5000, description: "Logo, couleurs, domaine personnalisé, emails" },
  { id: "sf5", name: "Formation admins", minPrice: 3000, maxPrice: 6000, description: "Formation des administrateurs et super-users (2 jours)" },
  { id: "sf6", name: "Intégration LMS / SIRH", minPrice: 5000, maxPrice: 15000, description: "Connecteurs API, synchronisation données, tests E2E" },
  { id: "sf7", name: "Migration de données", minPrice: 3000, maxPrice: 10000, description: "Import parcours, utilisateurs, historique depuis l'ancien système" },
];

export const DEFAULT_ENTERPRISE_TIERS: EnterpriseTier[] = [
  { id: "et1", tier: "100-250 sièges", pricePerSeat: 39, minAnnual: 46800, discount: 74 },
  { id: "et2", tier: "250-500 sièges", pricePerSeat: 29, minAnnual: 87000, discount: 81 },
  { id: "et3", tier: "500-1000 sièges", pricePerSeat: 19, minAnnual: 114000, discount: 87 },
  { id: "et4", tier: "1000+ sièges", pricePerSeat: 14, minAnnual: 168000, discount: 91 },
];

export const DEFAULT_ENTERPRISE_OPTIONS: EnterpriseOption[] = [
  { id: "eo1", name: "API Premium", price: 500, unit: "€/mois", description: "Rate limits étendus, webhooks avancés, sandbox" },
  { id: "eo2", name: "SLA renforcé (99.9%)", price: 300, unit: "€/mois", description: "Garantie de disponibilité, temps de réponse < 4h" },
  { id: "eo3", name: "Support dédié", price: 800, unit: "€/mois", description: "Account manager, Slack privé, reviews trimestrielles" },
  { id: "eo4", name: "Analytics avancés", price: 200, unit: "€/mois", description: "Dashboards custom, exports BI, API analytics" },
  { id: "eo5", name: "Data residency EU", price: 150, unit: "€/mois", description: "Données hébergées exclusivement en Europe" },
];

export const DEFAULT_ACADEMY_GROUP_TIERS: AcademyGroupTier[] = [
  { id: "ag1", learners: "50-200", pricePerLearner: 45, engagement: "Annuel" },
  { id: "ag2", learners: "200-500", pricePerLearner: 35, engagement: "Annuel" },
  { id: "ag3", learners: "500-1000", pricePerLearner: 25, engagement: "Annuel" },
  { id: "ag4", learners: "1000+", pricePerLearner: 18, engagement: "Pluriannuel" },
];

export const DEFAULT_SERVICES: ServiceConfig[] = [
  { id: "sv1", name: "Workshop animé", type: "consulting", priceModel: "Jour", priceRange: "1 500 - 5 000€", margin: 70, description: "Animation de workshops stratégiques avec la plateforme (1/2 à 2 jours)" },
  { id: "sv2", name: "Audit stratégique IA", type: "consulting", priceModel: "Forfait", priceRange: "5 000 - 15 000€", margin: 65, description: "Diagnostic de maturité IA, cartographie des cas d'usage, roadmap" },
  { id: "sv3", name: "Accompagnement transformation", type: "consulting", priceModel: "Mensuel", priceRange: "3 000 - 8 000€/mois", margin: 60, description: "Suivi mensuel, coaching direction, pilotage KPIs" },
  { id: "sv4", name: "Programme certifiant sur mesure", type: "training", priceModel: "Par participant", priceRange: "500 - 2 000€", margin: 55, description: "Parcours co-construits, certification personnalisée, évaluation" },
  { id: "sv5", name: "Bootcamp IA (3-5 jours)", type: "training", priceModel: "Par participant", priceRange: "1 500 - 3 000€", margin: 50, description: "Formation intensive avec simulateur et challenges pratiques" },
  { id: "sv6", name: "Marketplace contenus", type: "marketplace", priceModel: "Commission", priceRange: "15-30%", margin: 80, description: "Contenus de formateurs tiers vendus sur la plateforme" },
];

export const DEFAULT_REVENUE_MIX: RevenueMix = {
  saas: 45,
  credits: 25,
  services: 20,
  partnership: 10,
};

// ──── ROLE-BASED PRICING ────

export interface RolePlanAccess {
  moduleId: string;
  enabled: boolean;
  quotaType: "unlimited" | "monthly" | "yearly" | "per_use";
  quotaLimit: number | null;
}

export interface RolePlanLimits {
  parcours: number | null;
  challenges: number | null;
  workshops: number | null;
  practices: number | null;
  projects: number | null;
  aiCalls: number | null;
}

export interface RolePlan {
  id: string;
  name: string;
  billing: "monthly" | "annual" | "usage";
  pricePerUser: number;
  creditsIncluded: number;
  creditExtraPrice: number;
  moduleAccess: RolePlanAccess[];
  limits: RolePlanLimits;
}

export interface PricingRole {
  id: string;
  name: string;
  description: string;
  icon: string;
  plans: RolePlan[];
  defaultPlanId: string;
  valueLevel: "strategic" | "operational" | "consumption";
}

export interface SaleModel {
  id: string;
  label: string;
  description: string;
  includesSetup: boolean;
  includesServices: boolean;
}

export interface QuoteRoleConfig {
  roleId: string;
  planId: string;
  count: number;
}

const allModulesAccess = (enabled: boolean): RolePlanAccess[] =>
  DEFAULT_MODULES.map(m => ({ moduleId: m.id, enabled, quotaType: "unlimited" as const, quotaLimit: null }));

const selectModulesAccess = (ids: string[]): RolePlanAccess[] =>
  DEFAULT_MODULES.map(m => ({ moduleId: m.id, enabled: ids.includes(m.id), quotaType: "unlimited" as const, quotaLimit: null }));

export const DEFAULT_PRICING_ROLES: PricingRole[] = [
  {
    id: "decider",
    name: "Décideur / Admin",
    description: "Accès complet à tous les modules, analytics, configuration. Valeur stratégique maximale.",
    icon: "Shield",
    valueLevel: "strategic",
    defaultPlanId: "decider-premium",
    plans: [
      {
        id: "decider-essential",
        name: "Admin Essential",
        billing: "monthly",
        pricePerUser: 99,
        creditsIncluded: 50,
        creditExtraPrice: 0.40,
        moduleAccess: allModulesAccess(true),
        limits: { parcours: null, challenges: null, workshops: null, practices: null, projects: null, aiCalls: null },
      },
      {
        id: "decider-premium",
        name: "Admin Premium",
        billing: "monthly",
        pricePerUser: 199,
        creditsIncluded: 200,
        creditExtraPrice: 0.30,
        moduleAccess: allModulesAccess(true),
        limits: { parcours: null, challenges: null, workshops: null, practices: null, projects: null, aiCalls: null },
      },
    ],
  },
  {
    id: "manager",
    name: "Manager / Lead",
    description: "Pilotage d'équipe, facilitation workshops, analytics équipe. Valeur opérationnelle forte.",
    icon: "Users",
    valueLevel: "operational",
    defaultPlanId: "manager-standard",
    plans: [
      {
        id: "manager-standard",
        name: "Manager",
        billing: "monthly",
        pricePerUser: 79,
        creditsIncluded: 30,
        creditExtraPrice: 0.45,
        moduleAccess: selectModulesAccess(["academy", "simulator", "workshop", "challenge"]),
        limits: { parcours: 20, challenges: 10, workshops: 10, practices: 30, projects: null, aiCalls: 200 },
      },
      {
        id: "manager-plus",
        name: "Manager+",
        billing: "monthly",
        pricePerUser: 129,
        creditsIncluded: 80,
        creditExtraPrice: 0.35,
        moduleAccess: allModulesAccess(true),
        limits: { parcours: null, challenges: null, workshops: 30, practices: null, projects: 10, aiCalls: 500 },
      },
    ],
  },
  {
    id: "user",
    name: "Utilisateur",
    description: "Consommation de contenus, formation, simulations. Modèle annuel bas ou pay-as-you-use.",
    icon: "User",
    valueLevel: "consumption",
    defaultPlanId: "user-annual",
    plans: [
      {
        id: "user-annual",
        name: "User Annuel",
        billing: "annual",
        pricePerUser: 19,
        creditsIncluded: 10,
        creditExtraPrice: 0.50,
        moduleAccess: selectModulesAccess(["academy", "simulator", "challenge", "toolkits"]),
        limits: { parcours: 5, challenges: 5, workshops: 0, practices: 15, projects: null, aiCalls: 50 },
      },
      {
        id: "user-payg",
        name: "User As-You-Use",
        billing: "usage",
        pricePerUser: 0,
        creditsIncluded: 0,
        creditExtraPrice: 0.50,
        moduleAccess: selectModulesAccess(["academy", "simulator", "challenge", "toolkits"]),
        limits: { parcours: 5, challenges: 5, workshops: 0, practices: 15, projects: null, aiCalls: 50 },
      },
    ],
  },
  {
    id: "learner",
    name: "Apprenant externe",
    description: "Accès Academy uniquement. Licence groupe, formations certifiantes, parcours dédiés.",
    icon: "GraduationCap",
    valueLevel: "consumption",
    defaultPlanId: "learner-standard",
    plans: [
      {
        id: "learner-standard",
        name: "Apprenant",
        billing: "annual",
        pricePerUser: 9,
        creditsIncluded: 5,
        creditExtraPrice: 0.60,
        moduleAccess: selectModulesAccess(["academy"]),
        limits: { parcours: 3, challenges: 0, workshops: 0, practices: 5, projects: null, aiCalls: 20 },
      },
      {
        id: "learner-premium",
        name: "Apprenant Premium",
        billing: "annual",
        pricePerUser: 19,
        creditsIncluded: 15,
        creditExtraPrice: 0.50,
        moduleAccess: selectModulesAccess(["academy", "simulator", "challenge"]),
        limits: { parcours: null, challenges: 3, workshops: 0, practices: 15, projects: null, aiCalls: 50 },
      },
    ],
  },
];

export const DEFAULT_SALE_MODELS: SaleModel[] = [
  { id: "saas-pure", label: "SaaS pur", description: "Abonnement plateforme seul, self-service", includesSetup: false, includesServices: false },
  { id: "saas-conseil", label: "SaaS + Conseil", description: "Plateforme + missions d'accompagnement stratégique", includesSetup: true, includesServices: true },
  { id: "academy-groupe", label: "Academy Groupe", description: "Licence bulk apprenants, parcours dédiés, certification", includesSetup: true, includesServices: false },
  { id: "caas", label: "CaaS (Consulting-as-a-Service)", description: "Plateforme intégrée aux missions de conseil — la techno au service du conseil", includesSetup: true, includesServices: true },
  { id: "partnership", label: "Partnership / White-label", description: "Revente, co-branding ou intégration white-label avec commission", includesSetup: true, includesServices: false },
];

export const VALUE_PRICE_MATRIX = [
  { module: "Academy", valueScore: 9, priceContribution: 35 },
  { module: "Simulateur", valueScore: 8, priceContribution: 20 },
  { module: "Workshop", valueScore: 7, priceContribution: 15 },
  { module: "Challenge", valueScore: 6, priceContribution: 10 },
  { module: "UCM (AI Value Builder)", valueScore: 9, priceContribution: 15 },
  { module: "Toolkits", valueScore: 5, priceContribution: 5 },
];
  { module: "Academy", valueScore: 9, priceContribution: 35 },
  { module: "Simulateur", valueScore: 8, priceContribution: 20 },
  { module: "Workshop", valueScore: 7, priceContribution: 15 },
  { module: "Challenge", valueScore: 6, priceContribution: 10 },
  { module: "UCM (AI Value Builder)", valueScore: 9, priceContribution: 15 },
  { module: "Toolkits", valueScore: 5, priceContribution: 5 },
];
