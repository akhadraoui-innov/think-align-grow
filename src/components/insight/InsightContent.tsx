import { useState } from "react";
import { cn } from "@/lib/utils";
import {
  BookOpen, Sparkles, Users, LayoutGrid, Zap, Shield,
  Brain, Target, Award, BarChart3, Layers, Lightbulb,
  Code, Palette, FileText, MessageSquare, TrendingUp,
  CheckCircle2, ArrowRight, Star, Rocket, Eye
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface InsightContentProps {
  activeSection: string;
}

/* ─── Pain Point Card ─── */
function PainCard({ icon: Icon, title, desc }: { icon: any; title: string; desc: string }) {
  return (
    <Card className="border-destructive/20 bg-destructive/5">
      <CardContent className="p-5 flex gap-4 items-start">
        <div className="h-10 w-10 rounded-xl bg-destructive/10 flex items-center justify-center shrink-0">
          <Icon className="h-5 w-5 text-destructive" />
        </div>
        <div>
          <p className="font-bold text-sm text-foreground">{title}</p>
          <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{desc}</p>
        </div>
      </CardContent>
    </Card>
  );
}

/* ─── Feature Card ─── */
function FeatureCard({ icon: Icon, title, desc, badges }: { icon: any; title: string; desc: string; badges?: string[] }) {
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-5">
        <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center mb-3">
          <Icon className="h-5 w-5 text-primary" />
        </div>
        <p className="font-bold text-sm text-foreground">{title}</p>
        <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">{desc}</p>
        {badges && (
          <div className="flex flex-wrap gap-1.5 mt-3">
            {badges.map(b => (
              <Badge key={b} variant="secondary" className="text-[10px] font-semibold">{b}</Badge>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/* ─── Value Proposition Card ─── */
function ValueProp({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-xl border-l-4 border-primary bg-primary/5 p-6 my-8">
      <div className="flex items-center gap-2 mb-2">
        <Lightbulb className="h-5 w-5 text-primary" />
        <span className="text-xs font-bold uppercase tracking-widest text-primary">Proposition de valeur</span>
      </div>
      <div className="text-sm text-foreground leading-relaxed">{children}</div>
    </div>
  );
}

/* ─── Section Hero ─── */
function SectionHero({ icon: Icon, title, subtitle, pain }: { icon: any; title: string; subtitle: string; pain: string }) {
  return (
    <div className="mb-10">
      <div className="flex items-center gap-4 mb-4">
        <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center shadow-lg">
          <Icon className="h-7 w-7 text-primary-foreground" />
        </div>
        <div>
          <h2 className="text-2xl font-black text-foreground tracking-tight">{title}</h2>
          <p className="text-sm text-muted-foreground font-medium">{subtitle}</p>
        </div>
      </div>
      <div className="rounded-lg bg-muted/50 border border-border/50 p-4 flex items-start gap-3">
        <Target className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
        <p className="text-sm text-muted-foreground italic leading-relaxed">{pain}</p>
      </div>
    </div>
  );
}

/* ─── Workflow Step ─── */
function WorkflowStep({ step, title, desc, isLast }: { step: number; title: string; desc: string; isLast?: boolean }) {
  return (
    <div className="flex gap-4 items-start">
      <div className="flex flex-col items-center">
        <div className="h-8 w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">{step}</div>
        {!isLast && <div className="w-px h-8 bg-border" />}
      </div>
      <div className="pb-4">
        <p className="font-bold text-sm text-foreground">{title}</p>
        <p className="text-xs text-muted-foreground mt-0.5">{desc}</p>
      </div>
    </div>
  );
}

/* ═══════════════════════════════ SECTIONS ═══════════════════════════════ */

function OverviewSection() {
  return (
    <div>
      <SectionHero
        icon={Rocket}
        title="GROWTHINNOV"
        subtitle="La plateforme d'accélération des compétences stratégiques par l'IA"
        pain="Les entreprises investissent massivement en formation mais peinent à mesurer l'impact réel sur les compétences opérationnelles et la transformation de leurs équipes."
      />

      <h3 className="text-lg font-bold text-foreground mb-4">Les 4 piliers de l'expérience</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        <FeatureCard icon={BookOpen} title="Formations adaptatives" desc="Parcours personnalisés par fonction et persona, avec IA tutor intégrée à chaque étape d'apprentissage." badges={["IA Tutor", "Certificats"]} />
        <FeatureCard icon={Sparkles} title="Mise en pratique IA" desc="Simulateur avec 7 modes (analyse, design, code, document...) pour appliquer les acquis dans des scénarios réalistes." badges={["7 modes", "Scoring"]} />
        <FeatureCard icon={Users} title="Intelligence collective" desc="Workshops collaboratifs avec canevas interactif, cartes stratégiques et gamification pour co-construire." badges={["Temps réel", "Gamification"]} />
        <FeatureCard icon={LayoutGrid} title="Consulting autonome" desc="Challenges de Design Innovation pour un diagnostic stratégique structuré avec analyse IA automatique." badges={["Diagnostic", "Analyse IA"]} />
      </div>

      <h3 className="text-lg font-bold text-foreground mb-4">Workflow global</h3>
      <div className="ml-2">
        <WorkflowStep step={1} title="Paramétrage intelligent" desc="L'administrateur configure fonctions, personae, parcours et compétences — l'IA génère et enrichit automatiquement." />
        <WorkflowStep step={2} title="Apprentissage immersif" desc="L'apprenant progresse à travers leçons, quiz, exercices et pratiques IA avec feedback personnalisé en temps réel." />
        <WorkflowStep step={3} title="Application concrète" desc="Simulateur IA et workshops collaboratifs pour ancrer les compétences dans des situations professionnelles." />
        <WorkflowStep step={4} title="Évaluation & certification" desc="Scoring automatique, évaluation par compétences, certificat vérifiable et livret de cours complet." isLast />
      </div>

      <ValueProp>
        <strong>GROWTHINNOV</strong> combine la puissance de l'IA générative, la gamification et l'intelligence collective pour transformer chaque formation en une expérience mesurable et engageante — du paramétrage à la certification.
      </ValueProp>
    </div>
  );
}

function FormationsSection() {
  return (
    <div>
      <SectionHero
        icon={BookOpen}
        title="Formations"
        subtitle="Parcours adaptatifs avec IA intégrée à chaque étape"
        pain="Les formations traditionnelles sont génériques, déconnectées du métier et ne produisent aucune trace des acquis exploitable par l'entreprise."
      />

      <h3 className="text-lg font-bold text-foreground mb-4">Les problèmes que nous résolvons</h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <PainCard icon={Target} title="Contenu générique" desc="Les formations ne sont pas adaptées aux fonctions, au secteur ni au niveau de séniorité de l'apprenant." />
        <PainCard icon={Eye} title="Pas de suivi granulaire" desc="Impossible de savoir ce que chaque apprenant a réellement compris, retenu ou produit." />
        <PainCard icon={TrendingUp} title="Aucun livrable post-formation" desc="L'apprenant repart sans document de restitution, ni évaluation détaillée de ses compétences." />
      </div>

      <h3 className="text-lg font-bold text-foreground mb-4">Types de modules pédagogiques</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        <FeatureCard icon={FileText} title="Leçon interactive" desc="Contenu Markdown enrichi avec callouts, tableaux comparatifs, illustrations. L'IA personnalise le brief d'introduction." badges={["Markdown Pro", "IA Brief"]} />
        <FeatureCard icon={CheckCircle2} title="Quiz évalué" desc="Questions à choix multiples avec scoring, explication IA par question et persistance des réponses." badges={["Scoring", "Feedback IA"]} />
        <FeatureCard icon={Code} title="Exercice pratique" desc="Production libre de l'apprenant avec évaluation IA selon une grille de critères configurable." badges={["IA Évaluation", "Critères"]} />
        <FeatureCard icon={MessageSquare} title="Pratique IA conversationnelle" desc="Mise en situation avec un agent IA spécialisé (négociation, coaching, analyse). Évaluation multidimensionnelle." badges={["Roleplay IA", "Multi-dimensions"]} />
      </div>

      <h3 className="text-lg font-bold text-foreground mb-4">IA intégrée à l'apprentissage</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        <FeatureCard icon={Brain} title="Knowledge Brief" desc="À l'ouverture du module, l'IA génère un brief personnalisé basé sur le profil de l'apprenant et ses acquis précédents." badges={["Auto-généré", "Personnalisé"]} />
        <FeatureCard icon={Sparkles} title="Analyse post-module" desc="Après chaque module complété, une analyse IA détaillée des performances avec recommandations concrètes." badges={["Persistant", "Actionnable"]} />
        <FeatureCard icon={BarChart3} title="Évaluation globale" desc="À la fin du parcours, évaluation complète par compétence avec scores, points forts et axes d'amélioration." badges={["Certificat", "Compétences"]} />
        <FeatureCard icon={FileText} title="Livret de cours PDF" desc="Document de restitution complet (4-8 pages) avec tout le contenu, les exercices et les annotations — envoyé par email." badges={["PDF", "Email"]} />
      </div>

      <ValueProp>
        Chaque interaction est <strong>persistée et exploitée par l'IA</strong> pour personnaliser le feedback. L'apprenant repart avec un livret complet, une évaluation détaillée et un certificat vérifiable. L'organisation dispose d'un suivi granulaire par compétence.
      </ValueProp>
    </div>
  );
}

function PratiqueSection() {
  return (
    <div>
      <SectionHero
        icon={Sparkles}
        title="Mise en pratique"
        subtitle="Simulateur IA avec 7 modes d'entraînement professionnel"
        pain="La théorie ne suffit pas. Sans mise en pratique encadrée, les compétences ne s'ancrent pas et ne se transfèrent pas en situation réelle."
      />

      <h3 className="text-lg font-bold text-foreground mb-4">Les problèmes que nous résolvons</h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <PainCard icon={Target} title="Pas de terrain d'entraînement" desc="Les collaborateurs n'ont aucun espace sécurisé pour s'exercer avant d'appliquer en réel." />
        <PainCard icon={BarChart3} title="Pas de mesure objective" desc="Impossible de scorer objectivement une analyse stratégique ou un livrable de consulting." />
        <PainCard icon={TrendingUp} title="Feedback tardif" desc="Le retour formateur arrive trop tard, sans données objectives sur la performance." />
      </div>

      <h3 className="text-lg font-bold text-foreground mb-4">7 modes de simulation</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        <FeatureCard icon={BarChart3} title="Analyse" desc="Analyser des données, identifier des patterns et formuler des recommandations stratégiques." badges={["KPIs", "Data"]} />
        <FeatureCard icon={Palette} title="Design" desc="Concevoir des solutions, prototyper des approches et structurer des livrables créatifs." badges={["Créativité", "UX"]} />
        <FeatureCard icon={Code} title="Code" desc="Écrire et déboguer du code dans un éditeur intégré avec validation IA." badges={["Éditeur", "Debug"]} />
        <FeatureCard icon={FileText} title="Document" desc="Rédiger des documents professionnels (rapports, présentations, notes stratégiques)." badges={["Rédaction", "Templates"]} />
        <FeatureCard icon={MessageSquare} title="Chat" desc="Dialogue libre avec l'IA pour explorer un sujet, brainstormer ou approfondir." badges={["Conversationnel"]} />
        <FeatureCard icon={CheckCircle2} title="Évaluation" desc="QCM et questions ouvertes avec scoring automatique et feedback détaillé." badges={["Scoring", "Feedback"]} />
        <FeatureCard icon={Target} title="Décision" desc="Arbre décisionnel interactif avec conséquences, tensions et scoring de pertinence." badges={["Timeline", "Impact"]} />
      </div>

      <h3 className="text-lg font-bold text-foreground mb-4">Fonctionnalités clés</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        <FeatureCard icon={Zap} title="Scoring intelligent" desc="Score global, qualité d'input, jauge de tension et révélation progressive du résultat." badges={["Gamification"]} />
        <FeatureCard icon={BarChart3} title="Rapports détaillés" desc="Après chaque session : radar de compétences, timeline des décisions, suggestions d'amélioration." badges={["Radar", "Export"]} />
      </div>

      <ValueProp>
        Le simulateur offre un <strong>terrain d'entraînement professionnel sécurisé</strong> où chaque action est mesurée. L'apprenant développe ses compétences par la pratique répétée avec un feedback IA instantané et objectif.
      </ValueProp>
    </div>
  );
}

function WorkshopsSection() {
  return (
    <div>
      <SectionHero
        icon={Users}
        title="Workshops"
        subtitle="Intelligence collective et canevas collaboratif gamifié"
        pain="Les ateliers collaboratifs manquent de structure, produisent peu de livrables exploitables et ne valorisent pas la contribution individuelle."
      />

      <h3 className="text-lg font-bold text-foreground mb-4">Les problèmes que nous résolvons</h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <PainCard icon={Users} title="Ateliers improductifs" desc="Réunions sans structure, dominées par quelques voix, sans trace des décisions ni des contributions." />
        <PainCard icon={Layers} title="Méthodologies complexes" desc="Les frameworks stratégiques (BMC, SWOT, Value Chain) restent sur papier sans exploitation digitale." />
        <PainCard icon={Star} title="Pas d'engagement" desc="Les participants ne voient pas la valeur de leur contribution ni l'impact collectif." />
      </div>

      <h3 className="text-lg font-bold text-foreground mb-4">Fonctionnalités</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        <FeatureCard icon={Layers} title="Toolkits stratégiques" desc="Bibliothèque de méthodologies avec cartes, piliers, phases et plans de jeu — chaque toolkit est un univers complet." badges={["Cartes", "Piliers", "Phases"]} />
        <FeatureCard icon={LayoutGrid} title="Canevas collaboratif" desc="Espace de travail temps réel : cards, sticky notes, textes, icônes, flèches, groupes — comme un Miro stratégique." badges={["Temps réel", "Drag & Drop"]} />
        <FeatureCard icon={Star} title="Gamification" desc="Système de points (valorisation), niveaux de difficulté, badges et classement pour engager les participants." badges={["Points", "Badges"]} />
        <FeatureCard icon={Brain} title="IA Coach" desc="Assistant IA contextuel qui guide, challenge et enrichit les discussions du workshop en temps réel." badges={["Contextuel", "Temps réel"]} />
      </div>

      <ValueProp>
        Les workshops GROWTHINNOV transforment chaque session collaborative en une <strong>expérience structurée, gamifiée et documentée</strong> où chaque contribution compte et chaque décision est traçable.
      </ValueProp>
    </div>
  );
}

function ChallengesSection() {
  return (
    <div>
      <SectionHero
        icon={LayoutGrid}
        title="Challenges"
        subtitle="Design Innovation et diagnostic stratégique autonome"
        pain="Les diagnostics stratégiques sont longs, coûteux et dépendent entièrement de consultants externes sans transfert de compétence."
      />

      <h3 className="text-lg font-bold text-foreground mb-4">Les problèmes que nous résolvons</h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <PainCard icon={Target} title="Diagnostic inaccessible" desc="Les PME et ETI n'ont pas les moyens d'engager des cabinets de conseil pour chaque décision stratégique." />
        <PainCard icon={BarChart3} title="Pas de benchmark" desc="Impossible de comparer sa maturité sur un sujet avec des standards ou d'autres organisations." />
        <PainCard icon={Brain} title="Analyse subjective" desc="Les diagnostics reposent sur l'intuition sans données structurées ni méthodologie reproductible." />
      </div>

      <h3 className="text-lg font-bold text-foreground mb-4">Comment ça marche</h3>
      <div className="ml-2 mb-8">
        <WorkflowStep step={1} title="Choisir un template de challenge" desc="Sélectionner un sujet stratégique parmi les templates disponibles (ex: Maturité IA, Transformation Digitale)." />
        <WorkflowStep step={2} title="Sélectionner et placer les cartes" desc="Choisir les cartes stratégiques pertinentes, les ranger par priorité dans les slots du board." />
        <WorkflowStep step={3} title="Évaluer la maturité" desc="Pour chaque carte placée, évaluer le niveau de maturité actuel de l'organisation (1-5)." />
        <WorkflowStep step={4} title="Analyse IA automatique" desc="L'IA analyse les choix, la cohérence, les gaps et génère un rapport stratégique détaillé." isLast />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        <FeatureCard icon={LayoutGrid} title="Board interactif" desc="Interface drag & drop avec zones de staging, slots nommés et contraintes configurables par sujet." badges={["Drag & Drop", "Configurable"]} />
        <FeatureCard icon={Brain} title="Analyse IA" desc="Rapport automatique avec score de maturité, identification des gaps, recommandations priorisées et plan d'action." badges={["Score", "Recommandations"]} />
      </div>

      <ValueProp>
        Les challenges permettent à <strong>n'importe quelle équipe de réaliser un diagnostic stratégique structuré</strong> en autonomie, avec une analyse IA qui rivalise avec un audit de consulting — en une fraction du temps et du coût.
      </ValueProp>
    </div>
  );
}

function PlateformeSection() {
  return (
    <div>
      <SectionHero
        icon={Shield}
        title="Plateforme"
        subtitle="Administration, observabilité et IA de génération"
        pain="Les plateformes de formation sont des silos : pas de vision 360°, pas de personnalisation avancée, pas d'outillage IA pour les administrateurs."
      />

      <h3 className="text-lg font-bold text-foreground mb-4">Les problèmes que nous résolvons</h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <PainCard icon={Eye} title="Pas de visibilité" desc="Les responsables formation n'ont pas de vue consolidée sur l'activité, les compétences et le ROI." />
        <PainCard icon={Zap} title="Paramétrage laborieux" desc="Créer un parcours complet (modules, quiz, exercices) prend des semaines de travail manuel." />
        <PainCard icon={Shield} title="Pas de gouvernance" desc="Gestion des droits, rôles et accès insuffisante pour les organisations multi-équipes." />
      </div>

      <h3 className="text-lg font-bold text-foreground mb-4">Portail immersif</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        <FeatureCard icon={Rocket} title="Expérience apprenant" desc="Interface dédiée avec navigation par module (Formations, Pratique, Workshops, Challenges) et branding organisation." badges={["White-label", "Responsive"]} />
        <FeatureCard icon={Award} title="Certifications vérifiables" desc="Certificats avec QR code, vérification publique, partage LinkedIn et historique complet." badges={["QR Code", "LinkedIn"]} />
      </div>

      <h3 className="text-lg font-bold text-foreground mb-4">Administration & IA</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        <FeatureCard icon={Brain} title="IA de génération" desc="Génération automatique de parcours, modules, quiz, exercices et pratiques IA à partir d'une description métier." badges={["GPT", "Gemini", "Batch"]} />
        <FeatureCard icon={BarChart3} title="Observabilité" desc="Dashboard temps réel, catalogue d'assets, matrice de couverture compétences × fonctions." badges={["Analytics", "Temps réel"]} />
        <FeatureCard icon={Shield} title="Rôles & permissions" desc="Système granulaire de permissions par rôle (admin, manager, formateur, apprenant) avec audit trail." badges={["RBAC", "Audit"]} />
        <FeatureCard icon={Zap} title="Crédits & facturation" desc="Système de crédits pour les fonctionnalités IA, avec suivi de consommation et plans d'abonnement." badges={["Crédits", "Plans"]} />
      </div>

      <ValueProp>
        GROWTHINNOV offre une <strong>plateforme complète</strong> qui combine la puissance d'administration d'un LMS enterprise avec l'intelligence de l'IA générative — le tout dans une expérience utilisateur premium que vos équipes voudront réellement utiliser.
      </ValueProp>
    </div>
  );
}

/* ═══════════════════════════════ MAIN ═══════════════════════════════ */

const SECTIONS: Record<string, () => JSX.Element> = {
  overview: OverviewSection,
  formations: FormationsSection,
  pratique: PratiqueSection,
  workshops: WorkshopsSection,
  challenges: ChallengesSection,
  plateforme: PlateformeSection,
};

export function InsightContent({ activeSection }: InsightContentProps) {
  const Section = SECTIONS[activeSection] || OverviewSection;
  return (
    <div className="max-w-4xl mx-auto px-6 py-8">
      <Section />
    </div>
  );
}
