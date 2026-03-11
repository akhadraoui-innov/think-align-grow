import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Plus, Loader2, Trash2, Save, ChevronDown, GitBranch, Puzzle } from "lucide-react";
import type { Tables } from "@/integrations/supabase/types";

type Subject = Tables<"challenge_subjects"> & { challenge_slots: Tables<"challenge_slots">[] };

interface Props {
  subjects: Subject[];
  templateId: string;
  onUpdate: () => void;
}

const TYPE_MAP: Record<string, { label: string; variant: "default" | "secondary" | "outline" }> = {
  question: { label: "Question", variant: "default" },
  challenge: { label: "Challenge", variant: "secondary" },
  context: { label: "Contexte", variant: "outline" },
};

const SLOT_TYPE_MAP: Record<string, string> = {
  single: "Simple",
  multi: "Multiple",
  ranked: "Classé",
};

export function ChallengeSubjectsTab({ subjects, templateId, onUpdate }: Props) {
  const { toast } = useToast();
  const [openId, setOpenId] = useState<string | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [addingSlot, setAddingSlot] = useState<string | null>(null);
  const [editForms, setEditForms] = useState<Record<string, any>>({});
  const [newSubject, setNewSubject] = useState({ title: "", type: "question" as string, description: "" });
  const [newSlots, setNewSlots] = useState<Record<string, { label: string; slot_type: string; hint: string; required: boolean }>>({});

  const getEditForm = (s: Subject) => editForms[s.id] || {
    title: s.title, description: s.description || "", type: s.type, sort_order: s.sort_order,
  };

  const setField = (id: string, key: string, value: any) => {
    const subject = subjects.find((s) => s.id === id)!;
    setEditForms((prev) => ({
      ...prev,
      [id]: { ...getEditForm(subject), ...prev[id], [key]: value },
    }));
  };

  const handleSaveSubject = async (s: Subject) => {
    setSavingId(s.id);
    try {
      const form = getEditForm(s);
      const { error } = await supabase.from("challenge_subjects").update({
        title: form.title, description: form.description || null,
        type: form.type, sort_order: form.sort_order,
      }).eq("id", s.id);
      if (error) throw error;
      toast({ title: "Sujet mis à jour" });
      setEditForms((prev) => { const n = { ...prev }; delete n[s.id]; return n; });
      onUpdate();
    } catch (e: any) {
      toast({ title: "Erreur", description: e.message, variant: "destructive" });
    } finally { setSavingId(null); }
  };

  const handleDeleteSubject = async (id: string) => {
    const { error } = await supabase.from("challenge_subjects").delete().eq("id", id);
    if (error) toast({ title: "Erreur", description: error.message, variant: "destructive" });
    else { toast({ title: "Sujet supprimé" }); onUpdate(); }
  };

  const handleAddSubject = async () => {
    if (!newSubject.title) return;
    setAdding(true);
    try {
      const { error } = await supabase.from("challenge_subjects").insert({
        title: newSubject.title, type: newSubject.type as any,
        description: newSubject.description || null,
        template_id: templateId, sort_order: subjects.length,
      });
      if (error) throw error;
      toast({ title: "Sujet ajouté" });
      setNewSubject({ title: "", type: "question", description: "" });
      onUpdate();
    } catch (e: any) {
      toast({ title: "Erreur", description: e.message, variant: "destructive" });
    } finally { setAdding(false); }
  };

  const handleAddSlot = async (subjectId: string) => {
    const slot = newSlots[subjectId];
    if (!slot?.label) return;
    setAddingSlot(subjectId);
    try {
      const subject = subjects.find((s) => s.id === subjectId)!;
      const { error } = await supabase.from("challenge_slots").insert({
        label: slot.label, slot_type: slot.slot_type as any,
        hint: slot.hint || null, required: slot.required,
        subject_id: subjectId, sort_order: subject.challenge_slots.length,
      });
      if (error) throw error;
      toast({ title: "Slot ajouté" });
      setNewSlots((prev) => { const n = { ...prev }; delete n[subjectId]; return n; });
      onUpdate();
    } catch (e: any) {
      toast({ title: "Erreur", description: e.message, variant: "destructive" });
    } finally { setAddingSlot(null); }
  };

  const handleDeleteSlot = async (slotId: string) => {
    const { error } = await supabase.from("challenge_slots").delete().eq("id", slotId);
    if (error) toast({ title: "Erreur", description: error.message, variant: "destructive" });
    else { toast({ title: "Slot supprimé" }); onUpdate(); }
  };

  const getNewSlot = (subjectId: string) => newSlots[subjectId] || { label: "", slot_type: "single", hint: "", required: false };
  const setNewSlotField = (subjectId: string, key: string, value: any) => {
    setNewSlots((prev) => ({ ...prev, [subjectId]: { ...getNewSlot(subjectId), [key]: value } }));
  };

  return (
    <div className="space-y-4">
      {subjects.map((s) => {
        const form = getEditForm(s);
        const isOpen = openId === s.id;
        const typeInfo = TYPE_MAP[s.type] || TYPE_MAP.question;
        return (
          <Collapsible key={s.id} open={isOpen} onOpenChange={() => setOpenId(isOpen ? null : s.id)}>
            <div className="rounded-xl border border-border/40 bg-card overflow-hidden shadow-sm transition-shadow hover:shadow-md">
              <CollapsibleTrigger asChild>
                <button className="w-full flex items-center gap-3 px-5 py-3.5 hover:bg-muted/20 transition-all text-left group">
                  <GitBranch className="h-4 w-4 text-primary/60 shrink-0" />
                  <span className="font-semibold text-sm text-foreground flex-1 tracking-tight">{s.title}</span>
                  <Badge variant={typeInfo.variant} className="text-[10px] font-medium">{typeInfo.label}</Badge>
                  <Badge variant="outline" className="text-[10px] font-mono">{s.challenge_slots.length} slot{s.challenge_slots.length > 1 ? "s" : ""}</Badge>
                  <Badge variant="outline" className="text-[10px] font-mono">#{s.sort_order}</Badge>
                  <ChevronDown className={`h-4 w-4 text-muted-foreground/40 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} />
                </button>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="border-t border-border/30 p-5 space-y-5 bg-muted/5">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div className="space-y-1.5">
                      <Label className="text-xs text-muted-foreground">Titre</Label>
                      <Input value={form.title} onChange={(e) => setField(s.id, "title", e.target.value)} className="h-9" />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs text-muted-foreground">Type</Label>
                      <Select value={form.type} onValueChange={(v) => setField(s.id, "type", v)}>
                        <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="question">Question</SelectItem>
                          <SelectItem value="challenge">Challenge</SelectItem>
                          <SelectItem value="context">Contexte</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs text-muted-foreground">Ordre</Label>
                      <Input type="number" value={form.sort_order} onChange={(e) => setField(s.id, "sort_order", parseInt(e.target.value) || 0)} className="h-9" />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground">Description</Label>
                    <Textarea value={form.description} onChange={(e) => setField(s.id, "description", e.target.value)} rows={2} className="resize-none" />
                  </div>

                  <Separator className="bg-border/20" />

                  {/* Slots */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      <Puzzle className="h-3.5 w-3.5" /> Slots
                    </div>
                    {s.challenge_slots.sort((a, b) => a.sort_order - b.sort_order).map((slot) => (
                      <div key={slot.id} className="flex items-center gap-3 rounded-lg border border-border/30 bg-background px-4 py-2.5">
                        <span className="text-sm font-medium text-foreground flex-1">{slot.label}</span>
                        <Badge variant="outline" className="text-[10px]">{SLOT_TYPE_MAP[slot.slot_type] || slot.slot_type}</Badge>
                        {slot.required && <Badge variant="secondary" className="text-[10px]">Requis</Badge>}
                        {slot.hint && <span className="text-[11px] text-muted-foreground/60 max-w-[120px] truncate">{slot.hint}</span>}
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive/60 hover:text-destructive" onClick={() => handleDeleteSlot(slot.id)}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    ))}

                    {/* Add slot */}
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-2 pt-1">
                      <Input placeholder="Label du slot" value={getNewSlot(s.id).label} onChange={(e) => setNewSlotField(s.id, "label", e.target.value)} className="h-8 text-xs" />
                      <Select value={getNewSlot(s.id).slot_type} onValueChange={(v) => setNewSlotField(s.id, "slot_type", v)}>
                        <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="single">Simple</SelectItem>
                          <SelectItem value="multi">Multiple</SelectItem>
                          <SelectItem value="ranked">Classé</SelectItem>
                        </SelectContent>
                      </Select>
                      <Input placeholder="Indice" value={getNewSlot(s.id).hint} onChange={(e) => setNewSlotField(s.id, "hint", e.target.value)} className="h-8 text-xs" />
                      <label className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <input type="checkbox" checked={getNewSlot(s.id).required} onChange={(e) => setNewSlotField(s.id, "required", e.target.checked)} className="rounded" />
                        Requis
                      </label>
                      <Button size="sm" variant="outline" onClick={() => handleAddSlot(s.id)} disabled={addingSlot === s.id} className="h-8 gap-1 text-xs">
                        {addingSlot === s.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <Plus className="h-3 w-3" />} Slot
                      </Button>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 pt-3 border-t border-border/20">
                    <Button size="sm" onClick={() => handleSaveSubject(s)} disabled={savingId === s.id} className="gap-1.5 h-8">
                      {savingId === s.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                      Enregistrer
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => handleDeleteSubject(s.id)} className="text-destructive hover:text-destructive gap-1.5 h-8 ml-auto">
                      <Trash2 className="h-3.5 w-3.5" /> Supprimer
                    </Button>
                  </div>
                </div>
              </CollapsibleContent>
            </div>
          </Collapsible>
        );
      })}

      {subjects.length === 0 && (
        <div className="rounded-xl border border-border/40 bg-card p-12 text-center text-muted-foreground/60 text-sm">Aucun sujet</div>
      )}

      <div className="rounded-xl border border-dashed border-border/40 bg-muted/5 p-5">
        <h4 className="text-sm font-semibold text-foreground mb-3 tracking-tight">Ajouter un sujet</h4>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <Input placeholder="Titre" value={newSubject.title} onChange={(e) => setNewSubject((f) => ({ ...f, title: e.target.value }))} className="h-9" />
          <Select value={newSubject.type} onValueChange={(v) => setNewSubject((f) => ({ ...f, type: v }))}>
            <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="question">Question</SelectItem>
              <SelectItem value="challenge">Challenge</SelectItem>
              <SelectItem value="context">Contexte</SelectItem>
            </SelectContent>
          </Select>
          <Input placeholder="Description (optionnel)" value={newSubject.description} onChange={(e) => setNewSubject((f) => ({ ...f, description: e.target.value }))} className="h-9" />
          <Button onClick={handleAddSubject} disabled={adding} size="sm" className="gap-2 h-9">
            {adding ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            Ajouter
          </Button>
        </div>
      </div>
    </div>
  );
}
