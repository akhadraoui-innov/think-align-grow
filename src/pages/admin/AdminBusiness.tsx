import { useState } from "react";
import { AdminShell } from "@/components/admin/AdminShell";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart3, Briefcase, FlaskConical, FileText, BookOpen } from "lucide-react";
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
import { BusinessQuoteListTab } from "@/components/admin/business/BusinessQuoteListTab";
import { BusinessQuoteSynthesisTab } from "@/components/admin/business/BusinessQuoteSynthesisTab";
import {
  DEFAULT_MODULES, DEFAULT_CHANNELS, DEFAULT_SEGMENTS, DEFAULT_PRICING_ROLES, DEFAULT_SALE_MODELS,
  type ModuleConfig, type ChannelConfig, type SegmentConfig, type PricingRole, type SaleModel,
} from "@/components/admin/business/businessConfig";

/* ─── Section definitions ─── */
interface Section {
  value: string;
  label: string;
  icon: React.ElementType;
  subTabs?: { value: string; label: string }[];
}

const sections: Section[] = [
  {
    value: "overview",
    label: "Vue d'ensemble",
    icon: BarChart3,
    subTabs: [
      { value: "overview-main", label: "Vue d'ensemble" },
      { value: "overview-offer", label: "Offre" },
    ],
  },
  {
    value: "model",
    label: "Business Model",
    icon: Briefcase,
    subTabs: [
      { value: "model-pricing", label: "Pricing" },
      { value: "model-channels", label: "Channels" },
      { value: "model-market", label: "Marché" },
    ],
  },
  {
    value: "simulations",
    label: "Simulations",
    icon: FlaskConical,
    subTabs: [
      { value: "sim-partners", label: "Partenaires" },
      { value: "sim-enterprise", label: "Enterprise" },
      { value: "sim-simulator", label: "Simulateur" },
    ],
  },
  {
    value: "quotes",
    label: "Devis",
    icon: FileText,
    subTabs: [
      { value: "quotes-list", label: "Liste devis" },
      { value: "quotes-new", label: "Nouveau devis" },
      { value: "quotes-synthesis", label: "Synthèse" },
    ],
  },
  {
    value: "guide",
    label: "Guide",
    icon: BookOpen,
  },
];

export default function AdminBusiness() {
  const [modules, setModules] = useState<ModuleConfig[]>(DEFAULT_MODULES);
  const [channels, setChannels] = useState<ChannelConfig[]>(DEFAULT_CHANNELS);
  const [segments, setSegments] = useState<SegmentConfig[]>(DEFAULT_SEGMENTS);
  const [pricingRoles, setPricingRoles] = useState<PricingRole[]>(DEFAULT_PRICING_ROLES);
  const [saleModels] = useState<SaleModel[]>(DEFAULT_SALE_MODELS);

  const [activeSection, setActiveSection] = useState("overview");
  const currentSection = sections.find(s => s.value === activeSection)!;
  const [subTabMap, setSubTabMap] = useState<Record<string, string>>({});
  const activeSubTab = subTabMap[activeSection] || currentSection.subTabs?.[0]?.value || "";

  const setSubTab = (v: string) => setSubTabMap(prev => ({ ...prev, [activeSection]: v }));

  return (
    <AdminShell>
      <div className="p-6 space-y-6">

        {/* Level 1 — Main sections */}
        <div className="flex flex-wrap gap-1.5 bg-muted/50 p-1.5 rounded-xl border border-border/30">
          {sections.map(s => (
            <button
              key={s.value}
              onClick={() => setActiveSection(s.value)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
                activeSection === s.value
                  ? "bg-background text-foreground shadow-sm border border-border/50"
                  : "text-muted-foreground hover:text-foreground hover:bg-background/50"
              }`}
            >
              <s.icon className="h-4 w-4" />
              {s.label}
            </button>
          ))}
        </div>

        {/* Level 2 — Sub-tabs */}
        {currentSection.subTabs && currentSection.subTabs.length > 0 && (
          <div className="flex gap-1 border-b border-border/30 pb-0">
            {currentSection.subTabs.map(st => (
              <button
                key={st.value}
                onClick={() => setSubTab(st.value)}
                className={`px-4 py-2 text-sm font-medium border-b-2 transition-all -mb-px ${
                  activeSubTab === st.value
                    ? "border-primary text-foreground"
                    : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
                }`}
              >
                {st.label}
              </button>
            ))}
          </div>
        )}

        {/* Content */}
        <div className="min-h-[400px]">
          {/* Vue d'ensemble */}
          {activeSubTab === "overview-main" && <BusinessOverviewTab />}
          {activeSubTab === "overview-offer" && <BusinessOfferTab modules={modules} onModulesChange={setModules} />}

          {/* Business Model */}
          {activeSubTab === "model-pricing" && <BusinessPricingTab pricingRoles={pricingRoles} onPricingRolesChange={setPricingRoles} />}
          {activeSubTab === "model-channels" && <BusinessChannelsTab channels={channels} onChannelsChange={setChannels} />}
          {activeSubTab === "model-market" && <BusinessMarketTab segments={segments} onSegmentsChange={setSegments} />}

          {/* Simulations */}
          {activeSubTab === "sim-partners" && <BusinessPartnersTab />}
          {activeSubTab === "sim-enterprise" && <BusinessEnterpriseTab />}
          {activeSubTab === "sim-simulator" && <BusinessSimulatorTab />}

          {/* Devis */}
          {activeSubTab === "quotes-list" && <BusinessQuoteListTab />}
          {activeSubTab === "quotes-new" && (
            <BusinessQuoteTab
              modules={modules}
              segments={segments}
              channels={channels}
              pricingRoles={pricingRoles}
              saleModels={saleModels}
            />
          )}
          {activeSubTab === "quotes-synthesis" && <BusinessQuoteSynthesisTab />}

          {/* Guide */}
          {activeSection === "guide" && <BusinessGuideTab />}
        </div>
      </div>
    </AdminShell>
  );
}
