import { useEffect, useId, useMemo, useRef, useState } from "react";
import { AlertTriangle, ChevronDown, ChevronUp, Code2, Download, Maximize2, RotateCcw, ZoomIn, ZoomOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

interface MermaidDiagramProps {
  chart: string;
}

/* ──────────────────────────────────────────────────────────────────────
 * Lazy-loaded mermaid module (saves ~600kb on initial bundle)
 * ──────────────────────────────────────────────────────────────────── */
let mermaidPromise: Promise<typeof import("mermaid").default> | null = null;
function loadMermaid() {
  if (!mermaidPromise) {
    mermaidPromise = import("mermaid").then((m) => m.default);
  }
  return mermaidPromise;
}

/* ──────────────────────────────────────────────────────────────────────
 * Read live HSL from CSS vars and build mermaid themeVariables
 * ──────────────────────────────────────────────────────────────────── */
function getThemeVars(): Record<string, string> {
  const root = getComputedStyle(document.documentElement);
  const hsl = (name: string) => {
    const raw = root.getPropertyValue(name).trim();
    return raw ? `hsl(${raw})` : undefined;
  };
  return {
    // Nœuds principaux : fond CLAIR, bordure orange, texte FONCÉ
    primaryColor: hsl("--background") || "#FFFFFF",
    primaryTextColor: hsl("--foreground") || "#111827",
    primaryBorderColor: hsl("--primary") || "#F97316",
    // Nœuds secondaires (decisions, états alternatifs)
    secondaryColor: hsl("--muted") || "#F3F4F6",
    secondaryTextColor: hsl("--foreground") || "#111827",
    secondaryBorderColor: hsl("--primary") || "#F97316",
    // Nœuds tertiaires
    tertiaryColor: hsl("--accent") || "#FEF3C7",
    tertiaryTextColor: hsl("--foreground") || "#111827",
    tertiaryBorderColor: hsl("--primary") || "#F97316",
    // Liens / arêtes
    lineColor: hsl("--muted-foreground") || "#6B7280",
    edgeLabelBackground: hsl("--background") || "#FFFFFF",
    // Texte général (titres, labels)
    textColor: hsl("--foreground") || "#111827",
    titleColor: hsl("--foreground") || "#111827",
    // Backgrounds globaux
    background: "transparent",
    mainBkg: hsl("--background") || "#FFFFFF",
    // Cluster (sub-graph)
    clusterBkg: hsl("--muted") || "#F3F4F6",
    clusterBorder: hsl("--border") || "#E5E7EB",
    // Notes (sequence diagrams)
    noteBkgColor: hsl("--accent") || "#FEF3C7",
    noteTextColor: hsl("--foreground") || "#111827",
    noteBorderColor: hsl("--primary") || "#F97316",
    // Acteurs (sequence)
    actorBkg: hsl("--background") || "#FFFFFF",
    actorBorder: hsl("--primary") || "#F97316",
    actorTextColor: hsl("--foreground") || "#111827",
    actorLineColor: hsl("--muted-foreground") || "#6B7280",
    // Sequence loops/alts
    labelBoxBkgColor: hsl("--muted") || "#F3F4F6",
    labelBoxBorderColor: hsl("--primary") || "#F97316",
    labelTextColor: hsl("--foreground") || "#111827",
    loopTextColor: hsl("--foreground") || "#111827",
    fontFamily: "inherit",
  } as Record<string, string>;
}

function isDarkMode() {
  return document.documentElement.classList.contains("dark");
}

/* ──────────────────────────────────────────────────────────────────────
 * Component
 * ──────────────────────────────────────────────────────────────────── */
export function MermaidDiagram({ chart }: MermaidDiagramProps) {
  const reactId = useId().replace(/:/g, "");
  const id = useMemo(() => `mmd-${reactId}`, [reactId]);

  const [svg, setSvg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [showSource, setShowSource] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const [themeKey, setThemeKey] = useState(0);

  const containerRef = useRef<HTMLDivElement>(null);
  const fullscreenRef = useRef<HTMLDivElement>(null);
  const panZoomRef = useRef<any>(null);
  const fullscreenPanZoomRef = useRef<any>(null);

  /* Re-render on theme switch */
  useEffect(() => {
    const obs = new MutationObserver(() => setThemeKey((k) => k + 1));
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    return () => obs.disconnect();
  }, []);

  /* Render the diagram */
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    (async () => {
      try {
        const mermaid = await loadMermaid();
        mermaid.initialize({
          startOnLoad: false,
          theme: "base",
          securityLevel: "strict",
          themeVariables: getThemeVars(),
          fontFamily: "inherit",
          flowchart: { htmlLabels: true, curve: "basis", padding: 16 },
          sequence: { actorMargin: 50, useMaxWidth: true },
          gantt: { useMaxWidth: true },
        });

        // Validate first for clean error messages
        await mermaid.parse(chart);
        const { svg: rendered } = await mermaid.render(`${id}-${themeKey}`, chart);
        if (cancelled) return;
        setSvg(rendered);
        setLoading(false);
      } catch (e: any) {
        if (cancelled) return;
        console.warn("[Mermaid] Render failed:", e?.message || e);
        setError(e?.message || "Erreur de syntaxe");
        setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [chart, id, themeKey]);

  /* Wire svg-pan-zoom after SVG injection */
  useEffect(() => {
    if (!svg || !containerRef.current) return;
    let panZoom: any;
    (async () => {
      const svgEl = containerRef.current?.querySelector("svg");
      if (!svgEl) return;
      svgEl.removeAttribute("height");
      svgEl.style.maxWidth = "100%";
      svgEl.style.height = "auto";
      svgEl.setAttribute("role", "img");
      svgEl.setAttribute("aria-label", "Diagramme Mermaid");

      try {
        const mod = await import("svg-pan-zoom");
        panZoom = mod.default(svgEl as any, {
          zoomEnabled: true,
          controlIconsEnabled: false,
          fit: true,
          center: true,
          minZoom: 0.5,
          maxZoom: 5,
          mouseWheelZoomEnabled: false, // wheel = scroll page; use buttons
        });
        panZoomRef.current = panZoom;
      } catch (e) {
        // pan-zoom optional, fail silently
      }
    })();
    return () => {
      try { panZoom?.destroy?.(); } catch {}
    };
  }, [svg]);

  /* Pan-zoom for fullscreen dialog */
  useEffect(() => {
    if (!fullscreen || !svg || !fullscreenRef.current) return;
    let panZoom: any;
    (async () => {
      const svgEl = fullscreenRef.current?.querySelector("svg");
      if (!svgEl) return;
      svgEl.removeAttribute("height");
      svgEl.style.width = "100%";
      svgEl.style.height = "100%";
      try {
        const mod = await import("svg-pan-zoom");
        panZoom = mod.default(svgEl as any, {
          zoomEnabled: true,
          controlIconsEnabled: false,
          fit: true,
          center: true,
          minZoom: 0.3,
          maxZoom: 8,
          mouseWheelZoomEnabled: true,
        });
        fullscreenPanZoomRef.current = panZoom;
      } catch {}
    })();
    return () => {
      try { panZoom?.destroy?.(); } catch {}
    };
  }, [fullscreen, svg]);

  const zoomIn = () => panZoomRef.current?.zoomIn();
  const zoomOut = () => panZoomRef.current?.zoomOut();
  const reset = () => {
    panZoomRef.current?.resetZoom();
    panZoomRef.current?.center();
    panZoomRef.current?.fit();
  };

  const downloadSvg = () => {
    if (!svg) return;
    const blob = new Blob([svg], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "diagram.svg";
    a.click();
    URL.revokeObjectURL(url);
  };

  /* Keyboard shortcuts */
  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === "+" || e.key === "=") { e.preventDefault(); zoomIn(); }
    else if (e.key === "-") { e.preventDefault(); zoomOut(); }
    else if (e.key === "0") { e.preventDefault(); reset(); }
    else if (e.key.toLowerCase() === "f") { e.preventDefault(); setFullscreen(true); }
  };

  /* ───── Fallback: syntax error ───── */
  if (error) {
    return (
      <div className="my-6 rounded-xl border border-destructive/30 bg-destructive/5 overflow-hidden">
        <div className="flex items-start gap-3 p-4">
          <AlertTriangle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-destructive">Diagramme indisponible</p>
            <p className="text-xs text-muted-foreground mt-1">Syntaxe Mermaid invalide : {error.split("\n")[0]}</p>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowSource((s) => !s)}
              className="mt-2 h-7 text-xs gap-1.5"
            >
              <Code2 className="h-3 w-3" />
              {showSource ? "Masquer" : "Voir"} le code source
              {showSource ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
            </Button>
          </div>
        </div>
        {showSource && (
          <pre className="px-4 pb-4 text-xs font-mono text-muted-foreground overflow-x-auto whitespace-pre-wrap">{chart}</pre>
        )}
      </div>
    );
  }

  /* ───── Main render ───── */
  return (
    <>
      <div
        className="my-6 rounded-xl border bg-muted/20 overflow-hidden group relative outline-none focus-visible:ring-2 focus-visible:ring-primary"
        tabIndex={0}
        onKeyDown={onKey}
        aria-label="Diagramme interactif Mermaid. Touches : + zoom avant, - zoom arrière, 0 reset, F plein écran."
      >
        {/* Toolbar overlay (visible on hover/focus) */}
        <div className="absolute top-2 right-2 z-10 flex items-center gap-1 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity bg-background/90 backdrop-blur-sm border rounded-lg p-1 shadow-sm">
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={zoomOut} title="Zoom arrière (-)" aria-label="Zoom arrière">
            <ZoomOut className="h-3.5 w-3.5" />
          </Button>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={zoomIn} title="Zoom avant (+)" aria-label="Zoom avant">
            <ZoomIn className="h-3.5 w-3.5" />
          </Button>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={reset} title="Réinitialiser (0)" aria-label="Réinitialiser le zoom">
            <RotateCcw className="h-3.5 w-3.5" />
          </Button>
          <div className="w-px h-4 bg-border mx-0.5" />
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setFullscreen(true)} title="Plein écran (F)" aria-label="Mode plein écran">
            <Maximize2 className="h-3.5 w-3.5" />
          </Button>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={downloadSvg} title="Télécharger SVG" aria-label="Télécharger le diagramme au format SVG">
            <Download className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className={cn("h-7 w-7", showSource && "bg-muted")}
            onClick={() => setShowSource((s) => !s)}
            title="Voir le code source"
            aria-label="Afficher le code source"
          >
            <Code2 className="h-3.5 w-3.5" />
          </Button>
        </div>

        {/* Diagram */}
        <div
          ref={containerRef}
          className="flex justify-center items-center p-6 min-h-[200px] max-h-[600px] overflow-hidden"
        >
          {loading ? (
            <div className="flex flex-col items-center gap-2 text-muted-foreground">
              <div className="h-8 w-8 rounded-full border-2 border-primary/20 border-t-primary animate-spin" />
              <span className="text-xs">Génération du diagramme…</span>
            </div>
          ) : svg ? (
            <div className="w-full h-full" dangerouslySetInnerHTML={{ __html: svg }} />
          ) : null}
        </div>

        {/* Source code (collapsible) */}
        {showSource && (
          <div className="border-t bg-muted/30">
            <div className="px-4 py-1.5 bg-muted/50 border-b text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
              mermaid
            </div>
            <pre className="p-4 text-xs font-mono overflow-x-auto whitespace-pre-wrap">{chart}</pre>
          </div>
        )}
      </div>

      {/* Fullscreen dialog */}
      <Dialog open={fullscreen} onOpenChange={setFullscreen}>
        <DialogContent className="max-w-[95vw] w-[95vw] h-[95vh] p-0 gap-0 flex flex-col">
          <DialogTitle className="sr-only">Diagramme Mermaid en plein écran</DialogTitle>
          <div className="flex items-center justify-between px-4 py-2 border-b shrink-0">
            <span className="text-sm font-medium">Diagramme</span>
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => fullscreenPanZoomRef.current?.zoomOut()} title="Zoom arrière">
                <ZoomOut className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => fullscreenPanZoomRef.current?.zoomIn()} title="Zoom avant">
                <ZoomIn className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => {
                  fullscreenPanZoomRef.current?.resetZoom();
                  fullscreenPanZoomRef.current?.center();
                  fullscreenPanZoomRef.current?.fit();
                }}
                title="Réinitialiser"
              >
                <RotateCcw className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={downloadSvg} title="Télécharger SVG">
                <Download className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <div ref={fullscreenRef} className="flex-1 min-h-0 bg-muted/10 overflow-hidden">
            {svg && <div className="w-full h-full" dangerouslySetInnerHTML={{ __html: svg }} />}
          </div>
          <div className="px-4 py-2 border-t text-xs text-muted-foreground shrink-0">
            Molette : zoom · Glisser : déplacer · Double-clic : zoom rapide
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
