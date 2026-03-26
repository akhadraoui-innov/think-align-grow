import { useState, useRef, useEffect, useCallback } from "react";
import { cn } from "@/lib/utils";

interface CodeEditorProps {
  value: string;
  onChange?: (value: string) => void;
  language?: string;
  readOnly?: boolean;
  className?: string;
  placeholder?: string;
  minHeight?: string;
}

// Simple syntax-highlighted code editor using a textarea overlay pattern
export function CodeEditor({
  value,
  onChange,
  language = "typescript",
  readOnly = false,
  className,
  placeholder = "// Écrivez votre code ici...",
  minHeight = "200px",
}: CodeEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [lineCount, setLineCount] = useState(1);

  useEffect(() => {
    setLineCount(Math.max((value || "").split("\n").length, 1));
  }, [value]);

  return (
    <div className={cn("rounded-lg border bg-[hsl(var(--card))] overflow-hidden", className)}>
      {/* Language badge */}
      <div className="flex items-center justify-between px-3 py-1.5 border-b bg-muted/30 text-[10px]">
        <span className="font-mono uppercase tracking-wider text-muted-foreground">{language}</span>
        {readOnly && <span className="text-muted-foreground">lecture seule</span>}
      </div>

      <div className="flex overflow-auto" style={{ minHeight }}>
        {/* Line numbers */}
        <div className="select-none px-3 py-3 text-right border-r bg-muted/20 text-muted-foreground font-mono text-xs leading-6 shrink-0">
          {Array.from({ length: lineCount }).map((_, i) => (
            <div key={i}>{i + 1}</div>
          ))}
        </div>

        {/* Code area */}
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => onChange?.(e.target.value)}
          readOnly={readOnly}
          placeholder={placeholder}
          spellCheck={false}
          className={cn(
            "flex-1 p-3 font-mono text-xs leading-6 resize-none outline-none bg-transparent",
            "text-foreground placeholder:text-muted-foreground/40",
            readOnly && "cursor-default opacity-80"
          )}
          style={{ minHeight, tabSize: 2 }}
          onKeyDown={(e) => {
            // Tab support
            if (e.key === "Tab") {
              e.preventDefault();
              if (!readOnly && textareaRef.current) {
                const start = textareaRef.current.selectionStart;
                const end = textareaRef.current.selectionEnd;
                const newValue = value.substring(0, start) + "  " + value.substring(end);
                onChange?.(newValue);
                // Restore cursor
                requestAnimationFrame(() => {
                  textareaRef.current!.selectionStart = textareaRef.current!.selectionEnd = start + 2;
                });
              }
            }
          }}
        />
      </div>
    </div>
  );
}
