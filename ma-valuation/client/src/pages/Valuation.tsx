import { useState } from "react";
import { trpc } from "@/lib/trpc";
import AppLayout from "@/components/AppLayout";
import { KpiCard, AiSuggestion, formatCurrency, formatMultiple } from "@/components/FinancialComponents";
import { BarChart3, Plus, Brain, Play, FileText, ChevronDown, ChevronRight, Settings } from "lucide-react";
import { toast } from "sonner";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, ReferenceLine } from "recharts";
import { Streamdown } from "streamdown";

type Method = "ebitda_multiple" | "dcf" | "anr" | "market_comps" | "transactions" | "yield" | "goodwill";

const METHOD_CONFIG: Record<Method, { label: string; shortLabel: string; color: string; description: string }> = {
  ebitda_multiple: { label: "Multiple d'EBITDA", shortLabel: "EBITDA ×", color: "#1A85FF", description: "Valorisation par multiple d'EBITDA normatif" },
  dcf: { label: "DCF — Flux actualisés", shortLabel: "DCF", color: "#C9A84C", description: "Discounted Cash Flow — actualisation des FCF" },
  anr: { label: "Actif Net Réévalué", shortLabel: "ANR", color: "oklch(60% 0.18 145)", description: "Valorisation patrimoniale des actifs nets" },
  market_comps: { label: "Comparables boursiers", shortLabel: "Comps", color: "oklch(55% 0.22 280)", description: "Multiples de sociétés cotées comparables" },
  transactions: { label: "Transactions comparables", shortLabel: "Trans.", color: "oklch(60% 0.20 200)", description: "Multiples de transactions M&A récentes" },
  yield: { label: "Rendement", shortLabel: "Yield", color: "oklch(55% 0.22 60)", description: "Valorisation par taux de rendement" },
  goodwill: { label: "Goodwill (survaleur)", shortLabel: "GW", color: "oklch(60% 0.15 300)", description: "ANR + actualisation du super-profit" },
};

interface MethodConfig {
  method: Method;
  enabled: boolean;
  weight: number;
  params: Record<string, number | number[]>;
}

const DEFAULT_METHODS: MethodConfig[] = [
  { method: "ebitda_multiple", enabled: true, weight: 35, params: { ebitda: 0, multipleLow: 5, multipleMid: 7, multipleHigh: 9, netDebt: 0 } },
  { method: "dcf", enabled: true, weight: 35, params: { fcfs: [0, 0, 0, 0, 0], wacc: 10, terminalGrowth: 2, netDebt: 0 } },
  { method: "anr", enabled: false, weight: 10, params: { adjustedNetAssets: 0, netDebt: 0 } },
  { method: "market_comps", enabled: true, weight: 20, params: { ebitda: 0, multipleLow: 4, multipleMid: 6, multipleHigh: 8, netDebt: 0 } },
  { method: "transactions", enabled: false, weight: 0, params: { ebitda: 0, multipleLow: 5, multipleMid: 7, multipleHigh: 9, netDebt: 0 } },
  { method: "yield", enabled: false, weight: 0, params: { netIncome: 0, yieldRate: 10, netDebt: 0 } },
  { method: "goodwill", enabled: false, weight: 0, params: { anr: 0, superProfit: 0, rate: 10, years: 5, netDebt: 0 } },
];

export default function Valuation() {
  const [searchParams] = useState(() => new URLSearchParams(window.location.search));
  const projectId = parseInt(searchParams.get("project") ?? "1");

  const [methods, setMethods] = useState<MethodConfig[]>(DEFAULT_METHODS);
  const [expandedMethod, setExpandedMethod] = useState<Method | null>("ebitda_multiple");
  const [activeTab, setActiveTab] = useState<"methods" | "results" | "narrative">("methods");
  const [results, setResults] = useState<any[]>([]);
  const [weightedEv, setWeightedEv] = useState<number | null>(null);
  const [narrative, setNarrative] = useState<string>("");
  const [aiSuggestions, setAiSuggestions] = useState<string[]>([]);
  const [selectedRunId, setSelectedRunId] = useState<number | null>(null);

  const { data: runs = [], refetch: refetchRuns } = trpc.valuation.listRuns.useQuery({ projectId });
  const createRun = trpc.valuation.createRun.useMutation({
    onSuccess: (data: any) => { refetchRuns(); if (data?.id) setSelectedRunId(data.id); },
  });
  const calculate = trpc.valuation.calculate.useMutation({
    onSuccess: (data) => {
      setResults(data.results);
      setWeightedEv(data.weightedEv);
      setActiveTab("results");
      toast.success("Valorisation calculée");
    },
    onError: (e) => toast.error(e.message),
  });
  const generateNarrative = trpc.valuation.generateNarrative.useMutation({
    onSuccess: (data) => {
      const txt = typeof data.narrative === "string" ? data.narrative : String(data.narrative ?? "");
      setNarrative(txt);
      setActiveTab("narrative");
    },
  });

  const activeRun = runs.find(r => r.id === selectedRunId) ?? runs[0];

  const handleCalculate = async () => {
    let runId = activeRun?.id;
    if (!runId) {
      const run = await createRun.mutateAsync({ projectId });
      runId = (run as any)?.id;
    }
    if (!runId) return;
    setSelectedRunId(runId);

    const enabledMethods = methods.filter(m => m.enabled);
    const totalWeight = enabledMethods.reduce((s, m) => s + m.weight, 0);

    calculate.mutate({
      runId,
      projectId,
      methods: enabledMethods.map(m => ({
        method: m.method,
        params: m.params as Record<string, unknown>,
        weight: totalWeight > 0 ? (m.weight / totalWeight) * 100 : 0,
      })),
    });
  };

  const updateParam = (method: Method, key: string, value: number) => {
    setMethods(prev => prev.map(m => m.method === method ? { ...m, params: { ...m.params, [key]: value } } : m));
  };

  const updateFCF = (method: Method, index: number, value: number) => {
    setMethods(prev => prev.map(m => {
      if (m.method !== method) return m;
      const fcfs = [...(m.params.fcfs as number[])];
      fcfs[index] = value;
      return { ...m, params: { ...m.params, fcfs } };
    }));
  };

  const toggleMethod = (method: Method) => {
    setMethods(prev => prev.map(m => m.method === method ? { ...m, enabled: !m.enabled } : m));
  };

  const updateWeight = (method: Method, weight: number) => {
    setMethods(prev => prev.map(m => m.method === method ? { ...m, weight } : m));
  };

  // Chart data for waterfall
  const chartData = results.map(r => ({
    name: METHOD_CONFIG[r.method as Method]?.shortLabel ?? r.method,
    low: r.evLow,
    mid: r.evMid,
    high: r.evHigh,
    color: METHOD_CONFIG[r.method as Method]?.color ?? "#1A85FF",
  }));

  const aiPanelContent = (
    <div className="space-y-2">
      {aiSuggestions.map((s, i) => (
        <AiSuggestion key={i} title="Analyse IA — Valorisation" content={s} type="insight" onDismiss={() => setAiSuggestions(prev => prev.filter((_, j) => j !== i))} />
      ))}
      {aiSuggestions.length === 0 && (
        <div className="text-center py-6">
          <BarChart3 size={20} className="mx-auto mb-2 opacity-30" style={{ color: "#C9A84C" }} />
          <p className="text-xs" style={{ color: "oklch(45% 0.05 240)" }}>Calculez la valorisation puis générez une narrative IA pour obtenir une analyse institutionnelle complète.</p>
        </div>
      )}
    </div>
  );

  const ParamInput = ({ method, field, label, step = 0.1, min, max }: { method: Method; field: string; label: string; step?: number; min?: number; max?: number }) => {
    const m = methods.find(x => x.method === method)!;
    return (
      <div>
        <label className="block text-[9px] font-heading font-600 tracking-wider uppercase mb-1" style={{ color: "oklch(50% 0.04 240)" }}>{label}</label>
        <input
          type="number"
          value={(m.params[field] as number) ?? 0}
          onChange={e => updateParam(method, field, parseFloat(e.target.value) || 0)}
          className="bloomberg-input"
          step={step}
          min={min}
          max={max}
        />
      </div>
    );
  };

  return (
    <AppLayout showAiPanel aiPanelContent={aiPanelContent}>
      <div className="h-full flex flex-col">
        {/* Module header */}
        <div className="module-header-gradient px-4 py-3 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "oklch(72% 0.14 75 / 0.15)" }}>
                <BarChart3 size={16} style={{ color: "#C9A84C" }} />
              </div>
              <div>
                <h1 className="text-sm font-heading font-800 text-white">Module 4 — Valorisation Multi-Méthodes</h1>
                <p className="text-xs" style={{ color: "oklch(50% 0.04 240)" }}>7 méthodes — EBITDA, DCF, ANR, Comparables, Transactions, Rendement, Goodwill</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {results.length > 0 && activeRun && (
                <button
                  onClick={() => generateNarrative.mutate({ runId: activeRun.id, companyName: "Entreprise cible" })}
                  disabled={generateNarrative.isPending}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded text-[10px] font-heading font-600 transition-all"
                  style={{ background: "oklch(72% 0.14 75 / 0.15)", color: "#C9A84C", border: "1px solid oklch(72% 0.14 75 / 0.3)" }}
                >
                  <Brain size={11} />
                  {generateNarrative.isPending ? "Génération..." : "Narrative IA"}
                </button>
              )}
              <button
                onClick={handleCalculate}
                disabled={calculate.isPending}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-heading font-600 text-white transition-all hover:opacity-90"
                style={{ background: "linear-gradient(135deg, #C9A84C, #A07830)" }}
              >
                {calculate.isPending ? <div className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin" /> : <Play size={12} />}
                Calculer
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex items-center gap-1 mt-3">
            {[
              { id: "methods", label: "Paramètres" },
              { id: "results", label: "Résultats" },
              { id: "narrative", label: "Narrative" },
            ].map(tab => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id as any)} className="px-3 py-1.5 rounded-t text-xs font-heading font-600 transition-all" style={{ background: activeTab === tab.id ? "oklch(15% 0.05 240)" : "transparent", color: activeTab === tab.id ? "white" : "oklch(55% 0.04 240)", borderBottom: activeTab === tab.id ? "2px solid #C9A84C" : "2px solid transparent" }}>
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-4">
          {/* Methods configuration */}
          {activeTab === "methods" && (
            <div className="space-y-2">
              {/* Weight summary */}
              <div className="flex items-center gap-3 p-3 rounded-lg mb-4" style={{ background: "oklch(15% 0.05 240)", border: "1px solid oklch(25% 0.06 240)" }}>
                <span className="text-xs font-heading font-600" style={{ color: "oklch(55% 0.04 240)" }}>Pondération totale :</span>
                {(() => {
                  const total = methods.filter(m => m.enabled).reduce((s, m) => s + m.weight, 0);
                  return (
                    <span className="text-sm font-heading font-700" style={{ color: total === 100 ? "oklch(60% 0.18 145)" : total > 100 ? "oklch(55% 0.22 25)" : "#C9A84C" }}>
                      {total}%
                    </span>
                  );
                })()}
                <span className="text-xs" style={{ color: "oklch(45% 0.05 240)" }}>(doit totaliser 100%)</span>
                <div className="ml-auto flex items-center gap-2">
                  {methods.filter(m => m.enabled).map(m => (
                    <div key={m.method} className="flex items-center gap-1 text-[10px]" style={{ color: METHOD_CONFIG[m.method].color }}>
                      <div className="w-2 h-2 rounded-full" style={{ background: METHOD_CONFIG[m.method].color }} />
                      {METHOD_CONFIG[m.method].shortLabel} {m.weight}%
                    </div>
                  ))}
                </div>
              </div>

              {methods.map(m => (
                <div key={m.method} className="rounded-lg overflow-hidden" style={{ border: `1px solid ${m.enabled ? METHOD_CONFIG[m.method].color + "40" : "oklch(22% 0.06 240)"}` }}>
                  <div
                    className="flex items-center gap-3 px-3 py-2.5 cursor-pointer"
                    style={{ background: m.enabled ? `${METHOD_CONFIG[m.method].color}08` : "oklch(15% 0.05 240)" }}
                    onClick={() => setExpandedMethod(expandedMethod === m.method ? null : m.method)}
                  >
                    {/* Toggle */}
                    <button
                      onClick={e => { e.stopPropagation(); toggleMethod(m.method); }}
                      className="w-8 h-4 rounded-full transition-all flex-shrink-0 relative"
                      style={{ background: m.enabled ? METHOD_CONFIG[m.method].color : "oklch(28% 0.07 240)" }}
                    >
                      <div className="absolute top-0.5 w-3 h-3 rounded-full bg-white transition-all" style={{ left: m.enabled ? "calc(100% - 14px)" : "2px" }} />
                    </button>

                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-heading font-700" style={{ color: m.enabled ? "white" : "oklch(55% 0.04 240)" }}>
                          {METHOD_CONFIG[m.method].label}
                        </span>
                        <span className="text-[9px] font-heading font-600 px-1.5 py-0.5 rounded" style={{ color: METHOD_CONFIG[m.method].color, background: `${METHOD_CONFIG[m.method].color}15` }}>
                          {METHOD_CONFIG[m.method].shortLabel}
                        </span>
                      </div>
                      <p className="text-[10px] mt-0.5" style={{ color: "oklch(50% 0.04 240)" }}>{METHOD_CONFIG[m.method].description}</p>
                    </div>

                    {m.enabled && (
                      <div className="flex items-center gap-2">
                        <label className="text-[10px] font-heading font-600" style={{ color: "oklch(55% 0.04 240)" }}>Poids</label>
                        <input
                          type="number"
                          value={m.weight}
                          onChange={e => { e.stopPropagation(); updateWeight(m.method, parseInt(e.target.value) || 0); }}
                          onClick={e => e.stopPropagation()}
                          className="bloomberg-input w-16 text-center"
                          min="0"
                          max="100"
                        />
                        <span className="text-[10px]" style={{ color: "oklch(55% 0.04 240)" }}>%</span>
                      </div>
                    )}

                    <span style={{ color: "oklch(50% 0.04 240)" }}>
                      {expandedMethod === m.method ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
                    </span>
                  </div>

                  {/* Parameters */}
                  {expandedMethod === m.method && m.enabled && (
                    <div className="px-4 py-3" style={{ background: "oklch(13% 0.045 240)", borderTop: "1px solid oklch(22% 0.06 240)" }}>
                      <div className="grid grid-cols-4 gap-3">
                        {m.method === "ebitda_multiple" && (
                          <>
                            <ParamInput method={m.method} field="ebitda" label="EBITDA normatif (k€)" step={10} />
                            <ParamInput method={m.method} field="multipleLow" label="Multiple bas (x)" step={0.1} />
                            <ParamInput method={m.method} field="multipleMid" label="Multiple central (x)" step={0.1} />
                            <ParamInput method={m.method} field="multipleHigh" label="Multiple haut (x)" step={0.1} />
                            <ParamInput method={m.method} field="netDebt" label="Dette nette (k€)" step={10} />
                          </>
                        )}
                        {m.method === "dcf" && (
                          <>
                            <ParamInput method={m.method} field="wacc" label="WACC (%)" step={0.1} min={1} max={30} />
                            <ParamInput method={m.method} field="terminalGrowth" label="Croissance terminale (%)" step={0.1} min={0} max={5} />
                            <ParamInput method={m.method} field="netDebt" label="Dette nette (k€)" step={10} />
                            <div className="col-span-4">
                              <label className="block text-[9px] font-heading font-600 tracking-wider uppercase mb-1.5" style={{ color: "oklch(50% 0.04 240)" }}>Free Cash-Flows projetés (k€)</label>
                              <div className="flex items-center gap-2">
                                {(m.params.fcfs as number[]).map((fcf, i) => (
                                  <div key={i} className="flex-1">
                                    <div className="text-[9px] text-center mb-1" style={{ color: "oklch(45% 0.05 240)" }}>N+{i + 1}</div>
                                    <input
                                      type="number"
                                      value={fcf}
                                      onChange={e => updateFCF(m.method, i, parseFloat(e.target.value) || 0)}
                                      className="bloomberg-input w-full"
                                      step={10}
                                    />
                                  </div>
                                ))}
                              </div>
                            </div>
                          </>
                        )}
                        {m.method === "anr" && (
                          <>
                            <ParamInput method={m.method} field="adjustedNetAssets" label="Actif net réévalué (k€)" step={10} />
                            <ParamInput method={m.method} field="netDebt" label="Dette nette (k€)" step={10} />
                          </>
                        )}
                        {(m.method === "market_comps" || m.method === "transactions") && (
                          <>
                            <ParamInput method={m.method} field="ebitda" label="EBITDA (k€)" step={10} />
                            <ParamInput method={m.method} field="multipleLow" label="Multiple bas (x)" step={0.1} />
                            <ParamInput method={m.method} field="multipleMid" label="Multiple central (x)" step={0.1} />
                            <ParamInput method={m.method} field="multipleHigh" label="Multiple haut (x)" step={0.1} />
                            <ParamInput method={m.method} field="netDebt" label="Dette nette (k€)" step={10} />
                          </>
                        )}
                        {m.method === "yield" && (
                          <>
                            <ParamInput method={m.method} field="netIncome" label="Résultat net (k€)" step={10} />
                            <ParamInput method={m.method} field="yieldRate" label="Taux de rendement (%)" step={0.5} min={1} max={30} />
                            <ParamInput method={m.method} field="netDebt" label="Dette nette (k€)" step={10} />
                          </>
                        )}
                        {m.method === "goodwill" && (
                          <>
                            <ParamInput method={m.method} field="anr" label="ANR (k€)" step={10} />
                            <ParamInput method={m.method} field="superProfit" label="Super-profit annuel (k€)" step={10} />
                            <ParamInput method={m.method} field="rate" label="Taux d'actualisation (%)" step={0.5} />
                            <ParamInput method={m.method} field="years" label="Durée (années)" step={1} min={3} max={10} />
                          </>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Results */}
          {activeTab === "results" && (
            <div className="space-y-4">
              {results.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <BarChart3 size={32} className="mb-3 opacity-20" style={{ color: "#C9A84C" }} />
                  <h3 className="text-sm font-heading font-700 text-white mb-1">Aucun résultat</h3>
                  <p className="text-xs" style={{ color: "oklch(50% 0.04 240)" }}>Configurez les paramètres et cliquez sur "Calculer".</p>
                </div>
              ) : (
                <>
                  {/* Weighted EV */}
                  {weightedEv !== null && (
                    <div className="grid grid-cols-3 gap-3">
                      <div className="col-span-2 rounded-lg p-4" style={{ background: "linear-gradient(135deg, oklch(55% 0.22 240 / 0.15), oklch(72% 0.14 75 / 0.1))", border: "1px solid oklch(55% 0.22 240 / 0.3)" }}>
                        <div className="text-[10px] font-heading font-600 tracking-widest uppercase mb-1" style={{ color: "oklch(55% 0.04 240)" }}>Valorisation pondérée (EV)</div>
                        <div className="text-3xl font-heading font-800 tabular-nums" style={{ color: "#C9A84C" }}>{formatCurrency(weightedEv)}</div>
                        <div className="text-xs mt-1" style={{ color: "oklch(55% 0.04 240)" }}>Moyenne pondérée des méthodes activées</div>
                      </div>
                      <div className="rounded-lg p-4" style={{ background: "oklch(15% 0.05 240)", border: "1px solid oklch(25% 0.06 240)" }}>
                        <div className="text-[10px] font-heading font-600 tracking-widest uppercase mb-2" style={{ color: "oklch(55% 0.04 240)" }}>Fourchette de valorisation</div>
                        <div className="space-y-1">
                          <div className="flex justify-between text-xs">
                            <span style={{ color: "oklch(55% 0.22 25)" }}>Bas</span>
                            <span className="font-heading font-700" style={{ color: "oklch(55% 0.22 25)" }}>{formatCurrency(Math.min(...results.map(r => r.evLow)))}</span>
                          </div>
                          <div className="flex justify-between text-xs">
                            <span style={{ color: "#1A85FF" }}>Central</span>
                            <span className="font-heading font-700" style={{ color: "#1A85FF" }}>{formatCurrency(weightedEv)}</span>
                          </div>
                          <div className="flex justify-between text-xs">
                            <span style={{ color: "oklch(60% 0.18 145)" }}>Haut</span>
                            <span className="font-heading font-700" style={{ color: "oklch(60% 0.18 145)" }}>{formatCurrency(Math.max(...results.map(r => r.evHigh)))}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Results table */}
                  <div className="rounded-lg overflow-hidden" style={{ border: "1px solid oklch(25% 0.06 240)" }}>
                    <table className="bloomberg-table">
                      <thead>
                        <tr>
                          <th className="text-left">Méthode</th>
                          <th>EV Bas</th>
                          <th>EV Central</th>
                          <th>EV Haut</th>
                          <th>Valeur des fonds propres</th>
                          <th>Multiple implicite</th>
                          <th>Poids</th>
                        </tr>
                      </thead>
                      <tbody>
                        {results.map(r => {
                          const config = METHOD_CONFIG[r.method as Method];
                          return (
                            <tr key={r.method}>
                              <td>
                                <div className="flex items-center gap-2">
                                  <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: config?.color ?? "#1A85FF" }} />
                                  <span className="font-medium text-white">{config?.label ?? r.method}</span>
                                </div>
                              </td>
                              <td style={{ color: "oklch(55% 0.22 25)" }}>{formatCurrency(r.evLow)}</td>
                              <td style={{ color: config?.color ?? "#1A85FF" }} className="font-heading font-700">{formatCurrency(r.evMid)}</td>
                              <td style={{ color: "oklch(60% 0.18 145)" }}>{formatCurrency(r.evHigh)}</td>
                              <td style={{ color: "#C9A84C" }}>{formatCurrency(r.equityValueMid)}</td>
                              <td>{r.multipleUsed ? formatMultiple(r.multipleUsed) : "—"}</td>
                              <td>
                                <div className="flex items-center gap-1.5">
                                  <div className="flex-1 h-1 rounded-full overflow-hidden" style={{ background: "oklch(22% 0.06 240)", maxWidth: "60px" }}>
                                    <div className="h-full rounded-full" style={{ width: `${methods.find(m => m.method === r.method)?.weight ?? 0}%`, background: config?.color ?? "#1A85FF" }} />
                                  </div>
                                  <span className="text-[10px] font-heading font-700 tabular-nums" style={{ color: config?.color ?? "#1A85FF" }}>
                                    {methods.find(m => m.method === r.method)?.weight ?? 0}%
                                  </span>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  {/* Chart */}
                  <div className="rounded-lg p-4" style={{ background: "oklch(15% 0.05 240)", border: "1px solid oklch(25% 0.06 240)" }}>
                    <h3 className="text-xs font-heading font-700 text-white mb-3">Fourchettes de valorisation par méthode (k€)</h3>
                    <ResponsiveContainer width="100%" height={220}>
                      <BarChart data={chartData} margin={{ top: 0, right: 10, left: -10, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="oklch(22% 0.06 240)" />
                        <XAxis dataKey="name" tick={{ fill: "oklch(55% 0.04 240)", fontSize: 10 }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fill: "oklch(55% 0.04 240)", fontSize: 10 }} axisLine={false} tickLine={false} />
                        <Tooltip
                          contentStyle={{ background: "oklch(18% 0.06 240)", border: "1px solid oklch(28% 0.07 240)", borderRadius: "6px", fontSize: "11px" }}
                          labelStyle={{ color: "white" }}
                          formatter={(value: any, name: string) => [formatCurrency(value), name === "low" ? "Bas" : name === "mid" ? "Central" : "Haut"]}
                        />
                        <Bar dataKey="low" name="Bas" fill="oklch(55% 0.22 25)" radius={[2, 2, 0, 0]} opacity={0.7} />
                        <Bar dataKey="mid" name="Central" radius={[2, 2, 0, 0]}>
                          {chartData.map((entry, index) => <Cell key={index} fill={entry.color} />)}
                        </Bar>
                        <Bar dataKey="high" name="Haut" fill="oklch(60% 0.18 145)" radius={[2, 2, 0, 0]} opacity={0.7} />
                        {weightedEv && <ReferenceLine y={weightedEv} stroke="#C9A84C" strokeDasharray="4 4" label={{ value: "EV pondérée", fill: "#C9A84C", fontSize: 10 }} />}
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Narrative */}
          {activeTab === "narrative" && (
            <div className="rounded-lg p-5" style={{ background: "oklch(15% 0.05 240)", border: "1px solid oklch(25% 0.06 240)" }}>
              {generateNarrative.isPending ? (
                <div className="flex items-center gap-2 text-xs py-8 justify-center" style={{ color: "#C9A84C" }}>
                  <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  Génération de la narrative institutionnelle...
                </div>
              ) : narrative ? (
                <div className="prose prose-sm max-w-none" style={{ color: "oklch(80% 0.02 240)" }}>
                  <Streamdown>{narrative}</Streamdown>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <FileText size={28} className="mb-3 opacity-20" style={{ color: "#C9A84C" }} />
                  <h3 className="text-sm font-heading font-700 text-white mb-1">Narrative non générée</h3>
                  <p className="text-xs max-w-xs mb-4" style={{ color: "oklch(50% 0.04 240)" }}>Calculez d'abord la valorisation, puis cliquez sur "Narrative IA" pour générer une analyse institutionnelle.</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
