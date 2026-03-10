import { useRef, useState, useCallback, useMemo, useEffect } from "react";
import { motion } from "framer-motion";
import { CanvasItem } from "@/hooks/useCanvasItems";
import { CanvasCard } from "./CanvasCard";
import { StickyNote } from "./StickyNote";
import { CanvasGroup } from "./CanvasGroup";
import { CanvasArrow } from "./CanvasArrow";
import { ArrowToolbar } from "./ArrowToolbar";
import { CanvasIcon } from "./CanvasIcon";
import { CanvasText } from "./CanvasText";
import type { DbCard, DbPillar } from "@/hooks/useToolkitData";

interface WorkshopCanvasProps {
  items: CanvasItem[];
  cards: DbCard[];
  pillars: DbPillar[];
  selectedItemId: string | null;
  mode: string;
  arrowStart: string | null;
  onSelectItem: (id: string | null) => void;
  onUpdatePosition: (id: string, x: number, y: number) => void;
  onUpdateContent: (id: string, content: Record<string, any>) => void;
  onUpdateSize: (id: string, width: number, height: number) => void;
  onUpdateColor: (id: string, color: string) => void;
  onBringToFront: (id: string) => void;
  onDeleteItem: (id: string) => void;
  onAddSticky: (x: number, y: number) => void;
  onAddGroup: (x: number, y: number) => void;
  onAddIcon: (x: number, y: number) => void;
  onAddText: (x: number, y: number) => void;
  onArrowClick: (itemId: string) => void;
  viewport: { x: number; y: number; scale: number };
  onViewportChange: (vp: { x: number; y: number; scale: number }) => void;
  profiles: Record<string, { display_name: string; avatar_url: string | null }>;
  snapToGrid?: boolean;
  onFitToContent?: () => void;
}

const GRID_SIZE = 20;

function snapValue(v: number, snap: boolean): number {
  return snap ? Math.round(v / GRID_SIZE) * GRID_SIZE : v;
}

export function WorkshopCanvas({
  items, cards, pillars,
  selectedItemId, mode, arrowStart,
  onSelectItem, onUpdatePosition, onUpdateContent, onUpdateSize, onUpdateColor,
  onBringToFront, onDeleteItem,
  onAddSticky, onAddGroup, onAddIcon, onAddText,
  onArrowClick, viewport, onViewportChange, profiles,
  snapToGrid = false,
}: WorkshopCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [draggingItem, setDraggingItem] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  // Drag threshold: don't capture pointer until user moves > 5px
  const dragIntentRef = useRef<{
    itemId: string; item: CanvasItem; startX: number; startY: number;
    pointerId: number; captured: boolean;
  } | null>(null);

  // rAF throttle for viewport updates
  const viewportRef = useRef(viewport);
  const rafRef = useRef<number | null>(null);
  viewportRef.current = viewport;

  const scheduleViewportUpdate = useCallback((newVp: { x: number; y: number; scale: number }) => {
    viewportRef.current = newVp;
    if (rafRef.current === null) {
      rafRef.current = requestAnimationFrame(() => {
        rafRef.current = null;
        onViewportChange(viewportRef.current);
      });
    }
  }, [onViewportChange]);

  // Touch state for pinch-zoom
  const touchRef = useRef<{ dist: number; midX: number; midY: number; vp: typeof viewport } | null>(null);

  // Keyboard shortcuts: Delete/Backspace to delete, Escape to deselect
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't capture if user is typing in an input
      const tag = (e.target as HTMLElement).tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || (e.target as HTMLElement).isContentEditable) return;

      if ((e.key === "Delete" || e.key === "Backspace") && selectedItemId) {
        e.preventDefault();
        onDeleteItem(selectedItemId);
        onSelectItem(null);
      }
      if (e.key === "Escape" && selectedItemId) {
        onSelectItem(null);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedItemId, onDeleteItem, onSelectItem]);

  // Compute which items are inside which groups
  const groupChildCounts = useMemo(() => {
    const groups = items.filter(i => i.type === "group");
    const nonGroups = items.filter(i => i.type !== "group" && i.type !== "arrow");
    const counts: Record<string, number> = {};
    groups.forEach(g => {
      const gw = g.width || 300;
      const gh = g.height || 200;
      let count = 0;
      nonGroups.forEach(item => {
        if (item.x >= g.x && item.y >= g.y && item.x <= g.x + gw && item.y <= g.y + gh) {
          count++;
        }
      });
      counts[g.id] = count;
    });
    return counts;
  }, [items]);

  const sortedItems = useMemo(() => {
    const sorted = [...items].sort((a, b) => {
      if (a.type === "group" && b.type !== "group" && b.type !== "arrow") return -1;
      if (b.type === "group" && a.type !== "group" && a.type !== "arrow") return 1;
      return a.z_index - b.z_index;
    });
    return sorted;
  }, [items]);

  // Wheel: scroll = pan, Ctrl+scroll = zoom (rAF throttled)
  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const vp = viewportRef.current;
    if (e.ctrlKey || e.metaKey) {
      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return;
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;
      const delta = -e.deltaY * 0.001;
      const newScale = Math.max(0.25, Math.min(2, vp.scale + delta));
      const scaleRatio = newScale / vp.scale;
      scheduleViewportUpdate({
        x: mouseX - (mouseX - vp.x) * scaleRatio,
        y: mouseY - (mouseY - vp.y) * scaleRatio,
        scale: newScale,
      });
    } else {
      scheduleViewportUpdate({
        ...vp,
        x: vp.x - e.deltaX,
        y: vp.y - e.deltaY,
      });
    }
  }, [scheduleViewportUpdate]);

  // Prevent default wheel on the container to avoid page scroll
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const prevent = (e: WheelEvent) => e.preventDefault();
    el.addEventListener("wheel", prevent, { passive: false });
    return () => el.removeEventListener("wheel", prevent);
  }, []);

  // Touch handlers for pinch-zoom and 2-finger pan
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      const t1 = e.touches[0];
      const t2 = e.touches[1];
      const dist = Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY);
      const midX = (t1.clientX + t2.clientX) / 2;
      const midY = (t1.clientY + t2.clientY) / 2;
      touchRef.current = { dist, midX, midY, vp: { ...viewport } };
    }
  }, [viewport]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 2 && touchRef.current) {
      e.preventDefault();
      const t1 = e.touches[0];
      const t2 = e.touches[1];
      const dist = Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY);
      const midX = (t1.clientX + t2.clientX) / 2;
      const midY = (t1.clientY + t2.clientY) / 2;
      const ref = touchRef.current;
      const scaleRatio = dist / ref.dist;
      const newScale = Math.max(0.25, Math.min(2, ref.vp.scale * scaleRatio));
      const ratio = newScale / ref.vp.scale;
      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return;
      const originX = ref.midX - rect.left;
      const originY = ref.midY - rect.top;
      const panDx = midX - ref.midX;
      const panDy = midY - ref.midY;
      scheduleViewportUpdate({
        x: originX - (originX - ref.vp.x) * ratio + panDx,
        y: originY - (originY - ref.vp.y) * ratio + panDy,
        scale: newScale,
      });
    }
  }, [scheduleViewportUpdate]);

  const handleTouchEnd = useCallback(() => {
    touchRef.current = null;
  }, []);

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    if (e.target === containerRef.current || (e.target as HTMLElement).dataset.canvas === "true") {
      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return;
      const canvasX = (e.clientX - rect.left - viewport.x) / viewport.scale;
      const canvasY = (e.clientY - rect.top - viewport.y) / viewport.scale;

      if (mode === "sticky") { onAddSticky(canvasX, canvasY); return; }
      if (mode === "group") { onAddGroup(canvasX, canvasY); return; }
      if (mode === "icon") { onAddIcon(canvasX, canvasY); return; }
      if (mode === "text") { onAddText(canvasX, canvasY); return; }

      setIsPanning(true);
      setPanStart({ x: e.clientX - viewport.x, y: e.clientY - viewport.y });
      onSelectItem(null);
      containerRef.current?.setPointerCapture(e.pointerId);
    }
  }, [mode, viewport, onAddSticky, onAddGroup, onAddIcon, onAddText, onSelectItem]);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    // Check drag intent threshold before starting item drag
    if (dragIntentRef.current && !dragIntentRef.current.captured) {
      const di = dragIntentRef.current;
      const dist = Math.hypot(e.clientX - di.startX, e.clientY - di.startY);
      if (dist > 5) {
        // Threshold exceeded — start actual drag
        di.captured = true;
        const rect = containerRef.current?.getBoundingClientRect();
        if (rect) {
          const vp = viewportRef.current;
          const canvasX = (di.startX - rect.left - vp.x) / vp.scale;
          const canvasY = (di.startY - rect.top - vp.y) / vp.scale;
          setDragOffset({ x: canvasX - di.item.x, y: canvasY - di.item.y });
          setDraggingItem(di.itemId);
          onBringToFront(di.itemId);
          containerRef.current?.setPointerCapture(di.pointerId);
        }
      }
      return;
    }

    if (isPanning) {
      const vp = viewportRef.current;
      scheduleViewportUpdate({ ...vp, x: e.clientX - panStart.x, y: e.clientY - panStart.y });
    } else if (draggingItem) {
      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return;
      const vp = viewportRef.current;
      const canvasX = (e.clientX - rect.left - vp.x) / vp.scale - dragOffset.x;
      const canvasY = (e.clientY - rect.top - vp.y) / vp.scale - dragOffset.y;
      onUpdatePosition(draggingItem, snapValue(canvasX, snapToGrid), snapValue(canvasY, snapToGrid));
    }
  }, [isPanning, panStart, scheduleViewportUpdate, draggingItem, dragOffset, onUpdatePosition, snapToGrid, onBringToFront]);

  const handlePointerUp = useCallback(() => {
    // If drag intent was never captured, it was a click — let it pass through
    dragIntentRef.current = null;

    if (draggingItem) {
      const draggedItem = items.find(i => i.id === draggingItem);
      if (draggedItem && draggedItem.type !== "group" && draggedItem.type !== "arrow") {
        const groups = items.filter(i => i.type === "group");
        for (const g of groups) {
          const gw = g.width || 300;
          const gh = g.height || 200;
          if (draggedItem.x >= g.x && draggedItem.y >= g.y &&
              draggedItem.x <= g.x + gw && draggedItem.y <= g.y + gh) {
            onUpdateContent(draggingItem, { parent_group_id: g.id });
            break;
          }
        }
      }
    }
    setIsPanning(false);
    setDraggingItem(null);
  }, [draggingItem, items, onUpdateContent]);

  // Fix #2: capture on containerRef instead of e.target
  const handleItemDragStart = useCallback((itemId: string, e: React.PointerEvent, item: CanvasItem) => {
    if (mode === "arrow") { onArrowClick(itemId); return; }
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const canvasX = (e.clientX - rect.left - viewport.x) / viewport.scale;
    const canvasY = (e.clientY - rect.top - viewport.y) / viewport.scale;
    setDragOffset({ x: canvasX - item.x, y: canvasY - item.y });
    setDraggingItem(itemId);
    onBringToFront(itemId);
    onSelectItem(itemId);
    containerRef.current?.setPointerCapture(e.pointerId);
  }, [mode, viewport, onBringToFront, onSelectItem, onArrowClick]);

  const getCardData = (cardId: string | null) => cardId ? cards.find(c => c.id === cardId) || null : null;
  const getPillarData = (pillarId: string) => pillars.find(p => p.id === pillarId) || null;

  const arrows = sortedItems.filter(item => item.type === "arrow");
  const nonArrows = sortedItems.filter(item => item.type !== "arrow");

  const cursorStyle = isPanning ? "grabbing" : ["sticky", "group", "icon", "text"].includes(mode) ? "crosshair" : "grab";

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full overflow-hidden bg-muted/30"
      style={{ cursor: cursorStyle, touchAction: "none" }}
      onWheel={handleWheel}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      data-canvas="true"
    >
      {/* Grid */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: `radial-gradient(circle, hsl(var(--border)) 1px, transparent 1px)`,
          backgroundSize: `${GRID_SIZE * viewport.scale}px ${GRID_SIZE * viewport.scale}px`,
          backgroundPosition: `${viewport.x}px ${viewport.y}px`,
          opacity: 0.5,
        }}
        data-canvas="true"
      />

      <div
        className="absolute origin-top-left"
        style={{ transform: `translate(${viewport.x}px, ${viewport.y}px) scale(${viewport.scale})` }}
        data-canvas="true"
      >
        {/* Arrows — Fix #10: width/height 0 with overflow visible */}
        <svg className="absolute top-0 left-0 pointer-events-none" style={{ width: 0, height: 0, overflow: "visible" }}>
          {arrows.map(arrow => {
            const fromItem = items.find(i => i.id === arrow.from_item_id);
            const toItem = items.find(i => i.id === arrow.to_item_id);
            if (!fromItem || !toItem) return null;
            return (
              <CanvasArrow
                key={arrow.id}
                fromX={fromItem.x + (fromItem.width || 240) / 2}
                fromY={fromItem.y + 60}
                toX={toItem.x + (toItem.width || 240) / 2}
                toY={toItem.y}
                isSelected={selectedItemId === arrow.id}
                onClick={() => onSelectItem(arrow.id)}
                style={(arrow.content?.arrow_style as string) || "solid"}
                color={(arrow.content?.arrow_color as string) || "default"}
              />
            );
          })}
        </svg>

        {/* Arrow toolbar when arrow is selected */}
        {arrows.map(arrow => {
          if (selectedItemId !== arrow.id) return null;
          const fromItem = items.find(i => i.id === arrow.from_item_id);
          const toItem = items.find(i => i.id === arrow.to_item_id);
          if (!fromItem || !toItem) return null;
          const midX = (fromItem.x + (fromItem.width || 240) / 2 + toItem.x + (toItem.width || 240) / 2) / 2;
          const midY = (fromItem.y + 60 + toItem.y) / 2;
          return (
            <ArrowToolbar
              key={`toolbar-${arrow.id}`}
              item={arrow}
              onUpdateContent={(content) => onUpdateContent(arrow.id, content)}
              onDelete={() => onDeleteItem(arrow.id)}
              position={{ x: midX, y: midY }}
              scale={viewport.scale}
            />
          );
        })}

        {/* Items */}
        {nonArrows.map(item => {
          const isSelected = selectedItemId === item.id;
          const isDragging = draggingItem === item.id;
          const profile = profiles[item.created_by];

          if (item.type === "card") {
            const card = getCardData(item.card_id);
            if (!card) return null;
            const pillar = getPillarData(card.pillar_id);
            return (
              <CanvasCard
                key={item.id} item={item} card={card} pillar={pillar}
                isSelected={isSelected} isDragging={isDragging}
                creatorName={profile?.display_name || ""}
                onPointerDown={(e) => handleItemDragStart(item.id, e, item)}
                onDelete={() => onDeleteItem(item.id)}
                onUpdateContent={(content) => onUpdateContent(item.id, content)}
              />
            );
          }

          if (item.type === "sticky") {
            return (
              <StickyNote
                key={item.id} item={item}
                isSelected={isSelected} isDragging={isDragging}
                creatorName={profile?.display_name || ""}
                onPointerDown={(e) => handleItemDragStart(item.id, e, item)}
                onUpdateContent={(content) => onUpdateContent(item.id, content)}
                onUpdateColor={(color) => onUpdateColor(item.id, color)}
                onDelete={() => onDeleteItem(item.id)}
              />
            );
          }

          if (item.type === "group") {
            return (
              <CanvasGroup
                key={item.id} item={item}
                isSelected={isSelected} isDragging={isDragging}
                childCount={groupChildCounts[item.id] || 0}
                onPointerDown={(e) => handleItemDragStart(item.id, e, item)}
                onUpdateContent={(content) => onUpdateContent(item.id, content)}
                onUpdateSize={(w, h) => onUpdateSize(item.id, w, h)}
                onDelete={() => onDeleteItem(item.id)}
              />
            );
          }

          if (item.type === "icon") {
            return (
              <CanvasIcon
                key={item.id} item={item}
                isSelected={isSelected} isDragging={isDragging}
                onPointerDown={(e) => handleItemDragStart(item.id, e, item)}
                onUpdateContent={(content) => onUpdateContent(item.id, content)}
                onDelete={() => onDeleteItem(item.id)}
              />
            );
          }

          if (item.type === "text") {
            return (
              <CanvasText
                key={item.id} item={item}
                isSelected={isSelected} isDragging={isDragging}
                onPointerDown={(e) => handleItemDragStart(item.id, e, item)}
                onUpdateContent={(content) => onUpdateContent(item.id, content)}
                onDelete={() => onDeleteItem(item.id)}
              />
            );
          }

          return null;
        })}

        {/* Fix #1: Arrow indicator removed from here — it's already in WorkshopRoom */}
      </div>
    </div>
  );
}
