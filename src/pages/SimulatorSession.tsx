import { useLocation, useNavigate } from "react-router-dom";
import { SimulatorEngine } from "@/components/simulator/SimulatorEngine";
import { PageTransition } from "@/components/ui/PageTransition";
import { useEffect } from "react";

export default function SimulatorSession() {
  const location = useLocation();
  const navigate = useNavigate();
  const simConfig = location.state as any;

  useEffect(() => {
    if (!simConfig) navigate("/simulator", { replace: true });
  }, [simConfig, navigate]);

  if (!simConfig) return null;

  return (
    <PageTransition>
      <div className="h-[calc(100vh-3rem)] flex flex-col overflow-hidden">
        <SimulatorEngine
          practiceType={simConfig.key}
          typeConfig={simConfig.practice?.type_config || simConfig.def?.defaultConfig || {}}
          systemPrompt={simConfig.systemPrompt}
          scenario={simConfig.scenario}
          maxExchanges={simConfig.practice?.max_exchanges || 10}
          practiceId={simConfig.practiceId || "__standalone__"}
          previewMode={!simConfig.practiceId}
          difficulty={simConfig.practice?.difficulty || "intermediate"}
          aiAssistanceLevel={simConfig.aiLevel}
          onClose={() => navigate("/simulator")}
          sessionTitle={simConfig.practice?.title || simConfig.def?.label}
        />
      </div>
    </PageTransition>
  );
}
