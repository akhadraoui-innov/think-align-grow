import { useParams, useNavigate } from "react-router-dom";
import { AdminShell } from "@/components/admin/AdminShell";
import { useOrganizationDetail } from "@/hooks/useOrganizations";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Loader2, Users, Layers, CreditCard, BarChart3, Settings } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

export default function AdminOrganizationDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { organization, members, toolkits, isLoading } = useOrganizationDetail(id);

  if (isLoading) {
    return (
      <AdminShell>
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      </AdminShell>
    );
  }

  if (!organization) {
    return (
      <AdminShell>
        <div className="p-6">
          <p className="text-muted-foreground">Organisation introuvable.</p>
        </div>
      </AdminShell>
    );
  }

  return (
    <AdminShell>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => navigate("/admin/organizations")}>
            <ArrowLeft className="h-4 w-4 mr-1" />
            Retour
          </Button>
          <div className="flex items-center gap-3">
            <div
              className="h-10 w-10 rounded-xl flex items-center justify-center text-sm font-bold text-white shadow-sm"
              style={{ backgroundColor: organization.primary_color || "#E8552D" }}
            >
              {organization.name[0]?.toUpperCase()}
            </div>
            <div>
              <h1 className="text-xl font-display font-bold text-foreground">{organization.name}</h1>
              <p className="text-xs text-muted-foreground">{organization.slug} · créée le {format(new Date(organization.created_at), "dd MMM yyyy", { locale: fr })}</p>
            </div>
          </div>
          <Badge variant="outline" className="ml-auto bg-pillar-finance/10 text-pillar-finance border-pillar-finance/30">
            Actif
          </Badge>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="info" className="space-y-4">
          <TabsList className="bg-muted/50">
            <TabsTrigger value="info" className="gap-1.5"><Settings className="h-3.5 w-3.5" /> Infos</TabsTrigger>
            <TabsTrigger value="members" className="gap-1.5"><Users className="h-3.5 w-3.5" /> Membres ({members.length})</TabsTrigger>
            <TabsTrigger value="toolkits" className="gap-1.5"><Layers className="h-3.5 w-3.5" /> Toolkits ({toolkits.length})</TabsTrigger>
            <TabsTrigger value="billing" className="gap-1.5"><CreditCard className="h-3.5 w-3.5" /> Abonnement</TabsTrigger>
            <TabsTrigger value="usage" className="gap-1.5"><BarChart3 className="h-3.5 w-3.5" /> Usage</TabsTrigger>
          </TabsList>

          <TabsContent value="info">
            <div className="rounded-xl border border-border/50 bg-card p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Nom</p>
                  <p className="font-medium text-foreground">{organization.name}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Slug</p>
                  <p className="font-medium text-foreground">{organization.slug}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Couleur</p>
                  <div className="flex items-center gap-2">
                    <div className="h-5 w-5 rounded" style={{ backgroundColor: organization.primary_color || "#E8552D" }} />
                    <span className="text-sm text-foreground">{organization.primary_color}</span>
                  </div>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Logo</p>
                  <p className="text-sm text-muted-foreground">{organization.logo_url || "Aucun"}</p>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="members">
            <div className="rounded-xl border border-border/50 bg-card p-6">
              {members.length === 0 ? (
                <p className="text-sm text-muted-foreground">Aucun membre dans cette organisation.</p>
              ) : (
                <div className="space-y-3">
                  {members.map((m) => (
                    <div key={m.id} className="flex items-center justify-between py-2 border-b border-border/30 last:border-0">
                      <div>
                        <p className="text-sm font-medium text-foreground">{m.user_id.slice(0, 8)}...</p>
                        <p className="text-xs text-muted-foreground">Depuis {format(new Date(m.created_at), "dd MMM yyyy", { locale: fr })}</p>
                      </div>
                      <Badge variant="outline" className="text-xs">{m.role}</Badge>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="toolkits">
            <div className="rounded-xl border border-border/50 bg-card p-6">
              {toolkits.length === 0 ? (
                <p className="text-sm text-muted-foreground">Aucun toolkit assigné.</p>
              ) : (
                <div className="space-y-3">
                  {toolkits.map((t: any) => (
                    <div key={t.id} className="flex items-center justify-between py-2 border-b border-border/30 last:border-0">
                      <div>
                        <p className="text-sm font-medium text-foreground">{t.toolkits?.name || "Toolkit"}</p>
                        <p className="text-xs text-muted-foreground">Max {t.max_members ?? "∞"} membres</p>
                      </div>
                      <Badge variant={t.is_active ? "default" : "secondary"} className="text-xs">
                        {t.is_active ? "Actif" : "Inactif"}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="billing">
            <div className="rounded-xl border border-border/50 bg-card p-6">
              <p className="text-sm text-muted-foreground">Gestion des abonnements — Sprint 9.</p>
            </div>
          </TabsContent>

          <TabsContent value="usage">
            <div className="rounded-xl border border-border/50 bg-card p-6">
              <p className="text-sm text-muted-foreground">Statistiques d'usage — Sprint 9.</p>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </AdminShell>
  );
}
