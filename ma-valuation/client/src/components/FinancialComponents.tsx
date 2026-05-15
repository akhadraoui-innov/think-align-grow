import { TrendingUp, TrendingDown, Minus, AlertTriangle, CheckCircle, Clock, XCircle } from "lucide-react";

// ─── Formatage des valeurs financières ───────────────────────────────────────

export function formatCurrency(value: number | string | null | undefined, unit = "k€", decimals = 0): string {
  if (value === null || value === undefined || value === "") return "—";
  const num = typeof value === "string" ? parseFloat(value) : value;
  if (isNaN(num)) return "—";
  return new Intl.NumberFormat("fr-FR", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(num) + " " + unit;
}

export function formatPct(value: number | string | null | undefined, decimals = 1): string {
  if (value === null || value === undefined || value === "") return "—";
  const num = typeof value === "string" ? parseFloat(value) : value;
  if (isNaN(num)) return "—";
  const pct = Math.abs(num) < 1 ? num * 100 : num;
  return pct.toFixed(decimals) + "%";
}

export function formatMultiple(value: number | string | null | undefined): string {
  if (value === null || value === undefined || value === "") return "—";
  const num = typeof value === "string" ? parseFloat(value) : value;
  if (isNaN(num)) return "—";
  return num.toFixed(1) + "x";
}

// ─── KPI Card ─────────────────────────────────────────────────────────────────

interface KpiCardProps {
  label: string;
  value: string;
  subValue?: string;
  trend?: "up" | "down" | "neutral";
  trendValue?: string;
  color?: "blue" | "gold" | "green" | "red" | "neutral";
  size?: "sm" | "md" | "lg";
}

export function KpiCard({ label, value, subValue, trend, trendValue, color = "neutral", size = "md" }: KpiCardProps) {
  const colorMap = {
    blue: "#1A85FF",
    gold: "#C9A84C",
    green: "oklch(60% 0.18 145)",
    red: "oklch(55% 0.22 25)",
    neutral: "oklch(88% 0.01 240)",
  };

  const TrendIcon = trend === "up" ? TrendingUp : trend === "down" ? TrendingDown : Minus;
  const trendColor = trend === "up" ? "oklch(60% 0.18 145)" : trend === "down" ? "oklch(55% 0.22 25)" : "oklch(55% 0.04 240)";

  return (
    <div className="kpi-card">
      <div className="text-[10px] font-heading font-600 tracking-widest uppercase mb-1.5" style={{ color: "oklch(50% 0.04 240)" }}>
        {label}
      </div>
      <div
        className={`font-heading font-700 tabular-nums ${size === "lg" ? "text-2xl" : size === "sm" ? "text-base" : "text-xl"}`}
        style={{ color: colorMap[color] }}
      >
        {value}
      </div>
      {(subValue || trendValue) && (
        <div className="flex items-center gap-1.5 mt-1">
          {trendValue && (
            <div className="flex items-center gap-0.5 text-[10px] font-medium" style={{ color: trendColor }}>
              <TrendIcon size={10} />
              {trendValue}
            </div>
          )}
          {subValue && (
            <div className="text-[10px]" style={{ color: "oklch(50% 0.04 240)" }}>{subValue}</div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Status Badge ─────────────────────────────────────────────────────────────

type StatusType = "draft" | "active" | "completed" | "archived" | "identified" | "validated" | "in_progress" | "done" | "final";

const STATUS_CONFIG: Record<StatusType, { label: string; color: string; bg: string; icon: React.ReactNode }> = {
  draft: { label: "Brouillon", color: "oklch(60% 0.04 240)", bg: "oklch(22% 0.06 240)", icon: <Clock size={9} /> },
  active: { label: "Actif", color: "oklch(60% 0.18 145)", bg: "oklch(20% 0.08 145)", icon: <CheckCircle size={9} /> },
  completed: { label: "Terminé", color: "#1A85FF", bg: "oklch(20% 0.10 240)", icon: <CheckCircle size={9} /> },
  archived: { label: "Archivé", color: "oklch(50% 0.04 240)", bg: "oklch(18% 0.04 240)", icon: <XCircle size={9} /> },
  identified: { label: "Identifié", color: "oklch(60% 0.04 240)", bg: "oklch(22% 0.06 240)", icon: <Clock size={9} /> },
  validated: { label: "Validé", color: "#1A85FF", bg: "oklch(20% 0.10 240)", icon: <CheckCircle size={9} /> },
  in_progress: { label: "En cours", color: "#C9A84C", bg: "oklch(20% 0.08 75)", icon: <TrendingUp size={9} /> },
  done: { label: "Réalisé", color: "oklch(60% 0.18 145)", bg: "oklch(20% 0.08 145)", icon: <CheckCircle size={9} /> },
  final: { label: "Final", color: "#C9A84C", bg: "oklch(20% 0.08 75)", icon: <CheckCircle size={9} /> },
};

export function StatusBadge({ status }: { status: StatusType | string }) {
  const config = STATUS_CONFIG[status as StatusType] ?? STATUS_CONFIG.draft;
  return (
    <span
      className="status-badge"
      style={{ color: config.color, background: config.bg }}
    >
      {config.icon}
      {config.label}
    </span>
  );
}

// ─── Module Progress Bar ──────────────────────────────────────────────────────

interface ModuleProgressProps {
  label: string;
  progress: number; // 0-100
  color?: string;
}

export function ModuleProgress({ label, progress, color = "#1A85FF" }: ModuleProgressProps) {
  return (
    <div className="flex items-center gap-2">
      <div className="text-[10px] font-heading font-600 tracking-wider uppercase w-20 flex-shrink-0" style={{ color: "oklch(50% 0.04 240)" }}>
        {label}
      </div>
      <div className="flex-1 h-1 rounded-full overflow-hidden" style={{ background: "oklch(22% 0.06 240)" }}>
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${Math.min(100, Math.max(0, progress))}%`, background: color }}
        />
      </div>
      <div className="text-[10px] font-heading font-700 w-8 text-right tabular-nums" style={{ color }}>
        {Math.round(progress)}%
      </div>
    </div>
  );
}

// ─── Financial Table Row ──────────────────────────────────────────────────────

interface FinancialRowProps {
  label: string;
  values: (string | number | null | undefined)[];
  isTotal?: boolean;
  isSubtotal?: boolean;
  isHighlighted?: boolean;
  format?: "currency" | "pct" | "multiple" | "raw";
  unit?: string;
  indent?: number;
}

export function FinancialRow({ label, values, isTotal, isSubtotal, isHighlighted, format = "currency", unit = "k€", indent = 0 }: FinancialRowProps) {
  const formatValue = (v: string | number | null | undefined) => {
    if (format === "currency") return formatCurrency(v, unit);
    if (format === "pct") return formatPct(v);
    if (format === "multiple") return formatMultiple(v);
    return v?.toString() ?? "—";
  };

  const rowClass = isTotal ? "row-total" : isSubtotal ? "row-subtotal" : "";

  return (
    <tr className={rowClass} style={isHighlighted ? { background: "oklch(55% 0.22 240 / 0.08)" } : undefined}>
      <td style={{ paddingLeft: `${0.75 + indent * 1}rem` }}>
        {label}
      </td>
      {values.map((v, i) => (
        <td key={i} style={{
          color: typeof v === "number" || typeof v === "string"
            ? parseFloat(String(v)) < 0 ? "oklch(55% 0.22 25)" : undefined
            : undefined,
        }}>
          {formatValue(v)}
        </td>
      ))}
    </tr>
  );
}

// ─── Section Header ───────────────────────────────────────────────────────────

interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  badge?: string;
  badgeColor?: string;
  actions?: React.ReactNode;
  icon?: React.ReactNode;
}

export function SectionHeader({ title, subtitle, badge, badgeColor = "#1A85FF", actions, icon }: SectionHeaderProps) {
  return (
    <div className="section-header">
      <div className="flex items-center gap-2.5">
        {icon && (
          <div className="w-7 h-7 rounded flex items-center justify-center flex-shrink-0" style={{ background: "oklch(55% 0.22 240 / 0.15)" }}>
            <span style={{ color: "#1A85FF" }}>{icon}</span>
          </div>
        )}
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-heading font-700 text-white">{title}</h2>
            {badge && (
              <span className="text-[9px] font-heading font-700 tracking-widest uppercase px-1.5 py-0.5 rounded" style={{ color: badgeColor, background: `${badgeColor}20` }}>
                {badge}
              </span>
            )}
          </div>
          {subtitle && <p className="text-xs mt-0.5" style={{ color: "oklch(50% 0.04 240)" }}>{subtitle}</p>}
        </div>
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}

// ─── Empty State ──────────────────────────────────────────────────────────────

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
      {icon && (
        <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4" style={{ background: "oklch(18% 0.06 240)" }}>
          <span style={{ color: "oklch(45% 0.05 240)" }}>{icon}</span>
        </div>
      )}
      <h3 className="text-sm font-heading font-700 text-white mb-1">{title}</h3>
      {description && <p className="text-xs max-w-xs" style={{ color: "oklch(50% 0.04 240)" }}>{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

// ─── AI Suggestion Card ───────────────────────────────────────────────────────

interface AiSuggestionProps {
  title: string;
  content: string;
  type?: "info" | "warning" | "insight";
  onDismiss?: () => void;
}

export function AiSuggestion({ title, content, type = "info", onDismiss }: AiSuggestionProps) {
  const colors = {
    info: { border: "#1A85FF", bg: "oklch(55% 0.22 240 / 0.08)", icon: "ℹ" },
    warning: { border: "#C9A84C", bg: "oklch(72% 0.14 75 / 0.08)", icon: "⚠" },
    insight: { border: "oklch(60% 0.18 145)", bg: "oklch(60% 0.18 145 / 0.08)", icon: "✦" },
  };
  const c = colors[type];

  return (
    <div className="rounded-lg p-3 mb-2 relative" style={{ background: c.bg, border: `1px solid ${c.border}30` }}>
      <div className="flex items-start gap-2">
        <span className="text-xs flex-shrink-0 mt-0.5" style={{ color: c.border }}>{c.icon}</span>
        <div className="flex-1 min-w-0">
          <div className="text-xs font-heading font-700 mb-1" style={{ color: c.border }}>{title}</div>
          <div className="text-xs leading-relaxed" style={{ color: "oklch(70% 0.03 240)" }}>{content}</div>
        </div>
        {onDismiss && (
          <button onClick={onDismiss} className="flex-shrink-0 text-xs hover:opacity-70 transition-opacity" style={{ color: "oklch(45% 0.05 240)" }}>✕</button>
        )}
      </div>
    </div>
  );
}

// ─── Loading Skeleton ─────────────────────────────────────────────────────────

export function FinancialSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="animate-pulse">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex gap-4 py-2 px-3" style={{ borderBottom: "1px solid oklch(20% 0.05 240)" }}>
          <div className="h-3 rounded flex-1" style={{ background: "oklch(22% 0.06 240)", maxWidth: "160px" }} />
          <div className="h-3 rounded w-20" style={{ background: "oklch(22% 0.06 240)" }} />
          <div className="h-3 rounded w-20" style={{ background: "oklch(22% 0.06 240)" }} />
          <div className="h-3 rounded w-20" style={{ background: "oklch(22% 0.06 240)" }} />
        </div>
      ))}
    </div>
  );
}

// ─── Valeur avec variation ────────────────────────────────────────────────────

export function DeltaValue({ value, delta, format = "currency", unit = "k€" }: { value: number | null; delta?: number; format?: "currency" | "pct"; unit?: string }) {
  const formatted = format === "currency" ? formatCurrency(value, unit) : formatPct(value);
  const deltaColor = delta === undefined ? undefined : delta > 0 ? "oklch(60% 0.18 145)" : delta < 0 ? "oklch(55% 0.22 25)" : "oklch(55% 0.04 240)";
  const DeltaIcon = delta === undefined ? null : delta > 0 ? TrendingUp : delta < 0 ? TrendingDown : Minus;

  return (
    <div className="flex items-center gap-1.5">
      <span className="tabular-nums font-medium text-white">{formatted}</span>
      {delta !== undefined && DeltaIcon && (
        <span className="flex items-center gap-0.5 text-xs" style={{ color: deltaColor }}>
          <DeltaIcon size={11} />
          {format === "pct" ? formatPct(delta) : formatCurrency(delta, unit)}
        </span>
      )}
    </div>
  );
}
