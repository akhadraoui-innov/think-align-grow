import { useLocation, useNavigate } from "react-router-dom";
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel,
  SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarHeader, SidebarFooter, useSidebar,
} from "@/components/ui/sidebar";
import {
  LayoutDashboard, Building2, Users, Layers, Presentation, Lightbulb, GraduationCap,
  CreditCard, ScrollText, Settings, ArrowLeft, Sparkles, Briefcase, Route, UserCircle,
  Megaphone, Map, BarChart3, ChevronDown, Library, Activity,
} from "lucide-react";
import { usePermissions } from "@/hooks/usePermissions";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

const academySubItems = [
  { path: "/admin/academy", icon: LayoutDashboard, label: "Vue d'ensemble", exact: true },
  { path: "/admin/academy/map", icon: Map, label: "Cartographie" },
  { path: "/admin/academy/functions", icon: Briefcase, label: "Fonctions" },
  { path: "/admin/academy/personae", icon: UserCircle, label: "Personae" },
  { path: "/admin/academy/paths", icon: Route, label: "Parcours" },
  { path: "/admin/academy/campaigns", icon: Megaphone, label: "Campagnes" },
  { path: "/admin/academy/tracking", icon: BarChart3, label: "Suivi" },
  { path: "/admin/academy/assets", icon: Library, label: "Actifs pédagogiques" },
];

export function AdminSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();
  const navigate = useNavigate();
  const perms = usePermissions();

  const isAcademyRoute = location.pathname.startsWith("/admin/academy");

  const mainItems = [
    { path: "/admin", icon: LayoutDashboard, label: "Dashboard", exact: true, show: perms.has("admin.dashboard.view") },
    { path: "/admin/organizations", icon: Building2, label: "Organisations", show: perms.has("admin.orgs.view") },
    { path: "/admin/users", icon: Users, label: "Utilisateurs", show: perms.has("admin.users.view") },
    { path: "/admin/toolkits", icon: Layers, label: "Toolkits", show: perms.has("admin.toolkits.view") },
    { path: "/admin/workshops", icon: Presentation, label: "Workshops", show: perms.has("admin.workshops.view") },
    { path: "/admin/design-innovation", icon: Lightbulb, label: "Design Innovation", show: perms.has("admin.challenges.view") },
  ];

  const observabilitySubItems = [
    { path: "/admin/observability", icon: LayoutDashboard, label: "Vue d'ensemble", exact: true },
    { path: "/admin/observability/catalogue", icon: Layers, label: "Catalogue Assets" },
    { path: "/admin/observability/matrix", icon: Building2, label: "Matrice Couverture" },
  ];

  const systemItems = [
    { path: "/admin/billing", icon: CreditCard, label: "Crédits & Abonnements", show: perms.has("admin.billing.view") },
    { path: "/admin/logs", icon: ScrollText, label: "Logs d'activité", show: perms.has("admin.logs.view") },
    { path: "/admin/settings", icon: Settings, label: "Paramètres", show: perms.hasAny("admin.settings.ai", "admin.settings.roles", "admin.settings.platform") },
  ];

  const visibleMain = mainItems.filter(i => i.show);
  const visibleSystem = systemItems.filter(i => i.show);
  const showAcademy = perms.has("academy.paths.view");
  const showObservability = perms.has("admin.logs.view");
  const isObservabilityRoute = location.pathname.startsWith("/admin/observability");

  const isActive = (path: string, exact?: boolean) =>
    exact ? location.pathname === path : location.pathname.startsWith(path);

  const renderItem = (item: { path: string; icon: any; label: string; exact?: boolean }) => {
    const active = isActive(item.path, item.exact);
    const Icon = item.icon;
    return (
      <SidebarMenuItem key={item.path}>
        <SidebarMenuButton asChild isActive={active} tooltip={item.label}>
          <button
            onClick={() => navigate(item.path)}
            className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all ${
              active
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:bg-secondary hover:text-foreground"
            }`}
          >
            <Icon className="h-4 w-4 shrink-0" />
            {!collapsed && <span>{item.label}</span>}
          </button>
        </SidebarMenuButton>
      </SidebarMenuItem>
    );
  };

  return (
    <Sidebar collapsible="icon" className="border-r border-border/50">
      <SidebarHeader className="px-3 py-4">
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate("/admin")}>
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-foreground to-foreground/80 shadow-md">
            <Sparkles className="h-4 w-4 text-background" />
          </div>
          {!collapsed && (
            <div>
              <p className="font-display font-bold text-sm uppercase tracking-wide">Administration</p>
              <p className="text-[10px] text-muted-foreground">Hack & Show</p>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent>
        {visibleMain.length > 0 && (
          <SidebarGroup>
            {!collapsed && (
              <SidebarGroupLabel className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 px-3">
                Gestion
              </SidebarGroupLabel>
            )}
            <SidebarGroupContent>
              <SidebarMenu>{visibleMain.map(renderItem)}</SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {/* Academy collapsible group */}
        {showAcademy && (
          <SidebarGroup>
            <Collapsible defaultOpen={isAcademyRoute} open={collapsed ? false : undefined}>
              <CollapsibleTrigger asChild>
                <button
                  className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all ${
                    isAcademyRoute
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                  }`}
                  onClick={(e) => {
                    if (collapsed) {
                      e.preventDefault();
                      navigate("/admin/academy");
                    }
                  }}
                >
                  <GraduationCap className="h-4 w-4 shrink-0" />
                  {!collapsed && (
                    <>
                      <span className="flex-1 text-left">Academy</span>
                      <ChevronDown className="h-3 w-3 shrink-0 transition-transform duration-200 group-data-[state=open]:rotate-180" />
                    </>
                  )}
                </button>
              </CollapsibleTrigger>
              {!collapsed && (
                <CollapsibleContent className="pl-4 mt-1 space-y-0.5">
                  {academySubItems.map(sub => {
                    const active = isActive(sub.path, sub.exact);
                    const SubIcon = sub.icon;
                    return (
                      <button
                        key={sub.path}
                        onClick={() => navigate(sub.path)}
                        className={`flex w-full items-center gap-2.5 rounded-md px-3 py-1.5 text-xs font-medium transition-all ${
                          active
                            ? "bg-primary/10 text-primary"
                            : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                        }`}
                      >
                        <SubIcon className="h-3.5 w-3.5 shrink-0" />
                        <span>{sub.label}</span>
                      </button>
                    );
                  })}
                </CollapsibleContent>
              )}
            </Collapsible>
          </SidebarGroup>
        )}

        {visibleSystem.length > 0 && (
          <SidebarGroup>
            {!collapsed && (
              <SidebarGroupLabel className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 px-3">
                Système
              </SidebarGroupLabel>
            )}
            <SidebarGroupContent>
              <SidebarMenu>{visibleSystem.map(renderItem)}</SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {/* Observability collapsible group */}
        {showObservability && (
          <SidebarGroup>
            <Collapsible defaultOpen={isObservabilityRoute} open={collapsed ? false : undefined}>
              <CollapsibleTrigger asChild>
                <button
                  className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all ${
                    isObservabilityRoute
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                  }`}
                  onClick={(e) => {
                    if (collapsed) {
                      e.preventDefault();
                      navigate("/admin/observability");
                    }
                  }}
                >
                  <Activity className="h-4 w-4 shrink-0" />
                  {!collapsed && (
                    <>
                      <span className="flex-1 text-left">Observabilité</span>
                      <ChevronDown className="h-3 w-3 shrink-0 transition-transform duration-200 group-data-[state=open]:rotate-180" />
                    </>
                  )}
                </button>
              </CollapsibleTrigger>
              {!collapsed && (
                <CollapsibleContent className="pl-4 mt-1 space-y-0.5">
                  {observabilitySubItems.map(sub => {
                    const active = isActive(sub.path, sub.exact);
                    const SubIcon = sub.icon;
                    return (
                      <button
                        key={sub.path}
                        onClick={() => navigate(sub.path)}
                        className={`flex w-full items-center gap-2.5 rounded-md px-3 py-1.5 text-xs font-medium transition-all ${
                          active
                            ? "bg-primary/10 text-primary"
                            : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                        }`}
                      >
                        <SubIcon className="h-3.5 w-3.5 shrink-0" />
                        <span>{sub.label}</span>
                      </button>
                    );
                  })}
                </CollapsibleContent>
              )}
            </Collapsible>
          </SidebarGroup>
        )}
      </SidebarContent>

      <SidebarFooter className="px-3 py-3 border-t border-border/50">
        <button
          onClick={() => navigate("/")}
          className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors ${
            collapsed ? "justify-center px-2" : ""
          }`}
        >
          <ArrowLeft className="h-4 w-4 shrink-0" />
          {!collapsed && <span>Retour à l'app</span>}
        </button>
      </SidebarFooter>
    </Sidebar>
  );
}
