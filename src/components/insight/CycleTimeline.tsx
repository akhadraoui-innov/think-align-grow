import { useState } from "react";
import { cn } from "@/lib/utils";
import { ChevronDown, ChevronRight, ArrowDown, Sparkles, GraduationCap, ClipboardCheck, BookOpen, Brain, Settings } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

/* ═══════════════ TYPES ═══════════════ */

export type ActorType = "ai-gen" | "ai-tutor" | "ai-eval" | "ai-know" | "ai-skill" | "system";

export interface SubCard {
  title: string;
  content: string;
}

export interface StepBadge {
  text: string;
  variant: "default" | "secondary" | "outline" | "destructive";
}

export interface CycleStep {
  label: string;
  actorType: ActorType;
  badges: StepBadge[];
  description: string;
  detail?: string;
  subCards?: SubCard[];
  cascadeTags?: string[];
}

export interface CyclePhase {
  number: string;
  title: string;
  subtitle: string;
  color: string;
  steps: CycleStep[];
}

export interface CycleMetric {
  value: string;
  label: string;
  accent?: string;
}

export interface CycleLegendItem {
  type: ActorType;
  label: string;
}

export interface CycleData {
  title: string;
  subtitle: string;
  legend: CycleLegendItem[];
  phases: CyclePhase[];
  metrics: CycleMetric[];
  footerTags?: string[];
}

/* ═══════════════ ACTOR COLORS ═══════════════ */

const actorConfig: Record<ActorType, { color: string; bg: string; icon: any; label: string }> = {
  "ai-gen":   { color: "text-violet-600",  bg: "bg-violet-500",  icon: Sparkles,        label: "IA Génération" },
  "ai-tutor": { color: "text-blue-600",    bg: "bg-blue-500",    icon: GraduationCap,   label: "IA Tuteur" },
  "ai-eval":  { color: "text-amber-600",   bg: "bg-amber-500",   icon: ClipboardCheck,  label: "IA Évaluation" },
  "ai-know":  { color: "text-emerald-600", bg: "bg-emerald-500", icon: BookOpen,         label: "IA Knowledge" },
  "ai-skill": { color: "text-rose-600",    bg: "bg-rose-500",    icon: Brain,            label: "IA Compétences" },
  "system":   { color: "text-slate-600",   bg: "bg-slate-500",   icon: Settings,         label: "Action système" },
};

/* ═══════════════ LEGEND ═══════════════ */

function Legend({ items }: { items: CycleLegendItem[] }) {
  return (
    <div className="flex flex-wrap gap-4 mb-8 p-4 rounded-xl bg-muted/50 border">
      {items.map((item) => {
        const config = actorConfig[item.type];
        return (
          <div key={item.type} className="flex items-center gap-2">
            <div className={cn("h-3 w-3 rounded-full", config.bg)} />
            <span className="text-xs font-semibold text-muted-foreground">{item.label}</span>
          </div>
        );
      })}
    </div>
  );
}

/* ═══════════════ STEP CARD ═══════════════ */

function StepCard({ step }: { step: CycleStep }) {
  const [open, setOpen] = useState(false);
  const config = actorConfig[step.actorType];
  const hasExpandable = step.detail || step.subCards || step.cascadeTags;

  return (
    <div className="relative pl-8 pb-6 last:pb-0">
      {/* Timeline dot */}
      <div className={cn("absolute left-0 top-1.5 h-4 w-4 rounded-full border-2 border-background shadow-md z-10", config.bg)} />

      <div
        className={cn(
          "rounded-xl border bg-card transition-all",
          hasExpandable && "cursor-pointer hover:shadow-md",
          open && "shadow-md ring-1 ring-primary/10"
        )}
        onClick={() => hasExpandable && setOpen(!open)}
      >
        <div className="p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap mb-1.5">
                <span className={cn("text-xs font-black uppercase tracking-wider", config.color)}>
                  {config.label}
                </span>
                {step.badges.map((b, i) => (
                  <Badge key={i} variant={b.variant} className="text-[10px] px-2 py-0">
                    {b.text}
                  </Badge>
                ))}
              </div>
              <h4 className="font-bold text-sm text-foreground leading-snug">{step.label}</h4>
              <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{step.description}</p>
            </div>
            {hasExpandable && (
              <div className="shrink-0 mt-1">
                {open ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
              </div>
            )}
          </div>
        </div>

        {open && (
          <div className="border-t px-4 pb-4 pt-3 space-y-3 bg-muted/30 rounded-b-xl animate-in slide-in-from-top-1 duration-200">
            {step.detail && (
              <p className="text-xs text-muted-foreground leading-relaxed whitespace-pre-line">{step.detail}</p>
            )}
            {step.subCards && step.subCards.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {step.subCards.map((sc, i) => (
                  <div key={i} className="rounded-lg border bg-background p-3">
                    <p className="text-[11px] font-bold text-foreground mb-1">{sc.title}</p>
                    <p className="text-[10px] text-muted-foreground leading-relaxed">{sc.content}</p>
                  </div>
                ))}
              </div>
            )}
            {step.cascadeTags && (
              <div className="flex flex-wrap gap-1.5">
                {step.cascadeTags.map((tag, i) => (
                  <span key={i} className="inline-flex items-center rounded-md bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

/* ═══════════════ PHASE BLOCK ═══════════════ */

function PhaseBlock({ phase }: { phase: CyclePhase }) {
  return (
    <div className="relative">
      {/* Phase header */}
      <div className="flex items-center gap-4 mb-6">
        <div className={cn("h-12 w-12 rounded-2xl flex items-center justify-center text-white font-black text-lg shadow-lg", phase.color)}>
          {phase.number}
        </div>
        <div>
          <h3 className="text-lg font-black text-foreground tracking-tight">{phase.title}</h3>
          <p className="text-xs text-muted-foreground">{phase.subtitle}</p>
        </div>
      </div>

      {/* Timeline rail + steps */}
      <div className="relative ml-[7px] border-l-2 border-border/60 pl-0">
        {phase.steps.map((step, i) => (
          <StepCard key={i} step={step} />
        ))}
      </div>
    </div>
  );
}

/* ═══════════════ PHASE ARROW ═══════════════ */

function PhaseArrow() {
  return (
    <div className="flex justify-center py-4">
      <div className="h-10 w-10 rounded-full bg-gradient-to-b from-primary/20 to-primary/5 border border-primary/20 flex items-center justify-center">
        <ArrowDown className="h-5 w-5 text-primary" />
      </div>
    </div>
  );
}

/* ═══════════════ METRICS FOOTER ═══════════════ */

function MetricsFooter({ metrics }: { metrics: CycleMetric[] }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
      {metrics.map((m, i) => (
        <div key={i} className="text-center p-5 rounded-2xl border bg-gradient-to-br from-card to-muted/30">
          <p className={cn("text-3xl font-black tracking-tight", m.accent || "text-primary")}>{m.value}</p>
          <p className="text-[11px] text-muted-foreground mt-1 font-semibold uppercase tracking-wide">{m.label}</p>
        </div>
      ))}
    </div>
  );
}

/* ═══════════════ CASCADE TAGS ═══════════════ */

function CascadeTags({ tags }: { tags: string[] }) {
  return (
    <div className="mt-6 p-4 rounded-xl bg-muted/50 border">
      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2">Stack technique</p>
      <div className="flex flex-wrap gap-1.5">
        {tags.map((tag, i) => (
          <span key={i} className="inline-flex items-center rounded-md bg-primary/10 px-2.5 py-1 text-[11px] font-semibold text-primary">
            {tag}
          </span>
        ))}
      </div>
    </div>
  );
}

/* ═══════════════ MAIN COMPONENT ═══════════════ */

export function CycleTimeline({ data }: { data: CycleData }) {
  return (
    <div className="space-y-2">
      {/* Header */}
      <div className="text-center mb-8">
        <h2 className="text-2xl md:text-3xl font-black text-foreground tracking-tight mb-2">{data.title}</h2>
        <p className="text-sm text-muted-foreground max-w-2xl mx-auto">{data.subtitle}</p>
      </div>

      {/* Legend */}
      <Legend items={data.legend} />

      {/* Phases */}
      {data.phases.map((phase, i) => (
        <div key={i}>
          <PhaseBlock phase={phase} />
          {i < data.phases.length - 1 && <PhaseArrow />}
        </div>
      ))}

      {/* Metrics */}
      {data.metrics.length > 0 && <MetricsFooter metrics={data.metrics} />}

      {/* Footer tags */}
      {data.footerTags && data.footerTags.length > 0 && <CascadeTags tags={data.footerTags} />}
    </div>
  );
}
