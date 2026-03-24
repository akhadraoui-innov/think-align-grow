import { AdminShell } from "@/components/admin/AdminShell";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, Plus, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";

export default function AdminAcademyPersonae() {
  const navigate = useNavigate();

  const { data: personae = [], isLoading } = useQuery({
    queryKey: ["admin-academy-personae"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("academy_personae")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  return (
    <AdminShell>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate("/admin/academy")}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <Users className="h-5 w-5 text-primary" />
            <h1 className="text-lg font-display font-bold">Personae</h1>
          </div>
          <Button size="sm">
            <Plus className="h-4 w-4 mr-2" /> Nouveau persona
          </Button>
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-4"><div className="h-4 bg-muted rounded w-1/3" /></CardContent>
              </Card>
            ))}
          </div>
        ) : personae.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="p-8 text-center text-muted-foreground">
              <Users className="h-8 w-8 mx-auto mb-3 opacity-40" />
              <p className="text-sm">Aucun persona créé.</p>
              <p className="text-xs mt-1">Créez des profils cibles pour personnaliser vos parcours.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {personae.map((p: any) => (
              <Card key={p.id} className="hover:shadow-sm transition-shadow cursor-pointer">
                <CardContent className="p-4 flex items-center justify-between">
                  <div>
                    <p className="font-medium text-sm">{p.name}</p>
                    <p className="text-xs text-muted-foreground line-clamp-1">{p.description}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={p.status === "published" ? "default" : "secondary"}>{p.status}</Badge>
                    <Badge variant="outline" className="text-[10px]">{p.generation_mode}</Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </AdminShell>
  );
}
