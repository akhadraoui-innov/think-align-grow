import { useEffect, useState, useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { usePillars, useCards } from "@/hooks/useToolkitData";
import { Brain, Briefcase, Lightbulb, TrendingUp, Megaphone, Settings, Users, Shield, Rocket, Heart, FileText, Layers } from "lucide-react";

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

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput placeholder="Rechercher cartes, piliers, pages..." />
      <CommandList>
        <CommandEmpty>Aucun résultat.</CommandEmpty>

        <CommandGroup heading="Navigation">
          {[
            { label: "Explorer", path: "/explore", icon: Layers },
            { label: "Plans de jeu", path: "/plans", icon: FileText },
            { label: "Lab / Diagnostic", path: "/lab", icon: Brain },
            { label: "Coach IA", path: "/ai", icon: Sparkles },
            { label: "Profil", path: "/profile", icon: Users },
          ].map((item) => (
            <CommandItem
              key={item.path}
              onSelect={() => { navigate(item.path); onOpenChange(false); }}
            >
              <item.icon className="mr-2 h-4 w-4 text-muted-foreground" />
              {item.label}
            </CommandItem>
          ))}
        </CommandGroup>

        {pillars && pillars.length > 0 && (
          <CommandGroup heading="Piliers">
            {pillars.map((pillar) => {
              const Icon = iconMap[pillar.icon_name || "Brain"] || Brain;
              return (
                <CommandItem
                  key={pillar.id}
                  value={`pilier ${pillar.name}`}
                  onSelect={() => { navigate(`/explore?pillar=${pillar.id}`); onOpenChange(false); }}
                >
                  <Icon className="mr-2 h-4 w-4 text-muted-foreground" />
                  {pillar.name}
                </CommandItem>
              );
            })}
          </CommandGroup>
        )}

        {cards && cards.length > 0 && (
          <CommandGroup heading="Cartes">
            {cards.slice(0, 8).map((card) => (
              <CommandItem
                key={card.id}
                value={card.title}
                onSelect={() => { navigate(`/explore?card=${card.id}`); onOpenChange(false); }}
              >
                <FileText className="mr-2 h-4 w-4 text-muted-foreground" />
                {card.title}
              </CommandItem>
            ))}
          </CommandGroup>
        )}
      </CommandList>
    </CommandDialog>
  );
}

// Missing import fix
function Sparkles({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 3v1m0 16v1M4.22 4.22l.7.7m12.76 12.76.7.7M3 12h1m16 0h1M4.22 19.78l.7-.7M18.36 5.64l.7-.7"/>
      <circle cx="12" cy="12" r="4"/>
    </svg>
  );
}
