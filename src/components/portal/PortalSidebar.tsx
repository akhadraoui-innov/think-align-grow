import { Link, useLocation } from "react-router-dom";
import {
  BookOpen, Award, Sparkles, History,
  Users, LayoutGrid, PanelLeftClose, PanelLeftOpen,
  LayoutDashboard, Route, Building2
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
    title: "Formations",
    items: [
      { icon: BookOpen, label: "Catalogue", path: "/portal" },
      { icon: Route, label: "Mes parcours", path: "/portal/dashboard" },
      { icon: Award, label: "Certificats", path: "/portal/certificates" },
    ],
  },
  "/portal/pratique": {
    title: "Pratique",
    items: [
      { icon: Sparkles, label: "Catalogue", path: "/portal/pratique" },
      { icon: History, label: "Historique", path: "/portal/pratique/history" },
    ],
  },
  "/portal/workshops": {
    title: "Workshops",
    items: [
      { icon: Users, label: "Mes workshops", path: "/portal/workshops" },
    ],
  },
  "/portal/challenges": {
    title: "Challenges",
    items: [
      { icon: LayoutGrid, label: "Mes challenges", path: "/portal/challenges" },
    ],
  },
};

export function PortalSidebar({ open, onToggle, activeTab }: PortalSidebarProps) {
  const location = useLocation();
  const config = SIDEBAR_CONFIGS[activeTab] || SIDEBAR_CONFIGS["/portal"];
  const { activeOrg } = useActiveOrg();

  // Fetch org details (logo_url) if we have an active org
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
        "border-r border-border/50 bg-card/50 flex flex-col transition-all duration-200 shrink-0",
        open ? "w-56" : "w-14"
      )}
    >
      {/* Header */}
      <div className={cn("flex items-center h-12 px-3", open ? "justify-between" : "justify-center")}>
        {open && (
          <p className="text-[11px] font-semibold text-foreground leading-none">{config.title}</p>
        )}
        <button
          onClick={onToggle}
          className="h-6 w-6 rounded flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
        >
          {open ? <PanelLeftClose className="h-3.5 w-3.5" /> : <PanelLeftOpen className="h-3.5 w-3.5" />}
        </button>
      </div>

      {/* Nav items */}
      <nav className="flex-1 px-2 py-2 space-y-0.5">
        {config.items.map((item) => {
          const active = location.pathname === item.path;
          const Icon = item.icon;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                "flex items-center gap-2.5 rounded-lg transition-colors h-9",
                open ? "px-2.5" : "justify-center px-0",
                active
                  ? "bg-primary/8 text-primary"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/40"
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {open && <span className="text-xs font-medium truncate">{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Organisation block */}
      {activeOrg && (
        <div className={cn("border-t border-border/50 p-2", open ? "px-3" : "px-2")}>
          <div className={cn(
            "flex items-center gap-2 rounded-lg py-2",
            open ? "px-2" : "justify-center px-0"
          )}>
            {orgDetails?.logo_url ? (
              <img
                src={orgDetails.logo_url}
                alt={activeOrg.org_name}
                className="h-7 w-7 rounded-md object-contain shrink-0"
              />
            ) : (
              <div className="h-7 w-7 rounded-md bg-primary/10 flex items-center justify-center shrink-0">
                <Building2 className="h-3.5 w-3.5 text-primary" />
              </div>
            )}
            {open && (
              <span className="text-[10px] font-semibold text-foreground truncate leading-tight">
                {activeOrg.org_name}
              </span>
            )}
          </div>
        </div>
      )}
    </aside>
  );
}
