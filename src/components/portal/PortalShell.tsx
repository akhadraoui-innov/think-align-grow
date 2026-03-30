import { useState } from "react";
import { useLocation, Link } from "react-router-dom";
import { PortalSidebar } from "./PortalSidebar";
import { PortalBottomBar } from "./PortalBottomBar";
import { HeepAIWidget } from "./HeepAIWidget";
import { useAuth } from "@/hooks/useAuth";
import { useCredits } from "@/hooks/useCredits";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  Search, Bell, HelpCircle, Settings, Menu, X,
  Coins, ChevronRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface PortalShellProps {
  children: React.ReactNode;
}

const NAV_TABS = [
  { label: "Formations", path: "/portal" },
  { label: "Expériences", path: "/portal/workspace" },
  { label: "Mes Agents", path: "/portal/agents" },
  { label: "HEEP IA", path: "/portal/ai" },
] as const;

export function PortalShell({ children }: PortalShellProps) {
  const location = useLocation();
  const { profile } = useAuth();
  const { balance } = useCredits();
  const isMobile = useIsMobile();
  const [sidebarOpen, setSidebarOpen] = useState(!isMobile);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isTraining = location.pathname.startsWith("/portal/training/");

  return (
    <div className="min-h-screen flex flex-col bg-background font-sans">
      {/* ── Top Nav ── */}
      <header className="sticky top-0 z-50 border-b border-border/50 bg-background/90 backdrop-blur-xl">
        <div className="flex items-center h-14 px-4 gap-3">
          {/* Logo */}
          <Link to="/portal" className="flex items-center gap-2 mr-2 shrink-0">
            <div className="h-8 w-8 rounded-lg bg-gradient-hero flex items-center justify-center">
              <span className="text-sm font-black text-primary-foreground tracking-tight">H</span>
            </div>
            <span className="text-base font-bold tracking-tight text-foreground hidden sm:block">
              HEEP
            </span>
          </Link>

          {/* Desktop tabs */}
          <nav className="hidden md:flex items-center gap-1 ml-2">
            {NAV_TABS.map((tab) => {
              const active = tab.path === "/portal"
                ? location.pathname === "/portal"
                : location.pathname.startsWith(tab.path);
              return (
                <Link
                  key={tab.path}
                  to={tab.path}
                  className={cn(
                    "px-3 py-1.5 rounded-md text-xs font-medium transition-colors",
                    active
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                  )}
                >
                  {tab.label}
                </Link>
              );
            })}
          </nav>

          {/* Spacer */}
          <div className="flex-1" />

          {/* Search */}
          <button className="h-8 w-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors">
            <Search className="h-4 w-4" />
          </button>

          {/* Credits */}
          <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary/8 text-xs font-semibold text-primary">
            <Coins className="h-3.5 w-3.5" />
            {balance}
          </div>

          {/* Notifications */}
          <button className="h-8 w-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors relative">
            <Bell className="h-4 w-4" />
            <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-primary" />
          </button>

          {/* Help */}
          <button className="h-8 w-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors hidden sm:flex">
            <HelpCircle className="h-4 w-4" />
          </button>

          {/* Settings */}
          <Link
            to="/portal/settings"
            className="h-8 w-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors hidden sm:flex"
          >
            <Settings className="h-4 w-4" />
          </Link>

          {/* Cabinet link (admin/staff) */}
          <Link
            to="/explore"
            className="hidden lg:flex items-center gap-1 text-[10px] text-muted-foreground/60 hover:text-muted-foreground transition-colors ml-1"
          >
            Cabinet <ChevronRight className="h-3 w-3" />
          </Link>

          {/* Mobile hamburger */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden h-8 w-8"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </Button>
        </div>

        {/* Mobile nav dropdown */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-border/30 px-4 py-2 flex flex-col gap-1 bg-background">
            {NAV_TABS.map((tab) => {
              const active = tab.path === "/portal"
                ? location.pathname === "/portal"
                : location.pathname.startsWith(tab.path);
              return (
                <Link
                  key={tab.path}
                  to={tab.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className={cn(
                    "px-3 py-2 rounded-md text-sm font-medium",
                    active ? "bg-primary/10 text-primary" : "text-muted-foreground"
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
        {/* Left Sidebar */}
        {!isTraining && (
          <PortalSidebar
            open={sidebarOpen}
            onToggle={() => setSidebarOpen(!sidebarOpen)}
          />
        )}

        {/* Main content */}
        <main className="flex-1 overflow-auto min-w-0">
          {children}
        </main>
      </div>

      {/* Bottom bar (training mode) */}
      {isTraining && <PortalBottomBar />}

      {/* Floating AI Widget */}
      <HeepAIWidget />
    </div>
  );
}
