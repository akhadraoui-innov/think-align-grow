import { useState } from "react";
import { Mail, Sparkles, Send, Globe, BarChart3, Building2, ShieldOff, FlaskConical, TrendingUp, Activity } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { usePermissions } from "@/hooks/usePermissions";
import { EmailTemplatesTab } from "@/components/admin/email/EmailTemplatesTab";
import { EmailAutomationsTab } from "@/components/admin/email/EmailAutomationsTab";
import { EmailLogsTab } from "@/components/admin/email/EmailLogsTab";
import { EmailDomainBrandingTab } from "@/components/admin/email/EmailDomainBrandingTab";
import { EmailProvidersTab } from "@/components/admin/email/EmailProvidersTab";
import { EmailSuppressionsTab } from "@/components/admin/email/EmailSuppressionsTab";
import { EmailABTestsTab } from "@/components/admin/email/EmailABTestsTab";
import { EmailAnalyticsTab } from "@/components/admin/email/EmailAnalyticsTab";
import { EmailReliabilityTab } from "@/components/admin/email/EmailReliabilityTab";

const GLOBAL_OPTION = "__global__";

export default function AdminEmails() {
  const perms = usePermissions();
  const [orgId, setOrgId] = useState<string>(GLOBAL_OPTION);
  const scopeOrgId = orgId === GLOBAL_OPTION ? null : orgId;

  const { data: orgs = [] } = useQuery({
    queryKey: ["admin-emails-orgs"],
    queryFn: async () => {
      const { data, error } = await supabase.from("organizations").select("id, name").order("name");
      if (error) throw error;
      return data as { id: string; name: string }[];
    },
  });

  if (perms.loading) return null;
  const allowed = perms.hasAny("email.compose", "email.templates.manage", "email.automations.manage", "email.providers.manage", "email.logs.view");
  if (!allowed) {
    return (
      <Card className="p-12 text-center">
        <p className="text-sm text-muted-foreground">Accès refusé. Vous n'avez pas les permissions email requises.</p>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <header className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center">
            <Mail className="h-6 w-6 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Email Studio</h1>
            <p className="text-sm text-muted-foreground">
              Templates, automations, providers, branding et statistiques — multi-tenant
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Building2 className="h-4 w-4 text-muted-foreground" />
          <Select value={orgId} onValueChange={setOrgId}>
            <SelectTrigger className="w-[260px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value={GLOBAL_OPTION}>🌐 Plateforme (global)</SelectItem>
              {orgs.map(o => <SelectItem key={o.id} value={o.id}>{o.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </header>

      <Tabs defaultValue="analytics" className="space-y-4">
        <TabsList className="grid grid-cols-9 w-full">
          <TabsTrigger value="analytics"><TrendingUp className="h-4 w-4 mr-1" />Analytics</TabsTrigger>
          <TabsTrigger value="reliability"><Activity className="h-4 w-4 mr-1" />Reliability</TabsTrigger>
          <TabsTrigger value="templates"><Mail className="h-4 w-4 mr-1" />Templates</TabsTrigger>
          <TabsTrigger value="automations"><Sparkles className="h-4 w-4 mr-1" />Automations</TabsTrigger>
          <TabsTrigger value="abtests"><FlaskConical className="h-4 w-4 mr-1" />A/B Tests</TabsTrigger>
          <TabsTrigger value="logs"><BarChart3 className="h-4 w-4 mr-1" />Logs</TabsTrigger>
          <TabsTrigger value="suppressions"><ShieldOff className="h-4 w-4 mr-1" />Suppressions</TabsTrigger>
          <TabsTrigger value="branding"><Globe className="h-4 w-4 mr-1" />Branding</TabsTrigger>
          <TabsTrigger value="providers"><Send className="h-4 w-4 mr-1" />Providers</TabsTrigger>
        </TabsList>

        <TabsContent value="analytics"><EmailAnalyticsTab organizationId={scopeOrgId} /></TabsContent>
        <TabsContent value="reliability"><EmailReliabilityTab /></TabsContent>
        <TabsContent value="templates"><EmailTemplatesTab organizationId={scopeOrgId} /></TabsContent>
        <TabsContent value="automations"><EmailAutomationsTab organizationId={scopeOrgId} /></TabsContent>
        <TabsContent value="abtests"><EmailABTestsTab organizationId={scopeOrgId} /></TabsContent>
        <TabsContent value="logs"><EmailLogsTab organizationId={scopeOrgId} /></TabsContent>
        <TabsContent value="suppressions"><EmailSuppressionsTab organizationId={scopeOrgId} /></TabsContent>
        <TabsContent value="branding"><EmailDomainBrandingTab /></TabsContent>
        <TabsContent value="providers"><EmailProvidersTab organizationId={scopeOrgId} /></TabsContent>
      </Tabs>
    </div>
  );
}
