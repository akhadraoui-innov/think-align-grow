import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageSquare, ChevronLeft, ChevronRight, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EnrichedMarkdown } from "@/components/academy/EnrichedMarkdown";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

interface ReplayMessage {
  role: "user" | "assistant";
  content: string;
}

interface SessionReplayProps {
  open: boolean;
  onClose: () => void;
  messages: ReplayMessage[];
  score?: number;
}

export function SessionReplay({ open, onClose, messages, score }: SessionReplayProps) {
  const [step, setStep] = useState(0);

  const filtered = messages.filter((m) => m.content.trim().length > 0);
  const current = filtered[step];
  const total = filtered.length;

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4 text-primary" />
            Replay de session
            {score !== undefined && (
              <Badge variant="outline" className="ml-auto text-xs">
                Score: {score}/100
              </Badge>
            )}
          </DialogTitle>
          <DialogDescription>
            Revivez vos échanges étape par étape ({step + 1}/{total})
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 min-h-0 overflow-y-auto py-4">
          {current && (
            <AnimatePresence mode="wait">
              <motion.div
                key={step}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
              >
                <div className="flex items-center gap-2 mb-3">
                  <Badge variant={current.role === "user" ? "default" : "secondary"}>
                    {current.role === "user" ? "Vous" : "IA"}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    Message {step + 1} sur {total}
                  </span>
                </div>
                <div
                  className={cn(
                    "rounded-xl p-4 text-sm",
                    current.role === "user"
                      ? "bg-primary/10 border border-primary/20"
                      : "bg-muted"
                  )}
                >
                  {current.role === "assistant" ? (
                    <EnrichedMarkdown content={current.content} />
                  ) : (
                    <p className="whitespace-pre-wrap">{current.content}</p>
                  )}
                </div>
              </motion.div>
            </AnimatePresence>
          )}
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between pt-2 border-t">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setStep((s) => Math.max(0, s - 1))}
            disabled={step === 0}
            className="gap-1"
          >
            <ChevronLeft className="h-3.5 w-3.5" /> Précédent
          </Button>

          {/* Progress dots */}
          <div className="flex gap-1">
            {filtered.map((m, i) => (
              <button
                key={i}
                onClick={() => setStep(i)}
                className={cn(
                  "h-2 rounded-full transition-all",
                  i === step
                    ? "w-4 bg-primary"
                    : m.role === "user"
                    ? "w-2 bg-primary/30"
                    : "w-2 bg-muted-foreground/30"
                )}
              />
            ))}
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setStep((s) => Math.min(total - 1, s + 1))}
            disabled={step >= total - 1}
            className="gap-1"
          >
            Suivant <ChevronRight className="h-3.5 w-3.5" />
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
