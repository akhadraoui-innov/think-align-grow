import { useEffect, useState, useCallback } from "react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AdminSidebar } from "./AdminSidebar";
import { AdminGuard } from "./AdminGuard";
import { useLocation } from "react-router-dom";
import { NotificationsDropdown } from "@/components/notifications/NotificationsDropdown";
import { CommandPalette } from "@/components/layout/CommandPalette";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";

interface AdminShellProps {
  children: React.ReactNode;
}

const breadcrumbMap: Record<string, string> = {
  "/admin": "Dashboard",
  "/admin/organizations": "Organisations",
  "/admin/users": "Utilisateurs",
  "/admin/toolkits": "Toolkits",
  "/admin/workshops": "Workshops",
  "/admin/design-innovation": "Design Innovation",
  "/admin/billing": "Crédits & Abonnements",
  "/admin/logs": "Logs d'activité",
  "/admin/settings": "Paramètres",
  "/admin/observability": "Observabilité",
  "/admin/audit": "Audit immuable",
  "/admin/academy": "Academy",
  "/admin/academy/personae": "Academy — Personae",
  "/admin/academy/paths": "Academy — Parcours",
  "/admin/academy/campaigns": "Academy — Campagnes",
  "/admin/academy/assets": "Academy — Actifs pédagogiques",
  "/admin/business": "Business & Revenue",
  "/admin/emails": "Email Studio",
};

export function AdminShell({ children }: AdminShellProps) {
  const location = useLocation();
  const label = breadcrumbMap[location.pathname] || "Administration";
  const [cmdOpen, setCmdOpen] = useState(false);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === "k") {
      e.preventDefault();
      setCmdOpen((o) => !o);
    }
  }, []);

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  return (
    <AdminGuard>
      <SidebarProvider defaultOpen={true}>
        <CommandPalette open={cmdOpen} onOpenChange={setCmdOpen} />
        <div className="min-h-screen flex w-full bg-background">
          <AdminSidebar />
          <div className="flex-1 flex flex-col min-w-0">
            <header className="sticky top-0 z-40 flex h-12 items-center gap-3 border-b border-border/50 bg-background/80 backdrop-blur-xl px-4">
              <SidebarTrigger className="h-7 w-7 text-muted-foreground hover:text-foreground" />
              <div className="h-4 w-px bg-border/50" />
              <div className="flex items-center gap-2 text-sm flex-1">
                <span className="text-muted-foreground/60 text-xs font-medium">Admin</span>
                <span className="text-muted-foreground/40">/</span>
                <span className="font-semibold text-foreground text-xs">{label}</span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setCmdOpen(true)}
                className="h-8 gap-2 text-xs text-muted-foreground hover:text-foreground"
                title="Recherche (Cmd+K)"
              >
                <Search className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Rechercher</span>
                <kbd className="hidden md:inline-flex pointer-events-none h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100">
                  ⌘K
                </kbd>
              </Button>
              <NotificationsDropdown variant="admin" />
            </header>
            <main className="flex-1 overflow-auto">{children}</main>
          </div>
        </div>
      </SidebarProvider>
    </AdminGuard>
  );
}
