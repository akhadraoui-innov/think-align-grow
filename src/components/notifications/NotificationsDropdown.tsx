import { useNavigate } from "react-router-dom";
import { Bell, Check, CircleAlert, CircleCheck, Info, TriangleAlert } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
  info: "text-primary",
  success: "text-emerald-500",
  warning: "text-amber-500",
  error: "text-destructive",
} as const;

interface Props {
  variant?: "portal" | "admin";
}

export function NotificationsDropdown({ variant = "portal" }: Props) {
  const navigate = useNavigate();
  const { notifications, unreadCount, markRead, markAllRead } = useNotifications(20);

  const handleClick = (n: NotificationRow) => {
    if (!n.read_at) markRead([n.id]);
    if (n.link) navigate(n.link);
  };

  const triggerClass =
    variant === "portal"
      ? "h-9 w-9 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors relative"
      : "h-8 w-8 rounded-md flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors relative";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className={triggerClass} aria-label="Notifications">
          <Bell className="h-4.5 w-4.5" />
          {unreadCount > 0 && (
            <span className="absolute top-0.5 right-0.5 min-w-[1.1rem] h-[1.1rem] px-1 rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold flex items-center justify-center">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[380px] p-0" sideOffset={8}>
        <div className="flex items-center justify-between px-4 py-3 border-b border-border/50">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold">Notifications</span>
            {unreadCount > 0 && (
              <Badge variant="secondary" className="h-5 px-1.5 text-[10px]">
                {unreadCount}
              </Badge>
            )}
          </div>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 px-2 text-xs"
              onClick={() => markAllRead()}
            >
              <Check className="h-3 w-3 mr-1" />
              Tout marquer lu
            </Button>
          )}
        </div>

        <ScrollArea className="max-h-[440px]">
          {notifications.length === 0 ? (
            <div className="px-4 py-10 text-center text-xs text-muted-foreground">
              Aucune notification pour le moment.
            </div>
          ) : (
            <ul className="divide-y divide-border/40">
              {notifications.map((n) => {
                const Icon = severityIcon[n.severity] ?? Info;
                return (
                  <li key={n.id}>
                    <button
                      onClick={() => handleClick(n)}
                      className={cn(
                        "w-full flex gap-3 px-4 py-3 text-left transition-colors hover:bg-muted/50",
                        !n.read_at && "bg-primary/5"
                      )}
                    >
                      <Icon className={cn("h-4 w-4 mt-0.5 shrink-0", severityClass[n.severity])} />
                      <div className="flex-1 min-w-0">
                        <p className={cn("text-sm leading-snug", !n.read_at ? "font-semibold" : "font-medium text-muted-foreground")}>
                          {n.title}
                        </p>
                        {n.body && (
                          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{n.body}</p>
                        )}
                        <p className="text-[10px] text-muted-foreground/70 mt-1">
                          {formatDistanceToNow(new Date(n.created_at), { addSuffix: true, locale: fr })}
                        </p>
                      </div>
                      {!n.read_at && (
                        <span className="w-2 h-2 rounded-full bg-primary mt-1.5 shrink-0" />
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </ScrollArea>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
