import { AdminShell } from "@/components/admin/AdminShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Map, Briefcase, UserCircle, Route, Megaphone, ArrowRight, Layers, Table2, LayoutGrid } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import { useState, useMemo, useRef, useEffect } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";

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

export default function AdminAcademyMap() {
  const [selectedNode, setSelectedNode] = useState<NodeData | null>(null);
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

  // Build matrix data
  const matrix = useMemo(() => {
    const cells: Record<string, typeof paths> = {};
    paths.forEach(p => {
      const key = `${p.function_id || "none"}_${p.persona_id || "none"}`;
      if (!cells[key]) cells[key] = [];
      cells[key].push(p);
    });
    return cells;
  }, [paths]);

  // Compute SVG lines after render
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!containerRef.current) return;
      const container = containerRef.current;
      const rect = container.getBoundingClientRect();
      const newLines: typeof lines = [];

      paths.forEach(p => {
        const pathEl = container.querySelector(`[data-node-id="path-${p.id}"]`);
        if (!pathEl) return;
        const pathRect = pathEl.getBoundingClientRect();
        const px = pathRect.left - rect.left + pathRect.width / 2;
        const py = pathRect.top - rect.top + pathRect.height / 2;

        if (p.function_id) {
          const fnEl = container.querySelector(`[data-node-id="fn-${p.function_id}"]`);
          if (fnEl) {
            const fnRect = fnEl.getBoundingClientRect();
            newLines.push({
              x1: fnRect.left - rect.left + fnRect.width,
              y1: fnRect.top - rect.top + fnRect.height / 2,
              x2: pathRect.left - rect.left,
              y2: py,
              color: "hsl(var(--primary) / 0.2)",
            });
          }
        }
        if (p.persona_id) {
          const pEl = container.querySelector(`[data-node-id="persona-${p.persona_id}"]`);
          if (pEl) {
            const pRect = pEl.getBoundingClientRect();
            newLines.push({
              x1: pRect.left - rect.left + pRect.width,
              y1: pRect.top - rect.top + pRect.height / 2,
              x2: pathRect.left - rect.left,
              y2: py,
              color: "hsl(var(--primary) / 0.15)",
            });
          }
        }
      });

      campaigns.forEach(c => {
        const cEl = container.querySelector(`[data-node-id="camp-${c.id}"]`);
        const pEl = container.querySelector(`[data-node-id="path-${c.path_id}"]`);
        if (cEl && pEl) {
          const cRect = cEl.getBoundingClientRect();
          const pRect = pEl.getBoundingClientRect();
          newLines.push({
            x1: pRect.left - rect.left + pRect.width,
            y1: pRect.top - rect.top + pRect.height / 2,
            x2: cRect.left - rect.left,
            y2: cRect.top - rect.top + cRect.height / 2,
            color: "hsl(var(--primary) / 0.15)",
          });
        }
      });

      setLines(newLines);
    }, 300);
    return () => clearTimeout(timer);
  }, [functions, personae, paths, campaigns]);

  const NodeCard = ({ node, dataId }: { node: NodeData; dataId: string }) => (
    <div
      data-node-id={dataId}
      onClick={() => setSelectedNode(node)}
      className="p-3 rounded-lg border bg-card hover:shadow-md hover:border-primary/30 cursor-pointer transition-all text-left w-full"
    >
      <p className="text-xs font-semibold truncate">{node.name}</p>
      {node.status && (
        <Badge variant="outline" className={cn("text-[10px] mt-1", statusColors[node.status] || "")}>
          {node.status}
        </Badge>
      )}
    </div>
  );

  return (
    <AdminShell>
      <div className="p-6 space-y-4">
        <div className="flex items-center gap-3">
          <Map className="h-6 w-6 text-primary" />
          <h1 className="text-xl font-display font-bold">Cartographie Academy</h1>
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
                {lines.map((l, i) => (
                  <line key={i} x1={l.x1} y1={l.y1} x2={l.x2} y2={l.y2} stroke={l.color} strokeWidth={2} />
                ))}
              </svg>
              <div className="grid grid-cols-4 gap-6 min-w-[900px] relative z-10 py-4">
                {/* Column: Functions */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2 mb-3">
                    <Briefcase className="h-4 w-4 text-muted-foreground" />
                    <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Fonctions</span>
                    <Badge variant="secondary" className="text-[10px]">{functions.length}</Badge>
                  </div>
                  {functions.map((f: any) => (
                    <NodeCard key={f.id} dataId={`fn-${f.id}`} node={{ id: f.id, name: f.name, type: "function", status: f.status, meta: f }} />
                  ))}
                </div>

                {/* Column: Personae */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2 mb-3">
                    <UserCircle className="h-4 w-4 text-muted-foreground" />
                    <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Personae</span>
                    <Badge variant="secondary" className="text-[10px]">{personae.length}</Badge>
                  </div>
                  {personae.map(p => (
                    <NodeCard key={p.id} dataId={`persona-${p.id}`} node={{ id: p.id, name: p.name, type: "persona", status: p.status, meta: p }} />
                  ))}
                </div>

                {/* Column: Paths */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2 mb-3">
                    <Route className="h-4 w-4 text-muted-foreground" />
                    <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Parcours</span>
                    <Badge variant="secondary" className="text-[10px]">{paths.length}</Badge>
                  </div>
                  {paths.map(p => (
                    <NodeCard key={p.id} dataId={`path-${p.id}`} node={{ id: p.id, name: p.name, type: "path", status: p.status, meta: p }} />
                  ))}
                </div>

                {/* Column: Campaigns */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2 mb-3">
                    <Megaphone className="h-4 w-4 text-muted-foreground" />
                    <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Campagnes</span>
                    <Badge variant="secondary" className="text-[10px]">{campaigns.length}</Badge>
                  </div>
                  {campaigns.map(c => (
                    <NodeCard key={c.id} dataId={`camp-${c.id}`} node={{ id: c.id, name: c.name, type: "campaign", status: c.status, meta: c }} />
                  ))}
                </div>
              </div>
            </div>
          </TabsContent>

          {/* === MATRIX VIEW === */}
          <TabsContent value="matrix">
            <div className="overflow-x-auto">
              <table className="w-full text-xs border-collapse">
                <thead>
                  <tr>
                    <th className="p-2 border bg-muted text-left font-semibold">Fonction ↓ / Persona →</th>
                    {personae.map(p => (
                      <th key={p.id} className="p-2 border bg-muted text-center font-semibold max-w-[120px] truncate">{p.name}</th>
                    ))}
                    <th className="p-2 border bg-muted text-center font-semibold text-muted-foreground">Sans persona</th>
                  </tr>
                </thead>
                <tbody>
                  {functions.map((f: any) => (
                    <tr key={f.id}>
                      <td className="p-2 border font-medium truncate max-w-[160px]">{f.name}</td>
                      {personae.map(p => {
                        const key = `${f.id}_${p.id}`;
                        const cellPaths = matrix[key] || [];
                        return (
                          <td key={p.id} className={cn("p-2 border text-center", cellPaths.length > 0 ? "bg-primary/5" : "")}>
                            {cellPaths.length > 0 ? (
                              <div className="space-y-1">
                                {cellPaths.map(cp => (
                                  <Badge key={cp.id} variant="outline" className="text-[10px] cursor-pointer" onClick={() => setSelectedNode({ id: cp.id, name: cp.name, type: "path", status: cp.status, meta: cp })}>
                                    {cp.name.slice(0, 20)}
                                  </Badge>
                                ))}
                              </div>
                            ) : (
                              <span className="text-muted-foreground/30">—</span>
                            )}
                          </td>
                        );
                      })}
                      <td className="p-2 border text-center">
                        {(() => {
                          const key = `${f.id}_none`;
                          const cellPaths = matrix[key] || [];
                          return cellPaths.length > 0 ? cellPaths.length : <span className="text-muted-foreground/30">—</span>;
                        })()}
                      </td>
                    </tr>
                  ))}
                  <tr>
                    <td className="p-2 border font-medium text-muted-foreground">Sans fonction</td>
                    {personae.map(p => {
                      const key = `none_${p.id}`;
                      const cellPaths = matrix[key] || [];
                      return (
                        <td key={p.id} className="p-2 border text-center">
                          {cellPaths.length > 0 ? cellPaths.length : <span className="text-muted-foreground/30">—</span>}
                        </td>
                      );
                    })}
                    <td className="p-2 border text-center text-muted-foreground/30">—</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </TabsContent>

          {/* === LIST VIEW === */}
          <TabsContent value="list">
            <div className="space-y-4">
              {[
                { title: "Fonctions", icon: Briefcase, items: functions.map((f: any) => ({ ...f, type: "function" as const })) },
                { title: "Personae", icon: UserCircle, items: personae.map(p => ({ ...p, type: "persona" as const })) },
                { title: "Parcours", icon: Route, items: paths.map(p => ({ ...p, type: "path" as const })) },
                { title: "Campagnes", icon: Megaphone, items: campaigns.map(c => ({ ...c, type: "campaign" as const })) },
              ].map(section => (
                <Card key={section.title}>
                  <CardHeader className="py-3 px-4">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <section.icon className="h-4 w-4" />
                      {section.title}
                      <Badge variant="secondary" className="text-[10px]">{section.items.length}</Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="px-4 pb-3">
                    <div className="divide-y">
                      {section.items.map((item: any) => (
                        <div
                          key={item.id}
                          className="py-2 flex items-center justify-between cursor-pointer hover:bg-muted/50 rounded px-2 -mx-2"
                          onClick={() => setSelectedNode({ id: item.id, name: item.name, type: item.type, status: item.status, meta: item })}
                        >
                          <span className="text-sm font-medium">{item.name}</span>
                          <Badge variant="outline" className={cn("text-[10px]", statusColors[item.status] || "")}>{item.status}</Badge>
                        </div>
                      ))}
                      {section.items.length === 0 && <p className="text-xs text-muted-foreground py-2">Aucun élément</p>}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>

        {/* Detail Sheet */}
        <Sheet open={!!selectedNode} onOpenChange={() => setSelectedNode(null)}>
          <SheetContent className="w-[400px] sm:w-[500px]">
            {selectedNode && (
              <>
                <SheetHeader>
                  <SheetTitle className="flex items-center gap-2">
                    {selectedNode.type === "function" && <Briefcase className="h-5 w-5" />}
                    {selectedNode.type === "persona" && <UserCircle className="h-5 w-5" />}
                    {selectedNode.type === "path" && <Route className="h-5 w-5" />}
                    {selectedNode.type === "campaign" && <Megaphone className="h-5 w-5" />}
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
                      <div className="flex items-center gap-2">
                        <span className="text-muted-foreground">Difficulté :</span>
                        <Badge variant="outline" className={difficultyColors[selectedNode.meta.difficulty] || ""}>{selectedNode.meta.difficulty}</Badge>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-muted-foreground">Durée :</span>
                        <span>{selectedNode.meta.estimated_hours}h</span>
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
                  {selectedNode.type === "function" && (
                    <div className="pt-3 border-t">
                      <p className="text-xs font-semibold text-muted-foreground mb-2">Parcours liés</p>
                      {paths.filter(p => p.function_id === selectedNode.id).map(p => (
                        <Badge key={p.id} variant="outline" className="mr-1 mb-1 text-[10px]">{p.name}</Badge>
                      ))}
                      {paths.filter(p => p.function_id === selectedNode.id).length === 0 && (
                        <p className="text-xs text-muted-foreground">Aucun parcours</p>
                      )}
                    </div>
                  )}
                  {selectedNode.type === "persona" && (
                    <div className="pt-3 border-t">
                      <p className="text-xs font-semibold text-muted-foreground mb-2">Parcours liés</p>
                      {paths.filter(p => p.persona_id === selectedNode.id).map(p => (
                        <Badge key={p.id} variant="outline" className="mr-1 mb-1 text-[10px]">{p.name}</Badge>
                      ))}
                      {paths.filter(p => p.persona_id === selectedNode.id).length === 0 && (
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
    </AdminShell>
  );
}
