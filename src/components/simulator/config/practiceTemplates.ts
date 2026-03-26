// Pre-built templates for quick practice creation, grouped by practice_type
export interface PracticeTemplate {
  label: string;
  title: string;
  scenario: string;
  system_prompt: string;
  max_exchanges: number;
  difficulty: string;
  type_config: Record<string, unknown>;
  evaluation_rubric: { criterion: string; weight: number; description: string }[];
}

export const PRACTICE_TEMPLATES: Record<string, PracticeTemplate[]> = {
  negotiation: [
    {
      label: "Négociation commerciale B2B",
      title: "Négociation de contrat SaaS avec un grand compte",
      scenario: "Vous êtes commercial senior chez un éditeur SaaS. Vous rencontrez le DSI d'un grand groupe industriel (500M€ CA) pour négocier un contrat de 3 ans. Votre objectif : obtenir un engagement annuel de 120K€ minimum. Le DSI a un budget serré et compare avec un concurrent 30% moins cher.",
      system_prompt: "Tu es le DSI d'un grand groupe industriel. Tu disposes d'un budget de 80K€/an max et tu as déjà une offre concurrente à 70K€. Tu es ouvert mais exigeant. Tu veux des garanties SLA, un support premium et une clause de sortie.",
      max_exchanges: 12,
      difficulty: "intermediate",
      type_config: { tension_start: 6, ai_objectives: ["Obtenir un prix < 90K€/an", "SLA 99.9% garanti", "Clause de sortie à 6 mois"] },
      evaluation_rubric: [
        { criterion: "Découverte des besoins", weight: 2, description: "Qualité des questions posées" },
        { criterion: "Argumentation valeur", weight: 3, description: "Capacité à vendre la valeur vs le prix" },
        { criterion: "Gestion des objections", weight: 2, description: "Réponses aux objections prix/concurrence" },
        { criterion: "Closing", weight: 2, description: "Technique de closing et engagement" },
      ],
    },
    {
      label: "Négociation salariale",
      title: "Négociation d'augmentation salariale annuelle",
      scenario: "Vous êtes manager depuis 2 ans dans une ESN. Vos résultats sont excellents (+35% de CA sur votre BU). Vous estimez mériter une augmentation de 15%. Votre entretien annuel commence.",
      system_prompt: "Tu es le DRH. Le budget augmentations est limité à 3% en moyenne. Ce collaborateur est performant mais le marché est tendu. Tu peux aller jusqu'à 8% max + avantages non-monétaires.",
      max_exchanges: 10,
      difficulty: "intermediate",
      type_config: { tension_start: 4, ai_objectives: ["Limiter l'augmentation à 5-8%", "Proposer des avantages non-monétaires", "Retenir le talent"] },
      evaluation_rubric: [
        { criterion: "Préparation argumentaire", weight: 2, description: "Données factuelles et benchmarks" },
        { criterion: "Gestion émotionnelle", weight: 2, description: "Maîtrise et professionnalisme" },
        { criterion: "Créativité solutions", weight: 2, description: "Package global vs salaire seul" },
      ],
    },
  ],

  prompt_challenge: [
    {
      label: "Prompt pour analyse de données",
      title: "Challenge : Prompter une analyse de ventes",
      scenario: "Vous disposez d'un jeu de données de ventes (CSV : date, produit, région, quantité, CA, coût). Votre mission : écrire le prompt le plus efficace possible pour obtenir une analyse complète avec insights actionnables.",
      system_prompt: "Tu évalues la qualité des prompts d'analyse de données. Le prompt idéal doit : spécifier le format de sortie, demander des visualisations, inclure des critères de segmentation, et demander des recommandations actionnables.",
      max_exchanges: 8,
      difficulty: "beginner",
      type_config: { max_retries: 5 },
      evaluation_rubric: [
        { criterion: "Clarté du prompt", weight: 2, description: "Instructions claires et non-ambiguës" },
        { criterion: "Complétude", weight: 3, description: "Tous les aspects de l'analyse couverts" },
        { criterion: "Format de sortie", weight: 2, description: "Spécification du format attendu" },
      ],
    },
    {
      label: "Prompt pour génération de code",
      title: "Challenge : Prompter un composant React",
      scenario: "Vous devez écrire un prompt pour qu'une IA génère un composant React de dashboard avec : graphique temps réel, filtres, export CSV, responsive. Écrivez le meilleur prompt possible.",
      system_prompt: "Tu évalues des prompts de génération de code React. Le prompt idéal spécifie : composants, état, props, cas limites, accessibilité, responsive, et gestion d'erreurs.",
      max_exchanges: 8,
      difficulty: "intermediate",
      type_config: { max_retries: 5 },
      evaluation_rubric: [
        { criterion: "Spécification technique", weight: 3, description: "Stack, composants, API attendues" },
        { criterion: "Edge cases", weight: 2, description: "Gestion erreurs, loading, empty states" },
        { criterion: "UX thinking", weight: 2, description: "Responsive, accessibilité, animations" },
      ],
    },
  ],

  code_review: [
    {
      label: "Review d'une API REST",
      title: "Code Review : API Express avec problèmes de sécurité",
      scenario: "Un développeur junior a soumis une PR pour une API REST Express.js. Le code contient des endpoints CRUD pour la gestion d'utilisateurs. Identifiez les problèmes de sécurité, performance et maintenabilité.",
      system_prompt: "Présente un code Express.js de ~80 lignes avec : injection SQL, pas de validation d'input, tokens JWT mal gérés, N+1 queries, et pas de rate limiting. Révèle les problèmes progressivement.",
      max_exchanges: 8,
      difficulty: "intermediate",
      type_config: { language: "typescript", difficulty: "intermediate" },
      evaluation_rubric: [
        { criterion: "Détection de vulnérabilités", weight: 3, description: "Identification des failles de sécurité" },
        { criterion: "Qualité des corrections", weight: 2, description: "Solutions proposées appropriées" },
        { criterion: "Performance", weight: 2, description: "Identification des problèmes de performance" },
      ],
    },
  ],

  crisis: [
    {
      label: "Panne production e-commerce",
      title: "Crise : Panne majeure du site e-commerce en Black Friday",
      scenario: "Il est 10h un vendredi de Black Friday. Le site e-commerce (50K visiteurs/h) est tombé. Les ventes sont à zéro. Le PDG est en ligne. Les réseaux sociaux s'enflamment. Vous êtes le Directeur Technique.",
      system_prompt: "Simule une crise technique majeure. Envoie des alertes : Slack paniqué, emails clients, tweets négatifs, appels du PDG. Les problèmes s'empilent : base de données saturée, CDN down, équipe réduite.",
      max_exchanges: 15,
      difficulty: "advanced",
      type_config: { event_interval_seconds: 30, total_duration_minutes: 12 },
      evaluation_rubric: [
        { criterion: "Priorisation", weight: 3, description: "Capacité à trier l'urgent de l'important" },
        { criterion: "Communication", weight: 3, description: "Communication claire aux parties prenantes" },
        { criterion: "Résolution technique", weight: 2, description: "Qualité des actions techniques" },
        { criterion: "Post-mortem", weight: 1, description: "Analyse des causes racines" },
      ],
    },
  ],

  case_study: [
    {
      label: "Transformation digitale retail",
      title: "Cas : Stratégie digitale d'une enseigne de retail traditionnelle",
      scenario: "RetailCo, enseigne de prêt-à-porter avec 200 magasins en France, voit ses ventes chuter de 15%/an depuis 3 ans. Le e-commerce représente 5% du CA (vs 30% chez les concurrents). Le COMEX vous mandate pour proposer une stratégie de transformation digitale sur 3 ans.",
      system_prompt: "Tu es le consultant senior qui présente ce cas. Fournis des données riches : CA (800M€), marge nette (3%), dette (120M€), 4000 employés, parc informatique vieillissant, expérience client physique encore forte.",
      max_exchanges: 12,
      difficulty: "advanced",
      type_config: { case_data: { company: "RetailCo", revenue: "800M€", stores: 200, employees: 4000 } },
      evaluation_rubric: [
        { criterion: "Analyse de la situation", weight: 3, description: "Compréhension des enjeux et forces/faiblesses" },
        { criterion: "Stratégie proposée", weight: 3, description: "Cohérence et ambition du plan" },
        { criterion: "Chiffrage et ROI", weight: 2, description: "Estimation des investissements et retours" },
      ],
    },
  ],

  sales: [
    {
      label: "Vente de solution IA à un COMEX",
      title: "Closing : Vendre une plateforme IA au DAF d'un grand groupe",
      scenario: "Vous vendez une solution IA de détection de fraude financière. Le DAF d'un groupe bancaire (15Md€ d'actifs) a accepté un RDV de 30 min. Il a vu une démo il y a 2 semaines. C'est l'étape de closing.",
      system_prompt: "Tu es le DAF. Tu es intéressé mais prudent. Tes objections : coût (budget gelé), risque réglementaire (IA Act), intégration avec le SI legacy. Tu veux des preuves concrètes de ROI et des références bancaires.",
      max_exchanges: 10,
      difficulty: "advanced",
      type_config: { prospect_profile: "DAF, groupe bancaire, 15Md€ actifs", objections: ["budget gelé", "IA Act", "intégration SI legacy"] },
      evaluation_rubric: [
        { criterion: "Découverte", weight: 2, description: "Questions de qualification pertinentes" },
        { criterion: "Argumentation ROI", weight: 3, description: "Chiffrage concret du retour sur investissement" },
        { criterion: "Traitement objections", weight: 3, description: "Réponses convaincantes aux objections" },
        { criterion: "Closing", weight: 2, description: "Engagement concret obtenu" },
      ],
    },
  ],

  change_management: [
    {
      label: "Déploiement outil IA en entreprise",
      title: "Conduite du changement : Déployer un assistant IA dans un cabinet d'avocats",
      scenario: "Un cabinet de 80 avocats adopte un assistant IA pour la recherche juridique. 60% des associés sont sceptiques. Les juniors sont enthousiastes mais inquiets pour leur emploi. Le syndicat demande des garanties. Vous pilotez la conduite du changement.",
      system_prompt: "Joue les différentes parties prenantes : associé sceptique (tradition, confidentialité), junior inquiet (remplacement), DRH pragmatique, DSI optimiste. Adapte les résistances selon l'approche de l'apprenant.",
      max_exchanges: 15,
      difficulty: "advanced",
      type_config: { org_size: 80, change_type: "ai_tool_adoption", resistance_level: "high" },
      evaluation_rubric: [
        { criterion: "Diagnostic des résistances", weight: 2, description: "Compréhension des freins par profil" },
        { criterion: "Plan de communication", weight: 3, description: "Messages adaptés par audience" },
        { criterion: "Quick wins", weight: 2, description: "Identification de victoires rapides" },
        { criterion: "Mesure d'adoption", weight: 2, description: "KPIs de suivi définis" },
      ],
    },
  ],

  vibe_coding: [
    {
      label: "Brief pour un dashboard analytics",
      title: "Vibe Coding : Briefer un dashboard analytics temps réel",
      scenario: "Vous utilisez un outil d'IA pour générer du code. Votre mission : écrire le brief le plus complet possible pour obtenir un dashboard analytics avec filtres, graphiques temps réel, et export de données.",
      system_prompt: "Évalue le brief de l'apprenant comme si tu étais l'IA qui doit l'implémenter. Identifie les ambiguïtés, les edge cases manquants, les choix UX non-spécifiés.",
      max_exchanges: 8,
      difficulty: "intermediate",
      type_config: { target_feature: "Dashboard analytics temps réel", tech_stack: "React + Supabase + Recharts" },
      evaluation_rubric: [
        { criterion: "Clarté fonctionnelle", weight: 3, description: "Chaque feature est clairement décrite" },
        { criterion: "Edge cases", weight: 2, description: "États vides, erreurs, loading gérés" },
        { criterion: "Spécifications UX", weight: 2, description: "Responsive, animations, interactions" },
      ],
    },
  ],

  due_diligence: [
    {
      label: "Due diligence startup SaaS",
      title: "Due Diligence : Acquisition d'une startup SaaS B2B",
      scenario: "Votre fonds d'investissement évalue l'acquisition d'une startup SaaS B2B (ARR 5M€, croissance +80%, 45 employés). La data room vient d'ouvrir. Vous avez 5 jours. Identifiez les red flags et recommandez Go/No-Go.",
      system_prompt: "Simule une data room d'acquisition. Révèle progressivement : financiers (churn à 15%, LTV/CAC fragile), juridique (litige en cours), technique (dette technique massive), RH (3 départs clés prévus). Ne révèle que si les bonnes questions sont posées.",
      max_exchanges: 15,
      difficulty: "expert",
      type_config: { deal_size: "medium", sector: "tech" },
      evaluation_rubric: [
        { criterion: "Questions de diagnostic", weight: 3, description: "Pertinence des questions posées" },
        { criterion: "Détection des red flags", weight: 3, description: "Nombre de risques identifiés" },
        { criterion: "Analyse financière", weight: 2, description: "Compréhension des métriques SaaS" },
        { criterion: "Recommandation finale", weight: 2, description: "Qualité du Go/No-Go argumenté" },
      ],
    },
  ],
};

export function getTemplatesForType(practiceType: string): PracticeTemplate[] {
  return PRACTICE_TEMPLATES[practiceType] || [];
}

export function getAllTemplateTypes(): string[] {
  return Object.keys(PRACTICE_TEMPLATES);
}
