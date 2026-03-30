import { AdminShell } from "@/components/admin/AdminShell";
import { PageTransition } from "@/components/ui/PageTransition";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Award, BarChart3, TrendingUp, Users, Search, Download, Ban, ExternalLink, Copy, Code, Webhook, Key, BookOpen, Settings, LayoutDashboard, List, Plug } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { useState } from "react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { CertPathDetail } from "@/components/admin/CertPathDetail";

const VERIFY_BASE = "https://think-align-grow.lovable.app/verify";
const API_BASE = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/verify-certificate`;

export default function AdminAcademyCertificates() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedPathId, setSelectedPathId] = useState<string | null>(null);
  const qc = useQueryClient();

  const { data: certs = [] } = useQuery({
    queryKey: ["admin-certificates"],
    queryFn: async () => {
      const { data } = await supabase
        .from("academy_certificates")
        .select("*, academy_paths(name, difficulty)")
        .order("issued_at", { ascending: false });
      return data || [];
    },
  });

  const { data: profiles = [] } = useQuery({
    queryKey: ["admin-profiles-for-certs"],
    queryFn: async () => {
      const { data } = await supabase.from("profiles").select("user_id, display_name, email");
      return data || [];
    },
  });

  const { data: paths = [] } = useQuery({
    queryKey: ["admin-paths-cert-config"],
    queryFn: async () => {
      const { data } = await supabase.from("academy_paths").select("id, name, certificate_enabled, difficulty").order("name");
      return data || [];
    },
  });

  const { data: certConfigs = [] } = useQuery({
    queryKey: ["admin-cert-configs"],
    queryFn: async () => {
      const { data } = await supabase.from("academy_certificate_config").select("*");
      return data || [];
    },
  });

  const revokeMut = useMutation({
    mutationFn: async (certId: string) => {
      const { error } = await supabase
        .from("academy_certificates")
        .update({ status: "revoked", revoked_at: new Date().toISOString(), revoked_reason: "Révoqué par l'administrateur" } as any)
        .eq("id", certId);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-certificates"] }); toast.success("Certificat révoqué"); },
  });

  const profileMap = new Map(profiles.map((p: any) => [p.user_id, p]));

  const filtered = certs.filter((c: any) => {
    const p = profileMap.get(c.user_id);
    const name = p?.display_name || "";
    const pathName = c.academy_paths?.name || "";
    const matchSearch = !search || name.toLowerCase().includes(search.toLowerCase()) || pathName.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "all" || c.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const totalCerts = certs.length;
  const activeCerts = certs.filter((c: any) => c.status === "active").length;
  const avgScore = totalCerts > 0 ? Math.round(certs.reduce((s: number, c: any) => s + ((c.certificate_data as any)?.score || 0), 0) / totalCerts) : 0;
  const thisMonth = certs.filter((c: any) => new Date(c.issued_at).getMonth() === new Date().getMonth() && new Date(c.issued_at).getFullYear() === new Date().getFullYear()).length;

  return (
    <AdminShell>
      <PageTransition>
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
              <Award className="h-8 w-8 text-amber-500" /> Pilotage des Certificats
            </h1>
            <p className="text-muted-foreground mt-1">Gestion, paramétrage et suivi des certifications</p>
          </div>

          <Tabs defaultValue="dashboard">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="dashboard" className="gap-1.5"><LayoutDashboard className="h-4 w-4" /> Dashboard</TabsTrigger>
              <TabsTrigger value="list" className="gap-1.5"><List className="h-4 w-4" /> Certificats</TabsTrigger>
              <TabsTrigger value="settings" className="gap-1.5"><Settings className="h-4 w-4" /> Paramétrage</TabsTrigger>
              <TabsTrigger value="api" className="gap-1.5"><Plug className="h-4 w-4" /> API & Intégrations</TabsTrigger>
            </TabsList>

            {/* Dashboard */}
            <TabsContent value="dashboard" className="space-y-6">
              <div className="grid grid-cols-4 gap-4">
                {[
                  { icon: Award, label: "Total certificats", value: totalCerts, color: "text-amber-500" },
                  { icon: TrendingUp, label: "Ce mois", value: thisMonth, color: "text-emerald-500" },
                  { icon: BarChart3, label: "Score moyen", value: `${avgScore}%`, color: "text-primary" },
                  { icon: Users, label: "Actifs", value: activeCerts, color: "text-blue-500" },
                ].map((kpi, i) => (
                  <Card key={i}>
                    <CardContent className="p-6">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center">
                          <kpi.icon className={cn("h-5 w-5", kpi.color)} />
                        </div>
                        <div>
                          <p className="text-2xl font-bold">{kpi.value}</p>
                          <p className="text-xs text-muted-foreground">{kpi.label}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <Card>
                <CardHeader><CardTitle className="text-base">Derniers certificats émis</CardTitle></CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {certs.slice(0, 5).map((c: any) => {
                      const p = profileMap.get(c.user_id);
                      return (
                        <div key={c.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border border-border/50">
                          <div>
                            <p className="text-sm font-medium">{p?.display_name || "Inconnu"}</p>
                            <p className="text-xs text-muted-foreground">{c.academy_paths?.name}</p>
                          </div>
                          <div className="flex items-center gap-3">
                            <Badge variant={c.status === "active" ? "default" : "destructive"} className="text-xs">
                              {c.status === "active" ? "Actif" : "Révoqué"}
                            </Badge>
                            <span className="text-xs text-muted-foreground">{format(new Date(c.issued_at), "d MMM yyyy", { locale: fr })}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* List */}
            <TabsContent value="list" className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input placeholder="Rechercher par nom ou parcours..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
                </div>
                <Button variant={statusFilter === "all" ? "default" : "outline"} size="sm" onClick={() => setStatusFilter("all")}>Tous</Button>
                <Button variant={statusFilter === "active" ? "default" : "outline"} size="sm" onClick={() => setStatusFilter("active")}>Actifs</Button>
                <Button variant={statusFilter === "revoked" ? "default" : "outline"} size="sm" onClick={() => setStatusFilter("revoked")}>Révoqués</Button>
              </div>

              <Card>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Apprenant</TableHead>
                      <TableHead>Parcours</TableHead>
                      <TableHead>Score</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Statut</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.map((c: any) => {
                      const p = profileMap.get(c.user_id);
                      const certData = c.certificate_data as any || {};
                      return (
                        <TableRow key={c.id}>
                          <TableCell className="font-medium">{p?.display_name || "Inconnu"}</TableCell>
                          <TableCell>{c.academy_paths?.name || "—"}</TableCell>
                          <TableCell><span className="font-bold">{certData.score || 0}%</span></TableCell>
                          <TableCell className="text-sm">{format(new Date(c.issued_at), "d MMM yyyy", { locale: fr })}</TableCell>
                          <TableCell>
                            <Badge variant={c.status === "active" ? "default" : "destructive"} className="text-xs">
                              {c.status === "active" ? "Actif" : "Révoqué"}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-1">
                              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => window.open(`${VERIFY_BASE}/${c.id}`, "_blank")}>
                                <ExternalLink className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { navigator.clipboard.writeText(`${VERIFY_BASE}/${c.id}`); toast.success("Lien copié"); }}>
                                <Copy className="h-4 w-4" />
                              </Button>
                              {c.status === "active" && (
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => revokeMut.mutate(c.id)}>
                                  <Ban className="h-4 w-4" />
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                    {filtered.length === 0 && (
                      <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Aucun certificat trouvé</TableCell></TableRow>
                    )}
                  </TableBody>
                </Table>
              </Card>
            </TabsContent>

            {/* Settings */}
            <TabsContent value="settings" className="space-y-4">
              {selectedPathId ? (
                <CertPathDetail
                  pathId={selectedPathId}
                  paths={paths}
                  certConfigs={certConfigs}
                  profiles={profiles}
                  onBack={() => setSelectedPathId(null)}
                />
              ) : (
                <Card>
                  <CardHeader><CardTitle className="text-base flex items-center gap-2"><BookOpen className="h-4 w-4" /> Certification par parcours</CardTitle></CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {paths.map((p: any) => {
                        const config = certConfigs.find((c: any) => c.path_id === p.id);
                        const pathCertCount = certs.filter((c: any) => c.path_id === p.id && c.status === "active").length;
                        return (
                          <div
                            key={p.id}
                            onClick={() => setSelectedPathId(p.id)}
                            className="flex items-center justify-between p-4 rounded-lg border border-border/50 bg-muted/20 cursor-pointer hover:bg-muted/40 hover:border-primary/30 transition-colors"
                          >
                            <div className="flex-1">
                              <p className="text-sm font-medium">{p.name}</p>
                              <p className="text-xs text-muted-foreground capitalize">{p.difficulty || "Intermédiaire"}</p>
                            </div>
                            <div className="flex items-center gap-4">
                              <div className="text-xs text-muted-foreground">
                                <span className="font-bold text-foreground">{pathCertCount}</span> certifié{pathCertCount > 1 ? "s" : ""}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                Score min: <span className="font-bold text-foreground">{config?.min_score || 70}%</span>
                              </div>
                              <Badge variant={p.certificate_enabled ? "default" : "outline"} className="text-xs">
                                {p.certificate_enabled ? "Certifiant" : "Non certifiant"}
                              </Badge>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* API */}
            <TabsContent value="api" className="space-y-4">
              <Card>
                <CardHeader><CardTitle className="text-base flex items-center gap-2"><Code className="h-4 w-4" /> API de vérification</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label className="text-xs text-muted-foreground mb-1 block">Endpoint REST</Label>
                    <div className="flex items-center gap-2">
                      <code className="flex-1 text-sm bg-muted p-3 rounded-lg font-mono break-all">{API_BASE}?id=&#123;certificate_id&#125;</code>
                      <Button variant="outline" size="icon" onClick={() => { navigator.clipboard.writeText(`${API_BASE}?id={certificate_id}`); toast.success("URL copiée"); }}>
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  <div>
                    <Label className="text-xs text-muted-foreground mb-1 block">Exemple cURL</Label>
                    <pre className="text-xs bg-muted p-4 rounded-lg overflow-x-auto font-mono">
{`curl -X GET "${API_BASE}?id=YOUR_CERT_ID"

# Response:
{
  "valid": true,
  "holder_name": "Ammar Khadraoui",
  "path_name": "Process Mining IA Augmented",
  "score": 88,
  "modules_completed": 4,
  "total_time_hours": 8,
  "issued_at": "2026-03-28T10:00:00Z",
  "organization_name": "GROWTHINNOV"
}`}
                    </pre>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <Card className="border-dashed">
                      <CardContent className="p-4 text-center">
                        <Webhook className="h-6 w-6 mx-auto mb-2 text-muted-foreground" />
                        <p className="text-sm font-medium">Webhooks</p>
                        <p className="text-xs text-muted-foreground mt-1">Notifications sur émission/révocation de certificats</p>
                        <Badge variant="secondary" className="mt-2 text-xs">Bientôt disponible</Badge>
                      </CardContent>
                    </Card>
                    <Card className="border-dashed">
                      <CardContent className="p-4 text-center">
                        <Key className="h-6 w-6 mx-auto mb-2 text-muted-foreground" />
                        <p className="text-sm font-medium">Clés API Intranet</p>
                        <p className="text-xs text-muted-foreground mt-1">Authentification pour intranets clients</p>
                        <Badge variant="secondary" className="mt-2 text-xs">Bientôt disponible</Badge>
                      </CardContent>
                    </Card>
                  </div>

                  <div>
                    <Label className="text-xs text-muted-foreground mb-1 block">MCP Endpoint (Model Context Protocol)</Label>
                    <pre className="text-xs bg-muted p-4 rounded-lg overflow-x-auto font-mono">
{`// MCP Tool: verify_certificate
// Description: Vérifie l'authenticité d'un certificat GROWTHINNOV
// Input: { certificate_id: string }
// Output: { valid: boolean, holder_name: string, ... }

// Endpoint: ${API_BASE}
// Method: GET
// Auth: Public (no token required)`}
                    </pre>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </PageTransition>
    </AdminShell>
  );
}
