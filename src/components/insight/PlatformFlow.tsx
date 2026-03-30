import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { cn } from "@/lib/utils";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { FlowNodeCard } from "./FlowNodeCard";
import { FlowDetailSheet } from "./FlowDetailSheet";
import { FLOW_NODES, LAYER_CONFIG, getNodeById } from "./flowData";
import type { FlowLayer } from "./flowData";

const LAYERS: FlowLayer[] = ["learner", "ai", "admin", "data"];
const COLS = 6;
const ROWS = 4;

export function PlatformFlow() {
  const [activeLayers, setActiveLayers] = useState<FlowLayer[]>([...LAYERS]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const gridRef = useRef<HTMLDivElement>(null);
  const nodeRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const [positions, setPositions] = useState<Record<string, DOMRect>>({});

  // Compute positions for SVG lines
  const updatePositions = useCallback(() => {
    if (!gridRef.current) return;
    const gridRect = gridRef.current.getBoundingClientRect();
    const pos: Record<string, DOMRect> = {};
    for (const node of FLOW_NODES) {
      const el = nodeRefs.current[node.id];
      if (el) {
        const r = el.getBoundingClientRect();
        pos[node.id] = new DOMRect(
          r.x - gridRect.x + r.width / 2,
          r.y - gridRect.y + r.height / 2,
          r.width,
          r.height,
        );
      }
    }
    setPositions(pos);
  }, []);

  useEffect(() => {
    updatePositions();
    window.addEventListener("resize", updatePositions);
    return () => window.removeEventListener("resize", updatePositions);
  }, [updatePositions]);

  useEffect(() => {
    const t = setTimeout(updatePositions, 100);
    return () => clearTimeout(t);
  }, [activeLayers, updatePositions]);

  const handleLayerToggle = (vals: string[]) => {
    if (vals.length === 0) return;
    setActiveLayers(vals as FlowLayer[]);
  };

  const handleNodeClick = (id: string) => {
    setSelectedId(id);
    setSheetOpen(true);
  };

  const handleNavigate = (id: string) => {
    const node = getNodeById(id);
    if (node && !activeLayers.includes(node.layer)) {
      setActiveLayers((prev) => [...prev, node.layer]);
    }
    setSelectedId(id);
  };

  // Build grid cells: 6 cols × 4 rows
  const grid = useMemo(() => {
    const cells: (typeof FLOW_NODES[0] | null)[][] = Array.from({ length: ROWS }, () => Array(COLS).fill(null));
    for (const node of FLOW_NODES) {
      const { col, row } = node.position;
      if (row < ROWS && col < COLS) cells[row][col] = node;
    }
    return cells;
  }, []);

  // SVG connections
  const connections = useMemo(() => {
    const lines: { from: string; to: string; fromLayer: FlowLayer; toLayer: FlowLayer }[] = [];
    const seen = new Set<string>();
    for (const node of FLOW_NODES) {
      for (const cid of node.connections) {
        const key = [node.id, cid].sort().join("-");
        if (seen.has(key)) continue;
        seen.add(key);
        const target = getNodeById(cid);
        if (target) {
          lines.push({ from: node.id, to: cid, fromLayer: node.layer, toLayer: target.layer });
        }
      }
    }
    return lines;
  }, []);

  const selectedNode = selectedId ? getNodeById(selectedId) ?? null : null;

  return (
    <div className="space-y-6">
      {/* Layer filter bar */}
      <div className="flex flex-wrap items-center gap-3">
        <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Couches :</span>
        <ToggleGroup type="multiple" value={activeLayers} onValueChange={handleLayerToggle} className="gap-1.5">
          {LAYERS.map((layer) => {
            const cfg = LAYER_CONFIG[layer];
            const active = activeLayers.includes(layer);
            return (
              <ToggleGroupItem
                key={layer}
                value={layer}
                className={cn(
                  "text-xs font-semibold rounded-full px-3.5 h-8 gap-1.5 border transition-all",
                  active
                    ? cn(cfg.bg, cfg.border, cfg.text, "border-2")
                    : "border-border/50 text-muted-foreground/50",
                )}
              >
                <span className={cn("h-2 w-2 rounded-full", active ? cfg.bg.replace("/10", "/60") : "bg-muted")} />
                {cfg.label}
              </ToggleGroupItem>
            );
          })}
        </ToggleGroup>
      </div>

      {/* Flow grid with SVG overlay */}
      <div className="relative" ref={gridRef}>
        {/* SVG connections */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none z-0" style={{ overflow: "visible" }}>
          {connections.map(({ from, to, fromLayer, toLayer }) => {
            const p1 = positions[from];
            const p2 = positions[to];
            if (!p1 || !p2) return null;
            const bothVisible = activeLayers.includes(fromLayer) && activeLayers.includes(toLayer);
            const isHighlighted = selectedId === from || selectedId === to;

            // Curved path
            const dx = p2.x - p1.x;
            const dy = p2.y - p1.y;
            const cx1 = p1.x + dx * 0.4;
            const cy1 = p1.y;
            const cx2 = p2.x - dx * 0.4;
            const cy2 = p2.y;
            const d = `M ${p1.x} ${p1.y} C ${cx1} ${cy1}, ${cx2} ${cy2}, ${p2.x} ${p2.y}`;

            return (
              <path
                key={`${from}-${to}`}
                d={d}
                fill="none"
                stroke={isHighlighted ? "hsl(var(--primary))" : "hsl(var(--border))"}
                strokeWidth={isHighlighted ? 2.5 : 1.5}
                strokeDasharray={isHighlighted ? "none" : "6 4"}
                opacity={bothVisible ? (isHighlighted ? 1 : 0.4) : 0.08}
                className="transition-all duration-300"
              />
            );
          })}
        </svg>

        {/* Node grid */}
        <div className="grid grid-cols-6 gap-3 relative z-10">
          {grid.flat().map((node, i) => {
            if (!node) {
              return <div key={`empty-${i}`} className="min-h-[120px]" />;
            }
            const isFiltered = !activeLayers.includes(node.layer);
            return (
              <div
                key={node.id}
                ref={(el) => { nodeRefs.current[node.id] = el; }}
              >
                <FlowNodeCard
                  node={node}
                  isSelected={selectedId === node.id}
                  isFiltered={isFiltered}
                  onClick={() => handleNodeClick(node.id)}
                />
              </div>
            );
          })}
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-6 pt-2 border-t border-border/30">
        {LAYERS.map((layer) => {
          const cfg = LAYER_CONFIG[layer];
          const count = FLOW_NODES.filter((n) => n.layer === layer).length;
          return (
            <div key={layer} className="flex items-center gap-2">
              <span className={cn("h-3 w-3 rounded-full", cfg.bg.replace("/10", "/50"))} />
              <span className="text-xs text-muted-foreground font-medium">{cfg.label}</span>
              <span className="text-[10px] text-muted-foreground/50 font-bold">({count})</span>
            </div>
          );
        })}
        <div className="flex items-center gap-2 ml-auto">
          <span className="text-xs text-muted-foreground">{FLOW_NODES.length} composants</span>
          <span className="text-[10px] text-muted-foreground/50">•</span>
          <span className="text-xs text-muted-foreground">{connections.length} connexions</span>
        </div>
      </div>

      {/* Detail sheet */}
      <FlowDetailSheet
        node={selectedNode}
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        onNavigate={handleNavigate}
      />
    </div>
  );
}
