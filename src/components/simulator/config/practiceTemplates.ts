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

  legal_transformation: [
    {
      label: "Négociation de clause contractuelle",
      title: "Négocier une clause de limitation de responsabilité avec un opérationnel",
      scenario: "Vous êtes juriste d'entreprise. Le directeur commercial veut signer un contrat avec un client stratégique qui refuse la clause de limitation de responsabilité. Le deal représente 2M€/an. L'opérationnel vous presse de 'trouver une solution'. Vous devez négocier un compromis acceptable.",
      system_prompt: "Tu es le directeur commercial. Tu veux absolument signer ce deal. Tu ne comprends pas pourquoi le juridique bloque. Tu es prêt à accepter des risques si on t'explique clairement. Tu deviens impatient si le juriste utilise trop de jargon.",
      max_exchanges: 10,
      difficulty: "intermediate",
      type_config: { tension_start: 6, ai_objectives: ["Signer le contrat rapidement", "Minimiser les contraintes juridiques", "Obtenir une validation rapide"] },
      evaluation_rubric: [
        { criterion: "Vulgarisation juridique", weight: 3, description: "Capacité à expliquer les enjeux sans jargon" },
        { criterion: "Recherche de compromis", weight: 3, description: "Propositions créatives préservant les intérêts" },
        { criterion: "Posture business partner", weight: 2, description: "Orientation solution vs blocage" },
        { criterion: "Gestion de la pression", weight: 2, description: "Fermeté sur l'essentiel, flexibilité sur le reste" },
      ],
    },
    {
      label: "Présentation feuille de route IA au COMEX",
      title: "Pitcher la stratégie IA de la Direction Juridique au COMEX",
      scenario: "Le PDG vous accorde 20 minutes au prochain COMEX pour présenter votre vision de l'IA pour la Direction Juridique. Le DAF est sceptique sur le ROI, la DRH s'inquiète des impacts sociaux, le DSI veut comprendre l'architecture technique. Budget demandé : 200K€ sur 18 mois.",
      system_prompt: "Tu joues les membres du COMEX. Le PDG est curieux mais veut du concret. Le DAF demande des chiffres de ROI précis. La DRH pose des questions sur l'emploi et la formation. Le DSI challenge sur la sécurité des données et l'intégration SI. Sois exigeant mais constructif.",
      max_exchanges: 12,
      difficulty: "advanced",
      type_config: { tension_start: 5, ai_objectives: ["Comprendre le ROI concret", "Évaluer les risques RH", "Valider la faisabilité technique"] },
      evaluation_rubric: [
        { criterion: "Vision stratégique", weight: 3, description: "Clarté de la vision et alignement business" },
        { criterion: "Chiffrage ROI", weight: 3, description: "Argumentation financière convaincante" },
        { criterion: "Gestion des objections", weight: 2, description: "Réponses adaptées à chaque profil COMEX" },
        { criterion: "Call to action", weight: 2, description: "Engagement concret obtenu" },
      ],
    },
    {
      label: "Prompt pour analyse de contrat",
      title: "Challenge : Rédiger le prompt parfait pour analyser un contrat de prestation",
      scenario: "Vous disposez d'un contrat de prestation IT de 45 pages. Votre mission : écrire le prompt le plus efficace pour qu'une IA identifie les clauses à risque, les obligations clés, les délais critiques et propose des améliorations.",
      system_prompt: "Tu évalues la qualité des prompts d'analyse juridique. Le prompt idéal doit : spécifier le type de contrat, définir les critères de risque, demander une matrice de conformité, et préciser le format de sortie souhaité (tableau, synthèse exécutive, alertes).",
      max_exchanges: 8,
      difficulty: "beginner",
      type_config: { max_retries: 5 },
      evaluation_rubric: [
        { criterion: "Précision juridique", weight: 3, description: "Terminologie et critères d'analyse appropriés" },
        { criterion: "Structuration du prompt", weight: 2, description: "Organisation logique et complétude" },
        { criterion: "Format de sortie", weight: 2, description: "Spécification claire du livrable attendu" },
      ],
    },
    {
      label: "Atelier Legal Design",
      title: "Legal Design : Simplifier une clause de confidentialité",
      scenario: "La direction marketing se plaint que les NDA envoyés aux partenaires sont incompréhensibles. Vous devez réécrire la clause de confidentialité (actuellement 800 mots, jargon juridique dense) en version 'Legal Design' : claire, visuelle, compréhensible par un non-juriste, tout en restant juridiquement valide.",
      system_prompt: "Tu es le directeur marketing. Tu montres la clause actuelle et exprimes ta frustration. Tu veux quelque chose de simple, avec des pictogrammes, des exemples concrets. Tu challenges chaque terme technique. Tu valides si c'est clair pour toi.",
      max_exchanges: 10,
      difficulty: "intermediate",
      type_config: { tension_start: 4, ai_objectives: ["Obtenir une clause lisible par tous", "Garder des exemples concrets", "Avoir un format visuel"] },
      evaluation_rubric: [
        { criterion: "Simplification", weight: 3, description: "Réduction du jargon sans perte de sens" },
        { criterion: "Validité juridique", weight: 3, description: "Maintien de la protection légale" },
        { criterion: "Approche visuelle", weight: 2, description: "Utilisation de structure, exemples, pictogrammes" },
      ],
    },
    {
      label: "Défendre le budget de la DJ",
      title: "Négociation budgétaire : Défendre le budget de la Direction Juridique",
      scenario: "Le DAF annonce une coupe de 20% sur votre budget. Votre équipe de 8 juristes est déjà sous tension. Vous perdriez un poste et le budget outils/formation. Vous devez convaincre le DAF de maintenir votre budget en démontrant le ROI de la fonction juridique.",
      system_prompt: "Tu es le DAF. Tu dois réduire les coûts de 15M€ au total. Tu considères le juridique comme un centre de coût. Tu veux des preuves chiffrées de la valeur ajoutée. Tu es ouvert mais ferme sur les objectifs de réduction.",
      max_exchanges: 12,
      difficulty: "advanced",
      type_config: { tension_start: 7, ai_objectives: ["Réduire le budget juridique de 20%", "Obtenir des métriques de performance", "Challenger les dépenses externes"] },
      evaluation_rubric: [
        { criterion: "Argumentation ROI", weight: 3, description: "Chiffrage de la valeur créée/risques évités" },
        { criterion: "Négociation", weight: 3, description: "Techniques de négociation et concessions stratégiques" },
        { criterion: "Vision stratégique", weight: 2, description: "Alignement avec les objectifs de l'entreprise" },
      ],
    },
    {
      label: "Conflit Legal/Compliance",
      title: "Gestion de conflit : Arbitrer entre Legal et Compliance",
      scenario: "Le responsable Compliance accuse votre équipe de bloquer un projet de KYC renforcé. Il a escaladé au CEO. De votre côté, vous estimez que le projet viole le RGPD. Le CEO veut une solution en 48h. Vous devez désamorcer le conflit et trouver un consensus.",
      system_prompt: "Tu es le responsable Compliance. Tu es frustré car le juridique bloque depuis 3 semaines. Tu as l'appui du CEO. Tu veux avancer vite car le régulateur fait pression. Tu es ouvert au dialogue si on reconnaît l'urgence.",
      max_exchanges: 12,
      difficulty: "advanced",
      type_config: { tension_start: 8, ai_objectives: ["Faire reconnaître l'urgence réglementaire", "Obtenir une validation rapide", "Maintenir la pression temporelle"] },
      evaluation_rubric: [
        { criterion: "Désamorçage", weight: 3, description: "Capacité à baisser la tension émotionnelle" },
        { criterion: "Solution technique", weight: 3, description: "Proposition conciliant RGPD et KYC" },
        { criterion: "Communication", weight: 2, description: "Écoute active et reformulation" },
      ],
    },
    {
      label: "Pitcher la valeur de la DJ au CEO",
      title: "Elevator pitch : Convaincre le CEO de la valeur stratégique de la DJ",
      scenario: "Vous croisez le CEO dans l'ascenseur. Il vous dit : 'Au fait, je me demande si on ne devrait pas externaliser une partie du juridique. Qu'en pensez-vous ?' Vous avez 3 minutes pour le convaincre que votre DJ est un atout stratégique irremplaçable.",
      system_prompt: "Tu es le CEO d'un groupe de 2000 personnes. Tu es pragmatique, orienté résultats. Tu as entendu dire que l'externalisation juridique ferait économiser 30%. Tu veux des arguments business, pas du jargon juridique. Tu décides vite.",
      max_exchanges: 6,
      difficulty: "advanced",
      type_config: { tension_start: 6, ai_objectives: ["Explorer l'option externalisation", "Obtenir des arguments business", "Décider rapidement"] },
      evaluation_rubric: [
        { criterion: "Impact en temps limité", weight: 3, description: "Messages clés percutants en 3 minutes" },
        { criterion: "Arguments business", weight: 3, description: "ROI, risques évités, avantage compétitif" },
        { criterion: "Posture de leader", weight: 2, description: "Confiance et assertivité" },
      ],
    },
    {
      label: "Cadrer un projet CLM",
      title: "Cadrage : Lancer un projet d'automatisation contractuelle (CLM)",
      scenario: "Le COMEX a validé un budget de 150K€ pour un outil de Contract Lifecycle Management. Vous devez cadrer le projet : rédiger le cahier des charges, définir les critères de sélection, planifier le déploiement. Le DSI est votre allié, les opérationnels sont impatients.",
      system_prompt: "Tu es le DSI. Tu veux comprendre les besoins fonctionnels précis, les volumes de contrats, les intégrations SI nécessaires. Tu poses des questions techniques. Tu alertes sur les risques de shadow IT si le projet traîne.",
      max_exchanges: 12,
      difficulty: "intermediate",
      type_config: { tension_start: 3, ai_objectives: ["Comprendre les volumes et process", "Valider les intégrations SI", "Planifier un PoC en 6 semaines"] },
      evaluation_rubric: [
        { criterion: "Cadrage fonctionnel", weight: 3, description: "Exhaustivité des besoins et cas d'usage" },
        { criterion: "Approche projet", weight: 2, description: "Planning, jalons, gouvernance" },
        { criterion: "Collaboration DSI", weight: 2, description: "Écoute technique et compromis" },
      ],
    },
    {
      label: "Feedback juriste junior",
      title: "Management : Entretien de feedback avec un juriste junior",
      scenario: "Un juriste junior (2 ans d'expérience) produit un travail de qualité mais est souvent en retard, ne communique pas assez avec les opérationnels et a tendance à sur-documenter. Son contrat arrive à renouvellement dans 2 mois. Vous devez mener un entretien constructif.",
      system_prompt: "Tu es le juriste junior. Tu es motivé mais tu te sens débordé. Tu penses que la qualité prime sur la rapidité. Tu n'oses pas déranger les opérationnels. Tu as peur qu'on ne renouvelle pas ton contrat. Tu réagis bien au feedback constructif mais mal aux critiques frontales.",
      max_exchanges: 10,
      difficulty: "intermediate",
      type_config: { tension_start: 4, ai_objectives: ["Comprendre les attentes exactes", "Obtenir un plan d'action concret", "Être rassuré sur le renouvellement"] },
      evaluation_rubric: [
        { criterion: "Bienveillance", weight: 2, description: "Ton positif et encourageant" },
        { criterion: "Précision du feedback", weight: 3, description: "Exemples concrets, axes d'amélioration clairs" },
        { criterion: "Plan d'action", weight: 3, description: "Objectifs SMART et accompagnement proposé" },
      ],
    },
    {
      label: "Comité de pilotage juridique",
      title: "Animation : Mener un comité de pilotage juridique trimestriel",
      scenario: "Vous animez le COPIL trimestriel de la Direction Juridique devant le DG et 4 directeurs métiers. Vous devez présenter les KPIs (contentieux -15%, contrats traités +25%, satisfaction interne 7.2/10), les projets en cours (CLM, formation IA) et obtenir les arbitrages pour le trimestre suivant.",
      system_prompt: "Tu joues le DG et les directeurs métiers. Le DG veut de la synthèse. Le directeur commercial veut que les contrats aillent plus vite. La DRH veut un bilan de la formation IA. Le directeur financier challenge les coûts externes. Pose des questions pointues sur chaque sujet.",
      max_exchanges: 15,
      difficulty: "advanced",
      type_config: { tension_start: 4, ai_objectives: ["Obtenir des réponses précises", "Valider les priorités du prochain trimestre", "Comprendre les résultats vs objectifs"] },
      evaluation_rubric: [
        { criterion: "Synthèse et clarté", weight: 3, description: "Présentation structurée et concise des résultats" },
        { criterion: "Data-driven", weight: 2, description: "Utilisation pertinente des KPIs et données" },
        { criterion: "Gestion du temps et de l'agenda", weight: 2, description: "Respect du format et couverture des sujets" },
        { criterion: "Obtention d'arbitrages", weight: 3, description: "Décisions concrètes obtenues" },
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
