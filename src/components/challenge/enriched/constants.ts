import type { Criticality } from "@/hooks/useChallengeArtifacts";

export const CRITICALITY_META: Record<Criticality, { label: string; bg: string; ring: string; text: string; dot: string }> = {
  low: {
    label: "Faible",
    bg: "bg-emerald-50 dark:bg-emerald-950/30",
    ring: "ring-emerald-300/60 dark:ring-emerald-700/60",
    text: "text-emerald-900 dark:text-emerald-200",
    dot: "bg-emerald-500",
  },
  medium: {
    label: "Modérée",
    bg: "bg-amber-50 dark:bg-amber-950/30",
    ring: "ring-amber-300/70 dark:ring-amber-700/60",
    text: "text-amber-900 dark:text-amber-200",
    dot: "bg-amber-500",
  },
  high: {
    label: "Élevée",
    bg: "bg-orange-50 dark:bg-orange-950/30",
    ring: "ring-orange-300/70 dark:ring-orange-700/60",
    text: "text-orange-900 dark:text-orange-200",
    dot: "bg-orange-500",
  },
  critical: {
    label: "Critique",
    bg: "bg-rose-50 dark:bg-rose-950/30",
    ring: "ring-rose-400/70 dark:ring-rose-700/70",
    text: "text-rose-900 dark:text-rose-200",
    dot: "bg-rose-600",
  },
};

export const PROFESSIONAL_EMOJIS = [
  { e: "💡", label: "Idée" },
  { e: "⚠️", label: "Alerte" },
  { e: "🚨", label: "Urgent" },
  { e: "🎯", label: "Objectif" },
  { e: "📊", label: "Donnée" },
  { e: "🔍", label: "À investiguer" },
  { e: "✅", label: "Validé" },
  { e: "❌", label: "Bloquant" },
  { e: "🔥", label: "Hot" },
  { e: "⭐", label: "Clé" },
  { e: "🤔", label: "À débattre" },
  { e: "🧠", label: "Insight" },
  { e: "🚀", label: "Quick win" },
  { e: "🛠️", label: "Action" },
  { e: "📌", label: "À retenir" },
  { e: "❓", label: "Question" },
];
