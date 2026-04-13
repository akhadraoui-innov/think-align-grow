import { useState } from "react";
import { AdminShell } from "@/components/admin/AdminShell";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart3, Package, DollarSign, Megaphone, Globe, Handshake, Building2, Calculator, BookOpen, FileText } from "lucide-react";
import { BusinessOverviewTab } from "@/components/admin/business/BusinessOverviewTab";
import { BusinessOfferTab } from "@/components/admin/business/BusinessOfferTab";
import { BusinessPricingTab } from "@/components/admin/business/BusinessPricingTab";
import { BusinessChannelsTab } from "@/components/admin/business/BusinessChannelsTab";
import { BusinessMarketTab } from "@/components/admin/business/BusinessMarketTab";
import { BusinessPartnersTab } from "@/components/admin/business/BusinessPartnersTab";
import { BusinessEnterpriseTab } from "@/components/admin/business/BusinessEnterpriseTab";
import { BusinessSimulatorTab } from "@/components/admin/business/BusinessSimulatorTab";
import { BusinessGuideTab } from "@/components/admin/business/BusinessGuideTab";
import { BusinessQuoteTab } from "@/components/admin/business/BusinessQuoteTab";
import {
  DEFAULT_MODULES, DEFAULT_CHANNELS, DEFAULT_SEGMENTS, DEFAULT_PRICING_ROLES, DEFAULT_SALE_MODELS,
  type ModuleConfig, type ChannelConfig, type SegmentConfig, type PricingRole, type SaleModel,
} from "@/components/admin/business/businessConfig";

const tabs = [
  { value: "overview", label: "Vue d'ensemble", icon: BarChart3 },
  { value: "offer", label: "Offre", icon: Package },
  { value: "pricing", label: "Pricing", icon: DollarSign },
  { value: "channels", label: "Channels", icon: Megaphone },
  { value: "market", label: "Marché", icon: Globe },
  { value: "partners", label: "Partenaires", icon: Handshake },
  { value: "enterprise", label: "Enterprise", icon: Building2 },
  { value: "simulator", label: "Simulateur", icon: Calculator },
  { value: "guide", label: "Guide", icon: BookOpen },
  { value: "quote", label: "Devis IA", icon: FileText },
];

export default function AdminBusiness() {
  // ──── Shared state lifted here ────
  const [modules, setModules] = useState<ModuleConfig[]>(DEFAULT_MODULES);
  const [channels, setChannels] = useState<ChannelConfig[]>(DEFAULT_CHANNELS);
  const [segments, setSegments] = useState<SegmentConfig[]>(DEFAULT_SEGMENTS);
  const [pricingRoles, setPricingRoles] = useState<PricingRole[]>(DEFAULT_PRICING_ROLES);
  const [saleModels] = useState<SaleModel[]>(DEFAULT_SALE_MODELS);

  return (
    <AdminShell>
      <div className="p-6 space-y-6">
        <div className="rounded-2xl bg-gradient-to-br from-primary/10 via-primary/5 to-background border border-border/50 p-8">
          <h1 className="text-3xl font-bold text-foreground tracking-tight">Business & Revenue</h1>
          <p className="text-muted-foreground mt-2 max-w-2xl">
            Command center stratégique — modélisez, simulez et pilotez votre go-to-market, pricing et croissance.
          </p>
        </div>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="flex flex-wrap h-auto gap-1 bg-muted/50 p-1 rounded-xl">
            {tabs.map(t => (
              <TabsTrigger key={t.value} value={t.value} className="flex items-center gap-1.5 text-xs px-3 py-2 data-[state=active]:bg-background data-[state=active]:shadow-sm rounded-lg">
                <t.icon className="h-3.5 w-3.5" />
                {t.label}
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value="overview"><BusinessOverviewTab /></TabsContent>
          <TabsContent value="offer"><BusinessOfferTab modules={modules} onModulesChange={setModules} /></TabsContent>
          <TabsContent value="pricing"><BusinessPricingTab pricingRoles={pricingRoles} onPricingRolesChange={setPricingRoles} /></TabsContent>
          <TabsContent value="channels"><BusinessChannelsTab channels={channels} onChannelsChange={setChannels} /></TabsContent>
          <TabsContent value="market"><BusinessMarketTab segments={segments} onSegmentsChange={setSegments} /></TabsContent>
          <TabsContent value="partners"><BusinessPartnersTab /></TabsContent>
          <TabsContent value="enterprise"><BusinessEnterpriseTab /></TabsContent>
          <TabsContent value="simulator"><BusinessSimulatorTab /></TabsContent>
          <TabsContent value="guide"><BusinessGuideTab /></TabsContent>
          <TabsContent value="quote">
            <BusinessQuoteTab
              modules={modules}
              segments={segments}
              channels={channels}
              pricingRoles={pricingRoles}
              saleModels={saleModels}
            />
          </TabsContent>
        </Tabs>
      </div>
    </AdminShell>
  );
}
