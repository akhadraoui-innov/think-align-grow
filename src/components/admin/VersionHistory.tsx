import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { History, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

function useAssetVersions(assetType: string, assetId: string | null) {
  return useQuery({
    queryKey: ["asset-versions", assetType, assetId],
    enabled: !!assetId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("academy_asset_versions" as any)
        .select("id, version_number, change_summary, created_at, changed_by")
        .eq("asset_type", assetType)
        .eq("asset_id", assetId!)
        .order("version_number", { ascending: false })
        .limit(20);
      if (error) throw error;
      return (data ?? []) as unknown as Array<{
        id: string;
        version_number: number;
        change_summary: string | null;
        created_at: string;
        changed_by: string | null;
      }>;
    },
    staleTime: 30_000,
  });
}

interface VersionHistoryProps {
  assetType: string;
  assetId: string;
}

export function VersionHistory({ assetType, assetId }: VersionHistoryProps) {
  const [open, setOpen] = useState(false);
  const { data: versions = [], isLoading } = useAssetVersions(assetType, open ? assetId : null);

  return (
    <div className="space-y-1.5" onClick={e => e.stopPropagation()}>
      <button
        className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
        onClick={() => setOpen(!open)}
      >
        <History className="h-3.5 w-3.5" />
        Historique des versions
        <ChevronDown className={cn("h-3 w-3 transition-transform", open && "rotate-180")} />
      </button>
      {open && (
        <div className="ml-5 border-l-2 border-border pl-3 space-y-2 mt-2">
          {isLoading && <p className="text-xs text-muted-foreground">Chargement…</p>}
          {!isLoading && versions.length === 0 && (
            <p className="text-xs text-muted-foreground">Aucune version antérieure</p>
          )}
          {versions.map(v => (
            <div key={v.id} className="flex items-start gap-3 text-xs">
              <Badge variant="outline" className="shrink-0 text-[10px] px-1.5">v{v.version_number}</Badge>
              <div className="space-y-0.5">
                <p className="text-muted-foreground">
                  {new Date(v.created_at).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                </p>
                <p className="text-foreground">{v.change_summary || "—"}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
