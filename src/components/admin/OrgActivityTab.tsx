import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { ScrollText } from "lucide-react";

interface ActivityLog {
  id: string;
  user_id: string;
  action: string;
  entity_type: string | null;
  entity_id: string | null;
  metadata: any;
  created_at: string;
}

interface Props {
  logs: ActivityLog[];
}

export function OrgActivityTab({ logs }: Props) {
  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">{logs.length} événement{logs.length > 1 ? "s" : ""} récent{logs.length > 1 ? "s" : ""}</p>

      <div className="rounded-xl border border-border/50 bg-card divide-y divide-border/30">
        {logs.length === 0 ? (
          <div className="p-8 text-center space-y-3">
            <ScrollText className="h-8 w-8 mx-auto text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Aucune activité enregistrée pour cette organisation.</p>
          </div>
        ) : (
          logs.map((log) => (
            <div key={log.id} className="flex items-center gap-4 px-4 py-3">
              <div className="h-2 w-2 rounded-full bg-primary shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm text-foreground">
                  <span className="font-medium">{log.action}</span>
                  {log.entity_type && (
                    <span className="text-muted-foreground"> · {log.entity_type}</span>
                  )}
                </p>
                <p className="text-xs text-muted-foreground">
                  {log.user_id.slice(0, 8)}... · {format(new Date(log.created_at), "dd MMM yyyy à HH:mm", { locale: fr })}
                </p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
