import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { AdminShell } from "@/components/admin/AdminShell";
import { useAdminToolkitDetail } from "@/hooks/useAdminToolkits";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft, Loader2, Settings, Layers, LayoutGrid, Swords, Map, HelpCircle, Building2, Sparkles, Image as ImageIcon, Gamepad2, RefreshCw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { appendAuditLog } from "@/lib/auditClient";
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
  const [scope, setScope] = useState<string>("missing"); // missing | failed | all | pillar:<id>
  const [lastChangeAt, setLastChangeAt] = useState<number>(Date.now());
  const [stale, setStale] = useState(false);
  const [resuming, setResuming] = useState(false);

  const cardsWithoutImage = cards.filter((c: any) => !c.image_url).length;
  const cardsFailed = cards.filter((c: any) => c.image_status === "failed").length;
  const cardsQueued = cards.filter((c: any) => c.image_status === "queued").length;
  const cardsGenerating = cards.filter((c: any) => c.image_status === "generating").length;
  // Strict count: only "ready" qualifies as done (avoid counting stale URLs during regen)
  const cardsReady = cards.filter((c: any) => c.image_status === "ready").length;
  const inFlight = cardsQueued + cardsGenerating;

  // Realtime subscription on cards of this toolkit's pillars → live progress without polling
  useEffect(() => {
    if (!toolkit || pillars.length === 0) return;
    const pillarIds = pillars.map((p: any) => p.id);
    const channel = supabase
      .channel(`toolkit-cards-${toolkit.id}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "cards", filter: `pillar_id=in.(${pillarIds.join(",")})` },
        () => { setLastChangeAt(Date.now()); setStale(false); invalidateAll(); },
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [toolkit?.id, pillars.length]);

  // Stall detector: if cards are in-flight but no realtime change for >75s → assume worker died
  useEffect(() => {
    if (inFlight === 0) { setStale(false); return; }
    const t = setInterval(() => {
      if (Date.now() - lastChangeAt > 75_000) setStale(true);
    }, 5000);
    return () => clearInterval(t);
  }, [inFlight, lastChangeAt]);

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

  const launchGeneration = async () => {
    if (!toolkit) return;
    const ids = buildTargetIds();
    if (ids.length === 0) {
      toast.info("Aucune carte à traiter pour ce périmètre");
      return;
    }
    setGenLoading(true);
    try {
      // Chunk client-side: server enforces max 100 ids per call. Each call is fire-and-forget (background worker).
      const BATCH = 100;
      let queued = 0;
      for (let i = 0; i < ids.length; i += BATCH) {
        const chunk = ids.slice(i, i + BATCH);
        const { data, error } = await supabase.functions.invoke("academy-generate", {
          body: { action: "generate-card-illustrations-batch", card_ids: chunk },
        });
        if (error) throw error;
        queued += data?.queued ?? chunk.length;
      }
      setLastChangeAt(Date.now());
      setStale(false);
      toast.success(`Génération lancée (${queued} cartes)`, {
        description: "Le travail tourne en arrière-plan, vous pouvez fermer cette page. Reprise automatique en cas de coupure.",
        duration: 6000,
      });
      appendAuditLog({
        action: "toolkit.illustrations.bulk_generate",
        entityType: "toolkit",
        entityId: toolkit.id,
        payload: { scope, requested: ids.length, queued },
      });
      invalidateAll();
    } catch (e: any) {
      toast.error("Échec du lancement", { description: e?.message });
    } finally {
      setGenLoading(false);
    }
  };

  const resumeStuck = async () => {
    if (!toolkit) return;
    setResuming(true);
    try {
      const { data, error } = await supabase.functions.invoke("academy-generate", {
        body: { action: "sweep-stale-card-illustrations", toolkit_id: toolkit.id },
      });
      if (error) throw error;
      const swept = data?.swept ?? 0;
      if (swept === 0) {
        toast.info("Aucune carte bloquée détectée");
      } else {
        toast.success(`Reprise de ${swept} carte${swept > 1 ? "s" : ""} bloquée${swept > 1 ? "s" : ""}`);
      }
      setLastChangeAt(Date.now());
      setStale(false);
      appendAuditLog({
        action: "toolkit.illustrations.sweep",
        entityType: "toolkit",
        entityId: toolkit.id,
        payload: { swept },
      });
      invalidateAll();
    } catch (e: any) {
      toast.error("Échec de la reprise", { description: e?.message });
    } finally {
      setResuming(false);
    }
  };

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
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5"
              onClick={() => window.open(`/portal/workshops/toolkits/${toolkit.id}/playground`, "_blank")}
            >
              <Eye className="h-3.5 w-3.5" /> Aperçu Playground
            </Button>
            <ToolkitAIChatDialog toolkit={toolkit} pillars={pillars} onUpdate={invalidateAll} />
            <Badge variant="outline" className={s.className}>{s.label}</Badge>
            <Badge className="bg-primary text-primary-foreground text-[10px]">
              {cards.length} carte{cards.length > 1 ? "s" : ""}
            </Badge>
          </div>
        </div>

        <ToolkitCompletionBanner toolkit={toolkit} pillars={pillars} cards={cards} quizQuestions={quizQuestions} onUpdate={invalidateAll} />

        {/* Card illustrations banner */}
        <div className="rounded-xl border bg-card p-4 space-y-3">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-3 min-w-0">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <ImageIcon className="h-5 w-5 text-primary" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold">Illustrations des cartes</p>
                <p className="text-xs text-muted-foreground">
                  {cardsReady} / {cards.length} prêtes
                  {cardsQueued > 0 && ` · ${cardsQueued} en attente`}
                  {cardsGenerating > 0 && ` · ${cardsGenerating} en cours`}
                  {cardsFailed > 0 && ` · ${cardsFailed} en échec`}
                </p>
              </div>
            </div>
            <div className="flex gap-2 flex-shrink-0 items-center">
              <Select value={scope} onValueChange={setScope} disabled={genLoading}>
                <SelectTrigger className="h-8 w-[220px] text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="missing">Cartes manquantes ({cardsWithoutImage})</SelectItem>
                  <SelectItem value="failed">Cartes en échec ({cardsFailed})</SelectItem>
                  <SelectItem value="all">Toutes les cartes ({cards.length})</SelectItem>
                  {pillars.map((p: any) => (
                    <SelectItem key={p.id} value={`pillar:${p.id}`}>
                      Pilier · {p.name} ({cards.filter((c: any) => c.pillar_id === p.id).length})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button size="sm" variant="outline" onClick={() => invalidateAll()} disabled={genLoading}>
                <RefreshCw className="h-3.5 w-3.5" />
              </Button>
              <Button size="sm" onClick={launchGeneration} disabled={genLoading}>
                {genLoading ? <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" /> : <Sparkles className="h-3.5 w-3.5 mr-1" />}
                Lancer
              </Button>
            </div>
          </div>
          {inFlight > 0 && cards.length > 0 && (
            <div className="space-y-1">
              <Progress value={(cardsReady / cards.length) * 100} className="h-2" />
              <p className="text-[11px] text-muted-foreground">
                Génération en arrière-plan · {cardsReady} prêtes · {cardsGenerating} en cours · {cardsQueued} en file · {cardsFailed} échec(s)
              </p>
            </div>
          )}
          {(stale || (inFlight === 0 && cardsFailed > 0)) && (
            <div className="flex items-center justify-between gap-3 rounded-lg border border-amber-500/30 bg-amber-500/5 p-2.5">
              <p className="text-xs text-foreground">
                {stale
                  ? "Aucune progression détectée depuis plus d'une minute. Le worker a peut-être été interrompu."
                  : `${cardsFailed} carte${cardsFailed > 1 ? "s" : ""} en échec : tu peux relancer ou réveiller les cartes bloquées.`}
              </p>
              <Button size="sm" variant="outline" onClick={resumeStuck} disabled={resuming} className="gap-1.5 flex-shrink-0">
                {resuming ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
                Reprendre
              </Button>
            </div>
          )}
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
