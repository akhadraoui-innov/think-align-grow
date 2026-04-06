import { Link, useLocation } from "react-router-dom";
import {
  BookOpen, Award, Sparkles, History,
  Users, LayoutGrid, PanelLeftClose, PanelLeftOpen,
  Route, Building2, Layers, GraduationCap, Map, Briefcase,
  Brain, Megaphone, BarChart3, Library, Rocket, Shield, Compass, Handshake, Lightbulb
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useActiveOrg } from "@/contexts/OrgContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface PortalSidebarProps {
  open: boolean;
  onToggle: () => void;
  activeTab: string;
}

const SIDEBAR_CONFIGS: Record<string, { title: string; items: { icon: any; label: string; path: string }[] }> = {
  "/portal": {
    title: "FORMATIONS",
    items: [
      { icon: BookOpen, label: "Catalogue", path: "/portal" },
      { icon: Route, label: "Mes parcours", path: "/portal/dashboard" },
      { icon: Award, label: "Certificats", path: "/portal/certificates" },
    ],
  },
  "/portal/pratique": {
    title: "PRATIQUE",
    items: [
      { icon: Sparkles, label: "Catalogue", path: "/portal/pratique" },
      { icon: History, label: "Historique", path: "/portal/pratique/history" },
    ],
  },
  "/portal/workshops": {
    title: "WORKSHOPS",
    items: [
      { icon: Users, label: "Mes workshops", path: "/portal/workshops" },
      { icon: Layers, label: "Toolkits", path: "/portal/workshops/toolkits" },
    ],
  },
  "/portal/challenges": {
    title: "CHALLENGES",
    items: [
      { icon: LayoutGrid, label: "Mes challenges", path: "/portal/challenges" },
    ],
  },
  "/portal/academie": {
    title: "ACADEMIE",
    items: [
      { icon: GraduationCap, label: "Vue d'ensemble", path: "/portal/academie" },
      { icon: Map, label: "Cartographie", path: "/portal/academie/map" },
      { icon: Briefcase, label: "Fonctions", path: "/portal/academie/functions" },
      { icon: Brain, label: "Personae", path: "/portal/academie/personae" },
      { icon: Route, label: "Parcours", path: "/portal/academie/paths" },
      { icon: Megaphone, label: "Campagnes", path: "/portal/academie/campaigns" },
      { icon: BarChart3, label: "Suivi", path: "/portal/academie/tracking" },
      { icon: Library, label: "Actifs pédagogiques", path: "/portal/academie/assets" },
      { icon: Award, label: "Certificats", path: "/portal/academie/certificates" },
    ],
  },
  "/portal/ucm": {
    title: "AI VALUE BUILDER",
    items: [
      { icon: Lightbulb, label: "Projets", path: "/portal/ucm" },
      { icon: Layers, label: "UC Explorer", path: "/portal/ucm/explorer" },
    ],
  },
  "/portal/insight": {
    title: "INSIGHT",
    items: [
      { icon: Rocket, label: "Vue d'ensemble", path: "/portal/insight" },
      { icon: BookOpen, label: "Formations", path: "/portal/insight/formations" },
      { icon: Sparkles, label: "Pratique", path: "/portal/insight/pratique" },
      { icon: Users, label: "Workshops", path: "/portal/insight/workshops" },
      { icon: LayoutGrid, label: "Challenges", path: "/portal/insight/challenges" },
      { icon: Shield, label: "Plateforme", path: "/portal/insight/plateforme" },
      { icon: Layers, label: "Discovery", path: "/portal/insight/discovery" },
      { icon: Compass, label: "Décideurs", path: "/portal/insight/decideurs" },
      { icon: Handshake, label: "Partenaires", path: "/portal/insight/partenaires" },
    ],
  },
};

export function PortalSidebar({ open, onToggle, activeTab }: PortalSidebarProps) {
  const location = useLocation();
  const config = SIDEBAR_CONFIGS[activeTab] || SIDEBAR_CONFIGS["/portal"];
  const { activeOrg } = useActiveOrg();

  const { data: orgDetails } = useQuery({
    queryKey: ["portal-org-details", activeOrg?.organization_id],
    enabled: !!activeOrg?.organization_id,
    queryFn: async () => {
      const { data } = await supabase
        .from("organizations")
        .select("name, logo_url, primary_color")
        .eq("id", activeOrg!.organization_id)
        .single();
      return data;
    },
  });

  return (
    <aside
      className={cn(
        "border-r border-border/50 bg-card/50 flex flex-col transition-all duration-200 shrink-0 h-[calc(100vh-3.5rem)]",
        open ? "w-60" : "w-16"
      )}
    >
      {/* Organisation block — always visible at top */}
      {activeOrg && (
        <div className={cn("border-b border-border/50 p-3", open ? "px-4 py-4" : "px-2 py-3")}>
          <div className={cn(
            "flex items-center gap-3",
            open ? "" : "justify-center"
          )}>
            {orgDetails?.logo_url ? (
              <img
                src={orgDetails.logo_url}
                alt={activeOrg.org_name}
                className={cn(
                  "rounded-lg object-contain shrink-0",
                  open ? "h-10 w-10" : "h-9 w-9"
                )}
              />
            ) : (
              <div className={cn(
                "rounded-lg bg-primary/10 flex items-center justify-center shrink-0",
                open ? "h-10 w-10" : "h-9 w-9"
              )}>
                <Building2 className="h-5 w-5 text-primary" />
              </div>
            )}
            {open && (
              <span className="text-sm font-bold text-foreground truncate leading-tight">
                {activeOrg.org_name}
              </span>
            )}
          </div>
        </div>
      )}

      {/* Section title */}
      <div className={cn("flex items-center h-12 px-4", open ? "justify-between" : "justify-center")}>
        {open && (
          <p className="text-[11px] font-bold text-muted-foreground tracking-widest uppercase">{config.title}</p>
        )}
        <button
          onClick={onToggle}
          className="h-8 w-8 rounded-md flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
        >
          {open ? <PanelLeftClose className="h-4 w-4" /> : <PanelLeftOpen className="h-4 w-4" />}
        </button>
      </div>

      {/* Nav items */}
      <nav className="flex-1 px-3 py-1 space-y-1">
        {config.items.map((item) => {
          const active = location.pathname === item.path;
          const Icon = item.icon;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                "flex items-center gap-3 rounded-lg transition-colors h-11",
                open ? "px-3" : "justify-center px-0",
                active
                  ? "bg-primary/8 text-primary"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/40"
              )}
            >
              <Icon className="h-5 w-5 shrink-0" />
              {open && <span className="text-sm font-medium truncate">{item.label}</span>}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
