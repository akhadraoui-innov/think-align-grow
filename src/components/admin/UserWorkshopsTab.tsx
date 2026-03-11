import { Badge } from "@/components/ui/badge";
import { Presentation, Users } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

const STATUS_COLORS: Record<string, string> = {
  lobby: "bg-amber-500/10 text-amber-600 border-amber-500/30",
  active: "bg-emerald-500/10 text-emerald-600 border-emerald-500/30",
  paused: "bg-blue-500/10 text-blue-600 border-blue-500/30",
  completed: "bg-muted text-muted-foreground border-border",
};

interface Workshop {
  id: string;
  name: string;
  code: string;
  status: string;
  created_at: string;
}

interface Participation {
  workshop_id: string;
  role: string;
  joined_at: string;
  workshops: Workshop | null;
}

interface Props {
  hosted: Workshop[];
  participations: Participation[];
}

export function UserWorkshopsTab({ hosted, participations }: Props) {
  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        <StatCard icon={Presentation} label="Workshops créés" value={hosted.length} color="text-orange-500" />
        <StatCard icon={Users} label="Participations" value={participations.length} color="text-blue-500" />
        <StatCard icon={Presentation} label="Total" value={hosted.length + participations.length} color="text-primary" />
      </div>

      {/* Hosted */}
      <div className="rounded-xl border border-border/50 bg-card p-6 space-y-4">
        <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
          <Presentation className="h-4 w-4 text-primary" /> Workshops créés ({hosted.length})
        </h3>
        {hosted.length === 0 ? (
          <p className="text-sm text-muted-foreground italic">Aucun workshop créé</p>
        ) : (
          <div className="space-y-2">
            {hosted.map((w) => (
              <WorkshopRow key={w.id} workshop={w} extra="Créateur" />
            ))}
          </div>
        )}
      </div>

      {/* Participations */}
      <div className="rounded-xl border border-border/50 bg-card p-6 space-y-4">
        <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
          <Users className="h-4 w-4 text-primary" /> Participations ({participations.length})
        </h3>
        {participations.length === 0 ? (
          <p className="text-sm text-muted-foreground italic">Aucune participation</p>
        ) : (
          <div className="space-y-2">
            {participations.map((p) => p.workshops && (
              <WorkshopRow key={p.workshop_id} workshop={p.workshops} extra={p.role} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function WorkshopRow({ workshop, extra }: { workshop: Workshop; extra: string }) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-border/40 bg-muted/20 p-3">
      <div>
        <p className="text-sm font-medium text-foreground">{workshop.name}</p>
        <p className="text-[10px] text-muted-foreground">
          Code : {workshop.code} · {format(new Date(workshop.created_at), "dd MMM yyyy", { locale: fr })}
        </p>
      </div>
      <div className="flex items-center gap-2">
        <Badge variant="outline" className={`text-[10px] ${STATUS_COLORS[workshop.status] || ""}`}>{workshop.status}</Badge>
        <Badge variant="secondary" className="text-[10px]">{extra}</Badge>
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, color }: { icon: any; label: string; value: number; color: string }) {
  return (
    <div className="rounded-xl border border-border/50 bg-card p-4 flex flex-col gap-1">
      <div className="flex items-center gap-2">
        <Icon className={`h-4 w-4 ${color}`} />
        <span className="text-[11px] uppercase tracking-wider text-muted-foreground">{label}</span>
      </div>
      <p className="text-2xl font-bold text-foreground">{value}</p>
    </div>
  );
}
