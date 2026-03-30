
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Map, Briefcase, UserCircle, Route, Megaphone, Layers, Table2, LayoutGrid, Search, Filter, Link2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import { useState, useMemo, useRef, useEffect } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface NodeData {
  id: string;
  name: string;
  type: "function" | "persona" | "path" | "campaign";
  status?: string;
  meta?: Record<string, any>;
}

const difficultyColors: Record<string, string> = {
  beginner: "bg-emerald-500/10 text-emerald-700 border-emerald-200",
  intermediate: "bg-amber-500/10 text-amber-700 border-amber-200",
  advanced: "bg-red-500/10 text-red-700 border-red-200",
};

const statusColors: Record<string, string> = {
  draft: "bg-muted text-muted-foreground",
  published: "bg-emerald-500/10 text-emerald-700",
  active: "bg-blue-500/10 text-blue-700",
  completed: "bg-primary/10 text-primary",
  archived: "bg-muted text-muted-foreground",
};

const columnConfig = [
  { key: "functions", label: "Fonctions", icon: Briefcase, gradient: "from-emerald-500 to-teal-500" },
  { key: "personae", label: "Personae", icon: UserCircle, gradient: "from-amber-500 to-orange-500" },
  { key: "paths", label: "Parcours", icon: Route, gradient: "from-violet-500 to-blue-500" },
  { key: "campaigns", label: "Campagnes", icon: Megaphone, gradient: "from-rose-500 to-pink-500" },
];

export default function AdminAcademyMap() {
  const [selectedNode, setSelectedNode] = useState<NodeData | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [lines, setLines] = useState<{ x1: number; y1: number; x2: number; y2: number; color: string }[]>([]);

  const { data: functions = [] } = useQuery({
    queryKey: ["map-functions"],
    queryFn: async () => {
      const { data } = await supabase.from("academy_functions" as any).select("id, name, department, status").order("name");
      return (data || []) as any[];
    },
  });

  const { data: personae = [] } = useQuery({
    queryKey: ["map-personae"],
    queryFn: async () => {
      const { data } = await supabase.from("academy_personae").select("id, name, status, characteristics");
      return data || [];
    },
  });

  const { data: paths = [] } = useQuery({
    queryKey: ["map-paths"],
    queryFn: async () => {
      const { data } = await supabase.from("academy_paths").select("id, name, status, difficulty, function_id, persona_id, estimated_hours");
      return data || [];
    },
  });

  const { data: campaigns = [] } = useQuery({
    queryKey: ["map-campaigns"],
    queryFn: async () => {
      const { data } = await supabase.from("academy_campaigns").select("id, name, status, path_id, starts_at, ends_at");
      return data || [];
    },
  });

  const { data: moduleCounts = {} } = useQuery({
    queryKey: ["map-module-counts"],
    queryFn: async () => {
      const { data } = await supabase.from("academy_path_modules").select("path_id");
      const counts: Record<string, number> = {};
      (data || []).forEach((r: any) => { counts[r.path_id] = (counts[r.path_id] || 0) + 1; });
      return counts;
    },
  });

  // Filtering
  const matchSearch = (name: string) => !search || name.toLowerCase().includes(search.toLowerCase());
  const matchStatus = (status?: string) => statusFilter === "all" || status === statusFilter;
  const fFunctions = functions.filter((f: any) => matchSearch(f.name) && matchStatus(f.status));
  const fPersonae = personae.filter((p: any) => matchSearch(p.name) && matchStatus(p.status));
  const fPaths = paths.filter((p: any) => matchSearch(p.name) && matchStatus(p.status));
  const fCampaigns = campaigns.filter((c: any) => matchSearch(c.name) && matchStatus(c.status));

  // Matrix
  const matrix = useMemo(() => {
    const cells: Record<string, typeof paths> = {};
    paths.forEach(p => {
      const key = `${p.function_id || "none"}_${p.persona_id || "none"}`;
      if (!cells[key]) cells[key] = [];
      cells[key].push(p);
    });
    return cells;
  }, [paths]);

  // Stats
  const totalLinks = paths.reduce((s, p) => s + (p.function_id ? 1 : 0) + (p.persona_id ? 1 : 0), 0) + campaigns.filter(c => c.path_id).length;
  const coveragePct = functions.length > 0 && personae.length > 0
    ? Math.round((Object.keys(matrix).filter(k => !k.includes("none") && matrix[k].length > 0).length / (functions.length * personae.length)) * 100)
    : 0;

  // SVG Bezier lines
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!containerRef.current) return;
      const container = containerRef.current;
      const rect = container.getBoundingClientRect();
      const newLines: typeof lines = [];

      const getCenter = (el: Element) => {
        const r = el.getBoundingClientRect();
        return { x: r.left - rect.left + r.width / 2, y: r.top - rect.top + r.height / 2, right: r.left - rect.left + r.width, left: r.left - rect.left };
      };

      paths.forEach(p => {
        const pathEl = container.querySelector(`[data-node-id="path-${p.id}"]`);
        if (!pathEl) return;
        const pc = getCenter(pathEl);

        if (p.function_id) {
          const fnEl = container.querySelector(`[data-node-id="fn-${p.function_id}"]`);
          if (fnEl) {
            const fc = getCenter(fnEl);
            newLines.push({ x1: fc.right, y1: fc.y, x2: pc.left, y2: pc.y, color: "hsl(155 65% 42% / 0.2)" });
          }
        }
        if (p.persona_id) {
          const pEl = container.querySelector(`[data-node-id="persona-${p.persona_id}"]`);
          if (pEl) {
            const ppc = getCenter(pEl);
            newLines.push({ x1: ppc.right, y1: ppc.y, x2: pc.left, y2: pc.y, color: "hsl(38 95% 50% / 0.2)" });
          }
        }
      });

      campaigns.forEach(c => {
        const cEl = container.querySelector(`[data-node-id="camp-${c.id}"]`);
        const pEl = container.querySelector(`[data-node-id="path-${c.path_id}"]`);
        if (cEl && pEl) {
          const cc = getCenter(cEl);
          const pc = getCenter(pEl);
          newLines.push({ x1: pc.right, y1: pc.y, x2: cc.left, y2: cc.y, color: "hsl(350 85% 52% / 0.15)" });
        }
      });

      setLines(newLines);
    }, 300);
    return () => clearTimeout(timer);
  }, [functions, personae, paths, campaigns, search, statusFilter]);

  const FlowNode = ({ node, dataId, subtitle, extra }: { node: NodeData; dataId: string; subtitle?: string; extra?: React.ReactNode }) => (
    <div
      data-node-id={dataId}
      onClick={() => setSelectedNode(node)}
      className="group p-3 rounded-xl border bg-card hover:shadow-lg hover:border-primary/30 cursor-pointer transition-all text-left w-full relative overflow-hidden"
    >
      <div className="absolute inset-0 bg-gradient-to-br from-primary/[0.02] to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
      <div className="relative">
        <p className="text-xs font-semibold truncate">{node.name}</p>
        {subtitle && <p className="text-[10px] text-muted-foreground mt-0.5 truncate">{subtitle}</p>}
        <div className="flex items-center gap-1 mt-1.5 flex-wrap">
          {node.status && (
            <Badge variant="outline" className={cn("text-[9px] h-4 px-1.5", statusColors[node.status] || "")}>
              {node.status}
            </Badge>
          )}
          {extra}
        </div>
      </div>
    </div>
  );

  return (
    
      <div className="p-6 space-y-4">
        {/* Header with stats */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-primary/70 shadow-md">
              <Map className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-xl font-display font-bold">Cartographie Academy</h1>
              <div className="flex items-center gap-3 mt-0.5">
                <span className="text-[10px] text-muted-foreground">{functions.length + personae.length + paths.length + campaigns.length} nœuds</span>
                <span className="text-[10px] text-muted-foreground flex items-center gap-1"><Link2 className="h-2.5 w-2.5" />{totalLinks} liens</span>
                <span className="text-[10px] text-muted-foreground">{coveragePct}% couverture</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Rechercher…" className="pl-8 h-8 w-[180px] text-xs" />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="h-8 w-[130px] text-xs">
                <Filter className="h-3 w-3 mr-1" /><SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous statuts</SelectItem>
                <SelectItem value="published">Publié</SelectItem>
                <SelectItem value="draft">Brouillon</SelectItem>
                <SelectItem value="active">Actif</SelectItem>
                <SelectItem value="archived">Archivé</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <Tabs defaultValue="flow">
          <TabsList>
            <TabsTrigger value="flow" className="gap-1.5"><LayoutGrid className="h-3.5 w-3.5" /> Organigramme</TabsTrigger>
            <TabsTrigger value="matrix" className="gap-1.5"><Table2 className="h-3.5 w-3.5" /> Matrice</TabsTrigger>
            <TabsTrigger value="list" className="gap-1.5"><Layers className="h-3.5 w-3.5" /> Liste</TabsTrigger>
          </TabsList>

          {/* === FLOW VIEW === */}
          <TabsContent value="flow">
            <div ref={containerRef} className="relative overflow-x-auto">
              <svg ref={svgRef} className="absolute inset-0 w-full h-full pointer-events-none z-0">
                {lines.map((l, i) => {
                  const dx = Math.abs(l.x2 - l.x1) * 0.4;
                  const d = `M ${l.x1} ${l.y1} C ${l.x1 + dx} ${l.y1}, ${l.x2 - dx} ${l.y2}, ${l.x2} ${l.y2}`;
                  return <path key={i} d={d} fill="none" stroke={l.color} strokeWidth={1.5} strokeDasharray="4 2" />;
                })}
              </svg>
              <div className="grid grid-cols-4 gap-8 min-w-[1000px] relative z-10 py-4">
                {/* Columns */}
                {[
                  { cfg: columnConfig[0], items: fFunctions.map((f: any) => ({ node: { id: f.id, name: f.name, type: "function" as const, status: f.status, meta: f }, dataId: `fn-${f.id}`, subtitle: f.department })) },
                  { cfg: columnConfig[1], items: fPersonae.map((p: any) => ({ node: { id: p.id, name: p.name, type: "persona" as const, status: p.status, meta: p }, dataId: `persona-${p.id}`, subtitle: undefined })) },
                  { cfg: columnConfig[2], items: fPaths.map((p: any) => ({ node: { id: p.id, name: p.name, type: "path" as const, status: p.status, meta: p }, dataId: `path-${p.id}`, subtitle: `${(moduleCounts as any)[p.id] || 0} modules`, extra: p.difficulty ? <Badge variant="outline" className={cn("text-[9px] h-4 px-1.5", difficultyColors[p.difficulty] || "")}>{p.difficulty}</Badge> : undefined })) },
                  { cfg: columnConfig[3], items: fCampaigns.map((c: any) => ({ node: { id: c.id, name: c.name, type: "campaign" as const, status: c.status, meta: c }, dataId: `camp-${c.id}`, subtitle: c.starts_at ? new Date(c.starts_at).toLocaleDateString("fr-FR") : undefined })) },
                ].map(col => (
                  <div key={col.cfg.key} className="space-y-2">
                    <div className="flex items-center gap-2 mb-3 pb-2 border-b">
                      <div className={cn("flex h-6 w-6 items-center justify-center rounded-lg bg-gradient-to-br text-white text-[10px]", col.cfg.gradient)}>
                        <col.cfg.icon className="h-3 w-3" />
                      </div>
                      <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{col.cfg.label}</span>
                      <Badge variant="secondary" className="text-[10px] ml-auto">{col.items.length}</Badge>
                    </div>
                    {col.items.map((item: any) => (
                      <FlowNode key={item.node.id} node={item.node} dataId={item.dataId} subtitle={item.subtitle} extra={item.extra} />
                    ))}
                    {col.items.length === 0 && <p className="text-[10px] text-muted-foreground/50 text-center py-4">Aucun</p>}
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>

          {/* === MATRIX VIEW === */}
          <TabsContent value="matrix">
            <div className="overflow-x-auto">
              <table className="w-full text-xs border-collapse">
                <thead>
                  <tr>
                    <th className="p-2.5 border bg-muted/50 text-left font-semibold sticky left-0 bg-card z-10">Fonction ↓ / Persona →</th>
                    {personae.map((p: any) => (
                      <th key={p.id} className="p-2.5 border bg-muted/50 text-center font-semibold max-w-[120px]">
                        <span className="truncate block">{p.name}</span>
                      </th>
                    ))}
                    <th className="p-2.5 border bg-muted/50 text-center font-semibold text-muted-foreground">Sans persona</th>
                  </tr>
                </thead>
                <tbody>
                  {functions.map((f: any) => (
                    <tr key={f.id} className="hover:bg-muted/30">
                      <td className="p-2.5 border font-medium truncate max-w-[160px] sticky left-0 bg-card">{f.name}</td>
                      {personae.map((p: any) => {
                        const key = `${f.id}_${p.id}`;
                        const cellPaths = matrix[key] || [];
                        const intensity = Math.min(cellPaths.length * 20, 100);
                        return (
                          <td key={p.id} className="p-2 border text-center">
                            {cellPaths.length > 0 ? (
                              <div
                                className="w-8 h-8 mx-auto rounded-lg flex items-center justify-center text-xs font-bold cursor-pointer hover:scale-110 transition-transform"
                                style={{ backgroundColor: `hsl(var(--primary) / ${intensity / 500})`, color: intensity > 40 ? "hsl(var(--primary))" : undefined }}
                                title={cellPaths.map(cp => cp.name).join(", ")}
                                onClick={() => { if (cellPaths.length === 1) setSelectedNode({ id: cellPaths[0].id, name: cellPaths[0].name, type: "path", status: cellPaths[0].status, meta: cellPaths[0] }); }}
                              >
                                {cellPaths.length}
                              </div>
                            ) : (
                              <span className="text-muted-foreground/20">—</span>
                            )}
                          </td>
                        );
                      })}
                      <td className="p-2 border text-center">
                        {(() => {
                          const key = `${f.id}_none`;
                          const cellPaths = matrix[key] || [];
                          return cellPaths.length > 0 ? <Badge variant="outline" className="text-[10px]">{cellPaths.length}</Badge> : <span className="text-muted-foreground/20">—</span>;
                        })()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </TabsContent>

          {/* === LIST VIEW === */}
          <TabsContent value="list">
            <div className="space-y-4">
              {[
                { title: "Fonctions", icon: Briefcase, gradient: columnConfig[0].gradient, items: fFunctions.map((f: any) => ({ ...f, type: "function" as const })) },
                { title: "Personae", icon: UserCircle, gradient: columnConfig[1].gradient, items: fPersonae.map((p: any) => ({ ...p, type: "persona" as const })) },
                { title: "Parcours", icon: Route, gradient: columnConfig[2].gradient, items: fPaths.map((p: any) => ({ ...p, type: "path" as const })) },
                { title: "Campagnes", icon: Megaphone, gradient: columnConfig[3].gradient, items: fCampaigns.map((c: any) => ({ ...c, type: "campaign" as const })) },
              ].map(section => (
                <Card key={section.title}>
                  <CardContent className="p-0">
                    <div className="flex items-center gap-2 px-4 py-3 border-b bg-muted/30">
                      <div className={cn("flex h-6 w-6 items-center justify-center rounded-lg bg-gradient-to-br text-white", section.gradient)}>
                        <section.icon className="h-3 w-3" />
                      </div>
                      <span className="text-sm font-semibold">{section.title}</span>
                      <Badge variant="secondary" className="text-[10px]">{section.items.length}</Badge>
                    </div>
                    <div className="divide-y">
                      {section.items.map((item: any) => (
                        <div
                          key={item.id}
                          className="py-2.5 px-4 flex items-center justify-between cursor-pointer hover:bg-muted/50 transition-colors"
                          onClick={() => setSelectedNode({ id: item.id, name: item.name, type: item.type, status: item.status, meta: item })}
                        >
                          <span className="text-sm font-medium">{item.name}</span>
                          <Badge variant="outline" className={cn("text-[10px]", statusColors[item.status] || "")}>{item.status}</Badge>
                        </div>
                      ))}
                      {section.items.length === 0 && <p className="text-xs text-muted-foreground py-4 text-center">Aucun élément</p>}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>

        {/* Detail Sheet */}
        <Sheet open={!!selectedNode} onOpenChange={() => setSelectedNode(null)}>
          <SheetContent className="w-[420px] sm:w-[500px]">
            {selectedNode && (
              <>
                <SheetHeader>
                  <SheetTitle className="flex items-center gap-2">
                    {selectedNode.type === "function" && <Briefcase className="h-5 w-5 text-emerald-600" />}
                    {selectedNode.type === "persona" && <UserCircle className="h-5 w-5 text-amber-600" />}
                    {selectedNode.type === "path" && <Route className="h-5 w-5 text-violet-600" />}
                    {selectedNode.type === "campaign" && <Megaphone className="h-5 w-5 text-rose-600" />}
                    {selectedNode.name}
                  </SheetTitle>
                </SheetHeader>
                <div className="mt-4 space-y-3 text-sm">
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">Type :</span>
                    <Badge variant="outline">{selectedNode.type}</Badge>
                  </div>
                  {selectedNode.status && (
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground">Statut :</span>
                      <Badge variant="outline" className={statusColors[selectedNode.status] || ""}>{selectedNode.status}</Badge>
                    </div>
                  )}
                  {selectedNode.type === "path" && selectedNode.meta && (
                    <>
                      {selectedNode.meta.difficulty && (
                        <div className="flex items-center gap-2">
                          <span className="text-muted-foreground">Difficulté :</span>
                          <Badge variant="outline" className={difficultyColors[selectedNode.meta.difficulty] || ""}>{selectedNode.meta.difficulty}</Badge>
                        </div>
                      )}
                      <div className="flex items-center gap-2">
                        <span className="text-muted-foreground">Durée :</span>
                        <span>{selectedNode.meta.estimated_hours}h</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-muted-foreground">Modules :</span>
                        <span>{(moduleCounts as any)[selectedNode.id] || 0}</span>
                      </div>
                    </>
                  )}
                  {selectedNode.type === "function" && selectedNode.meta?.department && (
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground">Département :</span>
                      <span>{selectedNode.meta.department}</span>
                    </div>
                  )}
                  {selectedNode.type === "campaign" && selectedNode.meta && (
                    <>
                      {selectedNode.meta.starts_at && (
                        <div className="flex items-center gap-2">
                          <span className="text-muted-foreground">Début :</span>
                          <span>{new Date(selectedNode.meta.starts_at).toLocaleDateString("fr-FR")}</span>
                        </div>
                      )}
                      {selectedNode.meta.ends_at && (
                        <div className="flex items-center gap-2">
                          <span className="text-muted-foreground">Fin :</span>
                          <span>{new Date(selectedNode.meta.ends_at).toLocaleDateString("fr-FR")}</span>
                        </div>
                      )}
                    </>
                  )}
                  {/* Related paths */}
                  {(selectedNode.type === "function" || selectedNode.type === "persona") && (
                    <div className="pt-3 border-t">
                      <p className="text-xs font-semibold text-muted-foreground mb-2">Parcours liés</p>
                      {paths
                        .filter(p => selectedNode.type === "function" ? p.function_id === selectedNode.id : p.persona_id === selectedNode.id)
                        .map(p => (
                          <Badge key={p.id} variant="outline" className="mr-1 mb-1 text-[10px] cursor-pointer" onClick={() => setSelectedNode({ id: p.id, name: p.name, type: "path", status: p.status, meta: p })}>
                            {p.name}
                          </Badge>
                        ))
                      }
                      {paths.filter(p => selectedNode.type === "function" ? p.function_id === selectedNode.id : p.persona_id === selectedNode.id).length === 0 && (
                        <p className="text-xs text-muted-foreground">Aucun parcours</p>
                      )}
                    </div>
                  )}
                </div>
              </>
            )}
          </SheetContent>
        </Sheet>
      </div>
    
  );
}
