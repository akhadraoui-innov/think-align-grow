import {
  BookOpen, GraduationCap, CheckCircle2, Code, MessageSquare,
  Users, LayoutGrid, Brain, Sparkles, BarChart3,
  FileText, Lightbulb, Award, Settings, Eye,
  Shield, Zap, Building2, TrendingUp, Database,
  Target, ScrollText, Clock
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

export type FlowLayer = "learner" | "ai" | "admin" | "data";

export interface FlowNode {
  id: string;
  label: string;
  description: string;
  detail: string;
  layer: FlowLayer;
  icon: LucideIcon;
  features: string[];
  techBadges: string[];
  connections: string[];
  position: { col: number; row: number };
}

export const LAYER_CONFIG: Record<FlowLayer, { label: string; color: string; bg: string; border: string; text: string }> = {
  learner: { label: "Expérience Apprenant", color: "hsl(var(--primary))", bg: "bg-primary/10", border: "border-primary/30", text: "text-primary" },
  ai:      { label: "Intelligence Artificielle", color: "hsl(var(--accent))", bg: "bg-accent/10", border: "border-accent/30", text: "text-accent-foreground" },
  admin:   { label: "Administration", color: "hsl(var(--destructive))", bg: "bg-orange-500/10", border: "border-orange-500/30", text: "text-orange-600 dark:text-orange-400" },
  data:    { label: "Données & Persistance", color: "hsl(142 76% 36%)", bg: "bg-emerald-500/10", border: "border-emerald-500/30", text: "text-emerald-600 dark:text-emerald-400" },
};

export const FLOW_NODES: FlowNode[] = [
  // ── Couche Apprenant (row 0-1) ──
  {
    id: "parcours", label: "Parcours", description: "Parcours adaptatifs par fonction et persona",
    detail: "Les parcours sont le cœur de l'expérience apprenant. Chaque parcours est construit autour d'une fonction métier et d'un persona, avec des modules ordonnés, des prérequis et des compétences cibles. L'IA personnalise le contenu en fonction du profil de l'apprenant.",
    layer: "learner", icon: BookOpen,
    features: ["Parcours par fonction/persona", "Modules ordonnés avec prérequis", "Compétences cibles mesurables", "Difficulté progressive", "Guide document PDF généré"],
    techBadges: ["Adaptatif", "Multi-tenant"],
    connections: ["lecons", "ia-generation", "parametrage", "progress"],
    position: { col: 0, row: 0 },
  },
  {
    id: "lecons", label: "Leçons", description: "Contenu Markdown enrichi interactif",
    detail: "Chaque leçon est un contenu Markdown enrichi avec callouts pédagogiques (💡 À retenir, 📜 Le saviez-vous, ⚠️ Attention), tableaux comparatifs et illustrations. L'IA génère un brief personnalisé à l'ouverture de chaque module.",
    layer: "learner", icon: GraduationCap,
    features: ["Markdown enrichi avec callouts", "Brief IA personnalisé", "Temps de lecture estimé", "Suivi de progression"],
    techBadges: ["Markdown Pro", "IA Brief"],
    connections: ["quiz", "ia-tutor", "knowledge-brief"],
    position: { col: 1, row: 0 },
  },
  {
    id: "quiz", label: "Quiz", description: "QCM avec scoring et feedback IA",
    detail: "Les quiz évaluent la compréhension avec des QCM multi-types. Chaque réponse est persistée, scorée et expliquée par l'IA. Le feedback est immédiat et personnalisé, avec un score par question et un score global.",
    layer: "learner", icon: CheckCircle2,
    features: ["QCM multi-types", "Scoring automatique", "Explication IA par question", "Réponses persistées", "Score minimum configurable"],
    techBadges: ["Scoring", "Feedback IA"],
    connections: ["exercices", "ia-evaluation", "scores"],
    position: { col: 2, row: 0 },
  },
  {
    id: "exercices", label: "Exercices", description: "Production libre évaluée par IA",
    detail: "L'apprenant produit un livrable libre (analyse, document, plan d'action) évalué par l'IA selon une grille de critères configurable. L'évaluation est multidimensionnelle avec des recommandations concrètes.",
    layer: "learner", icon: Code,
    features: ["Production libre", "Grille de critères configurable", "Évaluation IA multidimensionnelle", "Recommandations concrètes", "Types de sortie variés (texte, code, document)"],
    techBadges: ["IA Évaluation", "Critères"],
    connections: ["pratique-ia", "ia-evaluation", "scores"],
    position: { col: 3, row: 0 },
  },
  {
    id: "pratique-ia", label: "Pratique IA", description: "Simulateur 7 modes conversationnels",
    detail: "Le simulateur propose 7 modes d'entraînement professionnel : Analyse, Design, Code, Document, Chat, Évaluation et Décision. Chaque session est scorée avec un radar de compétences, une timeline de décisions et des suggestions d'amélioration.",
    layer: "learner", icon: Sparkles,
    features: ["7 modes de simulation", "Scoring intelligent", "Radar de compétences", "Historique des sessions", "Rapports détaillés", "Jauge de tension"],
    techBadges: ["7 modes", "Scoring", "Gamification"],
    connections: ["ia-coach", "sessions", "scores"],
    position: { col: 4, row: 0 },
  },
  {
    id: "workshops", label: "Workshops", description: "Canevas collaboratif temps réel",
    detail: "Espace de travail collaboratif en temps réel avec un canevas interactif : cartes stratégiques, sticky notes, textes, icônes, flèches et groupes. Les toolkits fournissent la méthodologie et les cartes, la gamification engage les participants.",
    layer: "learner", icon: Users,
    features: ["Canevas temps réel", "Cartes stratégiques", "Sticky notes & textes", "Flèches & groupes", "Système de points", "Discussion contextuelle"],
    techBadges: ["Temps réel", "Gamification"],
    connections: ["ia-coach", "challenges", "sessions"],
    position: { col: 5, row: 0 },
  },
  {
    id: "challenges", label: "Challenges", description: "Diagnostic stratégique drag & drop",
    detail: "Les challenges permettent de réaliser un diagnostic stratégique structuré avec un board interactif. L'utilisateur sélectionne des cartes, les place dans des slots, évalue la maturité et reçoit une analyse IA automatique.",
    layer: "learner", icon: LayoutGrid,
    features: ["Board interactif drag & drop", "Templates de challenges", "Évaluation de maturité (1-5)", "Analyse IA automatique", "Multi-sujets", "Format configurable"],
    techBadges: ["Drag & Drop", "Analyse IA"],
    connections: ["ia-analyse", "scores"],
    position: { col: 5, row: 1 },
  },

  // ── Couche IA (row 2) ──
  {
    id: "ia-tutor", label: "IA Tutor", description: "Accompagnement personnalisé par module",
    detail: "L'IA Tutor accompagne l'apprenant tout au long de son parcours. Elle génère des briefs personnalisés, explique les concepts difficiles, guide les exercices et fournit un feedback contextuel en temps réel.",
    layer: "ai", icon: Brain,
    features: ["Brief personnalisé à l'ouverture", "Explication contextuelle", "Guide d'exercice", "Feedback en temps réel", "Adaptation au profil"],
    techBadges: ["GPT / Gemini", "Contextuel"],
    connections: ["lecons", "quiz", "exercices", "knowledge-brief"],
    position: { col: 0, row: 2 },
  },
  {
    id: "ia-coach", label: "IA Coach", description: "Guide contextuel workshops & simulateur",
    detail: "L'IA Coach intervient pendant les workshops et les sessions de simulation pour guider, challenger et enrichir les interactions. Elle comprend le contexte du toolkit, du scénario et de l'historique des échanges.",
    layer: "ai", icon: MessageSquare,
    features: ["Guide contextuel", "Challenge constructif", "Enrichissement des discussions", "Compréhension du toolkit", "Suggestions de prochaines étapes"],
    techBadges: ["Temps réel", "Contextuel"],
    connections: ["pratique-ia", "workshops"],
    position: { col: 1, row: 2 },
  },
  {
    id: "ia-evaluation", label: "IA Évaluation", description: "Scoring et feedback automatique",
    detail: "L'IA d'évaluation score automatiquement les quiz, exercices et pratiques IA selon des grilles configurables. Elle produit un feedback détaillé par dimension avec des recommandations concrètes d'amélioration.",
    layer: "ai", icon: BarChart3,
    features: ["Scoring multidimensionnel", "Grilles configurables", "Feedback détaillé", "Recommandations concrètes", "Évaluation globale du parcours"],
    techBadges: ["Multi-dimensions", "Configurable"],
    connections: ["quiz", "exercices", "scores", "certificats"],
    position: { col: 2, row: 2 },
  },
  {
    id: "ia-generation", label: "IA Génération", description: "Création de contenu pédagogique",
    detail: "L'IA de génération crée automatiquement des parcours complets, des modules, des quiz, des exercices et des pratiques IA à partir d'une description métier. Elle peut générer en batch et respecter les templates configurés.",
    layer: "ai", icon: Zap,
    features: ["Génération de parcours complets", "Création de modules", "Quiz automatiques", "Exercices avec critères", "Pratiques IA scénarisées", "Mode batch"],
    techBadges: ["GPT", "Gemini", "Batch"],
    connections: ["parcours", "parametrage"],
    position: { col: 3, row: 2 },
  },
  {
    id: "ia-analyse", label: "IA Analyse", description: "Diagnostic et recommandations",
    detail: "L'IA d'analyse traite les réponses des challenges pour produire un rapport stratégique complet : score de maturité, identification des gaps, recommandations priorisées et plan d'action concret.",
    layer: "ai", icon: Target,
    features: ["Score de maturité", "Identification des gaps", "Recommandations priorisées", "Plan d'action", "Comparaison inter-sessions"],
    techBadges: ["Analyse stratégique", "Rapport"],
    connections: ["challenges", "documents"],
    position: { col: 4, row: 2 },
  },
  {
    id: "knowledge-brief", label: "Knowledge Brief", description: "Synthèse personnalisée pré-module",
    detail: "Le Knowledge Brief est un résumé personnalisé généré par l'IA à l'ouverture de chaque module. Il contextualise le contenu en fonction du profil de l'apprenant, de ses acquis et de ses objectifs.",
    layer: "ai", icon: Lightbulb,
    features: ["Auto-généré à l'ouverture", "Personnalisé au profil", "Basé sur les acquis précédents", "Contextualisé aux objectifs", "Persistant"],
    techBadges: ["Auto-généré", "Personnalisé"],
    connections: ["lecons", "ia-tutor", "progress"],
    position: { col: 5, row: 2 },
  },
  {
    id: "ia-document", label: "IA Document", description: "Livret de cours PDF complet",
    detail: "L'IA Document génère un livret de restitution complet de 4 à 8 pages contenant tout le contenu du parcours, les exercices, les annotations et les évaluations. Le document est envoyé par email et historisé.",
    layer: "ai", icon: FileText,
    features: ["Livret 4-8 pages", "Contenu complet du parcours", "Exercices et annotations", "Évaluations intégrées", "Envoi par email", "Historisation"],
    techBadges: ["PDF", "Email", "Batch"],
    connections: ["parcours", "documents"],
    position: { col: 3, row: 3 },
  },

  // ── Couche Admin (row 1) ──
  {
    id: "parametrage", label: "Paramétrage", description: "Fonctions, personae, compétences",
    detail: "L'administration permet de configurer l'ensemble de l'écosystème : fonctions métier, personae apprenants, compétences cibles, grilles d'évaluation. L'IA assiste chaque étape de configuration.",
    layer: "admin", icon: Settings,
    features: ["Fonctions métier", "Personae apprenants", "Compétences cibles", "Grilles d'évaluation", "Templates de pratiques IA", "Configuration multi-tenant"],
    techBadges: ["Multi-tenant", "RBAC"],
    connections: ["parcours", "ia-generation", "organisations"],
    position: { col: 0, row: 1 },
  },
  {
    id: "observabilite", label: "Observabilité", description: "Dashboard, métriques, couverture",
    detail: "Le dashboard d'observabilité offre une vue temps réel sur l'activité de la plateforme : progression des apprenants, couverture des compétences, matrice fonctions × compétences, catalogue d'assets et métriques d'utilisation.",
    layer: "admin", icon: Eye,
    features: ["Dashboard temps réel", "Catalogue d'assets", "Matrice couverture", "Métriques d'utilisation", "Filtres avancés"],
    techBadges: ["Analytics", "Temps réel"],
    connections: ["progress", "scores", "organisations"],
    position: { col: 1, row: 1 },
  },
  {
    id: "roles", label: "Rôles", description: "RBAC granulaire avec audit trail",
    detail: "Le système de rôles et permissions permet un contrôle granulaire des accès : admin, manager, formateur, apprenant. Chaque action est tracée dans un audit trail complet.",
    layer: "admin", icon: Shield,
    features: ["4 niveaux de rôles", "Permissions granulaires", "Audit trail complet", "Gestion par organisation", "Super-admin platform"],
    techBadges: ["RBAC", "Audit"],
    connections: ["organisations"],
    position: { col: 2, row: 1 },
  },
  {
    id: "credits", label: "Crédits", description: "Système de consommation IA",
    detail: "Le système de crédits gère la consommation des fonctionnalités IA : chaque appel IA (tutoring, évaluation, génération) consomme des crédits. Les quotas sont configurables par organisation et par plan d'abonnement.",
    layer: "admin", icon: Zap,
    features: ["Crédits par action IA", "Quotas par organisation", "Plans d'abonnement", "Historique de consommation", "Alertes de seuil"],
    techBadges: ["Quotas", "Plans"],
    connections: ["organisations", "ia-tutor"],
    position: { col: 3, row: 1 },
  },
  {
    id: "organisations", label: "Organisations", description: "Multi-tenant, équipes, branding",
    detail: "La plateforme supporte le multi-tenant avec des organisations distinctes, chacune avec ses équipes, son branding, ses configurations IA et ses parcours personnalisés.",
    layer: "admin", icon: Building2,
    features: ["Multi-tenant", "Équipes et groupes", "Branding personnalisé", "Configuration IA par org", "Portail dédié"],
    techBadges: ["White-label", "Multi-tenant"],
    connections: ["parametrage", "roles", "credits"],
    position: { col: 4, row: 1 },
  },

  // ── Couche Data (row 3-4) ──
  {
    id: "progress", label: "Progress", description: "Suivi granulaire par module",
    detail: "Chaque interaction de l'apprenant est persistée dans le système de progression : temps passé, réponses aux quiz, soumissions d'exercices, sessions de pratique IA. Les metadata sont enrichies et exploitées par l'IA.",
    layer: "data", icon: TrendingUp,
    features: ["Suivi par module", "Temps passé", "Réponses persistées", "Metadata enrichies", "Statuts granulaires"],
    techBadges: ["Temps réel", "Persistant"],
    connections: ["lecons", "quiz", "knowledge-brief", "observabilite"],
    position: { col: 0, row: 3 },
  },
  {
    id: "scores", label: "Scores", description: "Évaluation par compétence persistée",
    detail: "Les scores sont calculés par compétence et par module, avec un suivi de l'évolution dans le temps. Les skill assessments mesurent le niveau initial et final pour chaque compétence du parcours.",
    layer: "data", icon: BarChart3,
    features: ["Score par compétence", "Niveau initial vs final", "Évolution temporelle", "Radar de compétences", "Benchmark"],
    techBadges: ["Compétences", "Évolution"],
    connections: ["quiz", "exercices", "ia-evaluation", "certificats"],
    position: { col: 1, row: 3 },
  },
  {
    id: "certificats", label: "Certificats", description: "Vérifiables, QR code, LinkedIn",
    detail: "Les certificats sont délivrés automatiquement à la complétion d'un parcours avec un score suffisant. Chaque certificat est vérifiable publiquement via QR code et partageable sur LinkedIn.",
    layer: "data", icon: Award,
    features: ["Délivrance automatique", "QR code vérifiable", "Partage LinkedIn", "Score minimum configurable", "Historique complet"],
    techBadges: ["QR Code", "LinkedIn"],
    connections: ["ia-evaluation", "scores"],
    position: { col: 2, row: 3 },
  },
  {
    id: "sessions", label: "Sessions", description: "Historique simulateur complet",
    detail: "Chaque session de simulateur et de workshop est enregistrée avec l'intégralité des échanges, les scores, les métriques et le rapport final. L'historique permet de mesurer la progression dans le temps.",
    layer: "data", icon: Clock,
    features: ["Historique complet", "Messages et échanges", "Scores et métriques", "Rapports finaux", "Replay de session"],
    techBadges: ["Historique", "Replay"],
    connections: ["pratique-ia", "workshops"],
    position: { col: 4, row: 3 },
  },
  {
    id: "documents", label: "Documents", description: "Livrets, analyses, rapports",
    detail: "Tous les documents générés sont historisés : livrets de cours, analyses de challenges, rapports de simulation, évaluations globales. Chaque document est versionné et peut être renvoyé par email.",
    layer: "data", icon: ScrollText,
    features: ["Livrets de cours", "Analyses de challenges", "Rapports de simulation", "Évaluations globales", "Versionnement", "Envoi email"],
    techBadges: ["Versionné", "Email"],
    connections: ["ia-document", "ia-analyse", "certificats"],
    position: { col: 5, row: 3 },
  },
];

export function getNodeById(id: string): FlowNode | undefined {
  return FLOW_NODES.find(n => n.id === id);
}
