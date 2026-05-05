import { useRef, useState, useCallback, useEffect } from "react";
import { PlaygroundCard } from "./PlaygroundCard";
import { getBoardSkin } from "./boardSkins";
import { X } from "lucide-react";
import type { Tables } from "@/integrations/supabase/types";
import type { ToolkitTheme } from "@/lib/toolkitTheme";
import type { Placement } from "@/hooks/usePlaygroundSessions";

type Card = Tables<"cards">;
type Pillar = Tables<"pillars">;

const BASE_W = 280;
const BASE_H = 392;

export function PlateauBoard({
  toolkit,
  theme,
  cards,
  pillars,
  placements,
  setPlacements,
  cardScaleGlobal,
}: {
  toolkit: any;
  theme: ToolkitTheme;
  cards: Card[];
  pillars: Pillar[];
  placements: Placement[];
  setPlacements: (updater: (prev: Placement[]) => Placement[]) => void;
  cardScaleGlobal: number;
}) {
  const boardRef = useRef<HTMLDivElement>(null);
  const cardMap = new Map(cards.map((c) => [c.id, c]));
  const pillarMap = new Map(pillars.map((p) => [p.id, p]));
  const skin = getBoardSkin(toolkit, theme);

  const dragState = useRef<{
    cardId: string;
    fromPlateau: boolean;
    offsetX: number;
    offsetY: number;
  } | null>(null);

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const rect = boardRef.current?.getBoundingClientRect();
    if (!rect) return;
    const cardId =
      e.dataTransfer.getData("text/card-id") || dragState.current?.cardId;
    if (!cardId) return;
    const ds = dragState.current;
    const ox = ds?.offsetX ?? 0;
    const oy = ds?.offsetY ?? 0;
    const xPct = ((e.clientX - rect.left - ox) / rect.width) * 100;
    const yPct = ((e.clientY - rect.top - oy) / rect.height) * 100;

    setPlacements((prev) => {
      const exists = prev.find((p) => p.card_id === cardId);
      const maxZ = prev.reduce((m, p) => Math.max(m, p.z), 0);
      if (exists) {
        return prev.map((p) =>
          p.card_id === cardId
            ? { ...p, x_pct: clamp(xPct, 0, 95), y_pct: clamp(yPct, 0, 95), z: maxZ + 1 }
            : p
        );
      }
      return [
        ...prev,
        {
          card_id: cardId,
          x_pct: clamp(xPct, 0, 95),
          y_pct: clamp(yPct, 0, 95),
          scale: 1,
          z: maxZ + 1,
        },
      ];
    });
    dragState.current = null;
  };

  const removePlacement = (id: string) =>
    setPlacements((prev) => prev.filter((p) => p.card_id !== id));

  const onPlacementDragStart = (e: React.DragEvent, p: Placement) => {
    const target = e.currentTarget as HTMLElement;
    const r = target.getBoundingClientRect();
    dragState.current = {
      cardId: p.card_id,
      fromPlateau: true,
      offsetX: e.clientX - r.left,
      offsetY: e.clientY - r.top,
    };
    e.dataTransfer.setData("text/card-id", p.card_id);
    e.dataTransfer.effectAllowed = "move";
  };

  // resize per-card
  const startResize = (e: React.MouseEvent, p: Placement) => {
    e.stopPropagation();
    e.preventDefault();
    const startX = e.clientX;
    const startScale = p.scale;
    const baseW = BASE_W * cardScaleGlobal * startScale;
    const onMove = (ev: MouseEvent) => {
      const dx = ev.clientX - startX;
      const newW = baseW + dx;
      const newScale = clamp(newW / (BASE_W * cardScaleGlobal), 0.5, 2.2);
      setPlacements((prev) =>
        prev.map((pp) => (pp.card_id === p.card_id ? { ...pp, scale: newScale } : pp))
      );
    };
    const onUp = () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  };

  return (
    <div
      ref={boardRef}
      onDragOver={onDragOver}
      onDrop={onDrop}
      className="relative w-full h-full rounded-2xl border overflow-hidden shadow-inner"
      style={skin.surfaceStyle}
    >
      {/* Coins serious-game */}
      {(["tl", "tr", "bl", "br"] as const).map((c) => (
        <CornerMark key={c} corner={c} color={skin.cornerColor} />
      ))}

      {/* Emblème central */}
      <CenterEmblem skin={skin} />

      {/* Cartes posées */}
      {placements.map((p) => {
        const card = cardMap.get(p.card_id);
        if (!card) return null;
        const w = BASE_W * cardScaleGlobal * p.scale;
        const h = BASE_H * cardScaleGlobal * p.scale;
        return (
          <div
            key={p.card_id}
            draggable
            onDragStart={(e) => onPlacementDragStart(e, p)}
            className="absolute group"
            style={{
              left: `${p.x_pct}%`,
              top: `${p.y_pct}%`,
              width: w,
              height: h,
              zIndex: p.z,
            }}
          >
            <div className="w-full h-full" style={{ transform: `scale(${cardScaleGlobal * p.scale})`, transformOrigin: "top left", width: BASE_W, height: BASE_H }}>
              <PlaygroundCard card={card as any} pillar={pillarMap.get(card.pillar_id)} />
            </div>
            <button
              onClick={() => removePlacement(p.card_id)}
              className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center opacity-0 group-hover:opacity-100 transition shadow-lg z-10"
              title="Retirer du plateau"
            >
              <X className="w-3.5 h-3.5" />
            </button>
            <div
              onMouseDown={(e) => startResize(e, p)}
              className="absolute bottom-0 right-0 w-4 h-4 cursor-nwse-resize opacity-0 group-hover:opacity-100 transition"
              style={{
                background: `linear-gradient(135deg, transparent 50%, ${skin.accent} 50%)`,
                borderBottomRightRadius: 8,
              }}
              title="Redimensionner"
            />
          </div>
        );
      })}

      {placements.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <p className="text-sm text-muted-foreground italic">
            Glissez des cartes depuis la main pour composer votre plateau
          </p>
        </div>
      )}
    </div>
  );
}

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function CornerMark({ corner, color }: { corner: "tl" | "tr" | "bl" | "br"; color: string }) {
  const pos: React.CSSProperties = {
    position: "absolute",
    width: 28,
    height: 28,
    borderColor: color,
    opacity: 0.5,
  };
  if (corner === "tl") Object.assign(pos, { top: 12, left: 12, borderTop: `2px solid ${color}`, borderLeft: `2px solid ${color}` });
  if (corner === "tr") Object.assign(pos, { top: 12, right: 12, borderTop: `2px solid ${color}`, borderRight: `2px solid ${color}` });
  if (corner === "bl") Object.assign(pos, { bottom: 12, left: 12, borderBottom: `2px solid ${color}`, borderLeft: `2px solid ${color}` });
  if (corner === "br") Object.assign(pos, { bottom: 12, right: 12, borderBottom: `2px solid ${color}`, borderRight: `2px solid ${color}` });
  return <div style={pos} />;
}

function CenterEmblem({ skin }: { skin: ReturnType<typeof getBoardSkin> }) {
  const { emblem, accent } = skin;
  if (emblem.kind === "emoji" && emblem.value) {
    return (
      <div
        className="absolute inset-0 flex items-center justify-center pointer-events-none select-none"
        style={{ opacity: 0.06, fontSize: "30vh", lineHeight: 1 }}
      >
        {emblem.value}
      </div>
    );
  }
  if (emblem.kind === "rings") {
    return (
      <svg className="absolute inset-0 m-auto pointer-events-none" width="40%" height="60%" viewBox="0 0 200 200" style={{ opacity: 0.1 }}>
        {[40, 60, 80, 95].map((r) => (
          <circle key={r} cx="100" cy="100" r={r} fill="none" stroke={accent} strokeWidth="0.8" />
        ))}
        <line x1="0" x2="200" y1="100" y2="100" stroke={accent} strokeWidth="0.4" />
        <line x1="100" x2="100" y1="0" y2="200" stroke={accent} strokeWidth="0.4" />
      </svg>
    );
  }
  if (emblem.kind === "compass") {
    return (
      <svg className="absolute inset-0 m-auto pointer-events-none" width="40%" height="60%" viewBox="0 0 200 200" style={{ opacity: 0.1 }}>
        <circle cx="100" cy="100" r="90" fill="none" stroke={accent} strokeWidth="1" />
        <polygon points="100,15 110,100 100,185 90,100" fill={accent} opacity="0.6" />
        <polygon points="15,100 100,90 185,100 100,110" fill={accent} opacity="0.3" />
      </svg>
    );
  }
  return (
    <svg className="absolute inset-0 m-auto pointer-events-none" width="50%" height="50%" viewBox="0 0 200 200" style={{ opacity: 0.08 }}>
      {Array.from({ length: 6 }).map((_, i) => (
        <line key={`h${i}`} x1="0" x2="200" y1={i * 40} y2={i * 40} stroke={accent} strokeWidth="0.5" />
      ))}
      {Array.from({ length: 6 }).map((_, i) => (
        <line key={`v${i}`} y1="0" y2="200" x1={i * 40} x2={i * 40} stroke={accent} strokeWidth="0.5" />
      ))}
    </svg>
  );
}
