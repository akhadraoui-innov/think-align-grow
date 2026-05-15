import { useMemo, useState } from "react";
import { Search, X, Plus, Sparkles, Check, Filter, Layers, Workflow, Star, Wand2, Maximize2 } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import type { DbCard, DbPillar } from "@/hooks/useToolkitData";
import { getPillarCssColor, getPillarCssColorAlpha, getPillarGradient, PHASE_LABELS } from "@/hooks/useToolkitData";
import type { ChallengeArtifact, CreateArtifactInput } from "@/hooks/useChallengeArtifacts";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  cards: DbCard[];
  pillars: DbPillar[];
  customCards: ChallengeArtifact[]; // kind=card, is_custom_card=true
  placedCardIds?: Set<string>;
  currentSubjectId?: string | null;
  onAddToStaging?: (cardId: string) => void;
  onCreateCustomCard?: (input: CreateArtifactInput) => Promise<any>;
}

type Tab = "library" | "mine";

export function CardExplorer({
  open, onOpenChange,
  cards, pillars, customCards, placedCardIds, currentSubjectId,
  onAddToStaging, onCreateCustomCard,
}: Props) {
  const [tab, setTab] = useState<Tab>("library");
  const [search, setSearch] = useState("");
  const [pillarFilter, setPillarFilter] = useState<string | null>(null);
  const [phaseFilter, setPhaseFilter] = useState<string | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return cards.filter(c => {
      if (pillarFilter && c.pillar_id !== pillarFilter) return false;
      if (phaseFilter && c.phase !== phaseFilter) return false;
      if (q && !(`${c.title} ${c.subtitle ?? ""} ${c.definition ?? ""}`.toLowerCase().includes(q))) return false;
      return true;
    });
  }, [cards, search, pillarFilter, phaseFilter]);

  const toggle = (id: string) => setSelected(s => {
    const n = new Set(s);
    n.has(id) ? n.delete(id) : n.add(id);
    return n;
  });

  const bulkAdd = () => {
    if (!onAddToStaging) return;
    selected.forEach(id => onAddToStaging(id));
    toast.success(`${selected.size} carte${selected.size > 1 ? "s" : ""} ajoutée${selected.size > 1 ? "s" : ""} en zone d'attente`);
    setSelected(new Set());
    onOpenChange(false);
  };

  const phases = ["foundations", "model", "growth", "execution"];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="!fixed !inset-2 !top-2 !left-2 !right-2 !bottom-2 !translate-x-0 !translate-y-0 max-w-none w-auto h-auto p-0 gap-0 grid-rows-[auto_1fr] flex flex-col overflow-hidden rounded-xl"
      >
        {/* HEADER */}
        <div className="flex items-center gap-3 px-5 py-3 border-b border-border bg-background/80 backdrop-blur shrink-0">
          <Layers className="h-5 w-5 text-primary" />
          <div className="flex-1">
            <h2 className="font-display font-black text-base uppercase tracking-widest leading-none">Bibliothèque de cartes</h2>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider mt-0.5">
              {cards.length} cartes · {customCards.length} créées par vous
            </p>
          </div>
          <div className="flex items-center gap-1 rounded-md border border-border p-0.5">
            <button onClick={() => setTab("library")} className={cn("px-3 h-7 rounded text-[11px] font-bold uppercase tracking-wider flex items-center gap-1", tab === "library" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted")}>
              <Layers className="h-3 w-3" /> Toolkit
            </button>
            <button onClick={() => setTab("mine")} className={cn("px-3 h-7 rounded text-[11px] font-bold uppercase tracking-wider flex items-center gap-1", tab === "mine" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted")}>
              <Star className="h-3 w-3" /> Mes cartes
              {customCards.length > 0 && <span className="ml-0.5 inline-flex items-center justify-center h-3.5 min-w-[14px] px-1 rounded-full text-[9px] tabular-nums bg-background/30">{customCards.length}</span>}
            </button>
          </div>
          <Button size="sm" variant="ghost" onClick={() => onOpenChange(false)} className="ml-1"><X className="h-4 w-4" /></Button>
        </div>

        {tab === "library" && (
          <>
            {/* FILTERS */}
            <div className="px-5 py-3 border-b border-border space-y-3 shrink-0">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Rechercher par titre, mot-clé, définition…"
                  className="pl-9 h-10 text-sm"
                  autoFocus
                />
                {search && (
                  <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2"><X className="h-3.5 w-3.5 text-muted-foreground" /></button>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground inline-flex items-center gap-1"><Filter className="h-3 w-3" />Pilier</span>
                <FilterChip active={pillarFilter === null} onClick={() => setPillarFilter(null)}>Tous</FilterChip>
                {pillars.map(p => {
                  const c = getPillarCssColor(p.slug, p.color);
                  const active = pillarFilter === p.id;
                  return (
                    <FilterChip key={p.id} active={active} onClick={() => setPillarFilter(active ? null : p.id)} color={c}>
                      {p.name}
                    </FilterChip>
                  );
                })}
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground inline-flex items-center gap-1"><Workflow className="h-3 w-3" />Phase</span>
                <FilterChip active={phaseFilter === null} onClick={() => setPhaseFilter(null)}>Toutes</FilterChip>
                {phases.map(ph => (
                  <FilterChip key={ph} active={phaseFilter === ph} onClick={() => setPhaseFilter(phaseFilter === ph ? null : ph)}>
                    {PHASE_LABELS[ph] || ph}
                  </FilterChip>
                ))}
                <span className="ml-auto text-[10px] text-muted-foreground tabular-nums">{filtered.length} résultat{filtered.length > 1 ? "s" : ""}</span>
              </div>
            </div>

            {/* GRID */}
            <ScrollArea className="flex-1 min-h-0">
              <div className="p-5 grid gap-4" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))" }}>
                {filtered.map(card => (
                  <ShowcaseCard
                    key={card.id}
                    card={card}
                    pillar={pillars.find(p => p.id === card.pillar_id)}
                    placed={placedCardIds?.has(card.id)}
                    selected={selected.has(card.id)}
                    onToggle={() => toggle(card.id)}
                    onQuickAdd={() => { onAddToStaging?.(card.id); toast.success("Ajoutée en zone d'attente"); }}
                  />
                ))}
                {filtered.length === 0 && (
                  <div className="col-span-full py-16 text-center text-sm text-muted-foreground">
                    Aucune carte. <button className="underline font-bold" onClick={() => { setSearch(""); setPillarFilter(null); setPhaseFilter(null); }}>Réinitialiser les filtres</button>
                  </div>
                )}
              </div>
            </ScrollArea>

            {/* FOOTER */}
            <AnimatePresence>
              {selected.size > 0 && (
                <motion.div
                  initial={{ y: 50, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: 50, opacity: 0 }}
                  className="px-5 py-3 border-t border-border bg-background/95 backdrop-blur flex items-center gap-3 shrink-0"
                >
                  <Badge className="bg-primary text-primary-foreground">{selected.size}</Badge>
                  <span className="text-sm font-medium">carte{selected.size > 1 ? "s" : ""} sélectionnée{selected.size > 1 ? "s" : ""}</span>
                  <Button size="sm" variant="ghost" onClick={() => setSelected(new Set())} className="ml-auto">Annuler</Button>
                  <Button size="sm" onClick={bulkAdd} className="font-bold">
                    <Plus className="h-4 w-4 mr-1" /> Ajouter en zone d'attente
                  </Button>
                </motion.div>
              )}
            </AnimatePresence>
          </>
        )}

        {tab === "mine" && (
          <CustomCardsTab
            customCards={customCards}
            pillars={pillars}
            currentSubjectId={currentSubjectId}
            onCreate={onCreateCustomCard}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

/* ─────────── Subcomponents ─────────── */

function FilterChip({ active, onClick, children, color }: { active: boolean; onClick: () => void; children: React.ReactNode; color?: string }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider border transition-all",
        active
          ? "bg-foreground text-background border-foreground shadow-sm"
          : "bg-background text-muted-foreground border-border hover:text-foreground hover:border-foreground/40",
      )}
      style={active && color ? { background: color, borderColor: color, color: "white" } : undefined}
    >
      {children}
    </button>
  );
}

function ShowcaseCard({
  card, pillar, placed, selected, onToggle, onQuickAdd,
}: {
  card: DbCard; pillar?: DbPillar; placed?: boolean;
  selected: boolean; onToggle: () => void; onQuickAdd: () => void;
}) {
  const slug = pillar?.slug || "";
  const dbCol = pillar?.color || null;
  const gradient = getPillarGradient(slug, dbCol);
  const color = getPillarCssColor(slug, dbCol);
  const colorSoft = getPillarCssColorAlpha(slug, dbCol, 0.08);
  const phaseLabel = PHASE_LABELS[card.phase] || card.phase;

  return (
    <motion.div
      whileHover={{ y: -3 }}
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData("card-id", card.id);
        e.dataTransfer.effectAllowed = "move";
      }}
      onClick={onToggle}
      className={cn(
        "group relative rounded-xl overflow-hidden cursor-grab active:cursor-grabbing border-2 transition-all bg-card flex flex-col h-[340px]",
        selected ? "border-primary shadow-lg shadow-primary/20" : "border-border hover:border-foreground/30 hover:shadow-md",
        placed && "opacity-60",
      )}
    >
      {/* TOP — gradient header */}
      <div className="h-20 relative overflow-hidden shrink-0" style={{ background: gradient }}>
        <div className="absolute inset-0 opacity-30" style={{ background: `radial-gradient(circle at 30% 30%, white 0%, transparent 60%)` }} />
        <div className="absolute top-2 left-2 right-2 flex items-start justify-between">
          <div className="flex items-center gap-1.5">
            <Badge className="bg-black/30 text-white border-0 text-[9px] font-black uppercase tracking-widest backdrop-blur-sm">
              {phaseLabel}
            </Badge>
          </div>
          <div className={cn(
            "h-6 w-6 rounded-full grid place-items-center transition-all backdrop-blur-sm",
            selected ? "bg-primary" : "bg-black/20 opacity-0 group-hover:opacity-100",
          )}>
            {selected ? <Check className="h-4 w-4 text-primary-foreground" /> : <Plus className="h-4 w-4 text-white" />}
          </div>
        </div>
        <div className="absolute bottom-2 left-3 right-3">
          <p className="text-[9px] uppercase tracking-widest font-black text-white/80">{pillar?.name}</p>
        </div>
      </div>

      {/* BODY */}
      <div className="flex-1 flex flex-col p-3 gap-2 min-h-0">
        <h3 className="font-display font-black text-sm leading-tight line-clamp-2">{card.title}</h3>
        {card.subtitle && (
          <p className="text-[11px] text-muted-foreground line-clamp-1 -mt-1">{card.subtitle}</p>
        )}
        <p className="text-xs text-foreground/80 leading-snug line-clamp-4 flex-1">
          {card.definition || card.objective || "—"}
        </p>

        <div className="flex items-center justify-between pt-1 border-t border-border/60 mt-auto">
          <div className="flex gap-0.5">
            {[1, 2, 3, 4, 5].map(i => (
              <Star key={i} className={cn("h-2.5 w-2.5", i <= 4 ? "fill-amber-400 text-amber-400" : "text-muted-foreground/30")} />
            ))}
          </div>
          <button
            onClick={(e) => { e.stopPropagation(); onQuickAdd(); }}
            className="text-[10px] font-bold uppercase tracking-wider text-primary hover:underline inline-flex items-center gap-1"
            style={{ color }}
          >
            <Plus className="h-3 w-3" /> Vite ajouter
          </button>
        </div>
      </div>

      {placed && (
        <div className="absolute top-2 right-2 z-10">
          <Badge className="bg-emerald-600 text-white text-[9px] font-black uppercase tracking-widest border-0">✓ Placée</Badge>
        </div>
      )}
    </motion.div>
  );
}

function CustomCardsTab({
  customCards, pillars, currentSubjectId, onCreate,
}: {
  customCards: ChallengeArtifact[];
  pillars: DbPillar[];
  currentSubjectId?: string | null;
  onCreate?: (input: CreateArtifactInput) => Promise<any>;
}) {
  const [title, setTitle] = useState("");
  const [definition, setDefinition] = useState("");
  const [pillarId, setPillarId] = useState<string>(pillars[0]?.id || "");
  const [phase, setPhase] = useState<string>("foundations");
  const [creating, setCreating] = useState(false);

  const submit = async () => {
    if (!title.trim() || !onCreate) return;
    setCreating(true);
    await onCreate({
      kind: "card",
      content: title.trim(),
      subject_id: currentSubjectId ?? null,
      scope: "subject",
      visibility_subject_id: currentSubjectId ?? null,
      is_custom_card: true,
      card_payload: {
        title: title.trim(),
        definition: definition.trim() || null,
        pillar_id: pillarId || null,
        phase,
        custom: true,
      },
      ai_meta: { created_via: "card_explorer_form" },
    });
    setTitle("");
    setDefinition("");
    setCreating(false);
    toast.success("Carte créée — visible uniquement sur ce sujet pour vous");
  };

  return (
    <div className="flex-1 min-h-0 grid lg:grid-cols-[420px_1fr] overflow-hidden">
      {/* CREATE */}
      <div className="border-r border-border p-5 overflow-y-auto bg-muted/20">
        <div className="flex items-center gap-2 mb-4">
          <Wand2 className="h-4 w-4 text-primary" />
          <h3 className="font-display font-black text-sm uppercase tracking-widest">Créer ma carte</h3>
        </div>
        <p className="text-[11px] text-muted-foreground mb-5 leading-relaxed">
          Vos cartes sont <strong>privées</strong> et associées au sujet courant. Elles n'apparaissent que pour vous.
        </p>

        <div className="space-y-4">
          <div>
            <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1.5 block">Titre</label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ex. Onboarding low-touch" maxLength={60} />
          </div>
          <div>
            <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1.5 block">Définition / objectif</label>
            <Textarea value={definition} onChange={(e) => setDefinition(e.target.value)} rows={4} placeholder="À quoi sert cette carte ?" maxLength={400} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1.5 block">Pilier</label>
              <select value={pillarId} onChange={(e) => setPillarId(e.target.value)} className="w-full h-9 rounded-md border border-input bg-background px-2 text-xs font-medium">
                {pillars.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
            <div>
              <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1.5 block">Phase</label>
              <select value={phase} onChange={(e) => setPhase(e.target.value)} className="w-full h-9 rounded-md border border-input bg-background px-2 text-xs font-medium">
                {Object.entries(PHASE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>
          </div>
          <Button onClick={submit} disabled={!title.trim() || !currentSubjectId || creating} className="w-full font-bold">
            <Sparkles className="h-4 w-4 mr-1" /> {creating ? "Création…" : "Créer la carte"}
          </Button>
          {!currentSubjectId && (
            <p className="text-[10px] text-amber-600 text-center">Sélectionnez un sujet pour créer une carte privée.</p>
          )}
        </div>
      </div>

      {/* LIST */}
      <ScrollArea className="min-h-0">
        <div className="p-5">
          <div className="flex items-center gap-2 mb-4">
            <Star className="h-4 w-4 text-amber-500" />
            <h3 className="font-display font-black text-sm uppercase tracking-widest">Mes cartes ({customCards.length})</h3>
          </div>
          {customCards.length === 0 ? (
            <div className="border border-dashed border-border rounded-xl py-16 text-center text-sm text-muted-foreground">
              Aucune carte personnelle pour ce sujet.
            </div>
          ) : (
            <div className="grid gap-4" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))" }}>
              {customCards.map(art => {
                const p = pillars.find(x => x.id === (art.card_payload as any)?.pillar_id);
                const fakeCard = {
                  id: art.id,
                  title: (art.card_payload as any)?.title || art.content || "Carte",
                  subtitle: null,
                  definition: (art.card_payload as any)?.definition || "",
                  objective: "",
                  phase: (art.card_payload as any)?.phase || "foundations",
                  pillar_id: (art.card_payload as any)?.pillar_id || null,
                } as any as DbCard;
                return (
                  <ShowcaseCard
                    key={art.id}
                    card={fakeCard}
                    pillar={p}
                    selected={false}
                    onToggle={() => {}}
                    onQuickAdd={() => {}}
                  />
                );
              })}
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
