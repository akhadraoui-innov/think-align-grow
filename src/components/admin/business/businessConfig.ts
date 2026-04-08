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
  segments: Record<string, number>; // segment → attractivity 1-3
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

export const DEFAULT_TAM = 50000; // M€
export const DEFAULT_SAM = 5000;
export const DEFAULT_SOM = 50;
