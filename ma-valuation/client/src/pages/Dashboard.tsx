import { useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import AppLayout from "@/components/AppLayout";
import { KpiCard, StatusBadge, ModuleProgress, SectionHeader, EmptyState, formatCurrency } from "@/components/FinancialComponents";
import {
  Plus, Building2, Calendar, BarChart3, Database, Target, TrendingUp, Zap,
  MoreHorizontal, Edit2, Archive, Copy, Trash2, ChevronRight, Search, Filter,
  FolderOpen
} from "lucide-react";
import { toast } from "sonner";

const SECTORS = [
  { code: "tech", label: "Technologie & SaaS" },
  { code: "industry", label: "Industrie & Manufacturing" },
  { code: "services", label: "Services aux entreprises" },
  { code: "retail", label: "Distribution & Retail" },
  { code: "health", label: "Santé & Medtech" },
  { code: "real_estate", label: "Immobilier & Construction" },
  { code: "finance", label: "Services financiers" },
  { code: "food", label: "Agroalimentaire" },
  { code: "energy", label: "Énergie & Utilities" },
  { code: "media", label: "Médias & Communication" },
  { code: "other", label: "Autre" },
];

const MODULE_ICONS = [
  { icon: <Database size={11} />, label: "Historique", color: "#1A85FF" },
  { icon: <Target size={11} />, label: "Stratégie", color: "#C9A84C" },
  { icon: <TrendingUp size={11} />, label: "BP", color: "#1A85FF" },
  { icon: <BarChart3 size={11} />, label: "Valuation", color: "#C9A84C" },
  { icon: <Zap size={11} />, label: "Simulation", color: "#C9A84C" },
];

export default function Dashboard() {
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [openMenuId, setOpenMenuId] = useState<number | null>(null);

  const { data: projects = [], isLoading, refetch } = trpc.projects.list.useQuery();
  const createProject = trpc.projects.create.useMutation({
    onSuccess: () => { refetch(); setShowCreateModal(false); toast.success("Projet créé avec succès"); },
    onError: (e) => toast.error(e.message),
  });
  const updateProject = trpc.projects.update.useMutation({ onSuccess: () => refetch() });
  const deleteProject = trpc.projects.delete.useMutation({
    onSuccess: () => { refetch(); toast.success("Projet supprimé"); },
  });

  const [form, setForm] = useState({ name: "", companyName: "", sectorCode: "", sectorLabel: "", description: "" });

  const filtered = projects.filter(p => {
    const matchSearch = !searchQuery || p.name.toLowerCase().includes(searchQuery.toLowerCase()) || p.companyName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchStatus = statusFilter === "all" || p.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const stats = {
    total: projects.length,
    active: projects.filter(p => p.status === "active").length,
    completed: projects.filter(p => p.status === "completed").length,
    draft: projects.filter(p => p.status === "draft").length,
  };

  const handleCreate = () => {
    if (!form.name || !form.companyName) return toast.error("Nom et entreprise requis");
    const sector = SECTORS.find(s => s.code === form.sectorCode);
    createProject.mutate({ ...form, sectorLabel: sector?.label });
  };

  return (
    <AppLayout>
      <div className="p-4 max-w-7xl mx-auto animate-fade-in">
        {/* ─── Header ─── */}
        <div className="flex items-center justify-between mb-5">
          <div>
            <h1 className="text-lg font-heading font-800 text-white tracking-tight">Tableau de bord</h1>
            <p className="text-xs mt-0.5" style={{ color: "oklch(50% 0.04 240)" }}>
              {user?.name ? `Bonjour, ${user.name}` : "Bienvenue"} — Gérez vos projets de valorisation
            </p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-heading font-600 text-white transition-all hover:opacity-90 active:scale-95"
            style={{ background: "linear-gradient(135deg, #1A85FF, #0A5FCC)" }}
          >
            <Plus size={13} />
            Nouveau projet
          </button>
        </div>

        {/* ─── KPIs ─── */}
        <div className="grid grid-cols-4 gap-3 mb-5">
          <KpiCard label="Total projets" value={String(stats.total)} color="blue" />
          <KpiCard label="Actifs" value={String(stats.active)} color="green" />
          <KpiCard label="Terminés" value={String(stats.completed)} color="gold" />
          <KpiCard label="Brouillons" value={String(stats.draft)} color="neutral" />
        </div>

        {/* ─── Filters ─── */}
        <div className="flex items-center gap-3 mb-4">
          <div className="flex-1 relative">
            <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2" style={{ color: "oklch(45% 0.05 240)" }} />
            <input
              type="text"
              placeholder="Rechercher un projet ou une entreprise..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="bloomberg-input text-left pl-7"
              style={{ maxWidth: "360px" }}
            />
          </div>
          <div className="flex items-center gap-1">
            {["all", "draft", "active", "completed", "archived"].map(s => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className="px-2.5 py-1 rounded text-[10px] font-heading font-600 tracking-wider uppercase transition-all"
                style={{
                  background: statusFilter === s ? "oklch(55% 0.22 240 / 0.2)" : "oklch(18% 0.06 240)",
                  color: statusFilter === s ? "#1A85FF" : "oklch(55% 0.04 240)",
                  border: `1px solid ${statusFilter === s ? "oklch(55% 0.22 240 / 0.4)" : "oklch(25% 0.06 240)"}`,
                }}
              >
                {s === "all" ? "Tous" : s === "draft" ? "Brouillon" : s === "active" ? "Actif" : s === "completed" ? "Terminé" : "Archivé"}
              </button>
            ))}
          </div>
        </div>

        {/* ─── Projects Grid ─── */}
        {isLoading ? (
          <div className="grid grid-cols-3 gap-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="kpi-card animate-pulse h-48" style={{ background: "oklch(15% 0.05 240)" }} />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={<FolderOpen size={24} />}
            title={searchQuery ? "Aucun projet trouvé" : "Aucun projet"}
            description={searchQuery ? "Modifiez votre recherche ou créez un nouveau projet." : "Créez votre premier projet de valorisation pour commencer."}
            action={
              <button
                onClick={() => setShowCreateModal(true)}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-heading font-600 text-white"
                style={{ background: "linear-gradient(135deg, #1A85FF, #0A5FCC)" }}
              >
                <Plus size={13} />
                Créer un projet
              </button>
            }
          />
        ) : (
          <div className="grid grid-cols-3 gap-3">
            {filtered.map(project => (
              <div
                key={project.id}
                className="kpi-card cursor-pointer group relative"
                onClick={() => navigate(`/project/${project.id}`)}
              >
                {/* Header */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: "oklch(55% 0.22 240 / 0.15)" }}>
                      <Building2 size={14} style={{ color: "#1A85FF" }} />
                    </div>
                    <div>
                      <div className="text-sm font-heading font-700 text-white leading-tight">{project.name}</div>
                      <div className="text-xs mt-0.5" style={{ color: "oklch(55% 0.04 240)" }}>{project.companyName}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <StatusBadge status={project.status} />
                    <button
                      onClick={e => { e.stopPropagation(); setOpenMenuId(openMenuId === project.id ? null : project.id); }}
                      className="w-6 h-6 rounded flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white/10"
                      style={{ color: "oklch(55% 0.04 240)" }}
                    >
                      <MoreHorizontal size={12} />
                    </button>
                  </div>
                </div>

                {/* Context menu */}
                {openMenuId === project.id && (
                  <div
                    className="absolute right-3 top-10 z-10 rounded-lg py-1 shadow-xl"
                    style={{ background: "oklch(18% 0.06 240)", border: "1px solid oklch(28% 0.07 240)", minWidth: "140px" }}
                    onClick={e => e.stopPropagation()}
                  >
                    {[
                      { icon: <Edit2 size={11} />, label: "Modifier", action: () => { setOpenMenuId(null); navigate(`/project/${project.id}/edit`); } },
                      { icon: <Copy size={11} />, label: "Dupliquer", action: () => { toast.info("Duplication à venir"); setOpenMenuId(null); } },
                      { icon: <Archive size={11} />, label: "Archiver", action: () => { updateProject.mutate({ id: project.id, status: "archived" }); setOpenMenuId(null); } },
                      { icon: <Trash2 size={11} />, label: "Supprimer", action: () => { if (confirm("Supprimer ce projet ?")) deleteProject.mutate({ id: project.id }); setOpenMenuId(null); }, danger: true },
                    ].map(item => (
                      <button
                        key={item.label}
                        onClick={item.action}
                        className="flex items-center gap-2 w-full px-3 py-1.5 text-xs hover:bg-white/5 transition-colors"
                        style={{ color: (item as any).danger ? "oklch(55% 0.22 25)" : "oklch(75% 0.03 240)" }}
                      >
                        {item.icon}
                        {item.label}
                      </button>
                    ))}
                  </div>
                )}

                {/* Sector */}
                {project.sectorLabel && (
                  <div className="text-[10px] font-heading font-600 tracking-wider uppercase mb-3 px-1.5 py-0.5 rounded inline-block" style={{ color: "#C9A84C", background: "oklch(72% 0.14 75 / 0.1)" }}>
                    {project.sectorLabel}
                  </div>
                )}

                {/* Module progress */}
                <div className="space-y-1.5 mb-3">
                  {MODULE_ICONS.map((m, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <span className="flex-shrink-0" style={{ color: m.color }}>{m.icon}</span>
                      <div className="flex-1 h-1 rounded-full overflow-hidden" style={{ background: "oklch(22% 0.06 240)" }}>
                        <div className="h-full rounded-full" style={{ width: "0%", background: m.color }} />
                      </div>
                      <span className="text-[9px] font-heading font-600 w-6 text-right tabular-nums" style={{ color: "oklch(45% 0.05 240)" }}>0%</span>
                    </div>
                  ))}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between pt-2" style={{ borderTop: "1px solid oklch(22% 0.06 240)" }}>
                  <div className="flex items-center gap-1 text-[10px]" style={{ color: "oklch(45% 0.05 240)" }}>
                    <Calendar size={9} />
                    {new Date(project.updatedAt).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" })}
                  </div>
                  <div className="flex items-center gap-1 text-[10px] font-heading font-600 opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: "#1A85FF" }}>
                    Ouvrir
                    <ChevronRight size={10} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ─── Create Modal ─── */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: "rgba(0,0,0,0.7)" }}>
          <div
            className="w-full max-w-lg rounded-xl shadow-2xl animate-fade-in"
            style={{ background: "oklch(15% 0.05 240)", border: "1px solid oklch(28% 0.07 240)" }}
          >
            <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: "1px solid oklch(22% 0.06 240)" }}>
              <div>
                <h2 className="text-sm font-heading font-800 text-white">Nouveau projet</h2>
                <p className="text-xs mt-0.5" style={{ color: "oklch(50% 0.04 240)" }}>Créer un projet de valorisation</p>
              </div>
              <button onClick={() => setShowCreateModal(false)} className="w-7 h-7 rounded flex items-center justify-center hover:bg-white/10 transition-colors" style={{ color: "oklch(55% 0.04 240)" }}>✕</button>
            </div>

            <div className="p-5 space-y-4">
              <div>
                <label className="block text-[10px] font-heading font-600 tracking-widest uppercase mb-1.5" style={{ color: "oklch(55% 0.04 240)" }}>Nom du projet *</label>
                <input
                  type="text"
                  placeholder="Ex : Valorisation Acme Corp — Acquisition 2025"
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  className="bloomberg-input text-left"
                />
              </div>

              <div>
                <label className="block text-[10px] font-heading font-600 tracking-widest uppercase mb-1.5" style={{ color: "oklch(55% 0.04 240)" }}>Entreprise cible *</label>
                <input
                  type="text"
                  placeholder="Raison sociale de l'entreprise"
                  value={form.companyName}
                  onChange={e => setForm(f => ({ ...f, companyName: e.target.value }))}
                  className="bloomberg-input text-left"
                />
              </div>

              <div>
                <label className="block text-[10px] font-heading font-600 tracking-widest uppercase mb-1.5" style={{ color: "oklch(55% 0.04 240)" }}>Secteur d'activité</label>
                <select
                  value={form.sectorCode}
                  onChange={e => setForm(f => ({ ...f, sectorCode: e.target.value }))}
                  className="bloomberg-input text-left"
                  style={{ background: "oklch(18% 0.06 240)" }}
                >
                  <option value="">Sélectionner un secteur</option>
                  {SECTORS.map(s => (
                    <option key={s.code} value={s.code}>{s.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-heading font-600 tracking-widest uppercase mb-1.5" style={{ color: "oklch(55% 0.04 240)" }}>Description (optionnel)</label>
                <textarea
                  placeholder="Contexte de la mission, objectifs..."
                  value={form.description}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  className="bloomberg-input text-left resize-none"
                  rows={3}
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 px-5 py-4" style={{ borderTop: "1px solid oklch(22% 0.06 240)" }}>
              <button
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-2 rounded-lg text-xs font-heading font-600 transition-colors"
                style={{ background: "oklch(20% 0.06 240)", color: "oklch(70% 0.03 240)" }}
              >
                Annuler
              </button>
              <button
                onClick={handleCreate}
                disabled={createProject.isPending}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-heading font-600 text-white transition-all hover:opacity-90 disabled:opacity-50"
                style={{ background: "linear-gradient(135deg, #1A85FF, #0A5FCC)" }}
              >
                {createProject.isPending ? (
                  <div className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Plus size={12} />
                )}
                Créer le projet
              </button>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
