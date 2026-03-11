import { Building2, ChevronDown } from "lucide-react";
import { useActiveOrg } from "@/contexts/OrgContext";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface OrgSwitcherProps {
  collapsed?: boolean;
}

export function OrgSwitcher({ collapsed }: OrgSwitcherProps) {
  const { memberships, activeOrg, setActiveOrgId } = useActiveOrg();

  if (memberships.length === 0) return null;

  if (collapsed) {
    return (
      <div className="flex justify-center">
        <div className="h-8 w-8 rounded-lg bg-accent/10 flex items-center justify-center">
          <Building2 className="h-4 w-4 text-accent" />
        </div>
      </div>
    );
  }

  if (memberships.length === 1) {
    return (
      <div className="flex items-center gap-2 rounded-xl bg-accent/10 px-3 py-2">
        <Building2 className="h-4 w-4 text-accent shrink-0" />
        <span className="text-xs font-semibold truncate">{activeOrg?.org_name}</span>
      </div>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="flex w-full items-center gap-2 rounded-xl bg-accent/10 px-3 py-2 hover:bg-accent/20 transition-colors outline-none">
        <Building2 className="h-4 w-4 text-accent shrink-0" />
        <span className="text-xs font-semibold truncate flex-1 text-left">{activeOrg?.org_name || "Organisation"}</span>
        <ChevronDown className="h-3 w-3 text-muted-foreground shrink-0" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-56">
        {memberships.map((m) => (
          <DropdownMenuItem
            key={m.organization_id}
            onClick={() => setActiveOrgId(m.organization_id)}
            className={m.organization_id === activeOrg?.organization_id ? "bg-accent/10" : ""}
          >
            <Building2 className="h-4 w-4 mr-2" />
            <span className="truncate">{m.org_name}</span>
            <span className="ml-auto text-[10px] text-muted-foreground capitalize">{m.role}</span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
