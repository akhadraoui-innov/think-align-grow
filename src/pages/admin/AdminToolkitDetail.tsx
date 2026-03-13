import { useParams, useNavigate } from "react-router-dom";
import { AdminShell } from "@/components/admin/AdminShell";
import { useAdminToolkitDetail } from "@/hooks/useAdminToolkits";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Loader2, Settings, Layers, LayoutGrid, Swords, Map, HelpCircle, Building2 } from "lucide-react";
import { ToolkitInfoTab } from "@/components/admin/ToolkitInfoTab";
import { ToolkitPillarsTab } from "@/components/admin/ToolkitPillarsTab";
import { ToolkitCardsTab } from "@/components/admin/ToolkitCardsTab";
import { ToolkitChallengesTab } from "@/components/admin/ToolkitChallengesTab";
import { ToolkitGamePlansTab } from "@/components/admin/ToolkitGamePlansTab";
import { ToolkitQuizTab } from "@/components/admin/ToolkitQuizTab";
import { ToolkitOrgsTab } from "@/components/admin/ToolkitOrgsTab";
import { ToolkitCompletionBanner } from "@/components/admin/ToolkitCompletionBanner";
import { ToolkitAIChatDialog } from "@/components/admin/ToolkitAIChatDialog";

const STATUS_MAP: Record<string, { label: string; className: string }> = {
  draft: { label: "Brouillon", className: "bg-muted text-muted-foreground border-border" },
  published: { label: "Publié", className: "bg-pillar-finance/10 text-pillar-finance border-pillar-finance/30" },
  archived: { label: "Archivé", className: "bg-destructive/10 text-destructive border-destructive/30" },
};

export default function AdminToolkitDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const detail = useAdminToolkitDetail(id);
  const { toolkit, pillars, cards, challengeTemplates, gamePlans, quizQuestions, orgToolkits, isLoading, invalidateAll } = detail;

  if (isLoading) {
    return <AdminShell><div className="flex items-center justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div></AdminShell>;
  }

  if (!toolkit) {
    return <AdminShell><div className="p-6"><p className="text-muted-foreground">Toolkit introuvable.</p></div></AdminShell>;
  }

  const s = STATUS_MAP[toolkit.status] || STATUS_MAP.draft;

  return (
    <AdminShell>
      <div className="p-6 space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => navigate("/admin/toolkits")}>
            <ArrowLeft className="h-4 w-4 mr-1" /> Retour
          </Button>
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl flex items-center justify-center text-xl bg-muted">
              {toolkit.icon_emoji || "🚀"}
            </div>
            <div>
              <h1 className="text-xl font-display font-bold text-foreground">{toolkit.name}</h1>
              <p className="text-xs text-muted-foreground">
                {toolkit.slug} · {pillars.length} pilier{pillars.length > 1 ? "s" : ""} · {cards.length} carte{cards.length > 1 ? "s" : ""}
              </p>
            </div>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <ToolkitAIChatDialog toolkit={toolkit} pillars={pillars} onUpdate={invalidateAll} />
            <Badge variant="outline" className={s.className}>{s.label}</Badge>
            <Badge className="bg-primary text-primary-foreground text-[10px]">
              {cards.length} carte{cards.length > 1 ? "s" : ""}
            </Badge>
          </div>
        </div>

        <ToolkitCompletionBanner toolkit={toolkit} pillars={pillars} cards={cards} quizQuestions={quizQuestions} onUpdate={invalidateAll} />

        <Tabs defaultValue="info" className="space-y-4">
          <TabsList className="bg-muted/50 flex-wrap h-auto gap-1 p-1">
            <TabsTrigger value="info" className="gap-1.5 text-xs"><Settings className="h-3.5 w-3.5" /> Infos</TabsTrigger>
            <TabsTrigger value="pillars" className="gap-1.5 text-xs"><Layers className="h-3.5 w-3.5" /> Piliers ({pillars.length})</TabsTrigger>
            <TabsTrigger value="cards" className="gap-1.5 text-xs"><LayoutGrid className="h-3.5 w-3.5" /> Cartes ({cards.length})</TabsTrigger>
            <TabsTrigger value="challenges" className="gap-1.5 text-xs"><Swords className="h-3.5 w-3.5" /> Challenges ({challengeTemplates.length})</TabsTrigger>
            <TabsTrigger value="gameplans" className="gap-1.5 text-xs"><Map className="h-3.5 w-3.5" /> Game Plans ({gamePlans.length})</TabsTrigger>
            <TabsTrigger value="quiz" className="gap-1.5 text-xs"><HelpCircle className="h-3.5 w-3.5" /> Quiz ({quizQuestions.length})</TabsTrigger>
            <TabsTrigger value="orgs" className="gap-1.5 text-xs"><Building2 className="h-3.5 w-3.5" /> Organisations ({orgToolkits.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="info"><ToolkitInfoTab toolkit={toolkit} onUpdate={invalidateAll} /></TabsContent>
          <TabsContent value="pillars"><ToolkitPillarsTab pillars={pillars} toolkitId={toolkit.id} onUpdate={invalidateAll} /></TabsContent>
          <TabsContent value="cards"><ToolkitCardsTab cards={cards} pillars={pillars} toolkitId={toolkit.id} onUpdate={invalidateAll} /></TabsContent>
          <TabsContent value="challenges"><ToolkitChallengesTab templates={challengeTemplates} /></TabsContent>
          <TabsContent value="gameplans"><ToolkitGamePlansTab gamePlans={gamePlans} /></TabsContent>
          <TabsContent value="quiz"><ToolkitQuizTab questions={quizQuestions} pillars={pillars} /></TabsContent>
          <TabsContent value="orgs"><ToolkitOrgsTab orgToolkits={orgToolkits} toolkitId={toolkit.id} onUpdate={invalidateAll} /></TabsContent>
        </Tabs>
      </div>
    </AdminShell>
  );
}
