import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AdminSidebar } from "./AdminSidebar";
import { AdminGuard } from "./AdminGuard";
import { useLocation } from "react-router-dom";

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
};

export function AdminShell({ children }: AdminShellProps) {
  const location = useLocation();
  const label = breadcrumbMap[location.pathname] || "Administration";

  return (
    <AdminGuard>
      <SidebarProvider defaultOpen={true}>
        <div className="min-h-screen flex w-full bg-background">
          <AdminSidebar />
          <div className="flex-1 flex flex-col min-w-0">
            <header className="sticky top-0 z-40 flex h-12 items-center gap-3 border-b border-border/50 bg-background/80 backdrop-blur-xl px-4">
              <SidebarTrigger className="h-7 w-7 text-muted-foreground hover:text-foreground" />
              <div className="h-4 w-px bg-border/50" />
              <div className="flex items-center gap-2 text-sm">
                <span className="text-muted-foreground/60 text-xs font-medium">Admin</span>
                <span className="text-muted-foreground/40">/</span>
                <span className="font-semibold text-foreground text-xs">{label}</span>
              </div>
            </header>
            <main className="flex-1 overflow-auto">{children}</main>
          </div>
        </div>
      </SidebarProvider>
    </AdminGuard>
  );
}
