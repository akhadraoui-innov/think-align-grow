import type { CycleData } from "./CycleTimeline";

const defaultLegend = [
  { type: "ai-gen" as const, label: "IA Génération" },
  { type: "ai-tutor" as const, label: "IA Tuteur" },
  { type: "ai-eval" as const, label: "IA Évaluation" },
  { type: "ai-know" as const, label: "IA Knowledge" },
  { type: "ai-skill" as const, label: "IA Compétences" },
  { type: "system" as const, label: "Action système" },
];

/* ═══════════════ FORMATIONS ═══════════════ */

export const formationsCycle: CycleData = {
  title: "Cycle de formation complet",
  subtitle: "De l'intention à la certification — cartographie des assistants IA et mécaniques par phase",
  legend: defaultLegend,
  phases: [
    {
      number: "01",
      title: "Ingénierie pédagogique",
      subtitle: "L'admin configure, l'IA construit — 5 assistants IA engagés",
      color: "bg-violet-600",
      steps: [
        {
          label: "Créer les fonctions métier",
          actorType: "ai-gen",
          badges: [{ text: "Structuré", variant: "secondary" }],
          description: "L'admin décrit un poste en langage naturel → l'IA produit la fiche complète avec responsabilités, outils, KPIs et cas d'usage IA.",
          detail: "Modèle : Gemini 2.5 Pro (function calling structuré)\nDonnées produites : nom, département, séniorité, industrie, taille entreprise, 5-8 responsabilités, 3-6 outils, 3-5 KPIs, 4-6 cas d'usage IA\nStockage : table academy_functions\nImpact aval : utilisé pour adapter les parcours et les prompts de contenu à la réalité métier",
        },
        {
          label: "Créer les personae comportementaux",
          actorType: "ai-gen",
          badges: [{ text: "10 traits", variant: "secondary" }, { text: "Dérivable", variant: "outline" }],
          description: "Profils d'apprentissage IA avec 10 traits numériques (1-5), tags détaillés, et dérivation personnalisée par organisation.",
          detail: "Modèle : Gemini 2.5 Pro\n10 traits : maturité digitale, appréhension IA, expérimentation, initiative, appétit changement, collaboration, autonomie, tolérance risque, littératie data, réceptivité feedback\nTags : learning_style, time_availability, preferred_format, motivation_drivers, resistance_patterns\nDérivation : un persona générique décliné par organisation (secteur, culture, outils)",
          subCards: [
            { title: "Textes de contexte", content: "Journée type, relation à l'IA, parcours idéal, approche coaching, indicateurs de succès" },
            { title: "Dérivation org", content: "Adaptation automatique au secteur, culture d'entreprise et stack outils de l'organisation" },
          ],
        },
        {
          label: "Générer le parcours de formation",
          actorType: "ai-gen",
          badges: [{ text: "N modules", variant: "default" }],
          description: "Structure complète : N modules typés (leçon, quiz, exercice, pratique), compétences, prérequis, aptitudes, débouchés professionnels.",
          detail: "Modèle : Gemini 2.5 Flash (function calling)\nEntrées : nom, description, difficulté, persona_id, function_id, nombre modules\nSorties : estimated_hours, skills[], prerequisites[], aptitudes[], professional_outcomes[], modules[]\nStockage : academy_paths → academy_modules → academy_path_modules",
        },
        {
          label: "Générer le contenu de chaque module",
          actorType: "ai-gen",
          badges: [{ text: "×5 batch", variant: "default" }, { text: "Adaptatif", variant: "outline" }],
          description: "Batch generation : contenu riche + quiz innovant + exercice + simulation IA + illustrations. Prompts adaptés au niveau de difficulté.",
          subCards: [
            { title: "1. Contenu markdown", content: "3-5 sections avec callouts (💡 À retenir, ⚠ Attention), tableaux comparatifs, schémas ASCII" },
            { title: "2. Quiz 6 types", content: "QCM, Vrai/Faux, Ordonnancement, Matching, Texte à trou, Scénario" },
            { title: "3. Exercice pratique", content: "Consignes, type livrable (text/file/code), 3-5 critères pondérés" },
            { title: "4. Simulation IA", content: "27+ practice types × 14 univers métier, system prompt dédié, rubrique d'évaluation" },
          ],
          cascadeTags: ["academy-generate", "Gemini 2.5 Pro", "Gemini 2.5 Flash", "function calling", "batch processing"],
        },
        {
          label: "Livret pédagogique PDF",
          actorType: "ai-gen",
          badges: [{ text: "PDF", variant: "secondary" }],
          description: "Document de restitution complet : sommaire, chapitres détaillés, exercices, glossaire, annexes — généré automatiquement.",
          detail: "Edge function : academy-path-document\nContenu : synthèse du parcours, tous les modules, exercices, corrections\nFormat : Markdown premium avec mise en page corporate\nPersistance : stocké dans guide_document (JSONB)",
        },
      ],
    },
    {
      number: "02",
      title: "Parcours apprenant",
      subtitle: "L'apprenant progresse, l'IA accompagne — 4 assistants IA actifs",
      color: "bg-blue-600",
      steps: [
        {
          label: "Inscription & premier module",
          actorType: "system",
          badges: [{ text: "Auto", variant: "outline" }],
          description: "L'apprenant s'inscrit, accède au portail immersif, et démarre son premier module avec brief IA personnalisé.",
          detail: "Portail immersif avec navigation par modules\nBrief IA généré à l'ouverture de chaque module\nProgression sauvegardée en temps réel",
        },
        {
          label: "IA Tuteur — Brief & Accompagnement",
          actorType: "ai-tutor",
          badges: [{ text: "4 actions", variant: "default" }],
          description: "Le tuteur IA génère un brief d'introduction, explique les concepts, coache en temps réel, et produit un debrief de fin de module.",
          subCards: [
            { title: "Brief", content: "Introduction contextuelle avec objectifs, prérequis rappelés, roadmap du module" },
            { title: "Explain", content: "Explication adaptée au niveau : analogies pour débutants, cas d'usage pour avancés" },
            { title: "Coach", content: "Feedback en temps réel sur les exercices, encouragements, pistes d'amélioration" },
            { title: "Debrief", content: "Synthèse des acquis, points d'attention, recommandations pour la suite" },
          ],
          cascadeTags: ["academy-tutor", "Gemini 2.5 Flash", "streaming", "context-aware"],
        },
        {
          label: "Quiz interactif & scoring",
          actorType: "ai-eval",
          badges: [{ text: "6 types", variant: "secondary" }],
          description: "Quiz adaptatif avec 6 types de questions, explications pédagogiques, et scoring instantané avec analytics.",
          detail: "Types : QCM, Vrai/Faux, Ordonnancement, Matching, Texte à trou, Scénario\nChaque réponse affiche l'explication pédagogique\nScore sauvegardé par module dans academy_progress\nSeuil de réussite configurable par parcours",
        },
        {
          label: "Exercice pratique évalué",
          actorType: "ai-eval",
          badges: [{ text: "Critères pondérés", variant: "default" }],
          description: "L'apprenant produit un livrable (texte, fichier, code) évalué par l'IA selon des critères pondérés définis par le formateur.",
        },
        {
          label: "Simulation IA interactive",
          actorType: "ai-tutor",
          badges: [{ text: "7 modes UI", variant: "default" }, { text: "27+ types", variant: "outline" }],
          description: "Mise en situation immersive : l'apprenant interagit avec un scénario IA (chat, code, analyse, décision, design, document, assessment).",
          detail: "7 familles UI : ChatMode, CodeMode, AnalysisMode, DecisionMode, DesignMode, DocumentMode, AssessmentMode\nWidgets : TensionGauge, KPIDashboard, TimerBar, SuggestionChips, ScoreReveal\nÉvaluation multi-dimensionnelle : radar chart, score par dimension, replay de session",
        },
        {
          label: "Knowledge Brief IA",
          actorType: "ai-know",
          badges: [{ text: "Synthèse", variant: "secondary" }],
          description: "À la fin de chaque module, l'IA génère un knowledge brief : concepts clés, bonnes pratiques, erreurs fréquentes, ressources.",
        },
      ],
    },
    {
      number: "03",
      title: "Évaluation & Certification",
      subtitle: "L'IA évalue, le système certifie — closing loop complet",
      color: "bg-amber-600",
      steps: [
        {
          label: "Évaluation globale du parcours",
          actorType: "ai-eval",
          badges: [{ text: "Persistante", variant: "default" }],
          description: "À la complétion du parcours, l'IA rédige une évaluation globale documentée : forces, axes d'amélioration, progression, recommandations.",
          detail: "Générée automatiquement à l'ouverture de la page résultats\nPersistée dans la base de données (academy_progress metadata)\nContenu : analyse par compétence, comparaison objectifs/résultats, plan de développement",
        },
        {
          label: "Cartographie des compétences",
          actorType: "ai-skill",
          badges: [{ text: "Radar", variant: "secondary" }],
          description: "L'IA analyse les scores par module et produit un radar de compétences avec niveaux initial/final et progression.",
          detail: "Stockage : academy_skill_assessments\nVisualisations : radar chart, barres de progression\nCompétences typées : technique, transversale, métier\nNiveau de 1 à 5 avec evidence trail",
        },
        {
          label: "Certification avec QR code",
          actorType: "system",
          badges: [{ text: "Vérifiable", variant: "default" }, { text: "PDF", variant: "outline" }],
          description: "Certificat PDF avec QR code de vérification publique, signature du formateur, et détail des compétences acquises.",
          detail: "Seuil configurable par parcours (min_score)\nQR code → page publique de vérification\nTemplate personnalisable (titre, signature)\nPartage LinkedIn possible",
          subCards: [
            { title: "Données du certificat", content: "Nom, parcours, date, score global, compétences acquises, organisation" },
            { title: "Vérification publique", content: "Page /verify/:id accessible sans auth, valide l'authenticité du certificat" },
          ],
        },
      ],
    },
  ],
  metrics: [
    { value: "×3", label: "Vitesse de création", accent: "text-violet-600" },
    { value: "92%", label: "Taux de complétion", accent: "text-blue-600" },
    { value: "−70%", label: "Coûts de formation", accent: "text-emerald-600" },
    { value: "100%", label: "Traçabilité", accent: "text-amber-600" },
  ],
  footerTags: [
    "academy-generate", "academy-tutor", "academy-practice", "academy-skills-agent",
    "academy-path-document", "verify-certificate", "Gemini 2.5 Pro", "Gemini 2.5 Flash",
    "function calling", "streaming", "JSONB metadata", "realtime progress",
  ],
};

/* ═══════════════ PRATIQUE ═══════════════ */

export const pratiqueCycle: CycleData = {
  title: "Cycle de mise en pratique IA",
  subtitle: "De la configuration au rapport — 7 modes de simulation, 27+ types de scénarios",
  legend: [
    { type: "ai-gen", label: "IA Génération" },
    { type: "ai-tutor", label: "IA Coach" },
    { type: "ai-eval", label: "IA Évaluation" },
    { type: "system", label: "Action système" },
  ],
  phases: [
    {
      number: "01",
      title: "Configuration du scénario",
      subtitle: "Le formateur paramètre, l'IA structure — personnalisation totale",
      color: "bg-violet-600",
      steps: [
        {
          label: "Sélection du type de pratique",
          actorType: "system",
          badges: [{ text: "27+ types", variant: "default" }],
          description: "Choix parmi 27+ types : négociation, code review, gestion de crise, due diligence, pitch, vibe coding, etc.",
          subCards: [
            { title: "Chat", content: "Négociation, coaching, entretien, brainstorming, médiation" },
            { title: "Code", content: "Code review, vibe coding, debugging, architecture" },
            { title: "Analyse", content: "Étude de cas, due diligence, audit, benchmark" },
            { title: "Décision", content: "Scénario stratégique, gestion de crise, priorisation" },
          ],
        },
        {
          label: "Scénario & system prompt",
          actorType: "ai-gen",
          badges: [{ text: "Contextuel", variant: "secondary" }],
          description: "L'IA génère ou le formateur rédige le scénario, le contexte métier, et le system prompt qui cadre l'interaction.",
          detail: "14 univers métier disponibles : tech, finance, santé, retail, industrie, éducation, juridique, RH, marketing, consulting, immobilier, énergie, agroalimentaire, transport\nPrompt templates par type de pratique\nConfig UI automatique selon le type (7 familles)",
        },
        {
          label: "Rubrique d'évaluation",
          actorType: "ai-gen",
          badges: [{ text: "Multi-dim", variant: "default" }],
          description: "Dimensions d'évaluation (3-6), grille de scoring par dimension, critères qualitatifs, seuils de réussite.",
          detail: "Dimensions typiques : pertinence, argumentation, créativité, structure, esprit critique, communication\nChaque dimension : label, description, weight (1-5)\nRubrique complète : scoring guide par niveau (1-5) avec exemples",
        },
      ],
    },
    {
      number: "02",
      title: "Session interactive",
      subtitle: "L'apprenant pratique, l'IA s'adapte — interaction temps réel",
      color: "bg-blue-600",
      steps: [
        {
          label: "Onboarding & briefing",
          actorType: "system",
          badges: [{ text: "Immersif", variant: "outline" }],
          description: "Overlay d'introduction : objectifs, contexte, rôle de l'apprenant, consignes, timer configurable.",
        },
        {
          label: "Interaction IA adaptative",
          actorType: "ai-tutor",
          badges: [{ text: "Streaming", variant: "default" }, { text: "7 modes UI", variant: "secondary" }],
          description: "L'apprenant interagit dans le mode UI adapté. L'IA coach challenge, soutient, et évalue en continu.",
          subCards: [
            { title: "ChatMode", content: "Dialogue conversationnel avec l'IA jouant un rôle (client, manager, candidat)" },
            { title: "CodeMode", content: "Éditeur de code avec coloration, l'IA review et guide en temps réel" },
            { title: "AnalysisMode", content: "Données à analyser, l'IA challenge les conclusions et pousse la réflexion" },
            { title: "DecisionMode", content: "Timeline de décisions, l'IA présente des conséquences et dilemmes" },
            { title: "DesignMode", content: "Canvas de design thinking, l'IA facilite et structure" },
            { title: "DocumentMode", content: "Rédaction de livrables, l'IA annote et suggère" },
          ],
          cascadeTags: ["TensionGauge", "KPIDashboard", "TimerBar", "SuggestionChips", "InputQualityIndicator"],
        },
        {
          label: "Widgets de feedback temps réel",
          actorType: "system",
          badges: [{ text: "Live", variant: "default" }],
          description: "Tension gauge (engagement), KPI dashboard (métriques live), timer, suggestions contextuelles, indicateur qualité.",
        },
      ],
    },
    {
      number: "03",
      title: "Évaluation & Restitution",
      subtitle: "L'IA évalue, le système restitue — closing loop",
      color: "bg-amber-600",
      steps: [
        {
          label: "Score reveal & radar",
          actorType: "ai-eval",
          badges: [{ text: "Multi-dim", variant: "default" }, { text: "Radar", variant: "secondary" }],
          description: "Animation de révélation du score global, puis radar chart détaillé par dimension d'évaluation.",
          detail: "Score global : moyenne pondérée des dimensions\nRadar chart : visualisation spider web des compétences\nComparaison : positionnement vs moyenne du groupe (si disponible)",
        },
        {
          label: "Rapport détaillé IA",
          actorType: "ai-eval",
          badges: [{ text: "Persistant", variant: "default" }],
          description: "Rapport structuré : analyse par dimension, points forts, axes d'amélioration, recommandations concrètes.",
          detail: "Généré par l'edge function ai-coach\nFormat : Markdown premium avec callouts\nPersisté dans simulator_sessions.evaluation\nRe-consultable depuis l'historique",
        },
        {
          label: "Session replay",
          actorType: "system",
          badges: [{ text: "Replay", variant: "outline" }],
          description: "Relecture complète de la session : messages échangés, décisions prises, annotations IA, timeline navigable.",
        },
      ],
    },
  ],
  metrics: [
    { value: "7", label: "Modes UI", accent: "text-violet-600" },
    { value: "27+", label: "Types de scénarios", accent: "text-blue-600" },
    { value: "14", label: "Univers métier", accent: "text-emerald-600" },
    { value: "6", label: "Dimensions éval.", accent: "text-amber-600" },
  ],
  footerTags: [
    "academy-practice", "ai-coach", "SimulatorEngine", "streaming",
    "ChatMode", "CodeMode", "AnalysisMode", "DecisionMode", "DesignMode", "DocumentMode", "AssessmentMode",
  ],
};

/* ═══════════════ WORKSHOPS ═══════════════ */

export const workshopsCycle: CycleData = {
  title: "Cycle Workshop collaboratif",
  subtitle: "Du toolkit au livrable — intelligence collective augmentée par l'IA",
  legend: [
    { type: "ai-gen", label: "IA Génération" },
    { type: "ai-tutor", label: "IA Facilitateur" },
    { type: "ai-eval", label: "IA Analyse" },
    { type: "system", label: "Action système" },
  ],
  phases: [
    {
      number: "01",
      title: "Préparation",
      subtitle: "Le facilitateur configure, l'IA génère les outils — setup complet",
      color: "bg-emerald-600",
      steps: [
        {
          label: "Sélection & génération du toolkit",
          actorType: "ai-gen",
          badges: [{ text: "10 piliers", variant: "default" }, { text: "4 phases", variant: "secondary" }],
          description: "Choix ou génération IA d'un toolkit stratégique : 10 piliers × 4 phases = 40+ cartes méthodo avec objectifs, KPIs, actions.",
          detail: "Piliers : Stratégie, Business Model, Innovation, Finance, Marketing, Opérations, Équipe, Juridique, Croissance, Impact\nPhases : Fondations, Modèle, Croissance, Exécution\nChaque carte : titre, définition, objectif, action, KPI, qualification, difficulté, durée, valorisation",
          subCards: [
            { title: "Génération IA", content: "generate-toolkit : l'IA crée un toolkit complet adapté au secteur et à la taille d'entreprise" },
            { title: "Import CSV", content: "import-toolkit-cards : import de cartes existantes depuis un fichier CSV structuré" },
          ],
        },
        {
          label: "Configuration du workshop",
          actorType: "system",
          badges: [{ text: "Multi-user", variant: "outline" }],
          description: "Création du workshop : nom, toolkit, participants invités, rôles (facilitateur, participant), dates.",
        },
        {
          label: "Game plans (parcours guidés)",
          actorType: "ai-gen",
          badges: [{ text: "Scénarisé", variant: "secondary" }],
          description: "Séquences de cartes pré-ordonnées avec instructions pour guider les participants étape par étape.",
          detail: "Chaque game plan : nom, description, difficulté, durée estimée\nÉtapes ordonnées : card_id + instruction personnalisée\nExemple : \"Sprint Business Model\" en 90 min, 8 étapes",
        },
      ],
    },
    {
      number: "02",
      title: "Session live",
      subtitle: "Les participants collaborent, l'IA enrichit — canevas temps réel",
      color: "bg-blue-600",
      steps: [
        {
          label: "Canevas collaboratif",
          actorType: "system",
          badges: [{ text: "Temps réel", variant: "default" }, { text: "Drag & Drop", variant: "outline" }],
          description: "Canvas infini avec cartes, sticky notes, textes, icônes, flèches, groupes — tout est déplaçable et redimensionnable.",
          subCards: [
            { title: "Cartes toolkit", content: "Glisser-déposer les cartes depuis la sidebar vers le canvas, positionnement libre" },
            { title: "Sticky notes", content: "Post-its colorés pour brainstorming, commentaires, idées libres" },
            { title: "Flèches & connexions", content: "Lier les éléments avec des flèches (droites, courbes, orthogonales)" },
            { title: "Groupes", content: "Regrouper visuellement des éléments par thème ou par priorité" },
          ],
          cascadeTags: ["realtime", "drag-and-drop", "canvas-items", "WebSocket"],
        },
        {
          label: "Chat IA contextuel",
          actorType: "ai-tutor",
          badges: [{ text: "Contextuel", variant: "default" }],
          description: "L'IA facilitateur analyse le canvas et propose des insights, questionne les choix, suggère des cartes complémentaires.",
        },
        {
          label: "Scoring & discussion",
          actorType: "system",
          badges: [{ text: "Gamification", variant: "secondary" }],
          description: "Système de votes et scores sur les cartes, fil de discussion par élément, stats temps réel du workshop.",
        },
      ],
    },
    {
      number: "03",
      title: "Restitution & Livrables",
      subtitle: "L'IA synthétise, le système exporte — outputs actionnables",
      color: "bg-amber-600",
      steps: [
        {
          label: "Synthèse IA du workshop",
          actorType: "ai-eval",
          badges: [{ text: "Auto", variant: "default" }],
          description: "L'IA analyse l'ensemble du canvas et produit une synthèse : thèmes émergents, consensus, divergences, recommandations.",
        },
        {
          label: "Statistiques & analytics",
          actorType: "system",
          badges: [{ text: "Dashboard", variant: "secondary" }],
          description: "Métriques du workshop : participation, cartes utilisées, distribution par pilier/phase, scores moyens, temps passé.",
        },
        {
          label: "Export & partage",
          actorType: "system",
          badges: [{ text: "Multi-format", variant: "outline" }],
          description: "Export du canvas et des livrables : PDF, image, données JSON — partage avec les parties prenantes.",
        },
      ],
    },
  ],
  metrics: [
    { value: "40+", label: "Cartes par toolkit", accent: "text-emerald-600" },
    { value: "10", label: "Piliers stratégiques", accent: "text-blue-600" },
    { value: "∞", label: "Canvas infini", accent: "text-violet-600" },
    { value: "Live", label: "Collaboration", accent: "text-amber-600" },
  ],
  footerTags: [
    "generate-toolkit", "refine-toolkit", "import-toolkit-cards", "ai-coach",
    "realtime", "canvas", "WebSocket", "gamification",
  ],
};

/* ═══════════════ CHALLENGES ═══════════════ */

export const challengesCycle: CycleData = {
  title: "Cycle Challenge stratégique",
  subtitle: "Du diagnostic à la recommandation — consulting autonome augmenté par l'IA",
  legend: [
    { type: "ai-gen", label: "IA Génération" },
    { type: "ai-eval", label: "IA Analyse" },
    { type: "system", label: "Action système" },
  ],
  phases: [
    {
      number: "01",
      title: "Configuration du diagnostic",
      subtitle: "L'admin structure le challenge, l'IA enrichit — framework de consulting",
      color: "bg-rose-600",
      steps: [
        {
          label: "Sujets & slots d'évaluation",
          actorType: "system",
          badges: [{ text: "Structuré", variant: "default" }],
          description: "Définition des sujets stratégiques (diagnostic, objectif, action, KPI) avec des slots typés pour les réponses.",
          detail: "Types de sujets : diagnostic, objectif, action, KPI\nTypes de slots : priorité, action, KPI, risque, opportunité, ressource\nChaque slot : label, hint, required, sort_order",
          subCards: [
            { title: "Template", content: "Modèle réutilisable de challenge avec sujets et slots pré-configurés" },
            { title: "Multi-toolkit", content: "Un challenge peut puiser dans plusieurs toolkits pour les cartes disponibles" },
          ],
        },
        {
          label: "Sélection format & maturité",
          actorType: "system",
          badges: [{ text: "3 formats", variant: "secondary" }, { text: "5 niveaux", variant: "outline" }],
          description: "Le participant choisit son format de réponse (quick, standard, expert) et auto-évalue sa maturité (1-5).",
        },
      ],
    },
    {
      number: "02",
      title: "Board stratégique",
      subtitle: "Le participant construit sa stratégie — drag & drop de cartes dans les slots",
      color: "bg-blue-600",
      steps: [
        {
          label: "Zone de staging",
          actorType: "system",
          badges: [{ text: "Drag & Drop", variant: "default" }],
          description: "Les cartes toolkit sont disponibles dans une zone de sélection. Le participant les filtre, les explore, et les stage.",
        },
        {
          label: "Placement dans les slots",
          actorType: "system",
          badges: [{ text: "Sujet par sujet", variant: "secondary" }],
          description: "Navigation sujet par sujet : le participant place ses cartes dans les slots avec un ranking de priorité.",
          detail: "Chaque placement : card_id, slot_id, subject_id, rank, format, maturity\nValidation : tous les slots required doivent être remplis\nPersistance temps réel dans challenge_responses",
        },
        {
          label: "Vue board complète",
          actorType: "system",
          badges: [{ text: "Vue d'ensemble", variant: "outline" }],
          description: "Visualisation de tous les sujets avec les cartes placées, scores de couverture, et progression globale.",
        },
      ],
    },
    {
      number: "03",
      title: "Analyse IA & Recommandations",
      subtitle: "L'IA analyse les choix, produit un diagnostic stratégique complet",
      color: "bg-amber-600",
      steps: [
        {
          label: "Analyse stratégique IA",
          actorType: "ai-eval",
          badges: [{ text: "Deep analysis", variant: "default" }],
          description: "L'IA analyse les cartes placées, la cohérence des choix, les gaps stratégiques, et produit un rapport structuré.",
          detail: "Edge function : analyze-challenge\nAnalyse : cohérence inter-sujets, couverture des piliers, alignement maturité/ambition\nSortie : forces, faiblesses, recommandations, roadmap suggérée\nPersistance : challenge_analyses",
        },
        {
          label: "Matrice de maturité",
          actorType: "ai-eval",
          badges: [{ text: "Visuel", variant: "secondary" }],
          description: "Matrice positionnant l'organisation sur chaque sujet : maturité actuelle vs cible, avec les cartes sélectionnées.",
        },
        {
          label: "Recommandations actionnables",
          actorType: "ai-eval",
          badges: [{ text: "Roadmap", variant: "default" }],
          description: "Plan d'action priorisé : quick wins, projets structurants, transformations, avec calendrier et ressources estimées.",
        },
      ],
    },
  ],
  metrics: [
    { value: "30min", label: "Diagnostic complet", accent: "text-rose-600" },
    { value: "4", label: "Types de sujets", accent: "text-blue-600" },
    { value: "6", label: "Types de slots", accent: "text-violet-600" },
    { value: "360°", label: "Analyse IA", accent: "text-amber-600" },
  ],
  footerTags: [
    "analyze-challenge", "challenge_templates", "challenge_subjects", "challenge_slots",
    "challenge_responses", "challenge_analyses", "drag-and-drop", "Gemini 2.5 Pro",
  ],
};

/* ═══════════════ PLATEFORME ═══════════════ */

export const plateformeCycle: CycleData = {
  title: "Cycle Plateforme & Administration",
  subtitle: "Créer, déployer, mesurer — la boucle complète de gestion",
  legend: [
    { type: "ai-gen", label: "IA Génération" },
    { type: "system", label: "Action système" },
  ],
  phases: [
    {
      number: "01",
      title: "Administration & Paramétrage",
      subtitle: "L'admin configure tout — organisations, rôles, permissions, quotas",
      color: "bg-slate-700",
      steps: [
        {
          label: "Multi-organisation",
          actorType: "system",
          badges: [{ text: "Multi-tenant", variant: "default" }],
          description: "Chaque organisation a ses propres toolkits, parcours, utilisateurs, configurations IA, et quotas.",
          subCards: [
            { title: "Organisations", content: "Nom, slug, plan, owner, configurations indépendantes" },
            { title: "Équipes", content: "Sous-groupes dans une org avec permissions spécifiques" },
          ],
        },
        {
          label: "Rôles & permissions (RBAC)",
          actorType: "system",
          badges: [{ text: "Granulaire", variant: "secondary" }],
          description: "Système de rôles (admin, moderator, user) avec permissions granulaires par module et par action.",
          detail: "Rôles : super_admin, org_admin, moderator, member\nPermissions : par module (academy, simulator, workshop, challenge)\nPar action : create, read, update, delete, export\nRLS Postgres natif pour la sécurité",
        },
        {
          label: "Configuration IA par organisation",
          actorType: "system",
          badges: [{ text: "Personnalisable", variant: "outline" }],
          description: "Chaque organisation peut configurer son provider IA, ses modèles, sa température, ses prompts personnalisés.",
          detail: "Providers supportés : OpenAI, Google, Anthropic, Mistral\nModèles configurables : chat et structured séparément\nPrompts : override par organisation du system prompt\nQuotas : crédits par utilisateur, par organisation",
        },
        {
          label: "Système de crédits & quotas",
          actorType: "system",
          badges: [{ text: "Granulaire", variant: "default" }],
          description: "Chaque action IA consomme des crédits. Quotas configurables par plan, par organisation, par utilisateur.",
        },
      ],
    },
    {
      number: "02",
      title: "Portail immersif",
      subtitle: "L'utilisateur navigue — expérience documentée et guidée",
      color: "bg-blue-600",
      steps: [
        {
          label: "Navigation contextuelle",
          actorType: "system",
          badges: [{ text: "Responsive", variant: "default" }],
          description: "Sidebar dynamique, bottom nav mobile, command palette (⌘K), breadcrumb contextuel, org switcher.",
        },
        {
          label: "Portail de formation",
          actorType: "system",
          badges: [{ text: "Immersif", variant: "secondary" }],
          description: "Dashboard apprenant, parcours avec progression, modules interactifs, résultats avec évaluation IA.",
        },
        {
          label: "Espace pratique",
          actorType: "system",
          badges: [{ text: "7 modes", variant: "default" }],
          description: "Simulateur IA avec historique de sessions, rapports détaillés, replay de sessions passées.",
        },
        {
          label: "Espace workshops & challenges",
          actorType: "system",
          badges: [{ text: "Collaboratif", variant: "outline" }],
          description: "Canvas collaboratif pour les workshops, board stratégique pour les challenges, tout en temps réel.",
        },
      ],
    },
    {
      number: "03",
      title: "Observabilité & Mesure",
      subtitle: "Tout est traçable — catalogue, matrice, logs, analytics",
      color: "bg-amber-600",
      steps: [
        {
          label: "Catalogue d'observabilité",
          actorType: "system",
          badges: [{ text: "5 vues", variant: "default" }],
          description: "Tous les assets de la plateforme dans un catalogue navigable : grille, tableau, kanban, timeline, treemap.",
          detail: "Assets suivis : parcours, modules, quizzes, exercices, pratiques, workshops, challenges, toolkits\nFiltres : type, statut, organisation, contributeur, date\n5 vues : GridView, TableView, KanbanView, TimelineView, TreemapView",
        },
        {
          label: "Matrice de suivi",
          actorType: "system",
          badges: [{ text: "Dashboard", variant: "secondary" }],
          description: "Matrice croisant les assets par type, statut, et organisation — vue d'ensemble opérationnelle.",
        },
        {
          label: "Logs d'activité",
          actorType: "system",
          badges: [{ text: "Audit trail", variant: "outline" }],
          description: "Chaque action utilisateur est tracée : action, entité, metadata, timestamp — audit trail complet.",
          detail: "Stockage : activity_logs\nChamps : user_id, action, entity_type, entity_id, metadata, organization_id\nRecherche : filtres par date, utilisateur, action, entité\nExport : CSV pour compliance",
        },
      ],
    },
  ],
  metrics: [
    { value: "∞", label: "Organisations", accent: "text-slate-600" },
    { value: "5", label: "Vues catalogue", accent: "text-blue-600" },
    { value: "100%", label: "Traçabilité", accent: "text-emerald-600" },
    { value: "RBAC", label: "Sécurité native", accent: "text-amber-600" },
  ],
  footerTags: [
    "multi-tenant", "RBAC", "RLS", "activity_logs", "observatory_assets",
    "credit_transactions", "ai_configurations", "Postgres", "Edge Functions",
  ],
};
