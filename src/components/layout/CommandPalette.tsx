import { useNavigate } from "react-router-dom";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import { usePillars, useCards } from "@/hooks/useToolkitData";
import {
  Brain, Briefcase, Lightbulb, TrendingUp, Megaphone, Settings, Users, Shield, Rocket, Heart,
  FileText, Layers, Sparkles, GraduationCap, Mail, Activity, ShieldCheck, Building2, Zap,
  ListChecks, BookOpen, MessageSquare,
} from "lucide-react";
import { useAdminRole } from "@/hooks/useAdminRole";

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Brain, Briefcase, Lightbulb, TrendingUp, Megaphone, Settings, Users, Shield, Rocket, Heart,
};

interface CommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CommandPalette({ open, onOpenChange }: CommandPaletteProps) {
  const { data: pillars } = usePillars();
  const { data: cards } = useCards();
  const navigate = useNavigate();
  const { isAdmin } = useAdminRole();

  const go = (path: string) => {
    navigate(path);
    onOpenChange(false);
  };

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput placeholder="Rechercher : pages, cartes, actions, IA…" />
      <CommandList>
        <CommandEmpty>Aucun résultat.</CommandEmpty>

        <CommandGroup heading="Portail">
          {[
            { label: "Tableau de bord", path: "/portal", icon: Layers },
            { label: "Pratique", path: "/portal/pratique", icon: Sparkles },
            { label: "Workshops", path: "/portal/workshops", icon: Briefcase },
            { label: "Challenges", path: "/portal/challenges", icon: Rocket },
            { label: "Académie", path: "/portal/academie", icon: GraduationCap },
            { label: "AI Value Builder", path: "/portal/ucm", icon: Brain },
            { label: "Insight", path: "/portal/insight", icon: Activity },
            { label: "Préférences email", path: "/portal/preferences", icon: Mail },
          ].map((item) => (
            <CommandItem key={item.path} value={`portail ${item.label}`} onSelect={() => go(item.path)}>
              <item.icon className="mr-2 h-4 w-4 text-muted-foreground" />
              {item.label}
            </CommandItem>
          ))}
        </CommandGroup>

        {isAdmin && (
          <>
            <CommandSeparator />
            <CommandGroup heading="Administration">
              {[
                { label: "Dashboard admin", path: "/admin", icon: Layers },
                { label: "Organisations", path: "/admin/organizations", icon: Building2 },
                { label: "Utilisateurs", path: "/admin/users", icon: Users },
                { label: "Toolkits", path: "/admin/toolkits", icon: BookOpen },
                { label: "Academy", path: "/admin/academy", icon: GraduationCap },
                { label: "Emails", path: "/admin/emails", icon: Mail },
                { label: "Observabilité", path: "/admin/observability", icon: Activity },
                { label: "Audit immuable", path: "/admin/audit", icon: ShieldCheck },
                { label: "Logs d'activité", path: "/admin/logs", icon: ListChecks },
                { label: "Paramètres", path: "/admin/settings", icon: Settings },
                { label: "Crédits & abonnements", path: "/admin/billing", icon: Zap },
              ].map((item) => (
                <CommandItem key={item.path} value={`admin ${item.label}`} onSelect={() => go(item.path)}>
                  <item.icon className="mr-2 h-4 w-4 text-muted-foreground" />
                  {item.label}
                </CommandItem>
              ))}
            </CommandGroup>
          </>
        )}

        <CommandSeparator />
        <CommandGroup heading="Espace exploration">
          {[
            { label: "Explorer le toolkit", path: "/explore", icon: Layers },
            { label: "Plans de jeu", path: "/plans", icon: FileText },
            { label: "Lab / Diagnostic", path: "/lab", icon: Brain },
            { label: "Coach IA", path: "/ai", icon: MessageSquare },
            { label: "Profil", path: "/profile", icon: Users },
          ].map((item) => (
            <CommandItem key={item.path} value={`exploration ${item.label}`} onSelect={() => go(item.path)}>
              <item.icon className="mr-2 h-4 w-4 text-muted-foreground" />
              {item.label}
            </CommandItem>
          ))}
        </CommandGroup>

        {pillars && pillars.length > 0 && (
          <>
            <CommandSeparator />
            <CommandGroup heading="Piliers">
              {pillars.map((pillar) => {
                const Icon = iconMap[pillar.icon_name || "Brain"] || Brain;
                return (
                  <CommandItem
                    key={pillar.id}
                    value={`pilier ${pillar.name}`}
                    onSelect={() => go(`/explore?pillar=${pillar.id}`)}
                  >
                    <Icon className="mr-2 h-4 w-4 text-muted-foreground" />
                    {pillar.name}
                  </CommandItem>
                );
              })}
            </CommandGroup>
          </>
        )}

        {cards && cards.length > 0 && (
          <>
            <CommandSeparator />
            <CommandGroup heading="Cartes stratégiques">
              {cards.slice(0, 12).map((card) => (
                <CommandItem
                  key={card.id}
                  value={`carte ${card.title}`}
                  onSelect={() => go(`/explore?card=${card.id}`)}
                >
                  <FileText className="mr-2 h-4 w-4 text-muted-foreground" />
                  {card.title}
                </CommandItem>
              ))}
            </CommandGroup>
          </>
        )}
      </CommandList>
    </CommandDialog>
  );
}
