import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import {
  LayoutDashboard, Database, Target, TrendingUp, BarChart3, Zap,
  ChevronLeft, ChevronRight, LogOut, User, Building2, Settings,
  Bell, HelpCircle, Menu, X, Brain, Download
} from "lucide-react";

interface ModuleItem {
  id: string;
  label: string;
  shortLabel: string;
  icon: React.ReactNode;
  path: string;
  color: string;
}

const MODULES: ModuleItem[] = [
  {
    id: "dashboard",
    label: "Tableau de bord",
    shortLabel: "Dashboard",
    icon: <LayoutDashboard size={16} />,
    path: "/",
    color: "#1A85FF",
  },
  {
    id: "historical",
    label: "Données Historiques",
    shortLabel: "Historique",
    icon: <Database size={16} />,
    path: "/historical",
    color: "#1A85FF",
  },
  {
    id: "strategy",
    label: "Stratégie & Leviers",
    shortLabel: "Stratégie",
    icon: <Target size={16} />,
    path: "/strategy",
    color: "#C9A84C",
  },
  {
    id: "business-plan",
    label: "Business Plan",
    shortLabel: "BP",
    icon: <TrendingUp size={16} />,
    path: "/business-plan",
    color: "#1A85FF",
  },
  {
    id: "valuation",
    label: "Valorisation",
    shortLabel: "Valuation",
    icon: <BarChart3 size={16} />,
    path: "/valuation",
    color: "#C9A84C",
  },
  {
    id: "simulation",
    label: "Simulation Inverse",
    shortLabel: "Simulation",
    icon: <Zap size={16} />,
    path: "/simulation",
    color: "#C9A84C",
  },
  {
    id: "exports",
    label: "Exports",
    shortLabel: "Exports",
    icon: <Download size={16} />,
    path: "/exports",
    color: "oklch(60% 0.18 145)",
  },
];

interface AppLayoutProps {
  children: React.ReactNode;
  projectId?: number;
  projectName?: string;
  aiPanelContent?: React.ReactNode;
  showAiPanel?: boolean;
}

export default function AppLayout({ children, projectId, projectName, aiPanelContent, showAiPanel = false }: AppLayoutProps) {
  const [location] = useLocation();
  const { user, loading, isAuthenticated, logout } = useAuth();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [aiPanelOpen, setAiPanelOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const { data: projects } = trpc.projects.list.useQuery(undefined, { enabled: isAuthenticated });

  useEffect(() => {
    const saved = localStorage.getItem("sidebar_collapsed");
    if (saved === "true") setSidebarCollapsed(true);
  }, []);

  const toggleSidebar = () => {
    const next = !sidebarCollapsed;
    setSidebarCollapsed(next);
    localStorage.setItem("sidebar_collapsed", String(next));
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#0A1628" }}>
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" style={{ borderColor: "#1A85FF", borderTopColor: "transparent" }} />
          <span className="text-sm font-heading font-semibold tracking-widest uppercase" style={{ color: "#1A85FF" }}>KHALEO VALUATION</span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#0A1628" }}>
        <div className="text-center max-w-md px-6">
          {/* Logo */}
          <div className="mb-8">
            <div className="inline-flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: "linear-gradient(135deg, #1A85FF, #0A5FCC)" }}>
                <BarChart3 size={20} color="white" />
              </div>
              <div className="text-left">
                <div className="font-heading font-900 text-xl tracking-tight text-white">KHALEO</div>
                <div className="font-heading font-600 text-xs tracking-widest uppercase" style={{ color: "#C9A84C" }}>Valuation Platform</div>
              </div>
            </div>
            <p className="text-sm leading-relaxed" style={{ color: "oklch(60% 0.04 240)" }}>
              Plateforme institutionnelle de valorisation d'entreprise et de business planning. Accès réservé aux membres autorisés.
            </p>
          </div>

          {/* Stats band */}
          <div className="grid grid-cols-3 gap-3 mb-8">
            {[
              { label: "Méthodes", value: "7" },
              { label: "Modules", value: "5" },
              { label: "Multi-tenant", value: "✓" },
            ].map((s) => (
              <div key={s.label} className="kpi-card text-center">
                <div className="text-xl font-heading font-800" style={{ color: "#C9A84C" }}>{s.value}</div>
                <div className="text-xs mt-0.5" style={{ color: "oklch(55% 0.04 240)" }}>{s.label}</div>
              </div>
            ))}
          </div>

          <a
            href={getLoginUrl()}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-lg font-heading font-600 text-sm text-white transition-all hover:opacity-90 active:scale-95"
            style={{ background: "linear-gradient(135deg, #1A85FF, #0A5FCC)", boxShadow: "0 0 20px rgba(26,133,255,0.3)" }}
          >
            <User size={16} />
            Accéder à la plateforme
          </a>
        </div>
      </div>
    );
  }

  const activeModule = MODULES.find(m => m.path !== "/" ? location.startsWith(m.path) : location === "/");

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: "#0A1628" }}>
      {/* ─── SIDEBAR ─── */}
      <aside
        className="flex flex-col flex-shrink-0 transition-all duration-250 ease-out"
        style={{
          width: sidebarCollapsed ? "56px" : "220px",
          background: "oklch(13% 0.045 240)",
          borderRight: "1px solid oklch(22% 0.06 240)",
        }}
      >
        {/* Logo */}
        <div className="flex items-center h-14 px-3 flex-shrink-0" style={{ borderBottom: "1px solid oklch(22% 0.06 240)" }}>
          <div className="flex items-center gap-2.5 overflow-hidden">
            <div className="w-7 h-7 rounded flex-shrink-0 flex items-center justify-center" style={{ background: "linear-gradient(135deg, #1A85FF, #0A5FCC)" }}>
              <BarChart3 size={14} color="white" />
            </div>
            {!sidebarCollapsed && (
              <div className="min-w-0 animate-fade-in">
                <div className="font-heading font-800 text-sm tracking-tight text-white leading-none">KHALEO</div>
                <div className="font-heading font-600 text-[9px] tracking-widest uppercase leading-none mt-0.5" style={{ color: "#C9A84C" }}>Valuation</div>
              </div>
            )}
          </div>
          <button
            onClick={toggleSidebar}
            className="ml-auto flex-shrink-0 w-6 h-6 rounded flex items-center justify-center transition-colors hover:bg-white/10"
            style={{ color: "oklch(55% 0.04 240)" }}
          >
            {sidebarCollapsed ? <ChevronRight size={12} /> : <ChevronLeft size={12} />}
          </button>
        </div>

        {/* Projet actif */}
        {projectName && !sidebarCollapsed && (
          <div className="px-3 py-2 flex-shrink-0" style={{ borderBottom: "1px solid oklch(22% 0.06 240)" }}>
            <div className="text-[9px] font-heading font-600 tracking-widest uppercase mb-1" style={{ color: "oklch(45% 0.05 240)" }}>Projet actif</div>
            <div className="text-xs font-medium truncate text-white">{projectName}</div>
          </div>
        )}

        {/* Navigation modules */}
        <nav className="flex-1 overflow-y-auto py-2 px-2">
          {MODULES.map((module) => {
            const isActive = module.path !== "/" ? location.startsWith(module.path) : location === "/";
            return (
              <Link key={module.id} href={module.path}>
                <div
                  className={`sidebar-nav-item mb-0.5 ${isActive ? "active" : ""}`}
                  title={sidebarCollapsed ? module.label : undefined}
                  style={isActive ? { borderLeftColor: module.color, color: module.color } : {}}
                >
                  <span className="flex-shrink-0" style={{ color: isActive ? module.color : undefined }}>
                    {module.icon}
                  </span>
                  {!sidebarCollapsed && (
                    <span className="truncate animate-fade-in text-xs">{module.label}</span>
                  )}
                </div>
              </Link>
            );
          })}

          {/* Séparateur */}
          <div className="bloomberg-divider my-2" />

          {/* Liens secondaires */}
          {[
            { icon: <Settings size={14} />, label: "Paramètres", path: "/settings" },
            { icon: <HelpCircle size={14} />, label: "Documentation", path: "/docs" },
          ].map((item) => (
            <Link key={item.path} href={item.path}>
              <div className="sidebar-nav-item mb-0.5" title={sidebarCollapsed ? item.label : undefined}>
                <span className="flex-shrink-0">{item.icon}</span>
                {!sidebarCollapsed && <span className="truncate animate-fade-in text-xs">{item.label}</span>}
              </div>
            </Link>
          ))}
        </nav>

        {/* User footer */}
        <div className="flex-shrink-0 p-2" style={{ borderTop: "1px solid oklch(22% 0.06 240)" }}>
          {!sidebarCollapsed ? (
            <div className="flex items-center gap-2 p-2 rounded" style={{ background: "oklch(17% 0.055 240)" }}>
              <div className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-heading font-700" style={{ background: "#1A85FF", color: "white" }}>
                {user?.name?.charAt(0)?.toUpperCase() ?? "U"}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs font-medium truncate text-white">{user?.name ?? "Utilisateur"}</div>
                <div className="text-[10px] truncate capitalize" style={{ color: "#C9A84C" }}>{user?.role ?? "analyst"}</div>
              </div>
              <button
                onClick={() => logout()}
                className="flex-shrink-0 w-5 h-5 rounded flex items-center justify-center transition-colors hover:bg-red-500/20"
                style={{ color: "oklch(55% 0.04 240)" }}
                title="Déconnexion"
              >
                <LogOut size={11} />
              </button>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-1">
              <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-heading font-700" style={{ background: "#1A85FF", color: "white" }}>
                {user?.name?.charAt(0)?.toUpperCase() ?? "U"}
              </div>
              <button onClick={() => logout()} className="w-5 h-5 rounded flex items-center justify-center hover:bg-red-500/20 transition-colors" style={{ color: "oklch(55% 0.04 240)" }}>
                <LogOut size={10} />
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* ─── MAIN CONTENT ─── */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <header className="flex items-center h-14 px-4 flex-shrink-0" style={{ background: "oklch(13% 0.045 240)", borderBottom: "1px solid oklch(22% 0.06 240)" }}>
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-xs">
            <span style={{ color: "oklch(45% 0.05 240)" }}>KHALEO Valuation</span>
            {activeModule && (
              <>
                <span style={{ color: "oklch(35% 0.05 240)" }}>/</span>
                <span className="font-medium" style={{ color: activeModule.color }}>{activeModule.label}</span>
              </>
            )}
            {projectName && (
              <>
                <span style={{ color: "oklch(35% 0.05 240)" }}>/</span>
                <span className="font-medium text-white">{projectName}</span>
              </>
            )}
          </div>

          <div className="ml-auto flex items-center gap-2">
            {/* Indicateur de connexion */}
            <div className="flex items-center gap-1.5 px-2 py-1 rounded text-[10px] font-heading font-600 uppercase tracking-wider" style={{ background: "oklch(17% 0.055 240)", color: "oklch(60% 0.18 145)" }}>
              <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
              Live
            </div>

            {/* Bouton IA */}
            {showAiPanel && (
              <button
                onClick={() => setAiPanelOpen(!aiPanelOpen)}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded text-xs font-heading font-600 transition-all"
                style={{
                  background: aiPanelOpen ? "oklch(55% 0.22 240 / 0.2)" : "oklch(17% 0.055 240)",
                  color: aiPanelOpen ? "#1A85FF" : "oklch(60% 0.04 240)",
                  border: `1px solid ${aiPanelOpen ? "oklch(55% 0.22 240 / 0.4)" : "oklch(25% 0.06 240)"}`,
                }}
              >
                <Brain size={12} />
                IA
              </button>
            )}

            {/* Notifications */}
            <button className="w-7 h-7 rounded flex items-center justify-center transition-colors hover:bg-white/10" style={{ color: "oklch(55% 0.04 240)" }}>
              <Bell size={14} />
            </button>
          </div>
        </header>

        {/* Content area */}
        <div className="flex-1 flex overflow-hidden">
          <main className="flex-1 overflow-y-auto">
            {children}
          </main>

          {/* ─── AI PANEL ─── */}
          {showAiPanel && (
            <aside
              className="flex-shrink-0 flex flex-col transition-all duration-250 ease-out overflow-hidden"
              style={{
                width: aiPanelOpen ? "300px" : "0px",
                borderLeft: aiPanelOpen ? "1px solid oklch(22% 0.06 240)" : "none",
                background: "oklch(13% 0.045 240)",
              }}
            >
              {aiPanelOpen && (
                <div className="flex flex-col h-full animate-slide-in-right">
                  <div className="flex items-center justify-between px-3 py-2.5 flex-shrink-0" style={{ borderBottom: "1px solid oklch(22% 0.06 240)" }}>
                    <div className="flex items-center gap-2">
                      <Brain size={13} style={{ color: "#1A85FF" }} />
                      <span className="text-xs font-heading font-700 tracking-wider uppercase" style={{ color: "#1A85FF" }}>Assistant IA</span>
                    </div>
                    <button
                      onClick={() => setAiPanelOpen(false)}
                      className="w-5 h-5 rounded flex items-center justify-center hover:bg-white/10 transition-colors"
                      style={{ color: "oklch(55% 0.04 240)" }}
                    >
                      <X size={11} />
                    </button>
                  </div>
                  <div className="flex-1 overflow-y-auto p-3">
                    {aiPanelContent ?? (
                      <div className="text-xs text-center py-8" style={{ color: "oklch(45% 0.05 240)" }}>
                        <Brain size={24} className="mx-auto mb-2 opacity-30" />
                        <p>Les suggestions IA apparaîtront ici selon le contexte de votre analyse.</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </aside>
          )}
        </div>
      </div>
    </div>
  );
}
