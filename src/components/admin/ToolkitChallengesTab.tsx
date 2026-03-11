import { Badge } from "@/components/ui/badge";

interface Props {
  templates: any[];
}

export function ToolkitChallengesTab({ templates }: Props) {
  if (!templates.length) {
    return (
      <div className="rounded-xl border border-border/50 bg-card p-8 text-center text-muted-foreground">
        Aucun template de challenge.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {templates.map((t) => (
        <div key={t.id} className="rounded-xl border border-border/50 bg-card p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium text-foreground">{t.name}</h4>
              {t.description && <p className="text-xs text-muted-foreground mt-0.5">{t.description}</p>}
            </div>
            {t.difficulty && <Badge variant="outline" className="text-xs">{t.difficulty}</Badge>}
          </div>

          {t.challenge_subjects?.length > 0 && (
            <div className="pl-4 border-l-2 border-border/50 space-y-2">
              {t.challenge_subjects.map((s: any) => (
                <div key={s.id}>
                  <p className="text-sm text-foreground">{s.title}</p>
                  <div className="flex gap-1 mt-1 flex-wrap">
                    <Badge variant="outline" className="text-[10px]">{s.type}</Badge>
                    {s.challenge_slots?.map((sl: any) => (
                      <Badge key={sl.id} variant="secondary" className="text-[10px]">{sl.label} ({sl.slot_type})</Badge>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
