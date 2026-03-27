// SimulatorEngine — Routes practice_type to the correct UI family component, wrapped in SimulatorShell
import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { getModeDefinition, type ModeFamily } from "./config/modeRegistry";
import { SimulatorShell } from "./SimulatorShell";
import { ChatMode } from "./modes/ChatMode";
import { CodeMode } from "./modes/CodeMode";
import { DecisionMode } from "./modes/DecisionMode";
import { DocumentMode } from "./modes/DocumentMode";
import { AnalysisMode } from "./modes/AnalysisMode";
import { DesignMode } from "./modes/DesignMode";
import { AssessmentMode } from "./modes/AssessmentMode";
import { useSimulatorSession } from "@/hooks/useSimulatorSession";

import type { AIAssistanceLevel } from "./SimulatorShell";

interface SimulatorEngineProps {
  practiceType: string;
  typeConfig: Record<string, unknown>;
  systemPrompt: string;
  scenario: string;
  maxExchanges: number;
  practiceId: string | null;
  previewMode?: boolean;
  difficulty?: string;
  aiAssistanceLevel?: AIAssistanceLevel;
  onComplete?: (score: number) => void;
  onClose?: () => void;
  sessionTitle?: string;
}

export function SimulatorEngine(props: SimulatorEngineProps) {
  const navigate = useNavigate();
  const [exchangeCount, setExchangeCount] = useState(0);
  const [resetKey, setResetKey] = useState(0);

  const { sessionId, persistSession, completeSession } = useSimulatorSession(
    props.practiceId,
    props.previewMode
  );

  const modeDef = getModeDefinition(props.practiceType);
  const family: ModeFamily = modeDef?.family || "chat";

  const handleExchangeUpdate = useCallback((count: number) => {
    setExchangeCount(count);
  }, []);

  const handleReset = useCallback(() => {
    setResetKey((k) => k + 1);
    setExchangeCount(0);
  }, []);

  const handleMessagesChange = useCallback(
    (messages: Array<{ id: string; role: "user" | "assistant"; content: string; timestamp: Date }>) => {
      const serialized = messages.map((m) => ({
        id: m.id,
        role: m.role,
        content: m.content,
        timestamp: m.timestamp.toISOString(),
      }));
      persistSession(serialized);
    },
    [persistSession]
  );

  const handleComplete = useCallback(
    async (score: number, messages?: Array<{ id: string; role: "user" | "assistant"; content: string; timestamp: Date }>, evaluation?: any) => {
      if (messages && evaluation) {
        const serialized = messages.map((m) => ({
          id: m.id,
          role: m.role,
          content: m.content,
          timestamp: m.timestamp.toISOString(),
        }));
        await completeSession(serialized, evaluation);
        props.onComplete?.(score);
      } else {
        props.onComplete?.(score);
      }
    },
    [completeSession, props.onComplete]
  );

  const modeProps = {
    ...props,
    key: resetKey,
    sessionId,
    onExchangeUpdate: handleExchangeUpdate,
    onMessagesChange: handleMessagesChange,
    onComplete: handleComplete,
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
      aiAssistanceLevel={props.aiAssistanceLevel}
      onReset={handleReset}
      onClose={props.onClose}
      sessionTitle={props.sessionTitle}
    >
      {renderMode()}
    </SimulatorShell>
  );
}
