import { useState } from "react";
import { cn } from "@/lib/utils";
import {
  BookOpen, Sparkles, Users, LayoutGrid, Zap, Shield,
  Brain, Target, Award, BarChart3, Layers, Lightbulb,
  Code, Palette, FileText, MessageSquare, TrendingUp,
  CheckCircle2, ArrowRight, Star, Rocket, Eye, Compass,
  Handshake, DollarSign, Clock, HeartHandshake, Building2,
  GraduationCap, Puzzle, Globe, Repeat, ShieldCheck,
  Briefcase, ChevronDown, UserCheck, Settings, Workflow,
  PenTool, Cpu, ClipboardCheck, MonitorPlay, Network
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { PlatformFlow } from "./PlatformFlow";

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

/* ─── Business Workflow Step ─── */
interface BWorkflowStep {
  title: string;
  desc: string;
  layer: "learner" | "ai" | "admin";
  tools?: string[];
  actors?: string[];
  aiRole?: string;
}

const LAYER_BADGE: Record<string, { label: string; className: string }> = {
  learner: { label: "Apprenant", className: "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/30" },
  ai: { label: "IA", className: "bg-violet-500/10 text-violet-700 dark:text-violet-400 border-violet-500/30" },
  admin: { label: "Admin", className: "bg-orange-500/10 text-orange-700 dark:text-orange-400 border-orange-500/30" },
};

const LAYER_COLORS: Record<string, string> = {
  learner: "bg-blue-500",
  ai: "bg-violet-500",
  admin: "bg-orange-500",
};

function BusinessWorkflow({ icon: Icon, title, subtitle, steps }: { icon: any; title: string; subtitle: string; steps: BWorkflowStep[] }) {
  const [expanded, setExpanded] = useState<number | null>(null);
  return (
    <Card className="overflow-hidden">
      <CardContent className="p-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
            <Icon className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h4 className="font-bold text-foreground">{title}</h4>
            <p className="text-xs text-muted-foreground">{subtitle}</p>
          </div>
        </div>

        {/* Horizontal flow */}
        <div className="flex items-start gap-0 overflow-x-auto py-6 px-2">
          {steps.map((s, i) => (
            <div key={i} className="flex items-start shrink-0">
              {/* Step */}
              <button
                onClick={() => setExpanded(expanded === i ? null : i)}
                className={cn(
                  "flex flex-col items-center text-center w-28 group cursor-pointer transition-all",
                  expanded === i && "scale-105"
                )}
              >
                <div className={cn(
                  "h-10 w-10 rounded-full flex items-center justify-center text-sm font-bold text-white shadow-md transition-all",
                  LAYER_COLORS[s.layer],
                  expanded === i && "ring-4 ring-primary/20"
                )}>
                  {i + 1}
                </div>
                <p className="text-[11px] font-semibold text-foreground mt-2 leading-tight">{s.title}</p>
                <Badge variant="outline" className={cn("text-[9px] mt-1.5 px-1.5 py-0", LAYER_BADGE[s.layer].className)}>
                  {LAYER_BADGE[s.layer].label}
                </Badge>
              </button>
              {/* Arrow */}
              {i < steps.length - 1 && (
                <div className="flex items-center pt-4 px-1 shrink-0">
                  <div className="w-8 h-px bg-border" />
                  <ArrowRight className="h-3.5 w-3.5 text-muted-foreground/50 -ml-1" />
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Expanded detail */}
        {expanded !== null && (
          <div className="rounded-xl border bg-muted/30 p-5 animate-in fade-in-50 slide-in-from-top-2 duration-200">
            <div className="flex items-center gap-2 mb-3">
              <div className={cn("h-6 w-6 rounded-full flex items-center justify-center text-xs font-bold text-white", LAYER_COLORS[steps[expanded].layer])}>
                {expanded + 1}
              </div>
              <h5 className="font-bold text-sm text-foreground">{steps[expanded].title}</h5>
              <Badge variant="outline" className={cn("text-[9px] ml-auto", LAYER_BADGE[steps[expanded].layer].className)}>
                {LAYER_BADGE[steps[expanded].layer].label}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed mb-4">{steps[expanded].desc}</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {steps[expanded].actors && (
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1.5">Acteurs</p>
                  <div className="flex flex-wrap gap-1.5">
                    {steps[expanded].actors!.map(a => <Badge key={a} variant="secondary" className="text-[10px]">{a}</Badge>)}
                  </div>
                </div>
              )}
              {steps[expanded].tools && (
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1.5">Outils</p>
                  <div className="flex flex-wrap gap-1.5">
                    {steps[expanded].tools!.map(t => <Badge key={t} variant="outline" className="text-[10px]">{t}</Badge>)}
                  </div>
                </div>
              )}
              {steps[expanded].aiRole && (
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1.5">Rôle de l'IA</p>
                  <p className="text-xs text-violet-600 dark:text-violet-400 font-medium">{steps[expanded].aiRole}</p>
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/* ─── Domain Card (Métier tab) ─── */
function DomainCard({ icon: Icon, title, gradient, painPoints, solutions, kpis, workflow }: {
  icon: any; title: string; gradient: string;
  painPoints: string[]; solutions: string[]; kpis: { value: string; label: string }[];
  workflow: string[];
}) {
  const [open, setOpen] = useState(false);
  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <Card className="overflow-hidden transition-shadow hover:shadow-md">
        <CollapsibleTrigger className="w-full text-left">
          <CardContent className="p-6 flex items-center gap-4">
            <div className={cn("h-12 w-12 rounded-2xl bg-gradient-to-br flex items-center justify-center shadow-md shrink-0", gradient)}>
              <Icon className="h-6 w-6 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="font-bold text-foreground">{title}</h4>
              <p className="text-xs text-muted-foreground mt-0.5 truncate">{painPoints[0]}</p>
            </div>
            <ChevronDown className={cn("h-5 w-5 text-muted-foreground transition-transform shrink-0", open && "rotate-180")} />
          </CardContent>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="px-6 pb-6 space-y-5 border-t border-border/30 pt-5">
            {/* Pain points */}
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-destructive mb-2">Problématiques</p>
              <div className="space-y-2">
                {painPoints.map(p => (
                  <div key={p} className="flex items-start gap-2">
                    <Target className="h-3.5 w-3.5 text-destructive shrink-0 mt-0.5" />
                    <span className="text-xs text-muted-foreground">{p}</span>
                  </div>
                ))}
              </div>
            </div>
            {/* Solutions */}
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-primary mb-2">Solutions GROWTHINNOV</p>
              <div className="space-y-2">
                {solutions.map(s => (
                  <div key={s} className="flex items-start gap-2">
                    <CheckCircle2 className="h-3.5 w-3.5 text-primary shrink-0 mt-0.5" />
                    <span className="text-xs text-foreground/80">{s}</span>
                  </div>
                ))}
              </div>
            </div>
            {/* KPIs */}
            <div className="grid grid-cols-3 gap-3">
              {kpis.map(k => (
                <div key={k.label} className="rounded-xl border bg-muted/30 p-3 text-center">
                  <p className="text-lg font-black text-foreground">{k.value}</p>
                  <p className="text-[10px] text-muted-foreground font-medium mt-0.5">{k.label}</p>
                </div>
              ))}
            </div>
            {/* Workflow */}
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2">Workflow simplifié</p>
              <div className="flex flex-wrap items-center gap-1.5">
                {workflow.map((w, i) => (
                  <span key={i} className="flex items-center gap-1.5">
                    <Badge variant="secondary" className="text-[10px] font-semibold">{w}</Badge>
                    {i < workflow.length - 1 && <ArrowRight className="h-3 w-3 text-muted-foreground/40" />}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}

/* ═══════════════ WORKFLOW DATA ═══════════════ */

const BUSINESS_WORKFLOWS = [
  {
    icon: UserCheck,
    title: "Flux Onboarding Apprenant",
    subtitle: "De l'inscription à la certification",
    steps: [
      { title: "Inscription", desc: "L'apprenant s'inscrit et complète son profil professionnel (fonction, secteur, séniorité). L'organisation peut provisionner via SSO.", layer: "learner" as const, actors: ["Apprenant", "RH"], tools: ["SSO", "Profil"], aiRole: undefined },
      { title: "Profil IA", desc: "L'IA analyse le profil pour personnaliser les recommandations de parcours, le niveau de difficulté et le style pédagogique.", layer: "ai" as const, actors: ["IA Tutor"], tools: ["Profil", "Fonctions"], aiRole: "Personnalisation automatique du parcours" },
      { title: "Parcours suggéré", desc: "L'apprenant découvre les parcours recommandés basés sur sa fonction et ses objectifs. Il peut s'inscrire en un clic.", layer: "learner" as const, actors: ["Apprenant"], tools: ["Catalogue", "Enrollment"], aiRole: undefined },
      { title: "Apprentissage", desc: "Progression module par module : leçons, quiz, exercices, pratiques IA. Chaque interaction est trackée et évaluée.", layer: "learner" as const, actors: ["Apprenant", "IA Tutor"], tools: ["Modules", "Quiz", "Exercices"], aiRole: "Feedback temps réel et brief personnalisé" },
      { title: "Certification", desc: "Évaluation finale par compétence, génération du certificat vérifiable (QR code) et envoi du livret de cours complet par email.", layer: "ai" as const, actors: ["IA Évaluation"], tools: ["Certificat", "PDF", "Email"], aiRole: "Évaluation globale et génération du livret" },
    ],
  },
  {
    icon: Settings,
    title: "Flux Création de Contenu",
    subtitle: "Du brief métier à la publication",
    steps: [
      { title: "Brief métier", desc: "L'administrateur définit la fonction cible, les compétences visées et le contexte sectoriel. Il peut s'appuyer sur les personae existants.", layer: "admin" as const, actors: ["Admin", "Formateur"], tools: ["Fonctions", "Personae"], aiRole: undefined },
      { title: "Génération IA", desc: "L'IA crée automatiquement le parcours complet : modules, leçons, quiz, exercices et pratiques conversationnelles.", layer: "ai" as const, actors: ["IA Génération"], tools: ["GPT", "Gemini", "Batch"], aiRole: "Génération complète du parcours en quelques minutes" },
      { title: "Review & enrichissement", desc: "L'administrateur review, ajuste et enrichit chaque élément. Il peut régénérer individuellement chaque composant.", layer: "admin" as const, actors: ["Admin"], tools: ["Éditeur", "Preview"], aiRole: undefined },
      { title: "Publication", desc: "Le parcours est publié et disponible pour les apprenants. Les campagnes peuvent cibler des groupes spécifiques.", layer: "admin" as const, actors: ["Admin"], tools: ["Campagnes", "Ciblage"], aiRole: undefined },
      { title: "Analytics", desc: "Suivi temps réel de l'adoption, des scores et de la progression. Matrice de couverture compétences × fonctions.", layer: "admin" as const, actors: ["Admin", "Manager"], tools: ["Dashboard", "Observabilité"], aiRole: "Insights automatiques sur les performances" },
    ],
  },
  {
    icon: ClipboardCheck,
    title: "Flux Évaluation Complète",
    subtitle: "Du quiz au certificat vérifiable",
    steps: [
      { title: "Quiz", desc: "QCM avec scoring automatique, feedback par question et explication IA. Les réponses sont persistées pour analyse.", layer: "learner" as const, actors: ["Apprenant"], tools: ["QCM", "Scoring"], aiRole: "Feedback et explication par question" },
      { title: "Exercice", desc: "Production libre de l'apprenant évaluée par l'IA selon une grille de critères configurable par le formateur.", layer: "ai" as const, actors: ["Apprenant", "IA"], tools: ["Éditeur", "Grille"], aiRole: "Évaluation multicritère automatique" },
      { title: "Pratique IA", desc: "Mise en situation conversationnelle avec évaluation multidimensionnelle (pertinence, profondeur, créativité).", layer: "ai" as const, actors: ["Apprenant", "IA Agent"], tools: ["Simulateur", "Phases"], aiRole: "Agent conversationnel + évaluation fine" },
      { title: "Score compétences", desc: "Agrégation de tous les scores en un profil de compétences détaillé avec niveaux initial et final.", layer: "ai" as const, actors: ["IA Évaluation"], tools: ["Skills", "Radar"], aiRole: "Calcul du profil de compétences" },
      { title: "Certificat", desc: "Génération du certificat vérifiable avec QR code, lien LinkedIn, et livret PDF envoyé par email.", layer: "ai" as const, actors: ["Système"], tools: ["QR Code", "PDF", "Email"], aiRole: "Génération et envoi automatique" },
    ],
  },
  {
    icon: MonitorPlay,
    title: "Flux Workshop Collaboratif",
    subtitle: "De la préparation à la synthèse IA",
    steps: [
      { title: "Sélection toolkit", desc: "Le facilitateur choisit un toolkit stratégique (BMC, SWOT, Value Chain...) et configure le workshop.", layer: "admin" as const, actors: ["Facilitateur"], tools: ["Toolkits", "Cartes"], aiRole: undefined },
      { title: "Invitation", desc: "Les participants sont invités par lien ou provisionnés. Le workshop peut être temps réel ou asynchrone.", layer: "admin" as const, actors: ["Facilitateur"], tools: ["Invitations", "QR"], aiRole: undefined },
      { title: "Canevas live", desc: "Collaboration temps réel sur le canevas : placement de cartes, sticky notes, discussions, annotations.", layer: "learner" as const, actors: ["Participants", "Facilitateur"], tools: ["Canevas", "Drag & Drop"], aiRole: "Coach IA contextuel" },
      { title: "Scoring", desc: "Gamification : points de valorisation par carte, niveaux de difficulté, classement des contributions.", layer: "learner" as const, actors: ["Système"], tools: ["Points", "Badges"], aiRole: undefined },
      { title: "Synthèse IA", desc: "L'IA analyse l'ensemble des contributions et génère un rapport de synthèse avec recommandations stratégiques.", layer: "ai" as const, actors: ["IA Coach"], tools: ["Analyse", "Rapport"], aiRole: "Synthèse automatique et recommandations" },
    ],
  },
];

const DOMAIN_CARDS = [
  {
    icon: GraduationCap,
    title: "RH & Formation",
    gradient: "from-blue-500 to-blue-700",
    painPoints: [
      "Les formations IA ne sont pas adaptées aux fonctions métier de l'entreprise",
      "Impossible de mesurer l'acquisition réelle de compétences après une formation",
      "Aucun livrable exploitable ne sort des sessions de formation traditionnelles",
    ],
    solutions: [
      "Parcours adaptatifs par fonction avec IA tutor personnalisée",
      "Évaluation granulaire par compétence avec radar et profil d'acquisition",
      "Livret de cours PDF complet, certificat vérifiable et cartographie des skills",
    ],
    kpis: [
      { value: "×3", label: "Vitesse d'upskilling" },
      { value: "92%", label: "Taux de complétion" },
      { value: "-70%", label: "Temps de conception" },
    ],
    workflow: ["Fonction cible", "Génération IA", "Parcours", "Certification", "Cartographie"],
  },
  {
    icon: Briefcase,
    title: "Consulting & Stratégie",
    gradient: "from-orange-500 to-orange-700",
    painPoints: [
      "Les diagnostics stratégiques sont coûteux et dépendent de consultants externes",
      "Pas de méthodologie reproductible pour évaluer la maturité sur un sujet",
      "Les équipes ne savent pas passer de l'analyse à l'action concrète",
    ],
    solutions: [
      "Challenges de Design Innovation avec diagnostic en autonomie et analyse IA",
      "Évaluation de maturité structurée avec benchmark et recommandations",
      "Plan d'action généré automatiquement avec priorisation IA",
    ],
    kpis: [
      { value: "×5", label: "ROI vs consulting" },
      { value: "48h", label: "Diagnostic complet" },
      { value: "100%", label: "Autonomie équipe" },
    ],
    workflow: ["Template challenge", "Cartes stratégiques", "Maturité", "Analyse IA", "Plan d'action"],
  },
  {
    icon: Lightbulb,
    title: "Innovation & Produit",
    gradient: "from-violet-500 to-violet-700",
    painPoints: [
      "Les ateliers d'idéation sont peu structurés et ne produisent pas de livrables",
      "Le design thinking reste théorique sans outil d'application concret",
      "L'engagement des participants chute après les premières sessions",
    ],
    solutions: [
      "Workshops gamifiés avec toolkits stratégiques et canevas collaboratif temps réel",
      "Application concrète du design thinking via les cartes et les challenges",
      "Gamification avec points, badges et classement pour maintenir l'engagement",
    ],
    kpis: [
      { value: "+85%", label: "Engagement" },
      { value: "×4", label: "Idées actionnables" },
      { value: "100%", label: "Traçabilité" },
    ],
    workflow: ["Toolkit", "Workshop live", "Ideation", "Scoring", "Synthèse IA"],
  },
  {
    icon: Users,
    title: "Management & Leadership",
    gradient: "from-emerald-500 to-emerald-700",
    painPoints: [
      "Les managers manquent d'outils pour animer des ateliers stratégiques avec leurs équipes",
      "Le feedback sur les compétences des collaborateurs est subjectif et non documenté",
      "Pas de méthode pour accompagner la montée en compétences individualisée",
    ],
    solutions: [
      "Ateliers d'équipe structurés avec le simulateur et les workshops collaboratifs",
      "Évaluation objective par compétence avec l'IA et profils individuels",
      "Parcours personnalisés par persona avec suivi granulaire et recommandations IA",
    ],
    kpis: [
      { value: "+60%", label: "Productivité ateliers" },
      { value: "360°", label: "Vue compétences" },
      { value: "×2", label: "Rétention talents" },
    ],
    workflow: ["Profil équipe", "Parcours ciblés", "Pratique IA", "Évaluation", "Feedback"],
  },
];

function DiscoverySection() {
  return (
    <div>
      <SectionHero
        icon={Network}
        title="Discovery"
        subtitle="Explorez la plateforme sous 3 perspectives : technique, business et métier"
        pain="Comprendre une plateforme complexe nécessite plusieurs angles de vue : architecture technique, flux business concrets et cas d'usage par domaine métier."
      />

      <Tabs defaultValue="architecture" className="w-full">
        <TabsList className="grid w-full grid-cols-3 mb-8">
          <TabsTrigger value="architecture" className="gap-2 text-xs sm:text-sm">
            <Layers className="h-4 w-4" />
            Architecture
          </TabsTrigger>
          <TabsTrigger value="workflows" className="gap-2 text-xs sm:text-sm">
            <Workflow className="h-4 w-4" />
            Workflows Business
          </TabsTrigger>
          <TabsTrigger value="metier" className="gap-2 text-xs sm:text-sm">
            <Briefcase className="h-4 w-4" />
            Cas Métier
          </TabsTrigger>
        </TabsList>

        {/* Tab 1 — Architecture */}
        <TabsContent value="architecture">
          <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
            Explorez l'architecture complète de GROWTHINNOV à travers un <strong>flow interactif</strong>. Filtrez par couche logique, cliquez sur un composant pour découvrir ses fonctionnalités et naviguez entre les nœuds connectés.
          </p>
          <PlatformFlow />
        </TabsContent>

        {/* Tab 2 — Workflows Business */}
        <TabsContent value="workflows">
          <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
            Découvrez les <strong>4 flux opérationnels clés</strong> de la plateforme. Cliquez sur chaque étape pour voir les acteurs, outils et le rôle de l'IA.
          </p>
          <div className="space-y-5">
            {BUSINESS_WORKFLOWS.map(w => (
              <BusinessWorkflow key={w.title} {...w} />
            ))}
          </div>
        </TabsContent>

        {/* Tab 3 — Cas Métier */}
        <TabsContent value="metier">
          <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
            Explorez les <strong>cas d'usage concrets</strong> par domaine métier. Chaque domaine présente ses problématiques, nos solutions et les KPIs d'impact.
          </p>
          <div className="space-y-4">
            {DOMAIN_CARDS.map(d => (
              <DomainCard key={d.title} {...d} />
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

/* ═══════════════════════════════ DÉCIDEURS ═══════════════════════════════ */

function StatCard({ value, label, icon: Icon }: { value: string; label: string; icon: any }) {
  return (
    <div className="rounded-2xl border bg-gradient-to-br from-card to-muted/30 p-5 text-center">
      <Icon className="h-6 w-6 text-primary mx-auto mb-2" />
      <p className="text-3xl font-black text-foreground tracking-tight">{value}</p>
      <p className="text-xs text-muted-foreground mt-1 font-medium">{label}</p>
    </div>
  );
}

function UseCaseCard({ persona, pain, solution, result, color }: { persona: string; pain: string; solution: string; result: string; color: string }) {
  return (
    <Card className={cn("overflow-hidden border-l-4", color)}>
      <CardContent className="p-5 space-y-3">
        <Badge variant="outline" className="text-[10px] font-bold">{persona}</Badge>
        <div className="space-y-2">
          <div className="flex items-start gap-2">
            <Target className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
            <p className="text-xs text-muted-foreground"><strong className="text-foreground">Problème :</strong> {pain}</p>
          </div>
          <div className="flex items-start gap-2">
            <Lightbulb className="h-4 w-4 text-primary shrink-0 mt-0.5" />
            <p className="text-xs text-muted-foreground"><strong className="text-foreground">Solution :</strong> {solution}</p>
          </div>
          <div className="flex items-start gap-2">
            <TrendingUp className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
            <p className="text-xs text-muted-foreground"><strong className="text-foreground">Résultat :</strong> {result}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function CompareRow({ feature, us, others }: { feature: string; us: string; others: string }) {
  return (
    <div className="grid grid-cols-3 gap-4 py-3 border-b border-border/30 last:border-0">
      <span className="text-sm font-medium text-foreground">{feature}</span>
      <span className="text-sm text-emerald-600 dark:text-emerald-400 font-semibold text-center">{us}</span>
      <span className="text-sm text-muted-foreground text-center">{others}</span>
    </div>
  );
}

function DecideursSection() {
  return (
    <div>
      <SectionHero
        icon={Compass}
        title="Pour les décideurs"
        subtitle="ROI, cas d'usage concrets et avantages compétitifs"
        pain="Investir dans une plateforme de formation sans garantie de résultats mesurables, d'adoption par les équipes ni de retour sur investissement tangible."
      />

      {/* KPI Impact */}
      <h3 className="text-lg font-bold text-foreground mb-4">Impact mesurable</h3>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
        <StatCard icon={TrendingUp} value="×3" label="Vitesse d'acquisition des compétences" />
        <StatCard icon={Clock} value="-70%" label="Temps de création de parcours" />
        <StatCard icon={Award} value="92%" label="Taux de complétion moyen" />
        <StatCard icon={DollarSign} value="×5" label="ROI formation vs. consulting" />
      </div>

      {/* Use cases par persona */}
      <h3 className="text-lg font-bold text-foreground mb-4">Cas d'usage par profil</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-10">
        <UseCaseCard
          persona="DRH / Responsable Formation"
          pain="Formations génériques avec 0% de visibilité sur les compétences acquises."
          solution="Parcours adaptatifs par fonction avec suivi granulaire par compétence et certificats vérifiables."
          result="Cartographie complète des compétences IA de chaque collaborateur, ROI formation documenté."
          color="border-l-primary"
        />
        <UseCaseCard
          persona="Directeur Innovation / CDO"
          pain="Les équipes ne savent pas appliquer l'IA à leurs métiers malgré les formations suivies."
          solution="Simulateur IA avec 7 modes professionnels + Challenges de diagnostic stratégique autonome."
          result="Équipes capables de mener des audits IA en autonomie, compétences mesurées par la pratique."
          color="border-l-accent"
        />
        <UseCaseCard
          persona="Manager / Chef de projet"
          pain="Pas d'outil pour animer des ateliers stratégiques structurés avec ses équipes."
          solution="Workshops collaboratifs gamifiés avec toolkits stratégiques et canevas interactif."
          result="Ateliers productifs avec livrables exploitables, engagement mesurable de chaque participant."
          color="border-l-emerald-500"
        />
        <UseCaseCard
          persona="Consultant / Formateur"
          pain="Créer un parcours complet prend des semaines et n'est pas reproductible."
          solution="IA de génération batch : parcours, modules, quiz, exercices créés en minutes."
          result="Catalogue de formations sur-mesure en quelques heures, mise à jour continue par l'IA."
          color="border-l-orange-500"
        />
      </div>

      {/* Comparatif */}
      <h3 className="text-lg font-bold text-foreground mb-4">Pourquoi GROWTHINNOV</h3>
      <Card className="mb-10">
        <CardContent className="p-6">
          <div className="grid grid-cols-3 gap-4 pb-3 border-b-2 border-border mb-1">
            <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Fonctionnalité</span>
            <span className="text-xs font-bold uppercase tracking-widest text-emerald-600 dark:text-emerald-400 text-center">GROWTHINNOV</span>
            <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground text-center">LMS classique</span>
          </div>
          <CompareRow feature="IA intégrée à chaque étape" us="✅ Tutor, Coach, Évaluation, Génération" others="❌ Pas d'IA ou plugin basique" />
          <CompareRow feature="Simulateur professionnel" us="✅ 7 modes avec scoring" others="❌ Aucun" />
          <CompareRow feature="Workshops collaboratifs" us="✅ Canevas temps réel gamifié" others="❌ Forum / chat basique" />
          <CompareRow feature="Diagnostic stratégique" us="✅ Challenges avec analyse IA" others="❌ Aucun" />
          <CompareRow feature="Évaluation par compétence" us="✅ Granulaire, persistée, IA" others="⚠️ Score global uniquement" />
          <CompareRow feature="Livret de cours PDF" us="✅ Auto-généré, envoyé par email" others="❌ Aucun" />
          <CompareRow feature="Certificats vérifiables" us="✅ QR code + LinkedIn" others="⚠️ PDF simple" />
          <CompareRow feature="Création de contenu IA" us="✅ Batch complet en minutes" others="❌ Manuel uniquement" />
        </CardContent>
      </Card>

      {/* CTA */}
      <div className="rounded-2xl bg-gradient-to-br from-primary/10 via-accent/5 to-primary/10 border-2 border-primary/20 p-8 text-center">
        <Compass className="h-10 w-10 text-primary mx-auto mb-3" />
        <h3 className="text-xl font-black text-foreground mb-2">Prêt à transformer vos formations ?</h3>
        <p className="text-sm text-muted-foreground mb-5 max-w-md mx-auto">
          Découvrez comment GROWTHINNOV peut accélérer la montée en compétences de vos équipes avec un ROI mesurable dès le premier parcours.
        </p>
        <Button size="lg" className="gap-2">
          <Rocket className="h-4 w-4" /> Demander une démo
        </Button>
      </div>
    </div>
  );
}

/* ═══════════════════════════════ PARTENAIRES ═══════════════════════════════ */

function PartnerModelCard({ icon: Icon, title, desc, benefits, color }: { icon: any; title: string; desc: string; benefits: string[]; color: string }) {
  return (
    <Card className={cn("overflow-hidden border-t-4", color)}>
      <CardContent className="p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className={cn("h-11 w-11 rounded-xl flex items-center justify-center", color.replace("border-t-", "bg-").replace("500", "500/10"))}>
            <Icon className={cn("h-5 w-5", color.replace("border-t-", "text-"))} />
          </div>
          <h4 className="text-base font-bold text-foreground">{title}</h4>
        </div>
        <p className="text-sm text-muted-foreground leading-relaxed mb-4">{desc}</p>
        <div className="space-y-2">
          {benefits.map((b) => (
            <div key={b} className="flex items-center gap-2">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
              <span className="text-xs text-foreground/70">{b}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function PartenairesSection() {
  return (
    <div>
      <SectionHero
        icon={Handshake}
        title="Partenaires"
        subtitle="Intégration, co-création et modèle de revenus partagé"
        pain="Les partenaires de formation manquent d'outils technologiques différenciants pour enrichir leur offre et fidéliser leurs clients."
      />

      {/* Pain points partenaires */}
      <h3 className="text-lg font-bold text-foreground mb-4">Vos défis, nos solutions</h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
        <PainCard icon={Puzzle} title="Offre commoditisée" desc="Difficile de se différencier face aux LMS génériques et aux formations en ligne standardisées." />
        <PainCard icon={Repeat} title="Pas de récurrence" desc="Les prestations ponctuelles ne génèrent pas de revenus récurrents ni de fidélisation durable." />
        <PainCard icon={Globe} title="Scalabilité limitée" desc="Impossible de multiplier les formations sans multiplier proportionnellement les ressources humaines." />
      </div>

      {/* Modèles de partenariat */}
      <h3 className="text-lg font-bold text-foreground mb-4">3 modèles de partenariat</h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
        <PartnerModelCard
          icon={Building2}
          title="Revendeur"
          desc="Proposez GROWTHINNOV sous votre marque avec un modèle de revenus récurrent."
          benefits={["White-label complet", "Marge sur abonnements", "Support technique inclus", "Formation commerciale"]}
          color="border-t-primary"
        />
        <PartnerModelCard
          icon={Puzzle}
          title="Intégrateur"
          desc="Intégrez GROWTHINNOV dans vos dispositifs de formation existants via API."
          benefits={["API REST complète", "SSO et provisioning", "Webhooks événementiels", "SDK JavaScript"]}
          color="border-t-accent"
        />
        <PartnerModelCard
          icon={HeartHandshake}
          title="Co-créateur"
          desc="Co-développez des toolkits et parcours thématiques pour vos secteurs d'expertise."
          benefits={["Toolkits sur-mesure", "Revenue share sur contenu", "Co-branding", "Accès IA de génération"]}
          color="border-t-emerald-500"
        />
      </div>

      {/* Workflow d'intégration */}
      <h3 className="text-lg font-bold text-foreground mb-4">Parcours d'intégration</h3>
      <div className="ml-2 mb-10">
        <WorkflowStep step={1} title="Onboarding technique" desc="Configuration du tenant, branding, SSO et provisioning des utilisateurs en quelques heures." />
        <WorkflowStep step={2} title="Création du catalogue" desc="L'IA génère vos premiers parcours à partir de vos contenus et expertises métier existants." />
        <WorkflowStep step={3} title="Formation des équipes" desc="Vos formateurs et facilitateurs maîtrisent le simulateur, les workshops et les challenges." />
        <WorkflowStep step={4} title="Lancement & itération" desc="Déploiement auprès de vos clients avec suivi d'adoption, métriques et optimisation continue." isLast />
      </div>

      {/* Avantages techniques */}
      <h3 className="text-lg font-bold text-foreground mb-4">Avantages techniques</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-10">
        <FeatureCard icon={ShieldCheck} title="Multi-tenant natif" desc="Chaque organisation est isolée avec son branding, ses données et sa configuration IA propre." badges={["Isolation", "RGPD"]} />
        <FeatureCard icon={Zap} title="IA de génération batch" desc="Créez des centaines de modules, quiz et exercices en quelques minutes à partir de descriptions métier." badges={["GPT", "Gemini", "Batch"]} />
        <FeatureCard icon={BarChart3} title="Observabilité partenaire" desc="Dashboard consolidé multi-organisations avec métriques d'adoption, de complétion et de satisfaction." badges={["Analytics", "Export"]} />
        <FeatureCard icon={Globe} title="API & Webhooks" desc="Intégration complète avec vos outils existants : LMS, SIRH, CRM, outils de reporting." badges={["REST", "Webhooks", "SSO"]} />
      </div>

      <ValueProp>
        Devenez partenaire GROWTHINNOV et offrez à vos clients une <strong>expérience de formation augmentée par l'IA</strong> qui vous différencie durablement — avec un modèle de revenus récurrent et une scalabilité sans limites.
      </ValueProp>

      {/* CTA */}
      <div className="rounded-2xl bg-gradient-to-br from-emerald-500/10 via-primary/5 to-accent/10 border-2 border-emerald-500/20 p-8 text-center mt-8">
        <Handshake className="h-10 w-10 text-emerald-500 mx-auto mb-3" />
        <h3 className="text-xl font-black text-foreground mb-2">Rejoignez l'écosystème</h3>
        <p className="text-sm text-muted-foreground mb-5 max-w-md mx-auto">
          Explorons ensemble comment intégrer GROWTHINNOV dans votre offre et créer de la valeur pour vos clients.
        </p>
        <Button size="lg" className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white">
          <HeartHandshake className="h-4 w-4" /> Devenir partenaire
        </Button>
      </div>
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
  discovery: DiscoverySection,
  decideurs: DecideursSection,
  partenaires: PartenairesSection,
};

export function InsightContent({ activeSection }: InsightContentProps) {
  const Section = SECTIONS[activeSection] || OverviewSection;
  return (
    <div className={cn(
      "mx-auto px-6 py-8",
      activeSection === "discovery" ? "max-w-7xl" : "max-w-4xl"
    )}>
      <Section />
    </div>
  );
}
