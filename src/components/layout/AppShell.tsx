import { useState, useEffect, useCallback, lazy, Suspense } from "react";
import { useLocation } from "react-router-dom";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "./AppSidebar";
import { PortalShell } from "@/components/portal/PortalShell";
import { BottomNav } from "./BottomNav";
import { CommandPalette } from "./CommandPalette";
import { ImpersonationBanner } from "./ImpersonationBanner";
import { useIsMobile } from "@/hooks/use-mobile";
import { useLastSeenTracker } from "@/hooks/useLastSeenTracker";

interface AppShellProps {
  children: React.ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  const location = useLocation();
  const isMobile = useIsMobile();
  const [cmdOpen, setCmdOpen] = useState(false);
  useLastSeenTracker();

  const isLandingPage = location.pathname === "/";
  const isAuthPage = location.pathname === "/auth" || location.pathname === "/reset-password";
  const isWorkshopRoom = location.pathname.startsWith("/workshop/") && location.pathname !== "/workshop";
  const isAdminPage = location.pathname.startsWith("/admin");
  const isAcademyModule = location.pathname.startsWith("/academy/module/");

  // Cmd+K shortcut
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

  const isPortal = location.pathname.startsWith("/portal");

  // Landing page & auth: no shell chrome
  if (isLandingPage || isAuthPage || isWorkshopRoom || isAdminPage || isAcademyModule) {
    return <>{children}</>;
  }

  // Portal: dedicated shell
  if (isPortal) {
    return <PortalShell>{children}</PortalShell>;
  }

  // Mobile: keep original bottom nav layout
  if (isMobile) {
    return (
      <>
        <CommandPalette open={cmdOpen} onOpenChange={setCmdOpen} />
        <main className="min-h-screen">{children}</main>
        <BottomNav />
      </>
    );
  }

  // Desktop: sidebar layout
  return (
    <SidebarProvider defaultOpen={true}>
      <CommandPalette open={cmdOpen} onOpenChange={setCmdOpen} />
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar onCommandPalette={() => setCmdOpen(true)} />
        <div className="flex-1 flex flex-col min-w-0">
          {/* Top bar */}
          <header className="sticky top-0 z-40 flex h-12 items-center gap-3 border-b border-border/50 bg-background/80 backdrop-blur-xl px-4">
            <SidebarTrigger className="h-7 w-7 text-muted-foreground hover:text-foreground" />
            <div className="h-4 w-px bg-border/50" />
            <PageBreadcrumb />
          </header>
          <main className="flex-1 overflow-auto">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}

// Simple breadcrumb showing current page
function PageBreadcrumb() {
  const location = useLocation();
  const map: Record<string, string> = {
    "/explore": "Explorer",
    "/plans": "Plans de Jeu",
    "/lab": "Lab & Diagnostic",
    "/ai": "Coach IA",
    "/profile": "Profil",
    "/workshop": "Workshop",
    "/academy": "Academy",
    "/simulator": "Simulateur",
    "/simulator/session": "Simulation en cours",
    "/simulator/history": "Historique",
  };
  const label = map[location.pathname] || "GROWTHINNOV";

  return (
    <div className="flex items-center gap-2 text-sm">
      <span className="text-muted-foreground/60 text-xs font-medium">GROWTHINNOV</span>
      <span className="text-muted-foreground/40">/</span>
      <span className="font-semibold text-foreground text-xs">{label}</span>
    </div>
  );
}
