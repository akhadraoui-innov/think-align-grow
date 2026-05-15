import { useState } from "react";
import { trpc } from "@/lib/trpc";
import AppLayout from "@/components/AppLayout";
import { KpiCard, AiSuggestion, formatCurrency } from "@/components/FinancialComponents";
import { Zap, Plus, Brain, Target, TrendingUp, DollarSign, BarChart2, Trash2, CheckCircle } from "lucide-react";
import { toast } from "sonner";
import { RadialBarChart, RadialBar, ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from "recharts";

type LeverType = "ebitda_improvement" | "debt_reduction" | "multiple_expansion" | "revenue_growth";

const LEVER_TYPE_CONFIG: Record<LeverType, { label: string; color: string; icon: React.ReactNode }> = {
  ebitda_improvement: { label: "Amélioration EBITDA", color: "#C9A84C", icon: <TrendingUp size={12} /> },
  debt_reduction: { label: "Réduction de dette", color: "oklch(60% 0.18 145)", icon: <DollarSign size={12} /> },
  multiple_expansion: { label: "Expansion du multiple", color: "#1A85FF", icon: <BarChart2 size={12} /> },
  revenue_growth: { label: "Croissance du CA", color: "oklch(55% 0.22 280)", icon: <TrendingUp size={12} /> },
};

export default function Simulation() {
  const [searchParams] = useState(() => new URLSearchParams(window.location.search));
  const projectId = parseInt(searchParams.get("project") ?? "1");

  const [selectedSimId, setSelectedSimId] = useState<number | null>(null);
  const [showCreateSim, setShowCreateSim] = useState(false);
  const [showAddLever, setShowAddLever] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState<string>("");
  const [aiSuggestions, setAiSuggestions] = useState<string[]>([]);

  const [simForm, setSimForm] = useState({ label: "", targetEv: "", currentEv: "" });
  const [leverForm, setLeverForm] = useState({ leverType: "ebitda_improvement" as LeverType, label: "", currentValue: "", targetValue: "", evImpact: "" });

  const { data: simulations = [], refetch: refetchSims } = trpc.simulation.list.useQuery({ projectId });
  const createSim = trpc.simulation.create.useMutation({
    onSuccess: (data: any) => { refetchSims(); setShowCreateSim(false); if (data?.id) setSelectedSimId(data.id); },
  });
  const addLever = trpc.simulation.addLever.useMutation({ onSuccess: () => { refetchLevers(); setShowAddLever(false); setLeverForm({ leverType: "ebitda_improvement", label: "", currentValue: "", targetValue: "", evImpact: "" }); } });
  const toggleLever = trpc.simulation.toggleLever.useMutation({ onSuccess: () => refetchLevers() });
  const updateLever = trpc.simulation.updateLever.useMutation({ onSuccess: () => refetchLevers() });
  const deleteLeverMut = trpc.simulation.updateLever.useMutation({ onSuccess: () => refetchLevers() });
  const analyzeFeasibility = trpc.simulation.analyzeFeasibility.useMutation({
    onSuccess: (data) => {
      const txt = typeof data.analysis === "string" ? data.analysis : String(data.analysis ?? "");
      setAiAnalysis(txt);
      setAiSuggestions(prev => [...prev, txt]);
    },
  });

  const activeSim = simulations.find(s => s.id === selectedSimId) ?? simulations[0];
  const simId = activeSim?.id;

  const { data: levers = [], refetch: refetchLevers } = trpc.simulation.getLevers.useQuery(
    { simulationId: simId! },
    { enabled: !!simId }
  );
  const { data: scenarios = [] } = trpc.simulation.getScenarios.useQuery(
    { simulationId: simId! },
    { enabled: !!simId }
  );

  const activeLevers = levers.filter(l => l.isActive);
  const targetEv = activeSim ? parseFloat(String(activeSim.targetEv)) : 0;
  const currentEv = activeSim ? parseFloat(String(activeSim.currentEv ?? 0)) : 0;
  const gap = targetEv - currentEv;
  const coveredByActiveLevers = activeLevers.reduce((s, l) => s + parseFloat(String(l.evImpact ?? 0)), 0);
  const projectedEv = currentEv + coveredByActiveLevers;
  const coverageRatio = gap > 0 ? Math.min(1, coveredByActiveLevers / gap) : 0;
  const achievementPct = targetEv > 0 ? Math.min(100, (projectedEv / targetEv) * 100) : 0;

  const aiPanelContent = (
    <div className="space-y-2">
      {analyzeFeasibility.isPending && (
        <div className="flex items-center gap-2 text-xs py-4" style={{ color: "#1A85FF" }}>
          <div className="w-3 h-3 border border-current border-t-transparent rounded-full animate-spin" />
          Analyse de faisabilité...
        </div>
      )}
      {aiSuggestions.map((s, i) => (
        <AiSuggestion key={i} title="Analyse de faisabilité IA" content={s} type={coverageRatio >= 0.9 ? "insight" : coverageRatio >= 0.6 ? "info" : "warning"} onDismiss={() => setAiSuggestions(prev => prev.filter((_, j) => j !== i))} />
      ))}
      {!analyzeFeasibility.isPending && aiSuggestions.length === 0 && (
        <div className="text-center py-6">
          <Zap size={20} className="mx-auto mb-2 opacity-30" style={{ color: "#C9A84C" }} />
          <p className="text-xs" style={{ color: "oklch(45% 0.05 240)" }}>Activez des leviers et demandez une analyse IA pour évaluer la faisabilité de votre objectif de valorisation.</p>
        </div>
      )}
    </div>
  );

  // Pie chart data for lever types
  const leverTypeData = Object.entries(LEVER_TYPE_CONFIG).map(([type, config]) => {
    const typeLevers = activeLevers.filter(l => l.leverType === type);
    const total = typeLevers.reduce((s, l) => s + parseFloat(String(l.evImpact ?? 0)), 0);
    return { name: config.label, value: total, color: config.color };
  }).filter(d => d.value > 0);

  return (
    <AppLayout showAiPanel aiPanelContent={aiPanelContent}>
      <div className="h-full flex flex-col">
        {/* Module header */}
        <div className="module-header-gradient px-4 py-3 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "oklch(72% 0.14 75 / 0.15)" }}>
                <Zap size={16} style={{ color: "#C9A84C" }} />
              </div>
              <div>
                <h1 className="text-sm font-heading font-800 text-white">Module 5 — Simulation Inverse</h1>
                <p className="text-xs" style={{ color: "oklch(50% 0.04 240)" }}>Objectif de valorisation → Leviers à actionner</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {simId && activeLevers.length > 0 && (
                <button
                  onClick={() => analyzeFeasibility.mutate({
                    simulationId: simId,
                    targetEv,
                    currentEv,
                    activeLevers: activeLevers.map(l => ({ label: l.label, leverType: l.leverType, evImpact: parseFloat(String(l.evImpact ?? 0)) })),
                  })}
                  disabled={analyzeFeasibility.isPending}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded text-[10px] font-heading font-600 transition-all"
                  style={{ background: "oklch(55% 0.22 240 / 0.15)", color: "#1A85FF", border: "1px solid oklch(55% 0.22 240 / 0.3)" }}
                >
                  <Brain size={11} />Analyser faisabilité
                </button>
              )}
              <button
                onClick={() => setShowCreateSim(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-heading font-600 text-white transition-all hover:opacity-90"
                style={{ background: "linear-gradient(135deg, #C9A84C, #A07830)" }}
              >
                <Plus size={12} />Nouvelle simulation
              </button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-4">
          {/* No simulation */}
          {!simId && !showCreateSim && (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <Zap size={32} className="mb-3 opacity-20" style={{ color: "#C9A84C" }} />
              <h3 className="text-sm font-heading font-700 text-white mb-1">Aucune simulation</h3>
              <p className="text-xs max-w-xs mb-4" style={{ color: "oklch(50% 0.04 240)" }}>Définissez un objectif de valorisation cible et identifiez les leviers à actionner pour l'atteindre.</p>
              <button onClick={() => setShowCreateSim(true)} className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-heading font-600 text-white" style={{ background: "linear-gradient(135deg, #C9A84C, #A07830)" }}>
                <Plus size={12} />Créer une simulation
              </button>
            </div>
          )}

          {/* Create simulation form */}
          {showCreateSim && (
            <div className="max-w-lg mx-auto mb-4">
              <div className="rounded-lg p-4" style={{ background: "oklch(15% 0.05 240)", border: "1px solid oklch(28% 0.07 240)" }}>
                <h3 className="text-sm font-heading font-700 text-white mb-4">Nouvelle simulation inverse</h3>
                <div className="space-y-3">
                  <div>
                    <label className="block text-[10px] font-heading font-600 tracking-widest uppercase mb-1.5" style={{ color: "oklch(55% 0.04 240)" }}>Libellé</label>
                    <input type="text" value={simForm.label} onChange={e => setSimForm(f => ({ ...f, label: e.target.value }))} className="bloomberg-input text-left" placeholder="Ex : Objectif cession 2026" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] font-heading font-600 tracking-widest uppercase mb-1.5" style={{ color: "oklch(55% 0.04 240)" }}>Valorisation actuelle (k€)</label>
                      <input type="number" value={simForm.currentEv} onChange={e => setSimForm(f => ({ ...f, currentEv: e.target.value }))} className="bloomberg-input" placeholder="0" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-heading font-600 tracking-widest uppercase mb-1.5" style={{ color: "oklch(55% 0.04 240)" }}>Objectif EV cible (k€) *</label>
                      <input type="number" value={simForm.targetEv} onChange={e => setSimForm(f => ({ ...f, targetEv: e.target.value }))} className="bloomberg-input" placeholder="0" />
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 mt-4">
                  <button
                    onClick={() => {
                      if (!simForm.targetEv) return toast.error("Objectif EV requis");
                      createSim.mutate({ projectId, label: simForm.label, targetEv: parseFloat(simForm.targetEv), currentEv: simForm.currentEv ? parseFloat(simForm.currentEv) : undefined });
                    }}
                    disabled={createSim.isPending}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-heading font-600 text-white"
                    style={{ background: "linear-gradient(135deg, #C9A84C, #A07830)" }}
                  >
                    <Plus size={12} />Créer
                  </button>
                  <button onClick={() => setShowCreateSim(false)} className="px-4 py-2 rounded-lg text-xs font-heading font-600" style={{ color: "oklch(55% 0.04 240)" }}>Annuler</button>
                </div>
              </div>
            </div>
          )}

          {/* Simulation dashboard */}
          {simId && activeSim && (
            <div className="space-y-4">
              {/* Simulation selector */}
              {simulations.length > 1 && (
                <div className="flex items-center gap-2">
                  <span className="text-xs font-heading font-600" style={{ color: "oklch(55% 0.04 240)" }}>Simulation :</span>
                  <select value={selectedSimId ?? ""} onChange={e => setSelectedSimId(parseInt(e.target.value))} className="bloomberg-input text-left text-xs" style={{ background: "oklch(18% 0.06 240)", maxWidth: "200px" }}>
                    {simulations.map(s => <option key={s.id} value={s.id}>{s.label ?? `Simulation #${s.id}`}</option>)}
                  </select>
                </div>
              )}

              {/* KPI row */}
              <div className="grid grid-cols-5 gap-3">
                <KpiCard label="EV Actuelle" value={formatCurrency(currentEv)} color="neutral" />
                <KpiCard label="EV Cible" value={formatCurrency(targetEv)} color="gold" />
                <KpiCard label="Gap à combler" value={formatCurrency(gap)} color={gap > 0 ? "red" : "green"} />
                <KpiCard label="EV Projetée" value={formatCurrency(projectedEv)} color={projectedEv >= targetEv ? "green" : "blue"} />
                <KpiCard label="Couverture" value={`${Math.round(coverageRatio * 100)}%`} color={coverageRatio >= 0.9 ? "green" : coverageRatio >= 0.6 ? "gold" : "red"} />
              </div>

              {/* Progress bar */}
              <div className="rounded-lg p-4" style={{ background: "oklch(15% 0.05 240)", border: "1px solid oklch(25% 0.06 240)" }}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-heading font-700 text-white">Progression vers l'objectif</span>
                  <span className="text-sm font-heading font-800 tabular-nums" style={{ color: achievementPct >= 100 ? "oklch(60% 0.18 145)" : "#C9A84C" }}>
                    {achievementPct.toFixed(1)}%
                  </span>
                </div>
                <div className="h-3 rounded-full overflow-hidden" style={{ background: "oklch(22% 0.06 240)" }}>
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${Math.min(100, achievementPct)}%`,
                      background: achievementPct >= 100
                        ? "oklch(60% 0.18 145)"
                        : `linear-gradient(90deg, #1A85FF, #C9A84C)`,
                    }}
                  />
                </div>
                <div className="flex justify-between mt-1.5 text-[10px]" style={{ color: "oklch(45% 0.05 240)" }}>
                  <span>{formatCurrency(currentEv)} (actuel)</span>
                  <span>{formatCurrency(projectedEv)} (projeté)</span>
                  <span>{formatCurrency(targetEv)} (cible)</span>
                </div>
              </div>

              {/* Levers section */}
              <div className="grid grid-cols-3 gap-4">
                {/* Levers list */}
                <div className="col-span-2 rounded-lg overflow-hidden" style={{ border: "1px solid oklch(25% 0.06 240)" }}>
                  <div className="flex items-center justify-between px-3 py-2.5" style={{ background: "oklch(17% 0.055 240)", borderBottom: "1px solid oklch(22% 0.06 240)" }}>
                    <span className="text-xs font-heading font-700 text-white">Leviers de valorisation</span>
                    <button
                      onClick={() => setShowAddLever(!showAddLever)}
                      className="flex items-center gap-1 px-2 py-1 rounded text-[10px] font-heading font-600 transition-all"
                      style={{ background: "oklch(55% 0.22 240 / 0.15)", color: "#1A85FF" }}
                    >
                      <Plus size={10} />Ajouter
                    </button>
                  </div>

                  {/* Add lever form */}
                  {showAddLever && (
                    <div className="p-3" style={{ background: "oklch(13% 0.045 240)", borderBottom: "1px solid oklch(22% 0.06 240)" }}>
                      <div className="grid grid-cols-3 gap-2 mb-2">
                        <div className="col-span-3">
                          <input type="text" value={leverForm.label} onChange={e => setLeverForm(f => ({ ...f, label: e.target.value }))} className="bloomberg-input text-left" placeholder="Description du levier" />
                        </div>
                        <div>
                          <label className="block text-[9px] font-heading font-600 tracking-wider uppercase mb-1" style={{ color: "oklch(50% 0.04 240)" }}>Type</label>
                          <select value={leverForm.leverType} onChange={e => setLeverForm(f => ({ ...f, leverType: e.target.value as LeverType }))} className="bloomberg-input text-left" style={{ background: "oklch(18% 0.06 240)" }}>
                            {Object.entries(LEVER_TYPE_CONFIG).map(([type, config]) => (
                              <option key={type} value={type}>{config.label}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-[9px] font-heading font-600 tracking-wider uppercase mb-1" style={{ color: "oklch(50% 0.04 240)" }}>Impact EV (k€)</label>
                          <input type="number" value={leverForm.evImpact} onChange={e => setLeverForm(f => ({ ...f, evImpact: e.target.value }))} className="bloomberg-input" placeholder="0" />
                        </div>
                        <div>
                          <label className="block text-[9px] font-heading font-600 tracking-wider uppercase mb-1" style={{ color: "oklch(50% 0.04 240)" }}>Valeur cible</label>
                          <input type="number" value={leverForm.targetValue} onChange={e => setLeverForm(f => ({ ...f, targetValue: e.target.value }))} className="bloomberg-input" placeholder="0" />
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            if (!leverForm.label) return toast.error("Description requise");
                            addLever.mutate({
                              simulationId: simId,
                              leverType: leverForm.leverType,
                              label: leverForm.label,
                              evImpact: leverForm.evImpact ? parseFloat(leverForm.evImpact) : undefined,
                              targetValue: leverForm.targetValue ? parseFloat(leverForm.targetValue) : undefined,
                            });
                          }}
                          className="px-3 py-1.5 rounded text-xs font-heading font-600 text-white"
                          style={{ background: "#1A85FF" }}
                        >
                          Ajouter
                        </button>
                        <button onClick={() => setShowAddLever(false)} className="px-3 py-1.5 rounded text-xs font-heading font-600" style={{ color: "oklch(55% 0.04 240)" }}>Annuler</button>
                      </div>
                    </div>
                  )}

                  {/* Levers table */}
                  {levers.length === 0 ? (
                    <div className="py-8 text-center text-xs" style={{ color: "oklch(50% 0.04 240)" }}>
                      Ajoutez des leviers pour simuler leur impact sur la valorisation.
                    </div>
                  ) : (
                    <table className="bloomberg-table">
                      <thead>
                        <tr>
                          <th style={{ width: "40px" }}>Actif</th>
                          <th className="text-left">Levier</th>
                          <th>Type</th>
                          <th>Impact EV</th>
                          <th>% du gap</th>
                          <th></th>
                        </tr>
                      </thead>
                      <tbody>
                        {levers.map((lever: any) => {
                          const config = LEVER_TYPE_CONFIG[lever.leverType as LeverType];
                          const evImpact = parseFloat(String(lever.evImpact ?? 0));
                          const pctOfGap = gap > 0 ? (evImpact / gap * 100) : 0;
                          return (
                            <tr key={lever.id} style={{ opacity: lever.isActive ? 1 : 0.5 }}>
                              <td>
                                <button
                                  onClick={() => toggleLever.mutate({ id: lever.id, isActive: !lever.isActive })}
                                  className="w-5 h-5 rounded flex items-center justify-center transition-all mx-auto"
                                  style={{ background: lever.isActive ? config?.color ?? "#1A85FF" : "oklch(22% 0.06 240)" }}
                                >
                                  {lever.isActive && <CheckCircle size={11} color="white" />}
                                </button>
                              </td>
                              <td className="text-left">
                                <div className="font-medium text-white text-xs">{lever.label}</div>
                              </td>
                              <td>
                                <div className="flex items-center gap-1 justify-center" style={{ color: config?.color ?? "#1A85FF" }}>
                                  {config?.icon}
                                  <span className="text-[10px]">{config?.label ?? lever.leverType}</span>
                                </div>
                              </td>
                              <td>
                                <input
                                  type="number"
                                  value={String(lever.evImpact ?? "")}
                                  onChange={e => updateLever.mutate({ id: lever.id, evImpact: parseFloat(e.target.value) || 0 })}
                                  className="bloomberg-input w-24 mx-auto"
                                  step={10}
                                  style={{ color: lever.isActive ? "#C9A84C" : undefined }}
                                />
                              </td>
                              <td>
                                <div className="flex items-center gap-1.5 justify-center">
                                  <div className="w-12 h-1 rounded-full overflow-hidden" style={{ background: "oklch(22% 0.06 240)" }}>
                                    <div className="h-full rounded-full" style={{ width: `${Math.min(100, pctOfGap)}%`, background: config?.color ?? "#1A85FF" }} />
                                  </div>
                                  <span className="text-[10px] tabular-nums" style={{ color: "oklch(55% 0.04 240)" }}>{pctOfGap.toFixed(0)}%</span>
                                </div>
                              </td>
                              <td>
                                <button
                                  onClick={() => { if (confirm("Supprimer ce levier ?")) deleteLeverMut.mutate({ id: lever.id, isActive: false }); }}
                                  className="w-5 h-5 rounded flex items-center justify-center hover:bg-red-500/20 transition-colors mx-auto"
                                  style={{ color: "oklch(50% 0.04 240)" }}
                                >
                                  <Trash2 size={10} />
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  )}
                </div>

                {/* Right panel: charts */}
                <div className="space-y-3">
                  {/* Coverage donut */}
                  <div className="rounded-lg p-3" style={{ background: "oklch(15% 0.05 240)", border: "1px solid oklch(25% 0.06 240)" }}>
                    <h4 className="text-[10px] font-heading font-700 text-white mb-2 tracking-wider uppercase">Couverture du gap</h4>
                    <div className="relative">
                      <ResponsiveContainer width="100%" height={120}>
                        <PieChart>
                          <Pie
                            data={[
                              { name: "Couvert", value: Math.min(coveredByActiveLevers, gap) },
                              { name: "Restant", value: Math.max(0, gap - coveredByActiveLevers) },
                            ]}
                            cx="50%"
                            cy="50%"
                            innerRadius={35}
                            outerRadius={50}
                            startAngle={90}
                            endAngle={-270}
                            dataKey="value"
                          >
                            <Cell fill={coverageRatio >= 0.9 ? "oklch(60% 0.18 145)" : "#1A85FF"} />
                            <Cell fill="oklch(22% 0.06 240)" />
                          </Pie>
                          <Tooltip contentStyle={{ background: "oklch(18% 0.06 240)", border: "1px solid oklch(28% 0.07 240)", borderRadius: "6px", fontSize: "10px" }} formatter={(v: any) => formatCurrency(v)} />
                        </PieChart>
                      </ResponsiveContainer>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="text-center">
                          <div className="text-lg font-heading font-800 tabular-nums" style={{ color: coverageRatio >= 0.9 ? "oklch(60% 0.18 145)" : "#C9A84C" }}>
                            {Math.round(coverageRatio * 100)}%
                          </div>
                          <div className="text-[9px]" style={{ color: "oklch(45% 0.05 240)" }}>couvert</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Lever type breakdown */}
                  {leverTypeData.length > 0 && (
                    <div className="rounded-lg p-3" style={{ background: "oklch(15% 0.05 240)", border: "1px solid oklch(25% 0.06 240)" }}>
                      <h4 className="text-[10px] font-heading font-700 text-white mb-2 tracking-wider uppercase">Par type de levier</h4>
                      <div className="space-y-1.5">
                        {leverTypeData.map(d => (
                          <div key={d.name} className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: d.color }} />
                            <div className="text-[10px] flex-1 truncate" style={{ color: "oklch(65% 0.03 240)" }}>{d.name}</div>
                            <div className="text-[10px] font-heading font-700 tabular-nums" style={{ color: d.color }}>{formatCurrency(d.value)}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Summary */}
                  <div className="rounded-lg p-3 space-y-2" style={{ background: "oklch(15% 0.05 240)", border: "1px solid oklch(25% 0.06 240)" }}>
                    <h4 className="text-[10px] font-heading font-700 text-white tracking-wider uppercase">Résumé</h4>
                    {[
                      { label: "Leviers actifs", value: String(activeLevers.length) + " / " + String(levers.length), color: "#1A85FF" },
                      { label: "Impact total", value: formatCurrency(coveredByActiveLevers), color: "#C9A84C" },
                      { label: "Gap résiduel", value: formatCurrency(Math.max(0, gap - coveredByActiveLevers)), color: gap - coveredByActiveLevers > 0 ? "oklch(55% 0.22 25)" : "oklch(60% 0.18 145)" },
                    ].map(item => (
                      <div key={item.label} className="flex items-center justify-between">
                        <span className="text-[10px]" style={{ color: "oklch(55% 0.04 240)" }}>{item.label}</span>
                        <span className="text-[10px] font-heading font-700 tabular-nums" style={{ color: item.color }}>{item.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
