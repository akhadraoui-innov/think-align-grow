import { useState } from "react";
import { trpc } from "@/lib/trpc";
import AppLayout from "@/components/AppLayout";
import { AiSuggestion, formatCurrency, formatPct } from "@/components/FinancialComponents";
import { TrendingUp, Plus, Brain, Save, BarChart2, Settings, ChevronDown } from "lucide-react";
import { toast } from "sonner";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

type Mode = "rapide" | "structure" | "expert";
type Scenario = "base" | "high" | "low";

const SCENARIO_COLORS: Record<Scenario, string> = {
  base: "#1A85FF",
  high: "oklch(60% 0.18 145)",
  low: "oklch(55% 0.22 25)",
};

const SCENARIO_LABELS: Record<Scenario, string> = {
  base: "Scénario Base",
  high: "Scénario Haut",
  low: "Scénario Bas",
};

export default function BusinessPlan() {
  const [searchParams] = useState(() => new URLSearchParams(window.location.search));
  const projectId = parseInt(searchParams.get("project") ?? "1");

  const [mode, setMode] = useState<Mode>("rapide");
  const [activeScenario, setActiveScenario] = useState<Scenario>("base");
  const [activeTab, setActiveTab] = useState<"projections" | "assumptions" | "sensitivity" | "charts">("projections");
  const [showCreateBP, setShowCreateBP] = useState(false);
  const [selectedBpId, setSelectedBpId] = useState<number | null>(null);
  const [aiSuggestions, setAiSuggestions] = useState<string[]>([]);

  const { data: bps = [], refetch: refetchBPs } = trpc.businessPlan.list.useQuery({ projectId });
  const createBP = trpc.businessPlan.create.useMutation({
    onSuccess: (data: any) => { refetchBPs(); setShowCreateBP(false); if (data?.id) setSelectedBpId(data.id); },
  });
  const analyzeAI = trpc.businessPlan.analyzeWithAI.useMutation({
    onSuccess: (data: any) => setAiSuggestions(prev => [...prev, data.analysis]),
  });

  const activeBp = bps.find(bp => bp.id === selectedBpId) ?? bps[0];
  const bpId = activeBp?.id;

  const { data: projections = [], refetch: refetchProj } = trpc.businessPlan.getProjections.useQuery(
    { bpId: bpId! },
    { enabled: !!bpId }
  );
  const { data: assumptions = [] } = trpc.businessPlan.getAssumptions.useQuery(
    { bpId: bpId! },
    { enabled: !!bpId }
  );

  const upsertProjection = trpc.businessPlan.upsertProjection.useMutation({
    onSuccess: () => refetchProj(),
  });

  const [bpForm, setBpForm] = useState({ mode: "rapide" as Mode, horizonYears: 3, baseYear: new Date().getFullYear(), label: "" });
  const [projData, setProjData] = useState<Record<string, Record<string, string>>>({});

  const getKey = (year: number, scenario: Scenario) => `${year}_${scenario}`;
  const setProjField = (year: number, scenario: Scenario, field: string, value: string) => {
    const key = getKey(year, scenario);
    setProjData(prev => ({ ...prev, [key]: { ...prev[key], [field]: value } }));
  };
  const getProjField = (year: number, scenario: Scenario, field: string): string => {
    const key = getKey(year, scenario);
    const fromState = projData[key]?.[field];
    if (fromState !== undefined) return fromState;
    const fromDB = projections.find(p => p.year === year && p.scenario === scenario);
    return fromDB ? (fromDB as any)[field] ?? "" : "";
  };

  const saveProjections = async () => {
    if (!bpId) return;
    const horizon = activeBp?.horizonYears ?? 3;
    const baseYear = activeBp?.baseYear ?? new Date().getFullYear();
    const years = Array.from({ length: horizon }, (_, i) => baseYear + i + 1);
    const scenarios: Scenario[] = mode === "rapide" ? ["base"] : ["base", "high", "low"];

    for (const year of years) {
      for (const scenario of scenarios) {
        const key = getKey(year, scenario);
        if (projData[key]) {
          await upsertProjection.mutateAsync({ bpId, year, scenario, ...projData[key] as any });
        }
      }
    }
    toast.success("Business plan sauvegardé");
  };

  const horizon = activeBp?.horizonYears ?? 3;
  const baseYear = activeBp?.baseYear ?? new Date().getFullYear();
  const projYears = Array.from({ length: horizon }, (_, i) => baseYear + i + 1);
  const scenarios: Scenario[] = mode === "rapide" ? ["base"] : ["base", "high", "low"];

  // Chart data
  const chartData = projYears.map(year => {
    const obj: Record<string, any> = { year: String(year) };
    for (const s of scenarios) {
      const rev = getProjField(year, s, "revenue");
      const ebitda = getProjField(year, s, "ebitda");
      if (rev) obj[`revenue_${s}`] = parseFloat(rev);
      if (ebitda) obj[`ebitda_${s}`] = parseFloat(ebitda);
    }
    return obj;
  });

  const aiPanelContent = (
    <div className="space-y-2">
      {analyzeAI.isPending && (
        <div className="flex items-center gap-2 text-xs py-4" style={{ color: "#1A85FF" }}>
          <div className="w-3 h-3 border border-current border-t-transparent rounded-full animate-spin" />
          Analyse du business plan...
        </div>
      )}
      {aiSuggestions.map((s, i) => (
        <AiSuggestion key={i} title="Analyse IA — Business Plan" content={s} type="insight" onDismiss={() => setAiSuggestions(prev => prev.filter((_, j) => j !== i))} />
      ))}
      {!analyzeAI.isPending && aiSuggestions.length === 0 && (
        <div className="text-center py-6">
          <TrendingUp size={20} className="mx-auto mb-2 opacity-30" style={{ color: "#1A85FF" }} />
          <p className="text-xs" style={{ color: "oklch(45% 0.05 240)" }}>Saisissez vos projections puis demandez une analyse IA pour évaluer la crédibilité du business plan.</p>
        </div>
      )}
    </div>
  );

  const NumInput = ({ year, scenario, field }: { year: number; scenario: Scenario; field: string }) => (
    <input
      type="number"
      value={getProjField(year, scenario, field)}
      onChange={e => setProjField(year, scenario, field, e.target.value)}
      className="bloomberg-input w-full"
      step="any"
      placeholder="0"
    />
  );

  const PROJ_ROWS = [
    { field: "revenue", label: "Chiffre d'affaires", isTotal: false, color: "#1A85FF" },
    { field: "grossMargin", label: "Marge brute", isTotal: false },
    { field: "ebitda", label: "EBITDA", isTotal: true, color: "#C9A84C" },
    ...(mode !== "rapide" ? [
      { field: "ebit", label: "EBIT", isTotal: false },
      { field: "netIncome", label: "Résultat net", isTotal: false },
      { field: "freeCashFlow", label: "Free Cash-Flow", isTotal: false, color: "oklch(60% 0.18 145)" },
      { field: "capex", label: "Capex", isTotal: false },
      { field: "wcr", label: "BFR", isTotal: false },
      { field: "netFinancialDebt", label: "Dette financière nette", isTotal: false },
    ] : []),
  ];

  return (
    <AppLayout showAiPanel aiPanelContent={aiPanelContent}>
      <div className="h-full flex flex-col">
        {/* Module header */}
        <div className="module-header-gradient px-4 py-3 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "oklch(55% 0.22 240 / 0.15)" }}>
                <TrendingUp size={16} style={{ color: "#1A85FF" }} />
              </div>
              <div>
                <h1 className="text-sm font-heading font-800 text-white">Module 3 — Business Plan</h1>
                <p className="text-xs" style={{ color: "oklch(50% 0.04 240)" }}>Projections financières {horizon} ans — Scénarios base / haut / bas</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {/* BP selector */}
              {bps.length > 0 && (
                <select
                  value={selectedBpId ?? ""}
                  onChange={e => setSelectedBpId(parseInt(e.target.value))}
                  className="bloomberg-input text-left text-xs"
                  style={{ background: "oklch(18% 0.06 240)", minWidth: "160px" }}
                >
                  {bps.map(bp => <option key={bp.id} value={bp.id}>{bp.label ?? `BP ${bp.baseYear}+${bp.horizonYears}ans`}</option>)}
                </select>
              )}

              {/* Mode selector */}
              <div className="flex items-center gap-1 p-0.5 rounded-lg" style={{ background: "oklch(18% 0.06 240)" }}>
                {(["rapide", "structure", "expert"] as Mode[]).map(m => (
                  <button key={m} onClick={() => setMode(m)} className="px-2.5 py-1 rounded text-[10px] font-heading font-600 tracking-wider uppercase transition-all capitalize" style={{ background: mode === m ? "#1A85FF" : "transparent", color: mode === m ? "white" : "oklch(55% 0.04 240)" }}>{m}</button>
                ))}
              </div>

              {bpId && (
                <button onClick={() => analyzeAI.mutate({ bpId })} disabled={analyzeAI.isPending} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded text-[10px] font-heading font-600 transition-all" style={{ background: "oklch(55% 0.22 240 / 0.15)", color: "#1A85FF", border: "1px solid oklch(55% 0.22 240 / 0.3)" }}>
                  <Brain size={11} />Analyser IA
                </button>
              )}

              <button onClick={() => setShowCreateBP(true)} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded text-xs font-heading font-600 transition-all" style={{ background: "oklch(18% 0.06 240)", color: "oklch(70% 0.03 240)", border: "1px solid oklch(28% 0.07 240)" }}>
                <Plus size={12} />Nouveau BP
              </button>

              {bpId && (
                <button onClick={saveProjections} className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-heading font-600 text-white transition-all hover:opacity-90" style={{ background: "linear-gradient(135deg, #1A85FF, #0A5FCC)" }}>
                  <Save size={12} />Sauvegarder
                </button>
              )}
            </div>
          </div>

          {/* Tabs */}
          <div className="flex items-center gap-1 mt-3">
            {[
              { id: "projections", label: "Projections" },
              { id: "assumptions", label: "Hypothèses" },
              { id: "sensitivity", label: "Sensibilité" },
              { id: "charts", label: "Graphiques" },
            ].map(tab => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id as any)} className="px-3 py-1.5 rounded-t text-xs font-heading font-600 transition-all" style={{ background: activeTab === tab.id ? "oklch(15% 0.05 240)" : "transparent", color: activeTab === tab.id ? "white" : "oklch(55% 0.04 240)", borderBottom: activeTab === tab.id ? "2px solid #1A85FF" : "2px solid transparent" }}>
                {tab.label}
              </button>
            ))}

            {/* Scenario selector (only for non-rapide) */}
            {mode !== "rapide" && activeTab === "projections" && (
              <div className="ml-auto flex items-center gap-1 p-0.5 rounded-lg" style={{ background: "oklch(18% 0.06 240)" }}>
                {(["base", "high", "low"] as Scenario[]).map(s => (
                  <button key={s} onClick={() => setActiveScenario(s)} className="px-2.5 py-1 rounded text-[10px] font-heading font-600 transition-all" style={{ background: activeScenario === s ? SCENARIO_COLORS[s] : "transparent", color: activeScenario === s ? "white" : "oklch(55% 0.04 240)" }}>
                    {SCENARIO_LABELS[s].replace("Scénario ", "")}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-4">
          {/* No BP state */}
          {!bpId && !showCreateBP && (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <TrendingUp size={32} className="mb-3 opacity-20" style={{ color: "#1A85FF" }} />
              <h3 className="text-sm font-heading font-700 text-white mb-1">Aucun business plan</h3>
              <p className="text-xs max-w-xs mb-4" style={{ color: "oklch(50% 0.04 240)" }}>Créez un business plan pour saisir vos projections financières sur 3 à 5 ans.</p>
              <button onClick={() => setShowCreateBP(true)} className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-heading font-600 text-white" style={{ background: "linear-gradient(135deg, #1A85FF, #0A5FCC)" }}>
                <Plus size={12} />Créer un business plan
              </button>
            </div>
          )}

          {/* Create BP form */}
          {showCreateBP && (
            <div className="max-w-lg mx-auto">
              <div className="rounded-lg p-4" style={{ background: "oklch(15% 0.05 240)", border: "1px solid oklch(28% 0.07 240)" }}>
                <h3 className="text-sm font-heading font-700 text-white mb-4">Nouveau Business Plan</h3>
                <div className="space-y-3">
                  <div>
                    <label className="block text-[10px] font-heading font-600 tracking-widest uppercase mb-1.5" style={{ color: "oklch(55% 0.04 240)" }}>Libellé</label>
                    <input type="text" value={bpForm.label} onChange={e => setBpForm(f => ({ ...f, label: e.target.value }))} className="bloomberg-input text-left" placeholder="Ex : BP Acquisition 2025-2028" />
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[10px] font-heading font-600 tracking-widest uppercase mb-1.5" style={{ color: "oklch(55% 0.04 240)" }}>Mode</label>
                      <select value={bpForm.mode} onChange={e => setBpForm(f => ({ ...f, mode: e.target.value as Mode }))} className="bloomberg-input text-left" style={{ background: "oklch(18% 0.06 240)" }}>
                        <option value="rapide">Rapide</option>
                        <option value="structure">Structuré</option>
                        <option value="expert">Expert</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-heading font-600 tracking-widest uppercase mb-1.5" style={{ color: "oklch(55% 0.04 240)" }}>Année de base</label>
                      <input type="number" value={bpForm.baseYear} onChange={e => setBpForm(f => ({ ...f, baseYear: parseInt(e.target.value) }))} className="bloomberg-input" min="2020" max="2030" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-heading font-600 tracking-widest uppercase mb-1.5" style={{ color: "oklch(55% 0.04 240)" }}>Horizon (ans)</label>
                      <select value={bpForm.horizonYears} onChange={e => setBpForm(f => ({ ...f, horizonYears: parseInt(e.target.value) }))} className="bloomberg-input text-left" style={{ background: "oklch(18% 0.06 240)" }}>
                        <option value="3">3 ans</option>
                        <option value="4">4 ans</option>
                        <option value="5">5 ans</option>
                      </select>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 mt-4">
                  <button onClick={() => createBP.mutate({ projectId, ...bpForm })} disabled={createBP.isPending} className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-heading font-600 text-white" style={{ background: "linear-gradient(135deg, #1A85FF, #0A5FCC)" }}>
                    {createBP.isPending ? <div className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin" /> : <Plus size={12} />}
                    Créer
                  </button>
                  <button onClick={() => setShowCreateBP(false)} className="px-4 py-2 rounded-lg text-xs font-heading font-600" style={{ color: "oklch(55% 0.04 240)" }}>Annuler</button>
                </div>
              </div>
            </div>
          )}

          {/* Projections table */}
          {bpId && activeTab === "projections" && (
            <div className="rounded-lg overflow-hidden" style={{ border: "1px solid oklch(25% 0.06 240)" }}>
              <table className="bloomberg-table">
                <thead>
                  <tr>
                    <th className="text-left" style={{ width: "200px" }}>
                      <span className="text-[10px] font-heading font-600 tracking-widest uppercase" style={{ color: "oklch(45% 0.05 240)" }}>
                        {mode === "rapide" ? "Indicateur (k€)" : `${SCENARIO_LABELS[activeScenario]} (k€)`}
                      </span>
                    </th>
                    {projYears.map(y => (
                      <th key={y} style={{ minWidth: "120px" }}>
                        <div className="font-heading font-700 text-sm text-white">N+{y - baseYear}</div>
                        <div className="text-[9px] font-normal mt-0.5" style={{ color: "oklch(45% 0.05 240)" }}>{y}</div>
                      </th>
                    ))}
                    <th style={{ minWidth: "100px" }}>TCAM</th>
                  </tr>
                </thead>
                <tbody>
                  {PROJ_ROWS.map(row => {
                    const displayScenarios = mode === "rapide" ? ["base" as Scenario] : [activeScenario];
                    return displayScenarios.map(scenario => (
                      <tr key={`${row.field}_${scenario}`} className={row.isTotal ? "row-total" : ""}>
                        <td style={{ color: row.color ?? undefined }}>{row.label}</td>
                        {projYears.map(y => (
                          <td key={y}>
                            <NumInput year={y} scenario={scenario} field={row.field} />
                          </td>
                        ))}
                        <td>
                          {(() => {
                            const first = parseFloat(getProjField(projYears[0], scenario, row.field) || "0");
                            const last = parseFloat(getProjField(projYears[projYears.length - 1], scenario, row.field) || "0");
                            if (first > 0 && last > 0) {
                              const tcam = (Math.pow(last / first, 1 / (projYears.length - 1)) - 1) * 100;
                              return <span style={{ color: tcam >= 0 ? "oklch(60% 0.18 145)" : "oklch(55% 0.22 25)" }}>{tcam.toFixed(1)}%</span>;
                            }
                            return "—";
                          })()}
                        </td>
                      </tr>
                    ));
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Charts */}
          {bpId && activeTab === "charts" && (
            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-lg p-4" style={{ background: "oklch(15% 0.05 240)", border: "1px solid oklch(25% 0.06 240)" }}>
                <h3 className="text-xs font-heading font-700 text-white mb-3">Évolution du CA (k€)</h3>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={chartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="oklch(22% 0.06 240)" />
                    <XAxis dataKey="year" tick={{ fill: "oklch(55% 0.04 240)", fontSize: 10 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: "oklch(55% 0.04 240)", fontSize: 10 }} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={{ background: "oklch(18% 0.06 240)", border: "1px solid oklch(28% 0.07 240)", borderRadius: "6px", fontSize: "11px" }} labelStyle={{ color: "white" }} itemStyle={{ color: "#1A85FF" }} />
                    {scenarios.map(s => <Bar key={s} dataKey={`revenue_${s}`} name={SCENARIO_LABELS[s]} fill={SCENARIO_COLORS[s]} radius={[2, 2, 0, 0]} />)}
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="rounded-lg p-4" style={{ background: "oklch(15% 0.05 240)", border: "1px solid oklch(25% 0.06 240)" }}>
                <h3 className="text-xs font-heading font-700 text-white mb-3">Évolution de l'EBITDA (k€)</h3>
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={chartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="oklch(22% 0.06 240)" />
                    <XAxis dataKey="year" tick={{ fill: "oklch(55% 0.04 240)", fontSize: 10 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: "oklch(55% 0.04 240)", fontSize: 10 }} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={{ background: "oklch(18% 0.06 240)", border: "1px solid oklch(28% 0.07 240)", borderRadius: "6px", fontSize: "11px" }} labelStyle={{ color: "white" }} />
                    {scenarios.map(s => <Line key={s} type="monotone" dataKey={`ebitda_${s}`} name={SCENARIO_LABELS[s]} stroke={SCENARIO_COLORS[s]} strokeWidth={2} dot={{ r: 3, fill: SCENARIO_COLORS[s] }} />)}
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Sensitivity placeholder */}
          {bpId && activeTab === "sensitivity" && (
            <div className="rounded-lg p-6" style={{ background: "oklch(15% 0.05 240)", border: "1px solid oklch(25% 0.06 240)" }}>
              <h3 className="text-sm font-heading font-700 text-white mb-4">Analyse de sensibilité</h3>
              <div className="overflow-x-auto">
                <table className="bloomberg-table">
                  <thead>
                    <tr>
                      <th className="text-left">Hypothèse</th>
                      <th>-20%</th>
                      <th>-10%</th>
                      <th>Base</th>
                      <th>+10%</th>
                      <th>+20%</th>
                    </tr>
                  </thead>
                  <tbody>
                    {["Croissance CA", "Marge EBITDA", "Taux d'actualisation", "Multiple de sortie"].map(hyp => (
                      <tr key={hyp}>
                        <td>{hyp}</td>
                        {[-20, -10, 0, 10, 20].map(delta => (
                          <td key={delta} style={{ color: delta < 0 ? "oklch(55% 0.22 25)" : delta > 0 ? "oklch(60% 0.18 145)" : "#C9A84C" }}>
                            {delta === 0 ? "—" : `${delta > 0 ? "+" : ""}${delta}%`}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="text-xs mt-3" style={{ color: "oklch(50% 0.04 240)" }}>
                L'analyse de sensibilité complète sera calculée automatiquement à partir des projections saisies et des paramètres de valorisation.
              </p>
            </div>
          )}

          {/* Assumptions */}
          {bpId && activeTab === "assumptions" && (
            <div className="rounded-lg overflow-hidden" style={{ border: "1px solid oklch(25% 0.06 240)" }}>
              <table className="bloomberg-table">
                <thead>
                  <tr>
                    <th className="text-left">Hypothèse</th>
                    <th className="text-left">Catégorie</th>
                    <th>Valeur</th>
                    <th>Unité</th>
                    <th>Source</th>
                  </tr>
                </thead>
                <tbody>
                  {assumptions.length === 0 ? (
                    <tr><td colSpan={5} className="text-center py-8 text-xs" style={{ color: "oklch(50% 0.04 240)" }}>Aucune hypothèse saisie. Les hypothèses seront synchronisées depuis les leviers stratégiques.</td></tr>
                  ) : (
                    assumptions.map((a: any) => (
                      <tr key={a.id}>
                        <td>{a.label}</td>
                        <td><span className="text-[10px] px-1.5 py-0.5 rounded" style={{ background: "oklch(20% 0.06 240)", color: "oklch(60% 0.04 240)" }}>{a.category}</span></td>
                        <td style={{ color: "#1A85FF" }}>{a.value ?? "—"}</td>
                        <td style={{ color: "oklch(55% 0.04 240)" }}>{a.unit ?? "—"}</td>
                        <td><span className="text-[10px]" style={{ color: a.source === "lever" ? "#C9A84C" : "oklch(55% 0.04 240)" }}>{a.source}</span></td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
