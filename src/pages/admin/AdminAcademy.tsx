import { AdminShell } from "@/components/admin/AdminShell";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { GraduationCap, Users, Route, Megaphone, BookOpen, Plus, Briefcase } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";

export default function AdminAcademy() {
  const navigate = useNavigate();

  const { data: pathCount = 0 } = useQuery({
    queryKey: ["admin-academy-path-count"],
    queryFn: async () => {
      const { count } = await supabase.from("academy_paths").select("id", { count: "exact", head: true });
      return count || 0;
    },
  });

  const { data: personaeCount = 0 } = useQuery({
    queryKey: ["admin-academy-personae-count"],
    queryFn: async () => {
      const { count } = await supabase.from("academy_personae").select("id", { count: "exact", head: true });
      return count || 0;
    },
  });

  const { data: campaignCount = 0 } = useQuery({
    queryKey: ["admin-academy-campaign-count"],
    queryFn: async () => {
      const { count } = await supabase.from("academy_campaigns").select("id", { count: "exact", head: true });
      return count || 0;
    },
  });

  const { data: enrollmentCount = 0 } = useQuery({
    queryKey: ["admin-academy-enrollment-count"],
    queryFn: async () => {
      const { count } = await supabase.from("academy_enrollments").select("id", { count: "exact", head: true });
      return count || 0;
    },
  });

  const { data: functionCount = 0 } = useQuery({
    queryKey: ["admin-academy-function-count"],
    queryFn: async () => {
      const { count } = await supabase.from("academy_functions" as any).select("id", { count: "exact", head: true });
      return count || 0;
    },
  });

  const stats = [
    { label: "Parcours", value: pathCount, icon: Route, color: "text-primary" },
    { label: "Fonctions", value: functionCount, icon: Briefcase, color: "text-pillar-business" },
    { label: "Personae", value: personaeCount, icon: Users, color: "text-pillar-thinking" },
    { label: "Campagnes", value: campaignCount, icon: Megaphone, color: "text-pillar-impact" },
    { label: "Inscriptions", value: enrollmentCount, icon: GraduationCap, color: "text-pillar-relations" },
  ];

  return (
    <AdminShell>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <GraduationCap className="h-6 w-6 text-primary" />
            <h1 className="text-xl font-display font-bold">Academy</h1>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {stats.map(s => (
            <Card key={s.label}>
              <CardContent className="p-4 flex items-center gap-3">
                <s.icon className={`h-5 w-5 ${s.color}`} />
                <div>
                  <p className="text-2xl font-bold">{s.value}</p>
                  <p className="text-xs text-muted-foreground">{s.label}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate("/admin/academy/personae")}>
            <CardContent className="p-6 text-center space-y-2">
              <Users className="h-8 w-8 mx-auto text-pillar-thinking" />
              <p className="font-semibold text-sm">Personae</p>
              <p className="text-xs text-muted-foreground">Gérer les profils cibles</p>
            </CardContent>
          </Card>
          <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate("/admin/academy/paths")}>
            <CardContent className="p-6 text-center space-y-2">
              <Route className="h-8 w-8 mx-auto text-primary" />
              <p className="font-semibold text-sm">Parcours</p>
              <p className="text-xs text-muted-foreground">Créer et gérer les parcours</p>
            </CardContent>
          </Card>
          <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate("/admin/academy/campaigns")}>
            <CardContent className="p-6 text-center space-y-2">
              <Megaphone className="h-8 w-8 mx-auto text-pillar-impact" />
              <p className="font-semibold text-sm">Campagnes</p>
              <p className="text-xs text-muted-foreground">Déployer des formations</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminShell>
  );
}
