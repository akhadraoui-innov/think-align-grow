import { useLocation, useNavigate } from "react-router-dom";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar";
import {
  LayoutDashboard,
  Building2,
  Users,
  Layers,
  Presentation,
  Lightbulb,
  CreditCard,
  ScrollText,
  Settings,
  ArrowLeft,
  Sparkles,
} from "lucide-react";

const mainItems = [
  { path: "/admin", icon: LayoutDashboard, label: "Dashboard", exact: true },
  { path: "/admin/organizations", icon: Building2, label: "Organisations" },
  { path: "/admin/users", icon: Users, label: "Utilisateurs" },
  { path: "/admin/toolkits", icon: Layers, label: "Toolkits" },
  { path: "/admin/workshops", icon: Presentation, label: "Workshops" },
  { path: "/admin/design-innovation", icon: Lightbulb, label: "Design Innovation" },
];

const systemItems = [
  { path: "/admin/billing", icon: CreditCard, label: "Crédits & Abonnements" },
  { path: "/admin/logs", icon: ScrollText, label: "Logs d'activité" },
  { path: "/admin/settings", icon: Settings, label: "Paramètres" },
];

export function AdminSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();
  const navigate = useNavigate();

  const isActive = (path: string, exact?: boolean) =>
    exact ? location.pathname === path : location.pathname.startsWith(path);

  const renderItem = (item: typeof mainItems[0]) => {
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
        <div
          className="flex items-center gap-3 cursor-pointer"
          onClick={() => navigate("/admin")}
        >
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
        <SidebarGroup>
          {!collapsed && (
            <SidebarGroupLabel className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 px-3">
              Gestion
            </SidebarGroupLabel>
          )}
          <SidebarGroupContent>
            <SidebarMenu>{mainItems.map(renderItem)}</SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          {!collapsed && (
            <SidebarGroupLabel className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 px-3">
              Système
            </SidebarGroupLabel>
          )}
          <SidebarGroupContent>
            <SidebarMenu>{systemItems.map(renderItem)}</SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
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
