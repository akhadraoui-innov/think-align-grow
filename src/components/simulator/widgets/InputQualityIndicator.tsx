import { useMemo } from "react";
import { cn } from "@/lib/utils";

interface InputQualityIndicatorProps {
  text: string;
  practiceType: string;
}

export function InputQualityIndicator({ text, practiceType }: InputQualityIndicatorProps) {
  const analysis = useMemo(() => {
    const length = text.trim().length;
    const wordCount = text.trim().split(/\s+/).filter(Boolean).length;
    const hasQuestion = /\?/.test(text);
    const hasStructure = /\n/.test(text) || /[•\-\d]\./.test(text);

    let score = 0;
    const tips: string[] = [];

    if (length === 0) return { score: 0, tips: [], label: "" };

    // Length scoring
    if (wordCount >= 5) score += 1;
    if (wordCount >= 15) score += 1;
    if (wordCount >= 30) score += 1;

    // Quality signals
    if (hasQuestion) score += 1;
    if (hasStructure) score += 1;

    // Tips
    if (wordCount < 10) tips.push("Développez davantage");
    if (!hasQuestion && ["negotiation", "requirements", "user_interview"].includes(practiceType)) {
      tips.push("Posez des questions");
    }

    const label = score >= 4 ? "Excellent" : score >= 3 ? "Bon" : score >= 2 ? "Correct" : "Court";
    return { score, tips, label };
  }, [text, practiceType]);

  if (!text.trim()) return null;

  return (
    <div className="flex items-center gap-2 px-1 pt-1">
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            className={cn(
              "w-4 h-1 rounded-full transition-colors",
              i <= analysis.score
                ? analysis.score >= 4 ? "bg-emerald-500" : analysis.score >= 2 ? "bg-amber-500" : "bg-red-400"
                : "bg-muted"
            )}
          />
        ))}
      </div>
      <span className={cn(
        "text-[10px]",
        analysis.score >= 4 ? "text-emerald-600" : analysis.score >= 2 ? "text-amber-600" : "text-muted-foreground"
      )}>
        {analysis.label}
      </span>
      {analysis.tips.length > 0 && (
        <span className="text-[10px] text-muted-foreground">
          · {analysis.tips[0]}
        </span>
      )}
    </div>
  );
}
