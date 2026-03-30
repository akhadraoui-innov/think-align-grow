import { Link, useNavigate } from "react-router-dom";
import { LogOut, BookText, Puzzle, MessageSquare, Bookmark } from "lucide-react";
import { cn } from "@/lib/utils";

const ITEMS = [
  { icon: LogOut, label: "Exit", action: "exit" },
  { icon: BookText, label: "Glossary", action: "glossary" },
  { icon: Puzzle, label: "Module", action: "module" },
  { icon: MessageSquare, label: "Discuss", action: "discuss" },
  { icon: Bookmark, label: "Save", action: "save" },
] as const;

export function PortalBottomBar() {
  const navigate = useNavigate();

  const handleAction = (action: string) => {
    switch (action) {
      case "exit":
        navigate("/portal");
        break;
      // Other actions will open sheets/panels when implemented
      default:
        break;
    }
  };

  return (
    <div className="sticky bottom-0 z-40 border-t border-border/50 bg-background/90 backdrop-blur-xl">
      <div className="flex items-center justify-around h-12 max-w-lg mx-auto">
        {ITEMS.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.action}
              onClick={() => handleAction(item.action)}
              className={cn(
                "flex flex-col items-center gap-0.5 px-3 py-1 rounded-lg transition-colors",
                "text-muted-foreground hover:text-foreground hover:bg-muted/40",
                item.action === "exit" && "text-destructive/70 hover:text-destructive"
              )}
            >
              <Icon className="h-4 w-4" />
              <span className="text-[9px] font-medium">{item.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
