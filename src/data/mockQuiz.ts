import type { PillarId } from "./mockCards";

export interface QuizQuestion {
  id: string;
  pillar: PillarId;
  question: string;
  options: { label: string; score: number }[];
}

export const quizQuestions: QuizQuestion[] = [
  // THINKING
  { id: "q1", pillar: "thinking", question: "Comment prenez-vous vos décisions stratégiques ?", options: [
    { label: "À l'instinct", score: 1 },
    { label: "En demandant autour de moi", score: 2 },
    { label: "Avec un framework structuré", score: 3 },
    { label: "Data + framework + second opinion", score: 4 },
  ]},
  { id: "q2", pillar: "thinking", question: "À quelle fréquence remettez-vous en question vos hypothèses ?", options: [
    { label: "Rarement", score: 1 },
    { label: "Quand ça ne marche pas", score: 2 },
    { label: "Régulièrement en équipe", score: 3 },
    { label: "C'est un processus continu documenté", score: 4 },
  ]},
  // BUSINESS
  { id: "q3", pillar: "business", question: "Avez-vous un business model clairement défini ?", options: [
    { label: "Pas encore", score: 1 },
    { label: "Une idée vague", score: 2 },
    { label: "Un canvas rempli", score: 3 },
    { label: "Validé avec des données terrain", score: 4 },
  ]},
  { id: "q4", pillar: "business", question: "Votre proposition de valeur est-elle validée ?", options: [
    { label: "Je pense que oui", score: 1 },
    { label: "J'ai eu des retours informels", score: 2 },
    { label: "J'ai interviewé des clients", score: 3 },
    { label: "Validée par des ventes/conversions", score: 4 },
  ]},
  // INNOVATION
  { id: "q5", pillar: "innovation", question: "Comment développez-vous de nouvelles idées ?", options: [
    { label: "Au feeling", score: 1 },
    { label: "En regardant la concurrence", score: 2 },
    { label: "Avec un processus d'idéation", score: 3 },
    { label: "Design thinking + user research continu", score: 4 },
  ]},
  // FINANCE
  { id: "q6", pillar: "finance", question: "Connaissez-vous votre unit economics ?", options: [
    { label: "C'est quoi ?", score: 1 },
    { label: "J'ai une idée", score: 2 },
    { label: "CAC et LTV calculés", score: 3 },
    { label: "Optimisés et suivis mensuellement", score: 4 },
  ]},
  // MARKETING
  { id: "q7", pillar: "marketing", question: "Comment acquérez-vous vos clients ?", options: [
    { label: "Bouche à oreille uniquement", score: 1 },
    { label: "1-2 canaux non optimisés", score: 2 },
    { label: "Stratégie multi-canal documentée", score: 3 },
    { label: "Funnel AARRR mesuré et optimisé", score: 4 },
  ]},
  // OPERATIONS
  { id: "q8", pillar: "operations", question: "Comment gérez-vous vos projets ?", options: [
    { label: "Dans ma tête", score: 1 },
    { label: "To-do list basique", score: 2 },
    { label: "Méthode agile avec sprints", score: 3 },
    { label: "OKR + agile + automatisation", score: 4 },
  ]},
  // TEAM
  { id: "q9", pillar: "team", question: "Votre équipe est-elle structurée ?", options: [
    { label: "Je suis seul(e)", score: 1 },
    { label: "Quelques freelances", score: 2 },
    { label: "Équipe core avec rôles définis", score: 3 },
    { label: "Culture forte + processus de recrutement", score: 4 },
  ]},
  // GROWTH
  { id: "q10", pillar: "growth", question: "Avez-vous identifié vos leviers de croissance ?", options: [
    { label: "Pas encore", score: 1 },
    { label: "J'ai des intuitions", score: 2 },
    { label: "Testés et documentés", score: 3 },
    { label: "Optimisés avec des boucles virales", score: 4 },
  ]},
];

export function computeRadarScores(answers: Record<string, number>): Record<PillarId, number> {
  const scores: Record<string, { total: number; count: number }> = {};
  
  quizQuestions.forEach(q => {
    if (answers[q.id] !== undefined) {
      if (!scores[q.pillar]) scores[q.pillar] = { total: 0, count: 0 };
      scores[q.pillar].total += answers[q.id];
      scores[q.pillar].count += 1;
    }
  });

  const result: Record<string, number> = {};
  const allPillars: PillarId[] = ["thinking", "business", "innovation", "finance", "marketing", "operations", "team", "legal", "growth", "impact"];
  
  allPillars.forEach(p => {
    if (scores[p]) {
      result[p] = (scores[p].total / (scores[p].count * 4)) * 100;
    } else {
      result[p] = 0;
    }
  });

  return result as Record<PillarId, number>;
}
