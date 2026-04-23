import { useState } from "react";
import { History, RotateCcw, Eye } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card } from "@/components/ui/card";
import { useEmailTemplateVersions, useRestoreEmailTemplateVersion, EmailTemplateVersion } from "@/hooks/useEmailTemplateVersions";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { toast } from "sonner";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  templateId: string | null;
  currentSubject: string;
  currentMarkdown: string;
}

function diffLines(oldText: string, newText: string) {
  const oldLines = oldText.split("\n");
  const newLines = newText.split("\n");
  const max = Math.max(oldLines.length, newLines.length);
  const result: { type: "same" | "removed" | "added"; text: string }[] = [];
  for (let i = 0; i < max; i++) {
    const o = oldLines[i] ?? "";
    const n = newLines[i] ?? "";
    if (o === n) result.push({ type: "same", text: o });
    else {
      if (o) result.push({ type: "removed", text: o });
      if (n) result.push({ type: "added", text: n });
    }
  }
  return result;
}

export function EmailVersionsDrawer({ open, onOpenChange, templateId, currentSubject, currentMarkdown }: Props) {
  const { data: versions = [], isLoading } = useEmailTemplateVersions(templateId);
  const restore = useRestoreEmailTemplateVersion();
  const [previewVersion, setPreviewVersion] = useState<EmailTemplateVersion | null>(null);

  const handleRestore = async (v: EmailTemplateVersion) => {
    if (!templateId) return;
    try {
      await restore.mutateAsync({ templateId, version: v });
      toast.success(`Version v${v.version} restaurée`);
      onOpenChange(false);
    } catch (e: any) {
      toast.error("Restauration impossible", { description: e?.message });
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-[720px] sm:max-w-[720px] overflow-hidden flex flex-col">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <History className="h-4 w-4" />
            Historique des versions
          </SheetTitle>
        </SheetHeader>

        <div className="flex-1 grid grid-cols-2 gap-3 mt-4 min-h-0">
          {/* Versions list */}
          <ScrollArea className="border border-border rounded-lg">
            <div className="p-2 space-y-1">
              {isLoading && <p className="text-xs text-muted-foreground p-2">Chargement…</p>}
              {!isLoading && versions.length === 0 && (
                <p className="text-xs text-muted-foreground p-4 text-center">Aucune version antérieure</p>
              )}
              {versions.map(v => (
                <button
                  key={v.id}
                  onClick={() => setPreviewVersion(v)}
                  className={`w-full text-left p-2 rounded-md text-xs transition-colors ${
                    previewVersion?.id === v.id ? "bg-primary/10" : "hover:bg-muted"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <Badge variant="outline" className="text-[10px]">v{v.version}</Badge>
                    <span className="text-[10px] text-muted-foreground">
                      {format(new Date(v.created_at), "dd MMM HH:mm", { locale: fr })}
                    </span>
                  </div>
                  <p className="mt-1 truncate text-foreground/80">{v.subject}</p>
                </button>
              ))}
            </div>
          </ScrollArea>

          {/* Preview / diff */}
          <div className="border border-border rounded-lg flex flex-col min-h-0">
            {previewVersion ? (
              <>
                <div className="p-3 border-b border-border flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Eye className="h-3 w-3" />
                    <span className="text-xs font-semibold">v{previewVersion.version} — diff</span>
                  </div>
                  <Button size="sm" variant="default" onClick={() => handleRestore(previewVersion)} disabled={restore.isPending}>
                    <RotateCcw className="h-3 w-3 mr-1" />
                    Restaurer
                  </Button>
                </div>
                <ScrollArea className="flex-1">
                  <div className="p-3 space-y-3">
                    <Card className="p-3">
                      <div className="text-[10px] text-muted-foreground mb-1">Sujet (cette version → actuel)</div>
                      <div className="space-y-1 text-xs font-mono">
                        <div className="line-through text-destructive">{previewVersion.subject}</div>
                        <div className="text-emerald-600">{currentSubject}</div>
                      </div>
                    </Card>
                    <Card className="p-3">
                      <div className="text-[10px] text-muted-foreground mb-2">Corps (diff ligne par ligne)</div>
                      <div className="font-mono text-[11px] leading-relaxed">
                        {diffLines(previewVersion.markdown_body, currentMarkdown).map((d, i) => (
                          <div
                            key={i}
                            className={
                              d.type === "added" ? "bg-emerald-500/10 text-emerald-700" :
                              d.type === "removed" ? "bg-destructive/10 text-destructive line-through" :
                              "text-muted-foreground"
                            }
                          >
                            <span className="select-none mr-1">{d.type === "added" ? "+" : d.type === "removed" ? "-" : " "}</span>
                            {d.text || " "}
                          </div>
                        ))}
                      </div>
                    </Card>
                  </div>
                </ScrollArea>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-xs text-muted-foreground">
                Sélectionnez une version pour voir le diff
              </div>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
