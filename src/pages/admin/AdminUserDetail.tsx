import { useParams, useNavigate } from "react-router-dom";
import { AdminShell } from "@/components/admin/AdminShell";
import { useAdminUserDetail } from "@/hooks/useAdminUserDetail";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  ArrowLeft, Loader2, Settings, Shield, Building2, CreditCard,
  Presentation, Swords, BookOpen, ScrollText,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import { useState } from "react";

import { UserInfoTab } from "@/components/admin/UserInfoTab";
import { UserRolesTab } from "@/components/admin/UserRolesTab";
import { UserOrgsTab } from "@/components/admin/UserOrgsTab";
import { UserCreditsTab } from "@/components/admin/UserCreditsTab";
import { UserWorkshopsTab } from "@/components/admin/UserWorkshopsTab";
import { UserChallengesTab } from "@/components/admin/UserChallengesTab";
import { UserCardsTab } from "@/components/admin/UserCardsTab";
import { UserActivityTab } from "@/components/admin/UserActivityTab";

export default function AdminUserDetail() {
  const { userId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);

  const {
    profile,
    roles,
    organizations,
    credits,
    workshops,
    challenges,
    quizResults,
    cardProgress,
    activityLogs,
    isLoading,
    updateProfile,
    addRole,
    removeRole,
    adjustCredits,
  } = useAdminUserDetail(userId);

  if (isLoading) {
    return (
      <AdminShell>
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      </AdminShell>
    );
  }

  if (!profile) {
    return (
      <AdminShell>
        <div className="p-6">
          <p className="text-muted-foreground">Utilisateur introuvable.</p>
        </div>
      </AdminShell>
    );
  }

  const createdAgo = formatDistanceToNow(new Date(profile.created_at), { addSuffix: true, locale: fr });

  const handleSaveProfile = async (updates: Record<string, any>) => {
    setSaving(true);
    try {
      await updateProfile.mutateAsync(updates);
      toast({ title: "Profil mis à jour" });
    } catch (e: any) {
      toast({ title: "Erreur", description: e.message, variant: "destructive" });
    }
    setSaving(false);
  };

  const handleAddRole = async (role: string) => {
    try {
      await addRole.mutateAsync(role);
      toast({ title: `Rôle "${role.replace(/_/g, " ")}" ajouté` });
    } catch (e: any) {
      toast({ title: "Erreur", description: e.message, variant: "destructive" });
    }
  };

  const handleRemoveRole = async (role: string) => {
    try {
      await removeRole.mutateAsync(role);
      toast({ title: `Rôle "${role.replace(/_/g, " ")}" retiré` });
    } catch (e: any) {
      toast({ title: "Erreur", description: e.message, variant: "destructive" });
    }
  };

  const handleAdjustCredits = async (amount: number, description: string) => {
    try {
      await adjustCredits.mutateAsync({ amount, description });
      toast({ title: `${amount > 0 ? "+" : ""}${amount} crédits` });
    } catch (e: any) {
      toast({ title: "Erreur", description: e.message, variant: "destructive" });
    }
  };

  return (
    <AdminShell>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => navigate("/admin/users")}>
            <ArrowLeft className="h-4 w-4 mr-1" /> Retour
          </Button>
          <Avatar className="h-12 w-12">
            <AvatarImage src={profile.avatar_url || undefined} />
            <AvatarFallback className="bg-primary/10 text-primary text-lg font-bold">
              {(profile.display_name || "?")[0]?.toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div>
            <h1 className="text-xl font-display font-bold text-foreground">
              {profile.display_name || "Sans nom"}
            </h1>
            <p className="text-xs text-muted-foreground">
              {(profile as any).job_title && `${(profile as any).job_title} · `}
              Inscrit {createdAgo}
              {" · "}{profile.xp} XP
              {" · "}{credits?.balance.balance ?? 0} crédits
              {" · "}{organizations.length} org{organizations.length > 1 ? "s" : ""}
              {" · "}{workshops.hosted.length + workshops.participations.length} workshop{workshops.hosted.length + workshops.participations.length > 1 ? "s" : ""}
            </p>
          </div>
          <div className="ml-auto flex items-center gap-2">
            {roles.map((r) => (
              <Badge key={r} variant="outline" className="text-[10px]">{r.replace(/_/g, " ")}</Badge>
            ))}
            <Badge variant="outline" className={`text-xs ${profile.status === "active" ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/30" : ""}`}>
              {profile.status === "active" ? "Actif" : profile.status}
            </Badge>
          </div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="info" className="space-y-4">
          <TabsList className="bg-muted/50 flex-wrap h-auto gap-1 p-1">
            <TabsTrigger value="info" className="gap-1.5 text-xs">
              <Settings className="h-3.5 w-3.5" /> Infos
            </TabsTrigger>
            <TabsTrigger value="roles" className="gap-1.5 text-xs">
              <Shield className="h-3.5 w-3.5" /> Rôles ({roles.length})
            </TabsTrigger>
            <TabsTrigger value="organizations" className="gap-1.5 text-xs">
              <Building2 className="h-3.5 w-3.5" /> Organisations ({organizations.length})
            </TabsTrigger>
            <TabsTrigger value="credits" className="gap-1.5 text-xs">
              <CreditCard className="h-3.5 w-3.5" /> Crédits
            </TabsTrigger>
            <TabsTrigger value="workshops" className="gap-1.5 text-xs">
              <Presentation className="h-3.5 w-3.5" /> Workshops ({workshops.hosted.length + workshops.participations.length})
            </TabsTrigger>
            <TabsTrigger value="challenges" className="gap-1.5 text-xs">
              <Swords className="h-3.5 w-3.5" /> Challenges ({challenges.length})
            </TabsTrigger>
            <TabsTrigger value="cards" className="gap-1.5 text-xs">
              <BookOpen className="h-3.5 w-3.5" /> Cartes ({cardProgress.length})
            </TabsTrigger>
            <TabsTrigger value="activity" className="gap-1.5 text-xs">
              <ScrollText className="h-3.5 w-3.5" /> Activité
            </TabsTrigger>
          </TabsList>

          <TabsContent value="info">
            <UserInfoTab profile={profile} onSave={handleSaveProfile} saving={saving} />
          </TabsContent>

          <TabsContent value="roles">
            <UserRolesTab roles={roles} onAddRole={handleAddRole} onRemoveRole={handleRemoveRole} />
          </TabsContent>

          <TabsContent value="organizations">
            <UserOrgsTab
              organizations={organizations as any}
              onAdd={async (orgId, role) => {
                try {
                  await addToOrganization.mutateAsync({ organizationId: orgId, role });
                  toast({ title: "Organisation ajoutée" });
                } catch (e: any) {
                  toast({ title: "Erreur", description: e.message, variant: "destructive" });
                }
              }}
              onRemove={async (membershipId) => {
                try {
                  await removeFromOrganization.mutateAsync(membershipId);
                  toast({ title: "Organisation retirée" });
                } catch (e: any) {
                  toast({ title: "Erreur", description: e.message, variant: "destructive" });
                }
              }}
            />
          </TabsContent>

          <TabsContent value="credits">
            <UserCreditsTab
              balance={credits?.balance || { balance: 0, lifetime_earned: 0 }}
              transactions={credits?.transactions || []}
              onAdjust={handleAdjustCredits}
            />
          </TabsContent>

          <TabsContent value="workshops">
            <UserWorkshopsTab hosted={workshops.hosted} participations={workshops.participations as any} />
          </TabsContent>

          <TabsContent value="challenges">
            <UserChallengesTab challenges={challenges} quizResults={quizResults as any} />
          </TabsContent>

          <TabsContent value="cards">
            <UserCardsTab progress={cardProgress as any} />
          </TabsContent>

          <TabsContent value="activity">
            <UserActivityTab logs={activityLogs} />
          </TabsContent>
        </Tabs>
      </div>
    </AdminShell>
  );
}
