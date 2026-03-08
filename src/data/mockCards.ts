export type PillarId = "thinking" | "business" | "innovation" | "finance" | "marketing" | "operations" | "team" | "legal" | "growth" | "impact";
export type PhaseId = "fondations" | "modele" | "croissance" | "execution";

export interface StrategyCard {
  id: string;
  title: string;
  pillar: PillarId;
  phase: PhaseId;
  definition: string;
  action: string;
  kpi: string;
}

export interface Pillar {
  id: PillarId;
  name: string;
  icon: string;
  cardCount: number;
}

export const pillars: Pillar[] = [
  { id: "thinking", name: "Thinking", icon: "Brain", cardCount: 22 },
  { id: "business", name: "Business", icon: "TrendingUp", cardCount: 24 },
  { id: "innovation", name: "Innovation", icon: "Lightbulb", cardCount: 20 },
  { id: "finance", name: "Finance", icon: "DollarSign", cardCount: 18 },
  { id: "marketing", name: "Marketing", icon: "Megaphone", cardCount: 21 },
  { id: "operations", name: "Operations", icon: "Settings", cardCount: 19 },
  { id: "team", name: "Team", icon: "Users", cardCount: 20 },
  { id: "legal", name: "Legal", icon: "Scale", cardCount: 16 },
  { id: "growth", name: "Growth", icon: "Rocket", cardCount: 22 },
  { id: "impact", name: "Impact", icon: "Star", cardCount: 18 },
];

export const cards: StrategyCard[] = [
  // THINKING
  { id: "t1", title: "First Principles", pillar: "thinking", phase: "fondations", definition: "Décomposer un problème en éléments fondamentaux pour reconstruire une solution originale.", action: "Listez 3 croyances sur votre marché et challengez chacune.", kpi: "Nombre d'hypothèses invalidées" },
  { id: "t2", title: "Mental Models", pillar: "thinking", phase: "fondations", definition: "Cadres de réflexion pour comprendre et naviguer la complexité.", action: "Identifiez 3 mental models applicables à votre business.", kpi: "Décisions prises avec un framework explicite" },
  { id: "t3", title: "Systems Thinking", pillar: "thinking", phase: "modele", definition: "Analyser les interactions et boucles de rétroaction d'un système.", action: "Dessinez la carte des flux de votre business.", kpi: "Boucles de feedback identifiées" },
  { id: "t4", title: "Second-Order Thinking", pillar: "thinking", phase: "croissance", definition: "Anticiper les conséquences des conséquences de vos décisions.", action: "Pour votre prochaine décision, listez les effets de 2e et 3e ordre.", kpi: "Risques anticipés vs réalisés" },
  { id: "t5", title: "Inversion", pillar: "thinking", phase: "fondations", definition: "Résoudre un problème en partant de ce qu'il faut éviter.", action: "Listez tout ce qui ferait échouer votre projet, puis inversez.", kpi: "Risques éliminés proactivement" },
  { id: "t6", title: "Confirmation Bias", pillar: "thinking", phase: "fondations", definition: "Tendance à chercher des infos confirmant nos croyances.", action: "Cherchez activement 3 preuves contre votre hypothèse principale.", kpi: "Sources contradictoires consultées" },
  { id: "t7", title: "Occam's Razor", pillar: "thinking", phase: "modele", definition: "Privilégier l'explication la plus simple.", action: "Simplifiez votre pitch en une seule phrase.", kpi: "Complexité réduite de X%" },
  { id: "t8", title: "Bayesian Thinking", pillar: "thinking", phase: "croissance", definition: "Mettre à jour ses croyances avec les nouvelles données.", action: "Définissez 3 signaux qui changeraient votre stratégie.", kpi: "Fréquence de mise à jour des hypothèses" },

  // BUSINESS
  { id: "b1", title: "Business Model Canvas", pillar: "business", phase: "modele", definition: "Outil visuel de 9 blocs pour structurer un business model.", action: "Remplissez les 9 blocs pour votre projet.", kpi: "Blocs validés par des données terrain" },
  { id: "b2", title: "Value Proposition Canvas", pillar: "business", phase: "fondations", definition: "Aligner ce que vous offrez avec les besoins réels du client.", action: "Mappez jobs, pains, gains de votre client cible.", kpi: "Fit score proposition/besoin" },
  { id: "b3", title: "Blue Ocean Strategy", pillar: "business", phase: "modele", definition: "Créer un espace de marché sans concurrence directe.", action: "Dessinez le canevas stratégique de votre secteur.", kpi: "Facteurs différenciants uniques" },
  { id: "b4", title: "Lean Startup", pillar: "business", phase: "fondations", definition: "Build-Measure-Learn : itérer rapidement avec un MVP.", action: "Définissez votre MVP minimal et le test à lancer.", kpi: "Temps de cycle Build-Measure-Learn" },
  { id: "b5", title: "Problem-Solution Fit", pillar: "business", phase: "fondations", definition: "Valider que votre solution résout un vrai problème.", action: "Interviewez 5 clients potentiels cette semaine.", kpi: "Taux de validation du problème" },
  { id: "b6", title: "Product-Market Fit", pillar: "business", phase: "croissance", definition: "Le moment où le marché tire votre produit.", action: "Mesurez le Sean Ellis test (40% would be disappointed).", kpi: "Score PMF > 40%" },
  { id: "b7", title: "Competitive Advantage", pillar: "business", phase: "modele", definition: "Ce qui vous rend difficile à copier ou remplacer.", action: "Identifiez votre moat (réseau, coût, marque, tech).", kpi: "Durabilité de l'avantage (années)" },
  { id: "b8", title: "Platform Business", pillar: "business", phase: "croissance", definition: "Modèle créant de la valeur en connectant producteurs et consommateurs.", action: "Identifiez les 2 côtés de votre plateforme potentielle.", kpi: "Effets de réseau mesurés" },

  // INNOVATION
  { id: "i1", title: "Design Thinking", pillar: "innovation", phase: "fondations", definition: "Processus centré utilisateur : empathie, définition, idéation, proto, test.", action: "Réalisez 3 interviews empathiques cette semaine.", kpi: "Insights utilisateurs collectés" },
  { id: "i2", title: "Jobs To Be Done", pillar: "innovation", phase: "fondations", definition: "Les clients 'embauchent' un produit pour accomplir un travail.", action: "Formulez le JTBD principal de votre client.", kpi: "Clarté du job statement" },
  { id: "i3", title: "Disruptive Innovation", pillar: "innovation", phase: "modele", definition: "Innovation qui démarre en bas de marché et monte.", action: "Identifiez le segment négligé par les leaders.", kpi: "Taille du segment sous-servi" },
  { id: "i4", title: "Rapid Prototyping", pillar: "innovation", phase: "execution", definition: "Créer des prototypes rapides pour tester vite.", action: "Construisez un proto testable en 48h.", kpi: "Temps proto → feedback" },
  { id: "i5", title: "Minimum Viable Product", pillar: "innovation", phase: "fondations", definition: "Version minimale pour valider l'hypothèse clé.", action: "Réduisez votre produit au strict nécessaire pour 1 test.", kpi: "Features éliminées du scope" },
  { id: "i6", title: "10x Thinking", pillar: "innovation", phase: "croissance", definition: "Viser 10x mieux, pas 10% mieux.", action: "Reformulez votre objectif en mode 10x.", kpi: "Ambition du goal vs baseline" },

  // FINANCE
  { id: "f1", title: "Unit Economics", pillar: "finance", phase: "modele", definition: "Rentabilité par unité vendue (LTV, CAC, marge).", action: "Calculez votre LTV/CAC ratio.", kpi: "LTV/CAC > 3" },
  { id: "f2", title: "Cash Flow Management", pillar: "finance", phase: "execution", definition: "Gérer les entrées/sorties de cash pour survivre.", action: "Projetez votre runway sur 12 mois.", kpi: "Mois de runway restants" },
  { id: "f3", title: "Pricing Strategy", pillar: "finance", phase: "modele", definition: "Fixer le prix optimal entre valeur perçue et coûts.", action: "Testez 3 niveaux de prix sur votre cible.", kpi: "Conversion par niveau de prix" },
  { id: "f4", title: "Fundraising", pillar: "finance", phase: "croissance", definition: "Lever des fonds pour accélérer la croissance.", action: "Préparez un one-pager investisseur.", kpi: "Meetings investisseurs obtenus" },
  { id: "f5", title: "Break-Even Analysis", pillar: "finance", phase: "modele", definition: "Point où les revenus couvrent les coûts.", action: "Calculez votre seuil de rentabilité.", kpi: "Délai avant break-even" },
  { id: "f6", title: "Revenue Streams", pillar: "finance", phase: "fondations", definition: "Sources de revenus diversifiées.", action: "Listez 3 sources de revenus possibles.", kpi: "Nombre de streams actifs" },

  // MARKETING
  { id: "m1", title: "Brand Positioning", pillar: "marketing", phase: "fondations", definition: "La place unique que votre marque occupe dans l'esprit du client.", action: "Rédigez votre statement de positionnement.", kpi: "Rappel spontané de la marque" },
  { id: "m2", title: "Growth Hacking", pillar: "marketing", phase: "croissance", definition: "Techniques créatives et data-driven pour croître vite.", action: "Identifiez 3 canaux de growth à tester.", kpi: "Coût par acquisition par canal" },
  { id: "m3", title: "Content Marketing", pillar: "marketing", phase: "execution", definition: "Attirer par du contenu de valeur.", action: "Planifiez 4 contenus pour le mois prochain.", kpi: "Leads générés par contenu" },
  { id: "m4", title: "Funnel AARRR", pillar: "marketing", phase: "modele", definition: "Acquisition, Activation, Retention, Revenue, Referral.", action: "Mesurez votre taux à chaque étape.", kpi: "Taux de conversion par étape" },
  { id: "m5", title: "Community Building", pillar: "marketing", phase: "croissance", definition: "Construire une communauté engagée autour de votre produit.", action: "Lancez un canal communautaire (Discord, Slack...).", kpi: "Membres actifs / mois" },

  // OPERATIONS
  { id: "o1", title: "OKR Framework", pillar: "operations", phase: "execution", definition: "Objectives and Key Results pour aligner l'équipe.", action: "Définissez 3 OKR pour ce trimestre.", kpi: "Score OKR en fin de quarter" },
  { id: "o2", title: "Process Mapping", pillar: "operations", phase: "modele", definition: "Visualiser et optimiser vos processus clés.", action: "Cartographiez votre processus de vente.", kpi: "Étapes éliminées ou automatisées" },
  { id: "o3", title: "Agile Methodology", pillar: "operations", phase: "execution", definition: "Itérations courtes, feedback continu, adaptation.", action: "Mettez en place des sprints de 2 semaines.", kpi: "Vélocité de l'équipe" },
  { id: "o4", title: "Automation First", pillar: "operations", phase: "croissance", definition: "Automatiser avant d'embaucher.", action: "Identifiez 3 tâches à automatiser.", kpi: "Heures gagnées / semaine" },

  // TEAM
  { id: "te1", title: "Founding Team", pillar: "team", phase: "fondations", definition: "Construire l'équipe fondatrice complémentaire.", action: "Mappez les compétences manquantes.", kpi: "Couverture des compétences clés" },
  { id: "te2", title: "Culture Code", pillar: "team", phase: "modele", definition: "Valeurs et comportements qui définissent votre culture.", action: "Rédigez vos 5 valeurs fondatrices.", kpi: "Alignement perçu par l'équipe" },
  { id: "te3", title: "Hiring Strategy", pillar: "team", phase: "croissance", definition: "Recruter les bonnes personnes au bon moment.", action: "Définissez les 3 prochains recrutements critiques.", kpi: "Temps de recrutement moyen" },
  { id: "te4", title: "Remote Culture", pillar: "team", phase: "execution", definition: "Construire une culture forte en remote.", action: "Mettez en place des rituels d'équipe async.", kpi: "Score engagement équipe" },

  // LEGAL
  { id: "l1", title: "Structure Juridique", pillar: "legal", phase: "fondations", definition: "Choisir la bonne forme juridique (SAS, SARL, etc.).", action: "Comparez 3 statuts pour votre situation.", kpi: "Coûts structurels annuels" },
  { id: "l2", title: "Propriété Intellectuelle", pillar: "legal", phase: "modele", definition: "Protéger vos innovations et votre marque.", action: "Déposez votre marque à l'INPI.", kpi: "Assets IP protégés" },
  { id: "l3", title: "RGPD Compliance", pillar: "legal", phase: "execution", definition: "Conformité au règlement sur les données personnelles.", action: "Auditez votre collecte de données.", kpi: "Conformité RGPD (%)" },

  // GROWTH
  { id: "g1", title: "Traction Channels", pillar: "growth", phase: "modele", definition: "Les 19 canaux de traction de Gabriel Weinberg.", action: "Testez 3 canaux avec un budget minimal.", kpi: "CAC par canal testé" },
  { id: "g2", title: "Viral Loop", pillar: "growth", phase: "croissance", definition: "Mécanisme où chaque utilisateur en amène d'autres.", action: "Concevez un mécanisme de referral.", kpi: "Coefficient viral (k-factor)" },
  { id: "g3", title: "Network Effects", pillar: "growth", phase: "croissance", definition: "La valeur augmente avec chaque nouvel utilisateur.", action: "Identifiez si votre produit a des effets de réseau.", kpi: "Croissance organique %" },
  { id: "g4", title: "Scalability", pillar: "growth", phase: "croissance", definition: "Capacité à croître sans augmenter les coûts proportionnellement.", action: "Identifiez vos goulots d'étranglement de scale.", kpi: "Ratio revenu/coût à 10x" },
  { id: "g5", title: "International Expansion", pillar: "growth", phase: "execution", definition: "S'étendre à de nouveaux marchés géographiques.", action: "Évaluez 3 marchés cibles internationaux.", kpi: "Revenu international / total" },

  // IMPACT
  { id: "im1", title: "Mission Statement", pillar: "impact", phase: "fondations", definition: "Définir votre raison d'être au-delà du profit.", action: "Rédigez votre mission en une phrase.", kpi: "Clarté et mémorabilité" },
  { id: "im2", title: "Triple Bottom Line", pillar: "impact", phase: "modele", definition: "Mesurer People, Planet, Profit.", action: "Définissez un KPI pour chaque P.", kpi: "Score sur les 3 dimensions" },
  { id: "im3", title: "B Corp Certification", pillar: "impact", phase: "execution", definition: "Certification d'entreprise à impact.", action: "Faites le B Impact Assessment.", kpi: "Score B Corp" },
  { id: "im4", title: "Stakeholder Mapping", pillar: "impact", phase: "fondations", definition: "Identifier et prioriser toutes vos parties prenantes.", action: "Créez une matrice pouvoir/intérêt.", kpi: "Parties prenantes activement gérées" },
];

export function getCardsByPillar(pillarId: PillarId): StrategyCard[] {
  return cards.filter(c => c.pillar === pillarId);
}

export function getCardsByPhase(phaseId: PhaseId): StrategyCard[] {
  return cards.filter(c => c.phase === phaseId);
}

export function searchCards(query: string): StrategyCard[] {
  const q = query.toLowerCase();
  return cards.filter(c =>
    c.title.toLowerCase().includes(q) ||
    c.definition.toLowerCase().includes(q) ||
    c.pillar.toLowerCase().includes(q)
  );
}
