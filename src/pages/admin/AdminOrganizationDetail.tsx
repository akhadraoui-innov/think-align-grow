import { useParams, useNavigate } from "react-router-dom";
import { AdminShell } from "@/components/admin/AdminShell";
import { useOrganizationDetail } from "@/hooks/useOrganizations";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Loader2, Users, Layers, CreditCard, BarChart3, Settings, UsersRound, Presentation, ScrollText } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { OrgInfoTab } from "@/components/admin/OrgInfoTab";
import { OrgMembersTab } from "@/components/admin/OrgMembersTab";
import { OrgTeamsTab } from "@/components/admin/OrgTeamsTab";
import { OrgToolkitsTab } from "@/components/admin/OrgToolkitsTab";
import { OrgSubscriptionTab } from "@/components/admin/OrgSubscriptionTab";
import { OrgWorkshopsTab } from "@/components/admin/OrgWorkshopsTab";
import { OrgUsageTab } from "@/components/admin/OrgUsageTab";
import { OrgActivityTab } from "@/components/admin/OrgActivityTab";

export default function AdminOrganizationDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const {
    organization,
    members,
    toolkits,
    teams,
    subscription,
    workshops,
    activityLogs,
    isLoading,
  } = useOrganizationDetail(id);

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
              <p className="text-xs text-muted-foreground">
                {organization.slug} · créée le {format(new Date(organization.created_at), "dd MMM yyyy", { locale: fr })}
                {" · "}{members.length} membre{members.length > 1 ? "s" : ""}
                {" · "}{workshops.length} workshop{workshops.length > 1 ? "s" : ""}
              </p>
            </div>
          </div>
          <Badge variant="outline" className="ml-auto bg-pillar-finance/10 text-pillar-finance border-pillar-finance/30">
            Actif
          </Badge>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="info" className="space-y-4">
          <TabsList className="bg-muted/50 flex-wrap h-auto gap-1 p-1">
            <TabsTrigger value="info" className="gap-1.5 text-xs">
              <Settings className="h-3.5 w-3.5" /> Infos
            </TabsTrigger>
            <TabsTrigger value="members" className="gap-1.5 text-xs">
              <Users className="h-3.5 w-3.5" /> Membres ({members.length})
            </TabsTrigger>
            <TabsTrigger value="teams" className="gap-1.5 text-xs">
              <UsersRound className="h-3.5 w-3.5" /> Équipes ({teams.length})
            </TabsTrigger>
            <TabsTrigger value="toolkits" className="gap-1.5 text-xs">
              <Layers className="h-3.5 w-3.5" /> Toolkits ({toolkits.length})
            </TabsTrigger>
            <TabsTrigger value="subscription" className="gap-1.5 text-xs">
              <CreditCard className="h-3.5 w-3.5" /> Abonnement
            </TabsTrigger>
            <TabsTrigger value="workshops" className="gap-1.5 text-xs">
              <Presentation className="h-3.5 w-3.5" /> Workshops ({workshops.length})
            </TabsTrigger>
            <TabsTrigger value="usage" className="gap-1.5 text-xs">
              <BarChart3 className="h-3.5 w-3.5" /> Usage
            </TabsTrigger>
            <TabsTrigger value="activity" className="gap-1.5 text-xs">
              <ScrollText className="h-3.5 w-3.5" /> Activité
            </TabsTrigger>
          </TabsList>

          <TabsContent value="info">
            <OrgInfoTab
              organization={organization as any}
              stats={{
                memberCount: members.length,
                teamCount: teams.length,
                workshopCount: workshops.length,
                toolkitCount: toolkits.length,
                subscriptionPlan: (subscription as any)?.subscription_plans?.name || null,
                subscriptionStatus: subscription?.status || null,
              }}
            />
          </TabsContent>

          <TabsContent value="members">
            <OrgMembersTab members={members} organizationId={organization.id} />
          </TabsContent>

          <TabsContent value="teams">
            <OrgTeamsTab teams={teams} organizationId={organization.id} />
          </TabsContent>

          <TabsContent value="toolkits">
            <OrgToolkitsTab toolkits={toolkits} organizationId={organization.id} />
          </TabsContent>

          <TabsContent value="subscription">
            <OrgSubscriptionTab subscription={subscription} />
          </TabsContent>

          <TabsContent value="workshops">
            <OrgWorkshopsTab workshops={workshops} />
          </TabsContent>

          <TabsContent value="usage">
            <OrgUsageTab
              memberCount={members.length}
              workshopCount={workshops.length}
              toolkitCount={toolkits.length}
              subscription={subscription}
            />
          </TabsContent>

          <TabsContent value="activity">
            <OrgActivityTab logs={activityLogs} />
          </TabsContent>
        </Tabs>
      </div>
    </AdminShell>
  );
}
