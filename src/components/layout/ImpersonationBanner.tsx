import { useEffect, useState } from "react";
import { ShieldAlert, X } from "lucide-react";
import { useImpersonation } from "@/hooks/useImpersonation";
import { Button } from "@/components/ui/button";

function fmtRemaining(expiresAt?: string) {
  if (!expiresAt) return "";
  const ms = new Date(expiresAt).getTime() - Date.now();
  if (ms <= 0) return "Expiré";
  const min = Math.floor(ms / 60000);
  const sec = Math.floor((ms % 60000) / 1000);
  return `${min}m ${sec.toString().padStart(2, "0")}s restantes`;
}

export function ImpersonationBanner() {
  const { active, targetEmail, expiresAt, exit } = useImpersonation();
  const [, setTick] = useState(0);

  useEffect(() => {
    if (!active) return;
    const id = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(id);
  }, [active]);

  useEffect(() => {
    if (!active || !expiresAt) return;
    if (new Date(expiresAt).getTime() <= Date.now()) {
      exit(true);
    }
  });

  if (!active) return null;

  return (
    <div className="sticky top-0 z-[60] w-full bg-destructive text-destructive-foreground shadow-md">
      <div className="container mx-auto flex items-center justify-between gap-3 px-4 py-2 text-sm">
        <div className="flex items-center gap-2 min-w-0">
          <ShieldAlert className="h-4 w-4 shrink-0" />
          <span className="truncate">
            <strong>Mode support</strong> — Connecté en tant que{" "}
            <span className="font-mono">{targetEmail || "—"}</span>. Lecture seule.
          </span>
          {expiresAt && (
            <span className="hidden sm:inline opacity-80 text-xs">
              · {fmtRemaining(expiresAt)}
            </span>
          )}
        </div>
        <Button
          size="sm"
          variant="secondary"
          className="h-7"
          onClick={() => exit(true)}
        >
          <X className="h-3.5 w-3.5 mr-1" /> Quitter
        </Button>
      </div>
    </div>
  );
}
