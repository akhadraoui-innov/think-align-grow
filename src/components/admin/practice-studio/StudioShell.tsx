import { ReactNode, useEffect, useState } from "react";
import { ArrowLeft, Save, Copy, PlayCircle, Loader2, CheckCircle2, Library, Wand2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";

interface Props {
  list: ReactNode;
  canvas: ReactNode;
  preview: ReactNode;
  title?: string;
  status?: string;
  saving?: boolean;
  lastSavedAt?: Date | null;
  onSave?: () => void;
  onDuplicate?: () => void;
  onPreviewToggle?: () => void;
  showPreview?: boolean;
  onOpenLibrary?: () => void;
  onOpenCopilot?: () => void;
  isPublic?: boolean;
}

function formatSavedAgo(date: Date): string {
  const seconds = Math.max(1, Math.round((Date.now() - date.getTime()) / 1000));
  if (seconds < 60) return `Enregistré ${seconds}s`;
  const min = Math.floor(seconds / 60);
  if (min < 60) return `Enregistré ${min}m`;
  const h = Math.floor(min / 60);
  return `Enregistré ${h}h`;
}

export function StudioShell({
  list, canvas, preview, title, status, saving, lastSavedAt,
  onSave, onDuplicate, onPreviewToggle, showPreview,
  onOpenLibrary, onOpenCopilot, isPublic,
}: Props) {
  const navigate = useNavigate();
  const [, forceTick] = useState(0);

  // Tick every 10s to refresh "Enregistré Xs" label
  useEffect(() => {
    if (!lastSavedAt) return;
    const id = window.setInterval(() => forceTick(t => t + 1), 10_000);
    return () => window.clearInterval(id);
  }, [lastSavedAt]);

  // Keyboard shortcuts
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const meta = e.metaKey || e.ctrlKey;
      if (!meta) return;
      if (e.key === "s") { e.preventDefault(); onSave?.(); }
      else if (e.key === "p" && e.shiftKey) { e.preventDefault(); onPreviewToggle?.(); }
      else if (e.key === "d" && e.shiftKey) { e.preventDefault(); onDuplicate?.(); }
      else if (e.key === "k") { e.preventDefault(); onOpenCopilot?.(); }
      else if (e.key === "l") { e.preventDefault(); onOpenLibrary?.(); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onSave, onPreviewToggle, onDuplicate, onOpenCopilot, onOpenLibrary]);

  const savedLabel = lastSavedAt ? formatSavedAgo(lastSavedAt) : "Non enregistré";

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Top bar */}
      <header className="flex items-center justify-between border-b border-border/60 px-4 h-14 shrink-0 bg-card">
        <div className="flex items-center gap-3 min-w-0">
          <Button variant="ghost" size="sm" onClick={() => navigate("/admin")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="font-display font-semibold text-sm truncate">
                {title ?? "Practice Studio"}
              </h1>
              {status && (
                <Badge variant={status === "published" ? "default" : "secondary"} className="text-[10px] uppercase">
                  {status}
                </Badge>
              )}
              {isPublic && (
                <Badge variant="outline" className="text-[10px] uppercase border-emerald-500/40 text-emerald-600 dark:text-emerald-400">
                  Public
                </Badge>
              )}
            </div>
            <p className="text-[11px] text-muted-foreground flex items-center gap-1.5">
              {saving ? (
                <>
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-primary" />
                  </span>
                  Enregistrement…
                </>
              ) : (
                <><CheckCircle2 className="h-3 w-3 text-emerald-500" /> {savedLabel}</>
              )}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {onOpenLibrary && (
            <Button variant="ghost" size="sm" onClick={onOpenLibrary} title="Bibliothèque (⌘L)">
              <Library className="h-4 w-4 mr-1.5" /> Library
            </Button>
          )}
          {onOpenCopilot && (
            <Button variant="ghost" size="sm" onClick={onOpenCopilot} title="Co-pilote IA (⌘K)">
              <Wand2 className="h-4 w-4 mr-1.5 text-primary" /> Co-pilote
            </Button>
          )}
          {onDuplicate && (
            <Button variant="ghost" size="sm" onClick={onDuplicate} title="Dupliquer (⌘⇧D)">
              <Copy className="h-4 w-4 mr-1.5" /> Dupliquer
            </Button>
          )}
          {onPreviewToggle && (
            <Button variant={showPreview ? "default" : "outline"} size="sm" onClick={onPreviewToggle} title="Live preview (⌘⇧P)">
              <PlayCircle className="h-4 w-4 mr-1.5" /> Live preview
            </Button>
          )}
          {onSave && (
            <Button size="sm" onClick={onSave} disabled={saving} title="Sauver (⌘S)">
              <Save className="h-4 w-4 mr-1.5" /> Sauver
            </Button>
          )}
        </div>
      </header>

      {/* 3 columns */}
      <div className="flex flex-1 min-h-0 overflow-hidden">
        <aside className="w-72 shrink-0 border-r border-border/60 bg-card overflow-hidden flex flex-col">
          {list}
        </aside>
        <main className="flex-1 min-w-0 overflow-y-auto bg-background">
          {canvas}
        </main>
        {showPreview && (
          <aside className="w-96 shrink-0 border-l border-border/60 bg-card overflow-hidden flex flex-col">
            {preview}
          </aside>
        )}
      </div>
    </div>
  );
}
