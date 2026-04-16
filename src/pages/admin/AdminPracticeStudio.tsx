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
import { EvaluationTab } from "@/components/admin/practice-studio/tabs/EvaluationTab";
import { DistributionTab } from "@/components/admin/practice-studio/tabs/DistributionTab";
import { AnalyticsTab } from "@/components/admin/practice-studio/tabs/AnalyticsTab";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  useAdminPractices, useUpdatePractice, useCreatePractice,
  useDuplicatePractice, useSnapshotPractice, type AdminPractice,
} from "@/hooks/useAdminPractices";
import { toast } from "sonner";

export default function AdminPracticeStudio() {
  const [params, setParams] = useSearchParams();
  const { data: practices = [], isLoading } = useAdminPractices();
  const updateMut = useUpdatePractice();
  const createMut = useCreatePractice();
  const duplicateMut = useDuplicatePractice();
  const snapshotMut = useSnapshotPractice();

  const selectedId = params.get("id");
  const selected = useMemo(() => practices.find(p => p.id === selectedId), [practices, selectedId]);

  const [draft, setDraft] = useState<AdminPractice | null>(null);
  const [showPreview, setShowPreview] = useState(true);
  const [tab, setTab] = useState("identity");
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
  const debounceRef = useRef<number | null>(null);

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
  }, [selected?.id]);

  const apply = (patch: Partial<AdminPractice>) => {
    if (!draft) return;
    const next = { ...draft, ...patch };
    setDraft(next);
    if (debounceRef.current) window.clearTimeout(debounceRef.current);
    debounceRef.current = window.setTimeout(() => {
      updateMut.mutate(
        { id: next.id, patch },
        { onSuccess: () => setLastSavedAt(new Date()) }
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

  return (
    <AdminGuard>
      <StudioShell
        title={draft?.title}
        status={draft?.status}
        saving={updateMut.isPending}
        lastSavedAt={lastSavedAt}
        showPreview={showPreview}
        onPreviewToggle={() => setShowPreview(v => !v)}
        onDuplicate={draft ? handleDuplicate : undefined}
        onShowVersions={draft ? handleSnapshot : undefined}
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
              <Tabs value={tab} onValueChange={setTab}>
                <TabsList className="mb-5">
                  <TabsTrigger value="identity">Identité</TabsTrigger>
                  <TabsTrigger value="scenario">Scénario</TabsTrigger>
                  <TabsTrigger value="ai">IA & Prompts</TabsTrigger>
                  <TabsTrigger value="mechanics">Mécanique</TabsTrigger>
                  <TabsTrigger value="coaching">Coaching</TabsTrigger>
                  <TabsTrigger value="evaluation">Évaluation</TabsTrigger>
                  <TabsTrigger value="distribution">Diffusion</TabsTrigger>
                  <TabsTrigger value="analytics">Analytics</TabsTrigger>
                </TabsList>
                <TabsContent value="identity"><IdentityTab practice={draft} onChange={apply} /></TabsContent>
                <TabsContent value="scenario"><ScenarioTab practice={draft} onChange={apply} /></TabsContent>
                <TabsContent value="ai"><AIPromptsTab practice={draft} onChange={apply} /></TabsContent>
                <TabsContent value="mechanics"><MechanicsTab practice={draft} onChange={apply} /></TabsContent>
                <TabsContent value="coaching"><CoachingTab practice={draft} onChange={apply} /></TabsContent>
                <TabsContent value="evaluation"><EvaluationTab practice={draft} onChange={apply} /></TabsContent>
                <TabsContent value="distribution"><DistributionTab practice={draft} /></TabsContent>
                <TabsContent value="analytics"><AnalyticsTab practiceId={draft.id} /></TabsContent>
              </Tabs>
            </div>
          )
        }
        preview={draft ? <LivePreviewPanel practice={draft} /> : <div />}
      />
    </AdminGuard>
  );
}
