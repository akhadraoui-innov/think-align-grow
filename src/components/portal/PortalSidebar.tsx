import { Link, useLocation } from "react-router-dom";
import {
  LayoutGrid, Bot, GitBranch, Users, BarChart3,
  BookOpen, Plus, PanelLeftClose, PanelLeftOpen
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface PortalSidebarProps {
  open: boolean;
  onToggle: () => void;
}

const SIDEBAR_ITEMS = [
  { icon: LayoutGrid, label: "Tableau de bord", path: "/portal" },
  { icon: Bot, label: "Expériences", path: "/portal/experiences" },
  { icon: GitBranch, label: "Marketplace", path: "/portal/marketplace" },
  { icon: BarChart3, label: "Analytique", path: "/portal/analytics" },
  { icon: BookOpen, label: "Bibliothèque", path: "/portal/library" },
] as const;

export function PortalSidebar({ open, onToggle }: PortalSidebarProps) {
  const location = useLocation();

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
          <div className="flex items-center gap-2">
            <div className="h-5 w-5 rounded bg-accent/20 flex items-center justify-center">
              <LayoutGrid className="h-3 w-3 text-accent" />
            </div>
            <div>
              <p className="text-[11px] font-semibold text-foreground leading-none">Training Hub</p>
              <p className="text-[9px] text-muted-foreground mt-0.5">Global Workspace</p>
            </div>
          </div>
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
        {SIDEBAR_ITEMS.map((item) => {
          const active = location.pathname === item.path ||
            (item.path !== "/portal/workspace" && location.pathname.startsWith(item.path));
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

      {/* New Formation button */}
      <div className="p-2 border-t border-border/30">
        <Button
          variant="outline"
          size="sm"
          className={cn(
            "w-full gap-1.5 text-xs h-8",
            !open && "px-0"
          )}
        >
          <Plus className="h-3.5 w-3.5" />
          {open && "New Formation"}
        </Button>
      </div>
    </aside>
  );
}
