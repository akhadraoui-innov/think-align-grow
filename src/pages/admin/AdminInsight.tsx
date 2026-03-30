import { useState } from "react";
import { AdminShell } from "@/components/admin/AdminShell";
import { InsightContent } from "@/components/insight/InsightContent";
import { InsightSidebar } from "@/components/insight/InsightSidebar";

export default function AdminInsight() {
  const [activeSection, setActiveSection] = useState("overview");

  return (
    <AdminShell>
      <div className="flex h-full min-h-[calc(100vh-3.5rem)]">
        <InsightSidebar activeSection={activeSection} onSectionChange={setActiveSection} />
        <div className="flex-1 overflow-auto">
          <InsightContent activeSection={activeSection} />
        </div>
      </div>
    </AdminShell>
  );
}
