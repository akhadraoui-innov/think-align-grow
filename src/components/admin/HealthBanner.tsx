import { Link } from "react-router-dom";
import { AlertTriangle, X } from "lucide-react";
import { useSystemHealth } from "@/hooks/useSystemHealth";
import { useState } from "react";
import { cn } from "@/lib/utils";

export function HealthBanner() {
  const { data } = useSystemHealth(60_000);
  const [dismissed, setDismissed] = useState(false);

  if (!data || dismissed) return null;
  if (data.critical_count === 0) return null;

  const reasons: string[] = [];
  if (!data.audit_chain.valid) reasons.push("chaîne d'audit rompue");
  const downProviders = data.providers.filter((p) => p.circuit_open).map((p) => p.provider);
  if (downProviders.length > 0) reasons.push(`provider(s) coupé(s) : ${downProviders.join(", ")}`);

  return (
    <div className={cn(
      "sticky top-0 z-50 border-b border-destructive/30 bg-destructive/10 backdrop-blur-xl",
      "flex items-center gap-3 px-4 py-2 text-xs"
    )}>
      <AlertTriangle className="h-4 w-4 text-destructive shrink-0" />
      <div className="flex-1 text-destructive font-medium">
        {data.critical_count} alerte{data.critical_count > 1 ? "s" : ""} critique{data.critical_count > 1 ? "s" : ""} :{" "}
        {reasons.join(" • ")}
      </div>
      <Link to="/admin/health" className="text-destructive font-semibold underline-offset-2 hover:underline">
        Voir le détail
      </Link>
      <button
        onClick={() => setDismissed(true)}
        className="text-destructive/70 hover:text-destructive shrink-0"
        aria-label="Fermer"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
