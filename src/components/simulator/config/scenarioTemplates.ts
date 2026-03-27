// Rich scenario briefings and initial suggestion chips for standalone simulator sessions

import { getModeDefinition, UNIVERSE_LABELS } from "./modeRegistry";
import { getModeInsight } from "./modeInsights";

export function generateRichScenario(
  practiceType: string,
  difficulty: string = "intermediate",
  aiLevel: string = "guided"
): string {
  const def = getModeDefinition(practiceType);
  if (!def) return "Bienvenue dans cette simulation. Commencez quand vous êtes prêt.";
  const insight = getModeInsight(practiceType);

  const diffLabel = difficulty === "beginner" ? "Débutant"
    : difficulty === "intermediate" ? "Intermédiaire"
    : difficulty === "advanced" ? "Avancé" : "Expert";

  const aiLabel = aiLevel === "autonomous" ? "Mode autonome — vous êtes seul"
    : aiLevel === "intensive" ? "Mode intensif — coaching continu et proactif"
    : "Mode guidé — suggestions et aide sur demande";

  const dims = def.evaluationDimensions.map(d => d.replace(/_/g, " ")).join(" · ");

  return `## 🎯 ${def.label}

**${UNIVERSE_LABELS[def.universe]}** · Difficulté ${diffLabel}

---

${insight.longDescription}

### 📋 Compétences développées
${insight.skills.map(s => `- ${s}`).join("\n")}

### 📊 Critères d'évaluation
${dims}

### 💡 Conseils pour bien démarrer
${insight.tips.map(t => `> ${t}`).join("\n")}

---

*🤖 ${aiLabel}*

*Commencez quand vous êtes prêt. Exemple : « ${insight.exampleFirstMessage} »*`;
}

// Initial suggestion chips per practice_type for guided mode
const INITIAL_SUGGESTIONS: Record<string, string[]> = {
  code_review: ["Montre-moi le code à reviewer", "Quel est le contexte du projet ?", "Y a-t-il des contraintes de performance ?"],
  debug: ["Montre-moi la stack trace", "Dans quel environnement le bug apparaît ?", "Quand a-t-il été détecté pour la première fois ?"],
  system_design: ["Quels sont les requirements fonctionnels ?", "Quel volume de trafic est attendu ?", "Quelles sont les contraintes de coût ?"],
  pair_programming: ["Définissons l'interface ensemble", "Quel est le problème à résoudre ?", "Commençons par les types de données"],
  refactoring: ["Montre-moi le code legacy", "Quels sont les principaux pain points ?", "Y a-t-il des tests existants ?"],
  tdd_kata: ["Je suis prêt pour le premier test", "Quel est le niveau de difficulté ?", "On travaille sur quel kata ?"],
  vibe_coding: ["Quel est l'objectif fonctionnel ?", "Quelle stack technique ?", "Je commence mon brief"],
  spec_writing: ["Décris-moi le besoin métier", "Qui sont les utilisateurs cibles ?", "Quelles sont les contraintes ?"],
  prompt_to_app: ["Quel type d'application ?", "Je commence à rédiger mon prompt", "Quelles sont les fonctionnalités clés ?"],
  nocode_architect: ["Quel processus automatiser ?", "Quels outils sont disponibles ?", "Quel est le volume de traitement ?"],
  user_story: ["Décris-moi le besoin métier", "Qui est l'utilisateur principal ?", "Quels sont les parcours critiques ?"],
  backlog_prio: ["Montre-moi le backlog", "Quelle méthode de priorisation utiliser ?", "Quels sont les objectifs du trimestre ?"],
  sprint_planning: ["Quelle est la vélocité de l'équipe ?", "Montre-moi le backlog priorisé", "Y a-t-il des contraintes de disponibilité ?"],
  user_interview: ["Bonjour, pouvez-vous vous présenter ?", "Comment se passe votre journée type ?", "Quel est votre plus grand frustration ?"],
  prototype_review: ["Je vais vous présenter le prototype", "Commençons par le parcours principal", "Que pensez-vous de l'écran d'accueil ?"],
  incident_response: ["Quel est le statut des services ?", "Qui est impacté ?", "Depuis quand le problème est-il présent ?"],
  adr: ["Quel est le contexte technique ?", "Quelles alternatives avez-vous identifiées ?", "Quelles sont les contraintes ?"],
  capacity_planning: ["Montrez-moi les métriques de trafic", "Quelle est la croissance prévue ?", "Quel est le budget infra ?"],
  security_audit: ["Montrez-moi la configuration", "Quels sont les accès exposés ?", "Y a-t-il des audits précédents ?"],
  requirements: ["Pouvez-vous décrire votre besoin ?", "Qui utilisera ce système ?", "Quels problèmes rencontrez-vous aujourd'hui ?"],
  process_mapping: ["Décrivez le processus actuel", "Où sont les principaux goulots ?", "Combien de personnes impliquées ?"],
  data_storytelling: ["Montrez-moi les données", "Quel est le message clé ?", "Qui est l'audience cible ?"],
  kpi_design: ["Quel est l'objectif stratégique ?", "Comment mesurez-vous le succès aujourd'hui ?", "Quelles données sont disponibles ?"],
  ai_usecase: ["Quel est le problème métier ?", "Quelles données sont disponibles ?", "Quel ROI est attendu ?"],
  change_management: ["Quel est le contexte de la transformation ?", "Qui sont les parties prenantes clés ?", "Quelles résistances anticipez-vous ?"],
  ai_impact: ["Quel est le projet IA concerné ?", "Combien de personnes sont impactées ?", "Quel est le calendrier prévu ?"],
  adoption_strategy: ["Quel outil doit être déployé ?", "Combien d'utilisateurs cibles ?", "Quels outils remplace-t-il ?"],
  digital_maturity: ["Décrivez l'organisation", "Quels outils numériques sont en place ?", "Quel est le niveau de compétences digitales ?"],
  due_diligence: ["Je souhaite voir les états financiers", "Y a-t-il des litiges en cours ?", "Quelle est la concentration client ?"],
  integration_planning: ["Quelles sont les deux entités ?", "Où sont les principales synergies ?", "Quels systèmes doivent fusionner ?"],
  restructuring: ["Quelle est la situation financière ?", "Combien d'employés ?", "Quels sont les principaux postes de coûts ?"],
  valuation: ["Montrez-moi les données financières", "Quel est le secteur d'activité ?", "Quelle est la croissance historique ?"],
  negotiation: ["Merci pour ce rendez-vous", "Pouvez-vous rappeler le contexte ?", "Quels sont vos enjeux principaux ?"],
  pitch: ["Le problème que nous résolvons...", "Notre marché représente...", "Notre équipe est unique parce que..."],
  crisis: ["Quel est le premier rapport de situation ?", "Qui est déjà mobilisé ?", "Quelle est la communication en cours ?"],
  feedback_360: ["Je suis prêt à commencer", "Qui est mon premier interlocuteur ?", "Sur quelle période porte le feedback ?"],
  storytelling: ["Je vais construire l'histoire autour de...", "Qui est le héros de cette histoire ?", "Quel problème résolvons-nous ?"],
  crisis_comms: ["Quels sont les faits établis ?", "Quelle communication a déjà été faite ?", "Quels médias sont impliqués ?"],
  presentation: ["Je vais structurer autour de 3 messages", "Quelle est l'audience ?", "Quel est le temps imparti ?"],
  conversation: ["J'aimerais travailler sur...", "Pouvez-vous me coacher sur...", "J'ai une situation à discuter"],
  legal_analysis: ["Présentez-moi les faits du cas", "Quel droit est applicable ?", "Quelles sont les parties impliquées ?"],
  contract_negotiation: ["Commençons par les clauses principales", "Quels sont les points non-négociables ?", "Quel est le contexte commercial ?"],
  compliance: ["Présentez-moi le dilemme", "Quels textes s'appliquent ?", "Quelles sont les options ?"],
  gdpr_pia: ["Quel traitement est concerné ?", "Quelles données personnelles ?", "Quelle est la base légale ?"],
  case_study: ["Présentez-moi le cas", "Quelles sont les données clés ?", "Quel est l'enjeu principal ?"],
  socratic: ["Je souhaite défendre la position que...", "Mon premier argument est...", "Voici mes preuves..."],
  bm_design: ["Quel est le segment client cible ?", "Quelle proposition de valeur ?", "Quel modèle de revenu ?"],
  audit: ["Montrez-moi les données", "Quels sont les KPIs actuels ?", "Où sont les alertes ?"],
  prompt_challenge: ["Je suis prêt pour le défi", "Quel est l'objectif ?", "Quel modèle IA est ciblé ?"],
  prompt_lab: ["Je veux explorer le chain-of-thought", "Montrez-moi un exemple few-shot", "Comment structurer un system prompt ?"],
  teach_back: ["Je vais vous expliquer...", "Connaissez-vous déjà... ?", "Commençons par les bases"],
  sales: ["Bonjour, merci pour ce RDV", "Quels sont vos enjeux actuels ?", "Comment gérez-vous ce sujet aujourd'hui ?"],
  interview: ["Bonjour, ravi de participer", "Pouvez-vous me décrire le poste ?", "Qu'attendez-vous du candidat idéal ?"],
  mediation: ["Commençons par écouter chaque partie", "Qui souhaite s'exprimer en premier ?", "Quel est l'objet du différend ?"],
  onboarding_buddy: ["Bonjour, c'est mon premier jour !", "Pouvez-vous me présenter l'équipe ?", "Comment fonctionne le quotidien ici ?"],
  culture_quiz: ["Je suis prêt pour le quiz !", "Commençons par les valeurs", "Quels sont les rituels de l'entreprise ?"],
  decision_game: ["Je suis prêt à décider", "Quel est le contexte initial ?", "Quels sont mes KPIs de départ ?"],
};

export function getInitialSuggestions(practiceType: string): string[] {
  return INITIAL_SUGGESTIONS[practiceType] || [
    "Pouvez-vous me décrire le contexte ?",
    "Quels sont les objectifs principaux ?",
    "Par où me conseillez-vous de commencer ?",
  ];
}
