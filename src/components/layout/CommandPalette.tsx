import { useEffect, useState, useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { usePillars, useCards } from "@/hooks/useToolkitData";
import { useNotifications } from "@/hooks/useNotifications";
import {
  Brain, Briefcase, Lightbulb, TrendingUp, Megaphone, Settings, Users, Shield, Rocket, Heart,
  FileText, Layers, Sparkles, GraduationCap, Mail, Activity, ShieldCheck, Building2, Zap,
  ListChecks, BookOpen, MessageSquare, CheckCheck, Send, Inbox, Lock, Search,
} from "lucide-react";
import { useAdminRole } from "@/hooks/useAdminRole";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Brain, Briefcase, Lightbulb, TrendingUp, Megaphone, Settings, Users, Shield, Rocket, Heart,
};

interface CommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const PRO_TIPS = [
  "Astuce — appuyez sur g puis e pour ouvrir Email Studio",
  "Astuce — Cmd+K depuis n'importe où ouvre cette barre",
  "Astuce — la cloche Mail vibre quand un email échoue",
];

export function CommandPalette({ open, onOpenChange }: CommandPaletteProps) {
  const { data: pillars } = usePillars();
  const { data: cards } = useCards();
  const navigate = useNavigate();
  const location = useLocation();
  const { isAdmin } = useAdminRole();
  const { markAllRead, unreadCount } = useNotifications(20);
  const [tipIndex, setTipIndex] = useState(0);

  // Rotation des pro tips
  useEffect(() => {
    if (!open) return;
    const t = setInterval(() => setTipIndex((i) => (i + 1) % PRO_TIPS.length), 8000);
    return () => clearInterval(t);
  }, [open]);

  const go = (path: string) => {
    navigate(path);
    onOpenChange(false);
  };

  const runAction = (label: string, fn: () => void) => {
    fn();
    onOpenChange(false);
    toast.success(label);
  };

  // Suggestions contextuelles
  const suggestions = useMemo(() => {
    const path = location.pathname;
    const items: Array<{ label: string; icon: any; action: () => void; keys?: string[] }> = [];
    if (path.startsWith("/admin/emails") || path.startsWith("/admin/health")) {
      items.push({ label: "Voir tous les logs email", icon: ListChecks, action: () => go("/admin/emails"), keys: ["g", "l"] });
      items.push({ label: "Health système", icon: Activity, action: () => go("/admin/health"), keys: ["g", "h"] });
    }
    if (path.startsWith("/portal")) {
      items.push({ label: "Préférences email", icon: Mail, action: () => go("/portal/preferences"), keys: ["g", "p"] });
      items.push({ label: "Mes formations", icon: GraduationCap, action: () => go("/portal"), keys: ["g", "f"] });
    }
    if (unreadCount > 0) {
      items.push({
        label: `Marquer toutes notifs lues (${unreadCount})`,
        icon: CheckCheck,
        action: () => runAction("Notifications marquées comme lues", () => markAllRead()),
      });
    }
    return items;
  }, [location.pathname, unreadCount]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn(
          "p-0 gap-0 max-w-2xl border-0 bg-transparent shadow-none",
          "top-[20%] translate-y-0",
          "data-[state=open]:animate-none"
        )}
        hideClose
      >
        <div className="studio-surface-4 studio-shadow-monolith rounded-2xl overflow-hidden studio-pop-in">
          <div className="absolute inset-0 rounded-2xl ring-1 ring-inset ring-white/40 pointer-events-none" />
          <Command className="bg-transparent">
            <div className="flex items-center gap-2.5 px-4 border-b border-foreground/[0.06]">
              <Search className="h-4 w-4 text-muted-foreground/70 shrink-0" />
              <CommandInput
                placeholder="Rechercher : pages, cartes, actions, IA…"
                className="h-12 border-0 focus:ring-0 placeholder:text-muted-foreground/60 text-[14px] font-medium"
              />
              <kbd className="studio-kbd shrink-0">ESC</kbd>
            </div>

            <CommandList className="max-h-[420px] py-2">
              <CommandEmpty className="py-8 text-center text-xs text-muted-foreground">
                Aucun résultat.
              </CommandEmpty>

              {suggestions.length > 0 && (
                <>
                  <CmdSection heading="Suggestions">
                    {suggestions.map((s, i) => (
                      <CmdItem key={i} icon={s.icon} label={s.label} keys={s.keys} onSelect={s.action} />
                    ))}
                  </CmdSection>
                  <CommandSeparator className="my-1.5 bg-foreground/[0.05]" />
                </>
              )}

              <CmdSection heading="Email Studio">
                <CmdItem icon={Mail} label="Email Studio — Composer" keys={["g", "c"]} onSelect={() => go(isAdmin ? "/admin/emails" : "/portal/preferences")} />
                <CmdItem icon={FileText} label="Templates email" keys={["g", "t"]} onSelect={() => go("/admin/emails")} />
                <CmdItem icon={Send} label="Logs d'envoi" keys={["g", "l"]} onSelect={() => go("/admin/emails")} />
                <CmdItem icon={Activity} label="Health emails" keys={["g", "h"]} onSelect={() => go("/admin/health")} />
                <CmdItem icon={Inbox} label="Mes préférences email" keys={["g", "p"]} onSelect={() => go("/portal/preferences")} />
              </CmdSection>

              <CommandSeparator className="my-1.5 bg-foreground/[0.05]" />

              <CmdSection heading="Aller à — Portail">
                <CmdItem icon={Layers} label="Tableau de bord" keys={["g", "d"]} onSelect={() => go("/portal")} />
                <CmdItem icon={Sparkles} label="Pratique" onSelect={() => go("/portal/pratique")} />
                <CmdItem icon={Briefcase} label="Workshops" keys={["g", "w"]} onSelect={() => go("/portal/workshops")} />
                <CmdItem icon={Rocket} label="Challenges" onSelect={() => go("/portal/challenges")} />
                <CmdItem icon={GraduationCap} label="Académie" keys={["g", "a"]} onSelect={() => go("/portal/academie")} />
                <CmdItem icon={Brain} label="AI Value Builder" onSelect={() => go("/portal/ucm")} />
                <CmdItem icon={Activity} label="Insight" onSelect={() => go("/portal/insight")} />
              </CmdSection>

              {isAdmin && (
                <>
                  <CommandSeparator className="my-1.5 bg-foreground/[0.05]" />
                  <CmdSection heading="Administration">
                    <CmdItem icon={Layers} label="Dashboard admin" onSelect={() => go("/admin")} />
                    <CmdItem icon={Building2} label="Organisations" onSelect={() => go("/admin/organizations")} />
                    <CmdItem icon={Users} label="Utilisateurs" onSelect={() => go("/admin/users")} />
                    <CmdItem icon={BookOpen} label="Toolkits" onSelect={() => go("/admin/toolkits")} />
                    <CmdItem icon={GraduationCap} label="Academy" onSelect={() => go("/admin/academy")} />
                  </CmdSection>

                  <CommandSeparator className="my-1.5 bg-foreground/[0.05]" />

                  <CmdSection heading="Sécurité & Compliance">
                    <CmdItem icon={ShieldCheck} label="Audit immuable" onSelect={() => go("/admin/audit")} />
                    <CmdItem icon={Lock} label="Allowlist webhooks" onSelect={() => go("/admin/settings")} />
                    <CmdItem icon={ListChecks} label="Logs d'activité" onSelect={() => go("/admin/logs")} />
                    <CmdItem icon={Activity} label="Health système" onSelect={() => go("/admin/health")} />
                  </CmdSection>
                </>
              )}

              {pillars && pillars.length > 0 && (
                <>
                  <CommandSeparator className="my-1.5 bg-foreground/[0.05]" />
                  <CmdSection heading="Piliers">
                    {pillars.slice(0, 8).map((pillar) => {
                      const Icon = iconMap[pillar.icon_name || "Brain"] || Brain;
                      return (
                        <CmdItem
                          key={pillar.id}
                          icon={Icon}
                          label={pillar.name}
                          onSelect={() => go(`/explore?pillar=${pillar.id}`)}
                        />
                      );
                    })}
                  </CmdSection>
                </>
              )}

              {cards && cards.length > 0 && (
                <>
                  <CommandSeparator className="my-1.5 bg-foreground/[0.05]" />
                  <CmdSection heading="Cartes stratégiques">
                    {cards.slice(0, 8).map((card) => (
                      <CmdItem
                        key={card.id}
                        icon={FileText}
                        label={card.title}
                        onSelect={() => go(`/explore?card=${card.id}`)}
                      />
                    ))}
                  </CmdSection>
                </>
              )}
            </CommandList>

            <div className="flex items-center justify-between gap-3 px-4 py-2.5 border-t border-foreground/[0.06] bg-foreground/[0.02]">
              <p className="text-[10px] text-muted-foreground/80 italic studio-display truncate">
                {PRO_TIPS[tipIndex]}
              </p>
              <div className="flex items-center gap-3 shrink-0">
                <span className="flex items-center gap-1 text-[10px] text-muted-foreground/70">
                  <kbd className="studio-kbd">↑↓</kbd> naviguer
                </span>
                <span className="flex items-center gap-1 text-[10px] text-muted-foreground/70">
                  <kbd className="studio-kbd">↵</kbd> exécuter
                </span>
                <span className="flex items-center gap-1 text-[10px] text-muted-foreground/70">
                  <kbd className="studio-kbd">⌘</kbd>
                  <kbd className="studio-kbd">K</kbd>
                </span>
              </div>
            </div>
          </Command>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function CmdSection({ heading, children }: { heading: string; children: React.ReactNode }) {
  return (
    <CommandGroup
      heading={heading}
      className={cn(
        "[&_[cmdk-group-heading]]:px-3 [&_[cmdk-group-heading]]:py-1.5",
        "[&_[cmdk-group-heading]]:studio-microcaps [&_[cmdk-group-heading]]:text-[9px]",
        "[&_[cmdk-group-heading]]:text-foreground/60 px-1.5"
      )}
    >
      {children}
    </CommandGroup>
  );
}

function CmdItem({
  icon: Icon, label, keys, onSelect,
}: { icon: any; label: string; keys?: string[]; onSelect: () => void }) {
  return (
    <CommandItem
      value={label}
      onSelect={onSelect}
      className="px-2.5 py-1.5 rounded-lg gap-2.5 text-[12.5px] font-medium data-[selected=true]:bg-foreground/[0.06] data-[selected=true]:text-foreground transition-colors duration-180 ease-studio cursor-pointer"
    >
      <Icon className="h-3.5 w-3.5 text-muted-foreground/80 shrink-0" />
      <span className="flex-1 truncate">{label}</span>
      {keys && (
        <span className="flex gap-0.5 shrink-0">
          {keys.map((k, i) => (
            <kbd key={i} className="studio-kbd">{k}</kbd>
          ))}
        </span>
      )}
    </CommandItem>
  );
}
