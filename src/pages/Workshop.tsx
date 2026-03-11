import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Plus, LogIn, Users, Zap, ArrowRight, Crown, Clock, UserCheck, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { PageTransition } from "@/components/ui/PageTransition";
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
import { toast } from "sonner";

const statusConfig: Record<string, { label: string; className: string }> = {
  lobby: { label: "Lobby", className: "bg-blue-500/15 text-blue-400 border-blue-500/20" },
  active: { label: "En cours", className: "bg-emerald-500/15 text-emerald-400 border-emerald-500/20" },
  paused: { label: "Pause", className: "bg-amber-500/15 text-amber-400 border-amber-500/20" },
  completed: { label: "Terminé", className: "bg-muted text-muted-foreground border-border" },
};

export default function Workshop() {
  const { user } = useAuth();
  const { activeOrgId } = useActiveOrg();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [createOpen, setCreateOpen] = useState(false);
  const [joinOpen, setJoinOpen] = useState(false);
  const [workshopName, setWorkshopName] = useState("");
  const [joinCode, setJoinCode] = useState("");
  const { create, loading: creating } = useCreateWorkshop();
  const { join, loading: joining } = useJoinWorkshop();
  const { workshops, loading: loadingList } = useMyWorkshops();
  const { balance, hasCredits } = useCredits();
  const spendCredits = useSpendCredits();
  const { canCreateWorkshop } = useQuotas();
  const { data: toolkit } = useToolkit();
  const workshopCost = toolkit?.credit_cost_workshop ?? 0;

  // Handle ?action=create from sidebar
  useEffect(() => {
    const action = searchParams.get("action");
    if (!user) return;
    if (action === "create") {
      setCreateOpen(true);
      setSearchParams({}, { replace: true });
    }
  }, [searchParams, user, setSearchParams]);

  if (!user) {
    return (
      <PageTransition>
        <div className="min-h-screen flex flex-col items-center justify-center px-5 gap-6">
          <div className="text-center">
            <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h1 className="font-display font-black text-2xl uppercase tracking-tight mb-2">Workshop</h1>
            <p className="text-sm text-muted-foreground">Connectez-vous pour créer ou rejoindre un workshop.</p>
          </div>
          <Button onClick={() => navigate("/auth")} className="font-bold uppercase tracking-wider">
            Se connecter
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </div>
      </PageTransition>
    );
  }

  return (
    <PageTransition>
      <div className="min-h-screen px-5 pt-8 pb-24 max-w-3xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="inline-flex items-center gap-2 mb-4">
            <div className="h-2 w-2 rounded-full bg-accent animate-pulse" />
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">
              Mode Collaboratif
            </span>
          </div>
          <h1 className="font-display font-black text-3xl uppercase tracking-tight leading-none">
            Workshop
          </h1>
          <p className="text-sm text-muted-foreground mt-2">
            Animez un atelier stratégique en temps réel avec votre équipe.
          </p>
        </motion.div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-2 gap-3 mb-8"
        >
          <button
            onClick={() => setCreateOpen(true)}
            className="group relative rounded-2xl border border-border/50 bg-card/50 backdrop-blur-sm p-5 text-left hover:border-primary/30 hover:bg-card transition-all"
          >
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="relative">
              <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center mb-3">
                <Plus className="h-5 w-5 text-primary" />
              </div>
              <div className="font-display font-black text-sm uppercase tracking-tight">Créer</div>
              <div className="text-[10px] text-muted-foreground mt-0.5">Nouveau workshop</div>
            </div>
          </button>

          <button
            onClick={() => setJoinOpen(true)}
            className="group relative rounded-2xl border border-border/50 bg-card/50 backdrop-blur-sm p-5 text-left hover:border-accent/30 hover:bg-card transition-all"
          >
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-accent/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="relative">
              <div className="h-10 w-10 rounded-xl bg-accent/10 flex items-center justify-center mb-3">
                <LogIn className="h-5 w-5 text-accent" />
              </div>
              <div className="font-display font-black text-sm uppercase tracking-tight">Rejoindre</div>
              <div className="text-[10px] text-muted-foreground mt-0.5">Code à 6 caractères</div>
            </div>
          </button>

        </motion.div>

        {/* My Workshops */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <h2 className="font-display font-bold text-xs uppercase tracking-widest text-muted-foreground mb-4">
            Mes workshops
          </h2>

          {loadingList ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-20 rounded-2xl bg-secondary/50 animate-pulse" />
              ))}
            </div>
          ) : workshops.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border p-10 text-center">
              <Users className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-sm font-medium text-muted-foreground">Aucun workshop pour le moment</p>
              <p className="text-xs text-muted-foreground/60 mt-1">Créez ou rejoignez votre premier atelier</p>
            </div>
          ) : (
            <div className="space-y-2">
              {workshops.map((w, i) => {
                const sc = statusConfig[w.status] || statusConfig.lobby;
                return (
                  <motion.button
                    key={w.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.05 * i }}
                    onClick={() => navigate(`/workshop/${w.id}`)}
                    className="w-full text-left group rounded-2xl border border-border/50 bg-card/50 backdrop-blur-sm p-4 hover:border-primary/20 hover:bg-card transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-display font-bold text-sm truncate">{w.name}</span>
                          <Badge variant="outline" className={`text-[10px] px-1.5 py-0 shrink-0 ${sc.className}`}>
                            {sc.label}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
                          <span className="font-mono tracking-wider">{w.code}</span>
                          <span className="flex items-center gap-1">
                            {w.role === "host" ? <Crown className="h-3 w-3" /> : <UserCheck className="h-3 w-3" />}
                            {w.role === "host" ? "Animateur" : "Participant"}
                          </span>
                          <span className="flex items-center gap-1">
                            <Users className="h-3 w-3" />
                            {w.participant_count}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {formatDistanceToNow(new Date(w.created_at), { addSuffix: true, locale: fr })}
                          </span>
                        </div>
                      </div>
                      <ArrowRight className="h-4 w-4 text-muted-foreground/40 group-hover:text-foreground group-hover:translate-x-0.5 transition-all shrink-0" />
                    </div>
                  </motion.button>
                );
              })}
            </div>
          )}
        </motion.div>

        {/* Create Dialog */}
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogContent className="rounded-2xl border-border/50 bg-card backdrop-blur-xl">
            <DialogHeader>
              <DialogTitle className="font-display font-black uppercase tracking-tight">Créer un workshop</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-2">
              <div>
                <label className="font-display font-bold text-xs uppercase tracking-widest text-muted-foreground mb-2 block">
                  Nom du workshop
                </label>
                <Input
                  value={workshopName}
                  onChange={(e) => setWorkshopName(e.target.value)}
                  placeholder="Ex: Stratégie Q1 2026"
                  className="rounded-xl bg-secondary border-border"
                  autoFocus
                />
              </div>
              {workshopCost > 0 && (
                <div className={`flex items-center gap-2 rounded-xl px-3 py-2 text-xs ${hasCredits(workshopCost) ? "bg-secondary border border-border text-muted-foreground" : "bg-destructive/10 border border-destructive/20 text-destructive"}`}>
                  <Zap className="h-3.5 w-3.5" />
                  <span>{workshopCost} crédit{workshopCost > 1 ? "s" : ""} requis (solde: {balance})</span>
                </div>
              )}
              {!canCreateWorkshop && (
                <div className="flex items-center gap-2 rounded-xl bg-destructive/10 border border-destructive/20 px-3 py-2 text-xs text-destructive">
                  <AlertCircle className="h-3.5 w-3.5" />
                  <span>Quota de workshops atteint pour votre abonnement</span>
                </div>
              )}
              <Button
                onClick={async () => {
                  if (workshopCost > 0) {
                    try {
                      await spendCredits.mutateAsync({ amount: workshopCost, description: "Création workshop" });
                    } catch {
                      return;
                    }
                  }
                  create(workshopName, {}, activeOrgId);
                  setCreateOpen(false);
                }}
                disabled={!workshopName.trim() || creating || (workshopCost > 0 && !hasCredits(workshopCost)) || !canCreateWorkshop}
                className="w-full font-black uppercase tracking-wider rounded-xl h-11"
              >
                {creating ? "Création..." : "Lancer le workshop"}
                <Zap className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Join Dialog */}
        <Dialog open={joinOpen} onOpenChange={setJoinOpen}>
          <DialogContent className="rounded-2xl border-border/50 bg-card backdrop-blur-xl">
            <DialogHeader>
              <DialogTitle className="font-display font-black uppercase tracking-tight">Rejoindre un workshop</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-2">
              <div>
                <label className="font-display font-bold text-xs uppercase tracking-widest text-muted-foreground mb-2 block">
                  Code de la room
                </label>
                <Input
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                  placeholder="EX: A3K7M2"
                  maxLength={6}
                  className="rounded-xl bg-secondary border-border text-2xl text-center font-display font-black tracking-[0.3em] uppercase h-14"
                  autoFocus
                />
              </div>
              <Button
                onClick={() => { join(joinCode); setJoinOpen(false); }}
                disabled={joinCode.length !== 6 || joining}
                className="w-full font-black uppercase tracking-wider rounded-xl h-11"
              >
                {joining ? "Connexion..." : "Rejoindre"}
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </DialogContent>
        </Dialog>

      </div>
    </PageTransition>
  );
}
