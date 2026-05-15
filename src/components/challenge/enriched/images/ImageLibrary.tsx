import { useState, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Upload, Sparkles, Smile, Loader2, ImageIcon } from "lucide-react";
import { useChallengeImages } from "@/hooks/useChallengeImages";
import type { CreateArtifactInput } from "@/hooks/useChallengeArtifacts";
import { cn } from "@/lib/utils";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  sessionId: string;
  defaultSubjectId?: string | null;
  defaultSlotId?: string | null;
  defaultPosition?: { x: number; y: number } | null;
  onCreate: (input: CreateArtifactInput) => Promise<any>;
}

const STICKERS = [
  "💡","🚀","🎯","⚠️","🔥","⭐","✅","❌","🤔","🧠","📊","📈","📉","🛠️","🔧","⚙️","🔍","📌","💬","🗣️","📝","📋","🏆","💎","🎨","🌟","⚡","🌈","🎉","🚧","🛑","✨","🤝","👥","👤","💼","📅","⏰","⏳","🔔","📣","🎤","🎧","📱","💻","🖥️","🖨️","🛰️","🌍","🌎","🌐","🗺️","🧭","🚦","🚥","💰","💳","💸","💵","🪙","📦","📮","🏷️"
];

export function ImageLibrary({ open, onOpenChange, sessionId, defaultSubjectId, defaultSlotId, defaultPosition, onCreate }: Props) {
  const { uploadFile, generate, uploading, generating } = useChallengeImages(sessionId);
  const [prompt, setPrompt] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);

  const make = async (url: string, alt: string) => {
    await onCreate({
      kind: "image",
      content: url,
      ai_meta: { alt },
      subject_id: defaultSubjectId ?? null,
      slot_id: defaultSlotId ?? null,
      position: defaultPosition ?? null,
    });
    onOpenChange(false);
  };

  const handleFiles = async (files: FileList | null) => {
    if (!files?.length) return;
    const r = await uploadFile(files[0]);
    if (r) await make(r.url, files[0].name);
  };

  const handleSticker = async (s: string) => {
    await onCreate({
      kind: "image",
      content: null,
      emoji: s,
      ai_meta: { kind: "sticker", value: s },
      subject_id: defaultSubjectId ?? null,
      slot_id: defaultSlotId ?? null,
      position: defaultPosition ?? null,
    });
    onOpenChange(false);
  };

  const handleGen = async () => {
    if (!prompt.trim()) return;
    const r = await generate(prompt.trim());
    if (r) { setPrompt(""); await make(r.url, r.alt); }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="font-display uppercase tracking-wider text-base flex items-center gap-2">
            <ImageIcon className="h-4 w-4 text-primary" /> Bibliothèque d'images
          </DialogTitle>
        </DialogHeader>
        <Tabs defaultValue="upload">
          <TabsList className="grid grid-cols-3 w-full">
            <TabsTrigger value="upload"><Upload className="h-3.5 w-3.5 mr-1.5" /> Importer</TabsTrigger>
            <TabsTrigger value="stickers"><Smile className="h-3.5 w-3.5 mr-1.5" /> Stickers</TabsTrigger>
            <TabsTrigger value="ai"><Sparkles className="h-3.5 w-3.5 mr-1.5" /> Générer IA</TabsTrigger>
          </TabsList>

          <TabsContent value="upload" className="mt-4">
            <div
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={(e) => { e.preventDefault(); setDragOver(false); handleFiles(e.dataTransfer.files); }}
              onClick={() => fileRef.current?.click()}
              className={cn(
                "rounded-xl border-2 border-dashed p-10 text-center cursor-pointer transition-all",
                dragOver ? "border-primary bg-primary/5 scale-[1.01]" : "border-border hover:border-primary/50 hover:bg-muted/40",
              )}
            >
              <Upload className="h-8 w-8 mx-auto mb-3 text-muted-foreground" />
              <p className="font-bold text-sm mb-1">Glisse une image ou clique pour parcourir</p>
              <p className="text-xs text-muted-foreground">PNG · JPG · WebP · GIF · SVG · max 10 Mo</p>
              <input ref={fileRef} type="file" accept="image/*" hidden onChange={(e) => handleFiles(e.target.files)} />
              {uploading && <Loader2 className="h-5 w-5 animate-spin mx-auto mt-3 text-primary" />}
            </div>
          </TabsContent>

          <TabsContent value="stickers" className="mt-4">
            <p className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground mb-2">Pictos & emojis grand format</p>
            <div className="grid grid-cols-10 gap-1.5 max-h-[300px] overflow-y-auto">
              {STICKERS.map(s => (
                <button
                  key={s}
                  onClick={() => handleSticker(s)}
                  className="aspect-square rounded-lg text-2xl hover:bg-muted hover:scale-110 transition-all flex items-center justify-center"
                  title={s}
                >{s}</button>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="ai" className="mt-4 space-y-3">
            <p className="text-xs text-muted-foreground">Décris l'image que tu veux générer. L'IA s'occupe du reste.</p>
            <Input
              autoFocus
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Ex : un schéma minimaliste représentant un parcours client en 4 étapes…"
              onKeyDown={(e) => { if (e.key === "Enter" && !generating) handleGen(); }}
            />
            <div className="flex justify-end">
              <Button onClick={handleGen} disabled={!prompt.trim() || generating} className="font-bold">
                {generating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Sparkles className="h-4 w-4 mr-2" />}
                Générer
              </Button>
            </div>
            {generating && (
              <p className="text-[11px] text-muted-foreground italic text-center">Création en cours, ça peut prendre 10-20 s…</p>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
