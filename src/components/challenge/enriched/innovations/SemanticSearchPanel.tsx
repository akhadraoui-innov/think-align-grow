import { useState, useCallback } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Search, Sparkles } from "lucide-react";
import { useChallengeRAG, type RagMatch, type RagSourceType } from "@/hooks/useChallengeRAG";
import { cn } from "@/lib/utils";

const KIND_LABEL: Record<RagSourceType, string> = {
  artifact: "Artefact",
  card: "Carte",
  subject: "Sujet",
  slot: "Slot",
  briefing: "Briefing",
  thread: "Fil",
  synthesis: "Synthèse",
};

const KIND_COLOR: Record<RagSourceType, string> = {
  artifact: "bg-blue-500/15 text-blue-700 dark:text-blue-300",
  card: "bg-violet-500/15 text-violet-700 dark:text-violet-300",
  subject: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300",
  slot: "bg-amber-500/15 text-amber-700 dark:text-amber-300",
  briefing: "bg-slate-500/15 text-slate-700 dark:text-slate-300",
  thread: "bg-pink-500/15 text-pink-700 dark:text-pink-300",
  synthesis: "bg-orange-500/15 text-orange-700 dark:text-orange-300",
};

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  sessionId: string;
  onJump?: (match: RagMatch) => void;
}

const ALL_KINDS: RagSourceType[] = ["artifact", "card", "subject", "slot", "briefing", "thread", "synthesis"];

export function SemanticSearchPanel({ open, onOpenChange, sessionId, onJump }: Props) {
  const { search, matches, loading, error } = useChallengeRAG(sessionId);
  const [query, setQuery] = useState("");
  const [kinds, setKinds] = useState<Set<RagSourceType>>(new Set(ALL_KINDS));

  const toggleKind = useCallback((k: RagSourceType) => {
    setKinds(prev => {
      const next = new Set(prev);
      next.has(k) ? next.delete(k) : next.add(k);
      return next.size === 0 ? new Set(ALL_KINDS) : next;
    });
  }, []);

  const submit = useCallback((e?: React.FormEvent) => {
    e?.preventDefault();
    if (!query.trim()) return;
    search(query, { kinds: Array.from(kinds), k: 12 });
  }, [query, kinds, search]);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-[420px] sm:max-w-[420px] flex flex-col gap-0 p-0">
        <SheetHeader className="px-4 py-3 border-b border-border">
          <SheetTitle className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider">
            <Sparkles className="h-4 w-4 text-primary" /> Recherche sémantique
          </SheetTitle>
        </SheetHeader>

        <form onSubmit={submit} className="px-4 py-3 border-b border-border space-y-2 shrink-0">
          <div className="flex gap-2">
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Décris ce que tu cherches…"
              autoFocus
            />
            <Button type="submit" size="icon" disabled={loading || !query.trim()}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
            </Button>
          </div>
          <div className="flex flex-wrap gap-1">
            {ALL_KINDS.map(k => (
              <button
                key={k}
                type="button"
                onClick={() => toggleKind(k)}
                className={cn(
                  "text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border transition-colors",
                  kinds.has(k)
                    ? "border-primary/40 bg-primary/10 text-primary"
                    : "border-border text-muted-foreground hover:bg-muted"
                )}
              >
                {KIND_LABEL[k]}
              </button>
            ))}
          </div>
        </form>

        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {error && <p className="text-xs text-destructive px-2">{error}</p>}
          {!loading && matches.length === 0 && (
            <p className="text-xs text-muted-foreground text-center py-10">
              {query ? "Aucun résultat. Affine ta requête." : "Tape une requête pour explorer la mémoire de la session."}
            </p>
          )}
          {matches.map(m => (
            <button
              key={m.id}
              onClick={() => onJump?.(m)}
              className="w-full text-left rounded-lg border border-border p-3 hover:bg-muted/40 transition-colors space-y-1.5"
            >
              <div className="flex items-center justify-between gap-2">
                <Badge variant="outline" className={cn("text-[9px] uppercase tracking-wider", KIND_COLOR[m.source_type])}>
                  {KIND_LABEL[m.source_type]}
                </Badge>
                <span className="text-[10px] tabular-nums text-muted-foreground">
                  {(m.similarity * 100).toFixed(0)}%
                </span>
              </div>
              <p className="text-xs leading-snug line-clamp-4">{m.content}</p>
            </button>
          ))}
        </div>
      </SheetContent>
    </Sheet>
  );
}
