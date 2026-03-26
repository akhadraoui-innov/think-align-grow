import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";

interface SuggestionChipsProps {
  suggestions: string[];
  onSelect: (text: string) => void;
  disabled?: boolean;
}

export function SuggestionChips({ suggestions, onSelect, disabled }: SuggestionChipsProps) {
  if (!suggestions.length) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-wrap gap-1.5 px-4 pb-2"
    >
      <span className="text-[10px] text-muted-foreground flex items-center gap-1">
        <Sparkles className="h-3 w-3" /> Suggestions :
      </span>
      {suggestions.map((s, i) => (
        <motion.button
          key={i}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: i * 0.05 }}
          onClick={() => !disabled && onSelect(s)}
          disabled={disabled}
          className="text-[11px] px-3 py-1.5 rounded-full bg-primary/5 border border-primary/20 text-primary hover:bg-primary/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {s}
        </motion.button>
      ))}
    </motion.div>
  );
}
