import { useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Plus, Loader2, EyeOff } from "lucide-react";
import { CRITICALITY_META, PROFESSIONAL_EMOJIS } from "../constants";
import type { Criticality, CreateArtifactInput } from "@/hooks/useChallengeArtifacts";
import { cn } from "@/lib/utils";

interface Props {
  onCreate: (input: CreateArtifactInput) => Promise<any>;
  defaultSubjectId?: string | null;
}

export function PostitComposer({ onCreate, defaultSubjectId }: Props) {
  const [open, setOpen] = useState(false);
  const [content, setContent] = useState("");
  const [emoji, setEmoji] = useState<string | null>("💡");
  const [criticality, setCriticality] = useState<Criticality>("medium");
  const [category, setCategory] = useState("");
  const [busy, setBusy] = useState(false);
  const [anon, setAnon] = useState(false);

  const submit = async () => {
    if (!content.trim()) return;
    setBusy(true);
    const created = await onCreate({
      kind: "postit",
      content: content.trim(),
      emoji,
      criticality,
      category: category.trim() || null,
      subject_id: defaultSubjectId ?? null,
      is_anonymous: anon,
    });
    setBusy(false);
    if (created) {
      setContent(""); setCategory(""); setOpen(false);
    }
  };

  if (!open) {
    return (
      <Button variant="outline" size="sm" onClick={() => setOpen(true)} className="w-full justify-start font-bold">
        <Plus className="h-4 w-4 mr-2" /> Ajouter un post-it
      </Button>
    );
  }

  return (
    <div className="rounded-xl border border-border bg-card p-3 space-y-3">
      <Textarea
        autoFocus
        value={content}
        onChange={(e) => setContent(e.target.value)}
        rows={3}
        placeholder="Une idée, une alerte, un insight…"
        className="resize-none"
      />

      <div>
        <p className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground mb-1.5">Emoji</p>
        <div className="flex flex-wrap gap-1">
          {PROFESSIONAL_EMOJIS.map((p) => (
            <button
              key={p.e}
              type="button"
              title={p.label}
              onClick={() => setEmoji(p.e === emoji ? null : p.e)}
              className={cn(
                "h-7 w-7 rounded-md text-base flex items-center justify-center hover:bg-muted transition-colors",
                emoji === p.e && "ring-2 ring-primary bg-primary/5",
              )}
            >{p.e}</button>
          ))}
        </div>
      </div>

      <div>
        <p className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground mb-1.5">Criticité</p>
        <div className="grid grid-cols-4 gap-1">
          {(Object.keys(CRITICALITY_META) as Criticality[]).map((c) => {
            const m = CRITICALITY_META[c];
            return (
              <button
                key={c}
                type="button"
                onClick={() => setCriticality(c)}
                className={cn(
                  "rounded-md py-1.5 text-[10px] font-bold uppercase tracking-wider ring-1 transition-all",
                  m.bg, m.text, m.ring,
                  criticality === c ? "ring-2 scale-[1.02]" : "opacity-70 hover:opacity-100",
                )}
              >{m.label}</button>
            );
          })}
        </div>
      </div>

      <Input
        value={category}
        onChange={(e) => setCategory(e.target.value)}
        placeholder="Catégorie (optionnelle) — ex : Risque, Marché…"
        className="h-8 text-xs"
      />

      <div className="flex justify-between gap-2 items-center">
        <button
          type="button"
          onClick={() => setAnon(v => !v)}
          className={cn("flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded", anon ? "bg-amber-500/15 text-amber-700" : "text-muted-foreground hover:bg-muted")}
        >
          <EyeOff className="h-3 w-3" /> {anon ? "Anonyme" : "Public"}
        </button>
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" onClick={() => { setOpen(false); setContent(""); }}>Annuler</Button>
          <Button size="sm" onClick={submit} disabled={busy || !content.trim()} className="font-bold">
            {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> : null}
            Publier
          </Button>
        </div>
      </div>
    </div>
  );
}
