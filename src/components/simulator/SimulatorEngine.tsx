// SimulatorEngine — Routes practice_type to the correct UI family component, wrapped in SimulatorShell
import { useState, useCallback } from "react";
import { getModeDefinition, type ModeFamily } from "./config/modeRegistry";
import { SimulatorShell } from "./SimulatorShell";
import { ChatMode } from "./modes/ChatMode";
import { CodeMode } from "./modes/CodeMode";
import { DecisionMode } from "./modes/DecisionMode";
import { DocumentMode } from "./modes/DocumentMode";
import { AnalysisMode } from "./modes/AnalysisMode";
import { DesignMode } from "./modes/DesignMode";
import { AssessmentMode } from "./modes/AssessmentMode";

interface SimulatorEngineProps {
  practiceType: string;
  typeConfig: Record<string, unknown>;
  systemPrompt: string;
  scenario: string;
  maxExchanges: number;
  practiceId: string;
  previewMode?: boolean;
  difficulty?: string;
  onComplete?: (score: number) => void;
}

export function SimulatorEngine(props: SimulatorEngineProps) {
  const [exchangeCount, setExchangeCount] = useState(0);
  const [resetKey, setResetKey] = useState(0);

  const modeDef = getModeDefinition(props.practiceType);
  const family: ModeFamily = modeDef?.family || "chat";

  const handleExchangeUpdate = useCallback((count: number) => {
    setExchangeCount(count);
  }, []);

  const handleReset = useCallback(() => {
    setResetKey((k) => k + 1);
    setExchangeCount(0);
  }, []);

  const modeProps = {
    ...props,
    key: resetKey,
    onExchangeUpdate: handleExchangeUpdate,
  };

  const renderMode = () => {
    switch (family) {
      case "code":
        return <CodeMode {...modeProps} />;
      case "decision":
        return <DecisionMode {...modeProps} />;
      case "document":
        return <DocumentMode {...modeProps} />;
      case "analysis":
        return <AnalysisMode {...modeProps} />;
      case "design":
        return <DesignMode {...modeProps} />;
      case "assessment":
        return <AssessmentMode {...modeProps} />;
      case "chat":
      default:
        return <ChatMode {...modeProps} />;
    }
  };

  return (
    <SimulatorShell
      practiceType={props.practiceType}
      practiceId={props.practiceId}
      previewMode={props.previewMode}
      exchangeCount={exchangeCount}
      maxExchanges={props.maxExchanges}
      difficulty={props.difficulty}
      onReset={handleReset}
    >
      {renderMode()}
    </SimulatorShell>
  );
}
