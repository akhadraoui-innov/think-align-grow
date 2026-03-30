import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Plus, LogIn, Users, Zap, ArrowRight, Crown, Clock, UserCheck, AlertCircle, Hash, Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useCreateWorkshop, useJoinWorkshop, useMyWorkshops } from "@/hooks/useWorkshop";
import { useActiveOrg } from "@/contexts/OrgContext";
import { useCredits } from "@/hooks/useCredits";
import { useSpendCredits } from "@/hooks/useSpendCredits";
import { useQuotas } from "@/hooks/useQuotas";
import { useToolkit } from "@/hooks/useToolkitData";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const statusConfig: Record<string, { label: string; className: string; dot: string }> = {
  lobby: { label: "Lobby", className: "bg-blue-500/15 text-blue-600 border-blue-500/20", dot: "bg-blue-500" },
  active: { label: "En cours", className: "bg-emerald-500/15 text-emerald-600 border-emerald-500/20", dot: "bg-emerald-500 animate-pulse" },
  paused: { label: "Pause", className: "bg-amber-500/15 text-amber-600 border-amber-500/20", dot: "bg-amber-500" },
  completed: { label: "Terminé", className: "bg-muted text-muted-foreground border-border", dot: "bg-muted-foreground" },
};

export default function PortalWorkshops() {
  const { user } = useAuth();
  const { activeOrgId } = useActiveOrg();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [createOpen, setCreateOpen] = useState(false);
  const [joinOpen, setJoinOpen] = useState(false);
  const [workshopName, setWorkshopName] = useState("");
  const [joinCode, setJoinCode] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const { create, loading: creating } = useCreateWorkshop();
  const { join, loading: joining } = useJoinWorkshop();
  const { workshops, loading: loadingList } = useMyWorkshops();
  const { balance, hasCredits } = useCredits();
  const spendCredits = useSpendCredits();
  const { canCreateWorkshop } = useQuotas();
  const { data: toolkit } = useToolkit();
  const workshopCost = toolkit?.credit_cost_workshop ?? 0;

  const workshopSessions = workshops.filter(w => {
    const config = w.config as any;
    return !config?.type || config.type !== "challenge";
  });

  const activeCount = workshopSessions.filter(w => w.status === "active").length;
  const totalParticipants = workshopSessions.reduce((sum, w) => sum + (w.participant_count || 0), 0);

  useEffect(() => {
    const action = searchParams.get("action");
    if (!user) return;
    if (action === "create") {
      setCreateOpen(true);
      setSearchParams({}, { replace: true });
    }
  }, [searchParams, user, setSearchParams]);

  const copyCode = (code: string, id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(code);
    setCopiedId(id);
    toast.success("Code copié !");
    setTimeout(() => setCopiedId(null), 2000);
  };

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center h-full px-8 gap-6">
        <Users className="h-16 w-16 text-muted-foreground/30" />
        <p className="text-base text-muted-foreground">Connectez-vous pour accéder aux workshops.</p>
        <Button size="lg" onClick={() => navigate("/auth")}>Se connecter</Button>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-7xl space-y-8">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-display font-bold tracking-tight text-foreground">Workshops</h1>
        <p className="text-base text-muted-foreground">Animez des ateliers stratégiques collaboratifs en temps réel</p>
      </div>

      {/* KPI widgets */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { icon: Users, label: "Total workshops", value: workshopSessions.length, color: "text-primary" },
          { icon: Zap, label: "En cours", value: activeCount, color: "text-emerald-500" },
          { icon: UserCheck, label: "Participants", value: totalParticipants, color: "text-blue-500" },
          { icon: Crown, label: "Crédits", value: balance, color: "text-amber-500" },
        ].map((kpi) => (
          <Card key={kpi.label}>
            <CardContent className="p-5 flex items-center gap-4">
              <div className={cn("h-11 w-11 rounded-xl bg-muted/50 flex items-center justify-center shrink-0")}>
                <kpi.icon className={cn("h-5 w-5", kpi.color)} />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground leading-none">{kpi.value}</p>
                <p className="text-xs text-muted-foreground mt-1">{kpi.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Action cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <button
          onClick={() => setCreateOpen(true)}
          className="group rounded-2xl border border-border/50 bg-card p-6 text-left hover:border-primary/30 hover:shadow-md transition-all"
        >
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
              <Plus className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-base font-bold text-foreground">Créer un workshop</p>
              <p className="text-sm text-muted-foreground mt-0.5">Lancez un nouvel atelier collaboratif</p>
            </div>
            <ArrowRight className="h-5 w-5 text-muted-foreground/40 group-hover:text-primary group-hover:translate-x-1 transition-all ml-auto shrink-0" />
          </div>
        </button>
        <button
          onClick={() => setJoinOpen(true)}
          className="group rounded-2xl border border-border/50 bg-card p-6 text-left hover:border-accent/30 hover:shadow-md transition-all"
        >
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-xl bg-accent/10 flex items-center justify-center shrink-0">
              <LogIn className="h-6 w-6 text-accent" />
            </div>
            <div>
              <p className="text-base font-bold text-foreground">Rejoindre un workshop</p>
              <p className="text-sm text-muted-foreground mt-0.5">Entrez un code à 6 caractères</p>
            </div>
            <ArrowRight className="h-5 w-5 text-muted-foreground/40 group-hover:text-accent group-hover:translate-x-1 transition-all ml-auto shrink-0" />
          </div>
        </button>
      </div>

      {/* Workshop list */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-foreground">Mes workshops</h2>
          <span className="text-sm text-muted-foreground">{workshopSessions.length} session{workshopSessions.length > 1 ? "s" : ""}</span>
        </div>

        {loadingList ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => <div key={i} className="h-24 rounded-2xl bg-muted/50 animate-pulse" />)}
          </div>
        ) : workshopSessions.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="p-12 text-center">
              <Users className="h-14 w-14 text-muted-foreground/20 mx-auto mb-4" />
              <p className="text-base font-medium text-muted-foreground">Aucun workshop</p>
              <p className="text-sm text-muted-foreground mt-1">Créez ou rejoignez un workshop pour commencer</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {workshopSessions.map((w, i) => {
              const sc = statusConfig[w.status] || statusConfig.lobby;
              return (
                <motion.div
                  key={w.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.04 * i }}
                >
                  <Card
                    className="cursor-pointer hover:shadow-md hover:border-primary/20 transition-all group"
                    onClick={() => navigate(`/portal/workshops/${w.id}`)}
                  >
                    <CardContent className="p-5">
                      <div className="flex items-center gap-4">
                        {/* Status dot + icon */}
                        <div className="relative h-12 w-12 rounded-xl bg-muted/50 flex items-center justify-center shrink-0">
                          <Users className="h-5 w-5 text-muted-foreground" />
                          <div className={cn("absolute -top-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-card", sc.dot)} />
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1.5">
                            <span className="text-base font-bold text-foreground truncate group-hover:text-primary transition-colors">
                              {w.name}
                            </span>
                            <Badge variant="outline" className={cn("text-xs px-2 py-0.5 shrink-0", sc.className)}>
                              {sc.label}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            {/* Code */}
                            <button
                              onClick={(e) => copyCode(w.code, w.id, e)}
                              className="flex items-center gap-1.5 font-mono tracking-widest hover:text-foreground transition-colors"
                            >
                              <Hash className="h-3.5 w-3.5" />
                              {w.code}
                              {copiedId === w.id ? (
                                <Check className="h-3.5 w-3.5 text-emerald-500" />
                              ) : (
                                <Copy className="h-3.5 w-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                              )}
                            </button>
                            {/* Role */}
                            <span className="flex items-center gap-1.5">
                              {w.role === "host" ? <Crown className="h-3.5 w-3.5 text-amber-500" /> : <UserCheck className="h-3.5 w-3.5" />}
                              {w.role === "host" ? "Animateur" : "Participant"}
                            </span>
                            {/* Participants */}
                            <span className="flex items-center gap-1.5">
                              <Users className="h-3.5 w-3.5" />
                              {w.participant_count} participant{w.participant_count > 1 ? "s" : ""}
                            </span>
                            {/* Time */}
                            <span className="flex items-center gap-1.5">
                              <Clock className="h-3.5 w-3.5" />
                              {formatDistanceToNow(new Date(w.created_at), { addSuffix: true, locale: fr })}
                            </span>
                          </div>
                        </div>

                        <ArrowRight className="h-5 w-5 text-muted-foreground/30 group-hover:text-primary group-hover:translate-x-1 transition-all shrink-0" />
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        )}
      </section>

      {/* Create Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="rounded-2xl max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">Créer un workshop</DialogTitle>
          </DialogHeader>
          <div className="space-y-5 pt-2">
            <div>
              <label className="text-sm font-semibold text-muted-foreground mb-2 block">Nom du workshop</label>
              <Input
                value={workshopName}
                onChange={e => setWorkshopName(e.target.value)}
                placeholder="Ex: Stratégie Q1 2026"
                className="h-12 text-base"
                autoFocus
              />
            </div>
            {workshopCost > 0 && (
              <div className={cn(
                "flex items-center gap-3 rounded-xl px-4 py-3 text-sm",
                hasCredits(workshopCost)
                  ? "bg-muted/50 border border-border text-muted-foreground"
                  : "bg-destructive/10 border border-destructive/20 text-destructive"
              )}>
                <Zap className="h-4 w-4" />
                <span>{workshopCost} crédit{workshopCost > 1 ? "s" : ""} · Solde: {balance}</span>
              </div>
            )}
            {!canCreateWorkshop && (
              <div className="flex items-center gap-3 rounded-xl bg-destructive/10 border border-destructive/20 px-4 py-3 text-sm text-destructive">
                <AlertCircle className="h-4 w-4" />
                <span>Quota de workshops atteint</span>
              </div>
            )}
            <Button
              onClick={async () => {
                if (workshopCost > 0) {
                  try { await spendCredits.mutateAsync({ amount: workshopCost, description: "Création workshop" }); } catch { return; }
                }
                create(workshopName, {}, activeOrgId);
                setCreateOpen(false);
              }}
              disabled={!workshopName.trim() || creating || (workshopCost > 0 && !hasCredits(workshopCost)) || !canCreateWorkshop}
              className="w-full h-12 text-base font-bold rounded-xl"
            >
              {creating ? "Création..." : "Lancer le workshop"}
              <Zap className="h-5 w-5 ml-2" />
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Join Dialog */}
      <Dialog open={joinOpen} onOpenChange={setJoinOpen}>
        <DialogContent className="rounded-2xl max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">Rejoindre un workshop</DialogTitle>
          </DialogHeader>
          <div className="space-y-5 pt-2">
            <Input
              value={joinCode}
              onChange={e => setJoinCode(e.target.value.toUpperCase())}
              placeholder="A3K7M2"
              maxLength={6}
              className="text-3xl text-center font-mono font-bold tracking-[0.3em] uppercase h-16"
              autoFocus
            />
            <Button
              onClick={() => { join(joinCode); setJoinOpen(false); }}
              disabled={joinCode.length !== 6 || joining}
              className="w-full h-12 text-base font-bold rounded-xl"
            >
              {joining ? "Connexion..." : "Rejoindre"}
              <ArrowRight className="h-5 w-5 ml-2" />
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
