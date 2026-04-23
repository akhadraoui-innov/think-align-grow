// Client-side mirror of the trigger-email Edge Function rule engine.
// Used for dry-run validation in the admin UI.
import type { ConditionRule, ConditionsDSL } from "@/hooks/useEmailAutomations";

function getPath(obj: any, path: string): any {
  if (!path) return undefined;
  return path.split(".").reduce((acc: any, key) => (acc == null ? undefined : acc[key]), obj);
}

export function evalRule(rule: ConditionRule, ctx: any): boolean {
  const left = getPath(ctx, rule.path);
  const right = rule.value;
  switch (rule.op) {
    case "==": return left == right; // eslint-disable-line eqeqeq
    case "!=": return left != right; // eslint-disable-line eqeqeq
    case ">": return Number(left) > Number(right);
    case ">=": return Number(left) >= Number(right);
    case "<": return Number(left) < Number(right);
    case "<=": return Number(left) <= Number(right);
    case "in":
      return Array.isArray(right) && right.includes(left);
    case "contains":
      if (Array.isArray(left)) return left.includes(right);
      if (typeof left === "string") return left.includes(String(right));
      return false;
    case "exists":
      return left !== undefined && left !== null;
    default:
      return false;
  }
}

export interface EvalReport {
  passed: boolean;
  details: Array<{ rule: ConditionRule; group: "all" | "any"; result: boolean; leftValue: any }>;
  reason: string;
}

export function evalConditions(conditions: ConditionsDSL | Record<string, never> | null, ctx: any): EvalReport {
  const all = (conditions as ConditionsDSL)?.all ?? [];
  const any = (conditions as ConditionsDSL)?.any ?? [];

  const details: EvalReport["details"] = [];

  for (const r of all) {
    const result = evalRule(r, ctx);
    details.push({ rule: r, group: "all", result, leftValue: getPath(ctx, r.path) });
  }
  for (const r of any) {
    const result = evalRule(r, ctx);
    details.push({ rule: r, group: "any", result, leftValue: getPath(ctx, r.path) });
  }

  const allPass = all.length === 0 || details.filter(d => d.group === "all").every(d => d.result);
  const anyPass = any.length === 0 || details.filter(d => d.group === "any").some(d => d.result);
  const passed = allPass && anyPass;

  let reason = "✓ Toutes les conditions passent — l'automation se déclencherait.";
  if (!allPass) {
    const failing = details.filter(d => d.group === "all" && !d.result).length;
    reason = `✗ ${failing} règle(s) AND échouent — pas de déclenchement.`;
  } else if (!anyPass) {
    reason = "✗ Aucune règle OR ne passe — pas de déclenchement.";
  }
  if (all.length === 0 && any.length === 0) {
    reason = "ℹ Aucune condition définie — l'automation se déclenche pour TOUS les événements de ce type.";
  }

  return { passed, details, reason };
}

// Sample payloads aligned with TRIGGER_EVENTS payloadHints
export const SAMPLE_PAYLOADS: Record<string, any> = {
  "user.created": { firstName: "Alice", displayName: "Alice Dupont" },
  "user.status.suspended": { displayName: "Alice Dupont" },
  "user.inactive": { firstName: "Alice", daysInactive: 45 },
  "org.invitation.sent": { inviterName: "Bob", orgName: "Acme Inc", acceptUrl: "https://app/invite/xyz" },
  "subscription.upgraded": { planName: "Pro" },
  "subscription.downgraded": { planName: "Starter" },
  "credits.low": { balance: 5, threshold: 10 },
  "academy.path.completed": { pathName: "AI Foundations", score: 92 },
  "academy.path.enrolled": { pathName: "AI Foundations" },
  "campaign.scheduled": {},
};
