import { useState } from "react";
import { Library, Plus, Trash2, Search, Globe2, Building2, Crown } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { usePracticeBlocks, useUpsertBlock, useDeleteBlock } from "@/hooks/useAdminPractices";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";

const KINDS = [
  { value: "persona", label: "Persona", color: "bg-blue-500/10 text-blue-700 dark:text-blue-300" },
  { value: "rubric", label: "Rubric", color: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300" },
  { value: "guardrail", label: "Garde-fou", color: "bg-rose-500/10 text-rose-700 dark:text-rose-300" },
  { value: "mechanic", label: "Mécanique", color: "bg-violet-500/10 text-violet-700 dark:text-violet-300" },
  { value: "prompt_snippet", label: "Snippet", color: "bg-amber-500/10 text-amber-700 dark:text-amber-300" },
];

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onInsert?: (block: any) => void;
}

export function BlockLibrary({ open, onOpenChange, onInsert }: Props) {
  const [tab, setTab] = useState("browse");
  const [filterKind, setFilterKind] = useState<string>("all");
  const [filterScope, setFilterScope] = useState<"all" | "mine" | "global">("all");
  const [search, setSearch] = useState("");
  const { data: blocks = [] } = usePracticeBlocks();
  const upsert = useUpsertBlock();
  const remove = useDeleteBlock();
  const { user } = useAuth();

  // Super-admin gating: only super_admin can promote a block to global
  const { data: isSuperAdmin = false } = useQuery({
    queryKey: ["is-super-admin", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase.rpc("has_role", { _user_id: user!.id, _role: "super_admin" as any });
      return !!data;
    },
  });

  // New block draft — Org-only by default (security-first)
  const [draft, setDraft] = useState({ kind: "persona", name: "", description: "", content: "", is_global: false });

  const filtered = blocks.filter((b: any) => {
    if (filterKind !== "all" && b.kind !== filterKind) return false;
    if (filterScope === "global" && !b.is_global) return false;
    if (filterScope === "mine" && b.created_by !== user?.id) return false;
    if (search && !b.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const handleCreate = () => {
    if (!draft.name.trim()) return;
    if (draft.is_global && !isSuperAdmin) {
      toast.error("Seul un super-admin peut créer un bloc global");
      return;
    }
    let content: any = draft.content;
    try { content = JSON.parse(draft.content); } catch { content = { text: draft.content }; }
    upsert.mutate({
      kind: draft.kind,
      name: draft.name,
      description: draft.description,
      content,
      is_global: draft.is_global,
    }, {
      onSuccess: () => {
        setDraft({ kind: "persona", name: "", description: "", content: "", is_global: false });
        setTab("browse");
      },
    });
  };

  const handlePromote = async (id: string) => {
    if (!isSuperAdmin) { toast.error("Réservé aux super-admins"); return; }
    const { error } = await supabase.from("practice_blocks").update({ is_global: true }).eq("id", id);
    if (error) toast.error(error.message); else toast.success("Bloc promu en global");
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-[560px] sm:max-w-[560px] flex flex-col">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Library className="h-4 w-4 text-primary" />
            Bibliothèque de blocs
          </SheetTitle>
          <SheetDescription>Personae, rubrics, garde-fous, mécaniques, snippets — réutilisables.</SheetDescription>
        </SheetHeader>

        <Tabs value={tab} onValueChange={setTab} className="flex-1 flex flex-col mt-4 min-h-0">
          <TabsList className="self-start">
            <TabsTrigger value="browse">Parcourir · {blocks.length}</TabsTrigger>
            <TabsTrigger value="create">Créer</TabsTrigger>
          </TabsList>

          <TabsContent value="browse" className="flex-1 mt-3 min-h-0 flex flex-col">
            <div className="flex gap-2 mb-3">
              <div className="relative flex-1">
                <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Rechercher…" className="pl-7 h-8 text-xs" />
              </div>
              <Select value={filterKind} onValueChange={setFilterKind}>
                <SelectTrigger className="h-8 w-28 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous types</SelectItem>
                  {KINDS.map(k => <SelectItem key={k.value} value={k.value}>{k.label}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={filterScope} onValueChange={(v: any) => setFilterScope(v)}>
                <SelectTrigger className="h-8 w-28 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous</SelectItem>
                  <SelectItem value="mine">Mes blocs</SelectItem>
                  <SelectItem value="global">Globaux</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <ScrollArea className="flex-1 -mx-6 px-6">
              <div className="space-y-2">
                {filtered.map((b: any) => {
                  const kind = KINDS.find(k => k.value === b.kind);
                  return (
                    <div key={b.id} className="rounded-lg border border-border/60 p-3 hover:border-primary/40 transition-colors">
                      <div className="flex items-start justify-between gap-2 mb-1.5">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="text-xs font-semibold truncate">{b.name}</p>
                            {b.is_global && <Globe2 className="h-3 w-3 text-muted-foreground" />}
                          </div>
                          {b.description && <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-2">{b.description}</p>}
                        </div>
                        <Badge variant="outline" className={`text-[9px] shrink-0 ${kind?.color ?? ""}`}>{kind?.label ?? b.kind}</Badge>
                      </div>
                      <div className="flex gap-1.5 mt-2">
                        {onInsert && (
                          <Button size="sm" variant="outline" onClick={() => onInsert(b)} className="h-7 text-[11px]">
                            Insérer
                          </Button>
                        )}
                        <Button size="sm" variant="ghost" onClick={() => remove.mutate(b.id)} className="h-7 px-2 ml-auto">
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
                {filtered.length === 0 && (
                  <p className="text-xs text-muted-foreground text-center py-12">Aucun bloc</p>
                )}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="create" className="flex-1 mt-3 min-h-0">
            <ScrollArea className="h-full -mx-6 px-6">
              <div className="space-y-3">
                <div>
                  <Label className="text-xs">Type</Label>
                  <Select value={draft.kind} onValueChange={v => setDraft({ ...draft, kind: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {KINDS.map(k => <SelectItem key={k.value} value={k.value}>{k.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs">Nom</Label>
                  <Input value={draft.name} onChange={e => setDraft({ ...draft, name: e.target.value })} placeholder="Ex. Persona Tech Lead exigeant" />
                </div>
                <div>
                  <Label className="text-xs">Description</Label>
                  <Input value={draft.description} onChange={e => setDraft({ ...draft, description: e.target.value })} placeholder="Pour quel contexte…" />
                </div>
                <div>
                  <Label className="text-xs">Contenu (JSON ou texte)</Label>
                  <Textarea
                    value={draft.content}
                    onChange={e => setDraft({ ...draft, content: e.target.value })}
                    rows={10}
                    className="font-mono text-xs"
                    placeholder='{"system": "Tu es...", "tone": "..."}'
                  />
                </div>
                <Button onClick={handleCreate} disabled={!draft.name.trim() || upsert.isPending} className="w-full">
                  <Plus className="h-3.5 w-3.5 mr-1.5" /> Enregistrer le bloc
                </Button>
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </SheetContent>
    </Sheet>
  );
}
