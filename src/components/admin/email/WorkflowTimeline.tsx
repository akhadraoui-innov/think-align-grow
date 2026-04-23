import { Clock, Mail, ArrowRight, Filter } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { EmailAutomation, TRIGGER_EVENTS } from "@/hooks/useEmailAutomations";
import { cn } from "@/lib/utils";

interface Props {
  automations: EmailAutomation[];
  onEdit: (automation: EmailAutomation) => void;
}

function formatDelay(min: number): string {
  if (min === 0) return "Immédiat";
  if (min < 60) return `+${min} min`;
  const h = Math.floor(min / 60);
  if (h < 24) return `+${h}h`;
  const d = Math.floor(h / 24);
  return `+${d}j`;
}

export function WorkflowTimeline({ automations, onEdit }: Props) {
  const grouped = TRIGGER_EVENTS.map((event) => ({
    event,
    items: automations
      .filter((a) => a.trigger_event === event.value)
      .sort((a, b) => a.delay_minutes - b.delay_minutes),
  })).filter((g) => g.items.length > 0);

  const orphans = automations.filter((a) => !TRIGGER_EVENTS.find((e) => e.value === a.trigger_event));

  if (grouped.length === 0 && orphans.length === 0) {
    return (
      <Card className="p-12 text-center">
        <p className="text-sm text-muted-foreground">Aucun workflow configuré.</p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {grouped.map(({ event, items }) => (
        <Card key={event.value} className="p-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-semibold">{event.label}</h3>
                <Badge variant="outline" className="font-mono text-[10px]">{event.value}</Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                {items.length} étape{items.length > 1 ? "s" : ""} • {items.filter((i) => i.is_active).length} active{items.filter((i) => i.is_active).length > 1 ? "s" : ""}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-2">
            <div className="flex-shrink-0 w-24 flex items-center gap-2 px-3 py-2 rounded-lg bg-primary/10 border border-primary/30">
              <span className="text-xs font-medium">Trigger</span>
            </div>
            {items.map((item, idx) => (
              <div key={item.id} className="flex items-center gap-2 flex-shrink-0">
                <ArrowRight className="h-4 w-4 text-muted-foreground" />
                <button
                  onClick={() => onEdit(item)}
                  className={cn(
                    "group flex flex-col gap-1 px-3 py-2 rounded-lg border transition-all hover:shadow-md min-w-[180px] text-left",
                    item.is_active
                      ? "bg-card border-border hover:border-primary"
                      : "bg-muted/30 border-dashed border-border opacity-60 hover:opacity-100"
                  )}
                >
                  <div className="flex items-center gap-1.5">
                    <Clock className="h-3 w-3 text-muted-foreground" />
                    <span className="text-[10px] font-mono text-muted-foreground">{formatDelay(item.delay_minutes)}</span>
                    {item.organization_id && <Badge variant="secondary" className="text-[9px] py-0 h-4">Org</Badge>}
                    {!item.is_active && <Badge variant="outline" className="text-[9px] py-0 h-4">Off</Badge>}
                    {item.conditions && Object.keys(item.conditions).length > 0 && (
                      <Filter className="h-3 w-3 text-amber-500" />
                    )}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Mail className="h-3.5 w-3.5 text-primary flex-shrink-0" />
                    <span className="text-xs font-medium truncate">{item.name}</span>
                  </div>
                  <code className="text-[10px] text-muted-foreground truncate">{item.template_code}</code>
                </button>
              </div>
            ))}
          </div>
        </Card>
      ))}

      {orphans.length > 0 && (
        <Card className="p-4 border-dashed">
          <h3 className="text-sm font-semibold mb-2 text-muted-foreground">Automations sur événements inconnus</h3>
          <div className="flex flex-wrap gap-2">
            {orphans.map((item) => (
              <button
                key={item.id}
                onClick={() => onEdit(item)}
                className="px-3 py-2 rounded-lg border border-dashed border-border hover:border-primary text-left"
              >
                <div className="text-xs font-medium">{item.name}</div>
                <code className="text-[10px] text-muted-foreground">{item.trigger_event}</code>
              </button>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
