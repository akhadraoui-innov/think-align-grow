// Rich insight data for each practice_type — displayed in the SimulatorInsightPanel

export interface ModeInsight {
  longDescription: string;
  skills: string[];
  tips: string[];
  exampleFirstMessage: string;
  duration: string;
  targetAudience: string;
}

const DEFAULT_INSIGHT: ModeInsight = {
  longDescription: "Simulation professionnelle guidée par IA. Interagissez avec un coach virtuel qui s'adapte à vos réponses et vous challenge en temps réel.",
  skills: ["Communication", "Analyse", "Prise de décision"],
  tips: ["Prenez le temps de bien lire le contexte", "Soyez précis dans vos réponses", "N'hésitez pas à poser des questions"],
  exampleFirstMessage: "Je souhaite commencer par comprendre le contexte global.",
  duration: "15-25 min",
  targetAudience: "Tous profils",
};

export const MODE_INSIGHTS: Record<string, Partial<ModeInsight>> = {
  // ── Engineering ──
  code_review: {
    longDescription: "Un lead developer senior vous soumet du code contenant des bugs intentionnels, des code smells et des problèmes de performance. Votre mission : identifier chaque problème, expliquer le risque et proposer une correction argumentée.",
    skills: ["Détection de bugs", "Qualité logicielle", "Argumentation technique", "Bonnes pratiques"],
    tips: ["Lisez le code en entier avant de commenter", "Cherchez les injections, les N+1, les validations manquantes", "Proposez du code corrigé, pas juste une critique"],
    exampleFirstMessage: "Je vais commencer par analyser la structure globale du code avant de regarder les détails.",
    duration: "15-20 min",
    targetAudience: "Développeurs, Tech Leads",
  },
  debug: {
    longDescription: "Un bug est signalé avec une stack trace et un contexte d'application. Menez l'investigation : posez les bonnes questions, formulez des hypothèses, identifiez la cause racine et proposez un correctif.",
    skills: ["Raisonnement diagnostique", "Lecture de stack trace", "Résolution méthodique"],
    tips: ["Commencez par reproduire mentalement le bug", "Posez des questions sur l'environnement", "Procédez par élimination"],
    exampleFirstMessage: "Pouvez-vous me donner plus de détails sur le contexte dans lequel le bug se produit ?",
    duration: "15-20 min",
    targetAudience: "Développeurs",
  },
  system_design: {
    longDescription: "Concevez l'architecture d'un système complet : choix technologiques, scalabilité, résilience, estimation des coûts. L'IA challenge vos décisions et explore les trade-offs.",
    skills: ["Architecture logicielle", "Scalabilité", "Trade-offs techniques", "Communication technique"],
    tips: ["Commencez par les requirements fonctionnels", "Estimez les volumes de données et le trafic", "Justifiez chaque choix technique"],
    exampleFirstMessage: "Avant de proposer une architecture, je voudrais clarifier les exigences non-fonctionnelles.",
    duration: "20-30 min",
    targetAudience: "Architectes, Senior Dev, Tech Leads",
  },
  pair_programming: {
    longDescription: "Session de co-écriture de code tour à tour avec l'IA. Elle complète, challenge ou refactore vos choix en temps réel.",
    skills: ["Collaboration", "Clean code", "Problem solving"],
    tips: ["Expliquez votre raisonnement avant d'écrire", "Acceptez les suggestions constructives"],
    exampleFirstMessage: "Commençons par définir l'interface et les types de données.",
    duration: "15-25 min",
    targetAudience: "Développeurs",
  },
  refactoring: {
    longDescription: "Du code legacy vous est fourni. Analysez la dette technique, proposez un plan de refactoring priorisé et implémentez les améliorations clés.",
    skills: ["Refactoring", "Dette technique", "Lisibilité", "Performance"],
    tips: ["Identifiez d'abord les code smells majeurs", "Priorisez par impact/risque", "Proposez des changements incrémentaux"],
    exampleFirstMessage: "Je vais d'abord identifier les principaux patterns problématiques dans ce code.",
    duration: "15-20 min",
    targetAudience: "Développeurs, Architectes",
  },
  tdd_kata: {
    longDescription: "L'IA vous donne un test unitaire, vous écrivez l'implémentation. Boucle red/green/refactor pour maîtriser le TDD.",
    skills: ["TDD", "Design émergent", "Tests unitaires"],
    tips: ["Écrivez le minimum pour faire passer le test", "Refactorez après chaque green"],
    exampleFirstMessage: "Je suis prêt pour le premier test. Quel est le kata ?",
    duration: "15-20 min",
    targetAudience: "Développeurs",
  },

  // ── Vibe Coding ──
  vibe_coding: {
    longDescription: "Objectif fonctionnel donné, rédigez un brief en langage naturel comme si vous promptiez un outil IA de génération de code. L'IA évalue la clarté, la complétude et les edge cases de votre brief.",
    skills: ["Rédaction de brief technique", "Pensée UX", "Anticipation des edge cases", "Spécification fonctionnelle"],
    tips: ["Décrivez le comportement attendu, pas l'implémentation", "Pensez responsive et accessibilité", "Listez les états : loading, vide, erreur"],
    exampleFirstMessage: "Je vais structurer mon brief en sections : objectif, fonctionnalités clés, contraintes UX.",
    duration: "10-15 min",
    targetAudience: "Product Managers, Développeurs, No-coders",
  },
  spec_writing: {
    longDescription: "À partir d'un besoin vague, rédigez des spécifications fonctionnelles complètes au format PRD. L'IA évalue la complétude et les critères d'acceptation.",
    skills: ["Rédaction PRD", "Critères d'acceptation", "Clarté fonctionnelle"],
    tips: ["Définissez clairement le périmètre (in/out)", "Chaque user story doit avoir des critères INVEST"],
    exampleFirstMessage: "Pouvez-vous me décrire le besoin métier initial ?",
    duration: "15-25 min",
    targetAudience: "Product Owners, Business Analysts",
  },
  prompt_to_app: {
    longDescription: "Écrivez le prompt parfait pour générer une application complète. L'IA évalue la qualité de votre prompt sur la complétude, les edge cases et les spécifications UX.",
    skills: ["Prompt engineering", "Spécification UX", "Edge cases"],
    tips: ["Incluez les contraintes techniques", "Spécifiez les interactions utilisateur"],
    exampleFirstMessage: "Je vais commencer par décrire l'objectif principal de l'application.",
    duration: "10-15 min",
    targetAudience: "Développeurs, Product Managers",
  },
  nocode_architect: {
    longDescription: "Concevez un workflow ou une automatisation sans code. L'IA évalue la faisabilité, la maintenabilité et la scalabilité de votre solution.",
    skills: ["Architecture no-code", "Automatisation", "Pensée systémique"],
    tips: ["Identifiez d'abord les triggers et les actions", "Pensez à la gestion d'erreurs"],
    exampleFirstMessage: "Quel est le processus métier que je dois automatiser ?",
    duration: "15-20 min",
    targetAudience: "No-coders, Ops, Product Managers",
  },

  // ── Product ──
  user_story: {
    longDescription: "L'IA vous présente un besoin métier complexe. Décomposez-le en user stories granulaires avec critères d'acceptation INVEST. L'IA évalue chaque story.",
    skills: ["Rédaction user stories", "Critères INVEST", "Granularité"],
    tips: ["Format : En tant que... je veux... afin de...", "Chaque story doit être testable", "Pensez aux edge cases"],
    exampleFirstMessage: "Pouvez-vous me décrire le besoin métier que je dois découper ?",
    duration: "15-20 min",
    targetAudience: "Product Owners, Scrum Masters",
  },
  backlog_prio: {
    longDescription: "Un backlog de 20 items vous est présenté. Priorisez-les avec une méthodologie (RICE, MoSCoW, WSJF) et justifiez chaque arbitrage.",
    skills: ["Priorisation", "Méthodes de scoring", "Alignement stratégique"],
    tips: ["Choisissez une méthode et appliquez-la rigoureusement", "Justifiez les cas limites"],
    exampleFirstMessage: "Je vais utiliser la méthode RICE pour scorer chaque item.",
    duration: "20-30 min",
    targetAudience: "Product Owners, Product Managers",
  },
  sprint_planning: {
    longDescription: "Équipe simulée avec une vélocité définie. Planifiez un sprint réaliste, négociez le périmètre et gérez les risques. L'IA joue le Scrum Master.",
    skills: ["Capacité d'équipe", "Négociation de scope", "Gestion de risques"],
    tips: ["Respectez la vélocité historique", "Identifiez les dépendances entre items"],
    exampleFirstMessage: "Quelle est la vélocité de l'équipe et le backlog disponible ?",
    duration: "15-25 min",
    targetAudience: "Scrum Masters, Product Owners",
  },
  user_interview: {
    longDescription: "L'IA joue un utilisateur avec un profil réaliste. Menez l'interview, extrayez les insights et identifiez les vrais besoins derrière les demandes.",
    skills: ["Techniques d'interview", "Écoute active", "Extraction d'insights"],
    tips: ["Posez des questions ouvertes", "Creusez les 'pourquoi'", "Ne proposez pas de solution trop tôt"],
    exampleFirstMessage: "Bonjour, merci d'avoir accepté cet entretien. Pouvez-vous me décrire votre quotidien ?",
    duration: "15-20 min",
    targetAudience: "UX Researchers, Product Managers",
  },
  prototype_review: {
    longDescription: "L'IA teste votre prototype (décrit textuellement) et donne un feedback utilisateur réaliste avec des suggestions d'amélioration.",
    skills: ["Test utilisateur", "Détection UX", "Itération produit"],
    tips: ["Décrivez le prototype en détail", "Posez des questions sur les points de friction"],
    exampleFirstMessage: "Je vais vous présenter le prototype de notre nouvelle fonctionnalité.",
    duration: "10-15 min",
    targetAudience: "Designers, Product Managers",
  },

  // ── Infra ──
  incident_response: {
    longDescription: "Alerte production critique ! Diagnostiquez l'incident, communiquez aux parties prenantes, escaladez si nécessaire et résolvez sous pression temporelle. Timer en temps réel.",
    skills: ["Gestion d'incident", "Communication sous pression", "Diagnostic rapide", "Post-mortem"],
    tips: ["Communiquez immédiatement au stakeholder concerné", "Isolez le problème avant de corriger", "Documentez vos actions pour le post-mortem"],
    exampleFirstMessage: "Je vais d'abord vérifier les dashboards de monitoring pour localiser l'origine du problème.",
    duration: "10-15 min",
    targetAudience: "SRE, DevOps, CTO",
  },
  adr: {
    longDescription: "Un choix d'architecture se pose. Documentez-le sous forme d'ADR : contexte, alternatives évaluées, décision, conséquences. L'IA challenge vos alternatives.",
    skills: ["Documentation technique", "Analyse d'alternatives", "Trade-offs"],
    tips: ["Listez au moins 3 alternatives", "Chiffrez les conséquences"],
    exampleFirstMessage: "Quel est le contexte et la décision architecturale à documenter ?",
    duration: "15-20 min",
    targetAudience: "Architectes, Tech Leads",
  },
  capacity_planning: {
    longDescription: "Données de trafic et projections de croissance fournies. Dimensionnez l'infrastructure, optimisez les coûts et anticipez les pics.",
    skills: ["Dimensionnement infra", "Optimisation coûts cloud", "Anticipation"],
    tips: ["Analysez les patterns de trafic avant de dimensionner", "Prévoyez une marge de 20-30%"],
    exampleFirstMessage: "Pouvez-vous me montrer les données de trafic actuelles et les projections ?",
    duration: "15-25 min",
    targetAudience: "SRE, Cloud Architects, DevOps",
  },
  security_audit: {
    longDescription: "Configuration ou code fourni. Identifiez les vulnérabilités de sécurité, évaluez les risques et proposez des remédiations priorisées.",
    skills: ["Sécurité applicative", "Évaluation des risques", "Remédiation"],
    tips: ["Suivez le TOP 10 OWASP", "Classez par sévérité critique/haute/moyenne"],
    exampleFirstMessage: "Je vais commencer par analyser les vecteurs d'attaque potentiels.",
    duration: "15-20 min",
    targetAudience: "Security Engineers, DevSecOps",
  },

  // ── Business Analysis ──
  requirements: {
    longDescription: "L'IA joue un stakeholder vague et contradictoire. Extrayez les vrais besoins, désambiguïsez, et formalisez les exigences.",
    skills: ["Élicitation", "Désambiguïsation", "Formalisation"],
    tips: ["Reformulez pour valider votre compréhension", "Cherchez les besoins implicites"],
    exampleFirstMessage: "Pouvez-vous me décrire ce dont vous avez besoin pour votre équipe ?",
    duration: "15-20 min",
    targetAudience: "Business Analysts, Consultants",
  },
  process_mapping: {
    longDescription: "Décrivez un processus métier, identifiez les goulots d'étranglement et proposez des optimisations. L'IA joue les opérationnels terrain.",
    skills: ["Cartographie de processus", "Identification de goulots", "Optimisation"],
    tips: ["Commencez par le flux nominal", "Mesurez les temps de cycle"],
    exampleFirstMessage: "Pouvez-vous me décrire le processus actuel étape par étape ?",
    duration: "15-25 min",
    targetAudience: "Business Analysts, Consultants, Ops",
  },
  data_storytelling: {
    longDescription: "Jeu de données brutes fourni. Construisez un récit convaincant avec des insights actionnables pour le COMEX. L'IA évalue la narration et l'impact.",
    skills: ["Storytelling data", "Visualisation", "Recommandations actionnables"],
    tips: ["Commencez par le message clé", "Utilisez la structure Situation-Complication-Résolution"],
    exampleFirstMessage: "Je vais d'abord identifier les 3 insights majeurs dans ces données.",
    duration: "15-20 min",
    targetAudience: "Data Analysts, Consultants, Managers",
  },
  kpi_design: {
    longDescription: "Objectif stratégique donné. Définissez les KPIs pertinents, mesurables et alignés. L'IA challenge la pertinence et la mesurabilité.",
    skills: ["Définition de KPIs", "Alignement stratégique", "Mesurabilité"],
    tips: ["Chaque KPI doit être SMART", "Limitez à 5-7 KPIs max"],
    exampleFirstMessage: "Quel est l'objectif stratégique pour lequel je dois définir les KPIs ?",
    duration: "10-15 min",
    targetAudience: "Business Analysts, Managers, Directors",
  },

  // ── Transformation ──
  ai_usecase: {
    longDescription: "Un problème métier concret vous est présenté. Proposez une solution utilisant l'IA, évaluez la faisabilité technique, le ROI et les risques éthiques. L'IA challenge vos hypothèses.",
    skills: ["Design de cas d'usage IA", "Estimation ROI", "Éthique IA", "Plan d'implémentation"],
    tips: ["Commencez par le problème métier, pas par la techno", "Chiffrez le ROI attendu", "Identifiez les biais potentiels"],
    exampleFirstMessage: "Pouvez-vous me décrire le problème métier que vous souhaitez résoudre ?",
    duration: "15-25 min",
    targetAudience: "CDO, Consultants IA, Product Managers",
  },
  change_management: {
    longDescription: "Une organisation en pleine transformation. L'IA joue les différentes parties prenantes (sponsor, résistants, syndicats). Construisez un plan de conduite du changement complet.",
    skills: ["Conduite du changement", "Gestion des résistances", "Communication stakeholders", "Quick wins"],
    tips: ["Cartographiez d'abord les parties prenantes", "Identifiez les champions du changement", "Planifiez des quick wins visibles"],
    exampleFirstMessage: "Je souhaite d'abord comprendre le contexte de la transformation et identifier les parties prenantes clés.",
    duration: "20-30 min",
    targetAudience: "Change Managers, Consultants, DRH",
  },
  ai_impact: {
    longDescription: "Évaluez l'impact d'un projet IA sur les emplois, les processus, l'éthique et la réglementation. Produisez une analyse d'impact structurée.",
    skills: ["Analyse d'impact", "Éthique IA", "Réglementation", "Gestion des risques"],
    tips: ["Couvrez les 4 dimensions : emplois, processus, éthique, réglementation"],
    exampleFirstMessage: "Quel est le projet IA dont je dois évaluer l'impact ?",
    duration: "15-25 min",
    targetAudience: "CDO, DRH, Consultants transformation",
  },
  adoption_strategy: {
    longDescription: "Vous devez déployer un nouvel outil ou process dans une organisation. L'IA joue les résistants et les sceptiques. Construisez une stratégie d'adoption mesurable.",
    skills: ["Stratégie d'adoption", "Gestion des objections", "Mesure de l'adoption", "Communication"],
    tips: ["Identifiez les early adopters", "Définissez des métriques d'adoption claires", "Préparez un plan de formation"],
    exampleFirstMessage: "Je voudrais d'abord comprendre l'outil à déployer et le profil des utilisateurs cibles.",
    duration: "15-20 min",
    targetAudience: "Change Managers, DSI, Consultants",
  },
  digital_maturity: {
    longDescription: "L'IA présente une organisation avec ses processus et outils actuels. Diagnostiquez sa maturité numérique et proposez un plan de progression structuré.",
    skills: ["Diagnostic de maturité", "Roadmap digitale", "Priorisation"],
    tips: ["Utilisez un framework reconnu (ex: MIT)", "Évaluez chaque domaine séparément"],
    exampleFirstMessage: "Pouvez-vous me décrire l'organisation, ses outils et ses processus actuels ?",
    duration: "15-25 min",
    targetAudience: "CDO, Consultants, DSI",
  },

  // ── M&A ──
  due_diligence: {
    longDescription: "La data room d'une acquisition vient d'ouvrir. Explorez les documents financiers, juridiques, RH et techniques. L'IA ne révèle les red flags que si vous posez les bonnes questions.",
    skills: ["Due diligence", "Analyse financière", "Détection de red flags", "Questionnement stratégique"],
    tips: ["Commencez par les financiers (P&L, cash flow)", "Cherchez les litiges en cours", "Vérifiez la concentration client"],
    exampleFirstMessage: "Je souhaite commencer par examiner les états financiers des 3 dernières années.",
    duration: "20-30 min",
    targetAudience: "Analystes M&A, Directeurs financiers, Consultants",
  },
  integration_planning: {
    longDescription: "Post-acquisition : planifiez l'intégration des systèmes, des équipes et de la culture. L'IA simule les frictions et les synergies.",
    skills: ["Planification d'intégration", "Synergies", "Gestion culturelle"],
    tips: ["Priorisez les synergies rapides", "Attention à la rétention des talents clés"],
    exampleFirstMessage: "Quelles sont les deux entités à intégrer et leurs principales différences ?",
    duration: "20-30 min",
    targetAudience: "Directeurs M&A, PMO, Consultants",
  },
  restructuring: {
    longDescription: "Organisation en difficulté financière. Proposez un plan de restructuration crédible. L'IA joue le conseil d'administration, les syndicats et les banquiers.",
    skills: ["Restructuration", "Plan de viabilité", "Négociation sociale", "Finance"],
    tips: ["Diagnostiquez avant de proposer", "Chiffrez chaque mesure", "Anticipez l'impact social"],
    exampleFirstMessage: "Pouvez-vous me présenter la situation financière et les effectifs actuels ?",
    duration: "20-30 min",
    targetAudience: "Directeurs de restructuring, DAF, Consultants",
  },
  valuation: {
    longDescription: "Données financières fournies. Argumentez une valorisation d'entreprise en utilisant plusieurs méthodes. L'IA joue le contradicteur.",
    skills: ["Valorisation d'entreprise", "Méthodes DCF/multiples", "Argumentation financière"],
    tips: ["Utilisez au moins 2 méthodes", "Justifiez vos hypothèses de taux"],
    exampleFirstMessage: "Je vais commencer par analyser les données financières pour choisir les méthodes de valorisation appropriées.",
    duration: "15-25 min",
    targetAudience: "Analystes financiers, Banquiers d'affaires",
  },

  // ── Leadership ──
  negotiation: {
    longDescription: "Simulation de négociation avec un interlocuteur IA ayant des objectifs cachés. La tension et le rapport évoluent dynamiquement selon votre approche. Jauges en temps réel.",
    skills: ["Persuasion", "Écoute active", "Compromis", "Gestion de la tension"],
    tips: ["Commencez par comprendre les besoins de l'autre", "Ne faites pas de concession sans contrepartie", "Utilisez le silence à votre avantage"],
    exampleFirstMessage: "Merci pour ce rendez-vous. Pouvez-vous me rappeler le contexte de notre discussion ?",
    duration: "15-25 min",
    targetAudience: "Managers, Commerciaux, Dirigeants",
  },
  pitch: {
    longDescription: "Vous avez un temps limité pour convaincre un investisseur sceptique. Messages courts et percutants. L'IA note la clarté, l'impact et la structure en temps réel.",
    skills: ["Pitch", "Synthèse", "Impact", "Storytelling"],
    tips: ["Problème → Solution → Marché → Équipe → Ask", "Chaque phrase compte", "Chiffrez votre traction"],
    exampleFirstMessage: "Imaginez ne plus jamais perdre 3 heures par jour à...",
    duration: "5-10 min",
    targetAudience: "Entrepreneurs, Intrapreneurs, Commerciaux",
  },
  crisis: {
    longDescription: "Événements critiques en temps réel : alertes système, emails, messages médias. Priorisez, décidez et communiquez sous pression. Les événements s'empilent si vous ne réagissez pas.",
    skills: ["Gestion de crise", "Priorisation sous pression", "Communication de crise", "Leadership"],
    tips: ["Triez l'urgent de l'important", "Communiquez même si vous n'avez pas toutes les réponses", "Déléguez ce qui peut l'être"],
    exampleFirstMessage: "Je prends la main sur la coordination de crise. Quel est le premier rapport de situation ?",
    duration: "10-15 min",
    targetAudience: "Dirigeants, Managers, CTO",
  },
  feedback_360: {
    longDescription: "L'IA joue successivement manager, pair et subordonné. Pratiquez donner et recevoir du feedback dans 3 postures différentes.",
    skills: ["Feedback constructif", "Empathie", "Communication managériale"],
    tips: ["Utilisez le format SBI (Situation-Behavior-Impact)", "Soyez spécifique, pas générique"],
    exampleFirstMessage: "Je suis prêt à commencer. Qui est mon premier interlocuteur ?",
    duration: "15-20 min",
    targetAudience: "Managers, RH, Tous collaborateurs",
  },
  storytelling: {
    longDescription: "Construisez un récit captivant pour une marque, un produit ou une vision. L'IA évalue l'arc narratif, l'engagement émotionnel et la mémorabilité.",
    skills: ["Storytelling", "Arc narratif", "Engagement émotionnel"],
    tips: ["Commencez par le héros (votre client)", "Créez une tension avant la résolution"],
    exampleFirstMessage: "Je vais construire l'histoire autour du problème que notre produit résout.",
    duration: "10-15 min",
    targetAudience: "Marketeurs, Dirigeants, Entrepreneurs",
  },
  crisis_comms: {
    longDescription: "Crise médiatique en cours. Rédigez communiqués de presse, répondez aux journalistes et gérez les réseaux sociaux. Cohérence et transparence sont clés.",
    skills: ["Communication de crise", "Rédaction de communiqués", "Gestion médias"],
    tips: ["Un seul porte-parole", "Faits, empathie, actions concrètes", "Ne mentez jamais"],
    exampleFirstMessage: "Quelle est la nature de la crise et quels sont les faits établis ?",
    duration: "15-20 min",
    targetAudience: "DirCom, RP, Dirigeants",
  },
  presentation: {
    longDescription: "Structurez et délivrez une présentation percutante. L'IA évalue la structure, la clarté, l'impact et le rythme.",
    skills: ["Structure de présentation", "Clarté", "Impact", "Rythme"],
    tips: ["Règle du 3 : 3 messages clés max", "Commencez par le conclusion"],
    exampleFirstMessage: "Je vais structurer ma présentation autour de 3 messages clés.",
    duration: "15-20 min",
    targetAudience: "Tous professionnels",
  },
  conversation: {
    longDescription: "Chat libre avec un coach IA. Jeu de rôle, simulation de situation, mentorat personnalisé. Le coach s'adapte à votre niveau et vos besoins.",
    skills: ["Communication", "Réflexion", "Développement personnel"],
    tips: ["Soyez ouvert et honnête", "Posez des questions de clarification"],
    exampleFirstMessage: "J'aimerais travailler sur ma capacité à mener des réunions efficaces.",
    duration: "10-20 min",
    targetAudience: "Tous profils",
  },

  // ── Legal ──
  legal_analysis: {
    longDescription: "Cas juridique complexe présenté avec les faits, les parties et les enjeux. Identifiez les risques, appliquez le cadre réglementaire et formulez des recommandations.",
    skills: ["Analyse juridique", "Identification de risques", "Recommandations"],
    tips: ["Identifiez le droit applicable", "Classez les risques par probabilité et impact"],
    exampleFirstMessage: "Pouvez-vous me présenter les faits du cas et les parties impliquées ?",
    duration: "15-25 min",
    targetAudience: "Juristes, Compliance Officers, DPO",
  },
  contract_negotiation: {
    longDescription: "Clauses contractuelles à négocier. L'IA joue la partie adverse avec des intérêts divergents. Trouvez un accord équilibré.",
    skills: ["Négociation contractuelle", "Compréhension des clauses", "Compromis"],
    tips: ["Identifiez les clauses non-négociables vs ajustables", "Proposez des alternatives"],
    exampleFirstMessage: "Commençons par les clauses de responsabilité et de garantie.",
    duration: "15-20 min",
    targetAudience: "Juristes, Acheteurs, Commerciaux",
  },
  compliance: {
    longDescription: "Dilemme éthique ou réglementaire en zone grise. Décidez, justifiez et découvrez les implications de votre choix.",
    skills: ["Raisonnement éthique", "Connaissance réglementaire", "Argumentation"],
    tips: ["Identifiez les textes applicables", "Pesez le pour et le contre"],
    exampleFirstMessage: "Pouvez-vous me présenter la situation et le dilemme ?",
    duration: "10-15 min",
    targetAudience: "Compliance Officers, Managers, Juristes",
  },
  gdpr_pia: {
    longDescription: "Projet de traitement de données personnelles. Réalisez une analyse d'impact (PIA) complète : cartographie des données, évaluation des risques, mesures de mitigation.",
    skills: ["RGPD", "PIA", "Cartographie de données", "Mesures de sécurité"],
    tips: ["Commencez par cartographier les flux de données", "Identifiez les bases légales"],
    exampleFirstMessage: "Quel est le traitement de données que je dois analyser ?",
    duration: "15-25 min",
    targetAudience: "DPO, Juristes, DSI",
  },

  // ── Strategy ──
  case_study: {
    longDescription: "Cas business riche en données chiffrées. Analysez la situation, identifiez les enjeux, proposez des recommandations stratégiques. L'IA débriefe avec ce qui s'est réellement passé.",
    skills: ["Analyse stratégique", "Recommandations", "Pensée critique"],
    tips: ["Structurez votre analyse (SWOT, Porter, etc.)", "Chiffrez vos recommandations"],
    exampleFirstMessage: "Pouvez-vous me présenter le cas et les données clés ?",
    duration: "20-30 min",
    targetAudience: "Consultants, Dirigeants, MBA",
  },
  socratic: {
    longDescription: "L'IA défend systématiquement la position opposée à la vôtre. Construisez un argumentaire solide face à un contradicteur rigoureux.",
    skills: ["Argumentation", "Logique", "Nuance", "Pensée critique"],
    tips: ["Appuyez-vous sur des faits", "Reconnaissez les points valides de l'adversaire"],
    exampleFirstMessage: "Je souhaite défendre la position suivante : ...",
    duration: "10-20 min",
    targetAudience: "Consultants, Avocats, Managers",
  },
  bm_design: {
    longDescription: "Co-construisez un business model complet. L'IA challenge chaque bloc du canvas et explore les alternatives.",
    skills: ["Business Model Canvas", "Innovation", "Viabilité économique"],
    tips: ["Commencez par la proposition de valeur", "Testez la cohérence entre les blocs"],
    exampleFirstMessage: "Je vais commencer par définir le segment client et la proposition de valeur.",
    duration: "20-30 min",
    targetAudience: "Entrepreneurs, Consultants, Product Managers",
  },
  audit: {
    longDescription: "Données brutes d'une organisation à analyser. Identifiez les problèmes, priorisez les actions et proposez un plan d'amélioration.",
    skills: ["Audit", "Diagnostic", "Priorisation", "Plan d'action"],
    tips: ["Cherchez les patterns récurrents", "Distinguez symptômes et causes racines"],
    exampleFirstMessage: "Pouvez-vous me présenter les données à analyser ?",
    duration: "15-25 min",
    targetAudience: "Auditeurs, Consultants, Managers",
  },

  // ── Prompting ──
  prompt_challenge: {
    longDescription: "L'IA vous donne un défi de prompting, vous rédigez votre prompt, et elle vous score sur 4 axes (clarté, complétude, efficacité, créativité). Itérez jusqu'au score parfait.",
    skills: ["Prompt engineering", "Itération", "Clarté d'expression"],
    tips: ["Soyez spécifique sur le format de sortie attendu", "Incluez des exemples (few-shot)", "Testez les edge cases"],
    exampleFirstMessage: "Je suis prêt pour le défi. Quel est l'objectif ?",
    duration: "10-15 min",
    targetAudience: "Tous profils, débutants IA",
  },
  prompt_lab: {
    longDescription: "Laboratoire de prompt engineering avancé. Explorez les techniques : chain-of-thought, few-shot, system prompting. Éditeur multi-sections.",
    skills: ["Techniques avancées de prompting", "Structure de prompt", "Optimisation"],
    tips: ["Testez une technique à la fois", "Comparez les résultats"],
    exampleFirstMessage: "Je veux explorer la technique chain-of-thought.",
    duration: "15-25 min",
    targetAudience: "Développeurs, Power Users IA",
  },
  teach_back: {
    longDescription: "Inversion pédagogique : expliquez un concept à un débutant IA. L'IA pose des questions naïves mais pertinentes pour tester votre compréhension réelle.",
    skills: ["Pédagogie", "Vulgarisation", "Maîtrise des concepts"],
    tips: ["Utilisez des analogies", "Vérifiez la compréhension à chaque étape"],
    exampleFirstMessage: "Je vais vous expliquer le concept de [sujet] en termes simples.",
    duration: "10-15 min",
    targetAudience: "Tous profils, formateurs",
  },

  // ── Sales & HR ──
  sales: {
    longDescription: "L'IA joue un prospect réaliste avec budget, contraintes et objections. Menez le cycle de vente : découverte, argumentation, traitement d'objections, closing. Funnel en temps réel.",
    skills: ["Découverte", "Argumentation ROI", "Traitement d'objections", "Closing"],
    tips: ["Posez plus de questions que vous ne parlez", "Chiffrez le ROI pour le prospect", "Ne forcez pas le closing"],
    exampleFirstMessage: "Bonjour, merci de m'accorder ce rendez-vous. Pouvez-vous me parler de vos enjeux actuels ?",
    duration: "15-25 min",
    targetAudience: "Commerciaux, Business Developers",
  },
  interview: {
    longDescription: "Simulation d'entretien d'embauche adapté au poste. L'IA est un recruteur professionnel qui mixe questions comportementales (STAR) et techniques.",
    skills: ["Méthode STAR", "Communication", "Authenticité", "Préparation"],
    tips: ["Préparez 3-4 situations STAR", "Soyez concret et chiffré", "Montrez votre réflexion"],
    exampleFirstMessage: "Bonjour, je suis ravi de participer à cet entretien pour le poste de...",
    duration: "15-25 min",
    targetAudience: "Candidats, RH, Managers recruteurs",
  },
  mediation: {
    longDescription: "Deux parties en conflit (jouées par l'IA). Votre rôle : médiateur. Écoutez, reformulez, trouvez un terrain d'entente.",
    skills: ["Médiation", "Neutralité", "Empathie", "Résolution de conflits"],
    tips: ["Restez neutre", "Reformulez les émotions", "Cherchez les intérêts communs"],
    exampleFirstMessage: "Je vous propose de commencer. Chacun va exprimer sa perspective.",
    duration: "15-20 min",
    targetAudience: "Managers, RH, Médiateurs",
  },
  onboarding_buddy: {
    longDescription: "Simulation des 30 premiers jours dans une entreprise. L'IA joue collègues, managers et mentors. Développez votre intégration.",
    skills: ["Intégration", "Initiative", "Communication"],
    tips: ["Posez des questions", "Proposez de l'aide", "Prenez des notes"],
    exampleFirstMessage: "Bonjour, c'est mon premier jour ! Pouvez-vous me présenter l'équipe ?",
    duration: "15-20 min",
    targetAudience: "Nouveaux arrivants, RH",
  },
  culture_quiz: {
    longDescription: "Quiz conversationnel sur la culture, les valeurs et les processus de l'entreprise. L'IA adapte les questions à vos réponses.",
    skills: ["Culture d'entreprise", "Valeurs", "Processus internes"],
    tips: ["Répondez avec des exemples concrets", "Reliez les valeurs à des comportements"],
    exampleFirstMessage: "Je suis prêt pour le quiz. Commençons !",
    duration: "10-15 min",
    targetAudience: "Tous collaborateurs",
  },

  // ── Decision game ──
  decision_game: {
    longDescription: "Scénario interactif à embranchements. Chaque décision impacte des KPIs (budget, moral, risque, temps). Gérez les conséquences de vos choix.",
    skills: ["Prise de décision", "Gestion de contraintes", "Anticipation"],
    tips: ["Lisez bien les conséquences possibles", "Équilibrez court terme et long terme"],
    exampleFirstMessage: "Je suis prêt à prendre la première décision.",
    duration: "15-20 min",
    targetAudience: "Managers, Dirigeants",
  },
};

export function getModeInsight(practiceType: string): ModeInsight {
  const partial = MODE_INSIGHTS[practiceType] || {};
  return { ...DEFAULT_INSIGHT, ...partial };
}
