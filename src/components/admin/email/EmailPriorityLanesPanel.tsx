import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Layers3, RefreshCw, Zap, Mail, PackageOpen } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const LANE_META: Record<string, { label: string; icon: any; color: string; description: string }> = {
  transactional: {
    label: "Transactionnel",
    icon: Zap,
    color: "text-emerald-600",
    description: "Auth, OTP, confirmations — drainé en premier",
  },
  marketing: {
    label: "Marketing",
    icon: Mail,
    color: "text-primary",
    description: "Campagnes opt-in, newsletters",
  },
  bulk: {
    label: "Bulk",
    icon: PackageOpen,
    color: "text-amber-600",
    description: "Envois massifs, exports — drainé en dernier",
  },
};

const LANE_CAPACITY = 1000; // visual reference for the progress bar

export function EmailPriorityLanesPanel() {
  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ["email-priority-lanes"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_priority_lane_metrics");
      if (error) throw error;
      return data;
    },
    refetchInterval: 15000,
  });

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-base">
              <Layers3 className="h-4 w-4 text-primary" />
              Priority lanes (3 files)
            </CardTitle>
            <CardDescription>
              Backlog par file. Le dispatcher draine transactional → marketing → bulk dans cet ordre strict.
            </CardDescription>
          </div>
          <Button variant="outline" size="icon" onClick={() => refetch()} disabled={isFetching}>
            <RefreshCw className={`h-4 w-4 ${isFetching ? "animate-spin" : ""}`} />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 bg-muted/40 rounded animate-pulse" />
            ))}
          </div>
        ) : (
          (data || []).map((lane: any) => {
            const meta = LANE_META[lane.priority];
            if (!meta) return null;
            const Icon = meta.icon;
            const pct = Math.min(100, (Number(lane.queue_length) / LANE_CAPACITY) * 100);
            const isHot = Number(lane.queue_length) > LANE_CAPACITY * 0.8;
            return (
              <div key={lane.priority} className="space-y-1.5">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <Icon className={`h-4 w-4 ${meta.color}`} />
                    <span className="text-sm font-medium">{meta.label}</span>
                    <span className="text-xs text-muted-foreground hidden sm:inline">
                      · {meta.description}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={isHot ? "destructive" : "outline"} className="tabular-nums">
                      {Number(lane.queue_length).toLocaleString("fr-FR")} en attente
                    </Badge>
                    <span className="text-[10px] text-muted-foreground tabular-nums">
                      {Number(lane.total_messages).toLocaleString("fr-FR")} total
                    </span>
                  </div>
                </div>
                <Progress value={pct} className={isHot ? "[&>div]:bg-destructive" : ""} />
              </div>
            );
          })
        )}
      </CardContent>
    </Card>
  );
}
