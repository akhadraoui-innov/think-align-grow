import { useParams, useNavigate } from "react-router-dom";
import { AdminShell } from "@/components/admin/AdminShell";
import { useAdminChallengeDetail } from "@/hooks/useAdminChallenges";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Loader2, Settings, GitBranch, Calendar, BarChart3 } from "lucide-react";
import { ChallengeInfoTab } from "@/components/admin/ChallengeInfoTab";
import { ChallengeSubjectsTab } from "@/components/admin/ChallengeSubjectsTab";
import { ChallengeSessionsTab } from "@/components/admin/ChallengeSessionsTab";
import { ChallengeAnalysesTab } from "@/components/admin/ChallengeAnalysesTab";
import { useMemo } from "react";

const DIFFICULTY_MAP: Record<string, { label: string; className: string }> = {
  beginner: { label: "Débutant", className: "bg-pillar-finance/10 text-pillar-finance border-pillar-finance/30" },
  intermediate: { label: "Intermédiaire", className: "bg-primary/10 text-primary border-primary/30" },
  advanced: { label: "Avancé", className: "bg-destructive/10 text-destructive border-destructive/30" },
};

export default function AdminChallengeDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { template, subjects, analyses, sessions, toolkits, pillars, participantCounts, responseCounts, isLoading, invalidateAll } = useAdminChallengeDetail(id);

  // Build analyses map: workshop_id → { maturity }
  const analysesMap = useMemo(() => {
    const map: Record<string, { maturity: number | null }> = {};
    for (const a of analyses) {
      const analysis = typeof a.analysis === "object" ? a.analysis : {};
      const maturity = (analysis as any)?.global_maturity ?? (analysis as any)?.maturity ?? null;
      map[a.workshop_id] = { maturity };
    }
    return map;
  }, [analyses]);

  // Total slots count for completion calculation
  const totalSlots = useMemo(() => {
    return subjects.reduce((acc, s) => acc + ((s as any).challenge_slots?.length || 0), 0);
  }, [subjects]);

  if (isLoading) {
    return <AdminShell><div className="flex items-center justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div></AdminShell>;
  }

  if (!template) {
    return <AdminShell><div className="p-6"><p className="text-muted-foreground">Template introuvable.</p></div></AdminShell>;
  }

  const d = DIFFICULTY_MAP[template.difficulty || "intermediate"] || DIFFICULTY_MAP.intermediate;

  return (
    <AdminShell>
      <div className="p-6 space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => navigate("/admin/design-innovation")}>
            <ArrowLeft className="h-4 w-4 mr-1" /> Retour
          </Button>
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl flex items-center justify-center text-xl bg-muted">
              {(template as any).toolkits?.icon_emoji || "🎯"}
            </div>
            <div>
              <h1 className="text-xl font-display font-bold text-foreground">{template.name}</h1>
              <p className="text-xs text-muted-foreground">
                {(template as any).toolkits?.name || "—"} · {subjects.length} sujet{subjects.length > 1 ? "s" : ""} · {totalSlots} slot{totalSlots > 1 ? "s" : ""}
              </p>
            </div>
          </div>
          <Badge variant="outline" className={`ml-auto ${d.className}`}>{d.label}</Badge>
        </div>

        <Tabs defaultValue="info" className="space-y-4">
          <TabsList className="bg-muted/50 flex-wrap h-auto gap-1 p-1">
            <TabsTrigger value="info" className="gap-1.5 text-xs"><Settings className="h-3.5 w-3.5" /> Infos</TabsTrigger>
            <TabsTrigger value="subjects" className="gap-1.5 text-xs"><GitBranch className="h-3.5 w-3.5" /> Sujets & Slots ({subjects.length})</TabsTrigger>
            <TabsTrigger value="sessions" className="gap-1.5 text-xs"><Calendar className="h-3.5 w-3.5" /> Sessions ({sessions.length})</TabsTrigger>
            <TabsTrigger value="analyses" className="gap-1.5 text-xs"><BarChart3 className="h-3.5 w-3.5" /> Analyses ({analyses.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="info">
            <ChallengeInfoTab template={template} toolkits={toolkits} pillars={pillars} onUpdate={invalidateAll} />
          </TabsContent>
          <TabsContent value="subjects">
            <ChallengeSubjectsTab subjects={subjects} templateId={template.id} onUpdate={invalidateAll} />
          </TabsContent>
          <TabsContent value="sessions">
            <ChallengeSessionsTab
              sessions={sessions}
              participantCounts={participantCounts}
              responseCounts={responseCounts}
              analysesMap={analysesMap}
              totalSlots={totalSlots}
            />
          </TabsContent>
          <TabsContent value="analyses">
            <ChallengeAnalysesTab analyses={analyses} />
          </TabsContent>
        </Tabs>
      </div>
    </AdminShell>
  );
}
