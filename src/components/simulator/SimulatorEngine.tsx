// SimulatorEngine — Routes practice_type to the correct UI family component
import { getModeDefinition, type ModeFamily } from "./config/modeRegistry";
import { ChatMode } from "./modes/ChatMode";
import { CodeMode } from "./modes/CodeMode";

interface SimulatorEngineProps {
  practiceType: string;
  typeConfig: Record<string, unknown>;
  systemPrompt: string;
  scenario: string;
  maxExchanges: number;
  practiceId: string;
  previewMode?: boolean;
  onComplete?: (score: number) => void;
}

export function SimulatorEngine(props: SimulatorEngineProps) {
  const modeDef = getModeDefinition(props.practiceType);
  const family: ModeFamily = modeDef?.family || "chat";

  switch (family) {
    case "code":
      return <CodeMode {...props} />;

    case "chat":
    case "document":   // TODO Phase 4
    case "analysis":   // TODO Phase 5
    case "decision":   // TODO Phase 3
    case "design":     // TODO Phase 7
    case "assessment": // TODO Phase 6
    default:
      return <ChatMode {...props} />;
  }
}
