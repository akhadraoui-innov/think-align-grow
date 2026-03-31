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
  PenTool, Cpu, ClipboardCheck, MonitorPlay, Network,
  XCircle, CircleCheck, Quote, Timer, Megaphone, Gauge
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { PlatformFlow } from "./PlatformFlow";
import { CycleTimeline } from "./CycleTimeline";
import { formationsCycle, pratiqueCycle, workshopsCycle, challengesCycle, plateformeCycle } from "./cycleData";

interface InsightContentProps {
  activeSection: string;
}

/* ═══════════════ REUSABLE SUB-COMPONENTS ═══════════════ */

/* ─── Section Tabs Wrapper ─── */
function SectionTabs({ essential, detailed }: { essential: React.ReactNode; detailed: React.ReactNode }) {
  return (
    <Tabs defaultValue="essentiel" className="w-full">
      <TabsList className="grid w-full max-w-[420px] grid-cols-2 mb-8">
        <TabsTrigger value="essentiel" className="gap-2 text-xs sm:text-sm">
          <Eye className="h-4 w-4" />
          Vue Essentielle
        </TabsTrigger>
        <TabsTrigger value="detaille" className="gap-2 text-xs sm:text-sm">
          <Layers className="h-4 w-4" />
          Vue Détaillée
        </TabsTrigger>
      </TabsList>
      <TabsContent value="essentiel">{essential}</TabsContent>
      <TabsContent value="detaille">{detailed}</TabsContent>
    </Tabs>
  );
}

/* ─── Big Stat ─── */
function BigStat({ value, label, accent }: { value: string; label: string; accent?: string }) {
  return (
    <div className="text-center p-6">
      <p className={cn("text-5xl md:text-6xl font-black tracking-tight", accent || "text-primary")}>{value}</p>
      <p className="text-sm text-muted-foreground mt-2 font-semibold uppercase tracking-wide">{label}</p>
    </div>
  );
}

/* ─── Before / After ─── */
function BeforeAfter({ before, after }: { before: { title: string; items: string[] }; after: { title: string; items: string[] } }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-0 rounded-2xl overflow-hidden border">
      <div className="bg-destructive/5 p-6 space-y-3">
        <div className="flex items-center gap-2 mb-4">
          <XCircle className="h-5 w-5 text-destructive" />
          <h4 className="font-black text-destructive text-sm uppercase tracking-wide">{before.title}</h4>
        </div>
        {before.items.map((item, i) => (
          <div key={i} className="flex items-start gap-2.5">
            <XCircle className="h-4 w-4 text-destructive/60 shrink-0 mt-0.5" />
            <p className="text-sm text-muted-foreground leading-relaxed">{item}</p>
          </div>
        ))}
      </div>
      <div className="bg-primary/5 p-6 space-y-3">
        <div className="flex items-center gap-2 mb-4">
          <CircleCheck className="h-5 w-5 text-primary" />
          <h4 className="font-black text-primary text-sm uppercase tracking-wide">{after.title}</h4>
        </div>
        {after.items.map((item, i) => (
          <div key={i} className="flex items-start gap-2.5">
            <CircleCheck className="h-4 w-4 text-primary/60 shrink-0 mt-0.5" />
            <p className="text-sm text-foreground/80 leading-relaxed">{item}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── Scenario Card ─── */
function ScenarioCard({ persona, role, story, color }: { persona: string; role: string; story: string; color: string }) {
  return (
    <Card className={cn("border-l-4 overflow-hidden", color)}>
      <CardContent className="p-5">
        <div className="flex items-center gap-3 mb-3">
          <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center text-lg font-black text-primary">
            {persona.charAt(0)}
          </div>
          <div>
            <p className="font-bold text-sm text-foreground">{persona}</p>
            <p className="text-[11px] text-muted-foreground">{role}</p>
          </div>
        </div>
        <div className="flex items-start gap-2">
          <Quote className="h-4 w-4 text-muted-foreground/40 shrink-0 mt-0.5 rotate-180" />
          <p className="text-sm text-muted-foreground leading-relaxed italic">{story}</p>
        </div>
      </CardContent>
    </Card>
  );
}

/* ─── Simple Flow ─── */
function SimpleFlow({ steps }: { steps: { icon: any; label: string; duration?: string }[] }) {
  return (
    <div className="flex flex-wrap items-center justify-center gap-2 py-6">
      {steps.map((s, i) => {
        const Icon = s.icon;
        return (
          <div key={i} className="flex items-center gap-2">
            <div className="flex flex-col items-center text-center w-24">
              <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/20 flex items-center justify-center shadow-sm mb-2">
                <Icon className="h-6 w-6 text-primary" />
              </div>
              <p className="text-[11px] font-bold text-foreground leading-tight">{s.label}</p>
              {s.duration && <p className="text-[10px] text-muted-foreground mt-0.5">{s.duration}</p>}
            </div>
            {i < steps.length - 1 && <ArrowRight className="h-5 w-5 text-primary/30 shrink-0" />}
          </div>
        );
      })}
    </div>
  );
}

/* ─── Testimonial Card ─── */
function TestimonialCard({ name, role, quote }: { name: string; role: string; quote: string }) {
  return (
    <div className="rounded-2xl border bg-gradient-to-br from-card to-muted/20 p-6">
      <Quote className="h-8 w-8 text-primary/20 mb-3 rotate-180" />
      <p className="text-sm text-foreground leading-relaxed mb-4 italic">"{quote}"</p>
      <div className="flex items-center gap-3">
        <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary">{name.charAt(0)}</div>
        <div>
          <p className="text-sm font-bold text-foreground">{name}</p>
          <p className="text-[11px] text-muted-foreground">{role}</p>
        </div>
      </div>
    </div>
  );
}

/* ─── Accroche Hero ─── */
function AccrocheHero({ tagline, subtitle }: { tagline: string; subtitle: string }) {
  return (
    <div className="text-center mb-10">
      <h2 className="text-3xl md:text-4xl font-black text-foreground tracking-tight leading-tight mb-3">{tagline}</h2>
      <p className="text-base text-muted-foreground max-w-2xl mx-auto leading-relaxed">{subtitle}</p>
    </div>
  );
}

/* ─── Deliverable Item ─── */
function DeliverableItem({ icon: Icon, label, desc }: { icon: any; label: string; desc: string }) {
  return (
    <div className="flex items-start gap-3 p-4 rounded-xl border bg-card hover:shadow-sm transition-shadow">
      <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
        <Icon className="h-5 w-5 text-primary" />
      </div>
      <div>
        <p className="font-bold text-sm text-foreground">{label}</p>
        <p className="text-xs text-muted-foreground mt-0.5">{desc}</p>
      </div>
    </div>
  );
}

/* ─── Mode Card (Pratique) ─── */
function ModeCard({ icon: Icon, label, desc }: { icon: any; label: string; desc: string }) {
  return (
    <div className="flex items-center gap-3 p-4 rounded-xl border bg-card">
      <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-primary/20 to-accent/10 flex items-center justify-center shrink-0">
        <Icon className="h-6 w-6 text-primary" />
      </div>
      <div className="min-w-0">
        <p className="font-bold text-sm text-foreground">{label}</p>
        <p className="text-[11px] text-muted-foreground leading-snug">{desc}</p>
      </div>
    </div>
  );
}

/* ═══════════════ EXISTING HELPER COMPONENTS (Detailed views) ═══════════════ */

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
            {badges.map(b => <Badge key={b} variant="secondary" className="text-[10px] font-semibold">{b}</Badge>)}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

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

function StatCard({ value, label, icon: Icon }: { value: string; label: string; icon: any }) {
  return (
    <div className="rounded-2xl border bg-gradient-to-br from-card to-muted/30 p-5 text-center">
      <Icon className="h-6 w-6 text-primary mx-auto mb-2" />
      <p className="text-3xl font-black text-foreground tracking-tight">{value}</p>
      <p className="text-xs text-muted-foreground mt-1 font-medium">{label}</p>
    </div>
  );
}

/* ═══════════════════════════════ SECTIONS ═══════════════════════════════ */

/* ─── 1. OVERVIEW ─── */
function OverviewEssential() {
  return (
    <div>
      <AccrocheHero
        tagline="Vos formations ne changent rien. Nous, si."
        subtitle="GROWTHINNOV est la première plateforme qui combine IA, gamification et intelligence collective pour transformer chaque formation en compétences mesurables."
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
        <BigStat value="×3" label="Vitesse d'acquisition" />
        <BigStat value="-70%" label="Coûts de conception" accent="text-emerald-500" />
        <BigStat value="92%" label="Taux de complétion" />
        <BigStat value="100%" label="Traçabilité" accent="text-emerald-500" />
      </div>

      <BeforeAfter
        before={{
          title: "Aujourd'hui",
          items: [
            "Formations génériques identiques pour tous les collaborateurs",
            "Aucune idée des compétences réellement acquises après la formation",
            "Pas de livrable exploitable pour le manager ou le RH",
            "Budget formation impossible à justifier auprès de la direction",
          ],
        }}
        after={{
          title: "Avec GROWTHINNOV",
          items: [
            "Parcours adapté à chaque fonction, métier et niveau de séniorité",
            "Évaluation par compétence avec radar, scoring et certificat vérifiable",
            "Livret de cours complet, rapports d'évaluation et cartographie des skills",
            "ROI mesurable dès le premier parcours déployé avec dashboard temps réel",
          ],
        }}
      />

      <div className="my-12">
        <h3 className="text-lg font-bold text-foreground mb-6 text-center">Ce qu'en disent nos utilisateurs</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <TestimonialCard name="Marie" role="DRH — Groupe industriel" quote="En 2 semaines, on a déployé 5 parcours IA sur-mesure pour nos managers. Le simulateur a tout changé : nos équipes pratiquent au lieu de juste écouter." />
          <TestimonialCard name="Thomas" role="Manager Innovation — ETI" quote="Les workshops gamifiés ont transformé nos sessions stratégiques. Chaque participant s'implique parce que sa contribution est visible et scorée." />
          <TestimonialCard name="Sophie" role="Consultante Formation" quote="J'ai créé un catalogue de 20 formations en une semaine avec l'IA. Avant, il m'aurait fallu 6 mois. Le livrable PDF impressionne tous mes clients." />
        </div>
      </div>

      <SimpleFlow steps={[
        { icon: Settings, label: "Paramétrage IA", duration: "5 min" },
        { icon: BookOpen, label: "Parcours adapté", duration: "Auto-généré" },
        { icon: Sparkles, label: "Pratique IA", duration: "7 modes" },
        { icon: Award, label: "Certificat", duration: "Vérifiable" },
      ]} />

      <div className="mt-10 rounded-2xl bg-gradient-to-br from-primary/10 via-accent/5 to-primary/10 border-2 border-primary/20 p-8 text-center">
        <Rocket className="h-10 w-10 text-primary mx-auto mb-3" />
        <h3 className="text-xl font-black text-foreground mb-2">Prêt à voir la différence ?</h3>
        <p className="text-sm text-muted-foreground mb-5 max-w-md mx-auto">
          Demandez une démo personnalisée et découvrez comment GROWTHINNOV transforme vos formations en résultats concrets.
        </p>
        <Button size="lg" className="gap-2"><Rocket className="h-4 w-4" /> Demander une démo</Button>
      </div>
    </div>
  );
}

function OverviewDetailed() {
  return (
    <div>
      <SectionHero icon={Rocket} title="GROWTHINNOV" subtitle="La plateforme d'accélération des compétences stratégiques par l'IA" pain="Les entreprises investissent massivement en formation mais peinent à mesurer l'impact réel sur les compétences opérationnelles et la transformation de leurs équipes." />
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
      <ValueProp><strong>GROWTHINNOV</strong> combine la puissance de l'IA générative, la gamification et l'intelligence collective pour transformer chaque formation en une expérience mesurable et engageante — du paramétrage à la certification.</ValueProp>
    </div>
  );
}

function OverviewSection() {
  return <SectionTabs essential={<OverviewEssential />} detailed={<OverviewDetailed />} />;
}

/* ─── 2. FORMATIONS ─── */
function FormationsEssential() {
  return (
    <div>
      <AccrocheHero
        tagline="En 5 minutes, un parcours adapté à chaque métier."
        subtitle="Fini les formations génériques. Chaque collaborateur reçoit un parcours personnalisé à sa fonction, son niveau et ses objectifs — généré par l'IA."
      />

      <SimpleFlow steps={[
        { icon: UserCheck, label: "Inscription", duration: "2 min" },
        { icon: BookOpen, label: "1er module", duration: "15 min" },
        { icon: CheckCircle2, label: "Quiz évalué", duration: "5 min" },
        { icon: Sparkles, label: "Pratique IA", duration: "20 min" },
        { icon: Award, label: "Certificat", duration: "Automatique" },
      ]} />

      <div className="my-10">
        <BeforeAfter
          before={{
            title: "Formation classique",
            items: [
              "Même contenu pour un développeur et un commercial",
              "L'apprenant repart avec zéro livrable exploitable",
              "Le manager ne sait pas ce qui a été acquis",
              "Taux d'abandon de 70% sur les MOOC et e-learning",
            ],
          }}
          after={{
            title: "Formation GROWTHINNOV",
            items: [
              "Parcours adapté : contenu, exercices et cas pratiques par métier",
              "Livret PDF complet, certificat QR et évaluation par compétence",
              "Dashboard manager avec radar de skills et progression temps réel",
              "92% de taux de complétion grâce à la gamification et l'IA tutor",
            ],
          }}
        />
      </div>

      <h3 className="text-lg font-bold text-foreground mb-5">Ce que reçoit chaque apprenant</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-10">
        <DeliverableItem icon={Brain} label="Brief IA personnalisé" desc="À l'ouverture de chaque module, un résumé adapté à son profil et ses acquis." />
        <DeliverableItem icon={MessageSquare} label="Feedback IA en temps réel" desc="Après chaque quiz et exercice, des explications détaillées et des recommandations." />
        <DeliverableItem icon={FileText} label="Livret de cours PDF" desc="Document de 4-8 pages avec tout le contenu, les exercices et les annotations." />
        <DeliverableItem icon={Award} label="Certificat vérifiable" desc="QR code, vérification publique, partage LinkedIn et historique complet." />
      </div>

      <ScenarioCard
        persona="Claire"
        role="Chef de projet Marketing — ETI industrielle"
        story="Lundi matin, Claire ouvre son parcours 'IA pour le Marketing'. En 15 minutes, elle termine sa première leçon avec un brief personnalisé à son secteur. Elle enchaîne avec un quiz : l'IA lui explique pourquoi sa réponse 3 est incorrecte. Vendredi, elle reçoit son certificat et un livret PDF de 6 pages qu'elle partage avec son manager."
        color="border-l-primary"
      />
    </div>
  );
}

function FormationsDetailed() {
  return (
    <div>
      <SectionHero icon={BookOpen} title="Formations" subtitle="Parcours adaptatifs avec IA intégrée à chaque étape" pain="Les formations traditionnelles sont génériques, déconnectées du métier et ne produisent aucune trace des acquis exploitable par l'entreprise." />
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
      <ValueProp>Chaque interaction est <strong>persistée et exploitée par l'IA</strong> pour personnaliser le feedback. L'apprenant repart avec un livret complet, une évaluation détaillée et un certificat vérifiable. L'organisation dispose d'un suivi granulaire par compétence.</ValueProp>
    </div>
  );
}

function FormationsSection() {
  return <SectionTabs essential={<FormationsEssential />} detailed={<FormationsDetailed />} />;
}

/* ─── 3. PRATIQUE ─── */
function PratiqueEssential() {
  return (
    <div>
      <AccrocheHero
        tagline="Un terrain d'entraînement IA pour vos équipes."
        subtitle="Vos collaborateurs s'exercent dans un simulateur professionnel avec 7 modes, un feedback IA instantané et un scoring objectif."
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mb-10">
        <ModeCard icon={BarChart3} label="Analyse" desc="Décrypter des données et formuler des recommandations" />
        <ModeCard icon={Palette} label="Design" desc="Concevoir des solutions et prototyper des approches" />
        <ModeCard icon={Code} label="Code" desc="Écrire et déboguer du code avec validation IA" />
        <ModeCard icon={FileText} label="Document" desc="Rédiger des documents professionnels de qualité" />
        <ModeCard icon={MessageSquare} label="Chat" desc="Explorer un sujet en dialogue libre avec l'IA" />
        <ModeCard icon={CheckCircle2} label="Évaluation" desc="Tester ses connaissances avec scoring détaillé" />
        <ModeCard icon={Target} label="Décision" desc="Naviguer un arbre décisionnel et mesurer l'impact" />
      </div>

      <ScenarioCard
        persona="Thomas"
        role="Chef de projet digital — Cabinet de conseil"
        story="Thomas doit analyser un cas de transformation digitale pour un client. Il lance le mode 'Analyse' du simulateur, reçoit un brief, structure ses recommandations et obtient un score de 87/100. Le rapport IA lui montre ses points forts (structuration, pertinence) et ses axes d'amélioration (quantification, benchmarks). Il refait l'exercice et atteint 94/100."
        color="border-l-accent"
      />

      <div className="my-10 grid grid-cols-1 md:grid-cols-3 gap-4">
        <BigStat value="87%" label="Score moyen 1re session" />
        <BigStat value="+15pts" label="Progression 2e session" accent="text-emerald-500" />
        <BigStat value="5 min" label="Pour obtenir un rapport complet" />
      </div>

      <SimpleFlow steps={[
        { icon: FileText, label: "Briefing", duration: "30 sec" },
        { icon: MessageSquare, label: "Exercice", duration: "10-20 min" },
        { icon: BarChart3, label: "Scoring", duration: "Instantané" },
        { icon: TrendingUp, label: "Rapport", duration: "Détaillé" },
      ]} />
    </div>
  );
}

function PratiqueDetailed() {
  return (
    <div>
      <SectionHero icon={Sparkles} title="Mise en pratique" subtitle="Simulateur IA avec 7 modes d'entraînement professionnel" pain="La théorie ne suffit pas. Sans mise en pratique encadrée, les compétences ne s'ancrent pas et ne se transfèrent pas en situation réelle." />
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
      <ValueProp>Le simulateur offre un <strong>terrain d'entraînement professionnel sécurisé</strong> où chaque action est mesurée. L'apprenant développe ses compétences par la pratique répétée avec un feedback IA instantané et objectif.</ValueProp>
    </div>
  );
}

function PratiqueSection() {
  return <SectionTabs essential={<PratiqueEssential />} detailed={<PratiqueDetailed />} />;
}

/* ─── 4. WORKSHOPS ─── */
function WorkshopsEssential() {
  return (
    <div>
      <AccrocheHero
        tagline="Transformez vos réunions en ateliers productifs."
        subtitle="Fini les post-its qui finissent à la poubelle. Chaque atelier produit des livrables structurés, scorés et exploitables."
      />

      <BeforeAfter
        before={{
          title: "Réunion classique",
          items: [
            "3 personnes parlent, 7 écoutent (ou pas)",
            "Post-its illisibles photographiés et jamais relus",
            "Aucune trace des décisions ni des contributions",
            "Tout le monde repart avec une interprétation différente",
          ],
        }}
        after={{
          title: "Workshop GROWTHINNOV",
          items: [
            "Chaque participant contribue sur le canevas digital en temps réel",
            "Cartes stratégiques structurées, annotées et exploitables",
            "Scoring individuel et collectif — chaque contribution compte",
            "Synthèse IA, rapport automatique et plan d'action partagé",
          ],
        }}
      />

      <div className="my-10">
        <h3 className="text-lg font-bold text-foreground mb-5">3 livrables concrets par atelier</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <DeliverableItem icon={LayoutGrid} label="Canevas stratégique" desc="Toutes les cartes, idées et décisions visualisées sur un canevas interactif persisté." />
          <DeliverableItem icon={BarChart3} label="Scores & classement" desc="Points de valorisation par participant, classement et engagement mesurable." />
          <DeliverableItem icon={Brain} label="Synthèse IA" desc="L'IA analyse les contributions et génère un résumé actionnable avec recommandations." />
        </div>
      </div>

      <SimpleFlow steps={[
        { icon: Layers, label: "Choisir un toolkit", duration: "2 min" },
        { icon: Users, label: "Inviter l'équipe", duration: "1 min" },
        { icon: LayoutGrid, label: "Canevas live", duration: "30-60 min" },
        { icon: Award, label: "Résultats", duration: "Instantané" },
      ]} />

      <div className="mt-8">
        <ScenarioCard
          persona="Julien"
          role="Directeur Innovation — Scale-up SaaS"
          story="Julien organise un atelier de cadrage produit avec 8 collaborateurs. En 45 minutes, l'équipe a rempli le canevas avec 32 cartes stratégiques. Le scoring montre que 3 participants ont contribué à 60% des idées — Julien sait qui impliquer dans la prochaine phase. L'IA génère un résumé exécutif qu'il partage au COMEX."
          color="border-l-emerald-500"
        />
      </div>
    </div>
  );
}

function WorkshopsDetailed() {
  return (
    <div>
      <SectionHero icon={Users} title="Workshops" subtitle="Intelligence collective et canevas collaboratif gamifié" pain="Les ateliers collaboratifs manquent de structure, produisent peu de livrables exploitables et ne valorisent pas la contribution individuelle." />
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
      <ValueProp>Les workshops GROWTHINNOV transforment chaque session collaborative en une <strong>expérience structurée, gamifiée et documentée</strong> où chaque contribution compte et chaque décision est traçable.</ValueProp>
    </div>
  );
}

function WorkshopsSection() {
  return <SectionTabs essential={<WorkshopsEssential />} detailed={<WorkshopsDetailed />} />;
}

/* ─── 5. CHALLENGES ─── */
function ChallengesEssential() {
  return (
    <div>
      <AccrocheHero
        tagline="Un diagnostic stratégique en 30 minutes, sans consultant."
        subtitle="Évaluez la maturité de votre organisation sur n'importe quel sujet stratégique avec une analyse IA qui rivalise avec un audit professionnel."
      />

      <SimpleFlow steps={[
        { icon: LayoutGrid, label: "Choisir un sujet", duration: "Ex: Maturité IA" },
        { icon: Layers, label: "Placer les cartes", duration: "15 min" },
        { icon: Gauge, label: "Évaluer la maturité", duration: "5 min" },
        { icon: Brain, label: "Rapport IA", duration: "Automatique" },
      ]} />

      <div className="my-10">
        <ScenarioCard
          persona="Antoine"
          role="Directeur Stratégie — PME Tech"
          story="Antoine veut évaluer la maturité IA de son entreprise. Il lance le challenge 'Transformation Digitale', sélectionne 12 cartes stratégiques parmi 40, les classe par priorité et note la maturité de son organisation sur chacune. En 30 minutes, l'IA génère un rapport de 3 pages avec un score global de 3.2/5, 4 gaps critiques et un plan d'action priorisé. Ce qui aurait coûté 15K€ à un cabinet."
          color="border-l-orange-500"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <BigStat value="30 min" label="Pour un diagnostic complet" />
        <BigStat value="×50" label="Moins cher qu'un cabinet" accent="text-emerald-500" />
        <BigStat value="100%" label="Autonomie de l'équipe" />
      </div>

      <BeforeAfter
        before={{
          title: "Diagnostic classique",
          items: [
            "Engager un cabinet de conseil : 10-50K€ et 4-8 semaines",
            "Résultat = un PDF statique qui n'est jamais mis à jour",
            "Aucun transfert de compétence vers les équipes internes",
          ],
        }}
        after={{
          title: "Challenge GROWTHINNOV",
          items: [
            "Diagnostic en 30 minutes, gratuit, reproductible à volonté",
            "Rapport IA dynamique avec recommandations concrètes et plan d'action",
            "Les équipes apprennent en diagnostiquant — compétence acquise",
          ],
        }}
      />
    </div>
  );
}

function ChallengesDetailed() {
  return (
    <div>
      <SectionHero icon={LayoutGrid} title="Challenges" subtitle="Design Innovation et diagnostic stratégique autonome" pain="Les diagnostics stratégiques sont longs, coûteux et dépendent entièrement de consultants externes sans transfert de compétence." />
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
      <ValueProp>Les challenges permettent à <strong>n'importe quelle équipe de réaliser un diagnostic stratégique structuré</strong> en autonomie, avec une analyse IA qui rivalise avec un audit de consulting — en une fraction du temps et du coût.</ValueProp>
    </div>
  );
}

function ChallengesSection() {
  return <SectionTabs essential={<ChallengesEssential />} detailed={<ChallengesDetailed />} />;
}

/* ─── 6. PLATEFORME ─── */
function PlateformeEssential() {
  return (
    <div>
      <AccrocheHero
        tagline="Tout est paramétrable. Tout est mesurable."
        subtitle="Une plateforme complète qui se configure en heures, pas en mois. L'IA fait le travail lourd, vous gardez le contrôle."
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        <div className="rounded-2xl border bg-gradient-to-br from-primary/10 to-primary/5 p-6 text-center">
          <div className="h-16 w-16 rounded-2xl bg-primary/20 flex items-center justify-center mx-auto mb-4">
            <Brain className="h-8 w-8 text-primary" />
          </div>
          <h4 className="font-black text-foreground mb-2">Créer</h4>
          <p className="text-sm text-muted-foreground">L'IA génère parcours, modules, quiz et exercices à partir d'une simple description métier. En minutes, pas en semaines.</p>
        </div>
        <div className="rounded-2xl border bg-gradient-to-br from-accent/10 to-accent/5 p-6 text-center">
          <div className="h-16 w-16 rounded-2xl bg-accent/20 flex items-center justify-center mx-auto mb-4">
            <MonitorPlay className="h-8 w-8 text-accent" />
          </div>
          <h4 className="font-black text-foreground mb-2">Déployer</h4>
          <p className="text-sm text-muted-foreground">Portail immersif white-label, branding personnalisé, accès par organisation, SSO et provisioning automatique.</p>
        </div>
        <div className="rounded-2xl border bg-gradient-to-br from-emerald-500/10 to-emerald-500/5 p-6 text-center">
          <div className="h-16 w-16 rounded-2xl bg-emerald-500/20 flex items-center justify-center mx-auto mb-4">
            <BarChart3 className="h-8 w-8 text-emerald-500" />
          </div>
          <h4 className="font-black text-foreground mb-2">Mesurer</h4>
          <p className="text-sm text-muted-foreground">Dashboard temps réel, observabilité complète, matrice de compétences et alertes automatiques.</p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
        <BigStat value="5 min" label="Pour créer un parcours" />
        <BigStat value="100%" label="White-label" accent="text-emerald-500" />
        <BigStat value="∞" label="Organisations" />
        <BigStat value="24/7" label="Monitoring temps réel" accent="text-emerald-500" />
      </div>

      <ScenarioCard
        persona="Pierre"
        role="Responsable L&D — Groupe international"
        story="Pierre doit déployer un programme IA pour 500 collaborateurs répartis dans 4 pays. Avec GROWTHINNOV, il configure 3 fonctions métier, l'IA génère les parcours en 10 minutes, il personnalise le branding par filiale et lance la campagne de déploiement. En 48h, les premiers certificats sont émis. Le dashboard lui montre en temps réel la progression par pays et par compétence."
        color="border-l-primary"
      />
    </div>
  );
}

function PlateformeDetailed() {
  return (
    <div>
      <SectionHero icon={Shield} title="Plateforme" subtitle="Administration, observabilité et IA de génération" pain="Les plateformes de formation sont des silos : pas de vision 360°, pas de personnalisation avancée, pas d'outillage IA pour les administrateurs." />
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
      <ValueProp>GROWTHINNOV offre une <strong>plateforme complète</strong> qui combine la puissance d'administration d'un LMS enterprise avec l'intelligence de l'IA générative — le tout dans une expérience utilisateur premium que vos équipes voudront réellement utiliser.</ValueProp>
    </div>
  );
}

function PlateformeSection() {
  return <SectionTabs essential={<PlateformeEssential />} detailed={<PlateformeDetailed />} />;
}

/* ─── 7. DISCOVERY ─── */

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
        <div className="flex items-start gap-0 overflow-x-auto py-6 px-2">
          {steps.map((s, i) => (
            <div key={i} className="flex items-start shrink-0">
              <button
                onClick={() => setExpanded(expanded === i ? null : i)}
                className={cn("flex flex-col items-center text-center w-28 group cursor-pointer transition-all", expanded === i && "scale-105")}
              >
                <div className={cn("h-10 w-10 rounded-full flex items-center justify-center text-sm font-bold text-white shadow-md transition-all", LAYER_COLORS[s.layer], expanded === i && "ring-4 ring-primary/20")}>{i + 1}</div>
                <p className="text-[11px] font-semibold text-foreground mt-2 leading-tight">{s.title}</p>
                <Badge variant="outline" className={cn("text-[9px] mt-1.5 px-1.5 py-0", LAYER_BADGE[s.layer].className)}>{LAYER_BADGE[s.layer].label}</Badge>
              </button>
              {i < steps.length - 1 && (
                <div className="flex items-center pt-4 px-1 shrink-0">
                  <div className="w-8 h-px bg-border" />
                  <ArrowRight className="h-3.5 w-3.5 text-muted-foreground/50 -ml-1" />
                </div>
              )}
            </div>
          ))}
        </div>
        {expanded !== null && (
          <div className="rounded-xl border bg-muted/30 p-5 animate-in fade-in-50 slide-in-from-top-2 duration-200">
            <div className="flex items-center gap-2 mb-3">
              <div className={cn("h-6 w-6 rounded-full flex items-center justify-center text-xs font-bold text-white", LAYER_COLORS[steps[expanded].layer])}>{expanded + 1}</div>
              <h5 className="font-bold text-sm text-foreground">{steps[expanded].title}</h5>
              <Badge variant="outline" className={cn("text-[9px] ml-auto", LAYER_BADGE[steps[expanded].layer].className)}>{LAYER_BADGE[steps[expanded].layer].label}</Badge>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed mb-4">{steps[expanded].desc}</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {steps[expanded].actors && (
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1.5">Acteurs</p>
                  <div className="flex flex-wrap gap-1.5">{steps[expanded].actors!.map(a => <Badge key={a} variant="secondary" className="text-[10px]">{a}</Badge>)}</div>
                </div>
              )}
              {steps[expanded].tools && (
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1.5">Outils</p>
                  <div className="flex flex-wrap gap-1.5">{steps[expanded].tools!.map(t => <Badge key={t} variant="outline" className="text-[10px]">{t}</Badge>)}</div>
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
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-destructive mb-2">Problématiques</p>
              <div className="space-y-2">{painPoints.map(p => <div key={p} className="flex items-start gap-2"><Target className="h-3.5 w-3.5 text-destructive shrink-0 mt-0.5" /><span className="text-xs text-muted-foreground">{p}</span></div>)}</div>
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-primary mb-2">Solutions GROWTHINNOV</p>
              <div className="space-y-2">{solutions.map(s => <div key={s} className="flex items-start gap-2"><CheckCircle2 className="h-3.5 w-3.5 text-primary shrink-0 mt-0.5" /><span className="text-xs text-foreground/80">{s}</span></div>)}</div>
            </div>
            <div className="grid grid-cols-3 gap-3">{kpis.map(k => <div key={k.label} className="rounded-xl border bg-muted/30 p-3 text-center"><p className="text-lg font-black text-foreground">{k.value}</p><p className="text-[10px] text-muted-foreground font-medium mt-0.5">{k.label}</p></div>)}</div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2">Workflow simplifié</p>
              <div className="flex flex-wrap items-center gap-1.5">{workflow.map((w, i) => <span key={i} className="flex items-center gap-1.5"><Badge variant="secondary" className="text-[10px] font-semibold">{w}</Badge>{i < workflow.length - 1 && <ArrowRight className="h-3 w-3 text-muted-foreground/40" />}</span>)}</div>
            </div>
          </div>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}

const BUSINESS_WORKFLOWS = [
  {
    icon: UserCheck, title: "Flux Onboarding Apprenant", subtitle: "De l'inscription à la certification — 5 étapes clés",
    steps: [
      { title: "Inscription", desc: "L'apprenant s'inscrit et complète son profil professionnel (fonction, secteur, séniorité). L'organisation peut provisionner via SSO.", layer: "learner" as const, actors: ["Apprenant", "RH"], tools: ["SSO", "Profil", "SCIM"] },
      { title: "Profil IA", desc: "L'IA analyse le profil pour personnaliser les recommandations de parcours, le niveau de difficulté et le style pédagogique.", layer: "ai" as const, actors: ["IA Tutor"], tools: ["Profil", "Fonctions", "Personae"], aiRole: "Personnalisation automatique du parcours et pré-diagnostic" },
      { title: "Parcours suggéré", desc: "L'apprenant découvre les parcours recommandés basés sur sa fonction et ses objectifs.", layer: "learner" as const, actors: ["Apprenant"], tools: ["Catalogue", "Enrollment", "Brief IA"] },
      { title: "Apprentissage", desc: "Progression module par module : leçons interactives, quiz évalués, exercices pratiques et mises en situation IA.", layer: "learner" as const, actors: ["Apprenant", "IA Tutor"], tools: ["Modules", "Quiz", "Exercices", "Pratiques"], aiRole: "Feedback temps réel, brief personnalisé et coaching adaptatif" },
      { title: "Certification", desc: "Évaluation finale par compétence avec radar de skills, génération du certificat vérifiable (QR code + LinkedIn), envoi du livret complet.", layer: "ai" as const, actors: ["IA Évaluation", "Système"], tools: ["Certificat", "PDF", "Email", "QR Code"], aiRole: "Évaluation globale, génération du livret et publication du certificat" },
    ],
  },
  {
    icon: Settings, title: "Flux Création de Contenu", subtitle: "Du brief métier à la publication — Génération IA batch",
    steps: [
      { title: "Brief métier", desc: "L'administrateur définit la fonction cible, les compétences visées, le contexte sectoriel et le niveau de difficulté.", layer: "admin" as const, actors: ["Admin", "Formateur"], tools: ["Fonctions", "Personae", "Skills"] },
      { title: "Génération IA", desc: "L'IA crée automatiquement le parcours complet en batch : modules, leçons, quiz, exercices et pratiques conversationnelles.", layer: "ai" as const, actors: ["IA Génération"], tools: ["GPT", "Gemini", "Batch", "Templates"], aiRole: "Génération complète du parcours en 3-5 minutes" },
      { title: "Review", desc: "L'administrateur review chaque élément dans un éditeur riche. Il peut régénérer ou enrichir individuellement chaque composant.", layer: "admin" as const, actors: ["Admin", "Expert métier"], tools: ["Éditeur", "Preview", "Versions"] },
      { title: "Publication", desc: "Le parcours est publié. Les campagnes ciblent des groupes, équipes ou organisations spécifiques.", layer: "admin" as const, actors: ["Admin"], tools: ["Campagnes", "Ciblage", "Planification"] },
      { title: "Analytics", desc: "Suivi temps réel de l'adoption, des scores moyens et de la progression.", layer: "admin" as const, actors: ["Admin", "Manager"], tools: ["Dashboard", "Observabilité", "Alertes"], aiRole: "Insights automatiques et recommandations d'optimisation" },
    ],
  },
  {
    icon: ClipboardCheck, title: "Flux Évaluation Complète", subtitle: "Du quiz au certificat vérifiable — Évaluation multi-dimensionnelle",
    steps: [
      { title: "Quiz", desc: "QCM avec scoring automatique, feedback IA par question et explication détaillée.", layer: "learner" as const, actors: ["Apprenant"], tools: ["QCM", "Scoring", "Persistance"], aiRole: "Feedback et explication personnalisée par question" },
      { title: "Exercice", desc: "Production libre évaluée par l'IA selon une grille de critères configurable.", layer: "ai" as const, actors: ["Apprenant", "IA"], tools: ["Éditeur", "Grille", "Critères"], aiRole: "Évaluation multicritère avec justification détaillée" },
      { title: "Pratique IA", desc: "Simulation conversationnelle avec scoring multidimensionnel temps réel.", layer: "ai" as const, actors: ["Apprenant", "IA Coach"], tools: ["Chat", "Scoring", "Dimensions"], aiRole: "Challenge, coaching et évaluation en temps réel" },
      { title: "Score compétence", desc: "Agrégation des scores par compétence avec radar de skills et profil d'acquisition.", layer: "ai" as const, actors: ["Système"], tools: ["Radar", "Skills", "Profil"], aiRole: "Calcul du profil de compétences et recommandations" },
      { title: "Certificat & Livret", desc: "Certificat vérifiable (QR code, LinkedIn) + livret PDF complet (4-8 pages) envoyé par email.", layer: "ai" as const, actors: ["Système"], tools: ["Certificat", "PDF", "Email"], aiRole: "Génération du livret et du certificat" },
    ],
  },
  {
    icon: Workflow, title: "Flux Workshop Collaboratif", subtitle: "Du toolkit à la synthèse IA — Intelligence collective",
    steps: [
      { title: "Toolkit", desc: "Sélection d'un toolkit stratégique avec ses cartes, piliers et plans de jeu.", layer: "admin" as const, actors: ["Facilitateur"], tools: ["Toolkits", "Cartes", "Plans de jeu"] },
      { title: "Participants", desc: "Invitation des participants et configuration des équipes et des règles.", layer: "admin" as const, actors: ["Facilitateur"], tools: ["Invitations", "Équipes", "Règles"] },
      { title: "Canevas live", desc: "Atelier collaboratif temps réel avec canevas interactif, cartes, sticky notes et discussions.", layer: "learner" as const, actors: ["Participants"], tools: ["Canevas", "Cards", "Sticky Notes"], aiRole: "Coach IA contextuel" },
      { title: "Scores", desc: "Scoring individuel et collectif avec points de valorisation et classement.", layer: "ai" as const, actors: ["Système"], tools: ["Scoring", "Classement", "Badges"] },
      { title: "Synthèse IA", desc: "Rapport de synthèse automatique avec recommandations et plan d'action.", layer: "ai" as const, actors: ["IA"], tools: ["Rapport", "Recommandations", "Export"], aiRole: "Analyse des contributions et synthèse actionnable" },
    ],
  },
  {
    icon: MonitorPlay, title: "Flux Simulateur IA", subtitle: "Du briefing au rapport — 7 modes d'entraînement",
    steps: [
      { title: "Briefing", desc: "Présentation du scénario, des objectifs et des critères d'évaluation.", layer: "ai" as const, actors: ["IA"], tools: ["Scénario", "Objectifs", "KPIs"], aiRole: "Génération du briefing contextualisé" },
      { title: "Simulation", desc: "L'apprenant travaille dans le mode choisi (Analyse, Design, Code, Document, Chat, Évaluation, Décision).", layer: "learner" as const, actors: ["Apprenant"], tools: ["Éditeur", "Chat", "Timeline"] },
      { title: "Scoring", desc: "Évaluation en temps réel de la qualité des inputs avec jauge de tension et indicateurs.", layer: "ai" as const, actors: ["IA"], tools: ["Score", "Jauge", "Indicateurs"], aiRole: "Évaluation continue et feedback adaptatif" },
      { title: "Rapport", desc: "Rapport de session complet : radar de compétences, timeline des interactions, suggestions.", layer: "ai" as const, actors: ["Système"], tools: ["Rapport", "Historique", "Export"], aiRole: "Génération du rapport et recommandations de progression" },
    ],
  },
  {
    icon: PenTool, title: "Flux Personnalisation IA", subtitle: "De la configuration au contenu sur-mesure",
    steps: [
      { title: "Fonction & persona", desc: "L'administrateur crée ou sélectionne une fonction métier et un persona apprenant.", layer: "admin" as const, actors: ["Admin"], tools: ["Fonctions", "Personae", "Caractéristiques"] },
      { title: "Configuration IA", desc: "Choix du provider IA, du modèle, de la température et des prompts personnalisés.", layer: "admin" as const, actors: ["Admin"], tools: ["Providers", "Modèles", "Prompts"] },
      { title: "Génération batch", desc: "L'IA génère en batch tout le contenu nécessaire adapté à la fonction et au persona.", layer: "ai" as const, actors: ["IA Génération"], tools: ["Batch", "Queue", "Preview"], aiRole: "Génération massive de contenu personnalisé en quelques minutes" },
      { title: "Enrichissement", desc: "L'IA enrichit automatiquement avec des briefs, évaluations et Knowledge Briefs.", layer: "ai" as const, actors: ["IA Tutor"], tools: ["Brief", "Analyse", "Évaluation"], aiRole: "Enrichissement continu et personnalisation dynamique" },
      { title: "Livraison", desc: "Le contenu est livré via le portail avec navigation, IA tutor, livret PDF et certificat.", layer: "learner" as const, actors: ["Apprenant"], tools: ["Portail", "PDF", "Certificat"] },
    ],
  },
  {
    icon: Target, title: "Flux Diagnostic Stratégique", subtitle: "Du template au plan d'action — Challenge autonome",
    steps: [
      { title: "Template", desc: "Sélection d'un template de challenge parmi la bibliothèque (Maturité IA, Transformation Digitale...).", layer: "admin" as const, actors: ["Facilitateur"], tools: ["Templates", "Catalogue"] },
      { title: "Cartes", desc: "Sélection et placement des cartes stratégiques dans les slots du board par priorité.", layer: "learner" as const, actors: ["Participants"], tools: ["Board", "Drag & Drop", "Slots"] },
      { title: "Maturité", desc: "Évaluation du niveau de maturité actuel (1-5) pour chaque carte placée.", layer: "learner" as const, actors: ["Participants"], tools: ["Échelle", "Maturité", "Benchmark"] },
      { title: "Analyse IA", desc: "L'IA analyse les choix, la cohérence, les gaps et génère un rapport stratégique.", layer: "ai" as const, actors: ["IA"], tools: ["Rapport", "Score", "Gaps"], aiRole: "Analyse des choix et génération du rapport stratégique" },
      { title: "Plan d'action", desc: "Recommandations priorisées avec timeline, responsables et métriques de suivi.", layer: "ai" as const, actors: ["IA"], tools: ["Actions", "Timeline", "KPIs"], aiRole: "Génération du plan d'action et priorisation" },
    ],
  },
  {
    icon: BarChart3, title: "Flux Observabilité & Analytics", subtitle: "Du tracking à l'optimisation continue — Data-driven",
    steps: [
      { title: "Tracking", desc: "Chaque interaction est automatiquement trackée : temps passé, réponses, scores, messages IA.", layer: "admin" as const, actors: ["Système"], tools: ["Events", "Timestamps", "Metadata"] },
      { title: "Dashboard", desc: "Tableau de bord temps réel avec KPIs clés : utilisateurs actifs, complétion, scores moyens.", layer: "admin" as const, actors: ["Admin", "Manager"], tools: ["Dashboard", "Graphiques", "Filtres"] },
      { title: "Catalogue assets", desc: "Vue consolidée de tous les assets pédagogiques avec statuts et métriques d'utilisation.", layer: "admin" as const, actors: ["Admin"], tools: ["Catalogue", "Filtres", "Statuts"] },
      { title: "Matrice couverture", desc: "Matrice interactive compétences × fonctions avec identification des gaps.", layer: "ai" as const, actors: ["IA", "Admin"], tools: ["Matrice", "Heatmap", "Gaps"], aiRole: "Identification des gaps et recommandations de contenu" },
      { title: "Optimisation", desc: "L'IA analyse les patterns d'usage et recommande des optimisations.", layer: "ai" as const, actors: ["IA Analytics"], tools: ["Insights", "Recommandations", "Actions"], aiRole: "Analyse prédictive et recommandations d'optimisation" },
    ],
  },
];

const DOMAIN_CARDS = [
  {
    icon: GraduationCap, title: "RH & Formation", gradient: "from-blue-500 to-blue-700",
    painPoints: ["Les formations IA ne sont pas adaptées aux fonctions métier spécifiques", "Impossible de mesurer l'acquisition réelle de compétences après une formation", "Aucun livrable exploitable ne sort des sessions de formation traditionnelles", "Les responsables formation n'ont pas de vue consolidée sur le ROI formation"],
    solutions: ["Parcours adaptatifs par fonction avec IA tutor personnalisée à chaque étape", "Évaluation granulaire par compétence avec radar de skills et profil d'acquisition", "Livret de cours PDF complet, certificat vérifiable et cartographie des compétences", "Dashboard d'observabilité avec KPIs d'adoption, de complétion et de performance"],
    kpis: [{ value: "×3", label: "Vitesse d'upskilling" }, { value: "92%", label: "Taux de complétion" }, { value: "-70%", label: "Temps de conception" }],
    workflow: ["Fonction cible", "Génération IA", "Parcours", "Certification", "Cartographie"],
  },
  {
    icon: Briefcase, title: "Consulting & Stratégie", gradient: "from-orange-500 to-orange-700",
    painPoints: ["Les diagnostics stratégiques sont coûteux et dépendent de consultants externes", "Pas de méthodologie reproductible pour évaluer la maturité", "Les équipes ne savent pas passer de l'analyse à l'action concrète", "Les rapports d'audit restent en PDF et ne sont jamais mis à jour"],
    solutions: ["Challenges de Design Innovation avec diagnostic en autonomie et analyse IA", "Évaluation de maturité structurée avec benchmark et recommandations priorisées", "Plan d'action généré automatiquement avec priorisation IA et timeline", "Rapports dynamiques consultables en ligne avec historique des versions"],
    kpis: [{ value: "×5", label: "ROI vs consulting" }, { value: "48h", label: "Diagnostic complet" }, { value: "100%", label: "Autonomie équipe" }],
    workflow: ["Template challenge", "Cartes stratégiques", "Maturité", "Analyse IA", "Plan d'action"],
  },
  {
    icon: Lightbulb, title: "Innovation & Produit", gradient: "from-violet-500 to-violet-700",
    painPoints: ["Les ateliers d'idéation sont peu structurés et ne produisent pas de livrables actionnables", "Le design thinking reste théorique sans outil concret et digital", "L'engagement des participants chute après les premières sessions", "Impossible de tracer la contribution individuelle aux workshops"],
    solutions: ["Workshops gamifiés avec toolkits stratégiques et canevas collaboratif temps réel", "Application concrète du design thinking via les cartes, piliers et challenges", "Gamification avec points de valorisation, badges et classement", "Traçabilité complète de chaque contribution avec scoring individuel et collectif"],
    kpis: [{ value: "+85%", label: "Engagement" }, { value: "×4", label: "Idées actionnables" }, { value: "100%", label: "Traçabilité" }],
    workflow: ["Toolkit", "Workshop live", "Ideation", "Scoring", "Synthèse IA"],
  },
  {
    icon: Users, title: "Management & Leadership", gradient: "from-emerald-500 to-emerald-700",
    painPoints: ["Les managers manquent d'outils pour animer des ateliers stratégiques", "Le feedback sur les compétences est subjectif et non documenté", "Pas de méthode pour la montée en compétences individualisée", "Les entretiens annuels ne reflètent pas les compétences réellement acquises"],
    solutions: ["Ateliers d'équipe structurés avec simulateur IA et workshops collaboratifs gamifiés", "Évaluation objective par compétence avec l'IA et profils individuels détaillés", "Parcours personnalisés par persona avec suivi granulaire et recommandations IA", "Données de compétences factuelles pour les revues de performance"],
    kpis: [{ value: "+60%", label: "Productivité ateliers" }, { value: "360°", label: "Vue compétences" }, { value: "×2", label: "Rétention talents" }],
    workflow: ["Profil équipe", "Parcours ciblés", "Pratique IA", "Évaluation", "Feedback"],
  },
  {
    icon: Globe, title: "Organismes de Formation", gradient: "from-pink-500 to-pink-700",
    painPoints: ["La création de contenus pédagogiques de qualité prend des semaines", "Les formations ne sont pas personnalisables par client ou secteur", "Pas de différenciation technologique face aux concurrents", "Le suivi des apprenants entre sessions est quasi inexistant"],
    solutions: ["IA de génération batch : parcours complets créés en minutes", "Multi-tenant natif : chaque organisation a son branding et sa configuration", "Simulateur IA et workshops collaboratifs comme différenciateurs majeurs", "Portail apprenant immersif avec suivi continu et certifications"],
    kpis: [{ value: "×10", label: "Vitesse de production" }, { value: "∞", label: "Personnalisation" }, { value: "+40%", label: "Valeur perçue" }],
    workflow: ["Brief client", "Génération IA", "White-label", "Déploiement", "Suivi"],
  },
  {
    icon: Building2, title: "ESN & Cabinets de Conseil", gradient: "from-cyan-500 to-cyan-700",
    painPoints: ["Les missions de transformation IA manquent d'outils pédagogiques structurés", "Le transfert de compétences vers les équipes client est difficile", "Les diagnostics de maturité sont manuels et non reproductibles", "Pas de plateforme pour accompagner les clients entre les missions"],
    solutions: ["Parcours IA sur-mesure par fonction client avec génération automatique", "Challenges de diagnostic structurés avec analyse IA et rapports professionnels", "Plateforme de suivi inter-missions avec progression des compétences", "Workshops collaboratifs pour les ateliers de cadrage et de co-construction"],
    kpis: [{ value: "-60%", label: "Temps diagnostic" }, { value: "+80%", label: "Satisfaction client" }, { value: "×3", label: "Missions récurrentes" }],
    workflow: ["Diagnostic", "Parcours sur-mesure", "Simulation", "Certification", "Suivi continu"],
  },
  {
    icon: Award, title: "Écoles & Universités", gradient: "from-amber-500 to-amber-700",
    painPoints: ["Les cours IA deviennent obsolètes plus vite qu'ils ne sont mis à jour", "Les étudiants manquent de cas pratiques concrets", "L'évaluation des compétences IA est subjective et non standardisée", "Le gap entre théorie académique et pratique professionnelle reste trop important"],
    solutions: ["Contenu généré et mis à jour par l'IA en continu", "Simulateur 7 modes pour des cas pratiques réalistes avec feedback IA", "Évaluation standardisée par compétence avec certificats vérifiables", "Challenges et workshops reproduisant des situations professionnelles réelles"],
    kpis: [{ value: "98%", label: "Contenu à jour" }, { value: "+70%", label: "Employabilité" }, { value: "×5", label: "Pratique vs théorie" }],
    workflow: ["Cursus", "Modules IA", "Simulations", "Projets", "Certification"],
  },
  {
    icon: Rocket, title: "Startups & Scale-ups", gradient: "from-red-500 to-red-700",
    painPoints: ["Pas de budget pour des formations classiques ni de temps pour des parcours longs", "L'onboarding des nouveaux collaborateurs est chaotique", "Les équipes ont des niveaux très hétérogènes sur l'IA", "Besoin de monter en compétences vite sans sacrifier la productivité"],
    solutions: ["Parcours courts et ciblés générés par l'IA en minutes", "Onboarding structuré avec parcours adaptatifs au niveau de chacun", "Diagnostic de maturité rapide pour identifier et prioriser les besoins", "Pratique IA immédiate dans le simulateur pour un apprentissage par l'action"],
    kpis: [{ value: "24h", label: "Time-to-skill" }, { value: "-90%", label: "Coût formation" }, { value: "+50%", label: "Adoption IA" }],
    workflow: ["Diagnostic rapide", "Parcours express", "Pratique IA", "Évaluation", "Itération"],
  },
];

const CAPABILITIES = [
  { category: "Apprentissage", items: ["Parcours adaptatifs", "Leçons Markdown enrichies", "Quiz avec feedback IA", "Exercices évalués par IA", "Pratique conversationnelle IA", "Knowledge Brief personnalisé"] },
  { category: "Évaluation", items: ["Scoring multicritère", "Radar de compétences", "Évaluation globale IA", "Certificats vérifiables QR", "Livret PDF complet", "Profil de skills"] },
  { category: "Collaboration", items: ["Workshops temps réel", "Canevas drag & drop", "Toolkits stratégiques", "Gamification & scoring", "IA Coach contextuel", "Discussions par élément"] },
  { category: "Administration", items: ["Génération IA batch", "Multi-tenant & branding", "Rôles & permissions RBAC", "Crédits & facturation", "Observabilité temps réel", "Matrice de couverture"] },
  { category: "Intelligence IA", items: ["GPT & Gemini intégrés", "IA Tutor personnalisée", "IA Évaluation avancée", "IA Génération de contenu", "IA Analyse stratégique", "IA Document & livret"] },
];

function DiscoveryEssential() {
  return (
    <div>
      <AccrocheHero
        tagline="4 briques. Une seule plateforme."
        subtitle="Découvrez comment GROWTHINNOV connecte formation, pratique, collaboration et diagnostic en un écosystème cohérent propulsé par l'IA."
      />

      <SimpleFlow steps={[
        { icon: BookOpen, label: "Former", duration: "Parcours adaptatifs" },
        { icon: Sparkles, label: "Pratiquer", duration: "Simulateur 7 modes" },
        { icon: Users, label: "Collaborer", duration: "Workshops gamifiés" },
        { icon: LayoutGrid, label: "Diagnostiquer", duration: "Challenges IA" },
      ]} />

      <div className="my-10 grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="rounded-2xl border p-6">
          <h4 className="font-black text-foreground mb-4 flex items-center gap-2"><Brain className="h-5 w-5 text-primary" /> L'IA à chaque étape</h4>
          <div className="space-y-3">
            <DeliverableItem icon={PenTool} label="IA Génération" desc="Crée parcours, modules et exercices en minutes" />
            <DeliverableItem icon={MessageSquare} label="IA Tutor" desc="Accompagne, explique et challenge l'apprenant" />
            <DeliverableItem icon={CheckCircle2} label="IA Évaluation" desc="Score, analyse et recommande par compétence" />
            <DeliverableItem icon={FileText} label="IA Document" desc="Génère livrets, rapports et synthèses" />
          </div>
        </div>
        <div className="rounded-2xl border p-6">
          <h4 className="font-black text-foreground mb-4 flex items-center gap-2"><Award className="h-5 w-5 text-primary" /> Résultats concrets</h4>
          <div className="space-y-3">
            <DeliverableItem icon={Award} label="Certificats vérifiables" desc="QR code, LinkedIn et vérification publique" />
            <DeliverableItem icon={FileText} label="Livret de cours" desc="Document PDF complet envoyé par email" />
            <DeliverableItem icon={BarChart3} label="Radar de compétences" desc="Profil de skills mesurable et traçable" />
            <DeliverableItem icon={TrendingUp} label="Dashboard ROI" desc="Métriques d'impact en temps réel" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <BigStat value="6" label="Types d'IA intégrées" />
        <BigStat value="7" label="Modes de simulation" accent="text-emerald-500" />
        <BigStat value="∞" label="Organisations" />
        <BigStat value="100%" label="Traçabilité" accent="text-emerald-500" />
      </div>
    </div>
  );
}

function DiscoveryDetailed() {
  return (
    <div>
      <SectionHero icon={Network} title="Discovery" subtitle="Explorez la plateforme sous 3 perspectives : technique, business et métier" pain="Comprendre une plateforme complexe nécessite plusieurs angles de vue : architecture technique, flux business concrets et cas d'usage par domaine métier." />
      <Tabs defaultValue="architecture" className="w-full">
        <TabsList className="grid w-full grid-cols-3 mb-8">
          <TabsTrigger value="architecture" className="gap-2 text-xs sm:text-sm"><Layers className="h-4 w-4" />Architecture</TabsTrigger>
          <TabsTrigger value="workflows" className="gap-2 text-xs sm:text-sm"><Workflow className="h-4 w-4" />Workflows Business</TabsTrigger>
          <TabsTrigger value="metier" className="gap-2 text-xs sm:text-sm"><Briefcase className="h-4 w-4" />Cas Métier</TabsTrigger>
        </TabsList>
        <TabsContent value="architecture">
          <p className="text-sm text-muted-foreground mb-6 leading-relaxed">Explorez l'architecture complète de GROWTHINNOV à travers un <strong>flow interactif</strong>. Filtrez par couche logique, cliquez sur un composant pour découvrir ses fonctionnalités.</p>
          <PlatformFlow />
        </TabsContent>
        <TabsContent value="workflows">
          <div className="space-y-8">
            <div>
              <p className="text-sm text-muted-foreground mb-2 leading-relaxed">Découvrez les <strong>8 flux opérationnels clés</strong>. Cliquez sur chaque étape pour voir les acteurs, outils et le rôle de l'IA.</p>
              <div className="flex flex-wrap gap-2 mb-6">{BUSINESS_WORKFLOWS.map(w => <Badge key={w.title} variant="outline" className="text-[10px]">{w.title.replace("Flux ", "")}</Badge>)}</div>
            </div>
            <div className="space-y-5">{BUSINESS_WORKFLOWS.map(w => <BusinessWorkflow key={w.title} {...w} />)}</div>
            <div className="mt-10">
              <h3 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2"><Shield className="h-5 w-5 text-primary" />Matrice des capacités</h3>
              <Card>
                <CardContent className="p-0">
                  <div className="grid grid-cols-5 divide-x divide-border">
                    {CAPABILITIES.map(cap => (
                      <div key={cap.category} className="p-4">
                        <p className="text-xs font-bold uppercase tracking-widest text-primary mb-3">{cap.category}</p>
                        <div className="space-y-2">{cap.items.map(item => <div key={item} className="flex items-center gap-1.5"><CheckCircle2 className="h-3 w-3 text-primary shrink-0" /><span className="text-[11px] text-foreground/80">{item}</span></div>)}</div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>
        <TabsContent value="metier">
          <div className="space-y-8">
            <div>
              <p className="text-sm text-muted-foreground mb-2 leading-relaxed">Explorez les <strong>8 cas d'usage concrets</strong> par domaine métier.</p>
              <div className="flex flex-wrap gap-2 mb-6">{DOMAIN_CARDS.map(d => <Badge key={d.title} variant="outline" className="text-[10px]">{d.title}</Badge>)}</div>
            </div>
            <div className="space-y-4">{DOMAIN_CARDS.map(d => <DomainCard key={d.title} {...d} />)}</div>
            <ValueProp>Quelle que soit votre industrie ou votre taille, GROWTHINNOV s'adapte à vos enjeux avec des <strong>parcours personnalisés par fonction</strong>, une <strong>IA qui apprend de votre contexte</strong> et des <strong>métriques d'impact concrètes</strong>.</ValueProp>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatCard icon={Brain} value="6" label="Types d'IA intégrées" />
              <StatCard icon={Layers} value="7" label="Modes de simulation" />
              <StatCard icon={Users} value="∞" label="Organisations supportées" />
              <StatCard icon={Award} value="100%" label="Certificats vérifiables" />
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function DiscoverySection() {
  return <SectionTabs essential={<DiscoveryEssential />} detailed={<DiscoveryDetailed />} />;
}

/* ─── 8. DÉCIDEURS ─── */
function UseCaseCard({ persona, pain, solution, result, color }: { persona: string; pain: string; solution: string; result: string; color: string }) {
  return (
    <Card className={cn("overflow-hidden border-l-4", color)}>
      <CardContent className="p-5 space-y-3">
        <Badge variant="outline" className="text-[10px] font-bold">{persona}</Badge>
        <div className="space-y-2">
          <div className="flex items-start gap-2"><Target className="h-4 w-4 text-destructive shrink-0 mt-0.5" /><p className="text-xs text-muted-foreground"><strong className="text-foreground">Problème :</strong> {pain}</p></div>
          <div className="flex items-start gap-2"><Lightbulb className="h-4 w-4 text-primary shrink-0 mt-0.5" /><p className="text-xs text-muted-foreground"><strong className="text-foreground">Solution :</strong> {solution}</p></div>
          <div className="flex items-start gap-2"><TrendingUp className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" /><p className="text-xs text-muted-foreground"><strong className="text-foreground">Résultat :</strong> {result}</p></div>
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

function DecideursEssential() {
  return (
    <div>
      <AccrocheHero
        tagline="Investissez dans les compétences, pas dans les slides."
        subtitle="Un ROI formation mesurable dès le premier parcours. Des métriques concrètes pour chaque euro investi."
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
        <BigStat value="×3" label="Vitesse d'acquisition" />
        <BigStat value="-70%" label="Coûts de création" accent="text-emerald-500" />
        <BigStat value="92%" label="Complétion moyenne" />
        <BigStat value="×5" label="ROI vs consulting" accent="text-emerald-500" />
      </div>

      {/* ROI Calculator simplifié */}
      <Card className="mb-10">
        <CardContent className="p-6 text-center">
          <DollarSign className="h-8 w-8 text-primary mx-auto mb-3" />
          <h3 className="text-lg font-black text-foreground mb-3">Calculez votre économie</h3>
          <div className="grid grid-cols-3 gap-6 max-w-lg mx-auto">
            <div>
              <p className="text-3xl font-black text-foreground">100</p>
              <p className="text-xs text-muted-foreground">apprenants</p>
            </div>
            <div>
              <p className="text-3xl font-black text-foreground">×500€</p>
              <p className="text-xs text-muted-foreground">coût moyen/formation</p>
            </div>
            <div>
              <p className="text-3xl font-black text-emerald-500">= 35K€</p>
              <p className="text-xs text-muted-foreground">économie/an</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <BeforeAfter
        before={{
          title: "LMS classique",
          items: [
            "Contenu statique identique pour tous",
            "Aucune IA intégrée ou juste un chatbot basique",
            "Pas de simulateur, pas de workshops",
            "Certificat = simple PDF sans vérification",
            "Création de contenu 100% manuelle",
          ],
        }}
        after={{
          title: "GROWTHINNOV",
          items: [
            "Parcours adaptatif par fonction avec IA tutor",
            "6 types d'IA intégrés à chaque étape",
            "Simulateur 7 modes + workshops collaboratifs gamifiés",
            "Certificat vérifiable QR code + LinkedIn",
            "Génération IA batch en quelques minutes",
          ],
        }}
      />

      <div className="my-10 grid grid-cols-1 md:grid-cols-2 gap-4">
        <ScenarioCard persona="Marie" role="DRH — Groupe industriel 2000 salariés" story="Marie déploie le programme IA en 3 semaines pour 500 collaborateurs. Le dashboard lui montre 92% de complétion et une cartographie des compétences par département. Le COMEX a ses métriques pour le plan stratégique." color="border-l-primary" />
        <ScenarioCard persona="David" role="CDO — Scale-up tech 200 personnes" story="David utilise les challenges pour un diagnostic de maturité IA en 30 minutes au lieu de 3 semaines avec un cabinet. Le simulateur permet aux équipes de pratiquer l'analyse stratégique avec du feedback IA instantané." color="border-l-accent" />
      </div>

      <div className="rounded-2xl bg-gradient-to-br from-primary/10 via-accent/5 to-primary/10 border-2 border-primary/20 p-8 text-center">
        <Compass className="h-10 w-10 text-primary mx-auto mb-3" />
        <h3 className="text-xl font-black text-foreground mb-2">Prêt à transformer vos formations ?</h3>
        <p className="text-sm text-muted-foreground mb-5 max-w-md mx-auto">Découvrez comment GROWTHINNOV peut accélérer la montée en compétences de vos équipes avec un ROI mesurable.</p>
        <Button size="lg" className="gap-2"><Rocket className="h-4 w-4" /> Demander une démo</Button>
      </div>
    </div>
  );
}

function DecideursDetailed() {
  return (
    <div>
      <SectionHero icon={Compass} title="Pour les décideurs" subtitle="ROI, cas d'usage concrets et avantages compétitifs" pain="Investir dans une plateforme de formation sans garantie de résultats mesurables, d'adoption par les équipes ni de retour sur investissement tangible." />
      <h3 className="text-lg font-bold text-foreground mb-4">Impact mesurable</h3>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
        <StatCard icon={TrendingUp} value="×3" label="Vitesse d'acquisition des compétences" />
        <StatCard icon={Clock} value="-70%" label="Temps de création de parcours" />
        <StatCard icon={Award} value="92%" label="Taux de complétion moyen" />
        <StatCard icon={DollarSign} value="×5" label="ROI formation vs. consulting" />
      </div>
      <h3 className="text-lg font-bold text-foreground mb-4">Cas d'usage par profil</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-10">
        <UseCaseCard persona="DRH / Responsable Formation" pain="Formations génériques avec 0% de visibilité sur les compétences acquises." solution="Parcours adaptatifs par fonction avec suivi granulaire par compétence et certificats vérifiables." result="Cartographie complète des compétences IA, ROI formation documenté." color="border-l-primary" />
        <UseCaseCard persona="Directeur Innovation / CDO" pain="Les équipes ne savent pas appliquer l'IA à leurs métiers." solution="Simulateur IA avec 7 modes + Challenges de diagnostic stratégique autonome." result="Équipes capables de mener des audits IA en autonomie." color="border-l-accent" />
        <UseCaseCard persona="Manager / Chef de projet" pain="Pas d'outil pour animer des ateliers stratégiques structurés." solution="Workshops collaboratifs gamifiés avec toolkits stratégiques et canevas interactif." result="Ateliers productifs avec livrables exploitables." color="border-l-emerald-500" />
        <UseCaseCard persona="Consultant / Formateur" pain="Créer un parcours complet prend des semaines." solution="IA de génération batch : parcours, modules, quiz, exercices créés en minutes." result="Catalogue de formations sur-mesure en quelques heures." color="border-l-orange-500" />
      </div>
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
      <div className="rounded-2xl bg-gradient-to-br from-primary/10 via-accent/5 to-primary/10 border-2 border-primary/20 p-8 text-center">
        <Compass className="h-10 w-10 text-primary mx-auto mb-3" />
        <h3 className="text-xl font-black text-foreground mb-2">Prêt à transformer vos formations ?</h3>
        <p className="text-sm text-muted-foreground mb-5 max-w-md mx-auto">Découvrez comment GROWTHINNOV peut accélérer la montée en compétences de vos équipes avec un ROI mesurable dès le premier parcours.</p>
        <Button size="lg" className="gap-2"><Rocket className="h-4 w-4" /> Demander une démo</Button>
      </div>
    </div>
  );
}

function DecideursSection() {
  return <SectionTabs essential={<DecideursEssential />} detailed={<DecideursDetailed />} />;
}

/* ─── 9. PARTENAIRES ─── */
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
        <div className="space-y-2">{benefits.map((b) => <div key={b} className="flex items-center gap-2"><CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" /><span className="text-xs text-foreground/70">{b}</span></div>)}</div>
      </CardContent>
    </Card>
  );
}

function PartenairesEssential() {
  return (
    <div>
      <AccrocheHero
        tagline="Lancez votre offre augmentée en 2 semaines."
        subtitle="Proposez à vos clients une expérience de formation IA unique — sous votre marque, avec vos contenus, à votre rythme."
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        <div className="rounded-2xl border bg-gradient-to-br from-primary/10 to-primary/5 p-6 text-center">
          <Building2 className="h-10 w-10 text-primary mx-auto mb-3" />
          <h4 className="font-black text-foreground mb-2">Revendeur</h4>
          <p className="text-sm text-muted-foreground">White-label complet sous votre marque avec revenus récurrents.</p>
        </div>
        <div className="rounded-2xl border bg-gradient-to-br from-accent/10 to-accent/5 p-6 text-center">
          <Puzzle className="h-10 w-10 text-accent mx-auto mb-3" />
          <h4 className="font-black text-foreground mb-2">Intégrateur</h4>
          <p className="text-sm text-muted-foreground">API REST, SSO, webhooks pour enrichir votre écosystème.</p>
        </div>
        <div className="rounded-2xl border bg-gradient-to-br from-emerald-500/10 to-emerald-500/5 p-6 text-center">
          <HeartHandshake className="h-10 w-10 text-emerald-500 mx-auto mb-3" />
          <h4 className="font-black text-foreground mb-2">Co-créateur</h4>
          <p className="text-sm text-muted-foreground">Revenue share sur vos toolkits et parcours thématiques.</p>
        </div>
      </div>

      <SimpleFlow steps={[
        { icon: Settings, label: "Onboarding", duration: "Quelques heures" },
        { icon: Brain, label: "Génération IA", duration: "Vos premiers parcours" },
        { icon: Users, label: "Formation équipe", duration: "1-2 jours" },
        { icon: Rocket, label: "Lancement", duration: "Go live" },
      ]} />

      <div className="my-10">
        <ScenarioCard
          persona="Nathalie"
          role="Directrice — Organisme de formation certifié"
          story="Nathalie proposait des formations Excel et PowerPoint. En 2 semaines avec GROWTHINNOV, elle a lancé un catalogue de 12 formations IA sous sa marque. Le simulateur et les certifications vérifiables lui permettent de facturer 3× plus cher. Ses clients redemandent."
          color="border-l-emerald-500"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <BigStat value="2 sem." label="Time-to-market" />
        <BigStat value="×3" label="Valeur ajoutée" accent="text-emerald-500" />
        <BigStat value="∞" label="Scalabilité" />
      </div>

      <div className="mt-10 rounded-2xl bg-gradient-to-br from-emerald-500/10 via-primary/5 to-accent/10 border-2 border-emerald-500/20 p-8 text-center">
        <Handshake className="h-10 w-10 text-emerald-500 mx-auto mb-3" />
        <h3 className="text-xl font-black text-foreground mb-2">Rejoignez l'écosystème</h3>
        <p className="text-sm text-muted-foreground mb-5 max-w-md mx-auto">Explorons ensemble comment intégrer GROWTHINNOV dans votre offre.</p>
        <Button size="lg" className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white"><HeartHandshake className="h-4 w-4" /> Devenir partenaire</Button>
      </div>
    </div>
  );
}

function PartenairesDetailed() {
  return (
    <div>
      <SectionHero icon={Handshake} title="Partenaires" subtitle="Intégration, co-création et modèle de revenus partagé" pain="Les partenaires de formation manquent d'outils technologiques différenciants pour enrichir leur offre et fidéliser leurs clients." />
      <h3 className="text-lg font-bold text-foreground mb-4">Vos défis, nos solutions</h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
        <PainCard icon={Puzzle} title="Offre commoditisée" desc="Difficile de se différencier face aux LMS génériques et aux formations en ligne standardisées." />
        <PainCard icon={Repeat} title="Pas de récurrence" desc="Les prestations ponctuelles ne génèrent pas de revenus récurrents ni de fidélisation durable." />
        <PainCard icon={Globe} title="Scalabilité limitée" desc="Impossible de multiplier les formations sans multiplier proportionnellement les ressources humaines." />
      </div>
      <h3 className="text-lg font-bold text-foreground mb-4">3 modèles de partenariat</h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
        <PartnerModelCard icon={Building2} title="Revendeur" desc="Proposez GROWTHINNOV sous votre marque avec un modèle de revenus récurrent." benefits={["White-label complet", "Marge sur abonnements", "Support technique inclus", "Formation commerciale"]} color="border-t-primary" />
        <PartnerModelCard icon={Puzzle} title="Intégrateur" desc="Intégrez GROWTHINNOV dans vos dispositifs de formation existants via API." benefits={["API REST complète", "SSO et provisioning", "Webhooks événementiels", "SDK JavaScript"]} color="border-t-accent" />
        <PartnerModelCard icon={HeartHandshake} title="Co-créateur" desc="Co-développez des toolkits et parcours thématiques pour vos secteurs d'expertise." benefits={["Toolkits sur-mesure", "Revenue share sur contenu", "Co-branding", "Accès IA de génération"]} color="border-t-emerald-500" />
      </div>
      <h3 className="text-lg font-bold text-foreground mb-4">Parcours d'intégration</h3>
      <div className="ml-2 mb-10">
        <WorkflowStep step={1} title="Onboarding technique" desc="Configuration du tenant, branding, SSO et provisioning des utilisateurs en quelques heures." />
        <WorkflowStep step={2} title="Création du catalogue" desc="L'IA génère vos premiers parcours à partir de vos contenus et expertises métier existants." />
        <WorkflowStep step={3} title="Formation des équipes" desc="Vos formateurs et facilitateurs maîtrisent le simulateur, les workshops et les challenges." />
        <WorkflowStep step={4} title="Lancement & itération" desc="Déploiement auprès de vos clients avec suivi d'adoption, métriques et optimisation continue." isLast />
      </div>
      <h3 className="text-lg font-bold text-foreground mb-4">Avantages techniques</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-10">
        <FeatureCard icon={ShieldCheck} title="Multi-tenant natif" desc="Chaque organisation est isolée avec son branding, ses données et sa configuration IA propre." badges={["Isolation", "RGPD"]} />
        <FeatureCard icon={Zap} title="IA de génération batch" desc="Créez des centaines de modules en quelques minutes à partir de descriptions métier." badges={["GPT", "Gemini", "Batch"]} />
        <FeatureCard icon={BarChart3} title="Observabilité partenaire" desc="Dashboard consolidé multi-organisations avec métriques d'adoption et de satisfaction." badges={["Analytics", "Export"]} />
        <FeatureCard icon={Globe} title="API & Webhooks" desc="Intégration complète avec vos outils existants : LMS, SIRH, CRM, outils de reporting." badges={["REST", "Webhooks", "SSO"]} />
      </div>
      <ValueProp>Devenez partenaire GROWTHINNOV et offrez à vos clients une <strong>expérience de formation augmentée par l'IA</strong> qui vous différencie durablement — avec un modèle de revenus récurrent et une scalabilité sans limites.</ValueProp>
      <div className="rounded-2xl bg-gradient-to-br from-emerald-500/10 via-primary/5 to-accent/10 border-2 border-emerald-500/20 p-8 text-center mt-8">
        <Handshake className="h-10 w-10 text-emerald-500 mx-auto mb-3" />
        <h3 className="text-xl font-black text-foreground mb-2">Rejoignez l'écosystème</h3>
        <p className="text-sm text-muted-foreground mb-5 max-w-md mx-auto">Explorons ensemble comment intégrer GROWTHINNOV dans votre offre et créer de la valeur pour vos clients.</p>
        <Button size="lg" className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white"><HeartHandshake className="h-4 w-4" /> Devenir partenaire</Button>
      </div>
    </div>
  );
}

function PartenairesSection() {
  return <SectionTabs essential={<PartenairesEssential />} detailed={<PartenairesDetailed />} />;
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
