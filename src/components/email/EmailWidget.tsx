import { useNavigate } from "react-router-dom";
import { Mail, AlertTriangle, Send, Eye, MailWarning, ArrowUpRight, Inbox, Settings } from "lucide-react";
import { SignalWidget, SignalHeader, SignalFooter, SignalShortcut, SignalTone } from "@/components/shell/SignalWidget";
import { useAdminEmailWidget, usePortalEmailWidget } from "@/hooks/useEmailWidget";
import { Tick } from "@/components/studio/Tick";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";

interface Props {
  variant: "admin" | "portal";
}

export function EmailWidget({ variant }: Props) {
  return variant === "admin" ? <AdminEmailWidget /> : <PortalEmailWidget />;
}

/* ─────────────────────────────────────────────
   ADMIN VARIANT
   ───────────────────────────────────────────── */

function AdminEmailWidget() {
  const navigate = useNavigate();
  const { data, isLoading } = useAdminEmailWidget();

  const failed = data?.totals.failed ?? 0;
  const securityFlags = data?.securityFlags ?? 0;
  const alertCount = failed + securityFlags;
  const tone: SignalTone = alertCount === 0 ? "neutral" : alertCount > 5 ? "danger" : "warn";

  return (
    <SignalWidget
      icon={Mail}
      label="Email Studio"
      count={alertCount}
      tone={tone}
      pulse={tone === "danger"}
      variant="admin"
      width={400}
    >
      {(close) => (
        <div className="flex flex-col">
          <SignalHeader
            label="Email Studio"
            meta="24H"
            action={
              <button
                onClick={() => {
                  navigate("/admin/emails");
                  close();
                }}
                className="flex items-center gap-1 text-[10px] font-semibold text-muted-foreground hover:text-foreground transition-colors group"
              >
                OUVRIR
                <ArrowUpRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </button>
            }
          />

          {/* KPI Grid */}
          <div className="px-3 grid grid-cols-3 gap-1.5">
            <KpiCell label="SENT" value={data?.totals.sent ?? 0} tone="success" loading={isLoading} icon={Send} />
            <KpiCell label="FAILED" value={data?.totals.failed ?? 0} tone="danger" loading={isLoading} icon={AlertTriangle} />
            <KpiCell label="BOUNCED" value={data?.totals.bounced ?? 0} tone="warn" loading={isLoading} icon={MailWarning} />
          </div>

          {/* Sparkline */}
          <div className="px-3 pt-2.5">
            <Sparkline data={data?.sparkline ?? []} />
          </div>

          {/* Lanes */}
          {data?.lanes && data.lanes.length > 0 && (
            <div className="px-4 pt-4 pb-3 space-y-2">
              <div className="studio-microcaps text-[9px] text-foreground/70">PRIORITY LANES</div>
              {data.lanes.map((lane) => (
                <Lane key={lane.name} name={lane.name} value={lane.queue_length} tone={lane.tone} />
              ))}
            </div>
          )}

          {/* Recent failures */}
          {data?.recentFailures && data.recentFailures.length > 0 && (
            <div className="px-4 pt-1 pb-3 space-y-1.5">
              <div className="studio-microcaps text-[9px] text-foreground/70 flex items-center gap-1.5">
                ÉCHECS RÉCENTS
                <span className="studio-bg-tone-danger px-1.5 py-px rounded text-[8px] font-bold leading-none">
                  {data.recentFailures.length}
                </span>
              </div>
              <ul className="space-y-1">
                {data.recentFailures.slice(0, 3).map((f) => (
                  <li key={f.id}>
                    <button
                      onClick={() => {
                        navigate("/admin/emails");
                        close();
                      }}
                      className="w-full flex items-start gap-2 px-2 py-1.5 rounded-md hover:bg-foreground/[0.04] transition-colors text-left group"
                    >
                      <span className="mt-1 w-1.5 h-1.5 rounded-full bg-destructive shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-foreground truncate group-hover:text-destructive">
                          {f.template_name}
                        </p>
                        <p className="text-[10px] text-muted-foreground truncate">
                          {f.recipient_email}
                          {f.error_message && (
                            <span className="opacity-70"> • {f.error_message.slice(0, 40)}</span>
                          )}
                        </p>
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Empty state */}
          {!isLoading && data?.totals.sent === 0 && data?.totals.failed === 0 && (
            <div className="px-4 py-6 text-center">
              <Inbox className="h-5 w-5 mx-auto text-muted-foreground/40 mb-1.5" />
              <p className="text-[11px] text-muted-foreground">Aucune activité 24h</p>
            </div>
          )}

          <SignalFooter>
            <SignalShortcut keys={["g", "c"]} label="Composer" onClick={() => { navigate("/admin/emails"); close(); }} />
            <SignalShortcut keys={["g", "l"]} label="Logs" onClick={() => { navigate("/admin/emails"); close(); }} />
            <SignalShortcut keys={["g", "h"]} label="Health" onClick={() => { navigate("/admin/health"); close(); }} />
          </SignalFooter>
        </div>
      )}
    </SignalWidget>
  );
}

/* ─────────────────────────────────────────────
   PORTAL VARIANT
   ───────────────────────────────────────────── */

function PortalEmailWidget() {
  const navigate = useNavigate();
  const { data, isLoading, markSeen } = usePortalEmailWidget();

  return (
    <SignalWidget
      icon={Mail}
      label="Votre boîte"
      count={data?.unread ?? 0}
      tone="info"
      variant="portal"
      width={360}
    >
      {(close) => (
        <div className="flex flex-col" onMouseEnter={markSeen}>
          <SignalHeader
            label="Votre boîte"
            action={
              <button
                onClick={() => {
                  navigate("/portal/preferences");
                  close();
                }}
                className="flex items-center gap-1 text-[10px] font-semibold text-muted-foreground hover:text-foreground transition-colors group"
              >
                PRÉFÉRENCES
                <Settings className="h-3 w-3" />
              </button>
            }
          />

          <div className="px-2 pb-1.5">
            {isLoading && (
              <div className="px-3 py-6 text-[11px] text-muted-foreground">Chargement…</div>
            )}
            {!isLoading && (!data?.recent || data.recent.length === 0) && (
              <div className="px-3 py-8 text-center">
                <Inbox className="h-5 w-5 mx-auto text-muted-foreground/40 mb-2" />
                <p className="text-[11px] text-muted-foreground">Aucun email récent</p>
              </div>
            )}
            <ul className="space-y-0.5">
              {data?.recent.map((m) => (
                <li key={m.id}>
                  <button className="w-full flex items-start gap-2 px-3 py-2 rounded-lg hover:bg-foreground/[0.04] transition-colors text-left">
                    <span
                      className={cn(
                        "mt-1.5 w-2 h-2 rounded-full shrink-0",
                        m.status === "sent" || m.status === "delivered"
                          ? "bg-[hsl(var(--pillar-growth))]"
                          : m.status === "failed" || m.status === "bounced"
                          ? "bg-destructive"
                          : "bg-muted-foreground/40"
                      )}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-[12px] font-semibold text-foreground truncate leading-tight">
                        {humanizeTemplate(m.template_name)}
                      </p>
                      <p className="text-[10px] text-muted-foreground/80 mt-0.5">
                        {formatDistanceToNow(new Date(m.created_at), { addSuffix: true, locale: fr })}
                      </p>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          </div>

          <SignalFooter>
            <SignalShortcut keys={["g", "p"]} label="Préférences" onClick={() => { navigate("/portal/preferences"); close(); }} />
          </SignalFooter>
        </div>
      )}
    </SignalWidget>
  );
}

/* ─────────────────────────────────────────────
   SUB-COMPONENTS
   ───────────────────────────────────────────── */

function KpiCell({
  label, value, tone, loading, icon: Icon,
}: { label: string; value: number; tone: "success" | "warn" | "danger"; loading?: boolean; icon: any }) {
  const toneToText: Record<string, string> = {
    success: "text-[hsl(var(--pillar-growth))]",
    warn: "text-[hsl(38_95%_35%)]",
    danger: "text-destructive",
  };
  return (
    <div className="flex flex-col gap-0.5 px-2.5 py-2 rounded-lg bg-foreground/[0.025] border border-foreground/[0.04]">
      <div className="flex items-center justify-between">
        <span className="studio-microcaps text-[8.5px] text-muted-foreground/80">{label}</span>
        <Icon className={cn("h-3 w-3", toneToText[tone], "opacity-50")} />
      </div>
      <div className={cn("text-lg font-bold leading-none mt-1 studio-display", toneToText[tone])}>
        {loading ? <span className="inline-block w-6 h-4 rounded studio-shimmer" /> : <Tick value={value} />}
      </div>
    </div>
  );
}

function Sparkline({ data }: { data: number[] }) {
  if (!data.length) return null;
  const max = Math.max(...data, 1);
  const w = 372;
  const h = 28;
  const step = w / Math.max(data.length - 1, 1);
  const points = data
    .map((v, i) => `${i * step},${h - (v / max) * h}`)
    .join(" ");
  const area = `0,${h} ${points} ${w},${h}`;
  return (
    <div className="rounded-lg overflow-hidden bg-foreground/[0.02] px-2 py-1">
      <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-7" preserveAspectRatio="none">
        <defs>
          <linearGradient id="sparkfill" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.35" />
            <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0" />
          </linearGradient>
        </defs>
        <polygon points={area} fill="url(#sparkfill)" />
        <polyline
          points={points}
          fill="none"
          stroke="hsl(var(--primary))"
          strokeWidth="1.5"
          strokeLinejoin="round"
          strokeLinecap="round"
        />
      </svg>
    </div>
  );
}

function Lane({ name, value, tone }: { name: string; value: number; tone: "success" | "warn" | "danger" | "info" }) {
  const max = 500;
  const pct = Math.min(100, (value / max) * 100);
  const toneBg: Record<string, string> = {
    success: "bg-[hsl(var(--pillar-growth))]",
    info: "bg-[hsl(var(--pillar-innovation))]",
    warn: "bg-[hsl(var(--pillar-business))]",
    danger: "bg-destructive",
  };
  return (
    <div className="flex items-center gap-2.5">
      <span className="text-[10.5px] font-semibold text-foreground/85 capitalize w-24 truncate">
        {name.replace("email_", "")}
      </span>
      <div className="flex-1 studio-gauge">
        <div
          className={cn("studio-gauge-fill", toneBg[tone])}
          style={{ transform: `scaleX(${pct / 100})` }}
        />
      </div>
      <span className="studio-tnum text-[10.5px] font-bold text-foreground/85 w-7 text-right">
        <Tick value={value} />
      </span>
    </div>
  );
}

function humanizeTemplate(name: string): string {
  return name
    .replace(/[_-]/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}
