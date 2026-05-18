import { UserCircle2, Users } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Props {
  sessionId: string;
  active: boolean;
}

export function AnonymousToggle({ sessionId, active }: Props) {
  const onToggle = async () => {
    const { error } = await (supabase as any).from("challenge_sessions").update({ anonymous_mode: !active }).eq("id", sessionId);
    if (error) toast.error("Mode anonyme", { description: error.message });
    else toast.success(`Mode anonyme ${!active ? "activé" : "désactivé"}`);
  };
  return (
    <button
      onClick={onToggle}
      title={active ? "Désactiver l'anonymat" : "Activer l'anonymat"}
      className={`h-7 px-2 rounded-md border text-[11px] font-bold uppercase tracking-wider flex items-center gap-1 transition-colors ${
        active ? "border-violet-500 bg-violet-500/10 text-violet-700 dark:text-violet-300" : "border-border text-muted-foreground hover:bg-muted"
      }`}
    >
      {active ? <UserCircle2 className="h-3 w-3" /> : <Users className="h-3 w-3" />}
      {active ? "Anonyme" : "Nominal"}
    </button>
  );
}
