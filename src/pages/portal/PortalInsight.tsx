import { useState } from "react";
import { useParams } from "react-router-dom";
import { InsightContent } from "@/components/insight/InsightContent";
import { InsightSidebar } from "@/components/insight/InsightSidebar";

export default function PortalInsight() {
  const { section } = useParams<{ section?: string }>();
  const [activeSection, setActiveSection] = useState(section || "overview");

  return (
    <div className="flex h-full min-h-[calc(100vh-3.5rem)]">
      <InsightSidebar activeSection={activeSection} onSectionChange={setActiveSection} />
      <div className="flex-1 overflow-auto">
        <InsightContent activeSection={activeSection} />
      </div>
    </div>
  );
}
