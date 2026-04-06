import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface UCMPageHeaderProps {
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
  badge?: string | number;
  children?: React.ReactNode;
  className?: string;
}

export function UCMPageHeader({ icon, title, subtitle, badge, children, className }: UCMPageHeaderProps) {
  return (
    <div className={cn("flex flex-col sm:flex-row sm:items-center justify-between gap-3", className)}>
      <div className="flex items-start gap-3">
        <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center shrink-0 shadow-sm">
          {icon}
        </div>
        <div>
          <h2 className="text-xl font-black tracking-tight text-foreground flex items-center gap-2">
            {title}
            {badge !== undefined && (
              <Badge variant="secondary" className="text-[10px] font-bold">
                {badge}
              </Badge>
            )}
          </h2>
          {subtitle && (
            <p className="text-sm text-muted-foreground mt-0.5">{subtitle}</p>
          )}
        </div>
      </div>
      {children && <div className="flex items-center gap-2">{children}</div>}
    </div>
  );
}
