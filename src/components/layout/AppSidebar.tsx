import { useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
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
import { Compass, Layers, Gamepad2, Sparkles, User, LogOut, Coins, Search, LayoutDashboard, Plus, List, LayoutGrid } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useCredits } from "@/hooks/useCredits";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

const navItems = [
  { path: "/explore", icon: Compass, label: "Explorer" },
  { path: "/plans", icon: Layers, label: "Plans" },
  { path: "/lab", icon: Gamepad2, label: "Lab" },
  { path: "/ai", icon: Sparkles, label: "Coach IA" },
  { path: "/profile", icon: User, label: "Profil" },
];

const workshopItems = [
  { path: "/workshop", icon: List, label: "Mes workshops", exact: true },
  { path: "/workshop?action=create", icon: Plus, label: "Nouveau workshop", exact: true },
];

interface AppSidebarProps {
  onCommandPalette?: () => void;
}

export function AppSidebar({ onCommandPalette }: AppSidebarProps) {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();
  const navigate = useNavigate();
  const { user, profile, signOut } = useAuth();
  const { balance } = useCredits();

  const isActive = (path: string) => location.pathname.startsWith(path);

  return (
    <Sidebar collapsible="icon" className="border-r border-border/50">
      {/* Logo header */}
      <SidebarHeader className="px-3 py-4">
        <div
          className="flex items-center gap-3 cursor-pointer"
          onClick={() => navigate("/")}
        >
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-pillar-thinking shadow-md shadow-primary/20">
            <Sparkles className="h-4 w-4 text-primary-foreground" />
          </div>
          {!collapsed && (
            <div>
              <p className="font-display font-bold text-sm uppercase tracking-wide">Hack & Show</p>
              <p className="text-[10px] text-muted-foreground">Toolkit Stratégique</p>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent>
        {/* Search */}
        {onCommandPalette && (
          <div className="px-3 pb-2">
            <button
              onClick={onCommandPalette}
              className={`flex w-full items-center gap-2 rounded-xl border border-border/50 bg-secondary/50 px-3 py-2 text-sm text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors ${collapsed ? "justify-center px-2" : ""}`}
            >
              <Search className="h-4 w-4 shrink-0" />
              {!collapsed && (
                <>
                  <span className="flex-1 text-left text-xs">Rechercher...</span>
                  <kbd className="text-[10px] bg-background border border-border rounded px-1.5 py-0.5">⌘K</kbd>
                </>
              )}
            </button>
          </div>
        )}

        <SidebarGroup>
          {!collapsed && <SidebarGroupLabel className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 px-3">Menu</SidebarGroupLabel>}
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => {
                const active = isActive(item.path);
                const Icon = item.icon;
                return (
                  <SidebarMenuItem key={item.path}>
                    <SidebarMenuButton
                      asChild
                      isActive={active}
                      tooltip={item.label}
                    >
                      <button
                        onClick={() => navigate(item.path)}
                        className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all ${
                          active
                            ? "bg-primary/10 text-primary"
                            : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                        }`}
                      >
                        <Icon className="h-4 w-4 shrink-0" />
                        {!collapsed && <span>{item.label}</span>}
                        {active && !collapsed && (
                          <motion.div
                            layoutId="sidebar-active"
                            className="ml-auto h-1.5 w-1.5 rounded-full bg-primary"
                          />
                        )}
                      </button>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Workshop section */}
        <SidebarGroup>
          {!collapsed && <SidebarGroupLabel className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 px-3">Workshop</SidebarGroupLabel>}
          <SidebarGroupContent>
            <SidebarMenu>
              {workshopItems.map((item) => {
                const active = item.exact ? location.pathname === item.path : isActive(item.path);
                const Icon = item.icon;
                return (
                  <SidebarMenuItem key={item.path}>
                    <SidebarMenuButton
                      asChild
                      isActive={active}
                      tooltip={item.label}
                    >
                      <button
                        onClick={() => navigate(item.path)}
                        className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all ${
                          active
                            ? "bg-primary/10 text-primary"
                            : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                        }`}
                      >
                        <Icon className="h-4 w-4 shrink-0" />
                        {!collapsed && <span>{item.label}</span>}
                        {active && !collapsed && (
                          <motion.div
                            layoutId="sidebar-workshop-active"
                            className="ml-auto h-1.5 w-1.5 rounded-full bg-primary"
                          />
                        )}
                      </button>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      {/* Footer: credits + user */}
      <SidebarFooter className="px-3 py-3 border-t border-border/50 space-y-2">
        {user && !collapsed && (
          <div className="flex items-center gap-2 rounded-xl bg-secondary/50 px-3 py-2">
            <Coins className="h-4 w-4 text-pillar-impact shrink-0" />
            <span className="text-xs font-semibold text-foreground">{balance} crédits</span>
          </div>
        )}

        {user ? (
          <div className={`flex items-center ${collapsed ? "justify-center" : "gap-2"}`}>
            <Avatar className="h-8 w-8 shrink-0">
              <AvatarFallback className="bg-primary/20 text-primary text-xs font-bold">
                {(profile?.display_name || user.email || "U")[0].toUpperCase()}
              </AvatarFallback>
            </Avatar>
            {!collapsed && (
              <>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold truncate">{profile?.display_name || user.email}</p>
                  <p className="text-[10px] text-muted-foreground">{profile?.xp || 0} XP</p>
                </div>
                <button
                  onClick={signOut}
                  className="h-7 w-7 flex items-center justify-center rounded-lg hover:bg-destructive/10 hover:text-destructive transition-colors"
                >
                  <LogOut className="h-3.5 w-3.5" />
                </button>
              </>
            )}
          </div>
        ) : (
          <button
            onClick={() => navigate("/auth")}
            className={`flex w-full items-center gap-2 rounded-xl bg-primary/10 px-3 py-2 text-sm font-medium text-primary hover:bg-primary/20 transition-colors ${collapsed ? "justify-center px-2" : ""}`}
          >
            <User className="h-4 w-4 shrink-0" />
            {!collapsed && <span>Se connecter</span>}
          </button>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}
