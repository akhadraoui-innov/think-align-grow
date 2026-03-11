import { Badge } from "@/components/ui/badge";
import { BookOpen, Bookmark, Eye } from "lucide-react";

interface CardProgressItem {
  id: string;
  card_id: string;
  is_viewed: boolean;
  is_bookmarked: boolean;
  viewed_at: string | null;
  cards: { title: string; pillar_id: string } | null;
}

interface Props {
  progress: CardProgressItem[];
}

export function UserCardsTab({ progress }: Props) {
  const viewed = progress.filter((p) => p.is_viewed).length;
  const bookmarked = progress.filter((p) => p.is_bookmarked).length;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        <div className="rounded-xl border border-border/50 bg-card p-4">
          <div className="flex items-center gap-2 mb-1">
            <Eye className="h-4 w-4 text-blue-500" />
            <span className="text-[11px] uppercase tracking-wider text-muted-foreground">Cartes vues</span>
          </div>
          <p className="text-2xl font-bold text-foreground">{viewed}</p>
        </div>
        <div className="rounded-xl border border-border/50 bg-card p-4">
          <div className="flex items-center gap-2 mb-1">
            <Bookmark className="h-4 w-4 text-amber-500" />
            <span className="text-[11px] uppercase tracking-wider text-muted-foreground">Bookmarks</span>
          </div>
          <p className="text-2xl font-bold text-foreground">{bookmarked}</p>
        </div>
        <div className="rounded-xl border border-border/50 bg-card p-4">
          <div className="flex items-center gap-2 mb-1">
            <BookOpen className="h-4 w-4 text-primary" />
            <span className="text-[11px] uppercase tracking-wider text-muted-foreground">Total interactions</span>
          </div>
          <p className="text-2xl font-bold text-foreground">{progress.length}</p>
        </div>
      </div>

      <div className="rounded-xl border border-border/50 bg-card p-6 space-y-4">
        <h3 className="text-sm font-semibold text-foreground">Progression des cartes</h3>
        {progress.length === 0 ? (
          <p className="text-sm text-muted-foreground italic">Aucune interaction avec les cartes</p>
        ) : (
          <div className="space-y-2">
            {progress.map((p) => (
              <div key={p.id} className="flex items-center justify-between rounded-lg border border-border/40 bg-muted/20 p-3">
                <div>
                  <p className="text-sm text-foreground">{(p.cards as any)?.title || "Carte"}</p>
                  <p className="text-[10px] text-muted-foreground">
                    {p.viewed_at ? new Date(p.viewed_at).toLocaleDateString("fr-FR") : "—"}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {p.is_viewed && <Badge variant="secondary" className="text-[10px] gap-1"><Eye className="h-3 w-3" /> Vue</Badge>}
                  {p.is_bookmarked && <Badge variant="outline" className="text-[10px] gap-1 bg-amber-500/10 text-amber-600 border-amber-500/30"><Bookmark className="h-3 w-3" /> Saved</Badge>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
