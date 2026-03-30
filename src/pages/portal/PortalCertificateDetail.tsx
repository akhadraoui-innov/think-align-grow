import { useParams, useNavigate } from "react-router-dom";
import { PageTransition } from "@/components/ui/PageTransition";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import {
  ArrowLeft, Award, BookOpen, Clock, Download, GraduationCap, Linkedin, Share2, Copy,
  Star, Target, Briefcase, Lightbulb, CheckCircle2, TrendingUp, TrendingDown,
  BarChart3, Timer, FileText, HelpCircle, MessageSquare, Brain, Send, Loader2,
  ThumbsUp, ThumbsDown, Sparkles
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { CertificateDownload } from "@/components/academy/CertificateDownload";
import { toast } from "sonner";
import { useState, useRef, useEffect } from "react";
import QRCode from "qrcode";
import ReactMarkdown from "react-markdown";

const VERIFY_BASE = "https://think-align-grow.lovable.app/verify";
const moduleTypeIcons: Record<string, any> = { lesson: BookOpen, quiz: HelpCircle, exercise: FileText, practice: MessageSquare };
const moduleTypeLabels: Record<string, string> = { lesson: "Leçon", quiz: "Quiz", exercise: "Exercice", practice: "Pratique" };

function getGrade(score: number): { letter: string; color: string; bg: string } {
  if (score >= 90) return { letter: "A", color: "text-emerald-600", bg: "bg-emerald-500/10 border-emerald-500/30" };
  if (score >= 80) return { letter: "B", color: "text-blue-600", bg: "bg-blue-500/10 border-blue-500/30" };
  if (score >= 70) return { letter: "C", color: "text-amber-600", bg: "bg-amber-500/10 border-amber-500/30" };
  return { letter: "D", color: "text-red-600", bg: "bg-red-500/10 border-red-500/30" };
}

function StarRating({ level }: { level: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map(i => (
        <Star key={i} className={cn("h-3 w-3", i <= level ? "fill-amber-400 text-amber-400" : "text-muted-foreground/20")} />
      ))}
    </div>
  );
}

export default function PortalCertificateDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const qc = useQueryClient();
  const [qrUrl, setQrUrl] = useState("");
  const [knowledgeMessages, setKnowledgeMessages] = useState<{ role: string; content: string }[]>([]);
  const [knowledgeInput, setKnowledgeInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [feedbackForm, setFeedbackForm] = useState({ overall: 0, difficulty: 0, relevance: 0, testimonial: "", recommend: true });
  const chatEndRef = useRef<HTMLDivElement>(null);

  const { data: cert, isLoading } = useQuery({
    queryKey: ["certificate-detail", id], enabled: !!id,
    queryFn: async () => {
      const { data } = await supabase.from("academy_certificates").select("*, academy_paths(*, academy_functions!academy_paths_function_id_fkey(name))").eq("id", id!).single();
      return data;
    },
  });

  const { data: profile } = useQuery({
    queryKey: ["user-profile-cert", user?.id], enabled: !!user?.id,
    queryFn: async () => { const { data } = await supabase.from("profiles").select("display_name, email").eq("user_id", user!.id).single(); return data; },
  });

  const { data: skillAssessments = [] } = useQuery({
    queryKey: ["skill-assessments", cert?.enrollment_id], enabled: !!cert?.enrollment_id,
    queryFn: async () => { const { data } = await supabase.from("academy_skill_assessments").select("*").eq("enrollment_id", cert!.enrollment_id); return data || []; },
  });

  const { data: feedback } = useQuery({
    queryKey: ["path-feedback", cert?.enrollment_id], enabled: !!cert?.enrollment_id,
    queryFn: async () => { const { data } = await supabase.from("academy_path_feedback").select("*").eq("enrollment_id", cert!.enrollment_id).maybeSingle(); return data; },
  });

  useEffect(() => {
    if (id) QRCode.toDataURL(`${VERIFY_BASE}/${id}`, { width: 200, margin: 1, color: { dark: "#D4AF37", light: "#FFFFFF" } }).then(setQrUrl);
  }, [id]);

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [knowledgeMessages]);

  const submitFeedback = useMutation({
    mutationFn: async () => {
      if (!cert || !user) return;
      const { error } = await supabase.from("academy_path_feedback").upsert({
        path_id: cert.path_id, user_id: user.id, enrollment_id: cert.enrollment_id,
        overall_rating: feedbackForm.overall, difficulty_rating: feedbackForm.difficulty,
        relevance_rating: feedbackForm.relevance, testimonial: feedbackForm.testimonial,
        would_recommend: feedbackForm.recommend,
      }, { onConflict: "enrollment_id" });
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["path-feedback"] }); toast.success("Merci pour votre retour !"); },
    onError: () => toast.error("Erreur lors de l'envoi"),
  });

  const sendKnowledgeMessage = async () => {
    if (!knowledgeInput.trim() || isStreaming || !cert) return;
    const userMsg = { role: "user", content: knowledgeInput };
    const allMessages = [...knowledgeMessages, userMsg];
    setKnowledgeMessages(allMessages);
    setKnowledgeInput("");
    setIsStreaming(true);

    let assistantContent = "";
    try {
      const session = (await supabase.auth.getSession()).data.session;
      const resp = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/academy-skills-agent`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${session?.access_token}`, apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY },
        body: JSON.stringify({ action: "knowledge", path_id: cert.path_id, messages: allMessages.map(m => ({ role: m.role, content: m.content })) }),
      });

      if (!resp.ok) throw new Error("Erreur IA");
      const reader = resp.body?.getReader();
      const decoder = new TextDecoder();
      if (!reader) throw new Error("No stream");

      let buffer = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        let newlineIndex: number;
        while ((newlineIndex = buffer.indexOf("\n")) !== -1) {
          let line = buffer.slice(0, newlineIndex);
          buffer = buffer.slice(newlineIndex + 1);
          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (!line.startsWith("data: ")) continue;
          const jsonStr = line.slice(6).trim();
          if (jsonStr === "[DONE]") break;
          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) {
              assistantContent += content;
              setKnowledgeMessages(prev => {
                const last = prev[prev.length - 1];
                if (last?.role === "assistant") return [...prev.slice(0, -1), { role: "assistant", content: assistantContent }];
                return [...prev, { role: "assistant", content: assistantContent }];
              });
            }
          } catch {}
        }
      }
    } catch (e: any) {
      toast.error(e.message || "Erreur Knowledge IA");
    }
    setIsStreaming(false);
  };

  if (isLoading) return <PageTransition><div className="container max-w-5xl mx-auto px-4 py-8"><div className="animate-pulse space-y-4"><div className="h-48 bg-muted rounded-2xl" /><div className="h-32 bg-muted rounded-xl" /></div></div></PageTransition>;
  if (!cert) return <PageTransition><div className="container max-w-5xl mx-auto px-4 py-8 text-center"><p className="text-muted-foreground">Certificat introuvable.</p><Button variant="ghost" onClick={() => navigate(-1)}><ArrowLeft className="h-4 w-4 mr-2" /> Retour</Button></div></PageTransition>;

  const path = (cert as any).academy_paths;
  const certData = (cert as any).certificate_data || {};
  const modulesDetail: any[] = certData.modules_detail || [];
  const score = certData.score || 0;
  const grade = getGrade(score);
  const holderName = certData.holder_name || profile?.display_name || "Apprenant";
  const pathSkills: any[] = Array.isArray(path?.skills) ? path.skills : [];
  const pathAptitudes: string[] = Array.isArray(path?.aptitudes) ? path.aptitudes : [];
  const pathOutcomes: string[] = Array.isArray(path?.professional_outcomes) ? path.professional_outcomes : [];
  const strengths = modulesDetail.filter((m: any) => m.score >= 85);
  const improvements = modulesDetail.filter((m: any) => m.score < 70);
  const avgByType: Record<string, { sum: number; count: number }> = {};
  modulesDetail.forEach((m: any) => { if (!avgByType[m.type]) avgByType[m.type] = { sum: 0, count: 0 }; avgByType[m.type].sum += m.score; avgByType[m.type].count++; });

  const copyLink = () => { navigator.clipboard.writeText(`${VERIFY_BASE}/${id}`); toast.success("Lien copié !"); };
  const shareLinkedIn = () => window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(`${VERIFY_BASE}/${id}`)}`, "_blank");

  return (
    <PageTransition>
      <div className="container max-w-5xl mx-auto px-4 py-8 space-y-6">
        <Button variant="ghost" size="sm" onClick={() => navigate(-1)}><ArrowLeft className="h-4 w-4 mr-2" /> Retour</Button>

        {/* HERO */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="rounded-2xl border bg-card overflow-hidden">
          <div className="bg-gradient-to-r from-amber-500/5 via-primary/5 to-transparent p-8">
            <div className="flex items-start gap-6">
              <div className={cn("flex h-20 w-20 items-center justify-center rounded-2xl border-2 shrink-0", grade.bg)}>
                <span className={cn("text-4xl font-display font-black", grade.color)}>{grade.letter}</span>
              </div>
              <div className="flex-1 min-w-0">
                <h1 className="text-2xl font-display font-bold tracking-tight mb-1">{path?.name || "Parcours"}</h1>
                <p className="text-sm text-muted-foreground mb-3">{holderName} · {format(new Date(cert.issued_at), "d MMMM yyyy", { locale: fr })}</p>
                <div className="grid grid-cols-4 gap-4">
                  {[
                    { icon: BarChart3, label: "Score", value: `${score}%`, color: grade.color },
                    { icon: BookOpen, label: "Modules", value: certData.modules_completed || 0, color: "text-primary" },
                    { icon: Timer, label: "Durée", value: `${certData.total_time_hours || 0}h`, color: "text-blue-500" },
                    { icon: Award, label: "Grade", value: grade.letter, color: grade.color },
                  ].map((kpi, i) => (
                    <div key={i} className="text-center p-3 rounded-xl bg-background/80">
                      <kpi.icon className={cn("h-4 w-4 mx-auto mb-1", kpi.color)} />
                      <p className="text-lg font-bold">{kpi.value}</p>
                      <p className="text-[10px] text-muted-foreground">{kpi.label}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* TABS */}
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="w-full justify-start bg-muted/50 p-1">
            <TabsTrigger value="overview" className="gap-1.5 text-xs"><Award className="h-3.5 w-3.5" /> Vue d'ensemble</TabsTrigger>
            <TabsTrigger value="evaluation" className="gap-1.5 text-xs"><BarChart3 className="h-3.5 w-3.5" /> Évaluation</TabsTrigger>
            <TabsTrigger value="skills" className="gap-1.5 text-xs"><Target className="h-3.5 w-3.5" /> Compétences</TabsTrigger>
            <TabsTrigger value="analysis" className="gap-1.5 text-xs"><Brain className="h-3.5 w-3.5" /> Analyse & REX</TabsTrigger>
            <TabsTrigger value="certificate" className="gap-1.5 text-xs"><GraduationCap className="h-3.5 w-3.5" /> Certificat</TabsTrigger>
          </TabsList>

          {/* ═══ VUE D'ENSEMBLE ═══ */}
          <TabsContent value="overview" className="space-y-6">
            <Card><CardContent className="p-6">
              <h3 className="font-semibold text-sm mb-3 flex items-center gap-2"><GraduationCap className="h-4 w-4 text-primary" /> Description du parcours</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{path?.description}</p>
            </CardContent></Card>
            {pathSkills.length > 0 && (
              <Card><CardContent className="p-6">
                <h3 className="font-semibold text-sm mb-3 flex items-center gap-2"><Sparkles className="h-4 w-4 text-primary" /> Compétences clés acquises</h3>
                <div className="flex flex-wrap gap-2">
                  {pathSkills.map((s: any, i: number) => (
                    <Badge key={i} variant="outline" className="text-xs px-3 py-1.5 gap-1.5"><Sparkles className="h-3 w-3 text-primary" /> {s.name}</Badge>
                  ))}
                </div>
              </CardContent></Card>
            )}
            <div className="flex items-center gap-2 flex-wrap">
              <Button variant="outline" size="sm" className="gap-2" onClick={shareLinkedIn}><Linkedin className="h-4 w-4" /> LinkedIn</Button>
              <Button variant="outline" size="sm" className="gap-2" onClick={copyLink}><Copy className="h-4 w-4" /> Copier le lien</Button>
              {navigator.share && <Button variant="outline" size="sm" className="gap-2" onClick={() => navigator.share({ title: `Certificat — ${path?.name}`, url: `${VERIFY_BASE}/${id}` })}><Share2 className="h-4 w-4" /> Partager</Button>}
            </div>
          </TabsContent>

          {/* ═══ ÉVALUATION ═══ */}
          <TabsContent value="evaluation" className="space-y-6">
            {/* Moyennes par type */}
            {Object.keys(avgByType).length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {Object.entries(avgByType).map(([type, data]) => {
                  const avg = Math.round(data.sum / data.count);
                  const Icon = moduleTypeIcons[type] || BookOpen;
                  return (
                    <Card key={type}><CardContent className="p-4 text-center">
                      <Icon className="h-5 w-5 mx-auto mb-2 text-primary" />
                      <p className="text-2xl font-bold">{avg}%</p>
                      <p className="text-[11px] text-muted-foreground">{moduleTypeLabels[type] || type} ({data.count})</p>
                    </CardContent></Card>
                  );
                })}
              </div>
            )}
            {/* Module detail table */}
            <Card><CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead><tr className="border-b bg-muted/30">
                    <th className="text-left p-3 font-semibold text-xs text-muted-foreground">Module</th>
                    <th className="text-left p-3 font-semibold text-xs text-muted-foreground">Type</th>
                    <th className="text-left p-3 font-semibold text-xs text-muted-foreground">Score</th>
                    <th className="text-left p-3 font-semibold text-xs text-muted-foreground">Durée</th>
                    <th className="text-left p-3 font-semibold text-xs text-muted-foreground w-32">Progression</th>
                  </tr></thead>
                  <tbody>
                    {modulesDetail.map((mod: any, i: number) => {
                      const scoreColor = mod.score >= 85 ? "text-emerald-600" : mod.score >= 70 ? "text-amber-600" : "text-red-500";
                      const Icon = moduleTypeIcons[mod.type] || BookOpen;
                      return (
                        <tr key={i} className={cn("border-b last:border-0", i % 2 === 0 && "bg-muted/10")}>
                          <td className="p-3 flex items-center gap-2"><Icon className="h-4 w-4 text-muted-foreground shrink-0" /><span className="truncate max-w-[250px]">{mod.title}</span></td>
                          <td className="p-3"><Badge variant="secondary" className="text-[10px]">{moduleTypeLabels[mod.type] || mod.type}</Badge></td>
                          <td className={cn("p-3 font-bold", scoreColor)}>{mod.score}%</td>
                          <td className="p-3 text-muted-foreground">{mod.time_minutes}min</td>
                          <td className="p-3"><Progress value={mod.score} className="h-2" /></td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <div className="p-4 border-t bg-muted/20 flex items-center justify-between">
                <span className="text-sm font-bold">Score moyen : {score}%</span>
                <span className="text-sm text-muted-foreground">{certData.modules_completed || 0} modules · {certData.total_time_hours || 0}h</span>
              </div>
            </CardContent></Card>
          </TabsContent>

          {/* ═══ COMPÉTENCES ═══ */}
          <TabsContent value="skills" className="space-y-6">
            {/* Skill assessments with progression */}
            {(skillAssessments.length > 0 || pathSkills.length > 0) && (
              <Card><CardContent className="p-6">
                <h3 className="font-semibold text-sm mb-4 flex items-center gap-2"><Target className="h-4 w-4 text-primary" /> Matrice de compétences</h3>
                <div className="space-y-3">
                  {(skillAssessments.length > 0 ? skillAssessments : pathSkills).map((item: any, i: number) => {
                    const isAssessment = !!item.skill_name;
                    const name = isAssessment ? item.skill_name : item.name;
                    const initial = isAssessment ? item.initial_level : 0;
                    const final_ = isAssessment ? item.final_level : item.level;
                    const progression = final_ - initial;
                    return (
                      <div key={i} className="flex items-center gap-4 p-3 rounded-xl bg-muted/20 border border-border/30">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium">{name}</p>
                          {isAssessment && <p className="text-[10px] text-muted-foreground">Niveau initial : {initial}/5 → Final : {final_}/5</p>}
                        </div>
                        <StarRating level={final_} />
                        {progression > 0 && (
                          <Badge variant="secondary" className="text-[10px] gap-1 text-emerald-600">
                            <TrendingUp className="h-3 w-3" /> +{progression}
                          </Badge>
                        )}
                      </div>
                    );
                  })}
                </div>
              </CardContent></Card>
            )}

            {pathAptitudes.length > 0 && (
              <Card><CardContent className="p-6">
                <h3 className="font-semibold text-sm mb-3 flex items-center gap-2"><Lightbulb className="h-4 w-4 text-primary" /> Aptitudes développées</h3>
                <ul className="space-y-2">
                  {pathAptitudes.map((a, i) => <li key={i} className="flex items-start gap-2 text-sm"><CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />{a}</li>)}
                </ul>
              </CardContent></Card>
            )}

            {pathOutcomes.length > 0 && (
              <Card><CardContent className="p-6">
                <h3 className="font-semibold text-sm mb-3 flex items-center gap-2"><Briefcase className="h-4 w-4 text-primary" /> Débouchés professionnels</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {pathOutcomes.map((o, i) => <div key={i} className="flex items-center gap-2 text-sm p-2 rounded-lg bg-muted/20"><GraduationCap className="h-3.5 w-3.5 text-primary shrink-0" />{o}</div>)}
                </div>
              </CardContent></Card>
            )}
          </TabsContent>

          {/* ═══ ANALYSE & REX ═══ */}
          <TabsContent value="analysis" className="space-y-6">
            {/* Points forts */}
            {strengths.length > 0 && (
              <Card><CardContent className="p-6">
                <h3 className="font-semibold text-sm mb-3 flex items-center gap-2"><TrendingUp className="h-4 w-4 text-emerald-500" /> Points forts</h3>
                <div className="space-y-2">
                  {strengths.map((m: any, i: number) => (
                    <div key={i} className="flex items-center gap-3 p-2 rounded-lg bg-emerald-500/5 border border-emerald-500/20">
                      <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                      <span className="text-sm flex-1">{m.title}</span>
                      <Badge className="text-[10px] bg-emerald-500/10 text-emerald-600 border-emerald-500/30">{m.score}%</Badge>
                    </div>
                  ))}
                </div>
              </CardContent></Card>
            )}

            {improvements.length > 0 && (
              <Card><CardContent className="p-6">
                <h3 className="font-semibold text-sm mb-3 flex items-center gap-2"><TrendingDown className="h-4 w-4 text-amber-500" /> Axes d'amélioration</h3>
                <div className="space-y-2">
                  {improvements.map((m: any, i: number) => (
                    <div key={i} className="flex items-center gap-3 p-2 rounded-lg bg-amber-500/5 border border-amber-500/20">
                      <Target className="h-4 w-4 text-amber-500 shrink-0" />
                      <span className="text-sm flex-1">{m.title}</span>
                      <Badge variant="outline" className="text-[10px] text-amber-600">{m.score}%</Badge>
                    </div>
                  ))}
                </div>
              </CardContent></Card>
            )}

            {/* Modalités d'évaluation */}
            <Card><CardContent className="p-6">
              <h3 className="font-semibold text-sm mb-3 flex items-center gap-2"><FileText className="h-4 w-4 text-primary" /> Modalités d'évaluation</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                <div className="p-3 rounded-lg bg-muted/20"><p className="text-[10px] text-muted-foreground uppercase mb-1">Types d'épreuves</p><p className="font-medium">{Object.keys(avgByType).map(t => moduleTypeLabels[t] || t).join(", ")}</p></div>
                <div className="p-3 rounded-lg bg-muted/20"><p className="text-[10px] text-muted-foreground uppercase mb-1">Nombre d'épreuves</p><p className="font-medium">{modulesDetail.length}</p></div>
                <div className="p-3 rounded-lg bg-muted/20"><p className="text-[10px] text-muted-foreground uppercase mb-1">Seuil certification</p><p className="font-medium">70%</p></div>
                <div className="p-3 rounded-lg bg-muted/20"><p className="text-[10px] text-muted-foreground uppercase mb-1">Statut</p><p className="font-medium text-emerald-600">{score >= 70 ? "Certifié" : "Non certifié"}</p></div>
              </div>
            </CardContent></Card>

            {/* Feedback form */}
            <Card><CardContent className="p-6">
              <h3 className="font-semibold text-sm mb-4 flex items-center gap-2"><MessageSquare className="h-4 w-4 text-primary" /> Retour d'expérience</h3>
              {feedback ? (
                <div className="space-y-3">
                  <div className="flex gap-4">
                    {[{ label: "Global", value: feedback.overall_rating }, { label: "Difficulté", value: feedback.difficulty_rating }, { label: "Pertinence", value: feedback.relevance_rating }].map((r, i) => (
                      <div key={i} className="text-center">
                        <p className="text-[10px] text-muted-foreground mb-1">{r.label}</p>
                        <div className="flex gap-0.5 justify-center">{[1,2,3,4,5].map(s => <Star key={s} className={cn("h-3.5 w-3.5", s <= (r.value || 0) ? "fill-amber-400 text-amber-400" : "text-muted-foreground/20")} />)}</div>
                      </div>
                    ))}
                  </div>
                  {feedback.testimonial && <p className="text-sm text-muted-foreground italic border-l-2 border-primary/30 pl-3">"{feedback.testimonial}"</p>}
                  {feedback.would_recommend && <Badge variant="secondary" className="text-xs gap-1"><ThumbsUp className="h-3 w-3" /> Recommande cette formation</Badge>}
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex gap-6">
                    {["overall", "difficulty", "relevance"].map(key => (
                      <div key={key} className="text-center">
                        <p className="text-[10px] text-muted-foreground mb-1">{key === "overall" ? "Global" : key === "difficulty" ? "Difficulté" : "Pertinence"}</p>
                        <div className="flex gap-0.5 justify-center">{[1,2,3,4,5].map(s => <button key={s} onClick={() => setFeedbackForm(f => ({...f, [key]: s}))}><Star className={cn("h-4 w-4 cursor-pointer hover:scale-110 transition-transform", s <= (feedbackForm as any)[key] ? "fill-amber-400 text-amber-400" : "text-muted-foreground/20")} /></button>)}</div>
                      </div>
                    ))}
                  </div>
                  <Textarea value={feedbackForm.testimonial} onChange={e => setFeedbackForm(f => ({...f, testimonial: e.target.value}))} placeholder="Partagez votre expérience..." className="min-h-[80px]" />
                  <Button size="sm" onClick={() => submitFeedback.mutate()} disabled={submitFeedback.isPending} className="gap-2">
                    {submitFeedback.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />} Envoyer
                  </Button>
                </div>
              )}
            </CardContent></Card>

            {/* Knowledge IA */}
            <Card><CardContent className="p-6">
              <h3 className="font-semibold text-sm mb-4 flex items-center gap-2"><Brain className="h-4 w-4 text-primary" /> Knowledge IA — Approfondir mes connaissances</h3>
              <div className="border rounded-xl overflow-hidden">
                <div className="max-h-[400px] overflow-y-auto p-4 space-y-3 bg-muted/10">
                  {knowledgeMessages.length === 0 && <p className="text-sm text-muted-foreground text-center py-8">Posez une question sur le contenu du parcours, un concept clé, ou demandez des approfondissements.</p>}
                  {knowledgeMessages.map((msg, i) => (
                    <div key={i} className={cn("flex", msg.role === "user" ? "justify-end" : "justify-start")}>
                      <div className={cn("max-w-[80%] rounded-2xl px-4 py-2.5 text-sm", msg.role === "user" ? "bg-primary text-primary-foreground" : "bg-card border")}>
                        {msg.role === "assistant" ? <div className="prose prose-sm dark:prose-invert max-w-none"><ReactMarkdown>{msg.content}</ReactMarkdown></div> : msg.content}
                      </div>
                    </div>
                  ))}
                  {isStreaming && knowledgeMessages[knowledgeMessages.length - 1]?.role !== "assistant" && (
                    <div className="flex justify-start"><div className="bg-card border rounded-2xl px-4 py-2.5"><Loader2 className="h-4 w-4 animate-spin text-primary" /></div></div>
                  )}
                  <div ref={chatEndRef} />
                </div>
                <div className="border-t p-3 flex gap-2">
                  <input value={knowledgeInput} onChange={e => setKnowledgeInput(e.target.value)} onKeyDown={e => e.key === "Enter" && !e.shiftKey && sendKnowledgeMessage()}
                    placeholder="Posez votre question..." className="flex-1 bg-transparent text-sm outline-none" disabled={isStreaming} />
                  <Button size="sm" onClick={sendKnowledgeMessage} disabled={isStreaming || !knowledgeInput.trim()} className="gap-1.5">
                    {isStreaming ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
                  </Button>
                </div>
              </div>
            </CardContent></Card>
          </TabsContent>

          {/* ═══ CERTIFICAT ═══ */}
          <TabsContent value="certificate" className="space-y-6">
            {/* Visual preview */}
            <Card><CardContent className="p-8">
              <div className="relative rounded-2xl border-2 border-amber-300/40 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20 p-8 text-center overflow-hidden">
                <div className="absolute top-2 left-2 h-8 w-8 border-t-2 border-l-2 border-amber-400/50 rounded-tl-lg" />
                <div className="absolute top-2 right-2 h-8 w-8 border-t-2 border-r-2 border-amber-400/50 rounded-tr-lg" />
                <div className="absolute bottom-2 left-2 h-8 w-8 border-b-2 border-l-2 border-amber-400/50 rounded-bl-lg" />
                <div className="absolute bottom-2 right-2 h-8 w-8 border-b-2 border-r-2 border-amber-400/50 rounded-br-lg" />
                <p className="text-[10px] uppercase tracking-[0.3em] text-amber-600 font-bold mb-0.5">GROWTHINNOV</p>
                <p className="text-[8px] uppercase tracking-[0.2em] text-amber-600/60 font-medium mb-4">AI ACCELERATION</p>
                <h2 className="text-lg font-bold tracking-wide text-amber-800 dark:text-amber-400 mb-4">CERTIFICAT DE RÉUSSITE</h2>
                <p className="text-xs text-muted-foreground mb-1">Décerné à</p>
                <p className="font-display font-bold text-2xl text-foreground mb-3">{holderName}</p>
                <p className="text-xs text-muted-foreground mb-1">Pour avoir complété avec succès</p>
                <p className="font-bold text-base text-amber-700 dark:text-amber-400 mb-4">« {path?.name} »</p>
                <div className="flex items-center justify-center gap-6 py-3 px-4 rounded-xl bg-amber-100/40 dark:bg-amber-900/20 border border-amber-300/30">
                  <div className="text-center"><p className="text-lg font-bold">{score}%</p><p className="text-[9px] text-muted-foreground">Score</p></div>
                  <div className="w-px h-8 bg-amber-300/40" />
                  <div className="text-center"><p className="text-lg font-bold">{certData.modules_completed || 0}</p><p className="text-[9px] text-muted-foreground">Modules</p></div>
                  <div className="w-px h-8 bg-amber-300/40" />
                  <div className="text-center"><p className="text-lg font-bold">{certData.total_time_hours || 0}h</p><p className="text-[9px] text-muted-foreground">Formation</p></div>
                </div>
                <div className="mt-4 pt-3 border-t border-amber-300/30 flex items-end justify-between">
                  <div className="text-left text-[10px] text-muted-foreground space-y-0.5">
                    <p>{format(new Date(cert.issued_at), "d MMMM yyyy", { locale: fr })}</p>
                    <p className="font-mono">N° {id?.slice(0, 8).toUpperCase()}</p>
                  </div>
                  {qrUrl && <img src={qrUrl} alt="QR" className="h-16 w-16 rounded" />}
                </div>
              </div>
            </CardContent></Card>

            <div className="flex items-center gap-2 flex-wrap">
              <CertificateDownload
                holderName={holderName}
                pathName={path?.name || "Parcours"}
                issuedAt={cert.issued_at}
                score={score}
                modulesCompleted={certData.modules_completed || 0}
                totalTimeHours={certData.total_time_hours || 0}
                certificateId={cert.id}
                difficulty={path?.difficulty}
                modulesDetail={modulesDetail}
                skills={path?.skills as any}
                aptitudes={path?.aptitudes as any}
                professionalOutcomes={path?.professional_outcomes as any}
                pathDescription={path?.description}
              />
              <Button variant="outline" size="sm" className="gap-2" onClick={shareLinkedIn}><Linkedin className="h-4 w-4" /> LinkedIn</Button>
              <Button variant="outline" size="sm" className="gap-2" onClick={copyLink}><Copy className="h-4 w-4" /> Copier le lien</Button>
              {navigator.share && <Button variant="outline" size="sm" className="gap-2" onClick={() => navigator.share({ title: `Certificat — ${path?.name}`, url: `${VERIFY_BASE}/${id}` })}><Share2 className="h-4 w-4" /> Partager</Button>}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </PageTransition>
  );
}
