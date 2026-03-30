import { useParams, useNavigate } from "react-router-dom";
import { InsightContent } from "@/components/insight/InsightContent";
import { useEffect } from "react";

export default function PortalInsight() {
  const { section } = useParams<{ section?: string }>();
  const activeSection = section || "overview";

  return (
    <div className="flex-1 overflow-auto">
      <InsightContent activeSection={activeSection} />
    </div>
  );
}
