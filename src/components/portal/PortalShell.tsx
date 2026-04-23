import { useState } from "react";
import { useLocation, Link } from "react-router-dom";
import { PortalSidebar } from "./PortalSidebar";
import { PortalBottomBar } from "./PortalBottomBar";
import { HeepAIWidget } from "./HeepAIWidget";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { useAuth } from "@/hooks/useAuth";
import { useCredits } from "@/hooks/useCredits";
import { useIsMobile } from "@/hooks/use-mobile";
import { useLastSeenTracker } from "@/hooks/useLastSeenTracker";
import {
  Search, HelpCircle, Menu, X,
  Coins, ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { NotificationsDropdown } from "@/components/notifications/NotificationsDropdown";
import { EmailWidget } from "@/components/email/EmailWidget";
import { CommandPalette } from "@/components/layout/CommandPalette";
import { useEffect, useCallback } from "react";

interface PortalShellProps {
  children: React.ReactNode;
}

const NAV_TABS = [
  { label: "FORMATIONS", path: "/portal", matchPrefix: "/portal/dashboard,/portal/path,/portal/module,/portal/certificates" },
  { label: "PRATIQUE", path: "/portal/pratique", matchPrefix: "/portal/pratique" },
  { label: "WORKSHOPS", path: "/portal/workshops", matchPrefix: "/portal/workshops" },
  { label: "CHALLENGES", path: "/portal/challenges", matchPrefix: "/portal/challenges" },
  { label: "ACADEMIE", path: "/portal/academie", matchPrefix: "/portal/academie" },
  { label: "INSIGHT", path: "/portal/insight", matchPrefix: "/portal/insight" },
  { label: "AI VALUE BUILDER", path: "/portal/ucm", matchPrefix: "/portal/ucm" },
] as const;

export function PortalShell({ children }: PortalShellProps) {
  const location = useLocation();
  const { profile } = useAuth();
  const { balance } = useCredits();
  const isMobile = useIsMobile();
  const [sidebarOpen, setSidebarOpen] = useState(!isMobile);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [cmdOpen, setCmdOpen] = useState(false);
  useLastSeenTracker();

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

  const isImmersive =
    /^\/portal\/module\//.test(location.pathname) ||
    /^\/portal\/pratique\/session/.test(location.pathname) ||
    /^\/portal\/academie\/modules\//.test(location.pathname) ||
    (/^\/portal\/ucm\/[0-9a-f]{8}-/.test(location.pathname)) ||
    (/^\/portal\/workshops\/[^/]+$/.test(location.pathname) && location.pathname !== "/portal/workshops" && location.pathname !== "/portal/workshops/toolkits") ||
    (/^\/portal\/challenges\/[^/]+$/.test(location.pathname) && location.pathname !== "/portal/challenges");

  const getActiveTab = () => {
    for (const tab of NAV_TABS) {
      if (tab.path === "/portal") {
        const prefixes = tab.matchPrefix.split(",");
        if (location.pathname === "/portal" || prefixes.some(p => location.pathname.startsWith(p))) return tab.path;
      } else if (location.pathname.startsWith(tab.path)) {
        return tab.path;
      }
    }
    return "/portal";
  };

  const activeTab = getActiveTab();

  return (
    <AuthGuard redirectTo="/auth">
    <CommandPalette open={cmdOpen} onOpenChange={setCmdOpen} />
    <div className="portal h-screen flex flex-col bg-background font-sans overflow-hidden">
      {/* ── Top Nav ── */}
      <header className="sticky top-0 z-50 border-b border-border/50 bg-background/90 backdrop-blur-xl">
        <div className="flex items-center h-14 px-4 gap-4">
          {/* Logo — text only, no H icon */}
          <Link to="/portal" className="flex items-center mr-3 shrink-0">
            <span className="text-xl font-black tracking-tighter text-black uppercase">
              GROWTHINNOV
            </span>
          </Link>

          {/* Desktop tabs */}
          <nav className="hidden md:flex items-center gap-1 ml-auto mr-auto">
            {NAV_TABS.map((tab) => {
              const active = activeTab === tab.path;
              return (
                <Link
                  key={tab.path}
                  to={tab.path}
                  className={cn(
                    "px-4 py-1.5 rounded-md text-sm font-bold uppercase tracking-wide transition-colors",
                    active
                      ? "bg-primary/10 text-primary"
                      : "text-foreground/60 hover:text-foreground hover:bg-muted/50"
                  )}
                >
                  {tab.label}
                </Link>
              );
            })}
          </nav>

          {/* Spacer */}
          <div className="flex-1" />

          {/* Search → Command palette */}
          <button
            onClick={() => setCmdOpen(true)}
            title="Recherche (Cmd+K)"
            className="h-9 w-9 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
          >
            <Search className="h-4.5 w-4.5" />
          </button>

          {/* Credits */}
          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary/8 text-sm font-bold text-primary">
            <Coins className="h-4 w-4" />
            {balance}
          </div>

          {/* Email Widget */}
          <EmailWidget variant="portal" />

          {/* Notifications */}
          <NotificationsDropdown variant="portal" />

          {/* Help */}
          <button className="h-9 w-9 rounded-lg items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors hidden sm:flex">
            <HelpCircle className="h-4.5 w-4.5" />
          </button>

          {/* Cabinet link */}

          {/* Mobile hamburger */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden h-9 w-9"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>

        {/* Mobile nav dropdown */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-border/30 px-4 py-2 flex flex-col gap-1 bg-background">
            {NAV_TABS.map((tab) => {
              const active = activeTab === tab.path;
              return (
                <Link
                  key={tab.path}
                  to={tab.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className={cn(
                    "px-3 py-2 rounded-md text-sm font-bold uppercase",
                    active ? "bg-primary/10 text-primary" : "text-foreground/60"
                  )}
                >
                  {tab.label}
                </Link>
              );
            })}
          </div>
        )}
      </header>

      {/* ── Body: Sidebar + Content ── */}
      <div className="flex flex-1 min-h-0">
        {!isImmersive && (
          <PortalSidebar
            open={sidebarOpen}
            onToggle={() => setSidebarOpen(!sidebarOpen)}
            activeTab={activeTab}
          />
        )}
        <main className="flex-1 overflow-auto min-w-0">
          {children}
        </main>
      </div>

      {isImmersive && <PortalBottomBar />}
      <HeepAIWidget />
    </div>
    </AuthGuard>
  );
}
