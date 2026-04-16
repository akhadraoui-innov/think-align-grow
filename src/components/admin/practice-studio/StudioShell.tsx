import { ReactNode } from "react";
import { ArrowLeft, Save, Copy, PlayCircle, History, Loader2, CheckCircle2 } from "lucide-react";
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
  onShowVersions?: () => void;
}

export function StudioShell({
  list, canvas, preview, title, status, saving, lastSavedAt,
  onSave, onDuplicate, onPreviewToggle, showPreview, onShowVersions,
}: Props) {
  const navigate = useNavigate();

  const savedLabel = lastSavedAt
    ? `Enregistré ${Math.max(1, Math.round((Date.now() - lastSavedAt.getTime()) / 1000))}s`
    : "Non enregistré";

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
            </div>
            <p className="text-[11px] text-muted-foreground flex items-center gap-1.5">
              {saving ? (
                <><Loader2 className="h-3 w-3 animate-spin" /> Enregistrement…</>
              ) : (
                <><CheckCircle2 className="h-3 w-3 text-emerald-500" /> {savedLabel}</>
              )}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {onShowVersions && (
            <Button variant="ghost" size="sm" onClick={onShowVersions}>
              <History className="h-4 w-4 mr-1.5" /> Versions
            </Button>
          )}
          {onDuplicate && (
            <Button variant="ghost" size="sm" onClick={onDuplicate}>
              <Copy className="h-4 w-4 mr-1.5" /> Dupliquer
            </Button>
          )}
          {onPreviewToggle && (
            <Button variant={showPreview ? "default" : "outline"} size="sm" onClick={onPreviewToggle}>
              <PlayCircle className="h-4 w-4 mr-1.5" /> Live preview
            </Button>
          )}
          {onSave && (
            <Button size="sm" onClick={onSave} disabled={saving}>
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
