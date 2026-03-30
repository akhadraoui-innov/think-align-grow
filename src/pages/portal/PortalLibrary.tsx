import { BookOpen, Search, FileText, Video, Puzzle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const RESOURCES = [
  { title: "Guide CSRD & ESG Reporting", type: "Document", icon: FileText, tags: ["Compliance", "ESG"] },
  { title: "Masterclass Design Thinking", type: "Video", icon: Video, tags: ["Innovation", "UX"] },
  { title: "Canvas Business Model", type: "Template", icon: Puzzle, tags: ["Strategy", "Business"] },
  { title: "Prompt Engineering Handbook", type: "Document", icon: FileText, tags: ["AI", "Productivity"] },
  { title: "Conflict Resolution Toolkit", type: "Template", icon: Puzzle, tags: ["Soft Skills", "HR"] },
  { title: "Data Visualization Best Practices", type: "Document", icon: FileText, tags: ["Data", "Analytics"] },
];

export default function PortalLibrary() {
  return (
    <div className="p-6 max-w-5xl space-y-6">
      <div>
        <h1 className="text-xl font-bold text-foreground">Resource Library</h1>
        <p className="text-sm text-muted-foreground mt-1">Docs, templates, and assets for your training.</p>
      </div>

      <div className="flex items-center gap-2 bg-muted/30 rounded-xl px-3 py-2 max-w-sm">
        <Search className="h-4 w-4 text-muted-foreground" />
        <input
          type="text"
          placeholder="Search resources..."
          className="flex-1 bg-transparent text-xs text-foreground placeholder:text-muted-foreground/60 outline-none"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {RESOURCES.map((r) => {
          const Icon = r.icon;
          return (
            <Card key={r.title} className="hover:shadow-md transition-shadow cursor-pointer">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="h-7 w-7 rounded-lg bg-muted/50 flex items-center justify-center">
                    <Icon className="h-3.5 w-3.5 text-muted-foreground" />
                  </div>
                  <Badge variant="secondary" className="text-[9px]">{r.type}</Badge>
                </div>
                <h3 className="text-sm font-semibold text-foreground mb-2">{r.title}</h3>
                <div className="flex items-center gap-1.5 flex-wrap">
                  {r.tags.map((t) => (
                    <span key={t} className="text-[9px] text-accent font-medium">#{t}</span>
                  ))}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
