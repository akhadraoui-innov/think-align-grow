import { ScrollText } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

interface Log {
  id: string;
  action: string;
  entity_type: string | null;
  entity_id: string | null;
  created_at: string;
  metadata: any;
}

interface Props {
  logs: Log[];
}

export function UserActivityTab({ logs }: Props) {
  return (
    <div className="rounded-xl border border-border/50 bg-card p-6 space-y-4">
      <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
        <ScrollText className="h-4 w-4 text-primary" /> Journal d'activité ({logs.length})
      </h3>
      {logs.length === 0 ? (
        <p className="text-sm text-muted-foreground italic">Aucune activité enregistrée</p>
      ) : (
        <div className="space-y-2">
          {logs.map((log) => (
            <div key={log.id} className="flex items-start gap-3 rounded-lg border border-border/40 bg-muted/20 p-3">
              <div className="h-2 w-2 rounded-full bg-primary mt-1.5 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm text-foreground">{log.action}</p>
                {log.entity_type && (
                  <p className="text-[10px] text-muted-foreground">
                    {log.entity_type} {log.entity_id ? `· ${log.entity_id.slice(0, 8)}…` : ""}
                  </p>
                )}
                <p className="text-[10px] text-muted-foreground mt-0.5">
                  {format(new Date(log.created_at), "dd MMM yyyy à HH:mm", { locale: fr })}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
