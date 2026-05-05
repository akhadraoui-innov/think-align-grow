import { useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { AdminShell } from "@/components/admin/AdminShell";
import { useAdminToolkitDetail } from "@/hooks/useAdminToolkits";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft, Loader2, Settings, Layers, LayoutGrid, Swords, Map, HelpCircle, Building2, Sparkles, Image as ImageIcon, Square, Gamepad2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ToolkitInfoTab } from "@/components/admin/ToolkitInfoTab";
import { ToolkitPillarsTab } from "@/components/admin/ToolkitPillarsTab";
import { ToolkitCardsTab } from "@/components/admin/ToolkitCardsTab";
import { ToolkitChallengesTab } from "@/components/admin/ToolkitChallengesTab";
import { ToolkitGamePlansTab } from "@/components/admin/ToolkitGamePlansTab";
import { ToolkitQuizTab } from "@/components/admin/ToolkitQuizTab";
import { ToolkitOrgsTab } from "@/components/admin/ToolkitOrgsTab";
import { ToolkitCompletionBanner } from "@/components/admin/ToolkitCompletionBanner";
import { ToolkitAIChatDialog } from "@/components/admin/ToolkitAIChatDialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

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
  const [genLoading, setGenLoading] = useState(false);
  const [genProgress, setGenProgress] = useState({ done: 0, total: 0, ok: 0, fail: 0 });
  const [scope, setScope] = useState<string>("missing"); // missing | failed | all | pillar:<id>
  const cancelRef = useRef(false);

  const cardsWithoutImage = cards.filter((c: any) => !c.image_url).length;
  const cardsFailed = cards.filter((c: any) => c.image_status === "failed").length;

  const buildTargetIds = (): string[] => {
    if (scope === "missing") return cards.filter((c: any) => !c.image_url).map((c: any) => c.id);
    if (scope === "failed") return cards.filter((c: any) => c.image_status === "failed").map((c: any) => c.id);
    if (scope === "all") return cards.map((c: any) => c.id);
    if (scope.startsWith("pillar:")) {
      const pid = scope.slice(7);
      return cards.filter((c: any) => c.pillar_id === pid).map((c: any) => c.id);
    }
    return [];
  };

  const runBatches = async () => {
    if (!toolkit) return;
    const ids = buildTargetIds();
    if (ids.length === 0) {
      toast.info("Aucune carte à traiter pour ce périmètre");
      return;
    }
    cancelRef.current = false;
    setGenLoading(true);
    setGenProgress({ done: 0, total: ids.length, ok: 0, fail: 0 });

    const BATCH = 10;
    let ok = 0, fail = 0, done = 0;
    try {
      for (let i = 0; i < ids.length; i += BATCH) {
        if (cancelRef.current) break;
        const slice = ids.slice(i, i + BATCH);
        const { data, error } = await supabase.functions.invoke("academy-generate", {
          body: { action: "generate-card-illustrations-batch", card_ids: slice },
        });
        if (error) throw error;
        ok += data?.succeeded || 0;
        fail += data?.failed || 0;
        done += data?.processed || 0;
        setGenProgress({ done, total: ids.length, ok, fail });
        if (data?.aiCredits === "exhausted") {
          toast.error("Solde IA épuisé", {
            description: "Rechargez dans Cloud & AI balance puis relancez.",
            duration: 8000,
          });
          break;
        }
      }
      if (!cancelRef.current) {
        toast.success(`Terminé : ${ok} générées, ${fail} échec(s)`);
      } else {
        toast.info(`Interrompu : ${ok} générées sur ${ids.length}`);
      }
      invalidateAll();
    } catch (e: any) {
      toast.error("Échec du batch", { description: e?.message });
    } finally {
      setGenLoading(false);
    }
  };

  const cancelBatch = () => { cancelRef.current = true; };

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

        {/* Card illustrations banner */}
        <div className="rounded-xl border bg-card p-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <ImageIcon className="h-5 w-5 text-primary" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold">Illustrations des cartes</p>
              <p className="text-xs text-muted-foreground">
                {cards.length - cardsWithoutImage} / {cards.length} cartes illustrées
                {cardsWithoutImage > 0 && ` · ${cardsWithoutImage} sans illustration`}
              </p>
            </div>
          </div>
          <div className="flex gap-2 flex-shrink-0">
            <Button size="sm" variant="outline" onClick={() => handleGenerateAllIllustrations(false)} disabled={genLoading || cardsWithoutImage === 0}>
              {genLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> : <Sparkles className="h-3.5 w-3.5 mr-1" />}
              Générer manquantes
            </Button>
            <Button size="sm" variant="ghost" onClick={() => handleGenerateAllIllustrations(true)} disabled={genLoading || cards.length === 0}>
              Tout régénérer
            </Button>
          </div>
        </div>

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
