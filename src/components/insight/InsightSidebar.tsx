import { cn } from "@/lib/utils";
import {
  Rocket, BookOpen, Sparkles, Users, LayoutGrid, Shield, Layers,
  ChevronDown, ChevronRight
} from "lucide-react";
import { useState } from "react";

interface InsightSidebarProps {
  activeSection: string;
  onSectionChange: (section: string) => void;
}

const MENU = [
  {
    id: "overview",
    label: "Vue d'ensemble",
    icon: Rocket,
    sub: [],
  },
  {
    id: "formations",
    label: "Formations",
    icon: BookOpen,
    sub: [
      "Parcours adaptatifs",
      "Modules pédagogiques",
      "IA Tutor",
      "Évaluations & Certificats",
    ],
  },
  {
    id: "pratique",
    label: "Pratique",
    icon: Sparkles,
    sub: [
      "Simulateur IA",
      "Modes & Scénarios",
      "Scoring & Rapports",
    ],
  },
  {
    id: "workshops",
    label: "Workshops",
    icon: Users,
    sub: [
      "Toolkits & Cartes",
      "Canevas collaboratif",
      "Gamification",
    ],
  },
  {
    id: "challenges",
    label: "Challenges",
    icon: LayoutGrid,
    sub: [
      "Diagnostic stratégique",
      "Analyse IA",
      "Maturité",
    ],
  },
  {
    id: "plateforme",
    label: "Plateforme",
    icon: Shield,
    sub: [
      "Portail immersif",
      "Administration",
      "IA de génération",
    ],
  },
  {
    id: "discovery",
    label: "Discovery",
    icon: Layers,
    sub: [
      "Couche Apprenant",
      "Couche IA",
      "Couche Admin",
      "Couche Data",
    ],
  },
];

export function InsightSidebar({ activeSection, onSectionChange }: InsightSidebarProps) {
  const [expanded, setExpanded] = useState<string | null>(activeSection);

  return (
    <aside className="w-60 shrink-0 border-r border-border/50 bg-card/50 h-full overflow-y-auto">
      <div className="px-4 py-5">
        <p className="text-[11px] font-bold text-muted-foreground tracking-widest uppercase mb-4">
          DÉCOUVRIR
        </p>
        <nav className="space-y-1">
          {MENU.map((item) => {
            const active = activeSection === item.id;
            const Icon = item.icon;
            const isExpanded = expanded === item.id;
            const hasSub = item.sub.length > 0;

            return (
              <div key={item.id}>
                <button
                  onClick={() => {
                    onSectionChange(item.id);
                    setExpanded(isExpanded ? null : item.id);
                  }}
                  className={cn(
                    "flex items-center gap-3 w-full rounded-lg px-3 h-10 text-sm font-medium transition-colors",
                    active
                      ? "bg-primary/8 text-primary"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/40"
                  )}
                >
                  <Icon className="h-4.5 w-4.5 shrink-0" />
                  <span className="flex-1 text-left truncate">{item.label}</span>
                  {hasSub && (
                    isExpanded
                      ? <ChevronDown className="h-3.5 w-3.5 shrink-0" />
                      : <ChevronRight className="h-3.5 w-3.5 shrink-0" />
                  )}
                </button>
                {hasSub && isExpanded && (
                  <div className="ml-7 mt-0.5 mb-1 space-y-0.5">
                    {item.sub.map((sub) => (
                      <div
                        key={sub}
                        className="text-xs text-muted-foreground/70 px-3 py-1.5 rounded-md"
                      >
                        {sub}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </nav>
      </div>
    </aside>
  );
}
