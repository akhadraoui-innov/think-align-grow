import { Badge } from "@/components/ui/badge";
import { Building2 } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface OrgMembership {
  id: string;
  organization_id: string;
  role: string;
  created_at: string;
  organizations: { id: string; name: string; slug: string; primary_color: string | null; logo_url: string | null } | null;
}

interface Props {
  organizations: OrgMembership[];
}

export function UserOrgsTab({ organizations }: Props) {
  const navigate = useNavigate();

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-border/50 bg-card p-6">
        <h3 className="text-sm font-semibold text-foreground flex items-center gap-2 mb-4">
          <Building2 className="h-4 w-4 text-primary" /> Organisations ({organizations.length})
        </h3>
        {organizations.length === 0 ? (
          <p className="text-sm text-muted-foreground italic">Cet utilisateur n'appartient à aucune organisation.</p>
        ) : (
          <div className="space-y-3">
            {organizations.map((om) => {
              const org = om.organizations;
              return (
                <div
                  key={om.id}
                  className="flex items-center justify-between rounded-lg border border-border/40 bg-muted/30 p-4 cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() => org && navigate(`/admin/organizations/${org.id}`)}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="h-10 w-10 rounded-xl flex items-center justify-center text-sm font-bold text-white"
                      style={{ backgroundColor: org?.primary_color || "#E8552D" }}
                    >
                      {org?.logo_url ? (
                        <img src={org.logo_url} alt="" className="h-7 w-7 rounded object-contain" />
                      ) : (
                        org?.name?.[0]?.toUpperCase() || "?"
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">{org?.name || "—"}</p>
                      <p className="text-[11px] text-muted-foreground">/{org?.slug} · membre depuis {new Date(om.created_at).toLocaleDateString("fr-FR")}</p>
                    </div>
                  </div>
                  <Badge variant="outline" className="text-[10px]">{om.role.replace(/_/g, " ")}</Badge>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
