import { Star, Download, Eye, Plus, TrendingUp, Brain, Users, Shield, ArrowRight, ChevronRight, Sparkles } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const FEATURED = {
  title: "Agile Leadership & Psych-Safety Framework",
  description: "A comprehensive 4-module blueprint focusing on building trust and high-performance norms in remote technical teams. Includes 12 interactive Mural templates.",
  rating: 4.9,
  ratingCount: "2.4k",
  tags: ["Leadership", "Remote", "PsychSafety"],
  adopters: 18,
};

const MODULES = [
  { title: "Cloud Architecture 101", views: "1.2k", author: "Elena Moretti", desc: "Introductory module for AWS/Azure hybrid environments. Built for 2-hour workshops." },
  { title: "Executive Soft Skills Quiz", views: "840", author: "David Chen", desc: "25 scenario-based questions to evaluate empathetic communication and active listening." },
  { title: "Sustainability Reporting", views: "5.1k", author: "Impact Lab", desc: "CSRD and ESG reporting standards guide. Includes data collection toolkits." },
];

const TRENDING = [
  { icon: Brain, label: "GenAI Adoption", stat: "+42% this week", color: "text-accent" },
  { icon: Users, label: "DEI Strategy", stat: "12 new blueprints", color: "text-primary" },
  { icon: Shield, label: "Cybersecurity Ops", stat: "Top for Enterprise", color: "hsl(var(--pillar-finance))" },
];

const PEER_ACTIVITY = [
  { name: "Marc-Antoine", action: "imported", blueprint: "Design Thinking Workshop", time: "2 minutes ago" },
  { name: "Sophie L.", action: "imported", blueprint: "Conflict Resolution Pro", time: "15 minutes ago" },
  { name: "Jean-Claude", action: "imported", blueprint: "Product Pitching Canvas", time: "1 hour ago" },
];

export default function PortalMarketplace() {
  return (
    <div className="p-6 max-w-5xl space-y-8">
      {/* Page header */}
      <div>
        <h1 className="text-xl font-bold text-foreground">Content Marketplace</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Discover, remix, and deploy validated training blueprints created by the global community.
        </p>
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" className="text-xs h-8 gap-1.5">
          <TrendingUp className="h-3.5 w-3.5" />
          Popular
        </Button>
        <Button variant="ghost" size="sm" className="text-xs h-8">Most Recent</Button>
        <Button variant="ghost" size="sm" className="text-xs h-8">Top Rated</Button>
      </div>

      {/* Featured card */}
      <Card className="overflow-hidden border-primary/20 bg-gradient-to-br from-card to-primary/[0.03]">
        <CardContent className="p-6">
          <div className="flex items-start gap-1.5 mb-3">
            <Badge className="bg-primary/10 text-primary border-0 text-[10px] font-semibold">
              Most Adopted
            </Badge>
            <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
              <Star className="h-3 w-3 fill-primary text-primary" />
              <span className="font-semibold text-foreground">{FEATURED.rating}</span>
              <span>({FEATURED.ratingCount} ratings)</span>
            </div>
          </div>
          <h2 className="text-lg font-bold text-foreground mb-2">{FEATURED.title}</h2>
          <p className="text-xs text-muted-foreground leading-relaxed mb-4 max-w-xl">
            {FEATURED.description}
          </p>
          <div className="flex items-center gap-2 mb-4 flex-wrap">
            {FEATURED.tags.map((t) => (
              <span key={t} className="text-[10px] text-accent font-medium">#{t}</span>
            ))}
            <span className="text-[10px] text-muted-foreground ml-1">+{FEATURED.adopters}</span>
          </div>
          <Button size="sm" className="gap-1.5 text-xs h-8">
            <Download className="h-3.5 w-3.5" />
            Import to Path
          </Button>
        </CardContent>
      </Card>

      {/* Growth nudge */}
      <div className="flex items-center gap-3 rounded-xl bg-accent/8 border border-accent/15 px-4 py-3">
        <Sparkles className="h-5 w-5 text-accent shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold text-foreground">Marketplace Growth</p>
          <p className="text-[10px] text-muted-foreground">
            Your peer network has shared 156 new blueprints this week. Explore the latest in AI Ethics and Generative Design.
          </p>
        </div>
        <span className="text-lg font-black text-accent shrink-0">12,482</span>
        <span className="text-[9px] text-muted-foreground shrink-0">Active<br />Modules</span>
      </div>

      {/* Module grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {MODULES.map((mod) => (
          <Card key={mod.title} className="hover:shadow-md transition-shadow">
            <CardContent className="p-4 flex flex-col h-full">
              <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground mb-2">
                <Eye className="h-3 w-3" />
                {mod.views}
              </div>
              <h3 className="text-sm font-semibold text-foreground mb-1">{mod.title}</h3>
              <p className="text-[10px] text-muted-foreground leading-relaxed flex-1 mb-3">{mod.desc}</p>
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-muted-foreground">By {mod.author}</span>
                <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                  <Plus className="h-3.5 w-3.5" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Trending + Peer activity */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Trending */}
        <div>
          <h3 className="text-xs font-bold text-foreground mb-3">Trending Topics</h3>
          <div className="space-y-2">
            {TRENDING.map((t) => {
              const Icon = t.icon;
              return (
                <div key={t.label} className="flex items-center gap-3 p-2.5 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors cursor-pointer">
                  <Icon className={cn("h-4 w-4", t.color)} />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-foreground">{t.label}</p>
                    <p className="text-[10px] text-muted-foreground">{t.stat}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Peer activity */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-bold text-foreground">Recent Imports by Peers</h3>
            <button className="flex items-center gap-0.5 text-[10px] text-primary font-medium hover:underline">
              View Feed <ArrowRight className="h-3 w-3" />
            </button>
          </div>
          <div className="space-y-1">
            {PEER_ACTIVITY.map((a, i) => (
              <div key={i} className="flex items-center gap-2 p-2 rounded-lg hover:bg-muted/30 transition-colors cursor-pointer group">
                <div className="h-6 w-6 rounded-full bg-muted flex items-center justify-center text-[9px] font-bold text-muted-foreground shrink-0">
                  {a.name.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] text-foreground truncate">
                    <span className="font-semibold">{a.name}</span>{" "}
                    {a.action}{" "}
                    <span className="text-primary">{a.blueprint}</span>
                  </p>
                  <p className="text-[9px] text-muted-foreground">{a.time}</p>
                </div>
                <ChevronRight className="h-3 w-3 text-muted-foreground/40 group-hover:text-muted-foreground transition-colors" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
