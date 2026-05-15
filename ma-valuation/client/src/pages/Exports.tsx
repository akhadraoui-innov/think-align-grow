import { useState } from "react";
import { trpc } from "@/lib/trpc";
import AppLayout from "@/components/AppLayout";
import { FileSpreadsheet, FileText, Presentation, Download, CheckCircle, Clock, AlertCircle } from "lucide-react";
import { toast } from "sonner";

type ExportFormat = "excel" | "pdf" | "pptx";
type ExportScope = "valuation" | "business_plan" | "full";

interface ExportJob {
  id: string;
  format: ExportFormat;
  scope: ExportScope;
  status: "pending" | "running" | "done" | "error";
  filename?: string;
  error?: string;
}

const FORMAT_CONFIG: Record<ExportFormat, { label: string; icon: React.ReactNode; color: string; ext: string }> = {
  excel: { label: "Excel", icon: <FileSpreadsheet size={18} />, color: "oklch(60% 0.18 145)", ext: ".xlsx" },
  pdf: { label: "PDF", icon: <FileText size={18} />, color: "oklch(55% 0.22 25)", ext: ".pdf" },
  pptx: { label: "PowerPoint", icon: <Presentation size={18} />, color: "oklch(55% 0.22 280)", ext: ".pptx" },
};

const SCOPE_CONFIG: Record<ExportScope, { label: string; description: string }> = {
  valuation: { label: "Rapport de valorisation", description: "Résultats multi-méthodes, narrative IA, fourchettes EV" },
  business_plan: { label: "Business Plan", description: "Projections financières, hypothèses, scénarios" },
  full: { label: "Dossier complet", description: "Données historiques, stratégie, BP et valorisation" },
};

export default function Exports() {
  const [searchParams] = useState(() => new URLSearchParams(window.location.search));
  const projectId = parseInt(searchParams.get("project") ?? "1");

  const [selectedFormat, setSelectedFormat] = useState<ExportFormat>("excel");
  const [selectedScope, setSelectedScope] = useState<ExportScope>("valuation");
  const [jobs, setJobs] = useState<ExportJob[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);

  const { data: project } = trpc.projects.get.useQuery({ id: projectId });
  const { data: runs = [] } = trpc.valuation.listRuns.useQuery({ projectId });
  const { data: bps = [] } = trpc.businessPlan.list.useQuery({ projectId });

  const generateExcelExport = async () => {
    const jobId = crypto.randomUUID();
    const job: ExportJob = { id: jobId, format: "excel", scope: selectedScope, status: "running" };
    setJobs(prev => [job, ...prev]);
    setIsGenerating(true);

    try {
      // Collect data
      const run = runs[0];
      const bp = bps[0];

      // Dynamic import ExcelJS
      const ExcelJS = (await import("exceljs")).default;
      const wb = new ExcelJS.Workbook();
      wb.creator = "KHALEO Valuation";
      wb.created = new Date();

      // ── Sheet 1: Cover ──
      const coverSheet = wb.addWorksheet("Couverture");
      coverSheet.mergeCells("A1:F1");
      coverSheet.getCell("A1").value = project?.companyName ?? "Entreprise cible";
      coverSheet.getCell("A1").font = { bold: true, size: 18, color: { argb: "FFC9A84C" } };
      coverSheet.getCell("A2").value = "Rapport de Valorisation — KHALEO Valuation";
      coverSheet.getCell("A2").font = { size: 12, color: { argb: "FF1A85FF" } };
      coverSheet.getCell("A3").value = `Généré le ${new Date().toLocaleDateString("fr-FR")}`;
      coverSheet.getCell("A3").font = { size: 10, color: { argb: "FF888888" } };

      // ── Sheet 2: Valorisation ──
      if (run) {
        const valSheet = wb.addWorksheet("Valorisation");
        // Headers
        const headers = ["Méthode", "EV Bas (k€)", "EV Central (k€)", "EV Haut (k€)", "Fonds propres (k€)", "Multiple", "Poids (%)"];
        const headerRow = valSheet.addRow(headers);
        headerRow.eachCell(cell => {
          cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF0A1628" } };
          cell.font = { bold: true, color: { argb: "FFC9A84C" }, size: 10 };
          cell.border = { bottom: { style: "thin", color: { argb: "FF1A85FF" } } };
        });

        // Data rows
        const methodLabels: Record<string, string> = {
          ebitda_multiple: "Multiple d'EBITDA",
          dcf: "DCF — Flux actualisés",
          anr: "Actif Net Réévalué",
          market_comps: "Comparables boursiers",
          transactions: "Transactions comparables",
          yield: "Rendement",
          goodwill: "Goodwill",
        };

        // Placeholder rows if no results
        const placeholderMethods = ["ebitda_multiple", "dcf", "market_comps"];
        for (const method of placeholderMethods) {
          const row = valSheet.addRow([
            methodLabels[method] ?? method,
            "—", "—", "—", "—", "—", "—",
          ]);
          row.getCell(1).font = { bold: false, color: { argb: "FFCCCCCC" } };
        }

        // Column widths
        valSheet.columns = [
          { width: 30 }, { width: 16 }, { width: 16 }, { width: 16 }, { width: 18 }, { width: 12 }, { width: 12 },
        ];
      }

      // ── Sheet 3: Business Plan ──
      if (bp) {
        const bpSheet = wb.addWorksheet("Business Plan");
        const bpHeaders = ["Indicateur", "N+1", "N+2", "N+3", "N+4", "N+5", "TCAM"];
        const bpHeaderRow = bpSheet.addRow(bpHeaders);
        bpHeaderRow.eachCell(cell => {
          cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF0A1628" } };
          cell.font = { bold: true, color: { argb: "FF1A85FF" }, size: 10 };
        });

        const bpRows = [
          ["Chiffre d'affaires (k€)", "", "", "", "", "", ""],
          ["Marge brute (k€)", "", "", "", "", "", ""],
          ["EBITDA (k€)", "", "", "", "", "", ""],
          ["EBIT (k€)", "", "", "", "", "", ""],
          ["Résultat net (k€)", "", "", "", "", "", ""],
          ["Free Cash-Flow (k€)", "", "", "", "", "", ""],
        ];
        for (const r of bpRows) {
          const row = bpSheet.addRow(r);
          row.getCell(1).font = { bold: false, color: { argb: "FFCCCCCC" } };
        }

        bpSheet.columns = [{ width: 28 }, ...Array(6).fill({ width: 14 })];
      }

      // ── Sheet 4: Données historiques ──
      const histSheet = wb.addWorksheet("Données historiques");
      const histHeaders = ["Indicateur", "N-2", "N-1", "N", "Var N-2→N"];
      const histHeaderRow = histSheet.addRow(histHeaders);
      histHeaderRow.eachCell(cell => {
        cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF0A1628" } };
        cell.font = { bold: true, color: { argb: "FF1A85FF" }, size: 10 };
      });

      const histRows = [
        ["Chiffre d'affaires (k€)"],
        ["Marge brute (k€)"],
        ["EBITDA (k€)"],
        ["EBITDA % CA"],
        ["EBIT (k€)"],
        ["Résultat net (k€)"],
        ["Free Cash-Flow (k€)"],
        ["Dette financière nette (k€)"],
        ["BFR (k€)"],
      ];
      for (const r of histRows) {
        const row = histSheet.addRow([...r, "", "", "", ""]);
        row.getCell(1).font = { color: { argb: "FFCCCCCC" } };
      }
      histSheet.columns = [{ width: 30 }, { width: 16 }, { width: 16 }, { width: 16 }, { width: 16 }];

      // Generate buffer
      const buffer = await wb.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `KHALEO_Valorisation_${project?.companyName ?? "Export"}_${new Date().toISOString().split("T")[0]}.xlsx`;
      a.click();
      URL.revokeObjectURL(url);

      setJobs(prev => prev.map(j => j.id === jobId ? { ...j, status: "done", filename: a.download } : j));
      toast.success("Export Excel généré avec succès");
    } catch (err: any) {
      setJobs(prev => prev.map(j => j.id === jobId ? { ...j, status: "error", error: err.message } : j));
      toast.error("Erreur lors de la génération Excel");
    } finally {
      setIsGenerating(false);
    }
  };

  const generatePdfExport = () => {
    const jobId = crypto.randomUUID();
    setJobs(prev => [{ id: jobId, format: "pdf", scope: selectedScope, status: "running" }, ...prev]);

    // Create a print-optimized page
    const printWindow = window.open("", "_blank");
    if (!printWindow) { toast.error("Popup bloqué — autorisez les popups"); return; }

    const companyName = project?.companyName ?? "Entreprise cible";
    const date = new Date().toLocaleDateString("fr-FR");

    printWindow.document.write(`
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <title>Rapport de Valorisation — ${companyName}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@400;600;700;800&family=Inter:wght@400;500;600&display=swap');
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Inter', sans-serif; background: white; color: #1a1a2e; font-size: 11px; }
    .cover { background: #0A1628; color: white; padding: 60px 48px; min-height: 200px; }
    .cover h1 { font-family: 'Montserrat', sans-serif; font-size: 28px; font-weight: 800; color: #C9A84C; margin-bottom: 8px; }
    .cover h2 { font-family: 'Montserrat', sans-serif; font-size: 16px; font-weight: 600; color: #1A85FF; margin-bottom: 4px; }
    .cover .meta { font-size: 10px; color: #8899aa; margin-top: 12px; }
    .section { padding: 24px 48px; border-bottom: 1px solid #e5e7eb; }
    .section-title { font-family: 'Montserrat', sans-serif; font-size: 13px; font-weight: 700; color: #0A1628; text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 12px; padding-bottom: 6px; border-bottom: 2px solid #1A85FF; }
    table { width: 100%; border-collapse: collapse; font-size: 10px; }
    th { background: #0A1628; color: #C9A84C; padding: 6px 10px; text-align: right; font-family: 'Montserrat', sans-serif; font-weight: 600; font-size: 9px; letter-spacing: 0.06em; text-transform: uppercase; }
    th:first-child { text-align: left; }
    td { padding: 5px 10px; text-align: right; border-bottom: 1px solid #f0f0f0; }
    td:first-child { text-align: left; font-weight: 500; }
    tr:nth-child(even) { background: #f9fafb; }
    .value-blue { color: #1A85FF; font-weight: 600; }
    .value-gold { color: #C9A84C; font-weight: 700; }
    .footer { padding: 16px 48px; background: #f9fafb; font-size: 9px; color: #888; text-align: center; }
    @media print { @page { margin: 0; } body { print-color-adjust: exact; -webkit-print-color-adjust: exact; } }
  </style>
</head>
<body>
  <div class="cover">
    <h1>${companyName}</h1>
    <h2>Rapport de Valorisation — KHALEO Valuation</h2>
    <div class="meta">Généré le ${date} · Confidentiel — Usage restreint</div>
  </div>
  <div class="section">
    <div class="section-title">Synthèse de valorisation</div>
    <table>
      <thead><tr><th>Méthode</th><th>EV Bas (k€)</th><th>EV Central (k€)</th><th>EV Haut (k€)</th><th>Poids</th></tr></thead>
      <tbody>
        <tr><td>Multiple d'EBITDA</td><td>—</td><td class="value-blue">—</td><td>—</td><td>35%</td></tr>
        <tr><td>DCF — Flux actualisés</td><td>—</td><td class="value-blue">—</td><td>—</td><td>35%</td></tr>
        <tr><td>Comparables boursiers</td><td>—</td><td class="value-blue">—</td><td>—</td><td>20%</td></tr>
        <tr style="background:#0A1628; color:white;"><td style="color:#C9A84C; font-weight:700;">Valorisation pondérée</td><td>—</td><td class="value-gold">—</td><td>—</td><td>100%</td></tr>
      </tbody>
    </table>
  </div>
  <div class="section">
    <div class="section-title">Données historiques clés</div>
    <table>
      <thead><tr><th>Indicateur</th><th>N-2</th><th>N-1</th><th>N</th><th>Var.</th></tr></thead>
      <tbody>
        <tr><td>Chiffre d'affaires (k€)</td><td>—</td><td>—</td><td>—</td><td>—</td></tr>
        <tr><td>EBITDA (k€)</td><td>—</td><td>—</td><td>—</td><td>—</td></tr>
        <tr><td>EBITDA %</td><td>—</td><td>—</td><td>—</td><td>—</td></tr>
        <tr><td>Résultat net (k€)</td><td>—</td><td>—</td><td>—</td><td>—</td></tr>
        <tr><td>Free Cash-Flow (k€)</td><td>—</td><td>—</td><td>—</td><td>—</td></tr>
      </tbody>
    </table>
  </div>
  <div class="footer">KHALEO Valuation · Document confidentiel · ${date}</div>
  <script>window.onload = () => { window.print(); }</script>
</body>
</html>`);
    printWindow.document.close();

    setJobs(prev => prev.map(j => j.id === jobId ? { ...j, status: "done" } : j));
    toast.success("Rapport PDF ouvert — utilisez Ctrl+P pour sauvegarder");
  };

  const generatePptxExport = async () => {
    const jobId = crypto.randomUUID();
    setJobs(prev => [{ id: jobId, format: "pptx", scope: selectedScope, status: "running" }, ...prev]);
    setIsGenerating(true);

    try {
      const PptxGenJS = (await import("pptxgenjs")).default;
      const pptx = new PptxGenJS();
      pptx.layout = "LAYOUT_WIDE";
      pptx.author = "KHALEO Valuation";

      const NAVY = "0A1628";
      const BLUE = "1A85FF";
      const GOLD = "C9A84C";
      const WHITE = "FFFFFF";
      const GRAY = "8899AA";

      // ── Slide 1: Cover ──
      const slide1 = pptx.addSlide();
      slide1.background = { color: NAVY };
      slide1.addShape(pptx.ShapeType.rect, { x: 0, y: 0, w: "100%", h: 0.08, fill: { color: BLUE } });
      slide1.addText(project?.companyName ?? "Entreprise cible", {
        x: 0.6, y: 1.5, w: 8, h: 1.2,
        fontSize: 36, bold: true, color: GOLD, fontFace: "Montserrat",
      });
      slide1.addText("Rapport de Valorisation", {
        x: 0.6, y: 2.8, w: 8, h: 0.5,
        fontSize: 18, color: BLUE, fontFace: "Montserrat",
      });
      slide1.addText(`KHALEO Valuation · ${new Date().toLocaleDateString("fr-FR")} · Confidentiel`, {
        x: 0.6, y: 3.5, w: 8, h: 0.4,
        fontSize: 11, color: GRAY, fontFace: "Inter",
      });
      slide1.addShape(pptx.ShapeType.rect, { x: 0, y: 4.9, w: "100%", h: 0.08, fill: { color: GOLD } });

      // ── Slide 2: Executive Summary ──
      const slide2 = pptx.addSlide();
      slide2.background = { color: NAVY };
      slide2.addShape(pptx.ShapeType.rect, { x: 0, y: 0, w: "100%", h: 0.06, fill: { color: BLUE } });
      slide2.addText("SYNTHÈSE EXÉCUTIVE", {
        x: 0.4, y: 0.2, w: 9, h: 0.4,
        fontSize: 10, bold: true, color: GOLD, fontFace: "Montserrat", charSpacing: 3,
      });
      slide2.addText(project?.companyName ?? "Entreprise cible", {
        x: 0.4, y: 0.7, w: 9, h: 0.7,
        fontSize: 24, bold: true, color: WHITE, fontFace: "Montserrat",
      });

      // KPI boxes
      const kpis = [
        { label: "Secteur", value: project?.sectorLabel ?? "N/D" },
        { label: "Statut", value: project?.status ?? "draft" },
        { label: "Méthodes", value: "7 méthodes" },
        { label: "Horizon BP", value: "3-5 ans" },
      ];
      kpis.forEach((kpi, i) => {
        const x = 0.4 + i * 2.4;
        slide2.addShape(pptx.ShapeType.rect, { x, y: 1.6, w: 2.2, h: 1.2, fill: { color: "132040" }, line: { color: "1A3060", width: 1 } });
        slide2.addText(kpi.label.toUpperCase(), { x, y: 1.7, w: 2.2, h: 0.3, fontSize: 7, color: GRAY, align: "center", charSpacing: 2 });
        slide2.addText(kpi.value, { x, y: 2.1, w: 2.2, h: 0.5, fontSize: 14, bold: true, color: BLUE, align: "center", fontFace: "Montserrat" });
      });

      // ── Slide 3: Valorisation ──
      const slide3 = pptx.addSlide();
      slide3.background = { color: NAVY };
      slide3.addShape(pptx.ShapeType.rect, { x: 0, y: 0, w: "100%", h: 0.06, fill: { color: BLUE } });
      slide3.addText("VALORISATION MULTI-MÉTHODES", {
        x: 0.4, y: 0.2, w: 9, h: 0.4,
        fontSize: 10, bold: true, color: GOLD, fontFace: "Montserrat", charSpacing: 3,
      });

      // PptxGenJS table cells — fill must be ShapeFillProps {color: string}
      const CF = (c: string) => ({ type: "solid" as const, color: c });
      const tableData = [
        [
          { text: "Méthode", options: { bold: true, color: GOLD, fill: CF(NAVY) } },
          { text: "EV Bas", options: { bold: true, color: GOLD, fill: CF(NAVY), align: "right" as const } },
          { text: "EV Central", options: { bold: true, color: GOLD, fill: CF(NAVY), align: "right" as const } },
          { text: "EV Haut", options: { bold: true, color: GOLD, fill: CF(NAVY), align: "right" as const } },
          { text: "Poids", options: { bold: true, color: GOLD, fill: CF(NAVY), align: "right" as const } },
        ],
        [
          { text: "Multiple d'EBITDA", options: { color: WHITE } },
          { text: "—", options: { color: "888888", align: "right" as const } },
          { text: "—", options: { color: BLUE, bold: true, align: "right" as const } },
          { text: "—", options: { color: "888888", align: "right" as const } },
          { text: "35%", options: { color: BLUE, align: "right" as const } },
        ],
        [
          { text: "DCF — Flux actualisés", options: { color: WHITE } },
          { text: "—", options: { color: "888888", align: "right" as const } },
          { text: "—", options: { color: BLUE, bold: true, align: "right" as const } },
          { text: "—", options: { color: "888888", align: "right" as const } },
          { text: "35%", options: { color: BLUE, align: "right" as const } },
        ],
        [
          { text: "Comparables boursiers", options: { color: WHITE } },
          { text: "—", options: { color: "888888", align: "right" as const } },
          { text: "—", options: { color: BLUE, bold: true, align: "right" as const } },
          { text: "—", options: { color: "888888", align: "right" as const } },
          { text: "20%", options: { color: BLUE, align: "right" as const } },
        ],
        [
          { text: "VALORISATION PONDÉRÉE", options: { bold: true, color: GOLD, fill: CF("0D1E35") } },
          { text: "—", options: { color: "888888", fill: CF("0D1E35"), align: "right" as const } },
          { text: "—", options: { bold: true, color: GOLD, fill: CF("0D1E35"), align: "right" as const } },
          { text: "—", options: { color: "888888", fill: CF("0D1E35"), align: "right" as const } },
          { text: "100%", options: { bold: true, color: GOLD, fill: CF("0D1E35"), align: "right" as const } },
        ],
      ] as any;

      slide3.addTable(tableData, {
        x: 0.4, y: 0.8, w: 9.2, h: 3,
        fontSize: 11,
        fontFace: "Inter",
        rowH: 0.45,
        border: { type: "solid", color: "1A3060", pt: 0.5 },
      });

      // ── Slide 4: Business Plan ──
      const slide4 = pptx.addSlide();
      slide4.background = { color: NAVY };
      slide4.addShape(pptx.ShapeType.rect, { x: 0, y: 0, w: "100%", h: 0.06, fill: { color: BLUE } });
      slide4.addText("BUSINESS PLAN — PROJECTIONS FINANCIÈRES", {
        x: 0.4, y: 0.2, w: 9, h: 0.4,
        fontSize: 10, bold: true, color: GOLD, fontFace: "Montserrat", charSpacing: 3,
      });
      slide4.addText("Les projections financières détaillées sont disponibles dans le fichier Excel joint.", {
        x: 0.4, y: 1.5, w: 9, h: 0.5,
        fontSize: 13, color: GRAY, fontFace: "Inter",
      });

      // ── Slide 5: Disclaimer ──
      const slide5 = pptx.addSlide();
      slide5.background = { color: NAVY };
      slide5.addShape(pptx.ShapeType.rect, { x: 0, y: 0, w: "100%", h: 0.06, fill: { color: GOLD } });
      slide5.addText("DISCLAIMER", {
        x: 0.4, y: 0.5, w: 9, h: 0.4,
        fontSize: 10, bold: true, color: GOLD, fontFace: "Montserrat", charSpacing: 3,
      });
      slide5.addText(
        "Ce document est confidentiel et destiné exclusivement aux destinataires désignés. Les valorisations présentées sont des estimations basées sur les informations disponibles à la date de préparation et ne constituent pas une garantie de valeur. KHALEO Valuation décline toute responsabilité quant à l'utilisation de ce document à d'autres fins.",
        { x: 0.4, y: 1.2, w: 9.2, h: 2, fontSize: 10, color: GRAY, fontFace: "Inter" }
      );

      // Save
      const filename = `KHALEO_Valorisation_${project?.companyName ?? "Export"}_${new Date().toISOString().split("T")[0]}.pptx`;
      await pptx.writeFile({ fileName: filename });

      setJobs(prev => prev.map(j => j.id === jobId ? { ...j, status: "done", filename } : j));
      toast.success("Présentation PowerPoint générée");
    } catch (err: any) {
      setJobs(prev => prev.map(j => j.id === jobId ? { ...j, status: "error", error: err.message } : j));
      toast.error("Erreur lors de la génération PowerPoint");
      console.error(err);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleExport = () => {
    if (selectedFormat === "excel") generateExcelExport();
    else if (selectedFormat === "pdf") generatePdfExport();
    else if (selectedFormat === "pptx") generatePptxExport();
  };

  return (
    <AppLayout>
      <div className="h-full flex flex-col">
        <div className="module-header-gradient px-4 py-3 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "oklch(60% 0.18 145 / 0.15)" }}>
              <Download size={16} style={{ color: "oklch(60% 0.18 145)" }} />
            </div>
            <div>
              <h1 className="text-sm font-heading font-800 text-white">Exports</h1>
              <p className="text-xs" style={{ color: "oklch(50% 0.04 240)" }}>Excel · PDF · PowerPoint — Rapports institutionnels</p>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-auto p-4">
          <div className="grid grid-cols-3 gap-6 max-w-4xl">
            {/* Format selector */}
            <div className="col-span-2 space-y-4">
              <div>
                <h2 className="text-xs font-heading font-700 text-white mb-3 tracking-wider uppercase">Format d'export</h2>
                <div className="grid grid-cols-3 gap-3">
                  {(Object.entries(FORMAT_CONFIG) as [ExportFormat, typeof FORMAT_CONFIG[ExportFormat]][]).map(([format, config]) => (
                    <button
                      key={format}
                      onClick={() => setSelectedFormat(format)}
                      className="flex flex-col items-center gap-2 p-4 rounded-lg transition-all"
                      style={{
                        background: selectedFormat === format ? `${config.color}15` : "oklch(15% 0.05 240)",
                        border: `1px solid ${selectedFormat === format ? config.color + "60" : "oklch(22% 0.06 240)"}`,
                      }}
                    >
                      <div style={{ color: config.color }}>{config.icon}</div>
                      <span className="text-xs font-heading font-700" style={{ color: selectedFormat === format ? config.color : "oklch(65% 0.03 240)" }}>
                        {config.label}
                      </span>
                      <span className="text-[9px] font-mono" style={{ color: "oklch(45% 0.05 240)" }}>{config.ext}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <h2 className="text-xs font-heading font-700 text-white mb-3 tracking-wider uppercase">Périmètre</h2>
                <div className="space-y-2">
                  {(Object.entries(SCOPE_CONFIG) as [ExportScope, typeof SCOPE_CONFIG[ExportScope]][]).map(([scope, config]) => (
                    <button
                      key={scope}
                      onClick={() => setSelectedScope(scope)}
                      className="w-full flex items-start gap-3 p-3 rounded-lg text-left transition-all"
                      style={{
                        background: selectedScope === scope ? "oklch(55% 0.22 240 / 0.1)" : "oklch(15% 0.05 240)",
                        border: `1px solid ${selectedScope === scope ? "oklch(55% 0.22 240 / 0.4)" : "oklch(22% 0.06 240)"}`,
                      }}
                    >
                      <div className="w-4 h-4 rounded-full border-2 flex-shrink-0 mt-0.5 flex items-center justify-center" style={{ borderColor: selectedScope === scope ? "#1A85FF" : "oklch(40% 0.06 240)" }}>
                        {selectedScope === scope && <div className="w-2 h-2 rounded-full" style={{ background: "#1A85FF" }} />}
                      </div>
                      <div>
                        <div className="text-xs font-heading font-700" style={{ color: selectedScope === scope ? "white" : "oklch(65% 0.03 240)" }}>{config.label}</div>
                        <div className="text-[10px] mt-0.5" style={{ color: "oklch(50% 0.04 240)" }}>{config.description}</div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={handleExport}
                disabled={isGenerating}
                className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-heading font-700 text-white transition-all hover:opacity-90 disabled:opacity-50"
                style={{ background: "linear-gradient(135deg, #1A85FF, #0A5FCC)" }}
              >
                {isGenerating ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Download size={15} />
                )}
                {isGenerating ? "Génération en cours..." : `Exporter en ${FORMAT_CONFIG[selectedFormat].label}`}
              </button>
            </div>

            {/* Export history */}
            <div>
              <h2 className="text-xs font-heading font-700 text-white mb-3 tracking-wider uppercase">Historique</h2>
              <div className="space-y-2">
                {jobs.length === 0 ? (
                  <div className="text-center py-8 rounded-lg" style={{ background: "oklch(15% 0.05 240)", border: "1px solid oklch(22% 0.06 240)" }}>
                    <Download size={20} className="mx-auto mb-2 opacity-20" style={{ color: "oklch(55% 0.04 240)" }} />
                    <p className="text-[10px]" style={{ color: "oklch(50% 0.04 240)" }}>Aucun export</p>
                  </div>
                ) : (
                  jobs.map(job => {
                    const config = FORMAT_CONFIG[job.format];
                    return (
                      <div key={job.id} className="flex items-center gap-2 p-2.5 rounded-lg" style={{ background: "oklch(15% 0.05 240)", border: "1px solid oklch(22% 0.06 240)" }}>
                        <div style={{ color: config.color }}>{config.icon}</div>
                        <div className="flex-1 min-w-0">
                          <div className="text-[10px] font-heading font-600 text-white truncate">{config.label} — {SCOPE_CONFIG[job.scope].label}</div>
                          {job.filename && <div className="text-[9px] truncate" style={{ color: "oklch(50% 0.04 240)" }}>{job.filename}</div>}
                          {job.error && <div className="text-[9px]" style={{ color: "oklch(55% 0.22 25)" }}>{job.error}</div>}
                        </div>
                        {job.status === "running" && <div className="w-3 h-3 border border-current border-t-transparent rounded-full animate-spin flex-shrink-0" style={{ color: config.color }} />}
                        {job.status === "done" && <CheckCircle size={13} style={{ color: "oklch(60% 0.18 145)" }} className="flex-shrink-0" />}
                        {job.status === "error" && <AlertCircle size={13} style={{ color: "oklch(55% 0.22 25)" }} className="flex-shrink-0" />}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
