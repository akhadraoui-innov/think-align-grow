// Compute related practices from the MODE_REGISTRY for post-session recommendations
import { MODE_REGISTRY, type ModeDefinition } from "./modeRegistry";

export interface NextPractice {
  label: string;
  type: string;
}

/**
 * Returns up to 3 practices from the same universe or family, excluding the current one.
 * Prioritises same-universe first, then same-family.
 */
export function getNextPractices(currentType: string, limit = 3): NextPractice[] {
  const current = MODE_REGISTRY[currentType];
  if (!current) return [];

  const scored: { key: string; def: ModeDefinition; score: number }[] = [];

  for (const [key, def] of Object.entries(MODE_REGISTRY)) {
    if (key === currentType) continue;
    let score = 0;
    if (def.universe === current.universe) score += 2;
    if (def.family === current.family) score += 1;
    if (score > 0) scored.push({ key, def, score });
  }

  scored.sort((a, b) => b.score - a.score);

  return scored.slice(0, limit).map((s) => ({
    label: s.def.label,
    type: s.key,
  }));
}
