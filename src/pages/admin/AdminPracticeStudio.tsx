import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { AdminGuard } from "@/components/admin/AdminGuard";
import { StudioShell } from "@/components/admin/practice-studio/StudioShell";
import { PracticeListPanel } from "@/components/admin/practice-studio/PracticeListPanel";
import { LivePreviewPanel } from "@/components/admin/practice-studio/LivePreviewPanel";
import { IdentityTab } from "@/components/admin/practice-studio/tabs/IdentityTab";
import { ScenarioTab } from "@/components/admin/practice-studio/tabs/ScenarioTab";
import { AIPromptsTab } from "@/components/admin/practice-studio/tabs/AIPromptsTab";
import { MechanicsTab } from "@/components/admin/practice-studio/tabs/MechanicsTab";
import { CoachingTab } from "@/components/admin/practice-studio/tabs/CoachingTab";
import { VariantsTab } from "@/components/admin/practice-studio/tabs/VariantsTab";
import { EvaluationTab } from "@/components/admin/practice-studio/tabs/EvaluationTab";
import { DistributionTab } from "@/components/admin/practice-studio/tabs/DistributionTab";
import { AnalyticsTab } from "@/components/admin/practice-studio/tabs/AnalyticsTab";
import { VersionsTab } from "@/components/admin/practice-studio/tabs/VersionsTab";
import { BlockLibrary } from "@/components/admin/practice-studio/BlockLibrary";
import { AICopilot } from "@/components/admin/practice-studio/AICopilot";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { AlertCircle } from "lucide-react";
import {
  useAdminPractices, useUpdatePractice, useCreatePractice,
  useDuplicatePractice, useSnapshotPractice, useUpsertVariant, type AdminPractice,
} from "@/hooks/useAdminPractices";
import { toast } from "sonner";

type TabKey = "identity" | "scenario" | "ai" | "mechanics" | "coaching" | "variants" | "evaluation" | "distribution" | "analytics" | "versions";

function computeTabIssues(p: AdminPractice | null): Record<TabKey, boolean> {
  if (!p) return {} as any;
  const dims = (p.evaluation_dimensions ?? []) as Array<{ weight: number }>;
  const totalWeight = dims.reduce((s, d) => s + (d.weight || 0), 0);
  return {
    identity: !p.title?.trim(),
    scenario: !p.scenario?.trim(),
    ai: !p.system_prompt?.trim(),
    mechanics: false,
    coaching: false,
    variants: false,
    evaluation: p.evaluation_strategy === "dimensions" && totalWeight !== 100,
    distribution: false,
    analytics: false,
    versions: false,
  };
}

export default function AdminPracticeStudio() {
  const [params, setParams] = useSearchParams();
  const { data: practices = [], isLoading } = useAdminPractices();
  const updateMut = useUpdatePractice();
  const createMut = useCreatePractice();
  const duplicateMut = useDuplicatePractice();
  const snapshotMut = useSnapshotPractice();
  const upsertVariant = useUpsertVariant();

  const selectedId = params.get("id");
  const selected = useMemo(() => practices.find(p => p.id === selectedId), [practices, selectedId]);

  const [draft, setDraft] = useState<AdminPractice | null>(null);
  const [showPreview, setShowPreview] = useState(true);
  const [tab, setTab] = useState<TabKey>("identity");
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
  const [libraryOpen, setLibraryOpen] = useState(false);
  const [copilotOpen, setCopilotOpen] = useState(false);
  const debounceRef = useRef<number | null>(null);
  const editsCount = useRef(0);

  // Auto-select first practice
  useEffect(() => {
    if (!selectedId && practices.length > 0) {
      setParams({ id: practices[0].id }, { replace: true });
    }
  }, [practices, selectedId, setParams]);

  // Sync draft with selection
  useEffect(() => {
    setDraft(selected ? { ...selected } : null);
    setLastSavedAt(selected ? new Date(selected.updated_at) : null);
    editsCount.current = 0;
  }, [selected?.id]);

  const apply = (patch: Partial<AdminPractice>) => {
    if (!draft) return;
    const next = { ...draft, ...patch };
    setDraft(next);
    if (debounceRef.current) window.clearTimeout(debounceRef.current);
    debounceRef.current = window.setTimeout(() => {
      updateMut.mutate(
        { id: next.id, patch },
        {
          onSuccess: () => {
            setLastSavedAt(new Date());
            editsCount.current += 1;
            // Auto-snapshot every 10 saves
            if (editsCount.current >= 10) {
              snapshotMut.mutate({ practiceId: next.id, summary: "Auto-snapshot (10 modifs)" });
              editsCount.current = 0;
            }
          },
        }
      );
    }, 800);
  };

  const handleCreate = async () => {
    const created = await createMut.mutateAsync({
      title: "Nouvelle pratique",
      practice_type: "conversation",
      scenario: "",
      system_prompt: "",
      status: "draft",
    });
    if (created) setParams({ id: created.id });
  };

  const handleDuplicate = async () => {
    if (!draft) return;
    const dup = await duplicateMut.mutateAsync(draft.id);
    if (dup) setParams({ id: (dup as any).id });
  };

  const handleSnapshot = () => {
    if (!draft) return;
    snapshotMut.mutate({ practiceId: draft.id, summary: "Snapshot manuel" }, {
      onSuccess: () => toast.success("Version enregistrée"),
    });
  };

  const handleVariantsGenerated = (variants: Array<{ variant_label: string; system_prompt: string }>) => {
    if (!draft) return;
    variants.forEach((v, i) => {
      upsertVariant.mutate({
        practice_id: draft.id,
        variant_label: v.variant_label,
        system_prompt: v.system_prompt,
        weight: Math.floor(100 / variants.length),
        is_active: true,
      });
    });
    setTab("variants");
  };

  const issues = computeTabIssues(draft);

  const TabTrigger = ({ value, label }: { value: TabKey; label: string }) => (
    <TabsTrigger value={value} className="relative">
      {label}
      {issues[value] && (
        <span className="ml-1.5 inline-flex h-1.5 w-1.5 rounded-full bg-destructive" title="À compléter" />
      )}
    </TabsTrigger>
  );

  return (
    <AdminGuard>
      <StudioShell
        title={draft?.title}
        status={draft?.status}
        isPublic={draft?.is_public}
        saving={updateMut.isPending}
        lastSavedAt={lastSavedAt}
        showPreview={showPreview}
        onPreviewToggle={() => setShowPreview(v => !v)}
        onDuplicate={draft ? handleDuplicate : undefined}
        onShowVersions={draft ? handleSnapshot : undefined}
        onOpenLibrary={() => setLibraryOpen(true)}
        onOpenCopilot={draft ? () => setCopilotOpen(true) : undefined}
        onSave={() => draft && updateMut.mutate({ id: draft.id, patch: draft }, { onSuccess: () => setLastSavedAt(new Date()) })}
        list={
          <PracticeListPanel
            practices={practices}
            selectedId={selectedId}
            onSelect={(id) => setParams({ id })}
            onCreate={handleCreate}
          />
        }
        canvas={
          !draft ? (
            <div className="flex items-center justify-center h-full text-sm text-muted-foreground">
              {isLoading ? "Chargement…" : "Sélectionnez ou créez une pratique"}
            </div>
          ) : (
            <div className="p-6">
              <Tabs value={tab} onValueChange={(v) => setTab(v as TabKey)}>
                <TabsList className="mb-5 flex-wrap h-auto">
                  <TabTrigger value="identity" label="Identité" />
                  <TabTrigger value="scenario" label="Scénario" />
                  <TabTrigger value="ai" label="IA & Prompts" />
                  <TabTrigger value="mechanics" label="Mécanique" />
                  <TabTrigger value="coaching" label="Coaching" />
                  <TabTrigger value="variants" label="Variantes A/B" />
                  <TabTrigger value="evaluation" label="Évaluation" />
                  <TabTrigger value="distribution" label="Diffusion" />
                  <TabTrigger value="analytics" label="Analytics" />
                  <TabTrigger value="versions" label="Versions" />
                </TabsList>

                {issues[tab] && (
                  <div className="mb-4 flex items-center gap-2 rounded-lg border border-amber-500/30 bg-amber-500/5 p-3 text-xs text-amber-700 dark:text-amber-300">
                    <AlertCircle className="h-3.5 w-3.5" />
                    <span>Cet onglet contient des éléments à compléter.</span>
                  </div>
                )}

                <TabsContent value="identity"><IdentityTab practice={draft} onChange={apply} /></TabsContent>
                <TabsContent value="scenario"><ScenarioTab practice={draft} onChange={apply} /></TabsContent>
                <TabsContent value="ai"><AIPromptsTab practice={draft} onChange={apply} /></TabsContent>
                <TabsContent value="mechanics"><MechanicsTab practice={draft} onChange={apply} /></TabsContent>
                <TabsContent value="coaching"><CoachingTab practice={draft} onChange={apply} /></TabsContent>
                <TabsContent value="variants"><VariantsTab practice={draft} /></TabsContent>
                <TabsContent value="evaluation"><EvaluationTab practice={draft} onChange={apply} /></TabsContent>
                <TabsContent value="distribution"><DistributionTab practice={draft} /></TabsContent>
                <TabsContent value="analytics"><AnalyticsTab practiceId={draft.id} /></TabsContent>
                <TabsContent value="versions"><VersionsTab practiceId={draft.id} /></TabsContent>
              </Tabs>
            </div>
          )
        }
        preview={draft ? <LivePreviewPanel practice={draft} /> : <div />}
      />

      <BlockLibrary open={libraryOpen} onOpenChange={setLibraryOpen} />
      <AICopilot
        open={copilotOpen}
        onOpenChange={setCopilotOpen}
        practice={draft}
        currentTab={tab}
        onApply={apply}
        onVariantsGenerated={handleVariantsGenerated}
      />
    </AdminGuard>
  );
}
