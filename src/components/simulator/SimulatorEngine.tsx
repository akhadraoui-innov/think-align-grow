// SimulatorEngine — Routes practice_type to the correct UI family component
import { getModeDefinition, type ModeFamily } from "./config/modeRegistry";
import { ChatMode } from "./modes/ChatMode";

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

  // Phase 1: All modes use ChatMode. Future phases will add CodeMode, DocumentMode, etc.
  switch (family) {
    case "chat":
    case "code":       // TODO Phase 2
    case "document":   // TODO Phase 4
    case "analysis":   // TODO Phase 5
    case "decision":   // TODO Phase 3
    case "design":     // TODO Phase 7
    case "assessment": // TODO Phase 6
    default:
      return <ChatMode {...props} />;
  }
}
