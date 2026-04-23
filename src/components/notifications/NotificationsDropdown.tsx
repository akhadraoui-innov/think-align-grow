import { useNavigate } from "react-router-dom";
import { Bell, Check, CircleAlert, CircleCheck, Info, TriangleAlert, ArrowUpRight } from "lucide-react";
import { SignalWidget, SignalHeader, SignalFooter, SignalShortcut, SignalTone } from "@/components/shell/SignalWidget";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { useNotifications, type NotificationRow } from "@/hooks/useNotifications";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";

const severityIcon = {
  info: Info,
  success: CircleCheck,
  warning: TriangleAlert,
  error: CircleAlert,
} as const;

const severityClass = {
  info: "text-[hsl(var(--pillar-innovation))]",
  success: "text-[hsl(var(--pillar-growth))]",
  warning: "text-[hsl(38_95%_35%)]",
  error: "text-destructive",
} as const;

interface Props {
  variant?: "portal" | "admin";
}

export function NotificationsDropdown({ variant = "portal" }: Props) {
  const navigate = useNavigate();
  const { notifications, unreadCount, markRead, markAllRead } = useNotifications(20);

  const hasError = notifications.some((n) => !n.read_at && n.severity === "error");
  const tone: SignalTone = hasError ? "danger" : unreadCount > 0 ? "info" : "neutral";

  const handleClick = (n: NotificationRow, close: () => void) => {
    if (!n.read_at) markRead([n.id]);
    if (n.link) {
      navigate(n.link);
      close();
    }
  };

  return (
    <SignalWidget
      icon={Bell}
      label="Notifications"
      count={unreadCount}
      tone={tone}
      pulse={hasError}
      variant={variant}
      width={384}
    >
      {(close) => (
        <div className="flex flex-col">
          <SignalHeader
            label="Notifications"
            meta={unreadCount > 0 ? `${unreadCount} non lu${unreadCount > 1 ? "es" : "e"}` : undefined}
            action={
              unreadCount > 0 ? (
                <button
                  onClick={() => markAllRead()}
                  className="flex items-center gap-1 text-[10px] font-semibold text-muted-foreground hover:text-foreground transition-colors"
                >
                  <Check className="h-3 w-3" />
                  TOUT LIRE
                </button>
              ) : null
            }
          />

          <ScrollArea className="max-h-[440px]">
            {notifications.length === 0 ? (
              <div className="px-4 py-10 text-center">
                <Bell className="h-5 w-5 mx-auto text-muted-foreground/40 mb-1.5" />
                <p className="text-[11px] text-muted-foreground">Aucune notification</p>
              </div>
            ) : (
              <ul className="px-1.5 pb-1.5">
                {notifications.map((n) => {
                  const Icon = severityIcon[n.severity] ?? Info;
                  return (
                    <li key={n.id}>
                      <button
                        onClick={() => handleClick(n, close)}
                        className={cn(
                          "w-full flex gap-2.5 px-2.5 py-2 rounded-lg text-left transition-colors duration-180 ease-studio",
                          "hover:bg-foreground/[0.045]",
                          !n.read_at && "bg-primary/[0.05]"
                        )}
                      >
                        <Icon className={cn("h-3.5 w-3.5 mt-1 shrink-0", severityClass[n.severity])} strokeWidth={2.2} />
                        <div className="flex-1 min-w-0">
                          <p className={cn("text-[12px] leading-snug", !n.read_at ? "font-bold text-foreground" : "font-medium text-muted-foreground")}>
                            {n.title}
                          </p>
                          {n.body && (
                            <p className="text-[11px] text-muted-foreground/85 mt-0.5 line-clamp-2 leading-snug">{n.body}</p>
                          )}
                          <p className="text-[10px] text-muted-foreground/60 mt-0.5 studio-tnum">
                            {formatDistanceToNow(new Date(n.created_at), { addSuffix: true, locale: fr })}
                          </p>
                        </div>
                        {!n.read_at && (
                          <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2 shrink-0 studio-pulse" />
                        )}
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </ScrollArea>

          <SignalFooter>
            <SignalShortcut
              keys={["g", "n"]}
              label="Voir tout"
              onClick={() => {
                navigate(variant === "admin" ? "/admin" : "/portal");
                close();
              }}
            />
          </SignalFooter>
        </div>
      )}
    </SignalWidget>
  );
}
