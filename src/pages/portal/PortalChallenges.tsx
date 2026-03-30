// Portal version of Challenge — portal navigation
import { useState } from "react";
import { motion } from "framer-motion";
import { Plus, LogIn, Users, Zap, ArrowRight, Crown, Clock, UserCheck, LayoutGrid, AlertCircle, Search, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { PageTransition } from "@/components/ui/PageTransition";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { useCreateWorkshop, useJoinWorkshop, useMyWorkshops } from "@/hooks/useWorkshop";
import { useOrgChallengeTemplates, useChallengeTemplates } from "@/hooks/useChallengeData";
import { useToolkit } from "@/hooks/useToolkitData";
import { useCredits } from "@/hooks/useCredits";
import { useSpendCredits } from "@/hooks/useSpendCredits";
import { useQuotas } from "@/hooks/useQuotas";
import { useActiveOrg } from "@/contexts/OrgContext";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";

const statusConfig: Record<string, { label: string; className: string }> = { lobby: { label: "Lobby", className: "bg-blue-500/15 text-blue-400 border-blue-500/20" }, active: { label: "En cours", className: "bg-emerald-500/15 text-emerald-400 border-emerald-500/20" }, paused: { label: "Pause", className: "bg-amber-500/15 text-amber-400 border-amber-500/20" }, completed: { label: "Terminé", className: "bg-muted text-muted-foreground border-border" } };

export default function PortalChallenges() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { activeOrgId, activeOrg, loading: orgLoading } = useActiveOrg();
  const [createOpen, setCreateOpen] = useState(false);
  const [joinOpen, setJoinOpen] = useState(false);
  const [joinCode, setJoinCode] = useState("");
  const [search, setSearch] = useState("");
  const { create, loading: creating } = useCreateWorkshop();
  const { join, loading: joining } = useJoinWorkshop();
  const { workshops, loading: loadingList } = useMyWorkshops();
  const { data: toolkit } = useToolkit();
  const { data: orgTemplates, isLoading: orgTemplatesLoading } = useOrgChallengeTemplates(activeOrgId);
  const { data: allTemplates, isLoading: allTemplatesLoading } = useChallengeTemplates();
  const isContextReady = !authLoading && !orgLoading;
  const challengeTemplates = isContextReady && activeOrgId ? orgTemplates : isContextReady ? allTemplates : undefined;
  const templatesLoading = activeOrgId ? orgTemplatesLoading : allTemplatesLoading;
  const { balance, hasCredits } = useCredits();
  const spendCredits = useSpendCredits();
  const { canCreateChallenge } = useQuotas();
  const challengeCost = toolkit?.credit_cost_challenge ?? 0;

  const filteredTemplates = (challengeTemplates || []).filter(t => { if (!search) return true; const q = search.toLowerCase(); return t.name.toLowerCase().includes(q) || t.description?.toLowerCase().includes(q); });
  const challengeWorkshops = workshops.filter(w => { const config = w.config as any; return config?.type === "challenge"; });

  const launchTemplate = async (template: any) => {
    if (challengeCost > 0) { try { await spendCredits.mutateAsync({ amount: challengeCost, description: `Challenge – ${template.name}` }); } catch { return; } }
    await create(template.name, { type: "challenge", template_id: template.id }, activeOrgId);
    setCreateOpen(false); setSearch("");
  };

  if (authLoading || orgLoading) return <PageTransition><div className="min-h-screen flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div></PageTransition>;
  if (!user) return <PageTransition><div className="min-h-screen flex flex-col items-center justify-center px-5 gap-6"><LayoutGrid className="h-12 w-12 text-muted-foreground mx-auto mb-4" /><Button onClick={() => navigate("/auth")}>Se connecter</Button></div></PageTransition>;

  return (
    <PageTransition>
      <div className="min-h-screen px-5 pt-8 pb-24 max-w-3xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <div className="inline-flex items-center gap-2 mb-4"><div className="h-2 w-2 rounded-full bg-pillar-finance animate-pulse" /><span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Diagnostic Stratégique</span></div>
          <h1 className="font-display font-black text-3xl uppercase tracking-tight leading-none">Challenge</h1>
          <p className="text-sm text-muted-foreground mt-2">Diagnostiquez et priorisez vos enjeux stratégiques.</p>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="grid grid-cols-2 gap-3 mb-6">
          <button onClick={() => setCreateOpen(true)} className="group relative rounded-2xl border border-border/50 bg-card/50 p-5 text-left hover:border-pillar-finance/30 hover:bg-card transition-all">
            <div className="h-10 w-10 rounded-xl bg-pillar-finance/10 flex items-center justify-center mb-3"><Plus className="h-5 w-5 text-pillar-finance" /></div>
            <div className="font-display font-black text-sm uppercase tracking-tight">Nouveau</div>
            <div className="text-[10px] text-muted-foreground mt-0.5">Lancer un challenge</div>
          </button>
          <button onClick={() => setJoinOpen(true)} className="group relative rounded-2xl border border-border/50 bg-card/50 p-5 text-left hover:border-accent/30 hover:bg-card transition-all">
            <div className="h-10 w-10 rounded-xl bg-accent/10 flex items-center justify-center mb-3"><LogIn className="h-5 w-5 text-accent" /></div>
            <div className="font-display font-black text-sm uppercase tracking-tight">Rejoindre</div>
            <div className="text-[10px] text-muted-foreground mt-0.5">Code à 6 caractères</div>
          </button>
        </motion.div>

        {/* Templates */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.15 }} className="mb-8">
          <div className="flex items-center justify-between gap-3 mb-4"><h2 className="font-display font-bold text-xs uppercase tracking-widest text-muted-foreground">Challenges disponibles</h2>{activeOrg && <Badge variant="outline">{activeOrg.org_name}</Badge>}</div>
          {templatesLoading ? <div className="rounded-2xl border bg-card/40 p-6 flex items-center justify-center gap-3 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" />Chargement…</div>
          : filteredTemplates.length === 0 ? <div className="rounded-2xl border border-dashed border-border p-8 text-center"><LayoutGrid className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" /><p className="text-sm font-medium text-muted-foreground">Aucun challenge disponible</p></div>
          : <div className="space-y-2">{filteredTemplates.map(t => <button key={t.id} onClick={() => launchTemplate(t)} className="w-full text-left rounded-2xl border border-border/50 bg-card/50 p-4 hover:border-pillar-finance/30 hover:bg-card transition-all"><div className="flex items-start gap-3"><div className="h-10 w-10 rounded-xl bg-pillar-finance/10 flex items-center justify-center shrink-0"><LayoutGrid className="h-5 w-5 text-pillar-finance" /></div><div className="min-w-0 flex-1"><div className="flex items-center gap-2 flex-wrap"><div className="font-display font-bold text-sm">{t.name}</div>{t.difficulty && <Badge variant="outline">{t.difficulty}</Badge>}</div>{t.description && <div className="text-[11px] text-muted-foreground mt-1 line-clamp-2">{t.description}</div>}</div><ArrowRight className="h-4 w-4 text-muted-foreground/40 shrink-0" /></div></button>)}</div>}
        </motion.div>

        {/* My challenges */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
          <h2 className="font-display font-bold text-xs uppercase tracking-widest text-muted-foreground mb-4">Mes challenges</h2>
          {loadingList ? <div className="space-y-3">{[1,2].map(i => <div key={i} className="h-20 rounded-2xl bg-secondary/50 animate-pulse" />)}</div>
          : challengeWorkshops.length === 0 ? <div className="rounded-2xl border border-dashed border-border p-10 text-center"><LayoutGrid className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" /><p className="text-sm font-medium text-muted-foreground">Aucun challenge</p></div>
          : <div className="space-y-2">{challengeWorkshops.map((w, i) => { const sc = statusConfig[w.status] || statusConfig.lobby; return (
            <motion.button key={w.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05*i }} onClick={() => navigate(`/portal/challenges/${w.id}`)} className="w-full text-left group rounded-2xl border border-border/50 bg-card/50 p-4 hover:border-pillar-finance/20 hover:bg-card transition-all">
              <div className="flex items-center gap-3"><div className="flex-1 min-w-0"><div className="flex items-center gap-2 mb-1"><span className="font-display font-bold text-sm truncate">{w.name}</span><Badge variant="outline" className={`text-[10px] px-1.5 py-0 shrink-0 ${sc.className}`}>{sc.label}</Badge></div><div className="flex items-center gap-3 text-[10px] text-muted-foreground"><span className="font-mono tracking-wider">{w.code}</span><span className="flex items-center gap-1">{w.role === "host" ? <Crown className="h-3 w-3" /> : <UserCheck className="h-3 w-3" />}{w.role === "host" ? "Animateur" : "Participant"}</span><span className="flex items-center gap-1"><Users className="h-3 w-3" />{w.participant_count}</span><span className="flex items-center gap-1"><Clock className="h-3 w-3" />{formatDistanceToNow(new Date(w.created_at), { addSuffix: true, locale: fr })}</span></div></div><ArrowRight className="h-4 w-4 text-muted-foreground/40 group-hover:text-foreground group-hover:translate-x-0.5 transition-all shrink-0" /></div>
            </motion.button>); })}</div>}
        </motion.div>

        <Dialog open={joinOpen} onOpenChange={setJoinOpen}><DialogContent className="rounded-2xl"><DialogHeader><DialogTitle className="font-display font-black uppercase tracking-tight">Rejoindre</DialogTitle></DialogHeader><div className="space-y-4 pt-2"><Input value={joinCode} onChange={e => setJoinCode(e.target.value.toUpperCase())} placeholder="A3K7M2" maxLength={6} className="text-2xl text-center font-display font-black tracking-[0.3em] uppercase h-14" autoFocus /><Button onClick={() => { join(joinCode); setJoinOpen(false); }} disabled={joinCode.length !== 6 || joining} className="w-full font-black uppercase tracking-wider rounded-xl h-11">{joining ? "Connexion..." : "Rejoindre"}<ArrowRight className="h-4 w-4 ml-2" /></Button></div></DialogContent></Dialog>
      </div>
    </PageTransition>
  );
}
