import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import AppLayout from "@/components/AppLayout";
import { SectionHeader, FinancialRow, AiSuggestion, formatCurrency, formatPct } from "@/components/FinancialComponents";
import { Database, ChevronDown, ChevronRight, Brain, Save, Plus, Trash2, BarChart2 } from "lucide-react";
import { toast } from "sonner";

const CURRENT_YEAR = new Date().getFullYear();
const DEFAULT_YEARS = [CURRENT_YEAR - 2, CURRENT_YEAR - 1, CURRENT_YEAR];

type Mode = "rapide" | "structure" | "expert";
type Tab = "income" | "balance" | "cashflow" | "kpis" | "restatements";

interface PeriodData {
  periodId: number;
  year: number;
}

export default function HistoricalData() {
  const [searchParams] = useState(() => new URLSearchParams(window.location.search));
  const projectId = parseInt(searchParams.get("project") ?? "1");

  const [mode, setMode] = useState<Mode>("rapide");
  const [activeTab, setActiveTab] = useState<Tab>("income");
  const [years] = useState(DEFAULT_YEARS);
  const [periodMap, setPeriodMap] = useState<Record<number, number>>({});
  const [aiSuggestions, setAiSuggestions] = useState<string[]>([]);
  const [showAiPanel, setShowAiPanel] = useState(false);

  // Income statement state per year
  const [incomeData, setIncomeData] = useState<Record<number, Record<string, string>>>({});
  const [balanceData, setBalanceData] = useState<Record<number, Record<string, string>>>({});
  const [cashFlowData, setCashFlowData] = useState<Record<number, Record<string, string>>>({});
  const [kpisData, setKpisData] = useState<Record<number, Record<string, string>>>({});

  const { data: periods, refetch: refetchPeriods } = trpc.historical.getPeriods.useQuery({ projectId });
  const upsertPeriod = trpc.historical.upsertPeriod.useMutation();
  const upsertIS = trpc.historical.upsertIncomeStatement.useMutation({ onSuccess: () => toast.success("Sauvegardé") });
  const upsertBS = trpc.historical.upsertBalanceSheet.useMutation({ onSuccess: () => toast.success("Sauvegardé") });
  const upsertCF = trpc.historical.upsertCashFlow.useMutation({ onSuccess: () => toast.success("Sauvegardé") });
  const upsertKPIs = trpc.historical.upsertKpis.useMutation({ onSuccess: () => toast.success("Sauvegardé") });
  const analyzeAI = trpc.historical.analyzeWithAI.useMutation({
    onSuccess: (data) => {
      const txt = typeof data.analysis === "string" ? data.analysis : String(data.analysis ?? "");
      setAiSuggestions([txt]);
      setShowAiPanel(true);
    },
  });

  // Initialize periods
  useEffect(() => {
    const init = async () => {
      const map: Record<number, number> = {};
      for (const year of years) {
        const existing = periods?.find(p => p.year === year);
        if (existing) {
          map[year] = existing.id;
        } else {
          const id = await upsertPeriod.mutateAsync({ projectId, year, mode });
          map[year] = id;
        }
      }
      setPeriodMap(map);
    };
    if (periods !== undefined) init();
  }, [periods, projectId]);

  const setIncome = (year: number, field: string, value: string) => {
    setIncomeData(prev => ({ ...prev, [year]: { ...prev[year], [field]: value } }));
  };
  const setBalance = (year: number, field: string, value: string) => {
    setBalanceData(prev => ({ ...prev, [year]: { ...prev[year], [field]: value } }));
  };
  const setCashFlow = (year: number, field: string, value: string) => {
    setCashFlowData(prev => ({ ...prev, [year]: { ...prev[year], [field]: value } }));
  };
  const setKpis = (year: number, field: string, value: string) => {
    setKpisData(prev => ({ ...prev, [year]: { ...prev[year], [field]: value } }));
  };

  const saveAll = async () => {
    for (const year of years) {
      const periodId = periodMap[year];
      if (!periodId) continue;
      if (incomeData[year]) await upsertIS.mutateAsync({ periodId, ...incomeData[year] as any });
      if (balanceData[year]) await upsertBS.mutateAsync({ periodId, ...balanceData[year] as any });
      if (cashFlowData[year]) await upsertCF.mutateAsync({ periodId, ...cashFlowData[year] as any });
      if (kpisData[year]) await upsertKPIs.mutateAsync({ periodId, ...kpisData[year] as any });
    }
  };

  const aiPanelContent = (
    <div className="space-y-2">
      {analyzeAI.isPending && (
        <div className="flex items-center gap-2 text-xs py-4" style={{ color: "#1A85FF" }}>
          <div className="w-3 h-3 border border-current border-t-transparent rounded-full animate-spin" />
          Analyse en cours...
        </div>
      )}
      {aiSuggestions.map((s, i) => (
        <AiSuggestion
          key={i}
          title="Analyse IA — Données historiques"
          content={s}
          type="insight"
          onDismiss={() => setAiSuggestions(prev => prev.filter((_, j) => j !== i))}
        />
      ))}
      {!analyzeAI.isPending && aiSuggestions.length === 0 && (
        <div className="text-center py-6">
          <Brain size={20} className="mx-auto mb-2 opacity-30" style={{ color: "#1A85FF" }} />
          <p className="text-xs" style={{ color: "oklch(45% 0.05 240)" }}>
            Cliquez sur "Analyser avec l'IA" pour obtenir une analyse des tendances et des ratios sectoriels.
          </p>
        </div>
      )}
    </div>
  );

  const NumInput = ({ year, field, data, setter, placeholder = "0" }: {
    year: number; field: string; data: Record<number, Record<string, string>>; setter: (y: number, f: string, v: string) => void; placeholder?: string;
  }) => (
    <input
      type="number"
      value={data[year]?.[field] ?? ""}
      onChange={e => setter(year, field, e.target.value)}
      placeholder={placeholder}
      className="bloomberg-input w-full"
      step="any"
    />
  );

  const TABS: { id: Tab; label: string; modes: Mode[] }[] = [
    { id: "income", label: "Compte de résultat", modes: ["rapide", "structure", "expert"] },
    { id: "balance", label: "Bilan", modes: ["structure", "expert"] },
    { id: "cashflow", label: "Flux de trésorerie", modes: ["structure", "expert"] },
    { id: "kpis", label: "KPIs opérationnels", modes: ["structure", "expert"] },
    { id: "restatements", label: "Retraitements", modes: ["expert"] },
  ];

  const visibleTabs = TABS.filter(t => t.modes.includes(mode));

  return (
    <AppLayout showAiPanel aiPanelContent={aiPanelContent}>
      <div className="h-full flex flex-col">
        {/* Module header */}
        <div className="module-header-gradient px-4 py-3 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "oklch(55% 0.22 240 / 0.15)" }}>
                <Database size={16} style={{ color: "#1A85FF" }} />
              </div>
              <div>
                <h1 className="text-sm font-heading font-800 text-white">Module 1 — Données Historiques</h1>
                <p className="text-xs" style={{ color: "oklch(50% 0.04 240)" }}>Saisie des données financières sur 3 exercices</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {/* Mode selector */}
              <div className="flex items-center gap-1 p-0.5 rounded-lg" style={{ background: "oklch(18% 0.06 240)" }}>
                {(["rapide", "structure", "expert"] as Mode[]).map(m => (
                  <button
                    key={m}
                    onClick={() => { setMode(m); if (!visibleTabs.find(t => t.id === activeTab)?.modes.includes(m)) setActiveTab("income"); }}
                    className="px-2.5 py-1 rounded text-[10px] font-heading font-600 tracking-wider uppercase transition-all capitalize"
                    style={{
                      background: mode === m ? "#1A85FF" : "transparent",
                      color: mode === m ? "white" : "oklch(55% 0.04 240)",
                    }}
                  >
                    {m}
                  </button>
                ))}
              </div>

              <button
                onClick={() => analyzeAI.mutate({ projectId, periodId: periodMap[years[years.length - 1]] ?? 0 })}
                disabled={analyzeAI.isPending}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded text-[10px] font-heading font-600 transition-all"
                style={{ background: "oklch(55% 0.22 240 / 0.15)", color: "#1A85FF", border: "1px solid oklch(55% 0.22 240 / 0.3)" }}
              >
                <Brain size={11} />
                Analyser IA
              </button>

              <button
                onClick={saveAll}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-heading font-600 text-white transition-all hover:opacity-90"
                style={{ background: "linear-gradient(135deg, #1A85FF, #0A5FCC)" }}
              >
                <Save size={12} />
                Sauvegarder
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex items-center gap-1 mt-3">
            {visibleTabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className="px-3 py-1.5 rounded-t text-xs font-heading font-600 transition-all"
                style={{
                  background: activeTab === tab.id ? "oklch(15% 0.05 240)" : "transparent",
                  color: activeTab === tab.id ? "white" : "oklch(55% 0.04 240)",
                  borderBottom: activeTab === tab.id ? "2px solid #1A85FF" : "2px solid transparent",
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-4">
          {/* Year headers */}
          <div className="rounded-lg overflow-hidden" style={{ border: "1px solid oklch(25% 0.06 240)" }}>
            <table className="bloomberg-table">
              <thead>
                <tr>
                  <th className="text-left" style={{ width: "220px" }}>
                    <span className="text-[10px] font-heading font-600 tracking-widest uppercase" style={{ color: "oklch(45% 0.05 240)" }}>Indicateur (k€)</span>
                  </th>
                  {years.map(y => (
                    <th key={y} style={{ minWidth: "130px" }}>
                      <div className="font-heading font-700 text-sm text-white">{y}</div>
                      <div className="text-[9px] font-normal mt-0.5" style={{ color: "oklch(45% 0.05 240)" }}>Exercice clos</div>
                    </th>
                  ))}
                  {mode === "expert" && <th style={{ minWidth: "130px" }}>TCAM</th>}
                </tr>
              </thead>
              <tbody>
                {activeTab === "income" && (
                  <>
                    <tr><td colSpan={years.length + 2} className="py-1 px-3 text-[9px] font-heading font-700 tracking-widest uppercase" style={{ background: "oklch(18% 0.06 240)", color: "#1A85FF" }}>REVENUS</td></tr>
                    <tr>
                      <td>Chiffre d'affaires</td>
                      {years.map(y => <td key={y}><NumInput year={y} field="revenue" data={incomeData} setter={setIncome} /></td>)}
                      {mode === "expert" && <td className="text-[10px]" style={{ color: "oklch(55% 0.04 240)" }}>—</td>}
                    </tr>
                    <tr>
                      <td>Croissance CA (%)</td>
                      {years.map(y => <td key={y}><NumInput year={y} field="revenueGrowthPct" data={incomeData} setter={setIncome} /></td>)}
                      {mode === "expert" && <td />}
                    </tr>
                    <tr><td colSpan={years.length + 2} className="py-1 px-3 text-[9px] font-heading font-700 tracking-widest uppercase" style={{ background: "oklch(18% 0.06 240)", color: "#1A85FF" }}>CHARGES</td></tr>
                    <tr>
                      <td>Coût des ventes</td>
                      {years.map(y => <td key={y}><NumInput year={y} field="costOfGoods" data={incomeData} setter={setIncome} /></td>)}
                      {mode === "expert" && <td />}
                    </tr>
                    <tr className="row-subtotal">
                      <td>Marge brute</td>
                      {years.map(y => {
                        const rev = parseFloat(incomeData[y]?.revenue ?? "0");
                        const cogs = parseFloat(incomeData[y]?.costOfGoods ?? "0");
                        const gm = rev - cogs;
                        return <td key={y} style={{ color: gm >= 0 ? "oklch(60% 0.18 145)" : "oklch(55% 0.22 25)" }}>{gm ? formatCurrency(gm) : "—"}</td>;
                      })}
                      {mode === "expert" && <td />}
                    </tr>
                    {mode !== "rapide" && (
                      <>
                        <tr>
                          <td>Charges de personnel</td>
                          {years.map(y => <td key={y}><NumInput year={y} field="personnelCosts" data={incomeData} setter={setIncome} /></td>)}
                          {mode === "expert" && <td />}
                        </tr>
                        <tr>
                          <td>Autres charges d'exploitation</td>
                          {years.map(y => <td key={y}><NumInput year={y} field="otherOpex" data={incomeData} setter={setIncome} /></td>)}
                          {mode === "expert" && <td />}
                        </tr>
                      </>
                    )}
                    <tr className="row-total">
                      <td>EBITDA</td>
                      {years.map(y => {
                        const rev = parseFloat(incomeData[y]?.revenue ?? "0");
                        const cogs = parseFloat(incomeData[y]?.costOfGoods ?? "0");
                        const pers = parseFloat(incomeData[y]?.personnelCosts ?? "0");
                        const opex = parseFloat(incomeData[y]?.otherOpex ?? "0");
                        const ebitda = mode === "rapide"
                          ? (incomeData[y]?.ebitda ? parseFloat(incomeData[y].ebitda) : null)
                          : rev - cogs - pers - opex;
                        return (
                          <td key={y}>
                            {mode === "rapide"
                              ? <NumInput year={y} field="ebitda" data={incomeData} setter={setIncome} />
                              : <span style={{ color: ebitda && ebitda >= 0 ? "#C9A84C" : "oklch(55% 0.22 25)" }}>{ebitda ? formatCurrency(ebitda) : "—"}</span>
                            }
                          </td>
                        );
                      })}
                      {mode === "expert" && <td />}
                    </tr>
                    <tr>
                      <td>Marge EBITDA (%)</td>
                      {years.map(y => {
                        const rev = parseFloat(incomeData[y]?.revenue ?? "0");
                        const ebitdaVal = parseFloat(incomeData[y]?.ebitda ?? "0");
                        const pct = rev > 0 ? (ebitdaVal / rev * 100) : null;
                        return <td key={y} style={{ color: "#C9A84C" }}>{pct !== null ? pct.toFixed(1) + "%" : "—"}</td>;
                      })}
                      {mode === "expert" && <td />}
                    </tr>
                    {mode !== "rapide" && (
                      <>
                        <tr>
                          <td>Dotations aux amortissements</td>
                          {years.map(y => <td key={y}><NumInput year={y} field="depreciation" data={incomeData} setter={setIncome} /></td>)}
                          {mode === "expert" && <td />}
                        </tr>
                        <tr className="row-subtotal">
                          <td>EBIT (Résultat d'exploitation)</td>
                          {years.map(y => {
                            const ebitda = parseFloat(incomeData[y]?.ebitda ?? "0");
                            const dep = parseFloat(incomeData[y]?.depreciation ?? "0");
                            const ebit = ebitda - dep;
                            return <td key={y}>{ebit ? formatCurrency(ebit) : "—"}</td>;
                          })}
                          {mode === "expert" && <td />}
                        </tr>
                        <tr>
                          <td>Résultat financier</td>
                          {years.map(y => <td key={y}><NumInput year={y} field="financialResult" data={incomeData} setter={setIncome} /></td>)}
                          {mode === "expert" && <td />}
                        </tr>
                        <tr>
                          <td>Impôts sur les sociétés</td>
                          {years.map(y => <td key={y}><NumInput year={y} field="tax" data={incomeData} setter={setIncome} /></td>)}
                          {mode === "expert" && <td />}
                        </tr>
                        <tr className="row-total">
                          <td>Résultat net</td>
                          {years.map(y => <td key={y}><NumInput year={y} field="netIncome" data={incomeData} setter={setIncome} /></td>)}
                          {mode === "expert" && <td />}
                        </tr>
                      </>
                    )}
                  </>
                )}

                {activeTab === "balance" && (
                  <>
                    <tr><td colSpan={years.length + 2} className="py-1 px-3 text-[9px] font-heading font-700 tracking-widest uppercase" style={{ background: "oklch(18% 0.06 240)", color: "#1A85FF" }}>ACTIF</td></tr>
                    {[
                      { field: "fixedAssets", label: "Immobilisations corporelles" },
                      { field: "intangibleAssets", label: "Immobilisations incorporelles" },
                      { field: "financialAssets", label: "Immobilisations financières" },
                      { field: "inventory", label: "Stocks" },
                      { field: "receivables", label: "Créances clients" },
                      { field: "cash", label: "Trésorerie" },
                    ].map(row => (
                      <tr key={row.field}>
                        <td>{row.label}</td>
                        {years.map(y => <td key={y}><NumInput year={y} field={row.field} data={balanceData} setter={setBalance} /></td>)}
                        {mode === "expert" && <td />}
                      </tr>
                    ))}
                    <tr className="row-total">
                      <td>Total Actif</td>
                      {years.map(y => <td key={y}><NumInput year={y} field="totalAssets" data={balanceData} setter={setBalance} /></td>)}
                      {mode === "expert" && <td />}
                    </tr>
                    <tr><td colSpan={years.length + 2} className="py-1 px-3 text-[9px] font-heading font-700 tracking-widest uppercase" style={{ background: "oklch(18% 0.06 240)", color: "#C9A84C" }}>PASSIF</td></tr>
                    {[
                      { field: "equity", label: "Capitaux propres" },
                      { field: "financialDebtLt", label: "Dettes financières LT" },
                      { field: "financialDebtSt", label: "Dettes financières CT" },
                      { field: "payables", label: "Dettes fournisseurs" },
                      { field: "otherLiabilities", label: "Autres dettes" },
                    ].map(row => (
                      <tr key={row.field}>
                        <td>{row.label}</td>
                        {years.map(y => <td key={y}><NumInput year={y} field={row.field} data={balanceData} setter={setBalance} /></td>)}
                        {mode === "expert" && <td />}
                      </tr>
                    ))}
                    <tr className="row-total">
                      <td>Dette financière nette</td>
                      {years.map(y => {
                        const lt = parseFloat(balanceData[y]?.financialDebtLt ?? "0");
                        const st = parseFloat(balanceData[y]?.financialDebtSt ?? "0");
                        const cash = parseFloat(balanceData[y]?.cash ?? "0");
                        const nfd = lt + st - cash;
                        return <td key={y} style={{ color: nfd > 0 ? "oklch(55% 0.22 25)" : "oklch(60% 0.18 145)" }}>{formatCurrency(nfd)}</td>;
                      })}
                      {mode === "expert" && <td />}
                    </tr>
                    <tr className="row-subtotal">
                      <td>Besoin en fonds de roulement</td>
                      {years.map(y => <td key={y}><NumInput year={y} field="workingCapitalRequirement" data={balanceData} setter={setBalance} /></td>)}
                      {mode === "expert" && <td />}
                    </tr>
                  </>
                )}

                {activeTab === "cashflow" && (
                  <>
                    {[
                      { field: "operatingCf", label: "Cash-flow d'exploitation", isTotal: false },
                      { field: "capexMaintenance", label: "Capex de maintenance", isTotal: false },
                      { field: "capexGrowth", label: "Capex de croissance", isTotal: false },
                      { field: "freeCashFlow", label: "Free Cash-Flow", isTotal: true },
                      { field: "wcrVariation", label: "Variation du BFR", isTotal: false },
                      { field: "debtRepayment", label: "Remboursement de dettes", isTotal: false },
                      { field: "dividends", label: "Dividendes versés", isTotal: false },
                    ].map(row => (
                      <tr key={row.field} className={row.isTotal ? "row-total" : ""}>
                        <td>{row.label}</td>
                        {years.map(y => <td key={y}><NumInput year={y} field={row.field} data={cashFlowData} setter={setCashFlow} /></td>)}
                        {mode === "expert" && <td />}
                      </tr>
                    ))}
                  </>
                )}

                {activeTab === "kpis" && (
                  <>
                    {[
                      { field: "headcountFte", label: "Effectif (ETP)", type: "int" },
                      { field: "revenuePerFte", label: "CA par ETP (k€)" },
                      { field: "clientCount", label: "Nombre de clients", type: "int" },
                      { field: "top5ClientConcentrationPct", label: "Concentration top 5 clients (%)" },
                      { field: "churnRatePct", label: "Taux de churn (%)" },
                      { field: "recurringRevenuePct", label: "Revenus récurrents (%)" },
                      { field: "orderBacklog", label: "Carnet de commandes (k€)" },
                      { field: "npsScore", label: "NPS Score", type: "int" },
                    ].map(row => (
                      <tr key={row.field}>
                        <td>{row.label}</td>
                        {years.map(y => <td key={y}><NumInput year={y} field={row.field} data={kpisData} setter={setKpis} /></td>)}
                        {mode === "expert" && <td />}
                      </tr>
                    ))}
                  </>
                )}

                {activeTab === "restatements" && (
                  <tr>
                    <td colSpan={years.length + 2} className="py-8 text-center">
                      <div className="text-xs" style={{ color: "oklch(50% 0.04 240)" }}>
                        Les retraitements normatifs sont disponibles en mode Expert.<br />
                        Utilisez le bouton "+" pour ajouter un retraitement par exercice.
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
