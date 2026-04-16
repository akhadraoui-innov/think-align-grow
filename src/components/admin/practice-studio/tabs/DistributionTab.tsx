import { useEffect, useState } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Plus, Trash2, Building2, User } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  usePracticeOrganizations, useAddPracticeOrg, useRemovePracticeOrg,
  usePracticeAssignments, useAddPracticeAssignment, useRemovePracticeAssignment,
  useUpdatePractice,
} from "@/hooks/useAdminPractices";
import { supabase } from "@/integrations/supabase/client";
import type { AdminPractice } from "@/hooks/useAdminPractices";

interface Props {
  practice: AdminPractice;
}

export function DistributionTab({ practice }: Props) {
  const { data: orgs = [] } = usePracticeOrganizations(practice.id);
  const { data: assignments = [] } = usePracticeAssignments(practice.id);
  const addOrg = useAddPracticeOrg();
  const removeOrg = useRemovePracticeOrg();
  const addAssignment = useAddPracticeAssignment();
  const removeAssignment = useRemovePracticeAssignment();
  const updatePractice = useUpdatePractice();

  const [allOrgs, setAllOrgs] = useState<Array<{ id: string; name: string }>>([]);
  const [orgPick, setOrgPick] = useState<string>("");
  const [allUsers, setAllUsers] = useState<Array<{ user_id: string; display_name: string | null; email: string | null }>>([]);
  const [userPick, setUserPick] = useState<string>("");
  const [dueDate, setDueDate] = useState<string>("");

  useEffect(() => {
    supabase.from("organizations").select("id, name").order("name").then(({ data }) => setAllOrgs(data ?? []));
    supabase.from("profiles").select("user_id, display_name, email").order("display_name").limit(500)
      .then(({ data }) => setAllUsers((data as any) ?? []));
  }, []);

  const orgIdsLinked = new Set(orgs.map((o: any) => o.organization_id));
  const userIdsLinked = new Set(assignments.map((a: any) => a.user_id));
  const userLabel = (u?: { display_name: string | null; email: string | null; user_id: string }) =>
    u ? (u.display_name || u.email || u.user_id.slice(0, 8)) : "—";

  return (
    <div className="space-y-5 max-w-3xl">
      <div className="rounded-xl border border-border/60 bg-card p-5">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold">Visibilité publique</h3>
            <p className="text-xs text-muted-foreground">Si activé, tous les apprenants voient cette pratique.</p>
          </div>
          <Switch
            checked={practice.is_public}
            onCheckedChange={v => updatePractice.mutate({ id: practice.id, patch: { is_public: v } })}
          />
        </div>
      </div>

      <div className="rounded-xl border border-border/60 bg-card p-5 space-y-3">
        <h3 className="text-sm font-semibold flex items-center gap-2">
          <Building2 className="h-4 w-4" /> Organisations · {orgs.length}
        </h3>
        <p className="text-xs text-muted-foreground">Les membres de ces organisations verront la pratique.</p>
        <div className="flex gap-2">
          <Select value={orgPick} onValueChange={setOrgPick}>
            <SelectTrigger><SelectValue placeholder="Choisir une organisation…" /></SelectTrigger>
            <SelectContent>
              {allOrgs.filter(o => !orgIdsLinked.has(o.id)).map(o => (
                <SelectItem key={o.id} value={o.id}>{o.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            size="sm"
            disabled={!orgPick}
            onClick={() => {
              if (orgPick) {
                addOrg.mutate({ practiceId: practice.id, organizationId: orgPick });
                setOrgPick("");
              }
            }}
          >
            <Plus className="h-3.5 w-3.5 mr-1" /> Ajouter
          </Button>
        </div>
        <div className="flex flex-wrap gap-2">
          {orgs.map((o: any) => (
            <Badge key={o.id} variant="secondary" className="gap-1.5 py-1">
              {o.organizations?.name ?? o.organization_id}
              <button onClick={() => removeOrg.mutate({ id: o.id, practiceId: practice.id })}>
                <Trash2 className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      </div>

      <div className="rounded-xl border border-border/60 bg-card p-5 space-y-3">
        <h3 className="text-sm font-semibold flex items-center gap-2">
          <User className="h-4 w-4" /> Utilisateurs assignés · {assignments.length}
        </h3>
        <div className="grid grid-cols-[1fr_180px_auto] gap-2">
          <Select value={userPick} onValueChange={setUserPick}>
            <SelectTrigger><SelectValue placeholder="Choisir un utilisateur…" /></SelectTrigger>
            <SelectContent className="max-h-72">
              {allUsers.filter(u => !userIdsLinked.has(u.user_id)).map(u => (
                <SelectItem key={u.user_id} value={u.user_id}>
                  {userLabel(u)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} placeholder="Échéance" />
          <Button
            size="sm"
            disabled={!userPick}
            onClick={() => {
              if (userPick) {
                addAssignment.mutate({
                  practiceId: practice.id,
                  userId: userPick,
                  dueDate: dueDate || undefined,
                });
                setUserPick("");
                setDueDate("");
              }
            }}
          >
            <Plus className="h-3.5 w-3.5 mr-1" /> Assigner
          </Button>
        </div>
        <div className="space-y-1.5">
          {assignments.map((a: any) => {
            const u = allUsers.find(x => x.user_id === a.user_id);
            return (
              <div key={a.id} className="flex items-center justify-between rounded-lg border p-2.5 text-xs">
                <div>
                  <p className="font-medium">{userLabel(u)}</p>
                  {a.due_date && <p className="text-muted-foreground">Échéance : {new Date(a.due_date).toLocaleDateString()}</p>}
                </div>
                <Button size="sm" variant="ghost" onClick={() => removeAssignment.mutate({ id: a.id, practiceId: practice.id })}>
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            );
          })}
          {assignments.length === 0 && <p className="text-xs text-muted-foreground">Aucun utilisateur assigné</p>}
        </div>
      </div>
    </div>
  );
}
