import { useState } from "react";
import { trpc } from "@/lib/trpc";
import AppLayout from "@/components/AppLayout";
import { SectionHeader, StatusBadge, AiSuggestion, formatCurrency, formatPct } from "@/components/FinancialComponents";
import {
  Target, Plus, ChevronDown, ChevronRight, Edit2, Trash2, Brain,
  TrendingUp, DollarSign, Clock, CheckCircle, AlertCircle, Zap
} from "lucide-react";
import { toast } from "sonner";

const LEVER_STATUS_COLORS: Record<string, string> = {
  identified: "oklch(55% 0.04 240)",
  validated: "#1A85FF",
  in_progress: "#C9A84C",
  done: "oklch(60% 0.18 145)",
};

export default function Strategy() {
  const [searchParams] = useState(() => new URLSearchParams(window.location.search));
  const projectId = parseInt(searchParams.get("project") ?? "1");

  const [expandedOrientations, setExpandedOrientations] = useState<Set<number>>(new Set());
  const [expandedAxes, setExpandedAxes] = useState<Set<number>>(new Set());
  const [expandedObjectives, setExpandedObjectives] = useState<Set<number>>(new Set());
  const [showCreateOrientation, setShowCreateOrientation] = useState(false);
  const [showCreateAxis, setShowCreateAxis] = useState<number | null>(null);
  const [showCreateObjective, setShowCreateObjective] = useState<number | null>(null);
  const [showCreateLever, setShowCreateLever] = useState<number | null>(null);
  const [aiSuggestions, setAiSuggestions] = useState<Array<{ title: string; content: string }>>([]);

  const { data: orientations = [], refetch } = trpc.strategy.getOrientations.useQuery({ projectId });
  const createOrientation = trpc.strategy.createOrientation.useMutation({ onSuccess: () => { refetch(); setShowCreateOrientation(false); } });
  const deleteOrientation = trpc.strategy.deleteOrientation.useMutation({ onSuccess: () => refetch() });
  const createAxis = trpc.strategy.createAxis.useMutation({ onSuccess: () => { refetch(); setShowCreateAxis(null); } });
  const createObjective = trpc.strategy.createObjective.useMutation({ onSuccess: () => { refetch(); setShowCreateObjective(null); } });
  const createLever = trpc.strategy.createLever.useMutation({ onSuccess: () => { refetch(); setShowCreateLever(null); } });
  const updateLever = trpc.strategy.updateLever.useMutation({ onSuccess: () => refetch() });
  const deleteLever = trpc.strategy.deleteLever.useMutation({ onSuccess: () => refetch() });
  const suggestImpact = trpc.strategy.suggestLeverImpact.useMutation({
    onSuccess: (data) => {
      setAiSuggestions(prev => [...prev, {
        title: "Suggestion d'impact IA",
        content: `EBITDA +${data.ebitdaImpactPct?.toFixed(1)}% (${formatCurrency(data.ebitdaImpactAmount)}) | Probabilité ${data.probabilityPct?.toFixed(0)}% | Horizon ${data.horizonMonths} mois\n\n${data.rationale}`,
      }]);
    },
  });

  const [orientationForm, setOrientationForm] = useState({ title: "", description: "", priority: "medium" as "high" | "medium" | "low" });
  const [axisForm, setAxisForm] = useState({ title: "", description: "" });
  const [objectiveForm, setObjectiveForm] = useState({ title: "", kpiName: "", kpiCurrent: "", kpiTarget: "", horizonMonths: "" });
  const [leverForm, setLeverForm] = useState({
    title: "", description: "", ebitdaImpactPct: "", ebitdaImpactAmount: "",
    revenueImpactPct: "", probabilityPct: "", wcrImpactDays: "", capexRequired: "",
    riskReductionScore: "", horizonT1: "", horizonT2: "", horizonT3: "",
  });

  const toggleOrientation = (id: number) => {
    setExpandedOrientations(prev => { const s = new Set(prev); s.has(id) ? s.delete(id) : s.add(id); return s; });
  };
  const toggleAxis = (id: number) => {
    setExpandedAxes(prev => { const s = new Set(prev); s.has(id) ? s.delete(id) : s.add(id); return s; });
  };
  const toggleObjective = (id: number) => {
    setExpandedObjectives(prev => { const s = new Set(prev); s.has(id) ? s.delete(id) : s.add(id); return s; });
  };

  // Calcul de l'impact total des leviers validés
  const totalEbitdaImpact = 0; // Would be computed from all levers

  const aiPanelContent = (
    <div className="space-y-2">
      {aiSuggestions.map((s, i) => (
        <AiSuggestion
          key={i}
          title={s.title}
          content={s.content}
          type="insight"
          onDismiss={() => setAiSuggestions(prev => prev.filter((_, j) => j !== i))}
        />
      ))}
      {aiSuggestions.length === 0 && (
        <div className="text-center py-6">
          <Target size={20} className="mx-auto mb-2 opacity-30" style={{ color: "#C9A84C" }} />
          <p className="text-xs" style={{ color: "oklch(45% 0.05 240)" }}>
            Créez un levier et demandez une suggestion d'impact IA pour obtenir des estimations basées sur les benchmarks sectoriels.
          </p>
        </div>
      )}
    </div>
  );

  const InlineForm = ({ onSave, onCancel, children }: { onSave: () => void; onCancel: () => void; children: React.ReactNode }) => (
    <div className="mt-2 p-3 rounded-lg" style={{ background: "oklch(17% 0.055 240)", border: "1px solid oklch(28% 0.07 240)" }}>
      {children}
      <div className="flex items-center gap-2 mt-3">
        <button onClick={onSave} className="px-3 py-1.5 rounded text-xs font-heading font-600 text-white" style={{ background: "#1A85FF" }}>
          Créer
        </button>
        <button onClick={onCancel} className="px-3 py-1.5 rounded text-xs font-heading font-600" style={{ color: "oklch(55% 0.04 240)" }}>
          Annuler
        </button>
      </div>
    </div>
  );

  return (
    <AppLayout showAiPanel aiPanelContent={aiPanelContent}>
      <div className="h-full flex flex-col">
        {/* Module header */}
        <div className="module-header-gradient px-4 py-3 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "oklch(72% 0.14 75 / 0.15)" }}>
                <Target size={16} style={{ color: "#C9A84C" }} />
              </div>
              <div>
                <h1 className="text-sm font-heading font-800 text-white">Module 2 — Stratégie & Leviers</h1>
                <p className="text-xs" style={{ color: "oklch(50% 0.04 240)" }}>Arborescence stratégique et impacts chiffrés sur la valorisation</p>
              </div>
            </div>
            <button
              onClick={() => setShowCreateOrientation(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-heading font-600 text-white transition-all hover:opacity-90"
              style={{ background: "linear-gradient(135deg, #C9A84C, #A07830)" }}
            >
              <Plus size={12} />
              Orientation stratégique
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-4">
          {/* Create orientation form */}
          {showCreateOrientation && (
            <InlineForm
              onSave={() => createOrientation.mutate({ projectId, ...orientationForm })}
              onCancel={() => setShowCreateOrientation(false)}
            >
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-heading font-600 tracking-widest uppercase mb-1" style={{ color: "oklch(55% 0.04 240)" }}>Titre *</label>
                  <input type="text" value={orientationForm.title} onChange={e => setOrientationForm(f => ({ ...f, title: e.target.value }))} className="bloomberg-input text-left" placeholder="Ex : Croissance organique" />
                </div>
                <div>
                  <label className="block text-[10px] font-heading font-600 tracking-widest uppercase mb-1" style={{ color: "oklch(55% 0.04 240)" }}>Priorité</label>
                  <select value={orientationForm.priority} onChange={e => setOrientationForm(f => ({ ...f, priority: e.target.value as any }))} className="bloomberg-input text-left" style={{ background: "oklch(18% 0.06 240)" }}>
                    <option value="high">Haute</option>
                    <option value="medium">Moyenne</option>
                    <option value="low">Basse</option>
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="block text-[10px] font-heading font-600 tracking-widest uppercase mb-1" style={{ color: "oklch(55% 0.04 240)" }}>Description</label>
                  <input type="text" value={orientationForm.description} onChange={e => setOrientationForm(f => ({ ...f, description: e.target.value }))} className="bloomberg-input text-left" placeholder="Description de l'orientation stratégique" />
                </div>
              </div>
            </InlineForm>
          )}

          {/* Orientations tree */}
          {orientations.length === 0 && !showCreateOrientation ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <Target size={32} className="mb-3 opacity-20" style={{ color: "#C9A84C" }} />
              <h3 className="text-sm font-heading font-700 text-white mb-1">Aucune orientation stratégique</h3>
              <p className="text-xs max-w-xs mb-4" style={{ color: "oklch(50% 0.04 240)" }}>
                Définissez les grandes orientations stratégiques de l'entreprise, puis déclinez-les en axes, objectifs et leviers actionnables.
              </p>
              <button onClick={() => setShowCreateOrientation(true)} className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-heading font-600 text-white" style={{ background: "#C9A84C" }}>
                <Plus size={12} />
                Créer une orientation
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              {orientations.map(orientation => (
                <div key={orientation.id} className="rounded-lg overflow-hidden" style={{ border: "1px solid oklch(25% 0.06 240)" }}>
                  {/* Orientation header */}
                  <div
                    className="flex items-center gap-2 px-3 py-2.5 cursor-pointer hover:bg-white/5 transition-colors"
                    style={{ background: "oklch(17% 0.055 240)" }}
                    onClick={() => toggleOrientation(orientation.id)}
                  >
                    <span style={{ color: "oklch(50% 0.04 240)" }}>
                      {expandedOrientations.has(orientation.id) ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
                    </span>
                    <div className="w-2 h-2 rounded-full flex-shrink-0" style={{
                      background: orientation.priority === "high" ? "oklch(55% 0.22 25)" : orientation.priority === "medium" ? "#C9A84C" : "oklch(60% 0.04 240)"
                    }} />
                    <span className="font-heading font-700 text-sm text-white flex-1">{orientation.title}</span>
                    {orientation.description && (
                      <span className="text-xs hidden md:block" style={{ color: "oklch(50% 0.04 240)" }}>{orientation.description}</span>
                    )}
                    <div className="flex items-center gap-1 ml-2">
                      <button
                        onClick={e => { e.stopPropagation(); setShowCreateAxis(orientation.id); }}
                        className="w-6 h-6 rounded flex items-center justify-center hover:bg-white/10 transition-colors text-[10px] font-heading font-600"
                        style={{ color: "#1A85FF" }}
                        title="Ajouter un axe"
                      >
                        <Plus size={11} />
                      </button>
                      <button
                        onClick={e => { e.stopPropagation(); if (confirm("Supprimer cette orientation ?")) deleteOrientation.mutate({ id: orientation.id }); }}
                        className="w-6 h-6 rounded flex items-center justify-center hover:bg-red-500/20 transition-colors"
                        style={{ color: "oklch(55% 0.04 240)" }}
                      >
                        <Trash2 size={11} />
                      </button>
                    </div>
                  </div>

                  {/* Axes */}
                  {expandedOrientations.has(orientation.id) && (
                    <div className="pl-6">
                      {showCreateAxis === orientation.id && (
                        <div className="px-3 py-2">
                          <InlineForm
                            onSave={() => createAxis.mutate({ orientationId: orientation.id, ...axisForm })}
                            onCancel={() => setShowCreateAxis(null)}
                          >
                            <input type="text" value={axisForm.title} onChange={e => setAxisForm(f => ({ ...f, title: e.target.value }))} className="bloomberg-input text-left" placeholder="Titre de l'axe stratégique" />
                          </InlineForm>
                        </div>
                      )}
                      <AxesTree
                        orientationId={orientation.id}
                        expandedAxes={expandedAxes}
                        toggleAxis={toggleAxis}
                        expandedObjectives={expandedObjectives}
                        toggleObjective={toggleObjective}
                        showCreateObjective={showCreateObjective}
                        setShowCreateObjective={setShowCreateObjective}
                        showCreateLever={showCreateLever}
                        setShowCreateLever={setShowCreateLever}
                        objectiveForm={objectiveForm}
                        setObjectiveForm={setObjectiveForm}
                        leverForm={leverForm}
                        setLeverForm={setLeverForm}
                        createObjective={createObjective}
                        createLever={createLever}
                        updateLever={updateLever}
                        deleteLever={deleteLever}
                        suggestImpact={suggestImpact}
                        InlineForm={InlineForm}
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}

// ─── Sub-component: Axes Tree ─────────────────────────────────────────────────

function AxesTree({ orientationId, expandedAxes, toggleAxis, expandedObjectives, toggleObjective, showCreateObjective, setShowCreateObjective, showCreateLever, setShowCreateLever, objectiveForm, setObjectiveForm, leverForm, setLeverForm, createObjective, createLever, updateLever, deleteLever, suggestImpact, InlineForm }: any) {
  const { data: axes = [] } = trpc.strategy.getAxes.useQuery({ orientationId });

  return (
    <div>
      {axes.map((axis: any) => (
        <div key={axis.id} className="border-l-2 ml-2 my-1" style={{ borderColor: "oklch(28% 0.07 240)" }}>
          <div
            className="flex items-center gap-2 px-3 py-2 cursor-pointer hover:bg-white/5 transition-colors"
            onClick={() => toggleAxis(axis.id)}
          >
            <span style={{ color: "oklch(50% 0.04 240)" }}>
              {expandedAxes.has(axis.id) ? <ChevronDown size={11} /> : <ChevronRight size={11} />}
            </span>
            <span className="font-heading font-600 text-xs text-white flex-1">{axis.title}</span>
            <button
              onClick={e => { e.stopPropagation(); setShowCreateObjective(axis.id); }}
              className="w-5 h-5 rounded flex items-center justify-center hover:bg-white/10 transition-colors"
              style={{ color: "#1A85FF" }}
            >
              <Plus size={10} />
            </button>
          </div>

          {expandedAxes.has(axis.id) && (
            <div className="pl-4">
              {showCreateObjective === axis.id && (
                <div className="px-3 py-2">
                  <InlineForm
                    onSave={() => createObjective.mutate({ axisId: axis.id, ...objectiveForm })}
                    onCancel={() => setShowCreateObjective(null)}
                  >
                    <div className="grid grid-cols-2 gap-2">
                      <div className="col-span-2">
                        <input type="text" value={objectiveForm.title} onChange={(e: any) => setObjectiveForm((f: any) => ({ ...f, title: e.target.value }))} className="bloomberg-input text-left" placeholder="Titre de l'objectif" />
                      </div>
                      <input type="text" value={objectiveForm.kpiName} onChange={(e: any) => setObjectiveForm((f: any) => ({ ...f, kpiName: e.target.value }))} className="bloomberg-input text-left" placeholder="KPI (ex: Taux de marge)" />
                      <input type="number" value={objectiveForm.kpiTarget} onChange={(e: any) => setObjectiveForm((f: any) => ({ ...f, kpiTarget: e.target.value }))} className="bloomberg-input" placeholder="Cible" />
                    </div>
                  </InlineForm>
                </div>
              )}
              <ObjectivesTree
                axisId={axis.id}
                expandedObjectives={expandedObjectives}
                toggleObjective={toggleObjective}
                showCreateLever={showCreateLever}
                setShowCreateLever={setShowCreateLever}
                leverForm={leverForm}
                setLeverForm={setLeverForm}
                createLever={createLever}
                updateLever={updateLever}
                deleteLever={deleteLever}
                suggestImpact={suggestImpact}
                InlineForm={InlineForm}
              />
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function ObjectivesTree({ axisId, expandedObjectives, toggleObjective, showCreateLever, setShowCreateLever, leverForm, setLeverForm, createLever, updateLever, deleteLever, suggestImpact, InlineForm }: any) {
  const { data: objectives = [] } = trpc.strategy.getObjectives.useQuery({ axisId });

  return (
    <div>
      {objectives.map((obj: any) => (
        <div key={obj.id} className="border-l-2 ml-2 my-1" style={{ borderColor: "oklch(25% 0.06 240)" }}>
          <div
            className="flex items-center gap-2 px-3 py-1.5 cursor-pointer hover:bg-white/5 transition-colors"
            onClick={() => toggleObjective(obj.id)}
          >
            <span style={{ color: "oklch(50% 0.04 240)" }}>
              {expandedObjectives.has(obj.id) ? <ChevronDown size={10} /> : <ChevronRight size={10} />}
            </span>
            <span className="text-xs font-medium text-white flex-1">{obj.title}</span>
            {obj.kpiName && (
              <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ background: "oklch(20% 0.06 240)", color: "oklch(60% 0.04 240)" }}>
                {obj.kpiName}: {obj.kpiCurrent ?? "—"} → {obj.kpiTarget ?? "—"}
              </span>
            )}
            <button
              onClick={e => { e.stopPropagation(); setShowCreateLever(obj.id); }}
              className="w-5 h-5 rounded flex items-center justify-center hover:bg-white/10 transition-colors"
              style={{ color: "#C9A84C" }}
            >
              <Plus size={10} />
            </button>
          </div>

          {expandedObjectives.has(obj.id) && (
            <div className="pl-4">
              {showCreateLever === obj.id && (
                <div className="px-3 py-2">
                  <InlineForm
                    onSave={() => createLever.mutate({ objectiveId: obj.id, ...leverForm })}
                    onCancel={() => setShowCreateLever(null)}
                  >
                    <div className="grid grid-cols-3 gap-2">
                      <div className="col-span-3">
                        <input type="text" value={leverForm.title} onChange={(e: any) => setLeverForm((f: any) => ({ ...f, title: e.target.value }))} className="bloomberg-input text-left" placeholder="Titre du levier" />
                      </div>
                      <div>
                        <label className="block text-[9px] font-heading font-600 tracking-wider uppercase mb-1" style={{ color: "oklch(50% 0.04 240)" }}>Impact EBITDA (%)</label>
                        <input type="number" value={leverForm.ebitdaImpactPct} onChange={(e: any) => setLeverForm((f: any) => ({ ...f, ebitdaImpactPct: e.target.value }))} className="bloomberg-input" placeholder="0.0" />
                      </div>
                      <div>
                        <label className="block text-[9px] font-heading font-600 tracking-wider uppercase mb-1" style={{ color: "oklch(50% 0.04 240)" }}>Impact EBITDA (k€)</label>
                        <input type="number" value={leverForm.ebitdaImpactAmount} onChange={(e: any) => setLeverForm((f: any) => ({ ...f, ebitdaImpactAmount: e.target.value }))} className="bloomberg-input" placeholder="0" />
                      </div>
                      <div>
                        <label className="block text-[9px] font-heading font-600 tracking-wider uppercase mb-1" style={{ color: "oklch(50% 0.04 240)" }}>Probabilité (%)</label>
                        <input type="number" value={leverForm.probabilityPct} onChange={(e: any) => setLeverForm((f: any) => ({ ...f, probabilityPct: e.target.value }))} className="bloomberg-input" placeholder="70" />
                      </div>
                    </div>
                  </InlineForm>
                </div>
              )}
              <LeversTable
                objectiveId={obj.id}
                updateLever={updateLever}
                deleteLever={deleteLever}
                suggestImpact={suggestImpact}
              />
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function LeversTable({ objectiveId, updateLever, deleteLever, suggestImpact }: any) {
  const { data: levers = [] } = trpc.strategy.getLevers.useQuery({ objectiveId });

  if (levers.length === 0) return null;

  return (
    <div className="mx-3 mb-2 rounded overflow-hidden" style={{ border: "1px solid oklch(22% 0.06 240)" }}>
      <table className="bloomberg-table">
        <thead>
          <tr>
            <th className="text-left">Levier</th>
            <th>Impact EBITDA</th>
            <th>Impact CA</th>
            <th>Probabilité</th>
            <th>Statut</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {levers.map((lever: any) => (
            <tr key={lever.id}>
              <td className="text-left">
                <div className="font-medium text-white text-xs">{lever.title}</div>
                {lever.description && <div className="text-[10px] mt-0.5" style={{ color: "oklch(50% 0.04 240)" }}>{lever.description}</div>}
              </td>
              <td style={{ color: "#C9A84C" }}>
                {lever.ebitdaImpactAmount ? formatCurrency(lever.ebitdaImpactAmount) : "—"}
                {lever.ebitdaImpactPct && <div className="text-[10px]" style={{ color: "oklch(60% 0.04 240)" }}>+{parseFloat(lever.ebitdaImpactPct).toFixed(1)}%</div>}
              </td>
              <td>{lever.revenueImpactAmount ? formatCurrency(lever.revenueImpactAmount) : "—"}</td>
              <td>{lever.probabilityPct ? `${parseFloat(lever.probabilityPct).toFixed(0)}%` : "—"}</td>
              <td>
                <select
                  value={lever.status}
                  onChange={e => updateLever.mutate({ id: lever.id, status: e.target.value })}
                  className="text-[10px] font-heading font-600 rounded px-1.5 py-0.5 border-0 cursor-pointer"
                  style={{ background: "oklch(20% 0.06 240)", color: LEVER_STATUS_COLORS[lever.status] ?? "white" }}
                >
                  <option value="identified">Identifié</option>
                  <option value="validated">Validé</option>
                  <option value="in_progress">En cours</option>
                  <option value="done">Réalisé</option>
                </select>
              </td>
              <td>
                <div className="flex items-center gap-1 justify-end">
                  <button
                    onClick={() => suggestImpact.mutate({ leverTitle: lever.title, leverDescription: lever.description })}
                    className="w-5 h-5 rounded flex items-center justify-center hover:bg-white/10 transition-colors"
                    style={{ color: "#1A85FF" }}
                    title="Suggestion IA"
                  >
                    <Brain size={10} />
                  </button>
                  <button
                    onClick={() => { if (confirm("Supprimer ce levier ?")) deleteLever.mutate({ id: lever.id }); }}
                    className="w-5 h-5 rounded flex items-center justify-center hover:bg-red-500/20 transition-colors"
                    style={{ color: "oklch(50% 0.04 240)" }}
                  >
                    <Trash2 size={10} />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
