import type { PresenceUser } from "@/hooks/useChallengePresence";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip";

export function PresenceBar({ peers, meColor }: { peers: PresenceUser[]; meColor?: string }) {
  if (!peers.length) return (
    <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
      <span className="font-bold uppercase tracking-wider">Vous seul</span>
    </div>
  );
  return (
    <TooltipProvider delayDuration={200}>
      <div className="flex items-center gap-1.5">
        <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">{peers.length + 1} en ligne</span>
        <div className="flex -space-x-2">
          {peers.slice(0, 5).map(p => (
            <Tooltip key={p.user_id}>
              <TooltipTrigger asChild>
                <Avatar className="h-7 w-7 ring-2 ring-background" style={{ boxShadow: `0 0 0 2px ${p.color}` }}>
                  {p.avatar_url ? <AvatarImage src={p.avatar_url} /> : null}
                  <AvatarFallback className="text-[10px] font-bold" style={{ background: p.color, color: "#fff" }}>
                    {p.display_name.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                <div className="text-xs">
                  <div className="font-bold">{p.display_name}</div>
                  {p.editing_artifact_id && <div className="text-[10px] opacity-70">✏️ édite un élément</div>}
                </div>
              </TooltipContent>
            </Tooltip>
          ))}
          {peers.length > 5 && (
            <div className="h-7 w-7 rounded-full bg-muted ring-2 ring-background flex items-center justify-center text-[10px] font-bold">
              +{peers.length - 5}
            </div>
          )}
        </div>
      </div>
    </TooltipProvider>
  );
}
